#!/usr/bin/env node
/**
 * V4_WF90_HTTP409_NORMALIZATION_FIX_V1 — focused offline tests.
 *
 * Proves the WF90 "Code - Normalize LOCAL_DEV tick result" node (deployed
 * from workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json):
 *   1. legacy shapes still normalize (direct JSON / raw.body object / raw.body string);
 *   2. a schema-valid local-dev-dispatch-tick-result-v1 embedded in an
 *      n8n/Axios error envelope (error.message = "<status> - <json>") is
 *      recovered and normalized exactly like a 2xx response (HTTP 409
 *      HUMAN_GATE_REQUIRED regression fixture);
 *   3. HTTP status alone NEVER infers HUMAN_GATE_REQUIRED (body is authority);
 *   4. malformed/absent error payloads stay fail-closed SERVICE_ERROR.
 *
 * The node code is evaluated with a mock $input — no n8n, no network,
 * no workflow apply, no Telegram.
 *
 * Run: node tests/wf90-axios-409-normalizer/run.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const ARTIFACT = join(ROOT, "workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json");
const NODE_NAME = "Code - Normalize LOCAL_DEV tick result";

const artifact = JSON.parse(readFileSync(ARTIFACT, "utf8").replace(/^\uFEFF/, ""));
const normalizerNode = artifact.nodes.find((n) => n.name === NODE_NAME);
assert.ok(normalizerNode, `workflow artifact must contain node "${NODE_NAME}"`);
assert.equal(normalizerNode.type, "n8n-nodes-base.code");
assert.equal(normalizerNode.parameters.mode, "runOnceForEachItem");

// Evaluate the deployed jsCode verbatim with a mock $input (single-item mode).
const normalize = (itemJson) => {
  const fn = new Function("$input", normalizerNode.parameters.jsCode);
  return fn({ item: { json: itemJson } }).json;
};

// Deployed artifact invariants (transport law unchanged; onError/alwaysOutputData are node-level keys).
const httpNode = artifact.nodes.find((n) => n.name === "HTTP Request - LOCAL_DEV dispatcher tick");
assert.ok(httpNode, "workflow artifact must contain the tick HTTP Request node");
assert.equal(httpNode.type, "n8n-nodes-base.httpRequest");
assert.equal(httpNode.onError, "continueRegularOutput");
assert.equal(httpNode.alwaysOutputData, true);

// Canonical dispatcher result shape (tools/serve-local-dev-autonomous-dispatcher-v1.mjs wrapTickResult).
const tickResult = (partial = {}) => ({
  schema_version: "local-dev-dispatch-tick-result-v1",
  ok: false,
  request_id: "TICK-REGRESSION",
  classification: "SERVICE_ERROR",
  execution_performed: false,
  task_ref: null,
  executor_classification: null,
  human_gate_required: false,
  gate_summary: null,
  reason_codes: [],
  ...partial,
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

// ---------------------------------------------------------------------------
// 1. Legacy shapes preserved.
// ---------------------------------------------------------------------------
await test("legacy-direct-json-object-normalizes", () => {
  const body = tickResult({ classification: "WORK_EXECUTED_PASS", ok: true, execution_performed: true, task_ref: "T-1" });
  const out = normalize(body);
  assert.equal(out.response_valid, true);
  assert.equal(out.classification, "WORK_EXECUTED_PASS");
  assert.equal(out.execution_performed, true);
  assert.equal(out.task_ref, "T-1");
  assert.equal(out.notify_required, false);
});

await test("legacy-raw-body-object-normalizes", () => {
  const body = tickResult({ classification: "IDLE_CLEAN", ok: true });
  const out = normalize({ body });
  assert.equal(out.response_valid, true);
  assert.equal(out.classification, "IDLE_CLEAN");
  assert.equal(out.notify_required, false);
});

await test("legacy-raw-body-json-string-normalizes", () => {
  const body = tickResult({ classification: "BUSY", ok: true });
  const out = normalize({ body: JSON.stringify(body) });
  assert.equal(out.response_valid, true);
  assert.equal(out.classification, "BUSY");
  assert.equal(out.notify_required, false);
});

// ---------------------------------------------------------------------------
// 2. Exact regression fixture: AxiosError 409 embedding a valid dispatcher
//    HUMAN_GATE_REQUIRED result (proven live failure shape).
// ---------------------------------------------------------------------------
await test("axios-409-embedded-human-gate-result-recovered-exactly", () => {
  const dispatcher = tickResult({
    classification: "HUMAN_GATE_REQUIRED",
    human_gate_required: true,
    gate_summary: "tracked dirty: 7 file(s)",
    reason_codes: ["TRACKED_DIRTY_CONFLICT"],
  });
  const envelope = {
    error: {
      name: "AxiosError",
      code: "ERR_BAD_REQUEST",
      status: 409,
      message: `409 - ${JSON.stringify(dispatcher)}`,
    },
  };
  const out = normalize(envelope);
  assert.equal(out.response_valid, true);
  assert.equal(out.classification, "HUMAN_GATE_REQUIRED");
  assert.equal(out.human_gate_required, true);
  assert.equal(out.gate_summary, "tracked dirty: 7 file(s)");
  assert.deepEqual(out.reason_codes, ["TRACKED_DIRTY_CONFLICT"]);
  assert.equal(out.execution_performed, false);
  assert.equal(out.task_ref, null);
  assert.equal(out.notify_required, true);
});

await test("axios-409-double-encoded-json-string-payload-recovered", () => {
  const dispatcher = tickResult({ classification: "WORK_EXECUTED_STOP", human_gate_required: false, task_ref: "T-2" });
  const envelope = { error: { status: 409, message: `409 - ${JSON.stringify(JSON.stringify(dispatcher))}` } };
  const out = normalize(envelope);
  assert.equal(out.response_valid, true);
  assert.equal(out.classification, "WORK_EXECUTED_STOP");
  assert.equal(out.task_ref, "T-2");
  assert.equal(out.notify_required, true);
});

// ---------------------------------------------------------------------------
// 3. Dispatcher body remains the authority: status NEVER infers the gate.
// ---------------------------------------------------------------------------
await test("error-status-alone-never-infers-human-gate", () => {
  // 409 envelope whose embedded payload is a healthy IDLE_CLEAN result.
  const dispatcher = tickResult({ classification: "IDLE_CLEAN", ok: true });
  const envelope = { error: { status: 409, message: `409 - ${JSON.stringify(dispatcher)}` } };
  const out = normalize(envelope);
  assert.equal(out.response_valid, true);
  assert.equal(out.classification, "IDLE_CLEAN");
  assert.equal(out.human_gate_required, false);
  assert.equal(out.gate_summary, null);
});

await test("schema-invalid-embedded-object-never-becomes-gate", () => {
  // Object parses but fails schema/classification validation → fail closed.
  const envelope = { error: { status: 409, message: '409 - {"schema_version":"local-dev-dispatch-tick-result-v1"}' } };
  const out = normalize(envelope);
  assert.equal(out.response_valid, false);
  assert.equal(out.classification, "SERVICE_ERROR");
  assert.equal(out.human_gate_required, false);
  assert.equal(out.gate_summary, null);
  assert.deepEqual(out.reason_codes, []);
});

// ---------------------------------------------------------------------------
// 4. Malformed error.message stays fail-closed SERVICE_ERROR.
// ---------------------------------------------------------------------------
await test("malformed-error-message-json-stays-service-error", () => {
  const out = normalize({ error: { status: 409, message: "409 - {not json" } });
  assert.equal(out.response_valid, false);
  assert.equal(out.classification, "SERVICE_ERROR");
  assert.equal(out.human_gate_required, false);
  assert.equal(out.gate_summary, null);
  assert.deepEqual(out.reason_codes, []);
  assert.equal(out.notify_required, true);
});

await test("string-only-payload-stays-service-error", () => {
  const out = normalize({ error: { status: 409, message: '409 - "tracked dirty: 7 file(s)"' } });
  assert.equal(out.response_valid, false);
  assert.equal(out.classification, "SERVICE_ERROR");
  assert.equal(out.notify_required, true);
});

await test("error-message-without-separator-stays-service-error", () => {
  const out = normalize({ error: { status: 409, message: "409 upstream timeout" } });
  assert.equal(out.response_valid, false);
  assert.equal(out.classification, "SERVICE_ERROR");
});

await test("error-without-message-stays-service-error", () => {
  const out = normalize({ error: { status: 409 } });
  assert.equal(out.response_valid, false);
  assert.equal(out.classification, "SERVICE_ERROR");
});

// ---------------------------------------------------------------------------
// 5. #76-C — surface executor_classification (CONTEXT / MAX_TURNS) + Telegram/terminal bounds.
// ---------------------------------------------------------------------------
await test("stop-context-window-exceeded-executor-classification-preserved", () => {
  const body = tickResult({
    classification: "WORK_EXECUTED_STOP",
    ok: true,
    execution_performed: true,
    task_ref: "LOCAL_DEV_B_D-76C-CTX",
    executor_classification: "STOP:CONTEXT_WINDOW_EXCEEDED",
    reason_codes: ["CONTEXT_WINDOW_EXCEEDED"],
    gate_summary: "CONTEXT_WINDOW_EXCEEDED",
  });
  const out = normalize(body);
  assert.equal(out.response_valid, true);
  assert.equal(out.classification, "WORK_EXECUTED_STOP");
  assert.equal(out.notify_required, true);
  assert.equal(out.executor_classification, "STOP:CONTEXT_WINDOW_EXCEEDED");
});

await test("stop-max-agent-turns-exceeded-executor-classification-preserved", () => {
  const body = tickResult({
    classification: "WORK_EXECUTED_STOP",
    ok: true,
    execution_performed: true,
    task_ref: "LOCAL_DEV_B_D-76C-TURNS",
    executor_classification: "STOP:MAX_AGENT_TURNS_EXCEEDED",
    reason_codes: ["MAX_AGENT_TURNS_EXCEEDED"],
    gate_summary: "MAX_AGENT_TURNS_EXCEEDED",
  });
  const out = normalize(body);
  assert.equal(out.response_valid, true);
  assert.equal(out.classification, "WORK_EXECUTED_STOP");
  assert.equal(out.notify_required, true);
  assert.equal(out.executor_classification, "STOP:MAX_AGENT_TURNS_EXCEEDED");
});

await test("pass-idle-busy-notification-policy-unchanged", () => {
  assert.equal(normalize(tickResult({ classification: "WORK_EXECUTED_PASS", ok: true, execution_performed: true })).notify_required, false);
  assert.equal(normalize(tickResult({ classification: "IDLE_CLEAN", ok: true })).notify_required, false);
  assert.equal(normalize(tickResult({ classification: "BUSY", ok: true })).notify_required, false);
});

const telegramNode = artifact.nodes.find((n) => n.name === "Telegram - LOCAL_DEV gate notification");
assert.ok(telegramNode, "workflow artifact must contain Telegram gate notification node");
const telegramExpr = String(telegramNode.parameters?.jsonBody ?? "");

const terminalNode = artifact.nodes.find((n) => n.name === "Code - LOCAL_DEV tick terminal");
assert.ok(terminalNode, "workflow artifact must contain LOCAL_DEV tick terminal node");
assert.equal(terminalNode.type, "n8n-nodes-base.code");
const terminalCode = String(terminalNode.parameters?.jsCode ?? "");

const runTerminal = (itemJson) => {
  const fn = new Function("$input", terminalCode);
  return fn({ item: { json: itemJson } }).json;
};

await test("telegram-expression-includes-executor-classification-with-none-fallback", () => {
  assert.match(telegramExpr, /executor_classification/);
  assert.match(telegramExpr, /executor:\s*'\s*\+\s*\(\$json\.executor_classification\s*\|\|\s*'NONE'\)/);
  assert.match(telegramExpr, /NONE/);
});

await test("terminal-preserves-executor-classification-and-reason-codes", () => {
  assert.match(terminalCode, /executor_classification/);
  assert.match(terminalCode, /reason_codes/);
  const out = runTerminal({
    classification: "WORK_EXECUTED_STOP",
    execution_performed: true,
    task_ref: "T-TERM",
    executor_classification: "STOP:CONTEXT_WINDOW_EXCEEDED",
    reason_codes: ["CONTEXT_WINDOW_EXCEEDED", "EXTRA"],
    human_gate_required: false,
    notify_required: true,
  });
  assert.equal(out.executor_classification, "STOP:CONTEXT_WINDOW_EXCEEDED");
  assert.deepEqual(out.reason_codes, ["CONTEXT_WINDOW_EXCEEDED", "EXTRA"]);
});

await test("terminal-reason-codes-capped-to-16", () => {
  assert.match(terminalCode, /\.slice\(\s*0\s*,\s*16\s*\)/);
  const codes = Array.from({ length: 20 }, (_, i) => `RC_${i}`);
  const out = runTerminal({ reason_codes: codes });
  assert.equal(out.reason_codes.length, 16);
  assert.deepEqual(out.reason_codes, codes.slice(0, 16));
});

await test("telegram-and-terminal-exclude-stdout-stderr-task-delta-prompt", () => {
  for (const forbidden of ["stdout", "stderr", "task_delta", "prompt"]) {
    assert.equal(telegramExpr.includes(forbidden), false, `telegram must not contain ${forbidden}`);
    assert.equal(terminalCode.includes(forbidden), false, `terminal must not contain ${forbidden}`);
  }
});

const failed = failures.length;
console.log(JSON.stringify({ ok: failed === 0, passed, failed, total: passed + failed }));
process.exitCode = failed ? 1 : 0;
