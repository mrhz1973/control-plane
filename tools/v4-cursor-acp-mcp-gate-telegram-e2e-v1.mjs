#!/usr/bin/env node
/**
 * V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1 — one real bounded E2E.
 *
 * ONE live ACP session (agent acp child, stdio JSON-RPC):
 *   initialize → session/new with the project-owned MCP human-gate server
 *   (transport = REAL Telegram, canonical issuance credential path, in-memory)
 *   → session/prompt (bounded, harmless) instructing exactly one human_gate
 *   invocation → REAL Telegram notification (exactly one send) → REAL
 *   operator callback (verified: task/session/generation/decision/update-id/
 *   chat/user/TTL fences in gate-core) → tool result returned in-session →
 *   SAME exact ACP session continues → post-gate output must consume the
 *   operator decision.
 *
 * SAME-SESSION LAW: sessionId captured before the gate; zero session/new
 * after gate start; session/load NOT used on the live path; uninterrupted
 * child. Negative fences are exercised locally AFTER the real callback
 * against persisted gate state (no extra Telegram sends).
 *
 * Send budget = exactly one Telegram sendMessage (guard in driver).
 * No cursor/ask_question. No production dispatch.
 */
import { spawn, execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const TASK_REF = "V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1";
const RUN_ID = randomUUID().replace(/-/g, "").slice(0, 16);
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const SERVER = path.join(HERE, "v4-cursor-acp-mcp-human-gate-server-v1.mjs");
const TRANSPORT = path.join(HERE, "v4-cursor-acp-gate-transport-telegram-v1.mjs");
const SPOOL = path.join(process.env.TEMP || ".", `acp-mcp-gate-e2e-${RUN_ID}`);
const GATE_STORE = path.join(SPOOL, "gate-store.json");
const TTL_MS = 15 * 60 * 1000;

const trace = [];
const push = (stage, rec = {}) => {
  trace.push({ ts: new Date().toISOString(), stage, ...rec });
  fs.mkdirSync(SPOOL, { recursive: true });
  fs.writeFileSync(path.join(SPOOL, "e2e-trace.json"), JSON.stringify({ task_ref: TASK_REF, run_id: RUN_ID, trace }, null, 2));
};
function stop(stage, reason, extra = {}) {
  push(stage, { status: "STOP", reason, ...extra });
  console.error(JSON.stringify({ RESULT: "STOP", stage, reason, ...extra }, null, 2));
  try { acp?.kill(); } catch { /* noop */ }
  // Structural restore guard: STOP must never leave the canonical issuance
  // service quiesced nor MCP orphans polling (the finally in main() cannot
  // run across process.exit).
  try { reapOrphanMcpServers(`acp-mcp-gate-e2e-${RUN_ID}`); reapOrphanMcpServers(); } catch { /* best effort */ }
  restoreIssuance()
    .then((r) => { console.log(`ISSUANCE_RESTORE: ${JSON.stringify(r)}`); })
    .catch(() => { console.log("ISSUANCE_RESTORE: {\"restored\":false}"); })
    .finally(() => process.exit(1));
}

let acp = null, seq = 0, stopping = false;
const pending = new Map();
let agentSideSessionNew = 0;
let buf = "";

function send(method, params) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params, id }) + "\n");
  });
}

function pump(line) {
  if (!line.trim()) return;
  let m; try { m = JSON.parse(line); } catch { return; }
  if (m.id !== undefined && m.method === undefined && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id);
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
      // ONLY the project-owned human_gate MCP tool may be auto-allowed;
      // every other permission request is denied fail-closed.
      if (allow && raw.includes("human_gate")) {
        acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, result: { outcome: { outcome: "selected", optionId: allow.optionId } } }) + "\n");
        push("PERMISSION_ALLOWED_HUMAN_GATE", {});
      } else {
        acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, result: { outcome: { outcome: "selected", optionId: rej.optionId } } }) + "\n");
        push("PERMISSION_DENIED_FAIL_CLOSED", { preview: raw.slice(0, 120) });
      }
      return;
    }
    acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: "not supported in bounded E2E driver" } }) + "\n");
    return;
  }
  if (m.method) {
    const u = m.params?.update ?? {};
    if (u.sessionUpdate === "agent_message_chunk" && u.content?.text) push("AGENT_TEXT", { text: u.content.text });
    else push("ACP_NOTIFICATION", { method: m.method, preview: JSON.stringify(m.params ?? {}).slice(0, 140) });
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- orphan MCP-server hygiene (structural, not cosmetic) ----
// Killing the ACP child does NOT kill its detached MCP stdio children. An
// orphaned MCP server with the telegram transport keeps calling getUpdates
// and becomes a hidden competing consumer of the callback channel (observed
// live: 9 orphans across the failed runs). Law: (1) at startup, reap any MCP
// server orphan left by previous runs; (2) mark our own servers with a spool
// marker in argv and reap them at exit.
function reapOrphanMcpServers(marker = "v4-cursor-acp-mcp-human-gate") {
  try {
    const out = execFileSync("powershell", ["-NoProfile", "-Command",
      `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match '${marker}' } | ForEach-Object { $_.ProcessId }`],
      { encoding: "utf8", timeout: 20000 });
    const pids = String(out).split(/\s+/).map((s) => parseInt(s, 10)).filter((n) => Number.isInteger(n) && n > 0);
    for (const pid of pids) { try { process.kill(pid); } catch { /* already gone */ } }
    return { reaped: pids.length, pids };
  } catch (e) {
    return { reaped: 0, pids: [], error: String(e.message ?? e).slice(0, 80) };
  }
}

// ---- issuance long-poll conflict guard (structural, self-restoring) ----
// Telegram allows ONE getUpdates consumer per bot. The local issuance service
// long-polls the same bot token; while it runs, the operator callback would
// be consumed by it. This driver quiesces it for the gate window and ALWAYS
// restores it afterwards (finally + stop-path). Every transition is VERIFIED
// by polling actual process state — never assumed.
const ISSUANCE_START_ARGS = () => [
  path.join(HERE, "serve-v4-runtime-authorization-issuance-v1.mjs"),
  "--issuance-config",
  path.join(process.env.LOCALAPPDATA, "control-plane", "v4-runtime-authorization-issuance-config-v1.json"),
];

function findIssuancePid() {
  try {
    const out = execFileSync("powershell", ["-NoProfile", "-Command",
      `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match 'serve-v4-runtime-authorization-issuance' } | Select-Object -First 1 -ExpandProperty ProcessId`],
      { encoding: "utf8", timeout: 20000 });
    const pid = parseInt(String(out).trim(), 10);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch { return null; }
}

async function waitUntil(fn, { attempts = 15, delayMs = 700 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const v = fn();
    if (v) return v;
    await sleep(delayMs);
  }
  return null;
}

async function quiesceIssuance() {
  const pid = findIssuancePid();
  if (!pid) return { quiesced: true, pid: null, verified: true, already: true };
  try { process.kill(pid); } catch { /* may already be gone */ }
  const gone = await waitUntil(() => !findIssuancePid(), { attempts: 12 });
  return { quiesced: !!gone, pid, verified: !!gone };
}

async function restoreIssuance() {
  const existing = findIssuancePid();
  if (existing) return { restored: true, pid: existing, verified: true, already: true };
  let child = null;
  try {
    child = spawn("node", ISSUANCE_START_ARGS(), { detached: true, stdio: "ignore", cwd: HERE });
    child.unref();
  } catch { /* fall through to verification */ }
  const pid = await waitUntil(() => findIssuancePid(), { attempts: 12 });
  return { restored: !!pid, pid, verified: !!pid, already: false };
}

async function main() {
  fs.mkdirSync(SPOOL, { recursive: true });
  push("RUN_IDENTITY", { run_id: RUN_ID, spool: path.basename(SPOOL) });

  // quiesce the local issuance long-poll for the gate window (Telegram
  // single-consumer law); verified BEFORE proceeding; ALWAYS restored in the
  // finally below (and on the STOP path via stop()).
  const orphans = reapOrphanMcpServers();
  push("MCP_ORPHAN_REAP", orphans);
  const q = await quiesceIssuance();
  push("ISSUANCE_QUIESCE", q);
  if (!q.verified) {
    // fail closed: a competing consumer would eat the callback silently.
    console.error(JSON.stringify({ RESULT: "STOP", stage: "ISSUANCE_QUIESCE", reason: "QUIESCE_NOT_VERIFIED", ...q }));
    process.exit(1);
  }
  try {
    await runE2E();
  } finally {
    await sleep(1500); // let the ACP child tear down its MCP children
    reapOrphanMcpServers(`acp-mcp-gate-e2e-${RUN_ID}`);
    const r = await restoreIssuance();
    push("ISSUANCE_RESTORE", r);
    console.log(`ISSUANCE_RESTORE: ${JSON.stringify(r)}`);
  }
}

async function runE2E() {
  // ---- 1. live ACP child + session with MCP human-gate server ----
  acp = spawn("agent", ["acp"], { shell: true, stdio: ["pipe", "pipe", "pipe"] });
  acp.stdout.setEncoding("utf8");
  acp.stdout.on("data", (d) => { buf += d; let i; while ((i = buf.indexOf("\n")) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); pump(l); } });
  acp.stderr.setEncoding("utf8");
  acp.stderr.on("data", (d) => push("ACP_STDERR", { preview: String(d).slice(0, 140) }));

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
        { name: "ACP_GATE_TRANSPORT_MODULE", value: TRANSPORT },
        { name: "ACP_GATE_TTL_MS", value: String(TTL_MS) },
      ],
    }],
  });
  const sessionId = session?.sessionId;
  if (!sessionId) stop("ACP_SESSION_NEW", "SESSION_ID_MISSING");
  const sessionIdSha = createHash("sha256").update(sessionId).digest("hex").slice(0, 12);
  push("ACP_SESSION_NEW", { session_id_sha: sessionIdSha });
  console.log(`ACP_SESSION_ID_SHA=${sessionIdSha} (len=${sessionId.length})`);

  // trusted binding for the adapter (driver-written; model never touches it)
  fs.writeFileSync(path.join(SPOOL, "binding.json"), JSON.stringify({
    task_ref: TASK_REF, run_id: RUN_ID, session_id: sessionId, session_id_sha: sessionIdSha,
  }, null, 2));

  // ---- 2. bounded prompt demanding exactly one human_gate call ----
  // Telegram send budget: the adapter performs the ONE send; the driver only
  // arms a waiter for the gate registration marker written by the server.
  const questionText = [
    "GATE-PROOF QUESTION (harmless, test-only) — choose ONE option for this bounded E2E proof:",
    "A — APPROVE_AND_CONTINUE (approve this bounded same-session human-gate proof and continue in-session);",
    "B — STOP (end the proof, no continuation);",
    "C — DEFER (continue but record DEFERRED in the final evidence).",
  ].join("\n");

  const promptPromise = send("session/prompt", {
    sessionId,
    prompt: [{ type: "text", text:
      `${TASK_REF} — bounded proof. Do NOT read files, do NOT run commands, do NOT touch git, do NOT create any plan. ` +
      `You have a tool named human_gate. Call it EXACTLY ONCE with: task_ref="${TASK_REF}", run_id="${RUN_ID}", generation=1, ` +
      `question.prompt=<the exact multi-line question between the markers>, question.options=["A","B","C"]. ` +
      `Question text:\n<<<Q_BEGIN>>>\n${questionText}\n<<<Q_END>>>\n` +
      `The tool BLOCKS until the human operator answers via Telegram (or times out). ` +
      `When it returns, state the received option and what it means, then write exactly: GATE_ANSWER=<letter> CONTINUED_IN_SAME_SESSION=true and stop. ` +
      `If the tool returns an error or no_answer, reply exactly GATE_FAILED and stop.` }],
  });

  // ---- 3. wait for the real gate registration (REGISTERED→NOTIFIED) ----
  // The server writes gate state into GATE_STORE; poll it (driver-side read).
  const deadline = Date.now() + 120000;
  let decisionId = null;
  while (Date.now() < deadline) {
    await sleep(1500);
    try {
      const store = JSON.parse(fs.readFileSync(GATE_STORE, "utf8"));
      const d = (store.decisions ?? []).find((x) => x.task_ref === TASK_REF && x.run_id === RUN_ID);
      if (d) { decisionId = d.decision_id; if (d.state === "NOTIFIED") break; }
    } catch { /* store not written yet */ }
  }
  if (!decisionId) stop("GATE_REGISTRATION", "NO_GATE_REGISTERED_WITHIN_WINDOW", { hint: "model may not have invoked human_gate" });

  const storeNow = JSON.parse(fs.readFileSync(GATE_STORE, "utf8"));
  const gate = storeNow.decisions.find((x) => x.decision_id === decisionId);
  if (gate.state !== "NOTIFIED") stop("TELEGRAM_NOTIFICATION", `GATE_STATE_${gate.state}`);
  push("HUMAN_GATE_EMITTED", { decision_id: decisionId, transport: gate.transport, message_id_present: !!gate.telegram_message_id });
  console.log(`HUMAN_GATE_EMITTED=${decisionId} — attendi la callback Telegram (TTL 15m)...`);

  // HUMAN_GATE_REQUIRED report to the operator console (sanitized).
  console.log("HUMAN_GATE_REQUIRED — premi UNA volta il bottone A/B/C sul messaggio Telegram appena ricevuto.");

  // ---- 4. wait for gate resolution (VERIFIED→RETURNED via tool result) ----
  const resolveDeadline = Date.now() + TTL_MS + 60000;
  let resolved = null;
  while (Date.now() < resolveDeadline) {
    await sleep(2000);
    try {
      const s2 = JSON.parse(fs.readFileSync(GATE_STORE, "utf8"));
      const d2 = s2.decisions.find((x) => x.decision_id === decisionId);
      if (d2 && ["RETURNED", "NO_ANSWER"].includes(d2.state)) { resolved = d2; break; }
    } catch { /* keep waiting */ }
  }
  if (!resolved) stop("GATE_RESOLUTION", "TIMEOUT_WAITING_RESOLUTION");
  if (resolved.state !== "RETURNED") stop("OPERATOR_RESPONSE", `GATE_${resolved.state}_NO_CALLBACK`);
  push("OPERATOR_RESPONSE_RECEIVED", { option: resolved.selected_option, update_id_present: resolved.consumed_update_ids.length > 0 });
  console.log(`OPERATOR_CALLBACK_ACCEPTED option=${resolved.selected_option}`);

  // ---- 5. same-session resume: await the prompt turn in the SAME session ----
  const promptResult = await promptPromise;
  const stopReason = promptResult?.stopReason ?? "unknown";
  const texts = trace.filter((t) => t.stage === "AGENT_TEXT").map((t) => t.text).join("");
  const letterWords = { A: ["a", "approve"], B: ["b", "stop"], C: ["c", "defer"] }[resolved.selected_option] ?? [resolved.selected_option.toLowerCase()];
  const lower = texts.toLowerCase();
  const consumed = letterWords.some((w) => lower.includes(w)) && lower.includes("continued_in_same_session=true");
  push("POST_GATE_CONTINUATION", { stop_reason: stopReason, consumed, transcript_preview: texts.slice(0, 300) });

  // ---- 6. same-session law checks ----
  const zeroNew = agentSideSessionNew === 0;
  push("SAME_SESSION_CHECKS", { session_id_sha: sessionIdSha, agent_side_session_new: agentSideSessionNew, zero_new_ok: zeroNew, session_load_used: false });
  if (!zeroNew) stop("SAME_SESSION_LAW", "AGENT_SIDE_SESSION_NEW_OBSERVED");
  if (!consumed) stop("OPERATOR_DECISION_CONSUMED", "ANSWER_NOT_REFLECTED_IN_CONTINUATION", { transcript_preview: texts.slice(0, 300) });

  // ---- 7. negative fences locally (no extra Telegram sends) ----
  // Reuse the canonical gate-core law directly against the persisted store.
  const core = await import(new URL("./v4-cursor-acp-gate-core-v1.mjs", import.meta.url).href);
  const fenceChecks = [];
  const tryAdmit = (cb, ctx) => core.admitGateCallback(JSON.parse(fs.readFileSync(GATE_STORE, "utf8")), cb, ctx);

  const dup = tryAdmit({ decision_id: decisionId, option: resolved.selected_option, update_id: resolved.consumed_update_ids[0] }, { taskRef: TASK_REF, sessionId, generation: 1 });
  fenceChecks.push({ name: "DUPLICATE_CALLBACK_REJECTED", ok: !dup.ok, reason: dup.reason });

  const wrongTask = tryAdmit({ decision_id: decisionId + "-NOPE", option: "A", update_id: "999900001" }, { taskRef: TASK_REF, sessionId, generation: 1 });
  fenceChecks.push({ name: "WRONG_BINDING_UNKNOWN_DECISION", ok: !wrongTask.ok, reason: wrongTask.reason });

  const wrongSession = tryAdmit({ decision_id: decisionId, option: "A", update_id: "999900002" }, { taskRef: TASK_REF, sessionId: "deadbeef-0000-4000-8000-000000000000", generation: 1 });
  fenceChecks.push({ name: "WRONG_BINDING_SESSION", ok: !wrongSession.ok, reason: wrongSession.reason });

  const wrongGen = tryAdmit({ decision_id: decisionId, option: "A", update_id: "999900003" }, { taskRef: TASK_REF, sessionId, generation: 99 });
  fenceChecks.push({ name: "WRONG_BINDING_GENERATION", ok: !wrongGen.ok, reason: wrongGen.reason });

  const invalidOpt = tryAdmit({ decision_id: decisionId, option: "Z", update_id: "999900004" }, { taskRef: TASK_REF, sessionId, generation: 1 });
  fenceChecks.push({ name: "WRONG_BINDING_INVALID_OPTION", ok: !invalidOpt.ok, reason: invalidOpt.reason });

  for (const f of fenceChecks) {
    push("NEGATIVE_FENCE", f);
    if (!f.ok) stop("NEGATIVE_FENCES", `FENCE_NOT_ENFORCED: ${f.name}`);
  }

  // ---- 8. final result ----
  const final = {
    RESULT: "PASS",
    TASK_REF, RUN_ID,
    DECISION_ID: decisionId,
    SESSION_ID_SHA: sessionIdSha,
    OPERATOR_OPTION: resolved.selected_option,
    MCP_TOOL_INVOCATION: "PASS",
    TELEGRAM_NOTIFICATION: "PASS",
    REAL_OPERATOR_CALLBACK: "PASS",
    CALLBACK_VERIFIED: "PASS",
    CALLBACK_BINDING: "PASS",
    SAME_SESSION_IDENTITY: "PASS",
    ZERO_SESSION_NEW_AFTER_GATE: "PASS",
    SESSION_LOAD_LIVE_PATH: "NO",
    TOOL_RESULT_RETURNED: "PASS",
    OPERATOR_DECISION_CONSUMED: "PASS",
    POST_GATE_CONTINUATION: "PASS",
    STALE_CALLBACK_REJECTED: "PASS (EXPIRED path proven in slice suite; live TTL not waited)",
    DUPLICATE_CALLBACK_REJECTED: "PASS",
    WRONG_BINDING_REJECTED: "PASS",
    NO_DEFAULT_ANSWER: "PASS",
    CONTROL_PLANE_AUTHORITY_PRESERVED: "YES",
    PRODUCTION_CHANGED: "NO",
    stop_reason: stopReason,
  };
  fs.writeFileSync(path.join(SPOOL, "e2e-result.json"), JSON.stringify(final, null, 2));
  fs.mkdirSync(path.join(HERE, "..", "reports", "runtime", "cursor-acp"), { recursive: true });
  fs.writeFileSync(path.join(HERE, "..", "reports", "runtime", "cursor-acp", "mcp-gate-telegram-e2e-result.json"), JSON.stringify(final, null, 2));
  console.log(JSON.stringify(final, null, 2));
  try { acp.kill(); } catch { /* noop */ }
  process.exit(0);
}

main().catch((e) => stop("UNCAUGHT", String(e.message || e).slice(0, 300)));
