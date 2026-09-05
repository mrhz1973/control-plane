/**
 * Deterministic offline tests for the LOCAL_DEV idle-queue backfill policy v1
 * (V4_LOCAL_DEV_EXECUTOR_IDLE_QUEUE_BACKFILL_POLICY_V1).
 *
 * POLICY LAW (fail-closed, auto-eligibility only via explicit self-authored
 * synthetic READY items in the CANONICAL fixture queue; real user backlog is
 * NEVER consumed):
 *   - decideBackfill(queueScan, receipts, policy) returns exactly one of:
 *       BACKFILL_SYNTHETIC  — queue drained AND policy.synthetic_backfill
 *                             enabled AND the synthetic item is registered;
 *       IDLE_CLEAN          — queue drained AND backfill disabled;
 *       WORK_AVAILABLE      — at least one unclaimed admissible item exists;
 *       IDLE_ALL_CLAIMED    — items exist but all are claimed/inadmissible
 *                             (no auto-unblock, ever);
 *   - synthetic items must be schema-identical to normal READY items and go
 *     through the SAME selector/bridge gates; no special casing;
 *   - policy itself can never widen scope: synthetic objective must target a
 *     docs/runtime/** allowed path (fail-closed default) and never touch
 *     production areas.
 *
 * Run: node tests/local-dev-idle-backfill-policy-v1/run.mjs
 */
import assert from "node:assert/strict";
// Single source of truth: the LAW is now exported by the runtime tool
// (tools/local-dev-idle-backfill-v1.mjs). This pinned suite verifies the
// EXACT semantics the injector enforces, unchanged from the original 10/10.
import { decideBackfill, DEFAULT_POLICY } from "../../tools/local-dev-idle-backfill-v1.mjs";

// Pinned policy mirror retained for the P8 frozen-defaults assertion:
const PINNED_DEFAULTS = Object.freeze({
  schema_version: "local-dev-idle-backfill-policy-v1",
  synthetic_backfill_enabled: true,
  synthetic_allowed_scope_prefix: "docs/runtime/",
  max_synthetics_per_segment: 3,
  never_touch: ["tools/**", "configs/**", "scripts/**", ".github/**"],
});

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

await test("P1 WORK_AVAILABLE when unclaimed admissible item exists (never backfills over real work)", () => {
  const r = decideBackfill({ unclaimedAdmissible: 1, claimedCount: 2, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: "docs/runtime/X.md" } });
  assert.equal(r.decision, "WORK_AVAILABLE");
});

await test("P2 BACKFILL_SYNTHETIC on drained queue when enabled", () => {
  const r = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 2, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: "docs/runtime/HEARTBEAT.md" } });
  assert.equal(r.decision, "BACKFILL_SYNTHETIC");
  assert.equal(r.synthetic.allowed_path, "docs/runtime/HEARTBEAT.md");
});

await test("P3 IDLE_CLEAN when drained and backfill disabled", () => {
  const r = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 0, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: "docs/runtime/X.md" } }, { ...DEFAULT_POLICY, synthetic_backfill_enabled: false });
  assert.equal(r.decision, "IDLE");
  assert.equal(r.reason_code, "IDLE_CLEAN");
});

await test("P4 IDLE_ALL_CLAIMED when drained, backfill enabled but synthetic cap reached", () => {
  const r = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 3, syntheticsCreatedThisSegment: 3, syntheticCandidate: { allowed_path: "docs/runtime/X.md" } });
  assert.equal(r.decision, "IDLE");
  assert.equal(r.reason_code, "IDLE_ALL_CLAIMED_SYNTHETIC_LIMIT");
});

await test("P5 synthetic candidate outside docs/runtime/ prefix is rejected fail-closed", () => {
  const r = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 1, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: "tools/rogue.md" } });
  assert.equal(r.decision, "IDLE");
});

await test("P6 synthetic candidate in never_touch area rejected even under prefix", () => {
  const r = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 1, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: "docs/runtime/../../tools/x.md" } }, { ...DEFAULT_POLICY, synthetic_allowed_scope_prefix: "docs/" });
  assert.equal(r.decision, "IDLE");
});

await test("P7 missing synthetic candidate -> clean idle, never fabricates scope", () => {
  const r = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 0, syntheticsCreatedThisSegment: 0, syntheticCandidate: null });
  assert.equal(r.decision, "IDLE");
  assert.equal(r.reason_code, "IDLE_CLEAN");
});

await test("P8 policy is frozen-safe: defaults deny production prefixes", () => {
  assert.ok(DEFAULT_POLICY.never_touch.includes("tools/**"));
  assert.ok(DEFAULT_POLICY.never_touch.includes("configs/**"));
  assert.ok(DEFAULT_POLICY.never_touch.includes(".github/**"));
  assert.equal(DEFAULT_POLICY.synthetic_allowed_scope_prefix, "docs/runtime/");
  // Tool-exported defaults must EQUAL the pinned law exactly:
  assert.deepEqual({ ...DEFAULT_POLICY }, { ...PINNED_DEFAULTS });
});

await test("P9 cap arithmetic: exactly at cap-1 still backfills", () => {
  const r = decideBackfill({ unclaimedAdmissible: 0, claimedCount: 1, syntheticsCreatedThisSegment: 2, syntheticCandidate: { allowed_path: "docs/runtime/Y.md" } });
  assert.equal(r.decision, "BACKFILL_SYNTHETIC");
});

await test("P10 decision is pure and deterministic", () => {
  const args = { unclaimedAdmissible: 0, claimedCount: 1, syntheticsCreatedThisSegment: 0, syntheticCandidate: { allowed_path: "docs/runtime/Z.md" } };
  assert.deepEqual(decideBackfill(args), decideBackfill(args));
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
