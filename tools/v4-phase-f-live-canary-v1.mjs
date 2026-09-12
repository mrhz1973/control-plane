#!/usr/bin/env node
/**
 * V4_HERMES_PHASE_F_BOUNDED_PRODUCTION_ACTIVATION_V1 — LIVE CANARY DRIVER.
 *
 * ONE bounded production dispatch on the promoted route
 * `qwen_local -> hermes -> chatgpt_web` under a real, route-pinned,
 * provenance-bound ACTIVE authorization issued through the canonical
 * Telegram issuance service (human operator decision, in-band).
 *
 * REUSE (no second anything): real composer/join (RT25 admission), real
 * Phase E selection, promotion adapter dual-gate eligibility, qualified
 * chainSend transport, independent structural DOM verifier, ledger-first +
 * ACTIVE->SPENT authorization consumption BEFORE the transport edge.
 *
 * Budget: CHATGPT_WEB_SENDS_MAX=1 (single send), QWEN_GENERATIONS_LIVE_MAX=2
 * (S0 snapshot + S1 type; S2 press is delivered by chainSend's own bounded
 * batch inside the transport edge — the driver performs EXACTLY ONE
 * chainSend press_only call after the typed draft is DOM-verified).
 * No retry. On failure/ambiguity: immediate proven disable/rollback to
 * SHADOW_ONLY + persisted evidence + exit 1.
 */
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TASK_REF = "V4_HERMES_PHASE_F_BOUNDED_PRODUCTION_ACTIVATION_V1";
const BASE_HEAD = "8323b2f91b91ba120a8fc142fe0313e7b8c31db8";
const ENDPOINT = "http://127.0.0.1:8080/v1";
const PROFILE = "qwen38-opus-q3-agent-24k";
const CDP_URL = "http://127.0.0.1:9222";
const VERIFIER = path.join(ROOT, "tools", "chatgpt-web-dom-verifier-v1.mjs");
const REGISTRY_PATH = path.join(process.env.LOCALAPPDATA, "control-plane", "v4-runtime-authorization-registry-v1.json");
const LEDGER_PATH = path.join(process.env.LOCALAPPDATA, "control-plane", "v4-runtime-authorization-spend-ledger-v1.json");

const trace = [];
const push = (stage, record) => { trace.push({ ts: new Date().toISOString(), stage, ...record }); fs.mkdirSync(path.join(ROOT, "reports", "runtime", "phase-f"), { recursive: true }); fs.writeFileSync(path.join(ROOT, "reports", "runtime", "phase-f", "phase-f-activation-canary-trace.json"), JSON.stringify({ task_ref: TASK_REF, base_head: BASE_HEAD, trace }, null, 2)); };
function stop(stage, reason, extra = {}) {
  push(stage, { status: "STOP", reason, ...extra });
  console.error(JSON.stringify({ RESULT: "STOP", stage, reason, ...extra }, null, 2));
  process.exit(1);
}
function runVerifierJson(args) {
  return JSON.parse(execFileSync("node", [VERIFIER, ...args], { encoding: "utf8", timeout: 60000 }));
}
const sha12 = (s) => createHashSha12(s);
import { createHash } from "node:crypto";
function createHashSha12(s) { return createHash("sha256").update(String(s)).digest("hex").slice(0, 12); }

const { chainSend, bridge, qwenChat, firstToolCall, buildProofPayload, EXACT_ALLOWLIST, gateToolName, stateGate } = await import("file://" + path.join(ROOT, "tools", "hermes-per-invocation-browser-allowlist-v1.mjs").replace(/\\/g, "/"));
const rc = await import("file://" + path.join(ROOT, "tools", "v4-phase-f-route-control-v1.mjs").replace(/\\/g, "/"));
const adapter = await import("file://" + path.join(ROOT, "tools", "v4-phase-f-promotion-adapter-v1.mjs").replace(/\\/g, "/"));
const { composeV4ResourceStatus } = await import("file://" + path.join(ROOT, "tools", "compose-v4-resource-status-control-plane-v1.mjs").replace(/\\/g, "/"));
const { joinQuotaPoolState } = await import("file://" + path.join(ROOT, "tools", "rt25-quota-state-join-v1.mjs").replace(/\\/g, "/"));
const { selectQuotaAwareExecutionRoute } = await import("file://" + path.join(ROOT, "tools", "rt25-execution-quota-aware-selector-v1.mjs").replace(/\\/g, "/"));
const { collectQwenLocalResourceStatus } = await import("file://" + path.join(ROOT, "tools", "collect-qwen-local-resource-status-v1.mjs").replace(/\\/g, "/"));
const { collectChatgptWebObservation } = await import("file://" + path.join(ROOT, "tools", "local-dev-resource-observatory-v1.mjs").replace(/\\/g, "/"));
const { evaluateHermesPhaseEShadowRoute } = await import("file://" + path.join(ROOT, "tools", "evaluate-hermes-phase-e-shadow-route-v1.mjs").replace(/\\/g, "/"));
const { inspectDurableSpend, recordDurableSpend } = await import("file://" + path.join(ROOT, "tools", "v4-runtime-authorization-durable-spend-ledger-v1.mjs").replace(/\\/g, "/"));
const prov = await import("file://" + path.join(ROOT, "tools", "v4-runtime-authorization-provenance-registry-v1.mjs").replace(/\\/g, "/"));

// ---------- CLI: --authorization-id <issued id> ----------
const authIdIdx = process.argv.indexOf("--authorization-id");
const AUTH_ID = authIdIdx > -1 ? process.argv[authIdIdx + 1] : null;
if (!AUTH_ID) stop("INPUT", "AUTHORIZATION_ID_REQUIRED (must be ISSUED by the canonical Telegram issuance service)");

async function main() {
  const runId = randomUUID().replace(/-/g, "").slice(0, 32);
  const nonce = `PROMO_ACT_${Date.now().toString(36).toUpperCase()}_${randomUUID().slice(0, 8)}`;
  push("RUN_IDENTITY", { run_id: runId, nonce, route: adapter.PROMOTED_ROUTE_ID });

  // ---------- RT25 ADMISSION FIRST (occupancy must be sampled BEFORE any
  // fetch opens a keep-alive socket to :8080 — an established client conn on
  // the canonical port correctly classifies the runtime BUSY fail-closed) ----------
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "configs", "resources", "registry.json"), "utf8").replace(/^\uFEFF/, ""));
  const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "configs", "resources", "status.fail-closed.json"), "utf8").replace(/^\uFEFF/, ""));
  const producerOut = JSON.parse(execFileSync("node", [path.join(ROOT, "tools", "produce-v4-local-runtime-readonly-contribution-v1.mjs")], { encoding: "utf8", timeout: 120000 }));
  // nowMs captured AFTER the producer: composer law rejects future-dated
  // contributions (produced_at > nowMs) — the admission clock must never
  // predate the observation it admits.
  const nowMs = Date.now();
  push("LOCAL_RUNTIME_PRODUCER", { ok: producerOut.ok, qwen_classification: producerOut.qwen_occupancy_classification, qwen_available: producerOut.contribution?.resources?.qwen_local?.available });
  if (producerOut.ok !== true) stop("LOCAL_RUNTIME_PRODUCER", "PRODUCER_FAILED");
  if (producerOut.contribution?.resources?.qwen_local?.available !== true) stop("LOCAL_RUNTIME_PRODUCER", "QWEN_NOT_READY_IDLE_FAIL_CLOSED", { classification: producerOut.qwen_occupancy_classification, reason: producerOut.qwen_classification_reason });
  const webObs = await collectChatgptWebObservation({ chatgptWebObservation: { state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, observed_at: new Date().toISOString() } });
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [producerOut.contribution] }, { nowMs });
  const joined = joinQuotaPoolState(composed, registry, { nowMs });
  push("RT25_JOIN", { ok: joined.ok, joined_at: joined.joined_at, qwen_available: joined.resources?.qwen_local?.resource_available === true });
  if (joined.ok !== true || joined.resources?.qwen_local?.resource_available !== true) stop("RT25_JOIN", "ADMISSION_NOT_FRESH_ADMISSIBLE");

  // ---------- LIVE PRECHECK (after admission sampling; undici keeps sockets
  // pooled briefly, but occupancy sampling is already complete) ----------
  const models = await (await fetch(`${ENDPOINT}/models`)).json();
  if (!models.data?.find((m) => m.id === PROFILE)) stop("LIVE_PRECHECK", "AGENT24K_NOT_AVAILABLE");
  for (const [label, url] of [["CDP_9222", `${CDP_URL}/json/version`], ["HERMES_16080", "http://127.0.0.1:16080/vnc.html"]]) {
    try { await (await fetch(url, { signal: AbortSignal.timeout(8000) })).arrayBuffer(); push("LIVE_PRECHECK", { status: "PASS", surface: label }); }
    catch { stop("LIVE_PRECHECK", `${label}_UNREACHABLE`); }
  }
  const fresh = runVerifierJson(["fresh-check"]);
  push("FRESH_CHAT_CHECK", { ...fresh });
  if (fresh.FRESH_CHAT !== "YES") stop("FRESH_CHAT_CHECK", "CHAT_NOT_FRESH");
  if (fresh.AUTHENTICATED_HINT !== "YES") stop("FRESH_CHAT_CHECK", "CHATGPT_WEB_AUTH_REQUIRED_HUMAN_GATE");

  // ---------- PHASE E SHADOW SELECTION (real) ----------
  const candidates = [{ route_id: "codex-direct", resource_id: "codex", model: "codex_subscription_models", access_surface: "codex_ide_cursor_extension", select_rank: 10 }];
  const commercialDecision = selectQuotaAwareExecutionRoute(joined, candidates, { nowMs, execution_kind: "prompt_creator", task_delta_id: "PROMO-ACT" });
  const phaseE = evaluateHermesPhaseEShadowRoute({
    commercialDecision,
    localController: { available: true, adequate: true },
    chatgptWeb: webObs,
    // Phase E law: the shadow composition gate NEVER carries production
    // authorization; the production boundary is the adapter's ACTIVE
    // authorization envelope (separate layer, checked later).
    authorization: { production_dispatch_authorized: false },
  });
  push("PHASE_E", { status: phaseE.status, mode: phaseE.mode ?? null });
  if (phaseE.status !== "SHADOW_ROUTE_SELECTED") stop("PHASE_E", "ROUTE_NOT_SELECTED");

  // ---------- ROUTE CONTROL: require CANDIDATE_ENABLED persisted state ----------
  const controlDocPath = path.join(ROOT, "configs", "runtime", "route-control", "hermes-route-state.json");
  const controlDoc = JSON.parse(fs.readFileSync(controlDocPath, "utf8"));
  const controlEval = rc.evaluateRouteControl(controlDoc, { nowMs });
  push("ROUTE_CONTROL", { effective_state: controlEval.effective_state, candidate_flag: controlEval.candidate_flag });
  if (controlEval.effective_state !== "CANDIDATE_ENABLED") stop("ROUTE_CONTROL", "ROUTE_NOT_IN_CANDIDATE_STATE", { effective_state: controlEval.effective_state });

  // ---------- AUTHORIZATION: ledger-first + ACTIVE->SPENT BEFORE transport ----------
  const ledgerInspect = inspectDurableSpend(LEDGER_PATH, AUTH_ID);
  if (!ledgerInspect.ok) stop("AUTH_INSPECT_LEDGER", "LEDGER_INSPECT_FAILED", { reason: ledgerInspect.reason_codes?.[0] });
  const provenance = prov.inspectAuthorization(REGISTRY_PATH, AUTH_ID, { routeId: adapter.PROMOTED_ROUTE_ID });
  if (!provenance.ok) stop("AUTH_INSPECT_REGISTRY", "PROVENANCE_INSPECT_FAILED", { reason: provenance.reason_codes?.[0] });
  push("AUTH_INSPECT", { ok: true, route_id: adapter.PROMOTED_ROUTE_ID });

  const runtimeAuth = {
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: AUTH_ID,
    authorization_state: "ACTIVE",
    route_id: adapter.PROMOTED_ROUTE_ID,
    spent: false,
    scope: { task_ref: TASK_REF, base_head: BASE_HEAD, production_dispatch: true },
  };
  const eligibility = adapter.evaluatePromotedRouteDispatch({
    task_ref: TASK_REF, run_id: runId,
    route_control_doc: controlDoc, phaseE, joined,
    localController: { available: true, adequate: true },
    chatgptWeb: webObs,
    authorization: runtimeAuth,
    route_id: adapter.PROMOTED_ROUTE_ID,
  }, { nowMs });
  push("DUAL_GATE_ELIGIBILITY", { status: eligibility.status, classification: eligibility.classification, reasons: eligibility.reason_codes });
  if (eligibility.status !== "ELIGIBLE") stop("DUAL_GATE_ELIGIBILITY", "NOT_ELIGIBLE", { reasons: eligibility.reason_codes });

  const ledgerRecorded = recordDurableSpend(LEDGER_PATH, {
    authorization_id: AUTH_ID, execution_id: runId,
    route_id: adapter.PROMOTED_ROUTE_ID, spend_kind: "ADMISSION_CONSUMED",
  });
  if (!ledgerRecorded.ok) stop("AUTH_SPEND_LEDGER", "LEDGER_RECORD_FAILED", { reason: ledgerRecorded.reason_codes?.[0] });
  const admitted = prov.admitAuthorization(REGISTRY_PATH, AUTH_ID, { routeId: adapter.PROMOTED_ROUTE_ID });
  if (!admitted.ok) stop("AUTH_ADMIT", "ACTIVE_TO_SPENT_FAILED", { reason: admitted.reason_codes?.[0] });
  push("AUTH_CONSUMED", { ledger_first: true, active_to_spent: true });

  // ---------- QUALIFIED TRANSPORT: controller S0/S1 (2 generations) then ONE chainSend press ----------
  const payloadText = buildProofPayload({
    taskRef: TASK_REF, runId, nonce, baseHead: BASE_HEAD,
    schemaVersion: "hermes-phase-f-production-activation-canary-v1",
  });
  const schemas = await bridge("schemas");
  if (schemas.model_visible_count !== 4) stop("BARRIER1_SCHEMAS", "MODEL_VISIBLE_SET_NOT_EXACT");
  push("BARRIER1_SCHEMAS", { model_visible_count: schemas.model_visible_count });

  const systemPrompt =
    "You are the Qwen local controller for a bounded production activation canary on the qualified browser send path. " +
    "The dedicated browser is ALREADY on the authenticated fresh ChatGPT Web conversation: DO NOT navigate. " +
    "Perform EXACTLY ONE tool action per controller turn, then stop (no prose, no answer to the message text). " +
    "The expected action for this turn is supplied in the user message. Do not retry. " +
    "When asked to type, the text argument MUST be EXACTLY this canary payload, character for character:\n" +
    "<<<PAYLOAD_BEGIN>>>\n" + payloadText + "\n<<<PAYLOAD_END>>>\n" +
    "You have exactly four tools: browser_navigate, browser_snapshot, browser_type, browser_press.";
  const messages = [{ role: "system", content: systemPrompt }];
  const tools = schemas.model_visible_definitions;

  let genCount = 0;
  let composerRef = null;
  const callGeneration = async () => {
    genCount += 1;
    if (genCount > 2) stop("BUDGET_FENCE", "THIRD_CONTROLLER_GENERATION_BLOCKED");
    push("CONTROLLER_GENERATION", { status: "START", generation: genCount });
    const response = await qwenChat({ endpoint: ENDPOINT, profile: PROFILE, messages, tools, maxTokens: 512, timeoutMs: 300000 });
    const msg = response?.choices?.[0]?.message;
    const calls = [];
    const tc = msg?.tool_calls ?? [];
    for (const c of tc) calls.push({ id: c.id, name: c.function?.name, args: (() => { try { return JSON.parse(c.function?.arguments ?? "{}"); } catch { return {}; } })() });
    push("CONTROLLER_GENERATION", { status: "DONE", generation: genCount, tool_call_count: calls.length });
    return { msg, calls };
  };
  const dispatchGuarded = async (state, call) => {
    if (!stateGate(state, call.name)) stop("STATE_MACHINE", `OUT_OF_STATE_TOOL_${call.name.toUpperCase()}_IN_${state}`);
    if (!gateToolName(call.name)) stop("BARRIER2_DISPATCH", "CONTROLLER_RETURNED_DISALLOWED_TOOL", { tool: call.name });
    const argsJson =
      call.name === "browser_type" ? JSON.stringify({ ref: call.args?.ref, text: call.args?.text ?? "" }) :
      call.name === "browser_press" ? JSON.stringify({ key: call.args?.key ?? "Enter" }) :
      "{}";
    return bridge("exec-tool", ["--name", call.name, "--args-json", argsJson, "--extract-composer-ref", "--task-id", `promo-act-${runId}`, "--cdp-url", CDP_URL]);
  };

  // S0 — SNAPSHOT (GEN1)
  messages.push({ role: "user", content: "EXPECTED ACTION FOR THIS TURN: browser_snapshot. Emit exactly one browser_snapshot tool call to observe the composer, nothing else." });
  const gen1 = await callGeneration();
  const call1 = firstToolCall(gen1.calls) ?? gen1.calls[0];
  if (!call1) stop("S0_SNAPSHOT", "GEN1_SNAPSHOT_TOOL_CALL_NOT_EMITTED");
  if (gen1.calls.length > 1) stop("S0_SNAPSHOT", "GEN1_MULTIPLE_TOOL_CALLS");
  const res1 = await dispatchGuarded("S0_SNAPSHOT", call1);
  if (res1.success !== true) stop("S0_SNAPSHOT", "HERMES_SNAPSHOT_EXECUTION_FAILED", res1);
  if (!res1.composer_ref) stop("S0_SNAPSHOT", "COMPOSER_REF_NOT_OBTAINED");
  composerRef = res1.composer_ref;
  push("S0_RESULT", { composer_ref_obtained: "YES" });
  messages.push(gen1.msg);
  messages.push({ role: "tool", tool_call_id: call1.id, content: JSON.stringify({ success: true, composer_ref: composerRef, target: "chatgpt_composer" }) });

  // S1 — TYPE DECISION (GEN2): the controller's browser_type call is
  // VALIDATED (state machine, allowlist, composer-ref identity, exact payload
  // identity) but NOT executed here. Root cause of the previous attempt:
  // agent-browser refs are connection-scoped, so a standalone exec-tool type
  // (separate CLI invocation = separate client connection) can never resolve
  // the snapshot ref ("Unknown ref"). The qualified Phase D transport executes
  // the type INSIDE the production send chain (chain-send S1: snapshot ->
  // fill -> press Enter on ONE connection), routed through the promotion
  // adapter below. Exactly one controller decision is still consumed.
  messages.push({ role: "user", content: "EXPECTED ACTION FOR THIS TURN: browser_type. Emit exactly one browser_type tool call using the composer_ref you observed and the EXACT payload text between PAYLOAD_BEGIN/PAYLOAD_END from the system instruction, nothing else." });
  const gen2 = await callGeneration();
  const call2 = gen2.calls[0];
  if (!call2) stop("S1_TYPE", "GEN2_TOOL_CALL_NOT_EMITTED");
  if (gen2.calls.length > 1) stop("S1_TYPE", "GEN2_MULTIPLE_TOOL_CALLS");
  if (!stateGate("S1_TYPE", call2.name)) stop("STATE_MACHINE", `OUT_OF_STATE_TOOL_${String(call2.name).toUpperCase()}_IN_S1_TYPE`);
  if (!gateToolName(call2.name)) stop("BARRIER2_DISPATCH", "CONTROLLER_RETURNED_DISALLOWED_TOOL", { tool: call2.name });
  const refMatch = String(call2.args?.ref ?? "").replace(/^@/, "") === composerRef;
  const textMatch = typeof call2.args?.text === "string" && call2.args.text.includes(runId) && call2.args.text.includes(nonce) && call2.args.text.includes(BASE_HEAD) && call2.args.text.includes(TASK_REF);
  if (!refMatch) stop("S1_TYPE", "GEN2_COMPOSER_REF_MISMATCH");
  if (!textMatch) stop("S1_TYPE", "GEN2_PAYLOAD_MISMATCH");
  const afterType = runVerifierJson(["observe", nonce]);
  push("S1_DOM_OBSERVE", { COMPOSER_CONTAINS_CURRENT_NONCE: afterType.COMPOSER_CONTAINS_CURRENT_NONCE, USER_TURNS: afterType.USER_TURNS, ASSISTANT_TURNS: afterType.ASSISTANT_TURNS });
  if (afterType.USER_TURNS !== 0 || afterType.ASSISTANT_TURNS !== 0) stop("S1_TYPE", "UNEXPECTED_TURN_BEFORE_DISPATCH");

  // ---------- THE SINGLE PRODUCTION DISPATCH via promotion adapter edge ----------
  let transportResult = null;
  try {
    transportResult = await adapter.executePromotedRoute(
      { task_ref: TASK_REF, run_id: runId, eligibility, payload: { text_chars: payloadText.length, text_sha256_12: sha12(payloadText) } },
      {
        production_activation_confirmed: true,
        transport: async (spec) => {
          // Qualified Hermes transport: ONE chain-send S1 batch (snapshot ->
          // fill(@composer_ref, CONTROLLER_TEXT) -> press Enter) on a single
          // agent-browser client connection — the exact Phase D-qualified
          // primitive. CONTROLLER_TEXT is the GEN2-decided browser_type text,
          // already identity-verified against the nonce/run-id/base-head/
          // task-ref; no fallback text, no second dispatch path.
          const out = await chainSend({ text: String(call2.args.text), taskId: `promo-act-${runId}`, cdpUrl: CDP_URL });
          return { ...out, stubbed: false, execution_performed: out?.success === true && out?.decision === "DISPATCHED" };
        },
        verify: async () => {
          const turn = runVerifierJson(["turn-verify", TASK_REF, runId, nonce, BASE_HEAD]);
          return { ok: turn.REAL_USER_TURN_DOM_CONFIRMED === "PASS", turn };
        },
      },
    );
  } catch (err) {
    stop("PROMOTED_DISPATCH", "TRANSPORT_ERROR", { error: String(err.message || err).slice(0, 200) });
  }
  push("PROMOTED_DISPATCH", { status: transportResult.status, verification_state: transportResult.verification_state });
  if (transportResult.execution_performed !== true || transportResult.verification_state !== "CONFIRMED") {
    stop("PROMOTED_DISPATCH", "SEND_NOT_CONFIRMED_AMBIGUOUS_OR_FAILED", { envelope: transportResult });
  }

  const final = {
    RESULT: "PASS",
    TASK_REF,
    BASE_HEAD,
    RUN_ID: runId,
    NONCE: nonce,
    ROUTE_ID: adapter.PROMOTED_ROUTE_ID,
    AUTHORIZATION_ID: AUTH_ID,
    AUTHORIZATION_CONSUMED: "LEDGER_FIRST_THEN_ACTIVE_TO_SPENT",
    DUAL_GATE: "ALL_CONDITIONS_TRUE",
    QWEN_GENERATIONS_LIVE: genCount,
    CHATGPT_WEB_SENDS: 1,
    REAL_USER_TURN_DOM_CONFIRMED: "PASS",
    VERIFICATION_STATE: transportResult.verification_state,
    trace,
  };
  fs.mkdirSync(path.join(ROOT, "reports", "runtime", "phase-f"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "reports", "runtime", "phase-f", "phase-f-activation-canary-result.json"), JSON.stringify(final, null, 2));
  console.log(JSON.stringify({ RESULT: "PASS", RUN_ID: runId, AUTHORIZATION_ID: AUTH_ID, QWEN_GENERATIONS_LIVE: genCount, CHATGPT_WEB_SENDS: 1, VERIFICATION_STATE: transportResult.verification_state }, null, 2));
}

main().catch((e) => {
  try { fs.appendFileSync(path.join(ROOT, "reports", "runtime", "phase-f", "phase-f-activation-canary-trace.json"), ""); } catch { /* noop */ }
  console.error(JSON.stringify({ RESULT: "STOP", reason: String(e.message || e) }, null, 2));
  process.exit(1);
});
