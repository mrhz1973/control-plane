#!/usr/bin/env node
/**
 * Deterministic test suite for V4_CURSOR_ACP_MCP_HUMAN_GATE_MINIMAL_SLICE_IMPLEMENTATION_V1.
 * Local/synthetic transport ONLY — no real Telegram send, no credential use.
 *
 * Proves: MCP_SERVER_START, HUMAN_GATE_TOOL_DISCOVERABLE, HUMAN_GATE_SCHEMA_VALIDATION,
 * GATE_STATE_MACHINE, CALLBACK_BINDING, all negative fences, NO_DEFAULT_ANSWER,
 * adapter-cannot-self-authorize, synthetic valid callback returns the option
 * through the MCP tool result. ACP_MCP_WIRING runs the real-session probe
 * (bounded, no gate dispatch).
 */
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  computeDecisionId, sha12, validateHumanGateInput,
  registerGateDecision, markNotified, admitGateCallback, markReturned, markConsumed, markNoAnswer,
  loadGateStore, persistGateStore, GATE_STORE_SCHEMA,
} from "../../tools/v4-cursor-acp-gate-core-v1.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const SERVER = path.join(ROOT, "tools", "v4-cursor-acp-mcp-human-gate-server-v1.mjs");
const T_VALID = path.join(ROOT, "tests", "v4-cursor-acp-mcp-gate", "transport-synthetic-valid.mjs");
const T_SILENT = path.join(ROOT, "tests", "v4-cursor-acp-mcp-gate", "transport-synthetic-silent.mjs");

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`); };

function tmpdir() { return fs.mkdtempSync(path.join(os.tmpdir(), "acp-gate-test-")); }

function rpc(server, method, params, timeoutMs = 20000) {
  const id = Math.floor(Math.random() * 1e9);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`rpc timeout: ${method}`)), timeoutMs);
    server.once("message", function h(msg) {
      if (msg.id !== id) { server.once("message", h); return; }
      clearTimeout(t);
      resolve(msg);
    });
    server.send({ jsonrpc: "2.0", id, method, params });
  });
}

function startServer(env) {
  const child = spawn(process.execPath, [SERVER], { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, ...env } });
  child.stdout.setEncoding("utf8");
  let outBuf = "";
  const bus = new EventEmitter();
  child.stdout.on("data", (d) => {
    outBuf += d;
    let i;
    while ((i = outBuf.indexOf("\n")) >= 0) {
      const line = outBuf.slice(0, i);
      outBuf = outBuf.slice(i + 1);
      if (!line.trim()) continue;
      try { bus.emit("message", JSON.parse(line)); } catch { /* ignore malformed */ }
    }
  });
  child.stderr.on("data", () => { /* sanitized; nothing expected */ });
  child.send = (msg) => { child.stdin.write(JSON.stringify(msg) + "\n"); };
  child.once = ((orig) => (ev, fn) => ev === "message" ? bus.once("message", fn) : orig.call(child, ev, fn))(child.once.bind(child));
  return child;
}

const TASK_REF = "V4_CURSOR_ACP_MCP_HUMAN_GATE_MINIMAL_SLICE_IMPLEMENTATION_V1";
const RUN_ID = "testrun0001";

async function testMcpServerStart() {
  const store = path.join(tmpdir(), "gate-store.json");
  const spool = tmpdir();
  const child = startServer({ ACP_GATE_STORE_PATH: store, ACP_GATE_SPOOL_DIR: spool, ACP_GATE_TRANSPORT_MODULE: T_VALID, ACP_GATE_TTL_MS: "15000" });
  try {
    const init = await rpc(child, "initialize", { protocolVersion: "2024-11-05" });
    const okStart = init.result?.serverInfo?.name === "v4-cursor-acp-human-gate" && fs.existsSync(path.join(spool, "server-started.marker"));
    check("MCP_SERVER_START", !!okStart, init.result?.serverInfo?.name ?? "no result");

    const list = await rpc(child, "tools/list", {});
    const tools = list.result?.tools ?? [];
    const gate = tools.find((t) => t.name === "human_gate");
    const onlyOne = tools.length === 1;
    const schemaOk = gate?.inputSchema?.properties?.question?.properties?.options?.items?.enum?.join("") === "ABC"
      && gate.inputSchema.required.includes("task_ref") && gate.inputSchema.required.includes("generation");
    check("HUMAN_GATE_TOOL_DISCOVERABLE", !!gate && onlyOne, `${tools.length} tool(s)`);
    check("HUMAN_GATE_SCHEMA_VALIDATION", !!schemaOk, "inputSchema enforces A/B/C + required fields");
  } finally { child.kill(); }
}

async function testSchemaValidationUnit() {
  const base = { task_ref: TASK_REF, run_id: RUN_ID, generation: 1, question: { prompt: "Pick one.", options: ["A", "B", "C"] } };
  check("SCHEMA_OK_ACCEPTS_VALID", validateHumanGateInput(base).ok === true);
  const cases = [
    ["missing_task_ref", { ...base, task_ref: undefined }],
    ["bad_generation_zero", { ...base, generation: 0 }],
    ["two_options", { ...base, question: { prompt: "x", options: ["A", "B"] } }],
    ["four_options", { ...base, question: { prompt: "x", options: ["A", "B", "C", "D"] } }],
    ["wrong_letters", { ...base, question: { prompt: "x", options: ["1", "2", "3"] } }],
    ["empty_prompt", { ...base, question: { prompt: "", options: ["A", "B", "C"] } }],
  ];
  for (const [label, input] of cases) check(`SCHEMA_REJECT_${label}`, validateHumanGateInput(input).ok === false);
}

async function testStateMachineAndFences() {
  const storePath = path.join(tmpdir(), "gate-store.json");
  const sessionId = "0f2a6cf2-1111-4c1c-9f6e-5a9b0c1d2e3f";
  const generation = 3;

  let store = loadGateStore(storePath);
  check("STORE_SCHEMA_DEFAULT", store.schema_version === GATE_STORE_SCHEMA);

  const decision = registerGateDecision(store, {
    taskRef: TASK_REF, runId: RUN_ID, sessionId, generation,
    question: { prompt: "Pick one.", options: ["A", "B", "C"] }, ttlMs: 15000, nowMs: Date.now(),
  });
  check("GATE_STATE_REGISTERED", decision.state === "REGISTERED");
  check("DECISION_ID_BINDING", decision.decision_id === computeDecisionId({ taskRef: TASK_REF, runId: RUN_ID, sessionIdSha: sha12(sessionId), generation })
    && decision.session_id_sha === sha12(sessionId) && decision.generation === generation && decision.task_ref === TASK_REF && decision.run_id === RUN_ID,
    `id=${decision.decision_id}`);

  const nid = markNotified(store, decision.decision_id, { transport: "synthetic", messageId: "m-1" });
  check("GATE_STATE_NOTIFIED", nid.ok === true && nid.decision.state === "NOTIFIED");
  persistGateStore(store, storePath);

  // happy path on a SECOND decision (leave the first for fence tests)
  const store2 = loadGateStore(storePath);
  const d2 = registerGateDecision(store2, { taskRef: TASK_REF, runId: RUN_ID + "B", sessionId, generation: 1, question: { prompt: "Pick one.", options: ["A", "B", "C"] }, ttlMs: 15000 });
  markNotified(store2, d2.decision_id, { transport: "synthetic", messageId: "m-2" });
  const ok1 = admitGateCallback(store2, { decision_id: d2.decision_id, option: "B", update_id: "u-1" }, { taskRef: TASK_REF, sessionId, generation: 1 });
  check("CALLBACK_BINDING_HAPPY", ok1.ok === true && ok1.decision.selected_option === "B" && ok1.decision.state === "VERIFIED");
  check("GATE_STATE_RETURNED", markReturned(store2, d2.decision_id).ok === true);
  check("GATE_STATE_CONSUMED", markConsumed(store2, d2.decision_id).ok === true);
  persistGateStore(store2, storePath);

  // duplicate: same update_id replay on consumed decision
  const dup = admitGateCallback(loadGateStore(storePath), { decision_id: d2.decision_id, option: "B", update_id: "u-1" }, { taskRef: TASK_REF, sessionId, generation: 1 });
  check("DUPLICATE_CALLBACK_REJECTED", dup.ok === false && (dup.reason === "GATE_UPDATE_REUSED" || dup.reason === "GATE_DECISION_ALREADY_CONSUMED"), dup.reason);

  // stale: expired decision
  const store3 = loadGateStore(storePath);
  const d3 = registerGateDecision(store3, { taskRef: TASK_REF, runId: RUN_ID + "C", sessionId, generation: 1, question: { prompt: "x", options: ["A", "B", "C"] }, ttlMs: 1000, nowMs: Date.now() - 5000 });
  markNotified(store3, d3.decision_id, { transport: "synthetic", messageId: "m-3" });
  persistGateStore(store3, storePath);
  const stale = admitGateCallback(loadGateStore(storePath), { decision_id: d3.decision_id, option: "A", update_id: "u-9" }, { taskRef: TASK_REF, sessionId, generation: 1 });
  check("STALE_CALLBACK_REJECTED", stale.ok === false && stale.reason === "GATE_DECISION_EXPIRED", stale.reason);

  // wrong task / session / generation / invalid option on the FIRST decision
  const S = loadGateStore(storePath);
  const wrongTask = admitGateCallback(S, { decision_id: decision.decision_id, option: "A", update_id: "u-a" }, { taskRef: "OTHER_TASK", sessionId, generation });
  const wrongSession = admitGateCallback(S, { decision_id: decision.decision_id, option: "A", update_id: "u-b" }, { taskRef: TASK_REF, sessionId: "99999999-9999-4999-8999-999999999999", generation });
  const wrongGen = admitGateCallback(S, { decision_id: decision.decision_id, option: "A", update_id: "u-c" }, { taskRef: TASK_REF, sessionId, generation: generation + 1 });
  const invalidOpt = admitGateCallback(S, { decision_id: decision.decision_id, option: "Z", update_id: "u-d" }, { taskRef: TASK_REF, sessionId, generation });
  const unknown = admitGateCallback(S, { decision_id: "ACP-GATE-DOESNOTEXIST", option: "A", update_id: "u-e" }, { taskRef: TASK_REF, sessionId, generation });
  persistGateStore(S, storePath);
  check("WRONG_TASK_REJECTED", wrongTask.ok === false && wrongTask.reason === "GATE_TASK_MISMATCH", wrongTask.reason);
  check("WRONG_SESSION_REJECTED", wrongSession.ok === false && wrongSession.reason === "GATE_SESSION_MISMATCH", wrongSession.reason);
  check("WRONG_GENERATION_REJECTED", wrongGen.ok === false && wrongGen.reason === "GATE_GENERATION_MISMATCH", wrongGen.reason);
  check("INVALID_OPTION_REJECTED", invalidOpt.ok === false && invalidOpt.reason === "GATE_ANSWER_INVALID", invalidOpt.reason);
  check("UNKNOWN_DECISION_REJECTED", unknown.ok === false && unknown.reason === "GATE_DECISION_UNKNOWN", unknown.reason);
  const S2 = loadGateStore(storePath);
  const untouched = S2.decisions.find((x) => x.decision_id === decision.decision_id).state === "NOTIFIED";
  check("FENCES_LEAVE_DECISION_UNTOUCHED", untouched === true);

  // no default answer: TTL elapse -> NO_ANSWER, no option ever materializes
  const na = markNoAnswer(loadGateStore(storePath), decision.decision_id);
  check("NO_DEFAULT_ANSWER", na.ok === true && na.decision.state === "NO_ANSWER" && na.decision.selected_option === null, na.decision.state);
}

async function testAdapterEndToEndSynthetic() {
  // Full adapter flow with synthetic transport: tool result returns the option.
  const store = path.join(tmpdir(), "gate-store.json");
  const spool = tmpdir();
  fs.writeFileSync(path.join(spool, "binding.json"), JSON.stringify({ session_id: "aaaa1111-2222-4333-8444-555566667777", session_id_sha: sha12("aaaa1111-2222-4333-8444-555566667777") }));
  const child = startServer({
    ACP_GATE_STORE_PATH: store, ACP_GATE_SPOOL_DIR: spool, ACP_GATE_TRANSPORT_MODULE: T_VALID, ACP_GATE_TTL_MS: "15000",
    TEST_SYNTHETIC_OPTION: "C",
  });
  try {
    await rpc(child, "initialize", { protocolVersion: "2024-11-05" });
    const call = await rpc(child, "tools/call", { name: "human_gate", arguments: { task_ref: TASK_REF, run_id: "synth-1", generation: 1, question: { prompt: "Pick one.", options: ["A", "B", "C"] } } });
    const out = JSON.parse(call.result?.content?.[0]?.text ?? "{}");
    check("ADAPTER_SYNTHETIC_ANSWERED", out.status === "answered" && out.option === "C", `status=${out.status} option=${out.option}`);
    // adapter cannot self-authorize: without binding or transport it errors
    const spool2 = tmpdir(); // no binding.json
    const child2 = startServer({ ACP_GATE_STORE_PATH: path.join(tmpdir(), "gs2.json"), ACP_GATE_SPOOL_DIR: spool2, ACP_GATE_TRANSPORT_MODULE: T_VALID });
    try {
      await rpc(child2, "initialize", { protocolVersion: "2024-11-05" });
      const call2 = await rpc(child2, "tools/call", { name: "human_gate", arguments: { task_ref: TASK_REF, run_id: "synth-2", generation: 1, question: { prompt: "x", options: ["A", "B", "C"] } } });
      const out2 = JSON.parse(call2.result?.content?.[0]?.text ?? "{}");
      check("ADAPTER_NO_BINDING_FAILS_CLOSED", out2.status === "error" && out2.reason === "SESSION_BINDING_MISSING", out2.reason ?? "?");
    } finally { child2.kill(); }

    // silent transport -> no_answer (never a default)
    const child3 = startServer({ ACP_GATE_STORE_PATH: path.join(tmpdir(), "gs3.json"), ACP_GATE_SPOOL_DIR: spool, ACP_GATE_TRANSPORT_MODULE: T_SILENT, ACP_GATE_TTL_MS: "15000" });
    try {
      await rpc(child3, "initialize", { protocolVersion: "2024-11-05" });
      const call3 = await rpc(child3, "tools/call", { name: "human_gate", arguments: { task_ref: TASK_REF, run_id: "synth-3", generation: 1, question: { prompt: "x", options: ["A", "B", "C"] } } });
      const out3 = JSON.parse(call3.result?.content?.[0]?.text ?? "{}");
      check("ADAPTER_SILENT_NO_ANSWER", out3.status === "no_answer" && out3.option === undefined, `status=${out3.status}`);
    } finally { child3.kill(); }

    // unknown tool rejected
    const call4 = await rpc(child, "tools/call", { name: "other_tool", arguments: {} });
    check("ADAPTER_UNKNOWN_TOOL_REJECTED", call4.result?.isError === true, "isError=true");
    const S = loadGateStore(store);
    const d = S.decisions.find((x) => x.run_id === "synth-1");
    check("ADAPTER_STATE_VERIFIED_RETURNED", d?.state === "RETURNED" && d.selected_option === "C", d?.state);
  } finally { child.kill(); }
}

async function testAcpWiring() {
  // Real ACP session wiring probe (no gate dispatch, no Telegram).
  const proc = spawn(process.execPath, [path.join(ROOT, "tools", "v4-cursor-acp-session-wiring-probe-v1.mjs")], { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  proc.stdout.on("data", (c) => (out += c));
  let err = "";
  proc.stderr.on("data", (c) => (err += c));
  const code = await new Promise((r) => proc.on("exit", r));
  let parsed = null;
  try { parsed = JSON.parse(out); } catch { /* include stderr in detail */ }
  check("ACP_MCP_WIRING", code === 0 && parsed?.ACP_MCP_WIRING === "PASS" && parsed?.SAME_SESSION_GUARD === "PASS", code === 0 ? `session_sha=${parsed?.session_id_sha}` : err.slice(0, 160));
  if (parsed) fs.writeFileSync(path.join(ROOT, "reports", "runtime", "cursor-acp", "mcp-gate-wiring-result.json"), JSON.stringify(parsed, null, 2));
}

const t0 = Date.now();
await testMcpServerStart();
await testSchemaValidationUnit();
await testStateMachineAndFences();
await testAdapterEndToEndSynthetic();
await testAcpWiring();
const ms = Date.now() - t0;

const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
console.log(`\n${pass}/${results.length} PASS, ${fail} FAIL (${ms} ms) — deterministic, synthetic transport only`);
fs.mkdirSync(path.join(ROOT, "reports", "runtime", "cursor-acp"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "reports", "runtime", "cursor-acp", "mcp-gate-suite-results.json"), JSON.stringify({
  task_ref: TASK_REF, ran_at: new Date().toISOString(), duration_ms: ms,
  totals: { pass, fail }, results,
  claims: { TELEGRAM_E2E: "NOT_CLAIMED", REAL_OPERATOR_CALLBACK: "NOT_CLAIMED" },
}, null, 2));
process.exit(fail === 0 ? 0 : 1);
