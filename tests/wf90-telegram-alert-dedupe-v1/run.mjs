#!/usr/bin/env node
/**
 * V4_WF90_TELEGRAM_ALERT_DEDUPE_V1 — focused offline tests.
 *
 * Evaluates the deployed WF90 dedupe Code node verbatim with bounded mocks.
 * No n8n, network, workflow apply, model invocation, or Telegram send.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const ARTIFACT = join(ROOT, "workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json");
const DECIDE_NODE = "Code - Decide WF90 alert dedupe";
const NORMALIZE_NODE = "Code - Normalize LOCAL_DEV tick result";
const STATE_KEY = "wf90:active_alert_signature";

const artifact = JSON.parse(readFileSync(ARTIFACT, "utf8").replace(/^\uFEFF/, ""));
const decideNode = artifact.nodes.find((n) => n.name === DECIDE_NODE);
assert.ok(decideNode, "workflow artifact must contain node " + DECIDE_NODE);
assert.equal(decideNode.type, "n8n-nodes-base.code");
assert.equal(decideNode.parameters.mode, "runOnceForAllItems");

const decide = (normalized, rows = []) => {
  const refs = {
    [NORMALIZE_NODE]: {
      first: () => ({ json: normalized }),
    },
  };
  const fn = new Function("$input", "$", decideNode.parameters.jsCode);
  return fn(
    { all: () => rows.map((json) => ({ json })) },
    (name) => refs[name],
  ).json;
};

const actionable = (overrides = {}) => ({
  classification: "HUMAN_GATE_REQUIRED",
  task_ref: null,
  human_gate_required: true,
  gate_summary: "tracked dirty: 2 file(s)",
  reason_codes: ["TRACKED_DIRTY_CONFLICT"],
  notify_required: true,
  request_id: "volatile-request-id",
  tick_completed_at: "volatile-timestamp",
  ...overrides,
});

const stateFor = (decision) => [{ key: STATE_KEY, value: decision.alert_signature }];

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write("PASS " + name + "\n");
  } catch (err) {
    failures.push(name);
    process.stdout.write("FAIL " + name + ": " + (err?.message || err) + "\n");
  }
}

await test("graph-uses-existing-control-plane-state-and-three-way-decision", () => {
  const names = new Set(artifact.nodes.map((node) => node.name));
  assert.ok(names.has("Data Table - Load WF90 active alert state"));
  assert.ok(names.has("Data Table - Persist WF90 active alert state"));
  assert.ok(names.has("Data Table - Clear WF90 active alert state"));
  assert.ok(names.has("IF - WF90 send new actionable alert?"));
  assert.ok(names.has("IF - WF90 clear inactive alert episode?"));
  const load = artifact.nodes.find((node) => node.name === "Data Table - Load WF90 active alert state");
  const persist = artifact.nodes.find((node) => node.name === "Data Table - Persist WF90 active alert state");
  const clear = artifact.nodes.find((node) => node.name === "Data Table - Clear WF90 active alert state");
  for (const node of [load, persist, clear]) {
    assert.equal(node.parameters.dataTableId.value, "control_plane_state");
    assert.equal(node.onError, "continueRegularOutput");
  }
  assert.equal(clear.parameters.operation, "deleteRows");
  assert.equal(artifact.connections[NORMALIZE_NODE].main[0][0].node, "Data Table - Load WF90 active alert state");
});

await test("new-actionable-state-sends-and-builds-stable-five-field-signature", () => {
  const out = decide(actionable());
  assert.equal(out.dedupe_action, "SEND");
  assert.equal(out.dedupe_reason, "NEW_ACTIONABLE_EPISODE");
  assert.equal(out.dedupe_state_key, STATE_KEY);
  assert.equal(out.dedupe_state_read_ok, true);
  assert.deepEqual(Object.keys(JSON.parse(out.alert_signature)), [
    "classification",
    "task_ref",
    "phase",
    "reason_code",
    "gate_summary",
  ]);
  assert.equal(JSON.parse(out.alert_signature).classification, "HUMAN_GATE_REQUIRED");
});

await test("volatile-fields-do-not-change-identical-actionable-state", () => {
  const first = decide(actionable({ request_id: "r-1", tick_completed_at: "t-1" }));
  const later = decide(actionable({ request_id: "r-2", tick_completed_at: "t-2" }), stateFor(first));
  assert.equal(later.dedupe_action, "SUPPRESS");
  assert.equal(later.dedupe_reason, "UNCHANGED_ACTIONABLE_STATE");
  assert.equal(later.alert_signature, first.alert_signature);
});

await test("sequence-send-suppress-suppress-clear-rearm-and-new-signature", () => {
  const a1 = decide(actionable());
  assert.equal(a1.dedupe_action, "SEND");
  const a2 = decide(actionable(), stateFor(a1));
  assert.equal(a2.dedupe_action, "SUPPRESS");
  const a3 = decide(actionable(), stateFor(a2));
  assert.equal(a3.dedupe_action, "SUPPRESS");

  const clean = decide({
    classification: "IDLE_CLEAN",
    task_ref: null,
    human_gate_required: false,
    gate_summary: null,
    reason_codes: [],
    notify_required: false,
  }, stateFor(a3));
  assert.equal(clean.dedupe_action, "CLEAR");
  assert.equal(clean.alert_signature, null);

  const a4 = decide(actionable());
  assert.equal(a4.dedupe_action, "SEND");

  const b = decide(actionable({
    classification: "WORK_EXECUTED_STOP",
    human_gate_required: false,
    gate_summary: "bounded executor stop",
    reason_codes: ["EXECUTOR_STOP"],
  }), stateFor(a4));
  assert.equal(b.dedupe_action, "SEND");
  assert.equal(b.dedupe_reason, "CHANGED_ACTIONABLE_STATE");
});

await test("state-read-failure-fails-open-to-send", () => {
  const out = decide(actionable(), [{ error: "sanitized state read failure" }]);
  assert.equal(out.dedupe_action, "SEND");
  assert.equal(out.dedupe_reason, "STATE_READ_FAILED_FAIL_OPEN");
  assert.equal(out.dedupe_state_read_ok, false);
});

const failed = failures.length;
console.log(JSON.stringify({ ok: failed === 0, passed, failed, total: passed + failed }));
process.exitCode = failed ? 1 : 0;
