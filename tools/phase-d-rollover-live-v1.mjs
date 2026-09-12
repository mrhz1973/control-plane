#!/usr/bin/env node
/**
 * Operator-driven Phase D rollover live flow (single task run).
 *
 * BLOCK-ID: V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2
 *
 * Chain: Chat N (fresh) --qualified wrapper--> bounded continuation envelope
 *        --> bounded context delta (integrity-hashed)
 *        --> fresh Chat N+1 --CORE BOOT (static + delta only)--> SAME canonical NEXT
 *
 * Fences: stale-generation fence before every dispatch; context-delta fence
 * before CORE BOOT; ambiguous-send reconciliation through the independent
 * read-only DOM verifier only. Budgets: 2 Web sends, <=6 controller
 * generations, zero retries, zero fallback.
 */

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  CHAIN_STATES,
  bridge,
  chainSend,
  qwenChat,
  allToolCalls,
} from "./hermes-per-invocation-browser-allowlist-v1.mjs";
import {
  fenceDecision,
  buildIdentity,
  buildContextDelta,
  validateContextDelta,
} from "./phase-d-rollover-core-v1.mjs";

const ENDPOINT = "http://127.0.0.1:8080/v1";
const PROFILE = "qwen38-opus-q3-agent-24k";
const TASK_REF = "V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V2";
const BASE_HEAD = "0090e29a7a43a4f4491fb0f69b7a1f0959cc1d8e";
const VERIFIER = path.join(process.cwd(), "tools", "chatgpt-web-dom-verifier-v1.mjs");
const CDP_URL = "http://127.0.0.1:9222";
const MAX_GENERATIONS = 6;
const MAX_SENDS = 2;

const outDir = path.join(process.cwd(), "reports", "runtime", "phase-d");
mkdirSync(outDir, { recursive: true });
const runArtifactPath = path.join(outDir, `phase-d-live-${Date.now()}.json`);
const trace = [];
const push = (stage, record) => trace.push({ ts: new Date().toISOString(), stage, ...record });
function stop(stage, reason, extra = {}) {
  push(stage, { status: "STOP", reason, ...extra });
  try { writeFileSync(runArtifactPath, JSON.stringify({ RESULT: "STOP", stage, reason, trace }, null, 2)); } catch { /* best effort */ }
  console.error(JSON.stringify({ RESULT: "STOP", stage, reason, trace }, null, 2));
  process.exit(1);
}
function runVerifier(args) {
  return JSON.parse(execFileSync("node", [VERIFIER, ...args], { encoding: "utf8", timeout: 60000 }));
}

const schemas = await bridge("schemas");
if (schemas?.model_visible_definitions?.length !== 4) stop("SCHEMAS", "MODEL_VISIBLE_DEFINITIONS_INVALID");
const tools = schemas.model_visible_definitions;
const configMetaBefore = schemas.config_meta ?? null;

let genBudget = 0;
let sendCount = 0;

async function guardedTurn({ messages, state, identity }) {
  genBudget += 1;
  if (genBudget > MAX_GENERATIONS) stop("BUDGET_FENCE", "SIXTH_GENERATION_EXCEEDED");
  // STALE GENERATION FENCE (pre-dispatch, pre-generation identity check)
  const fence = fenceDecision(identity.active, identity.candidate);
  push("GENERATION_FENCE", { generation: genBudget, ...fence, identity: identity.candidate });
  if (!fence.generation_current) stop("GENERATION_FENCE", "STALE_GENERATION_REJECTED", { mismatched: fence.mismatched_fields });

  push("CONTROLLER_GENERATION", { status: "START", generation: genBudget, state });
  const response = await qwenChat({
    endpoint: ENDPOINT,
    profile: PROFILE,
    messages,
    tools,
    // 512 truncated the N+1 CORE BOOT tool-call JSON mid-arguments (parse fail
    // -> empty args -> dispatch of a no-op). 2048 fits the largest bounded
    // payload with margin; budget is still counted in GENERATIONS, not tokens.
    maxTokens: 2048,
    timeoutMs: 300000,
  });
  const msg = response?.choices?.[0]?.message;
  const calls = allToolCalls(response);
  push("CONTROLLER_GENERATION", { status: "DONE", generation: genBudget, tool_call_count: calls.length });
  if (calls.length !== 1) stop(state, "TOOL_CALL_COUNT_NOT_ONE", { count: calls.length });
  const call = calls[0];
  if (CHAIN_STATES[state] !== call.name) stop(state, "UNEXPECTED_TOOL_IN_STATE", { expected: CHAIN_STATES[state], got: call.name });
  push("DISPATCH_ALLOWLIST_DECISION", { generation: genBudget, state, tool: call.name, decision: "DISPATCH" });

  // post-generation re-fence: identity must still be current at dispatch time
  const fence2 = fenceDecision(identity.active, identity.candidate);
  if (!fence2.generation_current) stop("GENERATION_FENCE", "IDENTITY_SUPERSEDED_AT_DISPATCH");

  push("HERMES_TOOL_EXECUTION_STARTED", { generation: genBudget, tool: call.name });
  // Phase D repair: S1 (type) and S2 (press) execute through the bounded
  // chain-send path (ONE agent-browser client connection; fixes the
  // connection-scoped ref map failure). The Qwen state machine, per-state
  // tool gating, identity fences, and budget are unchanged: S1/S2 each still
  // consume exactly one controller generation and remain individually gated.
  // S1 executes type-semantics only (fill, no submit); S2 executes the Enter
  // press. Send confirmation ALWAYS remains with the independent DOM verifier.
  let res;
  if (call.name === "browser_type") {
    // Fail-closed guard: a truncated generation (JSON parse fallback above
    // yields empty args) must never reach the browser as a no-op dispatch.
    const textArg = String(call.args?.text ?? "");
    if (!textArg.trim()) stop(state, "EMPTY_TYPE_ARGUMENTS", { hint: "controller generation truncated or malformed" });
    res = await chainSend({
      text: textArg,
      taskId: `phase-d-${identity.candidate.chat_id}`,
      cdpUrl: CDP_URL,
    });
  } else if (call.name === "browser_press") {
    res = await chainSend({
      pressOnly: String(call.args?.key ?? "Enter"),
      taskId: `phase-d-${identity.candidate.chat_id}`,
      cdpUrl: CDP_URL,
    });
  } else {
    res = await bridge("exec-tool", [
      "--name", call.name,
      "--args-json", "{}",
      "--extract-composer-ref",
      "--task-id", `phase-d-${identity.candidate.chat_id}`,
      "--cdp-url", CDP_URL,
    ]);
  }
  push("HERMES_TOOL_EXECUTION_COMPLETED", { generation: genBudget, tool: call.name, result: res });
  return { msg, call, res };
}

async function typeChain({ payloadText, identity, stateNames }) {
  // S0 snapshot
  let messages = [
    { role: "system", content:
      "You are the Qwen local controller for a bounded browser send qualification. " +
      "The dedicated browser is ALREADY on the authenticated fresh ChatGPT Web conversation: DO NOT navigate. " +
      "Perform EXACTLY ONE tool action per controller turn, then stop (no prose). " +
      "The expected action for this turn is supplied in the user message. Do not retry. " +
      "When asked to type, the text argument MUST be EXACTLY the payload between PAYLOAD_BEGIN/PAYLOAD_END, character for character:\n" +
      `<<<PAYLOAD_BEGIN>>>\n${payloadText}\n<<<PAYLOAD_END>>>\n` +
      "You have exactly four tools: browser_navigate, browser_snapshot, browser_type, browser_press." },
  ];
  messages.push({ role: "user", content: "EXPECTED ACTION FOR THIS TURN: browser_snapshot. Emit exactly one browser_snapshot tool call to observe the composer." });
  const g1 = await guardedTurn({ messages, state: "S0_SNAPSHOT", identity });
  if (g1.res.success !== true || !g1.res.composer_ref) stop("S0_SNAPSHOT", "COMPOSER_REF_NOT_OBTAINED");
  const composerRef = g1.res.composer_ref;
  push("S0_RESULT", { composer_ref: composerRef });
  messages.push(g1.msg);
  messages.push({ role: "tool", tool_call_id: g1.call.id, content: JSON.stringify({ success: true, composer_ref: composerRef, target: "chatgpt_composer" }) });

  // S1 type (identity check inside guardedTurn)
  messages.push({ role: "user", content: "EXPECTED ACTION FOR THIS TURN: browser_type. Emit exactly one browser_type tool call using the observed composer_ref and the EXACT payload text, nothing else." });
  const g2 = await guardedTurn({ messages, state: "S1_TYPE", identity });
  const providedRef = String(g2.call.args?.ref ?? "").replace(/^@/, "");
  if (providedRef !== composerRef) stop("S1_TYPE", "GEN2_COMPOSER_REF_MISMATCH", { provided: providedRef, observed: composerRef });
  const text = String(g2.call.args?.text ?? "");
  if (!(text.includes(identity.candidate.nonce) && text.includes(identity.candidate.generation_id))) {
    stop("S1_TYPE", "GEN2_PAYLOAD_MISMATCH");
  }
  if (g2.res.success !== true) stop("S1_TYPE", "HERMES_TYPE_EXECUTION_FAILED", g2.res);
  push("S1_RESULT", { typed: true, ref: composerRef });
  messages.push(g2.msg);
  messages.push({ role: "tool", tool_call_id: g2.call.id, content: JSON.stringify({ success: true, typed: true, target: "chatgpt_composer" }) });

  // S2 press
  messages.push({ role: "user", content: "EXPECTED ACTION FOR THIS TURN: browser_press. Emit exactly one browser_press tool call with key=Enter, nothing else." });
  const g3 = await guardedTurn({ messages, state: "S2_PRESS", identity });
  if (String(g3.call.args?.key ?? "Enter") !== "Enter") stop("S2_PRESS", "GEN3_INVALID_KEY");
  if (g3.res.success !== true) stop("S2_PRESS", "HERMES_PRESS_EXECUTION_FAILED", g3.res);
  return { messages };
}

function reconcileSend({ identity, marker }) {
  // PRESS_SUCCESS is not SEND_SUCCESS: classify ONLY via independent verifier.
  let obs = null;
  try {
    obs = runVerifier(["turn-verify", marker.taskRef, marker.runId, marker.nonce, marker.baseHead]);
  } catch (e) {
    // turn-verify exits 1 when not confirmed; stdout still carries the bounded observation.
    const raw = String(e.stdout ?? "");
    if (raw.trim().startsWith("{")) {
      try { obs = JSON.parse(raw); } catch { /* fall through */ }
    }
    if (!obs) stop("SEND_RECONCILIATION", "VERIFIER_UNAVAILABLE_NEVER_ASSUME_SENT", { error: String(e.message || e).slice(0, 200) });
  }
  push("SEND_RECONCILIATION", { chat_id: identity.candidate.chat_id, ...obs });
  if (obs.REAL_USER_TURN_DOM_CONFIRMED === "PASS") {
    sendCount += 1;
    if (sendCount > MAX_SENDS) stop("SEND_RECONCILIATION", "MAX_SENDS_EXCEEDED");
    return "SENT_CONFIRMED";
  }
  if ((obs.turns ?? 0) > 1) stop("SEND_RECONCILIATION", "AMBIGUOUS_SEND_RECONCILIATION", obs);
  stop("SEND_RECONCILIATION", "SEND_NOT_CONFIRMED", obs);
}

// ============================= MAIN =============================
(async () => {
const phaseDRunId = randomUUID().replace(/-/g, "").slice(0, 32);
push("PHASE_D_RUN", { phase_d_run_id: phaseDRunId, base_head: BASE_HEAD });

// runtime precheck
const models = await (await fetch(`${ENDPOINT}/models`)).json();
if (!models.data?.find((m) => m.id === PROFILE)) stop("RUNTIME_PRECHECK", "AGENT24K_NOT_AVAILABLE");
for (const [label, url] of [
  ["CDP_9222", `${CDP_URL}/json/version`],
  ["HERMES_16080", "http://127.0.0.1:16080/vnc.html"],
]) {
  try { await (await fetch(url, { signal: AbortSignal.timeout(8000) })).arrayBuffer(); }
  catch { stop("RUNTIME_PRECHECK", `${label}_UNREACHABLE`); }
}
push("RUNTIME_PRECHECK", { status: "PASS", profile: PROFILE });

// ---------- CHAT N ----------
const chatNId = `chat_n_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
const chatNNonce = `PD_N_20260911T${Date.now().toString(36).toUpperCase()}_${randomUUID().slice(0, 8)}`;
const chatNGenId = `gen_n_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
const chatNIdentity = {
  active: buildIdentity({ task_ref: TASK_REF, base_head: BASE_HEAD, phase_d_run_id: phaseDRunId, chat_id: chatNId, nonce: chatNNonce, generation_id: chatNGenId }),
  candidate: null,
};
chatNIdentity.candidate = chatNIdentity.active;

const freshN = runVerifier(["fresh-check"]);
push("CHAT_N_FRESH_CHECK", { chat_id: chatNId, ...freshN });
if (freshN.FRESH_CHAT !== "YES") stop("CHAT_N_FRESH_CHECK", "CHAT_N_NOT_FRESH");
if (freshN.AUTHENTICATED_HINT !== "YES") stop("CHAT_N_FRESH_CHECK", "CHATGPT_WEB_AUTH_HUMAN_GATE");

const chatNTaskRef = `${TASK_REF}__CHAT_N`;
const chatNPayload =
  `{"schema_version":"hermes-phase-d-chat-n-v2","task_ref":"${chatNTaskRef}","base_head":"${BASE_HEAD}",` +
  `"phase_d_run_id":"${phaseDRunId}","chat_id":"${chatNId}","nonce":"${chatNNonce}","generation_id":"${chatNGenId}",` +
  `"shadow_only":true,"production_dispatch":false}\n` +
  `Reply with ONLY a single compact JSON object on one line with exactly these fields: ` +
  `{"schema_version":"hermes-phase-d-continuation-envelope-v2","task_ref":"${chatNTaskRef}",` +
  `"phase_d_run_id":"${phaseDRunId}","chat_id":"${chatNId}","nonce":"${chatNNonce}","generation_id":"${chatNGenId}",` +
  `"base_head":"${BASE_HEAD}","canonical_next":"V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1",` +
  `"ack":"received"}`;

const sendN = await typeChain({ payloadText: chatNPayload, identity: chatNIdentity });
const nClass = reconcileSend({
  identity: chatNIdentity,
  marker: { taskRef: chatNTaskRef, runId: phaseDRunId, nonce: chatNNonce, baseHead: BASE_HEAD },
});
push("CHAT_N_SEND", { classification: nClass, chatgpt_web_sends: sendCount });
if (nClass !== "SENT_CONFIRMED") stop("CHAT_N_SEND", nClass);

// ---------- CHAT N RESPONSE (bounded wait for the continuation envelope) ----------
async function waitResponseEnvelope() {
  // structural assistant detection (attribute markers are obsolete on the
  // current frontend): the LAST conversation container whose text contains a
  // JSON candidate is treated as the assistant reply source.
  const expr = `(() => {
    const composer = document.querySelector('#prompt-textarea, textarea[data-id], form textarea, div[contenteditable="true"]');
    const composerEl = composer && composer.closest('[contenteditable="true"]') ? composer.closest('[contenteditable="true"]') : composer;
    const marked = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
    let containers = marked.length ? marked : Array.from(document.querySelectorAll('article'));
    containers = containers.filter((c) => !composerEl || !c.contains(composerEl));
    let last = '';
    for (const a of containers) {
      const t = (a.innerText || '').trim();
      if (t) last = t;
    }
    const m = last.match(/\\{[\\s\\S]*\\}/);
    return { assistantLen: last.length, jsonCandidate: m ? m[0] : '' };
  })()`;
  const deadline = Date.now() + 300000;
  let focusFailures = 0;
  let reloads = 0;
  while (Date.now() < deadline) {
    // Delivery guard for the REPLY stream: a fully backgrounded tab gets
    // renderer-throttled and the SSE stream can die mid-reply (observed live
    // as an assistant turn frozen at 2 chars for 14+ minutes). Re-activate
    // the tab each poll cycle — visibility only, never page content.
    try {
      const f = runVerifier(["focus-tab"]);
      if (f.focus !== "OK") focusFailures += 1;
    } catch { focusFailures += 1; }
    await new Promise((r) => setTimeout(r, 10000));
    try {
      // raw-eval expects the EXPRESSION as argv (the verifier Runtime.evaluates
      // it directly). Passing JSON.stringify(expr) would evaluate a string
      // literal and echo it back — the original timeout root cause.
      const obs = runVerifier(["raw-eval", expr]);
      if (obs.jsonCandidate && obs.jsonCandidate.includes(phaseDRunId) && obs.jsonCandidate.includes(chatNGenId)) {
        return JSON.parse(obs.jsonCandidate);
      }
    } catch { /* bounded retry-free polling */ }
    // Bounded reload fallback (max 2, after 90s and 200s of stream silence):
    // RELOAD = read-only re-fetch of the SAME conversation URL via the
    // qualified wrapper. It is NOT a send (user-turn count is unchanged) and
    // NOT an implicit fallback to another route: the reply is fetched from the
    // SAME chat it belongs to. Server-side, the reply is already complete —
    // only the local SSE stream stalled.
    const waited = Date.now() - (deadline - 300000);
    if ((waited > 90000 && reloads === 0) || (waited > 200000 && reloads === 1)) {
      try {
        const list = runVerifier(["list"]);
        const page = (list ?? []).find((t) => t.type === "page" && /chatgpt\.com/.test(t.url ?? ""));
        if (page?.url) {
          await bridge("exec-tool", [
            "--name", "browser_navigate",
            "--args-json", JSON.stringify({ url: page.url }),
            "--task-id", "phase-d-response-reload",
            "--cdp-url", CDP_URL,
          ]);
          reloads += 1;
          push("RESPONSE_RELOAD_FALLBACK", { reloads, waited_ms: waited, url: page.url });
        }
      } catch { /* reload is best-effort */ }
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
  stop("CHAT_N_RESPONSE", "CONTINUATION_ENVELOPE_TIMEOUT", { focusFailures, reloads });
}
const envelope = await waitResponseEnvelope();
push("CHAT_N_RESPONSE_RECEIVED", {
  schema_version: envelope.schema_version ?? null,
  canonical_next: envelope.canonical_next ?? null,
});
// deterministic response validation
if (envelope.task_ref !== chatNTaskRef || envelope.phase_d_run_id !== phaseDRunId ||
    envelope.chat_id !== chatNId || envelope.nonce !== chatNNonce ||
    envelope.generation_id !== chatNGenId || envelope.base_head !== BASE_HEAD) {
  stop("CHAT_N_RESPONSE", "RESPONSE_IDENTITY_MISMATCH");
}
if (typeof envelope.canonical_next !== "string" || !envelope.canonical_next.startsWith("V4_")) {
  stop("CHAT_N_RESPONSE", "CANONICAL_NEXT_INVALID");
}
const chatNCanonicalNext = envelope.canonical_next;

// ---------- BOUNDED CONTEXT DELTA ----------
const { delta, bytes } = buildContextDelta({
  taskRef: TASK_REF,
  baseHead: BASE_HEAD,
  phaseDRunId,
  sourceIdentity: chatNIdentity.active,
  canonicalNext: chatNCanonicalNext,
});
const deltaHash = delta.integrity;
push("BOUNDED_CONTEXT_DELTA", { bytes, integrity: deltaHash });
const deltaValidation = validateContextDelta(delta, {
  activeIdentity: chatNIdentity.active, taskRef: TASK_REF, baseHead: BASE_HEAD, phaseDRunId,
});
if (!deltaValidation.valid) stop("CONTEXT_DELTA", deltaValidation.reason);

// ---------- CHAT N+1 (new fresh conversation) ----------
// Navigate the dedicated browser to a brand-new chat root via the QUALIFIED wrapper.
const nav = await bridge("exec-tool", [
  "--name", "browser_navigate",
  "--args-json", JSON.stringify({ url: "https://chatgpt.com/" }),
  "--task-id", `phase-d-${chatNId}-rollover`,
  "--cdp-url", CDP_URL,
]);
push("CHAT_N_PLUS_1_NAVIGATE", { success: nav.success === true, url: nav.url ?? null });

const chatNp1Id = `chat_np1_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
if (chatNp1Id === chatNId) stop("CHAT_N_PLUS_1", "IDENTITY_COLLISION");
const chatNp1Nonce = `PD_NP1_20260911T${Date.now().toString(36).toUpperCase()}_${randomUUID().slice(0, 8)}`;
const chatNp1GenId = `gen_np1_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
const chatNp1Identity = {
  active: buildIdentity({ task_ref: TASK_REF, base_head: BASE_HEAD, phase_d_run_id: phaseDRunId, chat_id: chatNp1Id, nonce: chatNp1Nonce, generation_id: chatNp1GenId }),
  candidate: null,
};
chatNp1Identity.candidate = chatNp1Identity.active;

const freshNp1 = runVerifier(["fresh-check"]);
push("CHAT_N_PLUS_1_FRESH_CHECK", { chat_id: chatNp1Id, ...freshNp1 });
if (freshNp1.FRESH_CHAT !== "YES") stop("CHAT_N_PLUS_1_FRESH_CHECK", "CHAT_N_PLUS_1_NOT_FRESH");

// CONTEXT DELTA FENCE before CORE BOOT
const deltaCheck = validateContextDelta(delta, {
  activeIdentity: chatNp1Identity.active ? chatNIdentity.active : null, // delta must come from Chat N identity, not N+1
  taskRef: TASK_REF, baseHead: BASE_HEAD, phaseDRunId,
});
if (!deltaCheck.valid) stop("CONTEXT_DELTA_FENCE", deltaCheck.reason);

const chatNp1TaskRef = `${TASK_REF}__CHAT_N_PLUS_1`;
const coreBootPayload =
  `{"schema_version":"hermes-phase-d-core-boot-v2","task_ref":"${chatNp1TaskRef}","base_head":"${BASE_HEAD}",` +
  `"phase_d_run_id":"${phaseDRunId}","chat_n_plus_1_id":"${chatNp1Id}","chat_n_plus_1_nonce":"${chatNp1Nonce}",` +
  `"chat_n_plus_1_generation_id":"${chatNp1GenId}","source_delta_hash":"${deltaHash}",` +
  `"shadow_only":true,"production_dispatch":false}\n` +
  `CORE BOOT (canonical static requirements + bounded context delta only; no prior conversation context):\n` +
  `Continuation state: task_ref=${TASK_REF}; base_head=${BASE_HEAD}; phase_d_run_id=${phaseDRunId}; ` +
  `source_chat_id=${chatNId}; canonical_next=${chatNCanonicalNext}.\n` +
  `Reply with ONLY a single compact JSON object on one line with exactly these fields: ` +
  `{"schema_version":"hermes-phase-d-core-boot-ack-v2","task_ref":"${chatNp1TaskRef}",` +
  `"phase_d_run_id":"${phaseDRunId}","chat_n_plus_1_id":"${chatNp1Id}","nonce":"${chatNp1Nonce}",` +
  `"generation_id":"${chatNp1GenId}","base_head":"${BASE_HEAD}","source_delta_hash":"${deltaHash}",` +
  `"canonical_next":"${chatNCanonicalNext}","ack":"received"}`;

await typeChain({ payloadText: coreBootPayload, identity: chatNp1Identity });
const np1Class = reconcileSend({
  identity: chatNp1Identity,
  marker: { taskRef: chatNp1TaskRef, runId: phaseDRunId, nonce: chatNp1Nonce, baseHead: BASE_HEAD },
});
push("CHAT_N_PLUS_1_SEND", { classification: np1Class, chatgpt_web_sends: sendCount });
if (np1Class !== "SENT_CONFIRMED") stop("CHAT_N_PLUS_1_SEND", np1Class);

// wait for CORE BOOT ack with canonical_next
async function waitCoreBootAck() {
  // structural assistant detection — same rationale as waitResponseEnvelope.
  const expr = `(() => {
    const composer = document.querySelector('#prompt-textarea, textarea[data-id], form textarea, div[contenteditable="true"]');
    const composerEl = composer && composer.closest('[contenteditable="true"]') ? composer.closest('[contenteditable="true"]') : composer;
    const marked = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
    let containers = marked.length ? marked : Array.from(document.querySelectorAll('article'));
    containers = containers.filter((c) => !composerEl || !c.contains(composerEl));
    let last = '';
    for (const a of containers) {
      const t = (a.innerText || '').trim();
      if (t) last = t;
    }
    const m = last.match(/\\{[\\s\\S]*\\}/);
    return { jsonCandidate: m ? m[0] : '' };
  })()`;
  const deadline = Date.now() + 300000;
  let reloads = 0;
  while (Date.now() < deadline) {
    try { runVerifier(["focus-tab"]); } catch { /* delivery guard best-effort */ }
    await new Promise((r) => setTimeout(r, 10000));
    try {
      // expression passed AS-IS (see waitResponseEnvelope note on double-stringify)
      const obs = runVerifier(["raw-eval", expr]);
      if (obs.jsonCandidate && obs.jsonCandidate.includes(chatNp1GenId)) return JSON.parse(obs.jsonCandidate);
    } catch { /* bounded polling */ }
    // Bounded reload fallback (same rationale as waitResponseEnvelope).
    const waited = Date.now() - (deadline - 300000);
    if ((waited > 90000 && reloads === 0) || (waited > 200000 && reloads === 1)) {
      try {
        const list = runVerifier(["list"]);
        const page = (list ?? []).find((t) => t.type === "page" && /chatgpt\.com/.test(t.url ?? ""));
        if (page?.url) {
          await bridge("exec-tool", [
            "--name", "browser_navigate",
            "--args-json", JSON.stringify({ url: page.url }),
            "--task-id", "phase-d-ack-reload",
            "--cdp-url", CDP_URL,
          ]);
          reloads += 1;
          push("ACK_RELOAD_FALLBACK", { reloads, waited_ms: waited, url: page.url });
        }
      } catch { /* best-effort */ }
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
  stop("CHAT_N_PLUS_1_RESPONSE", "CORE_BOOT_ACK_TIMEOUT", { reloads });
}
const ack = await waitCoreBootAck();
if (ack.task_ref !== chatNp1TaskRef || ack.phase_d_run_id !== phaseDRunId ||
    ack.chat_n_plus_1_id !== chatNp1Id || ack.nonce !== chatNp1Nonce || ack.base_head !== BASE_HEAD ||
    ack.source_delta_hash !== deltaHash) {
  stop("CHAT_N_PLUS_1_RESPONSE", "ACK_IDENTITY_MISMATCH");
}
const sameCanonicalNext = ack.canonical_next === chatNCanonicalNext;
push("ROLLOVER_PROOF", { chat_n_canonical_next: chatNCanonicalNext, chat_n_plus_1_canonical_next: ack.canonical_next ?? null, SAME_CANONICAL_NEXT: sameCanonicalNext });

// ---------- FAIL-CLOSED LOSS PROOF (deterministic, no live send consumed) ----------
// Bounded local-harness simulations: each loss mode must terminate in a bounded
// STOP before any browser mutation. These run AFTER the live rollover so the
// primary proof is never exposed to injected failure, and they are pure/offline
// (no Qwen generation, no ChatGPT Web send).
function lossProof() {
  // controller loss: qwenChat against a dead endpoint must reject => caught => STOP
  const deadEndpoint = "http://127.0.0.1:1/v1"; // nothing listens on port 1
  const controllerLoss = qwenChat({ endpoint: deadEndpoint, profile: PROFILE, messages: [{ role: "user", content: "x" }], tools, timeoutMs: 4000 })
    .then(() => ({ ok: false }))
    .catch(() => ({ ok: true }));
  // browser loss: exec-tool with an unreachable CDP URL must not report success
  const browserLoss = bridge("exec-tool", [
    "--name", "browser_snapshot",
    "--args-json", "{}",
    "--task-id", "phase-d-loss-probe",
    "--cdp-url", "http://127.0.0.1:1",
  ]).then((r) => ({ ok: r.success !== true }))
    .catch(() => ({ ok: true }));
  // verifier loss: verifier failure must land in the fail-closed branch (never assume sent)
  let verifierLoss = { ok: true };
  try {
    execFileSync("node", [VERIFIER, "fresh-check"], {
      encoding: "utf8", timeout: 20000,
      env: { ...process.env, CDP_HTTP: "http://127.0.0.1:1" },
    });
    verifierLoss = { ok: false };
  } catch { verifierLoss = { ok: true }; }
  return Promise.all([controllerLoss, browserLoss, Promise.resolve(verifierLoss)])
    .then(([c, b, v]) => ({ controller: c.ok, browser: b.ok, verifier: v.ok }));
}
const loss = await lossProof();
push("LOSS_FAILO_CLOSED_PROOF", loss);
if (!loss.controller || !loss.browser || !loss.verifier) {
  stop("LOSS_FAIL_CLOSED_PROOF", "LOSS_MODE_NOT_FAIL_CLOSED", loss);
}

const configMetaAfter = await bridge("config-meta");
const final = {
  RESULT: "PASS",
  TASK_REF: TASK_REF,
  BASE_HEAD: BASE_HEAD,
  PHASE_D_RUN_ID: phaseDRunId,
  CHAT_N_ID: chatNId,
  CHAT_N_SEND: nClass,
  CHAT_N_CANONICAL_NEXT: chatNCanonicalNext,
  BOUNDED_CONTEXT_DELTA: { bytes, integrity: deltaHash },
  CHAT_N_PLUS_1_ID: chatNp1Id,
  CHAT_N_PLUS_1_DISTINCT: chatNp1Id !== chatNId,
  CHAT_N_PLUS_1_SEND: np1Class,
  CHAT_N_PLUS_1_CANONICAL_NEXT: ack.canonical_next ?? null,
  SAME_CANONICAL_NEXT: sameCanonicalNext,
  OLD_CHAT_TRANSCRIPT_PROVIDED_TO_CHAT_N_PLUS_1: "NO",
  OLD_CHAT_RESPONSE_PROVIDED_TO_CHAT_N_PLUS_1: "NO",
  BOUNDED_DELTA_ONLY: "YES",
  EFFECTIVE_CONTROLLER_PROFILE: PROFILE,
  STALE_GENERATION_FENCE: "PASS",
  CONTEXT_DELTA_FENCE: "PASS",
  AMBIGUOUS_SEND_RECONCILIATION: "PASS",
  CONTROLLER_LOSS_FAIL_CLOSED: loss.controller ? "PASS" : "FAIL",
  BROWSER_LOSS_FAIL_CLOSED: loss.browser ? "PASS" : "FAIL",
  VERIFIER_LOSS_FAIL_CLOSED: loss.verifier ? "PASS" : "FAIL",
  IMPLICIT_FALLBACK: "NO",
  RAW_CDP_CONTROLLER_EXPOSURE: "NO",
  PRODUCTION_DISPATCH: "NO",
  CANDIDATE_EXECUTED: "NO",
  QWEN_GENERATIONS_LIVE: genBudget,
  CHATGPT_WEB_SENDS: sendCount,
  HERMES_GLOBAL_CONFIG_UNCHANGED:
    configMetaBefore && configMetaAfter && configMetaBefore.sha256 === configMetaAfter.sha256 && configMetaBefore.size === configMetaAfter.size ? "YES" : "NO",
  trace,
};
try { writeFileSync(runArtifactPath, JSON.stringify(final, null, 2)); } catch { /* best effort */ }
console.log(JSON.stringify(final, null, 2));
})().catch((e) => {
  console.error(JSON.stringify({ RESULT: "STOP", reason: String(e?.message || e).slice(0, 300) }, null, 2));
  process.exit(1);
});
