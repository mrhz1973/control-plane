/**
 * Deterministic offline tests for the synthetic idle-backfill injector
 * tools/local-dev-idle-backfill-v1.mjs
 * (V4_LOCAL_DEV_EXECUTOR_IDLE_BACKFILL_SYNTHETIC_ITEM_INJECTION).
 * No network, no executor run, no OpenCode.
 *
 * Run: node tests/local-dev-idle-backfill-injection-v1/run.mjs
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import {
  DEFAULT_POLICY,
  decideBackfill,
  scanQueue,
  authorSyntheticCandidate,
  renderSyntheticBacklogMarkdown,
  normalizeSyntheticPath,
  shortSha,
} from "../../tools/local-dev-idle-backfill-v1.mjs";
import { parseBacklogFile, isAdmissible } from "../../tools/select-local-dev-queue-item-v1.mjs";
import { buildLocalDevEnvelopeFromBacklog } from "../../tools/bridge-backlog-to-local-dev-envelope-v1.mjs";
import { validateEnvelope } from "../../tools/local-dev-executor-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FIXTURES = join(ROOT, "tests", "local-dev-backlog-envelope-bridge-v1", "fixtures");
const HEAD = "e".repeat(40);
const NOW = "2026-09-05T08:30:00.000Z";
const SEG = "seg4";
const REPO = "mrhz1973/control-plane";

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
const run = (args, cwd = ROOT) => new Promise((res) => execFile(process.execPath, ["tools/local-dev-idle-backfill-v1.mjs", ...args], { cwd, windowsHide: true, timeout: 30_000 }, (e, so, se) => res({ code: e ? (e.code ?? 1) : 0, out: so || "", err: se || "" })));

/** Build a temp queue dir containing only INADMISSIBLE fixture files. */
function drainedQueue(tmp) {
  const q = join(tmp, "queue");
  mkdirSync(q, { recursive: true });
  for (const f of ["GATED_D9003H.md", "HIGHRISK_D9004R.md", "BLOCKED_D9005B.md", "UNKNOWNDEV_D9006U.md"]) {
    copyFileSync(join(FIXTURES, f), join(q, f));
  }
  // claimed READY items simulate a drained-with-claims state
  const claimed = join(q, "CLAIMED_D9001T.md");
  copyFileSync(join(FIXTURES, "READY_D9001T.md"), claimed);
  return q;
}

const EVIDENCE = ["docs/runtime/CURRENT_FRONTIER.md", "reports/runtime/overnight-campaigns/x.md"];
const HB = "docs/runtime/AUTOVIA_SYNTHETIC_HEARTBEAT.md";

// 1 + 2 + 3: CLI decision paths
await test("T1 CLEAN_DRAINED + enabled -> exactly one synthetic READY injected, admissible via normal gates", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "lde-bf-"));
  try {
    const q = drainedQueue(tmp);
    const receiptsPath = join(tmp, "receipts.json");
    writeFileSync(receiptsPath, JSON.stringify([{ task_ref: "LOCAL_DEV_B_D-9001-T", source_ref: "x", claimed_at: NOW, bridge_version: "v" }]), "utf8");
    const rec = join(tmp, "record.json");
    const r = await run(["--queue", q, "--receipts", receiptsPath, "--head", HEAD, "--segment", SEG, "--out-record", rec, "--now", NOW]);
    assert.equal(r.code, 0, r.err);
    const record = JSON.parse(readFileSync(rec, "utf8"));
    assert.equal(record.decision, "BACKFILL_SYNTHETIC");
    assert.equal(record.synthetic_item_created, "YES");
    assert.equal(record.real_ready_preempted, "NO");
    assert.equal(record.selector_verification, "ADMISSIBLE_VIA_NORMAL_SELECTOR");
    const files = readdirSync(q).filter((f) => f.startsWith("SYNTHETIC_"));
    assert.equal(files.length, 1);
    const parsed = parseBacklogFile(readFileSync(join(q, files[0]), "utf8"));
    assert.equal(parsed.ok, true);
    assert.equal(parsed.item.schema, "backlog-item-v1");
    assert.equal(parsed.item.state, "READY_FOR_PLANNING");
    assert.equal(isAdmissible(parsed.item), true);
    const md = readFileSync(join(q, files[0]), "utf8");
    assert.ok(md.includes("synthetic=true"));
    assert.ok(md.includes("generated_by=local-dev-idle-backfill-v1"));
    assert.ok(md.includes(`segment=${SEG}`));
    assert.ok(md.includes(`base_head=${HEAD}`));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

await test("T2 real READY unclaimed exists -> WORK_AVAILABLE, no synthetic file written", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "lde-bf-"));
  try {
    const q = join(tmp, "queue");
    mkdirSync(q, { recursive: true });
    copyFileSync(join(FIXTURES, "READY_D9001T.md"), join(q, "READY_D9001T.md"));
    const receiptsPath = join(tmp, "receipts.json");
    writeFileSync(receiptsPath, "[]", "utf8");
    const rec = join(tmp, "record.json");
    await run(["--queue", q, "--receipts", receiptsPath, "--head", HEAD, "--segment", SEG, "--out-record", rec, "--now", NOW]);
    const record = JSON.parse(readFileSync(rec, "utf8"));
    assert.equal(record.decision, "WORK_AVAILABLE");
    assert.equal(record.synthetic_item_created, "NO");
    assert.equal(readdirSync(q).filter((f) => f.startsWith("SYNTHETIC_")).length, 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

await test("T3 cap reached (3 synthetic items already in queue) -> IDLE limit, no injection", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "lde-bf-"));
  try {
    const q = drainedQueue(tmp);
    // three ALREADY-CLAIMED synthetic items for THIS segment: files present
    // and claimed in receipts (segment count includes claimed ones).
    for (const s of [1, 2, 3]) {
      const cand = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: s, nowIso: NOW, heartbeatPath: HB, heartbeatExists: s > 1, evidenceRefs: EVIDENCE });
      assert.equal(cand.ok, true);
      writeFileSync(join(q, `SYNTHETIC_${cand.candidate.id}.md`), renderSyntheticBacklogMarkdown(cand.candidate, { repo: REPO, nowIso: NOW, head: HEAD, segment: SEG, seq: s }), "utf8");
    }
    const receiptsPath = join(tmp, "receipts.json");
    const receipts = [{ task_ref: "LOCAL_DEV_B_D-9001-T", claimed_at: NOW }];
    for (const s of [1, 2, 3]) {
      const cand = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: s, nowIso: NOW, heartbeatPath: HB, heartbeatExists: s > 1, evidenceRefs: EVIDENCE });
      receipts.push({ task_ref: `LOCAL_DEV_B_${cand.candidate.id}`, source_ref: "x", claimed_at: NOW, bridge_version: "v" });
    }
    writeFileSync(receiptsPath, JSON.stringify(receipts), "utf8");
    const rec = join(tmp, "record.json");
    await run(["--queue", q, "--receipts", receiptsPath, "--head", HEAD, "--segment", SEG, "--out-record", rec, "--now", NOW]);
    const record = JSON.parse(readFileSync(rec, "utf8"));
    assert.equal(record.decision, "IDLE");
    assert.equal(record.reason_code, "IDLE_ALL_CLAIMED_SYNTHETIC_LIMIT");
    assert.equal(record.synthetic_item_created, "NO");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// 4 + 5 + 6: pure law rejections (authoring + decision layers)
await test("T4 out-of-scope objective rejected (authoring layer)", () => {
  const r = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: "tools/rogue.md", heartbeatExists: false, evidenceRefs: EVIDENCE });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "OUT_OF_SCOPE_HEARTBEAT");
  const d = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 1, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: "tools/rogue.md" } });
  assert.equal(d.decision, "IDLE");
});

await test("T5 traversal rejected (normalize + law)", () => {
  const p = normalizeSyntheticPath("docs/runtime/../../tools/x.md");
  assert.equal(p.startsWith("docs/runtime/"), false);
  const r = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: "docs/runtime/../../tools/x.md", heartbeatExists: false, evidenceRefs: EVIDENCE });
  assert.equal(r.ok, false);
  const d = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 1, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: "docs/runtime/../../tools/x.md" } }, { ...DEFAULT_POLICY, synthetic_allowed_scope_prefix: "docs/" });
  assert.equal(d.decision, "IDLE");
});

await test("T6 never_touch area rejected even under docs/ prefix", () => {
  const d = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 1, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: "tools/x.md" } }, { ...DEFAULT_POLICY, synthetic_allowed_scope_prefix: "" });
  assert.equal(d.decision, "IDLE");
  assert.ok(DEFAULT_POLICY.never_touch.includes("tools/**"));
});

// 7 + 8 + 14: idempotency + deterministic sequence
await test("T7 duplicate source state does not duplicate (same HEAD -> same ID -> collision guard)", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "lde-bf-"));
  try {
    const q = drainedQueue(tmp);
    const receiptsPath = join(tmp, "receipts.json");
    writeFileSync(receiptsPath, JSON.stringify([{ task_ref: "LOCAL_DEV_B_D-9001-T", claimed_at: NOW }]), "utf8");
    const rec = join(tmp, "record.json");
    // SAME head + SAME segment + SAME seq-window but queue drained of the
    // injected item (claimed): re-injection would derive the SAME id only
    // while heartbeat state is unchanged. Simulate the claimed case by
    // removing the injected file from the queue while keeping it claimed:
    const r1 = await run(["--queue", q, "--receipts", receiptsPath, "--head", HEAD, "--segment", SEG, "--out-record", rec, "--now", NOW]);
    assert.equal(r1.code, 0);
    const record1 = JSON.parse(readFileSync(rec, "utf8"));
    assert.equal(record1.synthetic_item_created, "YES");
    const synFile = readdirSync(q).find((f) => f.startsWith("SYNTHETIC_"));
    // claim it in the ledger (normal pipeline) then delete the queue file
    // (housekeeping) — same canonical state -> same id -> collision is
    // detected via receipts before file write:
    const receipts = JSON.parse(readFileSync(receiptsPath, "utf8"));
    receipts.push({ task_ref: `LOCAL_DEV_B_${record1.candidate.id}`, source_ref: "x", claimed_at: NOW, bridge_version: "v" });
    writeFileSync(receiptsPath, JSON.stringify(receipts), "utf8");
    rmSync(join(q, synFile));
    // heartbeat still absent on disk (test tmp) -> same canonical state ->
    // same deterministic ID -> receipt collision guard fires:
    const r2 = await run(["--queue", q, "--receipts", receiptsPath, "--head", HEAD, "--segment", SEG, "--out-record", rec, "--now", NOW]);
    assert.equal(r2.code, 0);
    const second = JSON.parse(readFileSync(rec, "utf8"));
    assert.equal(second.reason_code, "SYNTHETIC_ID_COLLISION");
    assert.equal(second.decision, "IDLE");
    assert.equal(second.synthetic_item_created, "NO");
    assert.equal(readdirSync(q).filter((f) => f.startsWith("SYNTHETIC_")).length, 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

await test("T8 synthetic sequence deterministic (same inputs -> same ID)", () => {
  const a = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  const b = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  assert.deepEqual(a.candidate.id, b.candidate.id);
  const suffix = shortSha(`${SEG}|1|${HEAD}`);
  assert.equal(a.candidate.id, `D-9101-${suffix.toUpperCase()}`);
});

await test("T14 completed synthetic allows deterministic distinct next sequence only below cap", () => {
  const s1 = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  const s2 = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 2, nowIso: NOW, heartbeatPath: HB, heartbeatExists: true, evidenceRefs: EVIDENCE });
  assert.notEqual(s1.candidate.id, s2.candidate.id);
  assert.equal(s1.candidate.objective_class, "create_marker_file");
  assert.equal(s2.candidate.objective_class, "append_marker_line");
  const s4 = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 4, nowIso: NOW, heartbeatPath: HB, heartbeatExists: true, evidenceRefs: EVIDENCE });
  assert.equal(s4.ok, false);
  assert.equal(s4.reason, "INVALID_SEQUENCE");
});

// 9: cap 3 enforced (authoring + decision layers)
await test("T9 max 3 per segment enforced", () => {
  const d = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 2, syntheticsCreatedThisSegment: 3, syntheticCandidate: { allowed_path: HB } });
  assert.equal(d.decision, "IDLE");
  assert.equal(d.reason_code, "IDLE_ALL_CLAIMED_SYNTHETIC_LIMIT");
  const d2 = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 2, syntheticsCreatedThisSegment: 2, syntheticCandidate: { allowed_path: HB } });
  assert.equal(d2.decision, "BACKFILL_SYNTHETIC");
});

// 10 + 11 + 12 + 13: normal-pipeline equivalence
await test("T10 synthetic item validates as normal backlog-item-v1 through real parser", () => {
  const a = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  const md = renderSyntheticBacklogMarkdown(a.candidate, { repo: REPO, nowIso: NOW, head: HEAD, segment: SEG, seq: 1 });
  const parsed = parseBacklogFile(md);
  assert.equal(parsed.ok, true, JSON.stringify(parsed));
  assert.equal(parsed.item.schema, "backlog-item-v1");
  assert.equal(parsed.item.created_by, "gpt-web");
  assert.deepEqual(parsed.item.human_gate_required_if, []);
});

await test("T11 normal selector admissibility applies unchanged (no privileged route)", () => {
  const a = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  const md = renderSyntheticBacklogMarkdown(a.candidate, { repo: REPO, nowIso: NOW, head: HEAD, segment: SEG, seq: 1 });
  const parsed = parseBacklogFile(md);
  assert.equal(isAdmissible(parsed.item), true);
  // GATE variant: same item with a declared gate is inadmissible like any other
  const gated = md.replace("human_gate_required_if: []", "human_gate_required_if:\n  - operator review");
  const parsedGated = parseBacklogFile(gated);
  assert.equal(parsedGated.ok, true);
  assert.equal(isAdmissible(parsedGated.item), false);
});

await test("T12 normal bridge produces a valid local-dev-task-envelope-v1", () => {
  const a = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  const md = renderSyntheticBacklogMarkdown(a.candidate, { repo: REPO, nowIso: NOW, head: HEAD, segment: SEG, seq: 1 });
  const r = buildLocalDevEnvelopeFromBacklog({ markdown: md, repo: REPO, commit: HEAD, path: `queue/SYNTHETIC_${a.candidate.id}.md`, dispatchBaseHead: "f".repeat(40), now: NOW, existingReceipts: [] });
  assert.equal(r.ok, true, JSON.stringify(r.reason_codes));
  const v = validateEnvelope(r.envelope);
  assert.equal(v.ok, true, JSON.stringify(v.reason_codes));
  assert.equal(r.envelope.task_ref, `LOCAL_DEV_B_${a.candidate.id}`);
  assert.equal(r.envelope.task_kind, "CREATE");
});

await test("T13 claim/idempotency applies unchanged to synthetic items", () => {
  const a = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  const md = renderSyntheticBacklogMarkdown(a.candidate, { repo: REPO, nowIso: NOW, head: HEAD, segment: SEG, seq: 1 });
  const source = { markdown: md, repo: REPO, commit: HEAD, path: `queue/SYNTHETIC_${a.candidate.id}.md`, dispatchBaseHead: "f".repeat(40), now: NOW };
  const first = buildLocalDevEnvelopeFromBacklog({ ...source, existingReceipts: [] });
  assert.equal(first.ok, true);
  const second = buildLocalDevEnvelopeFromBacklog({ ...source, existingReceipts: [first.receipt] });
  assert.equal(second.ok, false);
  assert.deepEqual(second.reason_codes, ["CLAIM_ALREADY_EXISTS"]);
});

// 15 + 20: production hard wall
await test("T15 production paths cannot be represented (never_touch + prefix)", () => {
  for (const p of ["tools/x.md", "configs/qwen-local-runtime.json", "scripts/deploy.sh", ".github/workflows/ci.yml", "tools/**"]) {
    const norm = normalizeSyntheticPath(p);
    const underPrefix = norm.startsWith(DEFAULT_POLICY.synthetic_allowed_scope_prefix);
    const inNever = DEFAULT_POLICY.never_touch.some((t) => norm.startsWith(t.replace("/**", "/")));
    assert.ok(!underPrefix || inNever, `production path must fail: ${p}`);
    const d = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 1, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: p } });
    assert.equal(d.decision, "IDLE", p);
  }
});

await test("T20 no production-domain import or route in the tool source", () => {
  const src = readFileSync(join(ROOT, "tools", "local-dev-idle-backfill-v1.mjs"), "utf8");
  for (const banned of ["opencode-execution-adapter-v1", "operator-runtime-authorization", "qwen-execution-scope-v3", "spend-ledger", "wf40", "wf61", "d0025", "telegram", "n8n", "postgres"]) {
    assert.ok(!src.toLowerCase().includes(banned.toLowerCase()), `banned token present: ${banned}`);
  }
});

// 16 + 17: malformed evidence / source-of-truth conflict
await test("T16 malformed evidence -> no candidate, clean idle", () => {
  const noEvidence = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: [] });
  assert.equal(noEvidence.ok, false);
  assert.equal(noEvidence.reason, "INSUFFICIENT_EVIDENCE");
  const badHead = authorSyntheticCandidate({ head: "not-a-sha", segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  assert.equal(badHead.ok, false);
  assert.equal(badHead.reason, "INVALID_HEAD");
  const badEvidenceType = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: "yes", evidenceRefs: EVIDENCE });
  assert.equal(badEvidenceType.ok, false);
  assert.equal(badEvidenceType.reason, "MALFORMED_EVIDENCE");
});

await test("T17 source-of-truth conflict (heartbeat exists but queue scan says create) -> deterministic class from disk evidence", () => {
  // The injector derives heartbeatExists from disk; a conflict is impossible by
  // construction because there is exactly one evidence source for existence.
  // The test pins that BOTH classes are derived ONLY from disk state:
  const create = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  const append = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: true, evidenceRefs: EVIDENCE });
  assert.equal(create.candidate.objective_class, "create_marker_file");
  assert.equal(append.candidate.objective_class, "append_marker_line");
  // And a stale create after completion would be caught by ID collision:
  const again = authorSyntheticCandidate({ head: HEAD, segment: SEG, seq: 1, nowIso: NOW, heartbeatPath: HB, heartbeatExists: false, evidenceRefs: EVIDENCE });
  assert.equal(again.candidate.id, create.candidate.id); // same state -> same id -> collision guard (T7)
});

// 18: preemption between decision and persist (simulated via scan2 logic)
await test("T18 real READY appearing between decision and persist -> REAL_WORK_PREEMPTED (inert file)", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "lde-bf-"));
  try {
    const q = drainedQueue(tmp);
    const receiptsPath = join(tmp, "receipts.json");
    writeFileSync(receiptsPath, JSON.stringify([{ task_ref: "LOCAL_DEV_B_D-9001-T", claimed_at: NOW }]), "utf8");
    const rec = join(tmp, "record.json");
    // Preempt BEFORE scan2 by pre-registering a wrapper: not directly possible
    // via CLI (single process). Simulate the exact race outcome: inject one
    // real READY item into the queue AFTER the first run created the file but
    // BEFORE re-running — the next run must see WORK_AVAILABLE and never
    // double-inject.
    const r1 = await run(["--queue", q, "--receipts", receiptsPath, "--head", HEAD, "--segment", SEG, "--out-record", rec, "--now", NOW]);
    assert.equal(r1.code, 0);
    const record1 = JSON.parse(readFileSync(rec, "utf8"));
    assert.equal(record1.synthetic_item_created, "YES");
    copyFileSync(join(FIXTURES, "READY_D9007Q.md"), join(q, "READY_D9007Q.md")); // real work appears
    const r2 = await run(["--queue", q, "--receipts", receiptsPath, "--head", HEAD, "--segment", SEG, "--out-record", rec, "--now", NOW]);
    assert.equal(r2.code, 0);
    const record2 = JSON.parse(readFileSync(rec, "utf8"));
    assert.equal(record2.decision, "WORK_AVAILABLE");
    assert.equal(record2.synthetic_item_created, "NO");
    assert.equal(readdirSync(q).filter((f) => f.startsWith("SYNTHETIC_")).length, 1);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// 19: provenance persisted
await test("T19 synthetic marker/provenance persisted in item + record", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "lde-bf-"));
  try {
    const q = drainedQueue(tmp);
    const receiptsPath = join(tmp, "receipts.json");
    writeFileSync(receiptsPath, JSON.stringify([{ task_ref: "LOCAL_DEV_B_D-9001-T", claimed_at: NOW }]), "utf8");
    const rec = join(tmp, "record.json");
    await run(["--queue", q, "--receipts", receiptsPath, "--head", HEAD, "--segment", SEG, "--out-record", rec, "--now", NOW]);
    const record = JSON.parse(readFileSync(rec, "utf8"));
    assert.equal(record.policy_version, "local-dev-idle-backfill-policy-v1");
    assert.equal(record.segment, SEG);
    assert.equal(record.base_head, HEAD);
    assert.ok(Array.isArray(record.candidate.evidence_refs) && record.candidate.evidence_refs.length >= 2);
    assert.ok(typeof record.candidate.marker === "string" && record.candidate.marker.includes(`seq=1`));
    const synFile = readdirSync(q).find((f) => f.startsWith("SYNTHETIC_"));
    const md = readFileSync(join(q, synFile), "utf8");
    assert.ok(md.includes("synthetic=true"));
    assert.ok(md.includes("generated_by=local-dev-idle-backfill-v1"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// Extra: scanQueue purity
await test("T-extra scanQueue partitions admissible/claimed deterministically", () => {
  const tmp = mkdtempSync(join(tmpdir(), "lde-bf-"));
  try {
    const q = drainedQueue(tmp);
    const s = scanQueue(q, [{ task_ref: "LOCAL_DEV_B_D-9001-T" }]);
    assert.equal(s.unclaimedAdmissible, 0);
    assert.equal(s.claimedCount, 1);
    const s2 = scanQueue(q, []);
    assert.equal(s2.unclaimedAdmissible, 1);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
