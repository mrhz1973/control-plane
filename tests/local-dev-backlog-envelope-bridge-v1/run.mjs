/**
 * Deterministic offline tests for the backlog → local-dev-envelope bridge v1.
 * No Qwen. No OpenCode. No network. No git mutation.
 *
 * Run: node tests/local-dev-backlog-envelope-bridge-v1/run.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildLocalDevEnvelopeFromBacklog,
  buildTaskDelta,
  BRIDGE_VERSION,
  KNOWN_LOCAL_REPOS,
} from "../../tools/bridge-backlog-to-local-dev-envelope-v1.mjs";
import { validateEnvelope, DEFAULT_DEV_PROFILE_ID } from "../../tools/local-dev-executor-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = (name) => readFileSync(join(HERE, "fixtures", name), "utf8");

const REPO = "mrhz1973/control-plane";
const COMMIT = "a".repeat(40);
const HEAD = "b".repeat(40);
const PATH = "docs/runtime/BACKLOG_FIXTURE.md";
const NOW = new Date("2026-09-05T05:00:00Z");

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

const BASE = { markdown: FIX("READY_D9001T.md"), repo: REPO, commit: COMMIT, path: PATH, dispatchBaseHead: HEAD, now: NOW };

await test("happy path: valid READY item produces validated envelope + receipt", () => {
  const r = buildLocalDevEnvelopeFromBacklog(BASE);
  assert.equal(r.ok, true, JSON.stringify(r.reason_codes));
  assert.equal(r.envelope.schema_version, "local-dev-task-envelope-v1");
  assert.equal(r.envelope.task_ref, "LOCAL_DEV_B_D-9001-T");
  assert.equal(r.envelope.target_repo_path, KNOWN_LOCAL_REPOS[REPO]);
  assert.equal(r.envelope.target_remote, "https://github.com/mrhz1973/control-plane.git");
  assert.equal(r.envelope.dispatch_base_head, HEAD);
  assert.equal(r.envelope.profile_id, DEFAULT_DEV_PROFILE_ID);
  assert.equal(r.envelope.network_policy, "localhost_only");
  assert.equal(r.envelope.timebox_seconds, 600);
  assert.equal(r.envelope.max_agent_turns, 8);
  assert.equal(r.envelope.max_test_cycles, 0);
  assert.equal(r.envelope.git_persistence_required, true);
  assert.deepEqual(r.envelope.allowed_paths, ["docs/runtime/CAMPAIGN_NOTES.md"]);
  assert.deepEqual(r.envelope.allowed_commands, ["git status --short", "git diff --check"]);
  assert.equal(r.envelope.test_command, "git diff --check");
  assert.equal(r.receipt.source_ref, `github:${REPO}@${COMMIT}:${PATH}`);
  assert.equal(r.receipt.task_ref, "LOCAL_DEV_B_D-9001-T");
  assert.equal(r.receipt.claimed_at, "2026-09-05T05:00:00.000Z");
  assert.equal(r.receipt.bridge_version, BRIDGE_VERSION);
  // Independent: envelope must pass the executor's own validator.
  const v = validateEnvelope(r.envelope);
  assert.equal(v.ok, true, JSON.stringify(v.reason_codes));
});

await test("task_delta embeds objective + acceptance verbatim, lists non-empty forbidden areas, no loop sentence when loop_allowed=false", () => {
  const r = buildLocalDevEnvelopeFromBacklog(BASE);
  assert.equal(r.ok, true);
  const td = r.envelope.task_delta;
  assert.ok(td.startsWith("Objective: Append the declared marker block"));
  assert.ok(td.includes("1. Marker line present exactly once at end of file"));
  assert.ok(!/corrective loop declared/i.test(td));
  assert.ok(td.includes("Forbidden (do not touch): tools/**"));
});

await test("task_delta omits forbidden section when forbidden_areas empty", () => {
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: FIX("READY_D9002L_LOOP.md"), path: "docs/runtime/BACKLOG_LOOP.md" });
  assert.equal(r.ok, true);
  assert.ok(!r.envelope.task_delta.includes("Forbidden (do not touch)"));
});

await test("loop_allowed=true maps to clamped test cycles and declared-loop sentence; hints clamp under hard caps", () => {
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: FIX("READY_D9002L_LOOP.md"), path: "docs/runtime/BACKLOG_LOOP.md" });
  assert.equal(r.ok, true, JSON.stringify(r.reason_codes));
  assert.equal(r.envelope.max_test_cycles, 2, "hint 3 clamps to hard cap 2");
  assert.equal(r.envelope.timebox_seconds, 900, "hint 99999 clamps to 900");
  assert.equal(r.envelope.max_agent_turns, 2);
  assert.equal(r.envelope.profile_id, "qwen38-opus-q3-cline-64k", "explicit DEV profile honored");
  assert.ok(/corrective loop declared, test cycles: 2\./.test(r.envelope.task_delta));
  const v = validateEnvelope(r.envelope);
  assert.equal(v.ok, true, JSON.stringify(v.reason_codes));
});

await test("allowed_paths are verbatim (never widened)", () => {
  const r = buildLocalDevEnvelopeFromBacklog(BASE);
  assert.equal(r.ok, true);
  assert.deepEqual(r.envelope.allowed_paths, ["docs/runtime/CAMPAIGN_NOTES.md"]);
});

await test("human gate declared -> HUMAN_GATE_DECLARED, never bridged", () => {
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: FIX("GATED_D9003H.md") });
  assert.equal(r.ok, false);
  assert.deepEqual(r.reason_codes, ["HUMAN_GATE_DECLARED"]);
});

await test("high risk -> BRIDGE_HIGH_RISK_REQUIRES_GATE", () => {
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: FIX("HIGHRISK_D9004R.md") });
  assert.equal(r.ok, false);
  assert.deepEqual(r.reason_codes, ["BRIDGE_HIGH_RISK_REQUIRES_GATE"]);
});

await test("state != READY_FOR_PLANNING -> BACKLOG_STATE_NOT_CONSUMABLE", () => {
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: FIX("BLOCKED_D9005B.md") });
  assert.equal(r.ok, false);
  assert.deepEqual(r.reason_codes, ["BACKLOG_STATE_NOT_CONSUMABLE"]);
});

await test("zero fences -> BACKLOG_CONTRACT_UNSUPPORTED", () => {
  const md = "# no fence here\njust text\n";
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: md });
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("BACKLOG_CONTRACT_UNSUPPORTED"));
});

await test("two yaml fences -> BACKLOG_CONTRACT_UNSUPPORTED (multiple blocks rejected)", () => {
  const one = FIX("READY_D9001T.md");
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: one + "\n" + one });
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("BACKLOG_CONTRACT_UNSUPPORTED"));
});

await test("multi-document yaml -> BACKLOG_YAML_INVALID with reason", () => {
  const fenceBlock = FIX("READY_D9001T.md");
  const start = fenceBlock.indexOf("```yaml");
  const end = fenceBlock.indexOf("```", start + 6);
  const inner = fenceBlock.slice(start + 7, end);
  const md = "```yaml\n---\n" + inner + "\n---\nsecond: doc\n```\n";
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: md });
  assert.equal(r.ok, false);
  assert.equal(r.reason_codes[0], "BACKLOG_YAML_INVALID");
  assert.ok(r.reason_codes[1]);
});

await test("unknown local_dev key -> BACKLOG_DEV_FIELDS_UNSUPPORTED (no silent upgrade)", () => {
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: FIX("UNKNOWNDEV_D9006U.md") });
  assert.equal(r.ok, false);
  assert.deepEqual(r.reason_codes, ["BACKLOG_DEV_FIELDS_UNSUPPORTED"]);
});

await test("unknown repository -> REPO_NOT_LOCAL_KNOWN", () => {
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, repo: "somebody/unknown" });
  assert.equal(r.ok, false);
  assert.deepEqual(r.reason_codes, ["REPO_NOT_LOCAL_KNOWN"]);
});

await test("malformed backlog id -> BACKLOG_ID_INVALID", () => {
  const md = FIX("READY_D9001T.md").replace("id: D-9001-T", "id: just-a-title");
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, markdown: md });
  assert.equal(r.ok, false);
  assert.deepEqual(r.reason_codes, ["BACKLOG_ID_INVALID"]);
});

await test("duplicate source_ref or task_ref receipt -> CLAIM_ALREADY_EXISTS", () => {
  const first = buildLocalDevEnvelopeFromBacklog(BASE);
  assert.equal(first.ok, true);
  const dup1 = buildLocalDevEnvelopeFromBacklog({ ...BASE, existingReceipts: [first.receipt] });
  assert.equal(dup1.ok, false);
  assert.deepEqual(dup1.reason_codes, ["CLAIM_ALREADY_EXISTS"]);
  const dup2 = buildLocalDevEnvelopeFromBacklog({
    ...BASE,
    existingReceipts: [{ task_ref: "LOCAL_DEV_B_D-9001-T", source_ref: "other", claimed_at: NOW.toISOString(), bridge_version: BRIDGE_VERSION }],
  });
  assert.equal(dup2.ok, false);
  assert.deepEqual(dup2.reason_codes, ["CLAIM_ALREADY_EXISTS"]);
});

await test("bad dispatch head -> BACKLOG_CONTRACT_UNSUPPORTED (claim must anchor to live HEAD)", () => {
  const r = buildLocalDevEnvelopeFromBacklog({ ...BASE, dispatchBaseHead: "deadbeef" });
  assert.equal(r.ok, false);
  assert.ok(r.reason_codes.includes("BACKLOG_CONTRACT_UNSUPPORTED"));
});

await test("buildTaskDelta includes loop sentence exactly when cycles > 0", () => {
  assert.ok(!/corrective loop/i.test(buildTaskDelta({ objective: "x", acceptance: [], scope: {} }, 0)));
  assert.ok(/test cycles: 2\./.test(buildTaskDelta({ objective: "x", acceptance: [], scope: {} }, 2)));
});

await test("bridge is offline by construction (no network modules imported)", async () => {
  const src = readFileSync(join(HERE, "..", "..", "tools", "bridge-backlog-to-local-dev-envelope-v1.mjs"), "utf8");
  assert.ok(!/node:http|node:net|node:https|node:child_process|node:dgram/.test(src));
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
