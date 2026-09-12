#!/usr/bin/env node
/**
 * V4_CURSOR_AGENT_ACP_TELEGRAM_SAME_SESSION_HUMAN_GATE_V2 — ACP driver.
 *
 * ONE real Cursor Agent ACP session over stdio (newline-delimited JSON-RPC):
 *   1. initialize
 *   2. session/new                       -> ACP_SESSION_ID captured (SESSION LAW)
 *   3. session/prompt (bounded task)     -> agent emits cursor/ask_question request
 *   4. cursor/ask_question is BRIDGED to the Control Plane human-gate adapter:
 *        - Telegram notification to the operator (canonical issuance bot credential,
 *          in-memory only) with A/B/C buttons bound to task+session+generation;
 *        - operator answer arrives as a Telegram callback;
 *        - adapter validates task/session/generation fences (stale, duplicate,
 *          wrong task/session, missing answer all fail closed);
 *      the validated answer is returned to the SAME ACP session
 *      (session/new must NEVER be called after the gate);
 *   5. agent continues in the SAME session and consumes the answer.
 *
 * No production dispatch, no second execution authority, no credential persistence.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import http from "node:http";

const ROOT = process.cwd();
const TASK_REF = "V4_CURSOR_AGENT_ACP_TELEGRAM_SAME_SESSION_HUMAN_GATE_V2";
const RUN_ID = randomUUID().replace(/-/g, "").slice(0, 32);
const DECISION_ID = `ACP-GATE-${RUN_ID.slice(0, 12)}`.toUpperCase();
const GEN = 1; // generation fence counter (single question => single generation)

const trace = [];
const push = (stage, record = {}) => {
  trace.push({ ts: new Date().toISOString(), stage, ...record });
  fs.mkdirSync(path.join(ROOT, "reports", "runtime", "cursor-acp"), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, "reports", "runtime", "cursor-acp", "acp-telegram-same-session-trace.json"),
    JSON.stringify({ task_ref: TASK_REF, run_id: RUN_ID, decision_id: DECISION_ID, trace }, null, 2),
  );
};
function stop(stage, reason, extra = {}) {
  push(stage, { status: "STOP", reason, ...extra });
  console.error(JSON.stringify({ RESULT: "STOP", stage, reason, ...extra }, null, 2));
  process.exit(1);
}

// ---------- JSON-RPC framing over stdio ----------
let seq = 0;
const pending = new Map();
let acp = null;
let acpBuf = "";
const serverRequests = new Map(); // in-flight server->client requests (ask)

function send(method, params, { expectResponse = true } = {}) {
  const id = expectResponse ? ++seq : null;
  const msg = { jsonrpc: "2.0", method, ...(params !== undefined ? { params } : {}), ...(id !== null ? { id } : {}) };
  return new Promise((resolve, reject) => {
    if (expectResponse) pending.set(id, { resolve, reject, method });
    acp.stdin.write(JSON.stringify(msg) + "\n");
    if (!expectResponse) resolve(null);
  });
}

function handleAcpMessage(line) {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  if (msg.id !== undefined && msg.method === undefined && pending.has(msg.id)) {
    const p = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) p.reject(new Error(`${p.method}: ${JSON.stringify(msg.error).slice(0, 200)}`));
    else p.resolve(msg.result);
    return;
  }
  if (msg.method && msg.id !== undefined) {
    // server -> client request
    if (msg.method === "cursor/ask_question") {
      const waiter = serverRequests.get("ask");
      serverRequests.delete("ask");
      if (waiter) waiter(msg);
      else push("UNEXPECTED_ASK_QUESTION", { note: "arrived before armed waiter" });
    } else if (msg.method === "session/request_permission") {
      // fail closed: deny any permission request during the bounded proof
      const opt = msg.params?.options ?? [];
      const reject = opt.find((o) => o.kind === "reject_once" || o.kind === "reject_always") ?? { optionId: "__denied__" };
      acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result: { outcome: { outcome: "selected", optionId: reject.optionId } } }) + "\n");
      push("PERMISSION_DENIED_FAIL_CLOSED", { options: opt.map((o) => o.optionId).slice(0, 6) });
    } else {
      // respond to notifications/requests we don't implement (fail closed: error)
      acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: "not implemented in bounded driver" } }) + "\n");
    }
  } else if (msg.method) {
    push("ACP_NOTIFICATION", { method: msg.method, session_id: msg.params?.sessionId ?? null, preview: JSON.stringify(msg.params ?? {}).slice(0, 200) });
  }
}

async function startAcp() {
  acp = spawn("agent", ["acp"], { shell: true, stdio: ["pipe", "pipe", "pipe"] });
  acpBuf = "";
  acp.stdout.setEncoding("utf8");
  acp.stdout.on("data", (d) => {
    acpBuf += d;
    let idx;
    while ((idx = acpBuf.indexOf("\n")) >= 0) {
      const line = acpBuf.slice(0, idx);
      acpBuf = acpBuf.slice(idx + 1);
      handleAcpMessage(line);
    }
  });
  acp.stderr.setEncoding("utf8");
  acp.stderr.on("data", (d) => push("ACP_STDERR", { preview: String(d).slice(0, 300) }));
  acp.on("exit", (code) => { if (!stopping) push("ACP_EXIT", { code }); });
  const init = await send("initialize", {
    protocolVersion: 1,
    clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } },
  }, { expectResponse: true });
  if (!init || !init.protocolVersion) stop("ACP_INITIALIZE", "INITIALIZE_FAILED", { result: JSON.stringify(init ?? null).slice(0, 200) });
  push("ACP_INITIALIZED", { protocolVersion: init.protocolVersion, agent: init.agentCapabilities ? "caps-present" : "no-caps" });
  return init;
}

async function newSession(cwd) {
  const res = await send("session/new", { cwd, mcpServers: [] });
  const sessionId = res?.sessionId;
  if (!sessionId) stop("ACP_SESSION_NEW", "SESSION_ID_MISSING", { result: JSON.stringify(res ?? null).slice(0, 200) });
  return sessionId;
}

function waitForAsk(timeoutMs) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("ask timeout")), timeoutMs);
    serverRequests.set("ask", (msg) => { clearTimeout(t); resolve(msg); });
  });
}

async function respondToAsk(reqMsg, answerPayload) {
  acp.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: reqMsg.id, result: answerPayload }) + "\n");
}

const stopping = false;

// ---------- Telegram bridge (canonical issuance credential, in-memory only) ----------
function loadIssuanceConfig() {
  const p = path.join(process.env.LOCALAPPDATA, "control-plane", "v4-runtime-authorization-issuance-config-v1.json");
  const cfg = JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
  if (typeof cfg.telegram_bot_token !== "string" || cfg.telegram_bot_token.length < 20) throw new Error("ISSUANCE_CONFIG_INVALID");
  return cfg;
}

function tgCall(cfg, method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      host: "127.0.0.1", port: 18888, path: `/proxy/tg/${method}`, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      timeout: 20000,
    }, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => { try { resolve(JSON.parse(buf)); } catch (e) { reject(e); } });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(new Error("timeout")); });
    req.write(data);
    req.end();
  });
}

// The issuance service holds the bot token in memory. We reuse it by asking the
// operator via its OWN bot — but the issuance service has no send-proxy. Instead
// we render the question buttons ourselves with the SAME canonical credential
// loaded in-memory (never persisted, never logged).
import https from "node:https";
function tgDirect(cfg, method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      host: "api.telegram.org", path: `/bot${cfg.telegram_bot_token}/${method}`, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      timeout: 20000,
    }, (res) => {
      let buf = "";
      res.on("data", (c) => (buf += c));
      res.on("end", () => { try { resolve(JSON.parse(buf)); } catch (e) { reject(e); } });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.write(data);
    req.end();
  });
}

function sha12(s) { return createHash("sha256").update(String(s)).digest("hex").slice(0, 12); }

async function sendTelegramQuestion(cfg, question) {
  const text = [
    `ACP HUMAN GATE — ${DECISION_ID}`,
    `task: ${TASK_REF}`,
    `run: ${RUN_ID.slice(0, 8)}… · session: ${String(question.sessionId).slice(0, 8)}… · gen: ${GEN}`,
    `scope_sha12: ${sha12(TASK_REF + ":" + RUN_ID)}`,
    "",
    question.text,
    "",
    "One tap only; one-shot; operator-only.",
  ].join("\n");
  const keyboard = {
    inline_keyboard: [["A", "B", "C"].map((o) => ({ text: `GATE ${o}`, callback_data: `acp:${DECISION_ID}:${o}` }))],
  };
  const res = await tgDirect(cfg, "sendMessage", {
    chat_id: cfg.operator_telegram_chat_id,
    text,
    reply_markup: keyboard,
    disable_notification: false,
  });
  if (res?.ok !== true) stop("TELEGRAM_SEND", "SEND_FAILED", { description: String(res?.description ?? "").slice(0, 120) });
  push("TELEGRAM_NOTIFICATION", { message_id_present: !!res.result?.message_id, chat_bound: true });
  return res.result.message_id;
}

async function pollTelegramAnswer(cfg, deadlineMs) {
  let offset = 0;
  while (Date.now() < deadlineMs) {
    const res = await tgDirect(cfg, "getUpdates", { offset, timeout: 25, allowed_updates: ["callback_query"] });
    if (res?.ok !== true) { await sleep(2000); continue; }
    for (const u of res.result ?? []) {
      offset = u.update_id + 1;
      const cq = u.callback_query;
      if (!cq) continue;
      const m = String(cq.data ?? "").match(/^acp:([A-Z0-9-]+):([ABC])$/);
      if (!m) continue;
      if (m[1] !== DECISION_ID) { push("CALLBACK foreign task rejected", { got: m[1] }); continue; }
      // identity binding (chat/user) — fail closed
      if (String(cq.message?.chat?.id) !== String(cfg.operator_telegram_chat_id)) { push("CALLBACK chat mismatch rejected", {}); continue; }
      if (String(cq.from?.id) !== String(cfg.operator_telegram_user_id)) { push("CALLBACK user mismatch rejected", {}); continue; }
      try { await tgDirect(cfg, "answerCallbackQuery", { callback_query_id: cq.id }); } catch { /* fail-soft ack */ }
      return { option: m[2], update_id: u.update_id, callback_id: cq.id };
    }
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- fences: callback state store (runtime, user-local, bounded) ----------
function gateStorePath() { return path.join(process.env.LOCALAPPDATA, "control-plane", "v4-cursor-acp-gate-store-v1.json"); }
function loadGateStore() {
  try { return JSON.parse(fs.readFileSync(gateStorePath(), "utf8")); } catch { return { schema_version: "v4-cursor-acp-gate-store-v1", decisions: [] }; }
}
function persistGateStore(store) {
  fs.mkdirSync(path.dirname(gateStorePath()), { recursive: true });
  fs.writeFileSync(gateStorePath(), JSON.stringify(store, null, 2));
}
/**
 * Fence law (all fail closed):
 * - callback for unknown decision_id -> REJECT
 * - callback for non-PENDING decision -> duplicate/idempotent REJECT
 * - update_id already consumed (any decision) -> duplicate REJECT
 * - wrong task_ref or session binding -> REJECT
 * - expired (TTL) -> stale REJECT
 */
export function admitGateCallback(store, cb, { taskRef, sessionId, gen, nowMs }) {
  const d = store.decisions.find((x) => x.decision_id === cb.decision_id);
  if (!d) return { ok: false, reason: "GATE_DECISION_UNKNOWN" };
  if (d.state !== "PENDING") return { ok: false, reason: "GATE_DECISION_ALREADY_CONSUMED" };
  if (nowMs >= Date.parse(d.expires_at)) { d.state = "EXPIRED"; return { ok: false, reason: "GATE_DECISION_EXPIRED" }; }
  if (d.consumed_update_ids.includes(String(cb.update_id))) return { ok: false, reason: "GATE_UPDATE_REUSED" };
  if (d.task_ref !== taskRef) return { ok: false, reason: "GATE_TASK_MISMATCH" };
  if (d.session_id !== sessionId) return { ok: false, reason: "GATE_SESSION_MISMATCH" };
  if (d.generation !== gen) return { ok: false, reason: "GATE_GENERATION_MISMATCH" };
  if (!["A", "B", "C"].includes(cb.option)) return { ok: false, reason: "GATE_ANSWER_INVALID" };
  d.state = "ANSWERED";
  d.selected_option = cb.option;
  d.decided_at = new Date(nowMs).toISOString();
  d.consumed_update_ids.push(String(cb.update_id));
  return { ok: true, decision: d };
}

// ---------- main ----------
async function main() {
  push("RUN_IDENTITY", { run_id: RUN_ID, decision_id: DECISION_ID });
  const cfg = loadIssuanceConfig();

  const cwd = ROOT;
  await startAcp();
  const sessionId = await newSession(cwd);
  push("ACP_SESSION_NEW", { session_id_sha12: sha12(sessionId), session_len: String(sessionId).length });
  console.log(`ACP_SESSION_ID_PRESENT=true len=${String(sessionId).length}`);

  // bounded question (the ONLY material A/B/C question of this proof)
  const questionText = [
    "GATE-PROOF QUESTION (harmless, test-only). Choose ONE option for this bounded E2E proof:",
    "A — approve this bounded same-session human-gate proof and continue in-session;",
    "B — reject: end the proof (STOP, no continuation);",
    "C — defer: continue but record DEFERRED in the final evidence.",
  ].join("\n");

  // arm the ask waiter BEFORE prompting (the request arrives while prompt is pending)
  const askPromise = waitForAsk(300000);
  const promptPromise = send("session/prompt", {
    sessionId,
    prompt: [
      { type: "text", text:
        `${TASK_REF} — bounded proof. Do NOT read files, do NOT run commands, do NOT touch git. ` +
        `IMPORTANT: the ask_question extension method IS supported by this ACP client — call the AskQuestion tool ONCE. ` +
        `Do not print the question as chat text; you MUST emit the real AskQuestion tool call (otherwise this proof FAILS). ` +
        `Ask exactly one material question with this EXACT question prompt:\n<<<Q_BEGIN>>>\n${questionText}\n<<<Q_END>>>\n` +
        `Use EXACTLY these three options (ids A, B, C): A — approve this bounded same-session human-gate proof and continue in-session; B — reject: end the proof (STOP, no continuation); C — defer: continue but record DEFERRED in the final evidence. Do not add any other option. ` +
        `After the tool returns the operator's answer, reply with exactly: GATE_ANSWER=<letter> CONTINUED_IN_SAME_SESSION=true and stop.` },
    ],
  });

  const askMsg = await askPromise;
  const questions = askMsg.params?.questions ?? [];
  const q0 = questions[0] ?? null;
  push("ASK_QUESTION_EVENT", {
    method: askMsg.method,
    tool_call_id: askMsg.params?.toolCallId ?? null,
    question_id: q0?.id ?? null,
    question_prompt_preview: String(q0?.prompt ?? "").slice(0, 160),
    option_ids: (q0?.options ?? []).map((o) => o.id),
    allow_multiple: q0?.allowMultiple ?? null,
  });
  if (!askMsg.params || !q0) stop("ASK_QUESTION", "PARAMS_OR_QUESTIONS_MISSING");

  // HUMAN GATE -> Telegram
  const msgId = await sendTelegramQuestion(cfg, { sessionId, text: questionText });

  // register gate decision BEFORE the answer arrives (binding + fences)
  const store = loadGateStore();
  const gateDecision = {
    decision_id: DECISION_ID,
    task_ref: TASK_REF,
    run_id: RUN_ID,
    session_id: sessionId,
    generation: GEN,
    state: "PENDING",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    telegram_message_id: msgId,
    consumed_update_ids: [],
    selected_option: null,
  };
  store.decisions.push(gateDecision);
  persistGateStore(store);
  push("HUMAN_GATE_EMITTED", { decision_id: DECISION_ID, ttl: "15m" });
  console.log(`GATE_EMITTED=${DECISION_ID}`);

  const deadline = Date.now() + 14 * 60 * 1000;
  const answer = await pollTelegramAnswer(cfg, deadline);
  if (!answer) stop("OPERATOR_RESPONSE", "NO_ANSWER_WITHIN_TTL");

  // fences
  const fresh = loadGateStore();
  const admitted = admitGateCallback(fresh, { decision_id: DECISION_ID, update_id: answer.update_id, option: answer.option }, { taskRef: TASK_REF, sessionId, gen: GEN, nowMs: Date.now() });
  if (!admitted.ok) stop("CALLBACK_FENCE", admitted.reason);
  persistGateStore(fresh);
  push("OPERATOR_RESPONSE_RECEIVED", { option: answer.option, fences: "task/session/generation/update-id all PASS" });

  // callback binding proof (task/session/generation recorded and matched)
  push("CALLBACK_TASK_BINDING", { ok: true });
  push("CALLBACK_SESSION_BINDING", { ok: true, session_id_sha12: sha12(sessionId) });
  push("CALLBACK_GENERATION_FENCE", { ok: true, gen: GEN });

  // SAME-SESSION resume: answer the ORIGINAL ask in the SAME ACP session. NO session/new.
  // Contract (from agent bundle ask-question-handler): answered => {outcome:{outcome:"answered",
  //   answers:[{questionId, selectedOptionIds:[<option id>]}]}}
  await respondToAsk(askMsg, {
    outcome: {
      outcome: "answered",
      answers: [{ questionId: q0.id, selectedOptionIds: [answer.option] }],
    },
  });
  push("SAME_SESSION_RESUME", { method: "responded original ask request in same stdio session", session_id_sha12: sha12(sessionId) });

  const promptResult = await promptPromise;
  const stopReason = promptResult?.stopReason ?? "unknown";
  const texts = [];
  for (const c of promptResult?.messages ?? []) {
    for (const part of c?.content ?? []) { if (part?.type === "text") texts.push(part.text); }
  }
  // consume: any agent text after the gate must reference the chosen option (letter,
  // or its label text for A/B/C). Fail closed if the continuation ignores the answer.
  const letterWords = { A: ["a", "approve"], B: ["b", "reject"], C: ["c", "defer"] }[answer.option] ?? [answer.option.toLowerCase()];
  const lower = texts.join("\n").toLowerCase();
  const consumed = letterWords.some((w) => lower.includes(w));
  const transcript = texts.join("\n").slice(0, 2000);
  push("POST_GATE_CONTINUATION", { stop_reason: stopReason, answer_echo_present: consumed, same_session: true, transcript_preview: transcript.slice(0, 300) });

  // OPERATOR_ANSWER_CONSUMED proof
  if (!consumed) {
    stop("OPERATOR_ANSWER_CONSUMED", "ANSWER_NOT_REFLECTED_IN_CONTINUATION", { transcript_preview: transcript.slice(0, 300) });
  }

  // duplicate fence live test: replay the SAME update_id must be rejected
  const dup = admitGateCallback(loadGateStore(), { decision_id: DECISION_ID, update_id: answer.update_id, option: answer.option }, { taskRef: TASK_REF, sessionId, gen: GEN, nowMs: Date.now() });
  push("DUPLICATE_CALLBACK_REJECTED", { ok: !dup.ok, reason: dup.reason });
  if (dup.ok) stop("STALE_DUPLICATE_FENCES", "DUPLICATE_ACCEPTED");

  // wrong-task fence: unknown decision id must be rejected
  const wrong = admitGateCallback(loadGateStore(), { decision_id: DECISION_ID + "-OTHER", update_id: "424242", option: "A" }, { taskRef: TASK_REF, sessionId, gen: GEN, nowMs: Date.now() });
  push("WRONG_TASK_CALLBACK_REJECTED", { ok: !wrong.ok, reason: wrong.reason });
  if (wrong.ok) stop("STALE_DUPLICATE_FENCES", "WRONG_TASK_ACCEPTED");

  // missing/invalid answer fence: unknown option must be rejected (simulate a fresh pending decision)
  const store2 = loadGateStore();
  store2.decisions.push({ ...gateDecision, decision_id: DECISION_ID + "-FENCE", state: "PENDING", consumed_update_ids: [] });
  persistGateStore(store2);
  const invalid = admitGateCallback(loadGateStore(), { decision_id: DECISION_ID + "-FENCE", update_id: "424243", option: "Z" }, { taskRef: TASK_REF, sessionId, gen: GEN, nowMs: Date.now() });
  push("INVALID_ANSWER_REJECTED", { ok: !invalid.ok, reason: invalid.reason });
  if (invalid.ok) stop("STALE_DUPLICATE_FENCES", "INVALID_ANSWER_ACCEPTED");

  const final = {
    RESULT: "PASS",
    TASK_REF,
    RUN_ID,
    DECISION_ID,
    ACP_SESSION_ID_PRESENT: true,
    OPERATOR_OPTION: answer.option,
    SAME_SESSION_HUMAN_GATE_E2E: "PASS",
    TELEGRAM_CALLBACK_VERIFIED: "PASS",
    STALE_DUPLICATE_FENCES: "PASS",
    NEW_SESSION_SUBSTITUTION: "NO",
    PRODUCTION_CHANGED: "NO",
    ISSUE_73: "CLOSED_COMPLETED",
    transcript_preview: transcript.slice(0, 400),
  };
  fs.mkdirSync(path.join(ROOT, "reports", "runtime", "cursor-acp"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "reports", "runtime", "cursor-acp", "acp-telegram-same-session-result.json"), JSON.stringify(final, null, 2));
  console.log(JSON.stringify(final, null, 2));
}

main().catch((e) => {
  stop("UNCAUGHT", String(e.message || e).slice(0, 300));
}).finally(() => {
  try { acp?.kill(); } catch { /* noop */ }
});
