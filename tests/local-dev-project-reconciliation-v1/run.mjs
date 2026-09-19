/**
 * #110 — focused deterministic suite for the post-terminal project
 * reconciliation loop + terminal notifications + stall sentinel.
 * Covers the mandatory test matrix A–L. No network, no git mutation.
 *
 * Run: node tests/local-dev-project-reconciliation-v1/run.mjs
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  reconciliationKey, stableReconDigits, isReconcilerTaskRef,
  loadReconciliationStore, saveReconciliationStoreAtomic,
  parseBacklogState, decideNext,
  buildReconcilerReadyMarkdown, buildSuccessorReadyMarkdown,
  reconcileTerminalPass, reconcileReconcilerTerminal, reconcileTerminalStop,
  detectUnreconciledTerminalPass, PROJECT_CANON,
} from "../../tools/local-dev-project-reconciliation-v1.mjs";
import {
  loadNotifyLedger, saveNotifyLedgerAtomic, alreadySent, markSent,
  dispatchNotifications, evaluateStall, STALL_RULES,
} from "../../tools/local-dev-terminal-notifier-v1.mjs";
import { parseBacklogFile, isAdmissible, selectNextQueueItem } from "../../tools/select-local-dev-queue-item-v1.mjs";
import { buildLocalDevEnvelopeFromBacklog } from "../../tools/bridge-backlog-to-local-dev-envelope-v1.mjs";

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    failures.push(name);
    process.stdout.write(`FAIL ${name}: ${err?.message || err}\n`);
  }
}

const NOW = "2026-09-19T23:30:00.000Z";
const REPO = "mrhz1973/tmar-tts";
const F001R_TASK = "LOCAL_DEV_B_D-0103-F001R";
const F001R_COMMIT = "fe5966062f6eee37b19a5f70c325d9b644274701";

function tmp() { return mkdtempSync(join(tmpdir(), "recon110-")); }

function stateWithNext(items) {
  return JSON.stringify({ schema: "tmar-backlog-state-v1", generated_at: NOW, reconciled_for: F001R_TASK, items });
}

const F002_PAYLOAD = {
  ready_id: "D-0103-F002",
  title: "TMAR TTS F002 tts-engine-contracts",
  objective: "Implement generic TTS request/result, capabilities and load/unload lifecycle per docs/architecture.md F001 contract.",
  allowed_areas: ["tmar/core/contracts.py", "tests/test_contracts.py", "docs/current-state.md", "docs/decisions.md"],
  forbidden_areas: ["*.py"],
  risk_hint: "low",
  complexity_hint: "medium",
  acceptance: ["contracts module exists with TTSEngine protocol", "focused mock tests pass", "git diff --check passes"],
  test_commands: ["powershell.exe -NoProfile -Command \"if (-not (Test-Path tmar\\core\\contracts.py)) { exit 1 }; git diff --check\""],
  timebox_hint: 3600,
  max_turns_hint: 16,
  context_refs: ["github:mrhz1973/control-plane#103"],
};

await test("A. terminal PASS produces exactly ONE reconciliation record + ONE reconciler READY", () => {
  const dir = tmp();
  try {
    const store = loadReconciliationStore(join(dir, "store.json"));
    const r = reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 845000, nowIso: NOW });
    assert.equal(r.action, "RECONCILER_QUEUED");
    assert.equal(store.records.length, 1);
    assert.ok(r.record.reconciler_ready_id);
    assert.ok(isReconcilerTaskRef(r.record.reconciler_task_ref));
    // exactly ONE ready file published
    const files = readdirOf(dir).filter((f) => f.endsWith(".md"));
    assert.equal(files.length, 1);
    // the published item is selector-eligible + bridge-consumable
    const md = readFileSync(join(dir, files[0]), "utf8");
    const parsed = parseBacklogFile(md);
    assert.equal(parsed.ok, true, parsed.reason);
    assert.equal(parsed.item.created_by, "gpt-web");
    assert.ok(/^D-\d+-RECON$/.test(parsed.item.id), parsed.item.id);
    assert.equal(parsed.item.repository, REPO);
    assert.equal(isAdmissible(parsed.item), true);
    const br = buildLocalDevEnvelopeFromBacklog({
      markdown: md, repo: "mrhz1973/control-plane", commit: "a".repeat(40),
      path: `reports/runtime/dev-queue/always-on/${files[0]}`,
      dispatchBaseHead: "b".repeat(40), now: new Date(NOW),
    });
    assert.equal(br.ok, true, JSON.stringify(br.reason_codes));
    // PASS notification exactly one, correct content
    assert.equal(r.notifications.length, 1);
    assert.match(r.notifications[0].text, /TASK PASS/);
    assert.match(r.notifications[0].text, /reconciliation queued/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("B. same terminal event observed twice → zero duplicates (idempotent)", async () => {
  const dir = tmp();
  try {
    const store = loadReconciliationStore(join(dir, "store.json"));
    const r1 = reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 1000, nowIso: NOW });
    const r2 = reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 1000, nowIso: "2026-09-19T23:32:00.000Z" });
    assert.equal(store.records.length, 1);
    assert.equal(r2.journalEvents.length, 0, "no duplicate journal events");
    assert.equal(readdirOf(dir).filter((f) => f.endsWith(".md")).length, 1, "no duplicate READY");
    // send not yet CONFIRMED: the PASS notification stays retryable (bounded
    // to the single record) and the notify LEDGER is the dedup authority —
    // a confirmed send (or an already-sent ledger hit) sets the flag once.
    assert.equal(store.records[0].pass_notified_at, null, "flag set only after confirmed send");
    assert.equal(r2.notifications.length, 1, "retryable PASS notification re-proposed until confirmed");
    assert.equal(r2.notifications[0].key, r1.notifications[0].key, "same stable notify key");
    // simulate the dispatcher flow: ledger already has the key →
    // dispatchNotifications returns ALREADY_SENT → onConfirm sets the
    // record flag exactly once → further observations propose nothing.
    const ledgerPath = join(dir, "notify.json");
    const ledger = loadNotifyLedger(ledgerPath);
    markSent(ledger, r2.notifications[0].key, NOW);
    saveNotifyLedgerAtomic(ledger, ledgerPath);
    const rr = await dispatchNotifications({
      requests: r2.notifications, ledger, transport: { ok: false }, nowIso: NOW,
      fetchImpl: undefined, saveLedger: () => {},
      onConfirm: (k, flag) => {
        const rec = store.records.find((x) => x.key === k);
        if (rec && !rec[flag]) rec[flag] = NOW;
      },
    });
    assert.equal(rr.results[0].sent, false);
    assert.equal(rr.results[0].reason, "ALREADY_SENT", "ledger is the dedup authority");
    assert.equal(store.records[0].pass_notified_at, NOW, "flag set by onConfirm on ALREADY_SENT");
    const r2b = reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 1000, nowIso: "2026-09-19T23:33:00.000Z" });
    assert.equal(r2b.notifications.length, 0, "after confirmed send the notification is consumed");
    // crash-after-publication: fresh store (simulating lost store) but file on disk → still no duplicate
    const store2 = loadReconciliationStore(join(dir, "store2.json"));
    const r3 = reconcileTerminalPass({ store: store2, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 1000, nowIso: "2026-09-19T23:34:00.000Z" });
    assert.equal(readdirOf(dir).filter((f) => f.endsWith(".md")).length, 1, "queue-file dedup holds");
    assert.ok(store2.records[0].reconciler_ready_id);
    assert.equal(r3.notifications.length, 1, "PASS notify re-attempted after store loss is bounded to one record");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("C. unique canonical next → exactly ONE successor READY (selector + bridge conforming)", () => {
  const dir = tmp();
  try {
    const store = loadReconciliationStore(join(dir, "store.json"));
    const pass = reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 1000, nowIso: NOW });
    const state = stateWithNext([
      { id: "F001", status: "DONE", depends_on: ["R001"] },
      { id: "F002", status: "NEXT", depends_on: ["F001"], payload: F002_PAYLOAD },
      { id: "F003", status: "READY", depends_on: ["F002"] },
    ]);
    const r = reconcileReconcilerTerminal({
      store, queueDir: dir, repo: REPO, taskRef: pass.record.reconciler_task_ref, nowIso: NOW,
      readBacklogState: () => state,
    });
    assert.equal(r.action, "SUCCESSOR_QUEUED");
    assert.equal(r.successorId, "D-0103-F002");
    const files = readdirOf(dir).filter((f) => f.endsWith(".md"));
    assert.equal(files.length, 2, "reconciler + successor");
    const succMd = readFileSync(join(dir, "READY_D-0103-F002.md"), "utf8");
    const parsed = parseBacklogFile(succMd);
    assert.equal(parsed.ok, true, parsed.reason);
    assert.equal(parsed.item.id, "D-0103-F002");
    assert.equal(parsed.item.created_by, "gpt-web");
    assert.equal(parsed.item.repository, REPO);
    assert.equal(isAdmissible(parsed.item), true);
    assert.deepEqual(parsed.item.scope.allowed_areas, F002_PAYLOAD.allowed_areas);
    assert.equal(parsed.item.local_dev.test_commands.length, 1);
    const br = buildLocalDevEnvelopeFromBacklog({
      markdown: succMd, repo: "mrhz1973/control-plane", commit: "a".repeat(40),
      path: "reports/runtime/dev-queue/always-on/READY_D-0103-F002.md",
      dispatchBaseHead: "b".repeat(40), now: new Date(NOW),
    });
    assert.equal(br.ok, true, JSON.stringify(br.reason_codes));
    // summary notification emitted once
    assert.ok(r.notifications.some((n) => /queued automatically/.test(n.text)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("D. two NEXT candidates without deterministic priority → HUMAN_GATE, zero READY successor", () => {
  const dir = tmp();
  try {
    const store = loadReconciliationStore(join(dir, "store.json"));
    const pass = reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 1000, nowIso: NOW });
    const state = stateWithNext([
      { id: "F001", status: "DONE", depends_on: ["R001"] },
      { id: "F002", status: "NEXT", depends_on: ["F001"], payload: F002_PAYLOAD },
      { id: "R004", status: "NEXT", depends_on: [] },
    ]);
    const r = reconcileReconcilerTerminal({
      store, queueDir: dir, repo: REPO, taskRef: pass.record.reconciler_task_ref, nowIso: NOW,
      readBacklogState: () => state,
    });
    assert.equal(r.action, "HUMAN_GATE");
    assert.equal(r.gate.reason, "AMBIGUOUS_CANONICAL_NEXT");
    assert.deepEqual(r.gate.candidates.sort(), ["F002", "R004"]);
    // only the reconciler item exists — no successor published
    assert.equal(readdirOf(dir).filter((f) => f.endsWith(".md")).length, 1);
    assert.ok(r.notifications.some((n) => /HUMAN_GATE/.test(n.text)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("E. no remaining work → PROJECT_IDLE_COMPLETE", () => {
  const dir = tmp();
  try {
    const store = loadReconciliationStore(join(dir, "store.json"));
    const pass = reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 1000, nowIso: NOW });
    const state = stateWithNext([{ id: "F001", status: "DONE", depends_on: [] }]);
    const r = reconcileReconcilerTerminal({
      store, queueDir: dir, repo: REPO, taskRef: pass.record.reconciler_task_ref, nowIso: NOW,
      readBacklogState: () => state,
    });
    assert.equal(r.action, "PROJECT_IDLE_COMPLETE");
    assert.equal(readdirOf(dir).filter((f) => f.endsWith(".md")).length, 1);
    assert.ok(r.journalEvents.some((e) => e.event === "PROJECT_IDLE_COMPLETE"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("F/G. crash boundaries: restart after decision stays decided; after publication no second READY", () => {
  const dir = tmp();
  try {
    const storePath = join(dir, "store.json");
    const store = loadReconciliationStore(storePath);
    const pass = reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 1000, nowIso: NOW });
    saveReconciliationStoreAtomic(store, storePath);
    // crash after project-doc persistence but before READY publication is the
    // reconciler's own boundary; here we prove the dispatcher side: crash
    // AFTER successor publication → reload → re-observe same reconciler
    // terminal → no second READY, decision stable.
    const r1 = reconcileReconcilerTerminal({
      store, queueDir: dir, repo: REPO, taskRef: pass.record.reconciler_task_ref, nowIso: NOW,
      readBacklogState: () => stateWithNext([
        { id: "F001", status: "DONE", depends_on: [] },
        { id: "F002", status: "NEXT", depends_on: ["F001"], payload: F002_PAYLOAD },
      ]),
    });
    assert.equal(r1.action, "SUCCESSOR_QUEUED");
    saveReconciliationStoreAtomic(store, storePath);
    const reloaded = loadReconciliationStore(storePath);
    const r2 = reconcileReconcilerTerminal({
      store: reloaded, queueDir: dir, repo: REPO, taskRef: pass.record.reconciler_task_ref, nowIso: "2026-09-20T00:10:00.000Z",
      readBacklogState: () => stateWithNext([
        { id: "F001", status: "DONE", depends_on: [] },
        { id: "F002", status: "NEXT", depends_on: ["F001"], payload: F002_PAYLOAD },
      ]),
    });
    assert.equal(r2.action, "ALREADY_DECIDED");
    assert.equal(r2.notifications.length, 0);
    assert.equal(readdirOf(dir).filter((f) => f.endsWith(".md")).length, 2);
    // and the store persists exactly one record
    assert.equal(reloaded.records.length, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("H. terminal STOP → reconciliation law: no auto successor, truthful marker, idempotent", () => {
  const dir = tmp();
  try {
    const store = loadReconciliationStore(join(dir, "store.json"));
    const r = reconcileTerminalStop({ store, repo: REPO, taskRef: "LOCAL_DEV_B_D-9501-S", commitSha: "5d71698023dadc7b4504ed78218ca1943118efcc", nowIso: NOW });
    assert.equal(r.action, "STOP_RECORDED_NO_AUTO_SUCCESSOR");
    assert.equal(readdirOf(dir).filter((f) => f.endsWith(".md")).length, 0);
    assert.ok(r.journalEvents.some((e) => e.event === "TERMINAL_STOP_RECORDED"));
    const r2 = reconcileTerminalStop({ store, repo: REPO, taskRef: "LOCAL_DEV_B_D-9501-S", commitSha: "5d71698023dadc7b4504ed78218ca1943118efcc", nowIso: NOW });
    assert.equal(r2.action, "ALREADY_RECORDED");
    assert.equal(store.records.length, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("I/J. PASS notification dedup: one emission; repeated ticks never re-send", async () => {
  const dir = tmp();
  try {
    const ledgerPath = join(dir, "notify.json");
    const ledger = loadNotifyLedger(ledgerPath);
    const sent = [];
    const fakeFetch = async () => { sent.push(1); return { ok: true, status: 200 }; };
    const transport = { ok: true, token: "x".repeat(40), chatId: "12345" };
    const reqs = [{ key: "pass|k1", text: "CONTROL PLANE — TASK PASS\ntask: t1" }];
    const r1 = await dispatchNotifications({ requests: reqs, ledger, transport, nowIso: NOW, fetchImpl: fakeFetch, saveLedger: (l) => saveNotifyLedgerAtomic(l, ledgerPath) });
    assert.equal(r1.results[0].sent, true);
    assert.equal(sent.length, 1);
    const r2 = await dispatchNotifications({ requests: reqs, ledger, transport, nowIso: NOW, fetchImpl: fakeFetch, saveLedger: (l) => saveNotifyLedgerAtomic(l, ledgerPath) });
    assert.equal(r2.results[0].sent, false);
    assert.equal(r2.results[0].reason, "ALREADY_SENT");
    assert.equal(sent.length, 1, "no duplicate telegram send");
    // transport failure never marks sent (retry on next observation)
    const bad = await dispatchNotifications({ requests: [{ key: "pass|k2", text: "x" }], ledger, transport: { ok: false }, nowIso: NOW, fetchImpl: fakeFetch, saveLedger: (l) => saveNotifyLedgerAtomic(l, ledgerPath) });
    assert.equal(bad.results[0].sent, false);
    assert.equal(alreadySent(ledger, "pass|k2"), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("K. legitimate IDLE / Qwen autostop → zero false STALL", () => {
  const idle = evaluateStall({
    queueEligibleCount: 0, candidateTaskRef: null, lastTickClassification: "IDLE_CLEAN",
    active: false, phase: "TERMINAL", wf90IntervalSeconds: 120, lastTickAt: NOW, nowIso: NOW,
    tickHistory: Array.from({ length: 8 }, (_, i) => ({ at: i, classification: "IDLE_CLEAN", candidateTaskRef: null, claimed: false })),
  });
  assert.equal(idle.stalled, false);
  const autostop = evaluateStall({
    queueEligibleCount: 0, candidateTaskRef: null, active: false, phase: "TERMINAL",
    wf90IntervalSeconds: 120, lastTickAt: NOW, nowIso: NOW, tickHistory: [],
  });
  assert.equal(autostop.stalled, false);
  // claimed-blocked candidates (CLAIM_ALREADY_EXISTS) are not stalls either
  const blocked = evaluateStall({
    queueEligibleCount: 0, candidateTaskRef: "LOCAL_DEV_B_D-XXXX", active: false, phase: "TERMINAL",
    wf90IntervalSeconds: 120, lastTickAt: NOW, nowIso: NOW,
    tickHistory: Array.from({ length: 6 }, () => ({ classification: "IDLE_CLEAN", candidateTaskRef: "LOCAL_DEV_B_D-XXXX", claimed: false })),
  });
  assert.equal(blocked.stalled, false);
});

await test("L. real no-progress fixtures → deterministic STALL", () => {
  // eligible READY unchanged across N ticks with no claim
  const hist = Array.from({ length: STALL_RULES.eligible_ready_no_claim_ticks }, () => ({ classification: "IDLE_CLEAN", candidateTaskRef: "LOCAL_DEV_B_D-0200-F009", claimed: false }));
  const s1 = evaluateStall({
    queueEligibleCount: 1, candidateTaskRef: "LOCAL_DEV_B_D-0200-F009", active: false, phase: "TERMINAL",
    wf90IntervalSeconds: 120, lastTickAt: NOW, nowIso: NOW, tickHistory: hist,
  });
  assert.equal(s1.stalled, true);
  assert.equal(s1.reason, "ELIGIBLE_READY_NO_CLAIM");
  // WF90 stale beyond 3x interval while idle
  const s2 = evaluateStall({
    queueEligibleCount: 0, candidateTaskRef: null, active: false, phase: "TERMINAL",
    wf90IntervalSeconds: 120, lastTickAt: "2026-09-19T22:00:00Z", nowIso: "2026-09-19T23:00:00Z", tickHistory: [],
  });
  assert.equal(s2.stalled, true);
  assert.equal(s2.reason, "WF90_TICK_STALE");
  // active phase overrun beyond 1.5x timebox
  const s3 = evaluateStall({
    active: true, phase: "EXECUTING", activeSince: "2026-09-19T22:00:00Z", nowIso: "2026-09-19T23:10:00Z",
    executorTimeboxSeconds: 1800, wf90IntervalSeconds: 120, lastTickAt: NOW, tickHistory: [],
  });
  assert.equal(s3.stalled, true);
  assert.equal(s3.reason, "ACTIVE_PHASE_OVERRUN");
  // active execution spanning several WF90 intervals but WITHIN timebox is NOT a stall
  const ok3 = evaluateStall({
    active: true, phase: "EXECUTING", activeSince: "2026-09-19T22:58:00Z", nowIso: "2026-09-19T23:02:00Z",
    executorTimeboxSeconds: 1800, wf90IntervalSeconds: 120, lastTickAt: "2026-09-19T22:58:00Z", tickHistory: [],
  });
  assert.equal(ok3.stalled, false);
});

await test("backlog-state validation: schema/status/dependency laws", () => {
  assert.equal(parseBacklogState("not json").ok, false);
  assert.equal(parseBacklogState('{"schema":"other"}').ok, false);
  const badDup = parseBacklogState(stateWithNext([
    { id: "F001", status: "DONE", depends_on: [] },
    { id: "F001", status: "NEXT", depends_on: [] },
  ]));
  assert.equal(badDup.ok, false);
  const badStatus = parseBacklogState(stateWithNext([{ id: "F001", status: "WEIRD", depends_on: [] }]));
  assert.equal(badStatus.ok, false);
  const okState = parseBacklogState(stateWithNext([
    { id: "F001", status: "DONE", depends_on: [] },
    { id: "F002", status: "NEXT", depends_on: ["F001"], payload: F002_PAYLOAD },
  ]));
  assert.equal(okState.ok, true);
  // NEXT with unsatisfied dependency → HUMAN_GATE, never silent promotion
  const dep = decideNext(okState.state);
  assert.equal(dep.kind, "PUBLISH");
  const unmet = decideNext(parseBacklogState(stateWithNext([{ id: "F001", status: "DONE", depends_on: [] }, { id: "F002", status: "NEXT", depends_on: ["F009"] }])).state);
  assert.equal(unmet.kind, "HUMAN_GATE");
  assert.equal(unmet.reason, "NEXT_DEPENDENCIES_NOT_SATISFIED");
});

await test("successor builder rejects non-conforming payloads (fail-closed)", () => {
  assert.equal(buildSuccessorReadyMarkdown({ repo: REPO, payload: { ...F002_PAYLOAD, ready_id: "BAD ID" }, nowIso: NOW }).ok, false);
  assert.equal(buildSuccessorReadyMarkdown({ repo: REPO, payload: { ...F002_PAYLOAD, test_commands: ["a", "b"] }, nowIso: NOW }).ok, false);
  const bang = buildSuccessorReadyMarkdown({ repo: REPO, payload: { ...F002_PAYLOAD, test_commands: ["node -e \"if(!x)exit(1)\""] }, nowIso: NOW });
  assert.equal(bang.ok, false);
  assert.equal(bang.reason, "TEST_COMMAND_BANG_UNSAFE");
});

await test("retro-detection: unreconciled terminal PASS found once, reconciler suffix excluded", () => {
  const receipts = [
    { task_ref: "LOCAL_DEV_B_D-9501-S", state: "STOP", source_ref: `github:${REPO}@5d71698:reports/runtime/dev-queue/always-on/READY_D9501S.md`, claimed_at: "2026-09-18T09:00:39.780Z" },
    { task_ref: F001R_TASK, state: "PASS", source_ref: `github:${REPO}@40813b9:reports/runtime/dev-queue/always-on/READY_D0103F001R.md`, claimed_at: "2026-09-19T21:36:40.481Z" },
    { task_ref: "LOCAL_DEV_B_D-123456-RECON", state: "PASS", source_ref: `github:${REPO}@aa:reports/runtime/dev-queue/always-on/READY_x.md`, claimed_at: "2026-09-19T22:00:00.000Z" },
  ];
  const store = loadReconciliationStore("Z:/missing/store.json");
  const found = detectUnreconciledTerminalPass({ receipts, store, repoCanonMap: undefined });
  assert.equal(found.length, 1);
  assert.equal(found[0].taskRef, F001R_TASK);
  // after recording, detection is empty
  const dir = tmp();
  try {
    reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: null, durationMs: null, nowIso: NOW });
    const again = detectUnreconciledTerminalPass({ receipts, store, repoCanonMap: undefined });
    assert.equal(again.length, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

await test("stable id: same terminal evidence → same reconciler id; different commit → different id", () => {
  const k1 = reconciliationKey({ repo: REPO, taskRef: F001R_TASK, commitSha: F001R_COMMIT });
  const d1 = stableReconDigits(k1);
  assert.ok(d1 >= 100000 && d1 <= 999999);
  const d2 = stableReconDigits(reconciliationKey({ repo: REPO, taskRef: F001R_TASK, commitSha: F001R_COMMIT }));
  assert.equal(d1, d2);
  const d3 = stableReconDigits(reconciliationKey({ repo: REPO, taskRef: F001R_TASK, commitSha: "0".repeat(40) }));
  assert.notEqual(d1, d3);
});

await test("reconciler READY respects target-repo execution semantics (repo=tmar-tts, docs-only)", () => {
  const dir = tmp();
  try {
    const store = loadReconciliationStore(join(dir, "store.json"));
    const r = reconcileTerminalPass({ store, queueDir: dir, repo: REPO, taskRef: F001R_TASK, taskId: "D-0103-F001R", commitSha: F001R_COMMIT, durationMs: 1000, nowIso: NOW });
    const md = readFileSync(join(dir, readdirOf(dir).filter((f) => f.endsWith(".md"))[0]), "utf8");
    const parsed = parseBacklogFile(md);
    // docs-only on the target repo
    assert.deepEqual(parsed.item.scope.allowed_areas, PROJECT_CANON[REPO].reconcilerAllowedAreas);
    assert.ok(parsed.item.scope.forbidden_areas.includes("*.py"));
    // single test command, bang-safe
    assert.equal(parsed.item.local_dev.test_commands.length, 1);
    assert.ok(!/![A-Za-z]/.test(parsed.item.local_dev.test_commands[0]));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

function readdirOf(dir) {
  return readdirSync(dir);
}

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
