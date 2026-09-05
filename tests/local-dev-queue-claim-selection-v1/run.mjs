/**
 * Deterministic offline tests for the LOCAL_DEV dev-queue claim/selection v1
 * (V4_LOCAL_DEV_EXECUTOR_QUEUE_CLAIM_SELECTION_V1).
 *
 * Selection law (single-writer, receipts-based, no filesystem mutation here):
 *   - eligible item = READY_FOR_PLANNING, gate-free, risk != high,
 *     target cursor, planner supported, repo known;
 *   - ordering: risk (low < medium) then FIFO by created_at;
 *   - a source_ref/task_ref already present in receipts is skipped
 *     (CLAIM_ALREADY_EXISTS is never "selected");
 *   - fail-closed selectors: empty queue -> NONE_ELIGIBLE; malformed item is
 *     excluded (not fatal) but counted.
 *
 * Run: node tests/local-dev-queue-claim-selection-v1/run.mjs
 */
import assert from "node:assert/strict";

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

// Mirror of the bridge's admissibility gates (kept in test to pin the LAW;
// the production selector imports the real bridge for actual parsing).
const RISK_ORDER = { low: 0, medium: 1 };

function makeItem(overrides = {}) {
  return {
    id: "D-9000-X",
    objective: "Do a thing",
    risk_hint: "low",
    state: "READY_FOR_PLANNING",
    human_gate_required_if: [],
    created_at: "2026-09-05T00:00:00Z",
    execution: { target: "cursor", loop_allowed: false, max_loop_rounds_hint: null },
    planner: { preferred: "qwen", fallback: [], fallback_policy: "gate_only" },
    scope: { allowed_areas: ["docs/**"], forbidden_areas: [] },
    ...overrides,
  };
}

// Minimal standalone selector under test (mirrors planned tool contract).
function selectNextQueueItem(items, receipts, now = new Date("2026-09-05T06:00:00Z")) {
  const claimedTaskRefs = new Set((receipts || []).map((r) => r.task_ref));
  const eligible = [];
  let excluded = 0;
  for (const item of items || []) {
    const inadmissible =
      !item || typeof item !== "object" ||
      item.state !== "READY_FOR_PLANNING" ||
      !Array.isArray(item.human_gate_required_if) ||
      item.human_gate_required_if.length > 0 ||
      !RISK_ORDER.hasOwnProperty(item.risk_hint) ||
      item.risk_hint === "high" ||
      item.execution?.target !== "cursor" ||
      !item.planner?.preferred ||
      !item.id;
    if (inadmissible) { excluded += 1; continue; }
    const taskRef = `LOCAL_DEV_B_${item.id}`;
    if (claimedTaskRefs.has(taskRef)) { excluded += 1; continue; }
    eligible.push(item);
  }
  eligible.sort((a, b) => {
    const r = RISK_ORDER[a.risk_hint] - RISK_ORDER[b.risk_hint];
    if (r !== 0) return r;
    return String(a.created_at).localeCompare(String(b.created_at));
  });
  const next = eligible[0] || null;
  return {
    selected: next ? { task_ref: `LOCAL_DEV_B_${next.id}`, id: next.id, risk_hint: next.risk_hint, created_at: next.created_at } : null,
    eligible_count: eligible.length,
    excluded_count: excluded,
    decided_at: now.toISOString(),
    reason_code: next ? "SELECTED" : (excluded > 0 ? "NONE_ELIGIBLE_ALL_EXCLUDED" : "NONE_ELIGIBLE_EMPTY_QUEUE"),
  };
}

await test("S1 selects READY item deterministically", () => {
  const r = selectNextQueueItem([makeItem({ id: "D-9001-T" })], []);
  assert.equal(r.reason_code, "SELECTED");
  assert.equal(r.selected.task_ref, "LOCAL_DEV_B_D-9001-T");
});

await test("S2 risk ordering: low before medium", () => {
  const r = selectNextQueueItem([
    makeItem({ id: "D-0002-M", risk_hint: "medium", created_at: "2026-09-04T00:00:00Z" }),
    makeItem({ id: "D-0001-L", risk_hint: "low", created_at: "2026-09-05T00:00:00Z" }),
  ], []);
  assert.equal(r.selected.id, "D-0001-L");
});

await test("S3 FIFO inside same risk", () => {
  const r = selectNextQueueItem([
    makeItem({ id: "D-0002-B", created_at: "2026-09-05T02:00:00Z" }),
    makeItem({ id: "D-0001-A", created_at: "2026-09-05T01:00:00Z" }),
  ], []);
  assert.equal(r.selected.id, "D-0001-A");
});

await test("S4 already-claimed item is skipped, next eligible chosen", () => {
  const receipts = [{ task_ref: "LOCAL_DEV_B_D-0001-A", source_ref: "x", claimed_at: "t", bridge_version: "v" }];
  const r = selectNextQueueItem([
    makeItem({ id: "D-0001-A" }),
    makeItem({ id: "D-0002-B" }),
  ], receipts);
  assert.equal(r.selected.id, "D-0002-B");
  assert.equal(r.excluded_count, 1);
});

await test("S5 all claimed -> NONE_ELIGIBLE_ALL_EXCLUDED (never re-claim)", () => {
  const receipts = [{ task_ref: "LOCAL_DEV_B_D-0001-A" }, { task_ref: "LOCAL_DEV_B_D-0002-B" }];
  const r = selectNextQueueItem([makeItem({ id: "D-0001-A" }), makeItem({ id: "D-0002-B" })], receipts);
  assert.equal(r.selected, null);
  assert.equal(r.reason_code, "NONE_ELIGIBLE_ALL_EXCLUDED");
});

await test("S6 high-risk / gated / wrong-target items excluded", () => {
  const r = selectNextQueueItem([
    makeItem({ id: "D-0003-H", risk_hint: "high" }),
    makeItem({ id: "D-0004-G", human_gate_required_if: ["x"] }),
    makeItem({ id: "D-0005-W", execution: { target: "opencode", loop_allowed: false, max_loop_rounds_hint: null } }),
    makeItem({ id: "D-0006-S", state: "BLOCKED" }),
  ], []);
  assert.equal(r.selected, null);
  assert.equal(r.excluded_count, 4);
});

await test("S7 malformed item does not crash selector", () => {
  const r = selectNextQueueItem([null, makeItem({ id: "D-0001-A" })], []);
  assert.equal(r.selected.id, "D-0001-A");
  assert.equal(r.excluded_count, 1);
});

await test("S8 empty queue -> NONE_ELIGIBLE_EMPTY_QUEUE, decided_at deterministic", () => {
  const r = selectNextQueueItem([], []);
  assert.equal(r.selected, null);
  assert.equal(r.reason_code, "NONE_ELIGIBLE_EMPTY_QUEUE");
  assert.equal(r.decided_at, "2026-09-05T06:00:00.000Z");
});

await test("S9 gate-free medium risk still selectable after low claimed", () => {
  const receipts = [{ task_ref: "LOCAL_DEV_B_D-0001-L" }];
  const r = selectNextQueueItem([
    makeItem({ id: "D-0001-L", risk_hint: "low" }),
    makeItem({ id: "D-0002-M", risk_hint: "medium" }),
  ], receipts);
  assert.equal(r.selected.id, "D-0002-M");
});

await test("S10 selection is pure: same inputs -> same output", () => {
  const items = [makeItem({ id: "D-0001-A" }), makeItem({ id: "D-0002-B", risk_hint: "medium" })];
  const a = selectNextQueueItem(items, []);
  const b = selectNextQueueItem(items, []);
  assert.deepEqual(a, b);
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
