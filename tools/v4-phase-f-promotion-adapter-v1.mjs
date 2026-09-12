#!/usr/bin/env node
/**
 * V4_HERMES_PHASE_F_BOUNDED_PROMOTION_IMPLEMENTATION_V1 — promotion-capable
 * execution adapter/boundary for the qualified
 * `qwen_local -> hermes -> chatgpt_web` continuity route.
 *
 * Human decision A (bounded promotion implementation) authorized THIS
 * implementation. It did NOT authorize production activation or dispatch.
 *
 * Composition law (REUSE, no second anything):
 *   - route selection   : existing RT25 execution selector + existing Phase E
 *                         composition gate (evaluateHermesPhaseEShadowRoute) —
 *                         consumed, never reimplemented;
 *   - resource admission: existing composer/join law (freshness TTL reused
 *                         from compose-v4-resource-status-control-plane-v1);
 *   - route control     : existing v4-phase-f-route-control-v1 (fail-closed
 *                         DISABLED default; CANDIDATE_ENABLED is a candidate
 *                         flag, NEVER production authorization);
 *   - authorization     : existing `operator-runtime-authorization-v1`
 *                         envelope representation, pinned to THIS route;
 *                         issuance/spend remains owned by the existing
 *                         provenance-registry/issuance machinery at the
 *                         future activation gate (its route allow-list is
 *                         deliberately NOT widened by this task);
 *   - execution edge    : transport is DEPENDENCY-INJECTED ONLY. The default
 *                         is fail-closed absence. The qualified Hermes send
 *                         primitive (chainSend of
 *                         hermes-per-invocation-browser-allowlist-v1.mjs) is
 *                         structurally bound and verified to exist, and is
 *                         REFUSED at the execution edge unless the future
 *                         activation explicitly confirms production activation.
 *   - verification      : existing independent DOM verifier law is the only
 *                         confirmation boundary for a real dispatch.
 *
 * Dual-gate law: EVERY condition must be explicitly true; any NO/UNKNOWN/
 * STALE/MISSING/INVALID yields PRODUCTION_DISPATCH blocked, fail-closed.
 */

import { evaluateRouteControl, CONTROLLED_ROUTE_ID } from "./v4-phase-f-route-control-v1.mjs";
import { STATUS_MAX_AGE_MS } from "./compose-v4-resource-status-control-plane-v1.mjs";
import {
  chainSend as QUALIFIED_CHAIN_SEND,
  EXACT_ALLOWLIST as HERMES_EXACT_ALLOWLIST,
} from "./hermes-per-invocation-browser-allowlist-v1.mjs";

export const PROMOTION_DISPATCH_SCHEMA = "v4-phase-f-promotion-dispatch-decision-v1";
export const PROMOTED_ROUTE_ID = "hermes+chatgpt_web"; // adapter-registry identity law: implementer+model
export const PROMOTED_IMPLEMENTER = "hermes";
export const PROMOTED_MODEL = "chatgpt_web";
export const AUTH_ENVELOPE_SCHEMA = "operator-runtime-authorization-v1"; // existing representation, reused
export const READY_CLASSIFICATION = "READY_FOR_AUTHORIZED_DISPATCH";
export const PHASE_E_ROUTE_IDENTITY = Object.freeze({
  controller: "qwen_local",
  bridge: "hermes",
  target: "chatgpt_web",
});

/** Structural binding to the already-qualified Hermes send primitive (never invoked by this module). */
export const QUALIFIED_HERMES_TRANSPORT_BINDING = Object.freeze({
  module: "tools/hermes-per-invocation-browser-allowlist-v1.mjs",
  export_name: "chainSend",
  bound: typeof QUALIFIED_CHAIN_SEND === "function",
  model_visible_tools: Object.freeze([...HERMES_EXACT_ALLOWLIST]),
  verification_boundary: "tools/chatgpt-web-dom-verifier-v1.mjs (independent DOM verification)",
});

function iso(ms) {
  return new Date(
    typeof ms === "number" && Number.isFinite(ms) ? ms : Date.now(),
  ).toISOString();
}

function decision(base, partial) {
  return {
    schema_version: PROMOTION_DISPATCH_SCHEMA,
    evaluated_at: base.nowIso,
    task_ref: null,
    run_id: null,
    route_id: PROMOTED_ROUTE_ID,
    controlled_route_id: CONTROLLED_ROUTE_ID,
    status: "BLOCKED",
    classification: null,
    eligible: false,
    execution_performed: false,
    production_dispatch: false, // invariant of this implementation generation
    fail_closed: true,
    mode: "SHADOW_ONLY",
    dispatch_binding: null,
    reason_codes: [],
    ...partial,
  };
}

function webReady(web) {
  return Boolean(web) &&
    web.availability_domain === "SEPARATE_AVAILABILITY_DOMAIN" &&
    web.state === "AVAILABLE" &&
    web.freshness === "fresh" &&
    web.reachable === true &&
    web.authenticated === true &&
    web.throttled !== true;
}

/** Authorization envelope law: same representation as the canonical adapter boundary, pinned to THIS route. */
export function validatePromotedRouteAuthorization(auth, { taskRef } = {}) {
  const codes = [];
  if (!auth || typeof auth !== "object" || Array.isArray(auth)) {
    return { ok: false, reason_codes: ["AUTH_MISSING"], authorization_id: null };
  }
  if (auth.schema_version !== AUTH_ENVELOPE_SCHEMA) codes.push("AUTH_SCHEMA_MISMATCH");
  const id = typeof auth.authorization_id === "string" && auth.authorization_id.trim() ? auth.authorization_id.trim() : null;
  if (!id) codes.push("AUTH_ID_MISSING");
  const state = auth.authorization_state || auth.state;
  if (!state || String(state).toUpperCase() !== "ACTIVE") codes.push("AUTH_NOT_ACTIVE");
  if (auth.spent === true || auth.used === true) codes.push("AUTH_ALREADY_SPENT");
  if (auth.route_id !== PROMOTED_ROUTE_ID) codes.push("AUTH_WRONG_ROUTE");
  const scope = auth.scope && typeof auth.scope === "object" && !Array.isArray(auth.scope) ? auth.scope : null;
  if (!scope) {
    codes.push("AUTH_SCOPE_MISSING");
  } else {
    if (typeof scope.task_ref !== "string" || !scope.task_ref.trim()) codes.push("AUTH_SCOPE_TASK_REF_MISSING");
    else if (taskRef && scope.task_ref !== taskRef) codes.push("AUTH_SCOPE_TASK_REF_MISMATCH");
    if (typeof scope.base_head !== "string" || !scope.base_head.trim()) codes.push("AUTH_SCOPE_BASE_HEAD_MISSING");
    if (scope.production_dispatch !== true) codes.push("AUTH_SCOPE_NOT_PRODUCTION_DISPATCH");
  }
  if (codes.length) {
    return { ok: false, reason_codes: ["AUTHORIZATION_REJECTED", ...codes], authorization_id: id };
  }
  return { ok: true, reason_codes: [], authorization_id: id };
}

function joinedFresh(joined, nowMs) {
  const t = Date.parse(joined?.joined_at ?? "");
  return Number.isFinite(t) && nowMs - t <= STATUS_MAX_AGE_MS && nowMs - t >= 0;
}

/**
 * DUAL-GATE eligibility evaluation for the promoted route. Pure and
 * deterministic; consumes ONLY existing upstream outputs (Phase E decision,
 * quota join, route-control document, Web observation) plus an injected
 * authorization envelope and explicit controller availability.
 *
 * This function NEVER executes anything and NEVER mutates state.
 */
export function evaluatePromotedRouteDispatch(request = {}, options = {}) {
  const nowMs = typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const base = { nowIso: iso(nowMs) };

  // 0. input validity + identity binding
  const taskRef = typeof request.task_ref === "string" && request.task_ref.trim() ? request.task_ref.trim().slice(0, 120) : null;
  const runId = typeof request.run_id === "string" && request.run_id.trim() ? request.run_id.trim().slice(0, 120) : null;
  if (!taskRef || !runId) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "IDENTITY_BINDING_INCOMPLETE", reason_codes: ["IDENTITY_BINDING_INCOMPLETE", ...(taskRef ? [] : ["TASK_REF_MISSING"]), ...(runId ? [] : ["RUN_ID_MISSING"])] });
  }

  // P13 — any silent-fallback attempt is rejected outright.
  if (request.fallback_route_id !== undefined || request.allow_fallback === true || request.fallback_requested === true) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "SILENT_FALLBACK_REJECTED", reason_codes: ["SILENT_FALLBACK_REJECTED", "FALLBACK_FIELDS_FORBIDDEN"] });
  }

  // 1. exact route identity (P10)
  if (request.route_id !== undefined && request.route_id !== PROMOTED_ROUTE_ID) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "ROUTE_ID_MISMATCH", reason_codes: ["ROUTE_ID_MISMATCH", `REQUESTED:${String(request.route_id).slice(0, 60)}`] });
  }

  // 2. route-specific control (P01/P02/P14 — preserve R4 fail-closed law)
  const rc = evaluateRouteControl(request.route_control_doc ?? null, { nowMs });
  if (rc.fail_closed) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "ROUTE_CONTROL_FAIL_CLOSED", reason_codes: ["ROUTE_CONTROL_FAIL_CLOSED", ...rc.reason_codes] });
  }
  if (rc.effective_state === "DISABLED") {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "ROUTE_CONTROL_DISABLED", reason_codes: ["ROUTE_CONTROL_DISABLED", "ROUTE_DISABLED_FAIL_CLOSED_DEFAULT"] });
  }
  if (rc.effective_state === "SHADOW_ONLY") {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "ROUTE_CONTROL_SHADOW_ONLY_NOT_PRODUCTION", reason_codes: ["ROUTE_CONTROL_SHADOW_ONLY_NOT_PRODUCTION"] });
  }
  // effective_state === CANDIDATE_ENABLED from here.

  // 3. Phase E degraded-route decision consumed (existing selection authority)
  const pe = request.phaseE ?? null;
  if (!pe || pe.status !== "SHADOW_ROUTE_SELECTED" || pe.mode !== "SHADOW_ONLY") {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "PHASE_E_ROUTE_NOT_SELECTED", reason_codes: ["PHASE_E_ROUTE_NOT_SELECTED", `STATUS:${String(pe?.status ?? "ABSENT").slice(0, 60)}`] });
  }
  const routeIdentityOk = pe.route?.controller === PHASE_E_ROUTE_IDENTITY.controller &&
    pe.route?.bridge === PHASE_E_ROUTE_IDENTITY.bridge &&
    pe.route?.target === PHASE_E_ROUTE_IDENTITY.target;
  if (!routeIdentityOk) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "PHASE_E_ROUTE_IDENTITY_MISMATCH", reason_codes: ["PHASE_E_ROUTE_IDENTITY_MISMATCH"] });
  }
  if (pe.production_dispatch === true || pe.authorization_bypass === true || pe.hidden_fallback === true) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "PHASE_E_ENVELOPE_HARD_WALL_VIOLATION", reason_codes: ["PHASE_E_ENVELOPE_HARD_WALL_VIOLATION"] });
  }

  // 4. resource admission (existing join law + TTL reuse)
  const joined = request.joined ?? null;
  if (!joined || joined.ok !== true || !joined.resources || !joined.pools) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "RESOURCE_ADMISSION_BLOCKED", reason_codes: ["RESOURCE_ADMISSION_BLOCKED", "JOIN_STATE_INVALID"] });
  }
  if (!joinedFresh(joined, nowMs)) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "RESOURCE_STATE_STALE", reason_codes: ["RESOURCE_ADMISSION_BLOCKED", "RESOURCE_STATE_STALE", `TTL_MS:${STATUS_MAX_AGE_MS}`] });
  }
  if (joined.resources.qwen_local?.resource_available !== true) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "LOCAL_CONTROLLER_UNAVAILABLE", reason_codes: ["LOCAL_CONTROLLER_UNAVAILABLE", "QWEN_LOCAL_NOT_AVAILABLE_IN_JOIN"] });
  }
  const blockedPools = Object.entries(joined.pools).filter(([, p]) => typeof p?.evaluation === "string" && p.evaluation !== "POOL_HEALTHY");
  // Commercial pools may be degraded (that is WHY the degraded route exists);
  // they must never be presented as healthy capacity here.
  const commercialHealthy = Object.entries(joined.pools).filter(([, p]) => p?.evaluation === "POOL_HEALTHY");

  // 5. local controller availability (independent Phase E admission input)
  const lc = request.localController ?? null;
  if (!lc || lc.available !== true || lc.adequate !== true) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "LOCAL_CONTROLLER_UNAVAILABLE", reason_codes: ["LOCAL_CONTROLLER_UNAVAILABLE", "CONTROLLER_NOT_AVAILABLE_OR_ADEQUATE"] });
  }

  // 6. Web surface availability (independent observation, existing law)
  if (!webReady(request.chatgptWeb ?? null)) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "WEB_SURFACE_UNAVAILABLE", reason_codes: ["WEB_SURFACE_UNAVAILABLE", "CHATGPT_WEB_NOT_FRESH_AVAILABLE_AUTHENTICATED"] });
  }

  // 7. explicit production authorization (P03/P04/P05 — candidate ≠ authorization)
  const authCheck = validatePromotedRouteAuthorization(request.authorization ?? null, { taskRef });
  if (!authCheck.ok) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "AUTHORIZATION_REJECTED", reason_codes: authCheck.reason_codes });
  }

  // 8. hard walls (explicit, all must hold)
  const hardWalls = {
    resource_admission_ok: true,
    phase_e_shadow_selected: true,
    route_control_candidate: true,
    authorization_active: true,
    no_silent_fallback: true,
    no_legacy_component: true, // route-control doc has no legacy dependency by construction (R4 law)
    web_and_controller_available: true,
  };
  const hardWallsPass = Object.values(hardWalls).every(Boolean);
  if (!hardWallsPass) {
    return decision(base, { task_ref: taskRef, run_id: runId, classification: "HARD_WALLS_NOT_SATISFIED", reason_codes: ["HARD_WALLS_NOT_SATISFIED", ...Object.entries(hardWalls).filter(([, v]) => !v).map(([k]) => `WALL:${k.toUpperCase()}`)] });
  }

  // ALL conditions true -> the execution edge becomes ELIGIBLE (never executed here).
  return decision(base, {
    task_ref: taskRef,
    run_id: runId,
    status: "ELIGIBLE",
    classification: READY_CLASSIFICATION,
    eligible: true,
    fail_closed: false,
    production_dispatch: false, // still false: eligibility is NOT dispatch
    reason_codes: [
      "ALL_DUAL_GATE_CONDITIONS_TRUE",
      "ROUTE_CONTROL_CANDIDATE",
      "PHASE_E_DEGRADED_SHADOW_ROUTE",
      "RESOURCES_FRESH_ADMISSIBLE",
      "AUTHORIZATION_ACTIVE_BOUND",
      ...(blockedPools.length ? ["COMMERCIAL_POOLS_DEGRADED_AS_EXPECTED"] : []),
      ...(commercialHealthy.length ? ["NOTE_COMMERCIAL_POOL_HEALTHY_IN_JOIN"] : []),
    ],
    dispatch_binding: {
      route_id: PROMOTED_ROUTE_ID,
      controlled_route_id: CONTROLLED_ROUTE_ID,
      controller: PHASE_E_ROUTE_IDENTITY.controller,
      bridge: PHASE_E_ROUTE_IDENTITY.bridge,
      target: PHASE_E_ROUTE_IDENTITY.target,
      task_ref: taskRef,
      run_id: runId,
      authorization_id: authCheck.authorization_id,
      route_control_restoration_state: rc.restoration_state,
    },
  });
}

/**
 * Execution edge. The transport is DEPENDENCY-INJECTED ONLY; without an
 * explicit transport function nothing can execute (fail closed). The
 * qualified Hermes chainSend is structurally bound but REFUSED unless the
 * future activation gate explicitly confirms production activation.
 */
export async function executePromotedRoute(request = {}, options = {}) {
  const nowMs = typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const eligibility = request.eligibility ?? null;

  // Tamper check: eligibility must be a genuine READY result of THIS schema with intact binding.
  if (!eligibility || eligibility.schema_version !== PROMOTION_DISPATCH_SCHEMA ||
      eligibility.status !== "ELIGIBLE" || eligibility.classification !== READY_CLASSIFICATION ||
      eligibility.eligible !== true || !eligibility.dispatch_binding) {
    return {
      schema_version: PROMOTION_DISPATCH_SCHEMA,
      evaluated_at: iso(nowMs),
      route_id: PROMOTED_ROUTE_ID,
      status: "BLOCKED",
      classification: "ELIGIBILITY_INVALID",
      execution_performed: false,
      production_dispatch: false,
      reason_codes: ["ELIGIBILITY_INVALID", "READY_DECISION_REQUIRED"],
    };
  }
  if (eligibility.dispatch_binding.task_ref !== request.task_ref || eligibility.dispatch_binding.run_id !== request.run_id) {
    return {
      schema_version: PROMOTION_DISPATCH_SCHEMA,
      evaluated_at: iso(nowMs),
      route_id: PROMOTED_ROUTE_ID,
      status: "BLOCKED",
      classification: "PROVENANCE_MISMATCH",
      execution_performed: false,
      production_dispatch: false,
      reason_codes: ["PROVENANCE_MISMATCH", "ELIGIBILITY_BINDING_TASK_RUN_MISMATCH"],
    };
  }

  const transport = options.transport;
  if (typeof transport !== "function") {
    return {
      schema_version: PROMOTION_DISPATCH_SCHEMA,
      evaluated_at: iso(nowMs),
      route_id: PROMOTED_ROUTE_ID,
      status: "BLOCKED",
      classification: "TRANSPORT_NOT_PROVIDED_FAIL_CLOSED",
      execution_performed: false,
      production_dispatch: false,
      reason_codes: ["TRANSPORT_NOT_PROVIDED_FAIL_CLOSED", "NO_DEFAULT_TRANSPORT_BY_DESIGN"],
    };
  }
  // The qualified live primitive may be wired ONLY after the future explicit activation.
  if (transport === QUALIFIED_CHAIN_SEND && options.production_activation_confirmed !== true) {
    return {
      schema_version: PROMOTION_DISPATCH_SCHEMA,
      evaluated_at: iso(nowMs),
      route_id: PROMOTED_ROUTE_ID,
      status: "BLOCKED",
      classification: "ACTIVATION_NOT_CONFIRMED",
      execution_performed: false,
      production_dispatch: false,
      reason_codes: ["ACTIVATION_NOT_CONFIRMED", "QUALIFIED_HERMES_TRANSPORT_REQUIRES_EXPLICIT_ACTIVATION"],
    };
  }

  const dispatchSpec = {
    schema_version: "v4-phase-f-promotion-dispatch-spec-v1",
    route_id: PROMOTED_ROUTE_ID,
    controlled_route_id: CONTROLLED_ROUTE_ID,
    task_ref: request.task_ref,
    run_id: request.run_id,
    dispatch_binding: eligibility.dispatch_binding,
    payload: request.payload ?? null,
    verification_boundary: QUALIFIED_HERMES_TRANSPORT_BINDING.verification_boundary,
  };

  let transportResult = null;
  try {
    transportResult = await transport(dispatchSpec);
  } catch (err) {
    return {
      schema_version: PROMOTION_DISPATCH_SCHEMA,
      evaluated_at: iso(nowMs),
      route_id: PROMOTED_ROUTE_ID,
      status: "ERROR",
      classification: "TRANSPORT_ERROR_FAIL_CLOSED",
      execution_performed: false,
      production_dispatch: false,
      reason_codes: ["TRANSPORT_ERROR_FAIL_CLOSED", String(err && err.message ? err.message : "unknown").slice(0, 120)],
    };
  }
  if (!transportResult || typeof transportResult !== "object") {
    return {
      schema_version: PROMOTION_DISPATCH_SCHEMA,
      evaluated_at: iso(nowMs),
      route_id: PROMOTED_ROUTE_ID,
      status: "ERROR",
      classification: "TRANSPORT_RESULT_INVALID",
      execution_performed: false,
      production_dispatch: false,
      reason_codes: ["TRANSPORT_RESULT_INVALID"],
    };
  }

  const performed = transportResult.execution_performed === true;
  if (performed && typeof options.verify !== "function") {
    // Independent confirmation is REQUIRED before any success claim.
    return {
      schema_version: PROMOTION_DISPATCH_SCHEMA,
      evaluated_at: iso(nowMs),
      route_id: PROMOTED_ROUTE_ID,
      status: "BLOCKED",
      classification: "INDEPENDENT_VERIFICATION_REQUIRED",
      execution_performed: true,
      production_dispatch: false,
      verification_state: "PENDING_INDEPENDENT_CONFIRMATION",
      reason_codes: ["INDEPENDENT_VERIFICATION_REQUIRED", "TRANSPORT_SUCCESS_IS_NOT_SEND_SUCCESS"],
      transport_result: transportResult,
    };
  }
  let verification = null;
  if (performed) {
    try {
      verification = await options.verify(dispatchSpec);
    } catch (err) {
      verification = { ok: false, reason_code: "VERIFIER_ERROR" };
    }
  }
  return {
    schema_version: PROMOTION_DISPATCH_SCHEMA,
    evaluated_at: iso(nowMs),
    route_id: PROMOTED_ROUTE_ID,
    status: performed ? (verification?.ok === true ? "EXECUTED_CONFIRMED" : "EXECUTED_UNCONFIRMED") : "DRY_RUN",
    classification: READY_CLASSIFICATION, // eligibility classification preserved
    execution_performed: performed,
    production_dispatch: performed, // only a real transport could ever set this
    verification_state: performed ? (verification?.ok === true ? "CONFIRMED" : "NOT_CONFIRMED") : "NOT_APPLICABLE_DRY_RUN",
    transport_stubbed: transportResult.stubbed === true,
    reason_codes: performed
      ? (verification?.ok === true ? ["EXECUTED_AND_DOM_CONFIRMED"] : ["EXECUTED_AWAITING_DOM_CONFIRMATION"])
      : ["DRY_RUN_STUBBED_TRANSPORT", "EXECUTION_PERFORMED_FALSE"],
    transport_result: transportResult,
  };
}
