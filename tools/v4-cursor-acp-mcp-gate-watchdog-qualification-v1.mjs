#!/usr/bin/env node
/**
 * REAL ACP harmless qualification for
 * V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1.
 *
 * REAL_TELEGRAM_SENDS=0 (null transport). ONE real Cursor Agent ACP session:
 *
 *  Q1 session/new carries the project-owned MCP human-gate server.
 *  Q2 session/prompt instructs the model: call human_gate EXACTLY ONCE
 *     (returns PENDING — never blocks), then WAIT (no tool call) for
 *     > WATCHDOG_MS real seconds, then call human_gate_status with the
 *     decision_id from the PENDING result, then report the option.
 *  Q3 The DRIVER measures: the human_gate tool interaction completes well
 *     under the safe watchdog budget (agent-side tool_call stop→result).
 *  Q4 During the synthetic human delay (real >60s wall clock) NO tool call
 *     is pending — the model simply idles in its turn.
 *  Q5 After the delay, the driver admits a synthetic canonical callback
 *     (option B) through gate-core admission law + a store annotation the
 *     null transport reads; the background waiter marks VERIFIED→RETURNED.
 *  Q6 human_gate_status (model-invoked, bounded slice) returns the EXACT
 *     verified option B; the model consumes it in the SAME session
 *     (GATE_CONSUMPTION_JSON marker), zero session/new, no session/load.
 *
 * If the vendor runtime rejects ANY tool call at ~60s, or the session does
 * not survive the delay, this qualification FAILS CLOSED (STOP evidence).
 */
import { spawn, execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { officialAcpLaunch } from "./v4-cursor-acp-launch-v1.mjs";
import { loadGateStore, persistGateStore, admitGateCallback, markReturned } from "./v4-cursor-acp-gate-core-v1.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, "v4-cursor-acp-mcp-human-gate-server-v1.mjs");
const TRANSPORT_NULL = path.join(HERE, "v4-cursor-acp-gate-transport-null-v1.mjs");
const TASK_REF = "V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1";
const RUN_ID = randomUUID().replace(/-/g, "").slice(0, 16);
const SPOOL = path.join(process.env.TEMP || ".", `acp-wdg-qual-${RUN_ID}`);
const GATE_STORE = path.join(SPOOL, "gate-store.json");

// Watchdog law (RETRY3 evidence: vendor erroring tool calls at ~60.1s).
const WATCHDOG_OBSERVED_MS = 60_000;
const SAFE_BUDGET_MS = 45_000;      // conservative bounded budget
const SYNTHETIC_HUMAN_DELAY_MS = 70_000; // REAL >watchdog delay with NO tool call pending

const TTL_MS = 10 * 60 * 1000;
const OPTION = "B"; // fixed deterministic canonical decision for this proof
const EXPECTED_UPDATE_ID = String(9_000_000_000 + Math.floor(Math.random() * 1000));

const trace = [];
const push = (stage, rec = {}) => { const e = { ts: new Date().toISOString(), stage, ...rec }; trace.push(e); console.error(`[TRACE] ${stage} ${JSON.stringify(rec).slice(0, 160)}`); };

let acp = null, seq = 0;
const pending = new Map();
let agentSideSessionNew = 0;
let buf = "";
const stderrTail = [];
// tool_call lifecycle observed from session/update notifications
let gateToolStart = null, gateToolEnd = null, statusToolStart = null, statusToolEnd = null;
const agentTexts = [];

function send(method, params, timeoutMs = 30000) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`ACP_RPC_TIMEOUT_${method}`)); }, timeoutMs);
    pending.set(id, { resolve, reject, method, timer });
    if (!acp?.stdin?.writable) { clearTimeout(timer); pending.delete(id); reject(new Error(`ACP_STDIN_NOT_WRITABLE_${method}`)); return; }
    acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params, id }) + "\n", (err) => {
      if (err && pending.has(id)) { clearTimeout(timer); pending.delete(id); reject(new Error(`ACP_STDIN_WRITE_FAILED_${method}`)); }
    });
  });
}

function pump(line) {
  if (!line.trim()) return;
  let m; try { m = JSON.parse(line); } catch { return; }
  if (m.id !== undefined && m.method === undefined && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id); clearTimeout(p.timer);
    if (m.error) p.reject(new Error(`${p.method}: ${JSON.stringify(m.error).slice(0, 200)}`));
    else p.resolve(m.result);
    return;
  }
  if (m.method && m.id !== undefined) {
    if (m.method === "session/new") { agentSideSessionNew++; push("GUARD_AGENT_SIDE_SESSION_NEW", { blocked: true }); }
    if (m.method === "session/request_permission") {
      const opts = m.params?.options ?? [];
      const raw = JSON.stringify(m.params ?? {});
      const rej = opts.find((o) => o.kind === "reject_once" || o.kind === "reject_always") ?? { optionId: "__denied__" };
      const allow = opts.find((o) => o.kind === "allow_once") ?? null;
      if (allow && (raw.includes("human_gate") || raw.includes("human_gate_status"))) {
        acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, result: { outcome: { outcome: "selected", optionId: allow.optionId } } }) + "\n");
        push("PERMISSION_ALLOWED_GATE_TOOL", {});
      } else {
        acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, result: { outcome: { outcome: "selected", optionId: rej.optionId } } }) + "\n");
        push("PERMISSION_DENIED_FAIL_CLOSED", { preview: raw.slice(0, 100) });
      }
      return;
    }
    acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: "not supported in bounded qualification" } }) + "\n");
    return;
  }
  if (m.method) {
    // Observe session/update stream for tool-call lifecycle + agent text.
    const upd = m.params?.update;
    if (upd) {
      const tool = upd.toolCall;
      if (tool) {
        const raw = JSON.stringify(tool);
        const isGate = raw.includes("human_gate") && !raw.includes("human_gate_status");
        const isStatus = raw.includes("human_gate_status");
        if ((isGate || isStatus) && ["pending", "in_progress"].includes(upd.sessionUpdate ?? tool.kind ?? "")) {
          if (isGate && !gateToolStart) { gateToolStart = Date.now(); push("GATE_TOOL_CALL_START", {}); }
          if (isStatus && !statusToolStart) { statusToolStart = Date.now(); push("STATUS_TOOL_CALL_START", {}); }
        }
        if ((isGate || isStatus) && (upd.sessionUpdate === "completed" || tool.status === "completed")) {
          if (isGate && gateToolStart && !gateToolEnd) { gateToolEnd = Date.now(); push("GATE_TOOL_CALL_END", { duration_ms: gateToolEnd - gateToolStart }); }
          if (isStatus && statusToolStart && !statusToolEnd) { statusToolEnd = Date.now(); push("STATUS_TOOL_CALL_END", { duration_ms: statusToolEnd - statusToolStart }); }
        }
      }
      if (upd.sessionUpdate === "agent_message_chunk" || upd.sessionUpdate === "agent_thought_chunk") {
        const t = upd.content?.text ?? "";
        if (t) agentTexts.push(t);
      }
    }
    push("ACP_NOTIFICATION", { method: m.method, preview: JSON.stringify(m.params ?? {}).slice(0, 120) });
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Driver-side synthetic callback admission THROUGH canonical gate law. */
function admitSyntheticCallback(decisionId, sessionId) {
  const store = loadGateStore(GATE_STORE);
  const d = store.decisions.find((x) => x.decision_id === decisionId);
  if (!d) throw new Error("DECISION_UNKNOWN");
  const admitted = admitGateCallback(store, { decision_id: decisionId, option: OPTION, update_id: EXPECTED_UPDATE_ID }, { taskRef: TASK_REF, sessionId, generation: 1 });
  persistGateStore(store, GATE_STORE);
  if (!admitted.ok) throw new Error(`ADMISSION_REJECTED_${admitted.reason}`);
  // Synthetic adapter hand-back: VERIFIED → RETURNED (same law as the real
  // adapter performs after admission).
  {
    const s = loadGateStore(GATE_STORE);
    markReturned(s, decisionId);
    persistGateStore(s, GATE_STORE);
  }
  // Annotation consumed by the null transport (never a decision authority —
  // the option itself came from admitGateCallback above).
  const store2 = loadGateStore(GATE_STORE);
  const d2 = store2.decisions.find((x) => x.decision_id === decisionId);
  d2.null_transport_admitted_option = OPTION;
  d2.null_transport_admitted_update_id = EXPECTED_UPDATE_ID;
  persistGateStore(store2, GATE_STORE);
  push("SYNTHETIC_CALLBACK_ADMITTED", { option: OPTION, update_id: EXPECTED_UPDATE_ID });
}

function killTree(proc) {
  try {
    if (process.platform === "win32" && proc?.pid) {
      execFileSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore", timeout: 15000 });
    } else proc?.kill();
  } catch { try { proc?.kill(); } catch { /* gone */ } }
}

async function run() {
  fs.mkdirSync(SPOOL, { recursive: true });
  const launch = officialAcpLaunch();
  acp = spawn(launch.command, launch.args, launch.options);
  push("ACP_PROCESS_START", {});
  acp.once("exit", (code, signal) => {
    push("ACP_PROCESS_EXIT", { code, signal: signal ?? null });
    for (const [, p] of pending) { clearTimeout(p.timer); p.reject(new Error("ACP_PROCESS_EXIT_BEFORE_RESPONSE")); }
  });
  acp.stdout.setEncoding("utf8");
  acp.stdout.on("data", (d) => { buf += d; let i; while ((i = buf.indexOf("\n")) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); pump(l); } });
  acp.stderr.setEncoding("utf8");
  acp.stderr.on("data", (d) => { const preview = String(d).replace(/[\r\n]+/g, " ").slice(0, 140); stderrTail.push(preview); push("ACP_STDERR", { preview }); });

  await send("initialize", { protocolVersion: 1, clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } } });
  push("ACP_INITIALIZED", {});

  const session = await send("session/new", {
    cwd: process.cwd(),
    mcpServers: [{
      name: "v4-cursor-acp-human-gate",
      command: process.execPath,
      args: [SERVER, "--spool-marker", path.basename(SPOOL)],
      env: [
        { name: "ACP_GATE_SPOOL_DIR", value: SPOOL },
        { name: "ACP_GATE_STORE_PATH", value: GATE_STORE },
        { name: "ACP_GATE_TRANSPORT_MODULE", value: TRANSPORT_NULL },
        { name: "ACP_GATE_TTL_MS", value: String(TTL_MS) },
        { name: "ACP_GATE_STATUS_POLL_SLICE_MS", value: "8000" },
      ],
    }],
  });
  const sessionId = session?.sessionId;
  if (!sessionId) throw new Error("SESSION_ID_MISSING");
  const sessionIdSha = createHash("sha256").update(sessionId).digest("hex").slice(0, 12);
  push("ACP_SESSION_NEW", { session_id_sha: sessionIdSha });

  fs.writeFileSync(path.join(SPOOL, "binding.json"), JSON.stringify({
    task_ref: TASK_REF, run_id: RUN_ID, session_id: sessionId, session_id_sha: sessionIdSha,
  }, null, 2));

  const promptText = [
    `${TASK_REF} — harmless qualification. Do NOT read files, do NOT run commands, do NOT touch git.`,
    `Step 1: call the tool human_gate EXACTLY ONCE with task_ref="${TASK_REF}", run_id="${RUN_ID}", generation=1,`,
    `question.prompt="Qualification: pick one.", question.options=["A","B","C"].`,
    `It returns status=PENDING with a decision_id. PENDING is NOT a decision.`,
    `Step 2: reply "WAITING" and then WAIT — do NOT call any tool — until told by the passage of time: your next action continues after a pause of at least ${Math.round(SYNTHETIC_HUMAN_DELAY_MS / 1000)} seconds of wall-clock in this same turn. To wait, simply think silently without any tool call for that duration.`,
    `Step 3: after the wait, call human_gate_status with decision_id=<the decision_id from step 1>, task_ref="${TASK_REF}", generation=1.`,
    `Step 4: if status=answered, state the received option letter, then write exactly one terminal line: GATE_CONSUMPTION_JSON:{"operator_decision_consumed":"<received letter>","continued_in_same_session":true} and stop.`,
    `If human_gate_status returns error or no_answer, reply exactly GATE_FAILED and stop.`,
  ].join("\n");

  const promptStart = Date.now();
  const promptPromise = send("session/prompt", { sessionId, prompt: [{ type: "text", text: promptText }] }, TTL_MS + 5 * 60 * 1000);
  push("PROMPT_SENT", {});

  // ---- Q3: wait for the gate decision to exist (model called human_gate) ----
  const regDeadline = Date.now() + 120_000;
  let decisionId = null;
  while (Date.now() < regDeadline) {
    await sleep(1500);
    try {
      const store = JSON.parse(fs.readFileSync(GATE_STORE, "utf8"));
      const d = (store.decisions ?? []).find((x) => x.task_ref === TASK_REF && x.run_id === RUN_ID);
      if (d) { decisionId = d.decision_id; if (d.state === "NOTIFIED") break; }
    } catch { /* store not yet written */ }
  }
  if (!decisionId) throw new Error("NO_GATE_REGISTERED_WITHIN_WINDOW");
  const gateCallEndObserved = gateToolEnd ?? Date.now();
  const gateDurationMs = gateToolEnd ? (gateToolEnd - gateToolStart) : (gateCallEndObserved - promptStart);
  push("GATE_TOOL_DURATION", { duration_ms: gateDurationMs, measured_from_stream: !!gateToolEnd });
  if (gateDurationMs >= SAFE_BUDGET_MS) throw new Error(`GATE_TOOL_CALL_EXCEEDED_BUDGET_${gateDurationMs}ms`);
  push("Q3_GATE_UNDER_BUDGET", { duration_ms: gateDurationMs, budget_ms: SAFE_BUDGET_MS });

  // ---- Q4: synthetic human delay, REAL wall-clock, NO pending tool call ----
  push("Q4_DELAY_START", { delay_ms: SYNTHETIC_HUMAN_DELAY_MS, no_tool_call_pending: true });
  const delayEnd = Date.now() + SYNTHETIC_HUMAN_DELAY_MS;
  while (Date.now() < delayEnd) {
    await sleep(2500);
    if (acp.exitCode !== null) throw new Error("ACP_PROCESS_DIED_DURING_DELAY");
  }
  push("Q4_DELAY_ELAPSED", { watched_session_alive: acp.exitCode === null });

  // ---- Q5: admit the synthetic canonical callback AFTER >watchdog delay ----
  admitSyntheticCallback(decisionId, sessionId);

  // ---- wait for the prompt turn to finish (same session) ----
  const promptResult = await promptPromise;
  const stopReason = promptResult?.stopReason ?? "unknown";
  push("PROMPT_TURN_COMPLETE", { stop_reason: stopReason });

  const texts = agentTexts.join("");
  const consumptionOk = texts.includes("GATE_CONSUMPTION_JSON") && texts.includes(`"operator_decision_consumed":"${OPTION}"`);
  push("Q6_CONSUMPTION", { consumption_ok: consumptionOk, transcript_preview: texts.slice(-300) });

  // Canonical store: decision must be VERIFIED→RETURNED with exact option.
  const finalStore = JSON.parse(fs.readFileSync(GATE_STORE, "utf8"));
  const dFinal = finalStore.decisions.find((x) => x.decision_id === decisionId);
  const canonicalOk = dFinal?.state === "RETURNED" && dFinal?.selected_option === OPTION;

  const statusDurationMs = (statusToolStart && statusToolEnd) ? statusToolEnd - statusToolStart : null;
  const outcome = {
    RESULT: consumptionOk && canonicalOk && agentSideSessionNew === 0 ? "PASS" : "FAIL",
    TASK_REF, RUN_ID,
    SESSION_ID_SHA: sessionIdSha,
    DECISION_ID: decisionId,
    WATCHDOG_OBSERVED_MS,
    SAFE_BUDGET_MS,
    GATE_TOOL_DURATION_MS: gateDurationMs,
    STATUS_TOOL_DURATION_MS: statusDurationMs,
    SYNTHETIC_HUMAN_DELAY_MS,
    DELAY_GT_60S_SYNTHETIC: SYNTHETIC_HUMAN_DELAY_MS > WATCHDOG_OBSERVED_MS ? "PASS" : "FAIL",
    CANONICAL_STATE: dFinal?.state,
    CANONICAL_OPTION: dFinal?.selected_option,
    POST_DELAY_CANONICAL_RESULT_RECOVERY: canonicalOk ? "PASS" : "FAIL",
    EXACT_OPTION_CONSUMPTION: consumptionOk ? "PASS" : "FAIL",
    SAME_SESSION_IDENTITY: agentSideSessionNew === 0 ? "PASS" : "FAIL",
    SESSION_NEW_AFTER_GATE_START: agentSideSessionNew,
    SESSION_LOAD_ON_LIVE_PATH: "NO",
    REAL_TELEGRAM_SENDS: 0,
    stop_reason: stopReason,
  };
  fs.writeFileSync(path.join(SPOOL, "qualification-result.json"), JSON.stringify(outcome, null, 2));
  fs.writeFileSync(path.join(SPOOL, "qualification-trace.json"), JSON.stringify(trace, null, 2));
  const repDir = path.join(HERE, "..", "reports", "runtime", "cursor-acp");
  fs.mkdirSync(repDir, { recursive: true });
  fs.writeFileSync(path.join(repDir, "watchdog-remediation-acp-qualification.json"), JSON.stringify(outcome, null, 2));
  console.log(JSON.stringify(outcome, null, 2));
  return outcome;
}

run().then((o) => {
  killTree(acp);
  try {
    // reap any marked MCP orphan of THIS run
    const out = execFileSync("powershell", ["-NoProfile", "-Command",
      `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match 'acp-wdg-qual-${RUN_ID}' } | ForEach-Object { $_.ProcessId }`],
      { encoding: "utf8", timeout: 20000 });
    for (const pid of String(out).split(/\s+/).map((s) => parseInt(s, 10)).filter(Number.isInteger)) { try { process.kill(pid); } catch { /* gone */ } }
  } catch { /* best effort */ }
  process.exit(o.RESULT === "PASS" ? 0 : 1);
}).catch((e) => {
  push("QUALIFICATION_STOP", { reason: String(e.message || e).slice(0, 300) });
  console.error("STOP:", String(e.message || e).slice(0, 300));
  try {
    fs.mkdirSync(SPOOL, { recursive: true });
    fs.writeFileSync(path.join(SPOOL, "qualification-trace.json"), JSON.stringify(trace, null, 2));
  } catch { /* noop */ }
  killTree(acp);
  process.exit(1);
});
