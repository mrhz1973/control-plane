#!/usr/bin/env node
/**
 * V4 Cursor ACP gate core v1 — canonical gate law, extracted from the proven
 * V2 same-session driver (tools/v4-cursor-acp-telegram-same-session-gate-v1.mjs).
 *
 * SINGLE DECISION AUTHORITY: this module owns gate state. MCP layers and ACP
 * drivers are adapters; they register decisions and admit callbacks ONLY
 * through this module. No default answer exists anywhere.
 *
 * State machine:
 *   REGISTERED → NOTIFIED → VERIFIED → RETURNED → CONSUMED
 * Terminal/failure: EXPIRED, NO_ANSWER (and REJECTED admission receipts that
 * never transition a healthy decision).
 *
 * decision_id binds: task_ref | run_id | ACP session identity (sha) | generation.
 * Fences (all fail closed, V2 law preserved verbatim):
 *   unknown decision / already consumed / expired / update-id reuse /
 *   task mismatch / session mismatch / generation mismatch / invalid option.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const GATE_STORE_SCHEMA = "v4-cursor-acp-gate-store-v1";
export const MAX_TTL_MS = 60 * 60 * 1000; // explicit bounded TTL cap: 1h
export const DEFAULT_TTL_MS = 15 * 60 * 1000;

export function sha12(s) {
  return createHash("sha256").update(String(s)).digest("hex").slice(0, 12);
}

/**
 * Canonical store path (user-local, outside any repo). Tests override via
 * env ACP_GATE_STORE_PATH so the canonical store is never touched.
 */
export function gateStorePath() {
  if (process.env.ACP_GATE_STORE_PATH) return process.env.ACP_GATE_STORE_PATH;
  return path.join(process.env.LOCALAPPDATA, "control-plane", "v4-cursor-acp-gate-store-v1.json");
}

export function loadGateStore(storePath = gateStorePath()) {
  try {
    const s = JSON.parse(fs.readFileSync(storePath, "utf8"));
    if (s.schema_version !== GATE_STORE_SCHEMA) throw new Error("STORE_SCHEMA_MISMATCH");
    return s;
  } catch {
    return { schema_version: GATE_STORE_SCHEMA, decisions: [] };
  }
}

export function persistGateStore(store, storePath = gateStorePath()) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

/**
 * decision_id binds task_ref, run_id, session identity (sha12 of the exact
 * ACP sessionId) and generation. Raw session id never enters the id.
 */
export function computeDecisionId({ taskRef, runId, sessionIdSha, generation }) {
  return "ACP-GATE-" + createHash("sha256")
    .update(`${taskRef}|${runId}|${sessionIdSha}|${generation}`)
    .digest("hex")
    .slice(0, 12);
}

function appendHistory(decision, state, nowMs) {
  decision.state = state;
  decision.history.push({ state, at: new Date(nowMs).toISOString() });
}

/**
 * Register a gate decision (REGISTERED). Caller must persist the returned
 * store BEFORE requesting any notification (crash-recovery law).
 */
export function registerGateDecision(store, { taskRef, runId, sessionId, generation, question, ttlMs, telegramMessageId = null, nowMs = Date.now() }) {
  const boundedTtl = Math.min(Math.max(Number(ttlMs) || DEFAULT_TTL_MS, 1000), MAX_TTL_MS);
  const sessionIdSha = sha12(sessionId);
  const decision = {
    schema_version: GATE_STORE_SCHEMA,
    decision_id: computeDecisionId({ taskRef, runId, sessionIdSha, generation }),
    task_ref: String(taskRef),
    run_id: String(runId),
    session_id: String(sessionId),
    session_id_sha: sessionIdSha,
    generation: Number(generation),
    question: { prompt: String(question.prompt), options: [...question.options] },
    state: "REGISTERED",
    created_at: new Date(nowMs).toISOString(),
    expires_at: new Date(nowMs + boundedTtl).toISOString(),
    ttl_ms: boundedTtl,
    transport: null,
    telegram_message_id: telegramMessageId,
    consumed_update_ids: [],
    selected_option: null,
    decided_at: null,
    history: [{ state: "REGISTERED", at: new Date(nowMs).toISOString() }],
  };
  store.decisions.push(decision);
  return decision;
}

/** NOTIFIED — the transport proof (message id) is recorded after the send. */
export function markNotified(store, decisionId, { transport, messageId = null, nowMs = Date.now() }) {
  const d = store.decisions.find((x) => x.decision_id === decisionId);
  if (!d) return { ok: false, reason: "GATE_DECISION_UNKNOWN" };
  if (d.state !== "REGISTERED") return { ok: false, reason: `GATE_BAD_TRANSITION_${d.state}` };
  d.transport = String(transport);
  d.telegram_message_id = messageId;
  appendHistory(d, "NOTIFIED", nowMs);
  return { ok: true, decision: d };
}

/**
 * Fence law — preserved verbatim from the V2 driver (admitGateCallback).
 * All failures fail closed. EXPIRED mutates the decision (terminal);
 * every other rejection leaves the decision untouched (idempotent receipts
 * via consumed_update_ids for duplicate detection).
 */
export function admitGateCallback(store, cb, { taskRef, sessionId, generation, nowMs = Date.now() }) {
  const d = store.decisions.find((x) => x.decision_id === cb.decision_id);
  if (!d) return { ok: false, reason: "GATE_DECISION_UNKNOWN" };
  if (d.state !== "PENDING" && d.state !== "NOTIFIED") return { ok: false, reason: "GATE_DECISION_ALREADY_CONSUMED" };
  if (nowMs >= Date.parse(d.expires_at)) { appendHistory(d, "EXPIRED", nowMs); return { ok: false, reason: "GATE_DECISION_EXPIRED" }; }
  if (d.consumed_update_ids.includes(String(cb.update_id))) return { ok: false, reason: "GATE_UPDATE_REUSED" };
  if (d.task_ref !== taskRef) return { ok: false, reason: "GATE_TASK_MISMATCH" };
  if (d.session_id_sha !== sha12(sessionId)) return { ok: false, reason: "GATE_SESSION_MISMATCH" };
  if (d.generation !== Number(generation)) return { ok: false, reason: "GATE_GENERATION_MISMATCH" };
  if (!["A", "B", "C"].includes(cb.option)) return { ok: false, reason: "GATE_ANSWER_INVALID" };
  appendHistory(d, "VERIFIED", nowMs);
  d.selected_option = cb.option;
  d.decided_at = new Date(nowMs).toISOString();
  d.consumed_update_ids.push(String(cb.update_id));
  return { ok: true, decision: d };
}

/** RETURNED — an answer was handed back to the caller through the adapter. */
export function markReturned(store, decisionId, { nowMs = Date.now() } = {}) {
  const d = store.decisions.find((x) => x.decision_id === decisionId);
  if (!d) return { ok: false, reason: "GATE_DECISION_UNKNOWN" };
  if (d.state !== "VERIFIED") return { ok: false, reason: `GATE_BAD_TRANSITION_${d.state}` };
  appendHistory(d, "RETURNED", nowMs);
  return { ok: true, decision: d };
}

/** CONSUMED — the continuation confirmed it used the operator answer. */
export function markConsumed(store, decisionId, { nowMs = Date.now() } = {}) {
  const d = store.decisions.find((x) => x.decision_id === decisionId);
  if (!d) return { ok: false, reason: "GATE_DECISION_UNKNOWN" };
  if (d.state !== "RETURNED") return { ok: false, reason: `GATE_BAD_TRANSITION_${d.state}` };
  appendHistory(d, "CONSUMED", nowMs);
  return { ok: true, decision: d };
}

/** NO_ANSWER — TTL elapsed (or transport closed) with no verified callback. */
export function markNoAnswer(store, decisionId, { nowMs = Date.now() } = {}) {
  const d = store.decisions.find((x) => x.decision_id === decisionId);
  if (!d) return { ok: false, reason: "GATE_DECISION_UNKNOWN" };
  if (["CONSUMED", "RETURNED", "VERIFIED"].includes(d.state)) return { ok: false, reason: `GATE_BAD_TRANSITION_${d.state}` };
  appendHistory(d, "NO_ANSWER", nowMs);
  return { ok: true, decision: d };
}

/** Schema law for the human_gate tool input. Fail closed on any deviation. */
export function validateHumanGateInput(args) {
  const errors = [];
  const taskRef = args?.task_ref;
  const runId = args?.run_id;
  const generation = args?.generation;
  const prompt = args?.question?.prompt;
  const options = args?.question?.options;
  if (typeof taskRef !== "string" || taskRef.length === 0 || taskRef.length > 128) errors.push("task_ref");
  if (typeof runId !== "string" || runId.length === 0 || runId.length > 64) errors.push("run_id");
  if (!Number.isInteger(generation) || generation < 1) errors.push("generation");
  if (typeof prompt !== "string" || prompt.length === 0 || prompt.length > 2000) errors.push("question.prompt");
  if (!Array.isArray(options) || options.length !== 3 || options[0] !== "A" || options[1] !== "B" || options[2] !== "C") errors.push("question.options");
  return { ok: errors.length === 0, errors };
}
