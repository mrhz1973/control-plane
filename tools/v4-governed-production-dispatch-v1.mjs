#!/usr/bin/env node
/**
 * V4_CONTROL_PLANE_GOVERNED_PRODUCTION_STEADY_STATE_ACTIVATION_V1 —
 * minimal composition-only production dispatch entrypoint for the qualified
 * `qwen_local -> hermes -> chatgpt_web` continuity route.
 *
 * NON-CANARY OPERATIONAL ENTRYPOINT (steady state). This module is an
 * adapter/composition edge ONLY. It reuses — never reimplements — every
 * existing authority:
 *   - RT25/resource admission: produce-v4-local-runtime-readonly-contribution-v1
 *     + compose-v4-resource-status-control-plane-v1 + rt25-quota-state-join-v1;
 *   - route selection: evaluate-hermes-phase-e-shadow-route-v1 (Phase E law);
 *   - route control: v4-phase-f-route-control-v1 (fail-closed; requires
 *     persisted CANDIDATE_ENABLED under operator promotion authorization);
 *   - authorization: existing operator-runtime-authorization-v1 envelope,
 *     provenance-registry inspect/admit (ACTIVE->SPENT) and durable spend
 *     ledger (LEDGER-FIRST, before transport);
 *   - execution edge: v4-phase-f-promotion-adapter-v1 dual-gate eligibility +
 *     executePromotedRoute with production_activation_confirmed=true;
 *   - transport: qualified Hermes chainSend (per-invocation browser
 *     allowlist) — invoked exactly once per dispatch;
 *   - verification: chatgpt-web-dom-verifier-v1 turn-verify (independent DOM
 *     confirmation law).
 *
 * Hard laws:
 *   - MAX ONE task per invocation (no loop, no scheduler, no queue);
 *   - requires exact --task-ref + --run-id + --authorization-id + --payload-file
 *     + --base-head (identity binding; no arbitrary routes — the route is the
 *     single controlled route identity, not a parameter);
 *   - no authorization creation/approval, no Telegram decision generation;
 *   - fail-closed at every stage; ambiguous outcomes never claimed success;
 *   - bounded machine-readable result (v4-governed-production-dispatch-result-v1).
 *
 * Rollback (emergency disable):
 *   node tools/v4-phase-f-route-control-v1.mjs --state-path \
 *     configs/runtime/route-control/hermes-route-state.json --action disable \
 *     --updated-by <task-or-operator>
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const RESULT_SCHEMA = "v4-governed-production-dispatch-result-v1";
const CDP_URL = "http://127.0.0.1:9222";
const REGISTRY_PATH = path.join(process.env.LOCALAPPDATA, "control-plane", "v4-runtime-authorization-registry-v1.json");
const LEDGER_PATH = path.join(process.env.LOCALAPPDATA, "control-plane", "v4-runtime-authorization-spend-ledger-v1.json");
const CONTROL_DOC_PATH = path.join(ROOT, "configs", "runtime", "route-control", "hermes-route-state.json");
const VERIFIER = path.join(ROOT, "tools", "chatgpt-web-dom-verifier-v1.mjs");
const ENTRY_TASK_REF = "V4_CONTROL_PLANE_GOVERNED_PRODUCTION_STEADY_STATE_ACTIVATION_V1";

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
};
const emit = (result, exitCode) => {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(exitCode);
};
const blocked = (classification, reason_codes, stage) => emit({
  schema_version: RESULT_SCHEMA,
  entrypoint_task_ref: ENTRY_TASK_REF,
  task_ref: arg("task-ref"),
  run_id: arg("run-id"),
  route_id: "hermes+chatgpt_web",
  controlled_route_id: "qwen_local+hermes+chatgpt_web",
  status: "BLOCKED",
  classification,
  stage,
  execution_performed: false,
  production_dispatch: false,
  fail_closed: true,
  reason_codes,
}, 1);
const runVerifierJson = (args) => JSON.parse(execFileSync("node", [VERIFIER, ...args], { encoding: "utf8", timeout: 60000 }));
const importTool = async (rel) => import("file://" + path.join(ROOT, rel).replace(/\\/g, "/"));

async function main() {
  const taskRef = arg("task-ref");
  const runId = arg("run-id");
  const authId = arg("authorization-id");
  const baseHead = arg("base-head");
  const payloadFile = arg("payload-file");
  const nonce = arg("nonce");
  if (!taskRef || !runId || !authId || !baseHead || !payloadFile || !nonce) {
    blocked("IDENTITY_BINDING_INCOMPLETE", ["IDENTITY_BINDING_INCOMPLETE", "REQUIRED:--task-ref,--run-id,--authorization-id,--base-head,--payload-file,--nonce"], "CLI");
  }
  let payloadText;
  try {
    payloadText = fs.readFileSync(path.resolve(payloadFile), "utf8");
  } catch {
    blocked("PAYLOAD_UNREADABLE", ["PAYLOAD_UNREADABLE", String(payloadFile).slice(0, 120)], "CLI");
  }
  if (!payloadText.trim()) blocked("PAYLOAD_EMPTY", ["PAYLOAD_EMPTY"], "CLI");

  // ---- reuse existing authorities (no second anything) ----
  const adapter = await importTool("tools/v4-phase-f-promotion-adapter-v1.mjs");
  const { evaluateRouteControl } = await importTool("tools/v4-phase-f-route-control-v1.mjs");
  const { composeV4ResourceStatus } = await importTool("tools/compose-v4-resource-status-control-plane-v1.mjs");
  const { joinQuotaPoolState } = await importTool("tools/rt25-quota-state-join-v1.mjs");
  const { selectQuotaAwareExecutionRoute } = await importTool("tools/rt25-execution-quota-aware-selector-v1.mjs");
  const { collectChatgptWebObservation } = await importTool("tools/local-dev-resource-observatory-v1.mjs");
  const { evaluateHermesPhaseEShadowRoute } = await importTool("tools/evaluate-hermes-phase-e-shadow-route-v1.mjs");
  const { inspectDurableSpend, recordDurableSpend } = await importTool("tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs");
  const prov = await importTool("tools/v4-runtime-authorization-provenance-registry-v1.mjs");
  const { chainSend } = await importTool("tools/hermes-per-invocation-browser-allowlist-v1.mjs");

  const nowMs0 = Date.now();

  // 1. route control: persisted CANDIDATE_ENABLED required (fail-closed otherwise)
  let controlDoc = null;
  try { controlDoc = JSON.parse(fs.readFileSync(CONTROL_DOC_PATH, "utf8")); } catch { controlDoc = null; }
  const controlEval = evaluateRouteControl(controlDoc, { nowMs: nowMs0 });
  if (controlEval.fail_closed || controlEval.effective_state !== "CANDIDATE_ENABLED") {
    blocked("ROUTE_CONTROL_NOT_CANDIDATE_ENABLED", ["ROUTE_CONTROL_NOT_CANDIDATE_ENABLED", ...(controlEval.reason_codes || [])], "ROUTE_CONTROL");
  }

  // 2. RT25 admission (occupancy sampled BEFORE any live fetch, canary law)
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "configs", "resources", "registry.json"), "utf8").replace(/^\uFEFF/, ""));
  const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "configs", "resources", "status.fail-closed.json"), "utf8").replace(/^\uFEFF/, ""));
  const producerOut = JSON.parse(execFileSync("node", [path.join(ROOT, "tools", "produce-v4-local-runtime-readonly-contribution-v1.mjs")], { encoding: "utf8", timeout: 120000 }));
  const nowMs = Date.now(); // after producer: admission clock never predates observation
  if (producerOut.ok !== true || producerOut.contribution?.resources?.qwen_local?.available !== true) {
    blocked("LOCAL_CONTROLLER_UNAVAILABLE", ["LOCAL_CONTROLLER_UNAVAILABLE", String(producerOut.qwen_occupancy_classification ?? "PRODUCER_FAILED")], "RT25_ADMISSION");
  }
  const webObs = await collectChatgptWebObservation({ chatgptWebObservation: { state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, observed_at: new Date().toISOString() } });
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [producerOut.contribution] }, { nowMs });
  const joined = joinQuotaPoolState(composed, registry, { nowMs });
  if (joined.ok !== true || joined.resources?.qwen_local?.resource_available !== true) {
    blocked("RESOURCE_ADMISSION_BLOCKED", ["RESOURCE_ADMISSION_BLOCKED", "JOIN_NOT_FRESH_ADMISSIBLE"], "RT25_JOIN");
  }

  // 3. Phase E selection (existing authority, consumed)
  const candidates = [{ route_id: "codex-direct", resource_id: "codex", model: "codex_subscription_models", access_surface: "codex_ide_cursor_extension", select_rank: 10 }];
  const commercialDecision = selectQuotaAwareExecutionRoute(joined, candidates, { nowMs, execution_kind: "prompt_creator", task_delta_id: taskRef });
  const phaseE = evaluateHermesPhaseEShadowRoute({
    commercialDecision,
    localController: { available: true, adequate: true },
    chatgptWeb: webObs,
    authorization: { production_dispatch_authorized: false }, // Phase E never carries production authorization
  });
  if (phaseE.status !== "SHADOW_ROUTE_SELECTED") {
    blocked("PHASE_E_ROUTE_NOT_SELECTED", ["PHASE_E_ROUTE_NOT_SELECTED", `STATUS:${String(phaseE.status ?? "ABSENT")}`], "PHASE_E");
  }

  // 4. authorization: provenance inspect (ACTIVE, route-pinned, task-bound) — BEFORE ledger
  const ledgerInspect = inspectDurableSpend(LEDGER_PATH, authId);
  if (!ledgerInspect.ok) blocked("LEDGER_INSPECT_FAILED", ["LEDGER_INSPECT_FAILED", ...(ledgerInspect.reason_codes || [])], "AUTH_LEDGER");
  const provenance = prov.inspectAuthorization(REGISTRY_PATH, authId, { routeId: adapter.PROMOTED_ROUTE_ID });
  if (!provenance.ok) blocked("PROVENANCE_INSPECT_FAILED", ["PROVENANCE_INSPECT_FAILED", ...(provenance.reason_codes || [])], "AUTH_REGISTRY");

  const runtimeAuth = {
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: authId,
    authorization_state: "ACTIVE",
    route_id: adapter.PROMOTED_ROUTE_ID,
    spent: false,
    scope: { task_ref: taskRef, base_head: baseHead, production_dispatch: true },
  };
  const eligibility = adapter.evaluatePromotedRouteDispatch({
    task_ref: taskRef, run_id: runId,
    route_control_doc: controlDoc, phaseE, joined,
    localController: { available: true, adequate: true },
    chatgptWeb: webObs,
    authorization: runtimeAuth,
    route_id: adapter.PROMOTED_ROUTE_ID,
  }, { nowMs });
  if (eligibility.status !== "ELIGIBLE") {
    blocked("DUAL_GATE_NOT_ELIGIBLE", ["DUAL_GATE_NOT_ELIGIBLE", ...(eligibility.reason_codes || [])], "DUAL_GATE");
  }

  // 5. ledger-first spend, then ACTIVE->SPENT (canary law, reused)
  const ledgerRecorded = recordDurableSpend(LEDGER_PATH, {
    authorization_id: authId, execution_id: runId,
    route_id: adapter.PROMOTED_ROUTE_ID, spend_kind: "ADMISSION_CONSUMED",
  });
  if (!ledgerRecorded.ok) blocked("LEDGER_RECORD_FAILED", ["LEDGER_RECORD_FAILED", ...(ledgerRecorded.reason_codes || [])], "AUTH_SPEND");
  const admitted = prov.admitAuthorization(REGISTRY_PATH, authId, { routeId: adapter.PROMOTED_ROUTE_ID });
  if (!admitted.ok) blocked("ACTIVE_TO_SPENT_FAILED", ["ACTIVE_TO_SPENT_FAILED", ...(admitted.reason_codes || [])], "AUTH_ADMIT");

  // 6. fresh-chat human-gate precheck (existing verifier law, read-only)
  const fresh = runVerifierJson(["fresh-check"]);
  if (fresh.FRESH_CHAT !== "YES" || fresh.AUTHENTICATED_HINT !== "YES") {
    blocked("FRESH_CHAT_OR_AUTH_FAILED", ["FRESH_CHAT_OR_AUTH_FAILED", "CHATGPT_WEB_AUTH_REQUIRED_HUMAN_GATE"], "FRESH_CHAT_CHECK");
  }

  // 7. THE single production dispatch via promotion adapter edge
  let transportResult;
  try {
    transportResult = await adapter.executePromotedRoute(
      { task_ref: taskRef, run_id: runId, eligibility, payload: { text_chars: payloadText.length } },
      {
        production_activation_confirmed: true, // steady-state GOVERNED_ACTIVE posture (this task's authorization)
        transport: async () => {
          // Qualified Hermes transport: ONE chain-send batch (snapshot -> fill -> press Enter)
          const out = await chainSend({ text: payloadText, taskId: `governed-${runId}`, cdpUrl: CDP_URL });
          return { ...out, stubbed: false, execution_performed: out?.success === true && out?.decision === "DISPATCHED" };
        },
        verify: async () => {
          const turn = runVerifierJson(["turn-verify", taskRef, runId, nonce, baseHead]);
          return { ok: turn.REAL_USER_TURN_DOM_CONFIRMED === "PASS", turn };
        },
      },
    );
  } catch (err) {
    blocked("TRANSPORT_ERROR", ["TRANSPORT_ERROR", String(err?.message || err).slice(0, 160)], "PROMOTED_DISPATCH");
  }

  const confirmed = transportResult.execution_performed === true && transportResult.verification_state === "CONFIRMED";
  emit({
    schema_version: RESULT_SCHEMA,
    entrypoint_task_ref: ENTRY_TASK_REF,
    task_ref: taskRef,
    run_id: runId,
    route_id: adapter.PROMOTED_ROUTE_ID,
    controlled_route_id: "qwen_local+hermes+chatgpt_web",
    status: confirmed ? "EXECUTED_CONFIRMED" : (transportResult.execution_performed ? "EXECUTED_UNCONFIRMED" : "BLOCKED"),
    classification: transportResult.classification,
    execution_performed: transportResult.execution_performed === true,
    production_dispatch: transportResult.production_dispatch === true,
    verification_state: transportResult.verification_state,
    authorization_id: authId,
    authorization_consumption: "LEDGER_FIRST_THEN_ACTIVE_TO_SPENT",
    reason_codes: transportResult.reason_codes,
  }, confirmed ? 0 : 1);
}

main().catch((e) => {
  process.stdout.write(`${JSON.stringify({ schema_version: RESULT_SCHEMA, status: "ERROR", classification: "ENTRYPOINT_ERROR", execution_performed: false, production_dispatch: false, fail_closed: true, reason: String(e?.message || e).slice(0, 200) })}\n`);
  process.exit(1);
});
