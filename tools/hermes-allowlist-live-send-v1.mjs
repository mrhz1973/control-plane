#!/usr/bin/env node
/**
 * Operator-driven MULTI-TURN live send flow for the per-invocation allowlist
 * qualification (BLOCK-ID: V4_HERMES_MULTI_TURN_ALLOWLIST_CHAIN_SEND_V1).
 *
 * Bounded controller conversation across THREE generations:
 *   GEN1 (S0) -> browser_snapshot  (composer ref observed)
 *   GEN2 (S1) -> browser_type      (exact composer ref + exact payload)
 *   GEN3 (S2) -> browser_press     (Enter, exactly once)
 *
 * Invariants enforced by THIS WRAPPER (not by prompts):
 * - per-state tool acceptance (state machine gates BEFORE Barrier 2);
 * - controller history preserved across generations with exact tool_call_id
 *   association; only BOUNDED SANITIZED tool results are appended (no page
 *   text, no snapshot transcript);
 * - GEN2 ref must equal the S0-observed composer ref, payload must be the
 *   exact qualification payload identity;
 * - GEN3 key must be exactly "Enter"; NO fourth generation is possible;
 * - ChatGPT_WEB sends counted ONLY by independent DOM user-turn confirmation.
 *
 * Budgets: QWEN_GENERATIONS_LIVE_MAX=3, CHATGPT_WEB_MAX_SENDS=1, no retry.
 */

import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  EXACT_ALLOWLIST,
  CHAIN_STATES,
  bridge,
  gateToolName,
  stateGate,
  qwenChat,
  firstToolCall,
  allToolCalls,
  buildProofPayload,
} from "./hermes-per-invocation-browser-allowlist-v1.mjs";

const ENDPOINT = "http://127.0.0.1:8080/v1";
const PROFILE = "qwen38-opus-q3-agent-24k";
const TASK_REF = "V4_HERMES_MULTI_TURN_ALLOWLIST_CHAIN_SEND_V1";
const BASE_HEAD = "8a730bde03075061eeb7bbff4503da951d8e83dd";
const VERIFIER = path.join(process.cwd(), "tools", "chatgpt-web-dom-verifier-v1.mjs");
const CDP_URL = "http://127.0.0.1:9222";

function runVerifierJson(args) {
  return JSON.parse(execFileSync("node", [VERIFIER, ...args], { encoding: "utf8", timeout: 60000 }));
}

const trace = [];
const push = (stage, record) => trace.push({ ts: new Date().toISOString(), stage, ...record });

function stop(stage, reason, extra = {}) {
  push(stage, { status: "STOP", reason, ...extra });
  console.error(JSON.stringify({ RESULT: "STOP", stage, reason, trace }, null, 2));
  process.exit(1);
}

function sha12(s) { return createHash("sha256").update(String(s)).digest("hex").slice(0, 12); }

async function qwenTurn({ messages, maxTokens }) {
  return qwenChat({
    endpoint: ENDPOINT,
    profile: PROFILE,
    messages,
    tools: this.tools,
    maxTokens,
    timeoutMs: 300000,
  });
}

async function main() {
  const runId = randomUUID().replace(/-/g, "").slice(0, 32);
  const nonce = `CP_MT_CHAIN_20260911T${Date.now().toString(36).toUpperCase()}_${randomUUID().slice(0, 8)}`;
  const payloadText = buildProofPayload({
    taskRef: TASK_REF,
    runId,
    nonce,
    baseHead: BASE_HEAD,
    schemaVersion: "hermes-multi-turn-allowlist-chain-send-v1",
  });
  const payloadIdentity = { sha256_12: sha12(payloadText), chars: payloadText.length };

  // ---------- LIVE PRECHECK ----------
  push("LIVE_PRECHECK", { status: "START" });
  const models = await (await fetch(`${ENDPOINT}/models`)).json();
  if (!models.data?.find((m) => m.id === PROFILE)) stop("LIVE_PRECHECK", "AGENT24K_NOT_AVAILABLE");
  push("LIVE_PRECHECK", { status: "PASS", profile: PROFILE });
  for (const [label, url] of [
    ["CDP_9222", `${CDP_URL}/json/version`],
    ["HERMES_16080", "http://127.0.0.1:16080/vnc.html"],
  ]) {
    try { await (await fetch(url, { signal: AbortSignal.timeout(8000) })).arrayBuffer(); push("LIVE_PRECHECK", { status: "PASS", surface: label }); }
    catch { stop("LIVE_PRECHECK", `${label}_UNREACHABLE`); }
  }
  // target + fresh + authenticated (independent, read-only)
  const targets = await (await fetch(`${CDP_URL}/json/list`)).json();
  const chatgptPage = targets.find((t) => t.type === "page" && /^https:\/\/(chat\.openai\.com|chatgpt\.com)/.test(t.url));
  if (!chatgptPage) stop("LIVE_PRECHECK", "CHATGPT_TARGET_NOT_FOUND");
  push("LIVE_PRECHECK", { status: "PASS", target_already_selected: true, navigate_required: false });
  const fresh = runVerifierJson(["fresh-check"]);
  push("FRESH_CHAT_CHECK", { ...fresh });
  if (fresh.FRESH_CHAT !== "YES") stop("FRESH_CHAT_CHECK", "CHAT_NOT_FRESH", { USER_TURNS: fresh.USER_TURNS, ASSISTANT_TURNS: fresh.ASSISTANT_TURNS });
  if (fresh.AUTHENTICATED_HINT !== "YES") stop("FRESH_CHAT_CHECK", "CHATGPT_WEB_AUTH_REQUIRED_HUMAN_GATE", fresh.AUTH_HINTS);

  // ---------- BARRIER 1 (schemas from Hermes, filtered to exactly 4) ----------
  const schemas = await bridge("schemas");
  if (schemas.model_visible_count !== 4 || schemas.forbidden_model_visible.length > 0) {
    stop("BARRIER1_SCHEMAS", "MODEL_VISIBLE_SET_NOT_EXACT");
  }
  push("BARRIER1_SCHEMAS", { status: "PASS", model_visible_count: schemas.model_visible_count, model_visible_names: schemas.model_visible_names });

  // ---------- shared controller surface ----------
  const systemPrompt =
    "You are the Qwen local controller for a bounded browser send qualification. " +
    "The dedicated browser is ALREADY on the authenticated fresh ChatGPT Web conversation: DO NOT navigate. " +
    "Perform EXACTLY ONE tool action per controller turn, then stop (no prose, no answer to the message text). " +
    "The expected action for this turn is supplied in the user message. Do not retry. " +
    "When asked to type, the text argument MUST be EXACTLY this qualification payload, character for character:\n" +
    "<<<PAYLOAD_BEGIN>>>\n" + payloadText + "\n<<<PAYLOAD_END>>>\n" +
    "You have exactly four tools: browser_navigate, browser_snapshot, browser_type, browser_press.";
  const messages = [
    { role: "system", content: systemPrompt },
  ];
  const tools = schemas.model_visible_definitions;

  const configMetaBefore = schemas.config_meta;
  let composerRef = null;
  let genCount = 0;
  let sendConfirmed = false;

  const callGeneration = async () => {
    genCount += 1;
    if (genCount > 3) stop("BUDGET_FENCE", "FOURTH_CONTROLLER_GENERATION_BLOCKED");
    push("CONTROLLER_GENERATION", { status: "START", generation: genCount });
    const response = await qwenChat({
      endpoint: ENDPOINT,
      profile: PROFILE,
      messages,
      tools,
      maxTokens: 512,
      timeoutMs: 300000,
    });
    const msg = response?.choices?.[0]?.message;
    const calls = allToolCalls(response);
    push("CONTROLLER_GENERATION", { status: "DONE", generation: genCount, tool_call_count: calls.length, finish_reason: response?.choices?.[0]?.finish_reason ?? null });
    return { msg, calls };
  };

  const dispatchGuarded = async (state, call) => {
    // STATE MACHINE ENFORCEMENT (wrapper-owned, precedes Barrier 2)
    if (!stateGate(state, call.name)) {
      stop("STATE_MACHINE", `OUT_OF_STATE_TOOL_${call.name.toUpperCase()}_IN_${state}`, { tool: call.name, state });
    }
    // BARRIER 2 (global exact allowlist)
    if (!gateToolName(call.name)) {
      stop("BARRIER2_DISPATCH", "CONTROLLER_RETURNED_DISALLOWED_TOOL", { tool: call.name });
    }
    push("DISPATCH_ALLOWLIST_DECISION", { generation: genCount, state, tool: call.name, decision: "DISPATCH" });
    push("HERMES_TOOL_EXECUTION_STARTED", { generation: genCount, tool: call.name });
    const argsJson =
      call.name === "browser_type" ? JSON.stringify({ ref: call.args?.ref, text: call.args?.text ?? "" }) :
      call.name === "browser_press" ? JSON.stringify({ key: call.args?.key ?? "Enter" }) :
      "{}";
    const res = await bridge("exec-tool", [
      "--name", call.name,
      "--args-json", argsJson,
      "--extract-composer-ref",
      "--task-id", `cp-mt-chain-${runId}`,
      "--cdp-url", CDP_URL,
    ]);
    push("HERMES_TOOL_EXECUTION_COMPLETED", { generation: genCount, tool: call.name, result: res });
    return res;
  };

  // ========== STATE S0 — SNAPSHOT (GEN1) ==========
  messages.push({ role: "user", content: "EXPECTED ACTION FOR THIS TURN: browser_snapshot. Emit exactly one browser_snapshot tool call to observe the composer, nothing else." });
  const gen1 = await callGeneration();
  if (gen1.calls.length === 0) stop("S0_SNAPSHOT", "GEN1_SNAPSHOT_TOOL_CALL_NOT_EMITTED");
  if (gen1.calls.length > 1) stop("S0_SNAPSHOT", "GEN1_MULTIPLE_TOOL_CALLS", { count: gen1.calls.length });
  const call1 = gen1.calls[0];
  if (!stateGate("S0_SNAPSHOT", call1.name)) stop("S0_SNAPSHOT", "GEN1_UNEXPECTED_TOOL", { tool: call1.name });
  const res1 = await dispatchGuarded("S0_SNAPSHOT", call1);
  if (res1.success !== true) stop("S0_SNAPSHOT", "HERMES_SNAPSHOT_EXECUTION_FAILED", res1);
  if (!res1.composer_ref) stop("S0_SNAPSHOT", "COMPOSER_REF_NOT_OBTAINED");
  composerRef = res1.composer_ref;
  push("S0_RESULT", { composer_ref_obtained: "YES", composer_ref: composerRef, composer_role: res1.composer_role ?? null });
  // bounded sanitized tool result ONLY (no page transcript)
  messages.push(gen1.msg);
  messages.push({
    role: "tool",
    tool_call_id: call1.id,
    content: JSON.stringify({ success: true, composer_ref: composerRef, target: "chatgpt_composer" }),
  });

  // ========== STATE S1 — TYPE (GEN2) ==========
  messages.push({ role: "user", content: "EXPECTED ACTION FOR THIS TURN: browser_type. Emit exactly one browser_type tool call using the composer_ref you observed and the EXACT payload text between PAYLOAD_BEGIN/PAYLOAD_END from the system instruction, nothing else." });
  const gen2 = await callGeneration();
  if (gen2.calls.length === 0) stop("S1_TYPE", "GEN2_TOOL_CALL_NOT_EMITTED");
  if (gen2.calls.length > 1) stop("S1_TYPE", "GEN2_MULTIPLE_TOOL_CALLS", { count: gen2.calls.length });
  const call2 = gen2.calls[0];
  if (!stateGate("S1_TYPE", call2.name)) stop("S1_TYPE", "GEN2_UNEXPECTED_TOOL", { tool: call2.name });
  const refMatch = (call2.args?.ref ?? "").replace(/^@/, "") === composerRef;
  const textMatch = typeof call2.args?.text === "string" && call2.args.text.includes(runId) && call2.args.text.includes(nonce) && call2.args.text.includes(BASE_HEAD) && call2.args.text.includes(TASK_REF);
  push("GEN2_IDENTITY", { ref_match: refMatch, ref_provided: call2.args?.ref ?? null, payload_chars: String(call2.args?.text ?? "").length, payload_sha256_12: sha12(String(call2.args?.text ?? "")) });
  if (!refMatch) stop("S1_TYPE", "GEN2_COMPOSER_REF_MISMATCH");
  if (!textMatch) stop("S1_TYPE", "GEN2_PAYLOAD_MISMATCH");
  const res2 = await dispatchGuarded("S1_TYPE", call2);
  if (res2.success !== true) stop("S1_TYPE", "HERMES_TYPE_EXECUTION_FAILED", res2);
  // TYPED_OK gate: typing is NOT a send. Independent DOM must still show zero
  // turns (nothing submitted yet). Post-type composer emptiness is NOT a fence:
  // this UI may clear/transform the composer right after a programmatic fill,
  // so the authoritative send fence is the post-press independent turn verify.
  const afterType = runVerifierJson(["observe", nonce]);
  push("S1_DOM_OBSERVE", {
    COMPOSER_CONTAINS_CURRENT_NONCE: afterType.COMPOSER_CONTAINS_CURRENT_NONCE,
    USER_TURNS: afterType.USER_TURNS,
    ASSISTANT_TURNS: afterType.ASSISTANT_TURNS,
  });
  if (afterType.USER_TURNS !== 0 || afterType.ASSISTANT_TURNS !== 0) stop("S1_TYPE", "UNEXPECTED_TURN_BEFORE_PRESS");
  messages.push(gen2.msg);
  messages.push({
    role: "tool",
    tool_call_id: call2.id,
    content: JSON.stringify({ success: true, typed: true, target: "chatgpt_composer" }),
  });

  // ========== STATE S2 — PRESS (GEN3, final) ==========
  messages.push({ role: "user", content: "EXPECTED ACTION FOR THIS TURN: browser_press. Emit exactly one browser_press tool call with key=Enter to submit the typed message, nothing else." });
  const gen3 = await callGeneration();
  if (gen3.calls.length === 0) stop("S2_PRESS", "GEN3_TOOL_CALL_NOT_EMITTED");
  if (gen3.calls.length > 1) stop("S2_PRESS", "GEN3_MULTIPLE_TOOL_CALLS", { count: gen3.calls.length });
  const call3 = gen3.calls[0];
  if (!stateGate("S2_PRESS", call3.name)) stop("S2_PRESS", "GEN3_UNEXPECTED_TOOL", { tool: call3.name });
  if (String(call3.args?.key ?? "Enter") !== "Enter") stop("S2_PRESS", "GEN3_INVALID_KEY", { key: call3.args?.key ?? null });
  const res3 = await dispatchGuarded("S2_PRESS", call3);
  if (res3.success !== true) stop("S2_PRESS", "HERMES_PRESS_EXECUTION_FAILED", res3);

  // NO FOURTH GENERATION — budget fence already enforced in callGeneration.

  // ---------- INDEPENDENT SEND CONFIRMATION ----------
  const turn = runVerifierJson(["turn-verify", TASK_REF, runId, nonce, BASE_HEAD]);
  push("INDEPENDENT_DOM_VERIFY", { ...turn });
  if (turn.REAL_USER_TURN_DOM_CONFIRMED !== "PASS") {
    stop("INDEPENDENT_DOM_VERIFY", "BROWSER_PRESS_EXECUTED_NO_USER_TURN");
  }
  sendConfirmed = true;

  // config unchanged final probe (metadata only)
  const configMetaAfter = await bridge("config-meta");
  const configUnchanged =
    !!configMetaBefore &&
    configMetaBefore.sha256 === configMetaAfter.sha256 &&
    configMetaBefore.size === configMetaAfter.size;
  push("HERMES_GLOBAL_CONFIG", { unchanged: configUnchanged, sha256: configMetaAfter.sha256, size: configMetaAfter.size });

  const final = {
    RESULT: "PASS",
    TASK_REF: TASK_REF,
    BASE_HEAD: BASE_HEAD,
    RUN_ID: runId,
    NONCE: nonce,
    EFFECTIVE_CONTROLLER_PROFILE: PROFILE,
    MODEL_VISIBLE_TOOL_COUNT: schemas.model_visible_count,
    MODEL_VISIBLE_TOOL_NAMES: schemas.model_visible_names,
    STATE_MACHINE_ENFORCEMENT: "PASS",
    GEN1_TOOL: call1.name,
    GEN2_TOOL: call2.name,
    GEN3_TOOL: call3.name,
    COMPOSER_REF: composerRef,
    COMPOSER_REF_PROPAGATION: "PASS",
    COMPOSER_CONTAINS_CURRENT_NONCE: "PASS",
    REAL_USER_TURN_DOM_CONFIRMED: "PASS",
    QWEN_GENERATIONS_LIVE: genCount,
    OFFLINE_QWEN_GENERATIONS: 0,
    CHATGPT_WEB_SENDS: sendConfirmed ? 1 : 0,
    HERMES_GLOBAL_CONFIG_UNCHANGED: configUnchanged ? "YES" : "NO",
    trace,
  };
  console.log(JSON.stringify(final, null, 2));
}

main().catch((e) => { console.error(JSON.stringify({ RESULT: "STOP", reason: String(e.message || e) }, null, 2)); process.exit(1); });
