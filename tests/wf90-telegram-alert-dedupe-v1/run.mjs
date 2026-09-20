#!/usr/bin/env node
/**
 * V4_WF90_TELEGRAM_ALERT_DEDUPE_V1 / #109 exact-once episode law.
 *
 * Evaluates the canonical Decide node jsCode (synced into the WF90 artifact)
 * with bounded mocks. No n8n, network, workflow apply, model, or Telegram send.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEDUPE_DECIDE_JSCODE,
  DEDUPE_DECIDE_NODE,
  DEDUPE_STATE_KEY,
  DEDUPE_SIGNATURE_FIELDS,
} from "../../tools/wf90-actionable-gate-nodes-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const ARTIFACT = join(ROOT, "workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json");
const NORMALIZE_NODE = "Code - Normalize LOCAL_DEV tick result";
const STATE_KEY = DEDUPE_STATE_KEY;

const artifact = JSON.parse(readFileSync(ARTIFACT, "utf8").replace(/^\uFEFF/, ""));
const decideNode = artifact.nodes.find((n) => n.name === DEDUPE_DECIDE_NODE);
assert.ok(decideNode, "workflow artifact must contain node " + DEDUPE_DECIDE_NODE);
assert.equal(decideNode.type, "n8n-nodes-base.code");
assert.equal(decideNode.parameters.mode, "runOnceForAllItems");
assert.equal(decideNode.parameters.jsCode, DEDUPE_DECIDE_JSCODE, "artifact decide js must match tools source");

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
  gate_summary: "tracked dirty: 2 file(s) [mrhz1973/control-plane]",
  reason_codes: ["TRACKED_DIRTY_CONFLICT", "REPO=mrhz1973/control-plane"],
  notify_required: true,
  request_id: "volatile-request-id",
  tick_completed_at: "volatile-timestamp",
  ...overrides,
});

const idle = (overrides = {}) => ({
  classification: "IDLE_CLEAN",
  task_ref: null,
  human_gate_required: false,
  gate_summary: null,
  reason_codes: ["NO_ELIGIBLE_READY"],
  notify_required: false,
  ...overrides,
});

const busy = (overrides = {}) => ({
  classification: "BUSY",
  task_ref: null,
  human_gate_required: false,
  gate_summary: null,
  reason_codes: ["EXECUTION_IN_FLIGHT"],
  notify_required: false,
  ...overrides,
});

const passTick = (overrides = {}) => ({
  classification: "WORK_EXECUTED_PASS",
  task_ref: "LOCAL_DEV_B_D-EXAMPLE",
  human_gate_required: false,
  gate_summary: null,
  reason_codes: [],
  notify_required: false,
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

await test("A consecutive identical HUMAN_GATE send then suppress", () => {
  const a1 = decide(actionable());
  assert.equal(a1.dedupe_action, "SEND");
  assert.equal(a1.dedupe_reason, "NEW_ACTIONABLE_EPISODE");
  const a2 = decide(actionable(), stateFor(a1));
  assert.equal(a2.dedupe_action, "SUPPRESS");
  assert.equal(a2.dedupe_reason, "UNCHANGED_ACTIONABLE_STATE");
});

await test("B IDLE_CLEAN keeps episode; same HUMAN_GATE suppresses", () => {
  const a1 = decide(actionable());
  assert.equal(a1.dedupe_action, "SEND");
  const mid = decide(idle(), stateFor(a1));
  assert.equal(mid.dedupe_action, "KEEP_EPISODE");
  assert.equal(mid.dedupe_reason, "IDLE_KEEPS_EPISODE");
  assert.equal(mid.alert_signature, null);
  const a2 = decide(actionable(), stateFor(a1));
  assert.equal(a2.dedupe_action, "SUPPRESS");
});

await test("C BUSY keeps episode; same HUMAN_GATE suppresses", () => {
  const a1 = decide(actionable());
  const mid = decide(busy(), stateFor(a1));
  assert.equal(mid.dedupe_action, "KEEP_EPISODE");
  assert.equal(mid.dedupe_reason, "BUSY_KEEPS_EPISODE");
  const a2 = decide(actionable(), stateFor(a1));
  assert.equal(a2.dedupe_action, "SUPPRESS");
});

await test("D TRACKED_DIRTY file-count drift same repo suppresses", () => {
  const a1 = decide(actionable({
    gate_summary: "tracked dirty: 1 file(s) [mrhz1973/control-plane]",
  }));
  assert.equal(a1.dedupe_action, "SEND");
  const a2 = decide(actionable({
    gate_summary: "tracked dirty: 4 file(s) [mrhz1973/control-plane]",
  }), stateFor(a1));
  assert.equal(a2.dedupe_action, "SUPPRESS");
  assert.equal(a2.alert_signature, a1.alert_signature);
  const sig = JSON.parse(a1.alert_signature);
  assert.equal(sig.reason_code, "TRACKED_DIRTY_CONFLICT");
  assert.equal(sig.repo, "mrhz1973/control-plane");
  assert.equal(Object.prototype.hasOwnProperty.call(sig, "gate_summary"), false);
});

await test("E real reason change sends once for new semantic identity", () => {
  const a1 = decide(actionable());
  const b = decide(actionable({
    reason_codes: ["OTHER_HUMAN_GATE", "REPO=mrhz1973/control-plane"],
    gate_summary: "other gate [mrhz1973/control-plane]",
  }), stateFor(a1));
  assert.equal(b.dedupe_action, "SEND");
  assert.equal(b.dedupe_reason, "CHANGED_ACTIONABLE_STATE");
  assert.notEqual(b.alert_signature, a1.alert_signature);
});

await test("F repo change sends new gate", () => {
  const a1 = decide(actionable());
  const b = decide(actionable({
    reason_codes: ["TRACKED_DIRTY_CONFLICT", "REPO=mrhz1973/other-repo"],
    gate_summary: "tracked dirty: 1 file(s) [mrhz1973/other-repo]",
  }), stateFor(a1));
  assert.equal(b.dedupe_action, "SEND");
  assert.equal(b.dedupe_reason, "CHANGED_ACTIONABLE_STATE");
  assert.equal(JSON.parse(b.alert_signature).repo, "mrhz1973/other-repo");
});

await test("G PASS clears episode once; later same gate can send again", () => {
  const a1 = decide(actionable());
  assert.equal(a1.dedupe_action, "SEND");
  const resolved = decide(passTick(), stateFor(a1));
  assert.equal(resolved.dedupe_action, "CLEAR");
  assert.equal(resolved.dedupe_reason, "PASS_RESOLVES_EPISODE");
  const a2 = decide(actionable(), []);
  assert.equal(a2.dedupe_action, "SEND");
  assert.equal(a2.dedupe_reason, "NEW_ACTIONABLE_EPISODE");
});

await test("H state-read failure fails open to send", () => {
  const out = decide(actionable(), [{ error: "sanitized state read failure" }]);
  assert.equal(out.dedupe_action, "SEND");
  assert.equal(out.dedupe_reason, "STATE_READ_FAILED_FAIL_OPEN");
  assert.equal(out.dedupe_state_read_ok, false);
});

await test("I persist failure leaves no state so next identical gate re-sends", () => {
  const a1 = decide(actionable());
  assert.equal(a1.dedupe_action, "SEND");
  // Persist never wrote — next tick sees empty rows.
  const a2 = decide(actionable(), []);
  assert.equal(a2.dedupe_action, "SEND");
  assert.equal(a2.dedupe_reason, "NEW_ACTIONABLE_EPISODE");
});

await test("J restart simulation with persisted signature suppresses", () => {
  const a1 = decide(actionable());
  const afterRestart = decide(actionable({ request_id: "after-restart" }), stateFor(a1));
  assert.equal(afterRestart.dedupe_action, "SUPPRESS");
});

await test("K request_id/timestamp do not change signature", () => {
  const first = decide(actionable({ request_id: "r-1", tick_completed_at: "t-1" }));
  const later = decide(actionable({ request_id: "r-2", tick_completed_at: "t-2" }), stateFor(first));
  assert.equal(later.dedupe_action, "SUPPRESS");
  assert.equal(later.alert_signature, first.alert_signature);
});

await test("stable signature fields exclude volatile gate_summary", () => {
  const out = decide(actionable());
  assert.deepEqual(Object.keys(JSON.parse(out.alert_signature)), [...DEDUPE_SIGNATURE_FIELDS]);
  assert.equal(out.dedupe_state_key, STATE_KEY);
  assert.doesNotMatch(out.alert_signature, /file\(s\)/);
});

await test("IDLE/BUSY without prior episode keep without clear", () => {
  assert.equal(decide(idle()).dedupe_action, "KEEP_EPISODE");
  assert.equal(decide(busy()).dedupe_action, "KEEP_EPISODE");
});

await test("STOP classification change from HUMAN_GATE is a new actionable send", () => {
  const a1 = decide(actionable());
  const stop = decide({
    classification: "WORK_EXECUTED_STOP",
    task_ref: "LOCAL_DEV_B_D-0103-F005",
    human_gate_required: false,
    gate_summary: null,
    reason_codes: ["BOUNDS_TIMEBOX_EXPIRED"],
    notify_required: true,
  }, stateFor(a1));
  assert.equal(stop.dedupe_action, "SEND");
  assert.equal(stop.dedupe_reason, "CHANGED_ACTIONABLE_STATE");
});

const failed = failures.length;
console.log(JSON.stringify({ ok: failed === 0, passed, failed, total: passed + failed }));
process.exitCode = failed ? 1 : 0;
