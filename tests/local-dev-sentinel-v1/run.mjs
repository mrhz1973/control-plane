#!/usr/bin/env node
/**
 * #109 local-dev-sentinel-v1 focused tests (deterministic offline).
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  evaluateStall,
  STALL_RULES,
  loadNotifyLedger,
  saveNotifyLedgerAtomic,
  alreadySent,
} from "../../tools/local-dev-terminal-notifier-v1.mjs";
import {
  observeSentinel,
  loadSentinelState,
  saveSentinelStateAtomic,
  projectSentinelHealth,
  appendTickObservation,
  WF90_STALE_DETECTION_MODE,
  DISPATCHER_UNAVAILABLE_COVERAGE,
  SENTINEL_STATE_SCHEMA,
} from "../../tools/local-dev-sentinel-v1.mjs";

const NOW = "2026-09-20T23:30:00.000Z";
const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, pass: true });
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    results.push({ name, pass: false });
    process.stdout.write(`FAIL ${name}: ${err?.message || err}\n`);
  }
}
function tmp() {
  return mkdtempSync(join(tmpdir(), "sentinel-109-"));
}

await test("A eligible_count=0 + IDLE → NORMAL", async () => {
  const dir = tmp();
  try {
    const statePath = join(dir, "state.json");
    const r = await observeSentinel({
      nowIso: NOW,
      classification: "IDLE_CLEAN",
      queueEligibleCount: 0,
      candidateTaskRef: null,
      claimed: false,
      active: false,
      lastTickAt: NOW,
      statePath,
      notify: false,
    });
    assert.equal(r.health, "NORMAL");
    assert.equal(r.stall.stalled, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("B Qwen autostop idle → NORMAL", async () => {
  const idle = evaluateStall({
    queueEligibleCount: 0, candidateTaskRef: null, active: false, phase: "TERMINAL",
    wf90IntervalSeconds: 120, lastTickAt: NOW, nowIso: NOW, tickHistory: [],
  });
  assert.equal(idle.stalled, false);
});

await test("C same READY for 4 ticks → NORMAL", async () => {
  const hist = Array.from({ length: 4 }, () => ({
    classification: "IDLE_CLEAN", candidateTaskRef: "LOCAL_DEV_B_D-READY", claimed: false,
  }));
  const s = evaluateStall({
    queueEligibleCount: 1, candidateTaskRef: "LOCAL_DEV_B_D-READY", active: false,
    wf90IntervalSeconds: 120, lastTickAt: NOW, nowIso: NOW, tickHistory: hist,
  });
  assert.equal(s.stalled, false);
});

await test("D same READY 5th idle no-claim → STALLED ELIGIBLE_READY_NO_CLAIM", async () => {
  const hist = Array.from({ length: STALL_RULES.eligible_ready_no_claim_ticks }, () => ({
    classification: "IDLE_CLEAN", candidateTaskRef: "LOCAL_DEV_B_D-READY", claimed: false,
  }));
  const s = evaluateStall({
    queueEligibleCount: 1, candidateTaskRef: "LOCAL_DEV_B_D-READY", active: false,
    wf90IntervalSeconds: 120, lastTickAt: NOW, nowIso: NOW, tickHistory: hist,
  });
  assert.equal(s.stalled, true);
  assert.equal(s.reason, "ELIGIBLE_READY_NO_CLAIM");
});

await test("E candidate changes before 5 → no STALL", async () => {
  const hist = [
    ...Array.from({ length: 3 }, () => ({ classification: "IDLE_CLEAN", candidateTaskRef: "A", claimed: false })),
    ...Array.from({ length: 2 }, () => ({ classification: "IDLE_CLEAN", candidateTaskRef: "B", claimed: false })),
  ];
  const s = evaluateStall({
    queueEligibleCount: 1, candidateTaskRef: "B", active: false,
    wf90IntervalSeconds: 120, lastTickAt: NOW, nowIso: NOW, tickHistory: hist,
  });
  assert.equal(s.stalled, false);
});

await test("F CLAIM_ALREADY_EXISTS → no false STALL", () => {
  const s = evaluateStall({
    queueEligibleCount: 0, candidateTaskRef: "LOCAL_DEV_B_D-CLAIMED", active: false,
    wf90IntervalSeconds: 120, lastTickAt: NOW, nowIso: NOW,
    tickHistory: Array.from({ length: 6 }, () => ({
      classification: "IDLE_CLEAN", candidateTaskRef: "LOCAL_DEV_B_D-CLAIMED", claimed: true,
    })),
  });
  assert.equal(s.stalled, false);
});

await test("G active inside timebox → NORMAL", () => {
  const s = evaluateStall({
    active: true, phase: "EXECUTING", activeSince: "2026-09-20T23:00:00.000Z", nowIso: "2026-09-20T23:10:00.000Z",
    executorTimeboxSeconds: 1800, wf90IntervalSeconds: 120, lastTickAt: NOW, tickHistory: [],
  });
  assert.equal(s.stalled, false);
});

await test("H active > 1.5 × timebox → ACTIVE_PHASE_OVERRUN", () => {
  const s = evaluateStall({
    active: true, phase: "EXECUTING", activeSince: "2026-09-20T22:00:00.000Z", nowIso: "2026-09-20T23:10:00.000Z",
    executorTimeboxSeconds: 1800, wf90IntervalSeconds: 120, lastTickAt: NOW, tickHistory: [], taskRef: "T-OVERRUN",
  });
  assert.equal(s.stalled, true);
  assert.equal(s.reason, "ACTIVE_PHASE_OVERRUN");
});

await test("I same STALL repeated → one Telegram only", async () => {
  const dir = tmp();
  try {
    const statePath = join(dir, "state.json");
    const ledgerPath = join(dir, "ledger.json");
    saveNotifyLedgerAtomic({ schema_version: "local-dev-terminal-notify-ledger-v1", sent: [] }, ledgerPath);
    const hist = Array.from({ length: 5 }, () => ({
      classification: "IDLE_CLEAN", candidateTaskRef: "LOCAL_DEV_B_D-READY", claimed: false,
    }));
    // seed history
    const seeded = loadSentinelState(statePath).state;
    seeded.tick_history = hist;
    saveSentinelStateAtomic(seeded, statePath);
    const sent = [];
    const fakeFetch = async () => { sent.push(1); return { ok: true, status: 200 }; };
    const transport = { ok: true, token: "x".repeat(40), chatId: "1" };
    const common = {
      nowIso: NOW,
      classification: "IDLE_CLEAN",
      queueEligibleCount: 1,
      candidateTaskRef: "LOCAL_DEV_B_D-READY",
      claimed: false,
      active: false,
      lastTickAt: NOW,
      statePath,
      ledgerPath,
      transport,
      fetchImpl: fakeFetch,
      loadLedger: () => loadNotifyLedger(ledgerPath),
      saveLedger: (l) => saveNotifyLedgerAtomic(l, ledgerPath),
    };
    const r1 = await observeSentinel(common);
    assert.equal(r1.health, "STALLED");
    assert.equal(sent.length, 1);
    const r2 = await observeSentinel({ ...common, nowIso: "2026-09-20T23:32:00.000Z" });
    assert.equal(r2.health, "STALLED");
    assert.equal(sent.length, 1, "exact-once STALL telegram");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("J recovery → NORMAL + at most one RECOVERED", async () => {
  const dir = tmp();
  try {
    const statePath = join(dir, "state.json");
    const ledgerPath = join(dir, "ledger.json");
    saveNotifyLedgerAtomic({ schema_version: "local-dev-terminal-notify-ledger-v1", sent: [] }, ledgerPath);
    const hist = Array.from({ length: 5 }, () => ({
      classification: "IDLE_CLEAN", candidateTaskRef: "LOCAL_DEV_B_D-READY", claimed: false,
    }));
    const seeded = loadSentinelState(statePath).state;
    seeded.tick_history = hist;
    saveSentinelStateAtomic(seeded, statePath);
    const sentTexts = [];
    const fakeFetch = async (_url, opts) => {
      const body = JSON.parse(opts.body);
      sentTexts.push(body.text);
      return { ok: true, status: 200 };
    };
    const transport = { ok: true, token: "x".repeat(40), chatId: "1" };
    await observeSentinel({
      nowIso: NOW, classification: "IDLE_CLEAN", queueEligibleCount: 1,
      candidateTaskRef: "LOCAL_DEV_B_D-READY", claimed: false, active: false, lastTickAt: NOW,
      statePath, ledgerPath, transport, fetchImpl: fakeFetch,
      loadLedger: () => loadNotifyLedger(ledgerPath),
      saveLedger: (l) => saveNotifyLedgerAtomic(l, ledgerPath),
    });
    assert.equal(sentTexts.some((t) => t.startsWith("CONTROL PLANE - STALL")), true);
    const recovered = await observeSentinel({
      nowIso: "2026-09-20T23:34:00.000Z", classification: "IDLE_CLEAN",
      queueEligibleCount: 0, candidateTaskRef: null, claimed: false, active: false, lastTickAt: NOW,
      statePath, ledgerPath, transport, fetchImpl: fakeFetch,
      loadLedger: () => loadNotifyLedger(ledgerPath),
      saveLedger: (l) => saveNotifyLedgerAtomic(l, ledgerPath),
    });
    assert.equal(recovered.health, "NORMAL");
    assert.equal(sentTexts.filter((t) => t.startsWith("CONTROL PLANE - RECOVERED")).length, 1);
    await observeSentinel({
      nowIso: "2026-09-20T23:36:00.000Z", classification: "IDLE_CLEAN",
      queueEligibleCount: 0, candidateTaskRef: null, claimed: false, active: false, lastTickAt: NOW,
      statePath, ledgerPath, transport, fetchImpl: fakeFetch,
      loadLedger: () => loadNotifyLedger(ledgerPath),
      saveLedger: (l) => saveNotifyLedgerAtomic(l, ledgerPath),
    });
    assert.equal(sentTexts.filter((t) => t.startsWith("CONTROL PLANE - RECOVERED")).length, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("K WF90 fresh → no stale", () => {
  const s = evaluateStall({
    queueEligibleCount: 0, candidateTaskRef: null, active: false,
    wf90IntervalSeconds: 120, lastTickAt: "2026-09-20T23:28:00.000Z", nowIso: NOW, tickHistory: [],
  });
  assert.equal(s.stalled, false);
});

await test("L WF90 >3× interval → WF90_TICK_STALE", () => {
  assert.equal(WF90_STALE_DETECTION_MODE, "NEXT_OBSERVABLE_EVENT");
  const s = evaluateStall({
    queueEligibleCount: 0, candidateTaskRef: null, active: false,
    wf90IntervalSeconds: 120, lastTickAt: "2026-09-20T23:00:00.000Z", nowIso: NOW, tickHistory: [],
  });
  assert.equal(s.stalled, true);
  assert.equal(s.reason, "WF90_TICK_STALE");
});

await test("M malformed sentinel state → fail closed / no storm", async () => {
  const dir = tmp();
  try {
    const statePath = join(dir, "state.json");
    writeFileSync(statePath, "{not-json", "utf8");
    const sent = [];
    const r = await observeSentinel({
      nowIso: NOW, classification: "IDLE_CLEAN", queueEligibleCount: 1,
      candidateTaskRef: "X", claimed: false, active: false, lastTickAt: NOW,
      statePath, notify: true,
      transport: { ok: true, token: "x".repeat(40), chatId: "1" },
      fetchImpl: async () => { sent.push(1); return { ok: true, status: 200 }; },
    });
    assert.equal(r.state_load_ok, false);
    assert.equal(r.health, "DEGRADED");
    assert.equal(sent.length, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("N restart with persisted STALL → no duplicate Telegram", async () => {
  const dir = tmp();
  try {
    const statePath = join(dir, "state.json");
    const ledgerPath = join(dir, "ledger.json");
    const hist = Array.from({ length: 5 }, () => ({
      classification: "IDLE_CLEAN", candidateTaskRef: "LOCAL_DEV_B_D-READY", claimed: false,
    }));
    const seeded = loadSentinelState(statePath).state;
    seeded.tick_history = hist;
    saveSentinelStateAtomic(seeded, statePath);
    saveNotifyLedgerAtomic({ schema_version: "local-dev-terminal-notify-ledger-v1", sent: [] }, ledgerPath);
    const sent = [];
    const fakeFetch = async () => { sent.push(1); return { ok: true, status: 200 }; };
    const transport = { ok: true, token: "x".repeat(40), chatId: "1" };
    const opts = {
      nowIso: NOW, classification: "IDLE_CLEAN", queueEligibleCount: 1,
      candidateTaskRef: "LOCAL_DEV_B_D-READY", claimed: false, active: false, lastTickAt: NOW,
      statePath, ledgerPath, transport, fetchImpl: fakeFetch,
      loadLedger: () => loadNotifyLedger(ledgerPath),
      saveLedger: (l) => saveNotifyLedgerAtomic(l, ledgerPath),
    };
    await observeSentinel(opts);
    assert.equal(sent.length, 1);
    // simulate restart: fresh process, same durable files
    await observeSentinel({ ...opts, nowIso: "2026-09-20T23:40:00.000Z" });
    assert.equal(sent.length, 1);
    const ledger = loadNotifyLedger(ledgerPath);
    assert.equal(alreadySent(ledger, `stall|ELIGIBLE_READY_NO_CLAIM|LOCAL_DEV_B_D-READY|g1`), true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("O SERVICE_ERROR / HUMAN_GATE precedence", () => {
  assert.equal(projectSentinelHealth({ stalled: true, stallReason: "X", classification: "SERVICE_ERROR" }).health, "ERROR");
  assert.equal(projectSentinelHealth({ stalled: true, stallReason: "X", humanGateRequired: true }).health, "HUMAN_GATE");
  assert.equal(projectSentinelHealth({ stalled: true, stallReason: "ELIGIBLE_READY_NO_CLAIM" }).health, "STALLED");
  assert.equal(DISPATCHER_UNAVAILABLE_COVERAGE, "SERVICE_ERROR_EXISTING_PATH");
});

await test("state schema bounded + append history", () => {
  const st = loadSentinelState(join(tmp(), "missing.json")).state;
  assert.equal(st.schema_version, SENTINEL_STATE_SCHEMA);
  for (let i = 0; i < 20; i++) appendTickObservation(st, { recorded_at: NOW, classification: "IDLE_CLEAN", candidateTaskRef: "T", eligible_count: 1, claimed: false });
  assert.ok(st.tick_history.length <= 16);
});

const failed = results.filter((r) => !r.pass).length;
console.log(JSON.stringify({ ok: failed === 0, passed: results.length - failed, failed, total: results.length }));
process.exitCode = failed ? 1 : 0;
