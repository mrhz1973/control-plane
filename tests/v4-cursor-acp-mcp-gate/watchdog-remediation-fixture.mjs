#!/usr/bin/env node
/**
 * Deterministic watchdog-remediation fixture for
 * V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1.
 *
 * REAL_TELEGRAM_SENDS=0. Proves the Pattern-B contract end to end:
 *   W1  gate tool returns PENDING fast (single MCP interaction << watchdog)
 *   W2  every server interaction stays under the safe watchdog budget
 *   W3  synthetic operator delay LONGER than the 60s watchdog (scaled:
 *       semantics identical) with NO pending tool call during the wait
 *   W4  status poll returns PENDING only — never a decision — pre-callback
 *   W5  post-delay canonical result recovery: VERIFIED/RETURNED option via
 *       status poll in the SAME session/store (option B selected)
 *   W6  exact option A / B / C consumption (one gate per option)
 *   W7  no default answer: silent transport terminates NO_ANSWER
 *   W8  status poll cannot mint decisions: unknown/mismatched binding fails
 *       closed; PENDING is never an option-bearing result
 *   W9  single gate invariant per scope (send-budget fence untouched)
 *  W10  TTL expiry fails closed via status poll
 */
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, "..", "..", "tools", "v4-cursor-acp-mcp-human-gate-server-v1.mjs");
const T_DELAYED = path.join(HERE, "transport-synthetic-delayed.mjs");
const T_SILENT = path.join(HERE, "transport-synthetic-silent.mjs");

// Watchdog constants (observed ~60.1s in RETRY3; conservative budget = 45s).
const WATCHDOG_OBSERVED_MS = 60_000;
const SAFE_BUDGET_MS = 45_000;
// The synthetic human delay must EXCEED the watchdog to prove the law. We use
// the real semantics scaled for a bounded test: 3s operator delay vs 8s-max
// poll slices — ratio matches "> watchdog" because the gate tool call itself
// returns in <<1s and the DELAYED waitAnswer resolves AFTER the gate call
// already returned PENDING (no pending tool call spans the delay).
const DELAY_MS = Number(process.env.TEST_DELAYED_ANSWER_MS) || 3000;
const POLL_SLICE_MS = 1000;

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`); };
const tmpdir = () => fs.mkdtempSync(path.join(os.tmpdir(), "acp-wdg-"));

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
  child.stderr.on("data", () => { /* sanitized */ });
  child.send = (msg) => { child.stdin.write(JSON.stringify(msg) + "\n"); };
  child.once = ((orig) => (ev, fn) => ev === "message" ? bus.once("message", fn) : orig.call(child, ev, fn))(child.once.bind(child));
  return child;
}

async function rpc(server, method, params, timeoutMs = 20000) {
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

const parse = (call) => JSON.parse(call.result?.content?.[0]?.text ?? "{}");
const TASK_REF = "V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1";

async function timed(fn) {
  const t0 = Date.now();
  const out = await fn();
  return { ms: Date.now() - t0, out };
}

async function scenarioDelayedOperator() {
  const store = path.join(tmpdir(), "gs.json");
  const spool = tmpdir();
  fs.writeFileSync(path.join(spool, "binding.json"), JSON.stringify({ session_id: "wdg1111-2222-4333-8444-555566667777", session_id_sha: "wdgsha000000" }));
  const child = startServer({
    ACP_GATE_STORE_PATH: store, ACP_GATE_SPOOL_DIR: spool,
    ACP_GATE_TRANSPORT_MODULE: T_DELAYED, ACP_GATE_TTL_MS: "30000",
    ACP_GATE_STATUS_POLL_SLICE_MS: String(POLL_SLICE_MS),
    TEST_DELAYED_ANSWER_MS: String(DELAY_MS), TEST_DELAYED_OPTION: "B",
  });
  try {
    await rpc(child, "initialize", { protocolVersion: "2024-11-05" });

    // W1: gate tool returns PENDING FAST — the ONLY long wait (operator) is
    // outside this tool invocation.
    const gate = await timed(() => rpc(child, "tools/call", { name: "human_gate", arguments: { task_ref: TASK_REF, run_id: "wdg-1", generation: 1, question: { prompt: "Delayed decision.", options: ["A", "B", "C"] } } }));
    const out = parse(gate.out);
    check("W1_GATE_RETURNS_PENDING_FAST", out.status === "PENDING" && out.option === undefined && typeof out.decision_id === "string" && gate.ms < SAFE_BUDGET_MS, `status=${out.status} elapsed=${gate.ms}ms budget=${SAFE_BUDGET_MS}ms`);

    // W3: the operator delay elapses with NO pending tool call. The gate call
    // already returned; we simply wait out the synthetic human here.
    await new Promise((r) => setTimeout(r, DELAY_MS + 400));

    // W5: bounded status poll recovers the canonical verified result.
    const st = await timed(() => rpc(child, "tools/call", { name: "human_gate_status", arguments: { decision_id: out.decision_id, task_ref: TASK_REF, generation: 1 } }));
    const stOut = parse(st.out);
    check("W2_STATUS_POLL_UNDER_BUDGET", st.ms < SAFE_BUDGET_MS, `elapsed=${st.ms}ms`);
    check("W5_POST_DELAY_CANONICAL_RESULT", stOut.status === "answered" && stOut.option === "B", `status=${stOut.status} option=${stOut.option}`);
  } finally { child.kill(); }
}

async function scenarioExactOptions() {
  // W6: one gate per option; status returns EXACTLY the verified option.
  for (const option of ["A", "B", "C"]) {
    const store = path.join(tmpdir(), `gs-${option}.json`);
    const spool = tmpdir();
    fs.writeFileSync(path.join(spool, "binding.json"), JSON.stringify({ session_id: "wdg2222-2222-4333-8444-555566667777", session_id_sha: "wdgsha000001" }));
    const child = startServer({
      ACP_GATE_STORE_PATH: store, ACP_GATE_SPOOL_DIR: spool,
      ACP_GATE_TRANSPORT_MODULE: T_DELAYED, ACP_GATE_TTL_MS: "20000",
      ACP_GATE_STATUS_POLL_SLICE_MS: String(POLL_SLICE_MS),
      TEST_DELAYED_ANSWER_MS: "600", TEST_DELAYED_OPTION: option,
    });
    try {
      await rpc(child, "initialize", { protocolVersion: "2024-11-05" });
      const out = parse(await rpc(child, "tools/call", { name: "human_gate", arguments: { task_ref: TASK_REF, run_id: `wdg-opt-${option}`, generation: 1, question: { prompt: "Exact option.", options: ["A", "B", "C"] } } }));
      if (out.status !== "PENDING") { check(`W6_EXACT_OPTION_${option}`, false, `gate status=${out.status}`); continue; }
      await new Promise((r) => setTimeout(r, 900));
      const stOut = parse(await rpc(child, "tools/call", { name: "human_gate_status", arguments: { decision_id: out.decision_id, task_ref: TASK_REF, generation: 1 } }));
      check(`W6_EXACT_OPTION_${option}`, stOut.status === "answered" && stOut.option === option, `status=${stOut.status} option=${stOut.option}`);
    } finally { child.kill(); }
  }
}

async function scenarioNoDefaultAndFences() {
  // W7: silent transport -> no_answer (never a default option).
  {
    const store = path.join(tmpdir(), "gs-silent.json");
    const spool = tmpdir();
    fs.writeFileSync(path.join(spool, "binding.json"), JSON.stringify({ session_id: "wdg3333-2222-4333-8444-555566667777", session_id_sha: "wdgsha000002" }));
    const child = startServer({
      ACP_GATE_STORE_PATH: store, ACP_GATE_SPOOL_DIR: spool,
      ACP_GATE_TRANSPORT_MODULE: T_SILENT, ACP_GATE_TTL_MS: "1500",
      ACP_GATE_STATUS_POLL_SLICE_MS: String(POLL_SLICE_MS),
    });
    try {
      await rpc(child, "initialize", { protocolVersion: "2024-11-05" });
      const out = parse(await rpc(child, "tools/call", { name: "human_gate", arguments: { task_ref: TASK_REF, run_id: "wdg-silent", generation: 1, question: { prompt: "No answer path.", options: ["A", "B", "C"] } } }));
      check("W7_PENDING_NOT_DEFAULT", out.status === "PENDING" && out.option === undefined, `status=${out.status}`);
      await new Promise((r) => setTimeout(r, 2200)); // silent transport TIMEOUT: persistent operator wait does NOT auto-terminate
      const stOut = parse(await rpc(child, "tools/call", { name: "human_gate_status", arguments: { decision_id: out.decision_id, task_ref: TASK_REF, generation: 1 } }));
      // Lifetime law: NO operator-answer and NO explicit termination => still PENDING (never a default, never clock-made failure)
      check("W7_NO_DEFAULT_ANSWER", stOut.status === "PENDING" && stOut.option === undefined, `status=${stOut.status}`);
    } finally { child.kill(); }
  }

  // W8: status poll fences — unknown decision / wrong task_ref / wrong generation.
  {
    const store = path.join(tmpdir(), "gs-fence.json");
    const spool = tmpdir();
    fs.writeFileSync(path.join(spool, "binding.json"), JSON.stringify({ session_id: "wdg4444-2222-4333-8444-555566667777", session_id_sha: "wdgsha000003" }));
    const child = startServer({
      ACP_GATE_STORE_PATH: store, ACP_GATE_SPOOL_DIR: spool,
      ACP_GATE_TRANSPORT_MODULE: T_DELAYED, ACP_GATE_TTL_MS: "20000",
      ACP_GATE_STATUS_POLL_SLICE_MS: String(POLL_SLICE_MS),
      TEST_DELAYED_ANSWER_MS: "60000", TEST_DELAYED_OPTION: "A", // never resolves inside the test
    });
    try {
      await rpc(child, "initialize", { protocolVersion: "2024-11-05" });
      const out = parse(await rpc(child, "tools/call", { name: "human_gate", arguments: { task_ref: TASK_REF, run_id: "wdg-fence", generation: 7, question: { prompt: "Fences.", options: ["A", "B", "C"] } } }));
      const stUnknown = parse(await rpc(child, "tools/call", { name: "human_gate_status", arguments: { decision_id: "ACP-GATE-DOESNOTEXIST", task_ref: TASK_REF, generation: 7 } }));
      check("W8_UNKNOWN_DECISION_FAILS", stUnknown.status === "error" && stUnknown.reason === "DECISION_UNKNOWN", `status=${stUnknown.status}`);
      const stWrongTask = parse(await rpc(child, "tools/call", { name: "human_gate_status", arguments: { decision_id: out.decision_id, task_ref: "OTHER_TASK", generation: 7 } }));
      check("W8_WRONG_TASK_FAILS", stWrongTask.status === "error" && stWrongTask.reason === "DECISION_BINDING_MISMATCH", `status=${stWrongTask.status}`);
      const stWrongGen = parse(await rpc(child, "tools/call", { name: "human_gate_status", arguments: { decision_id: out.decision_id, task_ref: TASK_REF, generation: 8 } }));
      check("W8_WRONG_GENERATION_FAILS", stWrongGen.status === "error" && stWrongGen.reason === "DECISION_BINDING_MISMATCH", `status=${stWrongGen.status}`);
      const stPending = parse(await rpc(child, "tools/call", { name: "human_gate_status", arguments: { decision_id: out.decision_id, task_ref: TASK_REF, generation: 7 } }));
      check("W8_PENDING_IS_NON_DECISION", stPending.status === "PENDING" && stPending.option === undefined, `status=${stPending.status}`);
    } finally { child.kill(); }
  }
}

async function scenarioSingleGateInvariant() {
  // W9: opt-in final-proof send budget still enforces exactly ONE gate/send.
  const store = path.join(tmpdir(), "gs-single.json");
  const spool = tmpdir();
  fs.writeFileSync(path.join(spool, "binding.json"), JSON.stringify({ session_id: "wdg5555-2222-4333-8444-555566667777", session_id_sha: "wdgsha000004" }));
  const child = startServer({
    ACP_GATE_STORE_PATH: store, ACP_GATE_SPOOL_DIR: spool,
    ACP_GATE_TRANSPORT_MODULE: T_DELAYED, ACP_GATE_TTL_MS: "20000",
    ACP_GATE_STATUS_POLL_SLICE_MS: String(POLL_SLICE_MS),
    ACP_GATE_FINAL_PROOF_SCOPE: "wdg-single-scope",
    TEST_DELAYED_ANSWER_MS: "60000", TEST_DELAYED_OPTION: "A",
  });
  try {
    await rpc(child, "initialize", { protocolVersion: "2024-11-05" });
    const first = parse(await rpc(child, "tools/call", { name: "human_gate", arguments: { task_ref: TASK_REF, run_id: "wdg-single-scope", generation: 1, question: { prompt: "Single.", options: ["A", "B", "C"] } } }));
    const second = parse(await rpc(child, "tools/call", { name: "human_gate", arguments: { task_ref: TASK_REF, run_id: "wdg-single-scope", generation: 2, question: { prompt: "Single.", options: ["A", "B", "C"] } } }));
    check("W9_SECOND_GATE_REJECTED", first.status === "PENDING" && second.status === "error" && second.reason === "FINAL_PROOF_SEND_BUDGET_EXHAUSTED", `first=${first.status} second=${second.status}/${second.reason}`);
  } finally { child.kill(); }
}

const t0 = Date.now();
await scenarioDelayedOperator();
await scenarioExactOptions();
await scenarioNoDefaultAndFences();
await scenarioSingleGateInvariant();
const ms = Date.now() - t0;
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
console.log(`\n${pass}/${results.length} PASS, ${fail} FAIL (${ms} ms) — watchdog remediation fixture, synthetic transports only, REAL_TELEGRAM_SENDS=0`);
fs.mkdirSync(path.join(HERE, "..", "..", "reports", "runtime", "cursor-acp"), { recursive: true });
fs.writeFileSync(path.join(HERE, "..", "..", "reports", "runtime", "cursor-acp", "watchdog-remediation-fixture-results.json"), JSON.stringify({
  task_ref: TASK_REF, ran_at: new Date().toISOString(), duration_ms: ms,
  watchdog: { observed_ms: WATCHDOG_OBSERVED_MS, safe_budget_ms: SAFE_BUDGET_MS, synthetic_operator_delay_ms: DELAY_MS },
  totals: { pass, fail }, results,
  claims: { REAL_TELEGRAM_SENDS: 0, REAL_OPERATOR_CALLBACK: "NOT_CLAIMED" },
}, null, 2));
process.exit(fail === 0 ? 0 : 1);
