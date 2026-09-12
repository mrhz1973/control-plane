#!/usr/bin/env node
/**
 * Phase E — deterministic composition gate for quota-degraded Hermes shadow routing.
 *
 * This module does not evaluate quota, run a selector, call a provider, or execute
 * Hermes. It consumes the existing RT25 execution decision and independently
 * observed Qwen/ChatGPT Web readiness. It therefore cannot replace RT25 or create
 * a parallel quota/router policy.
 */

import { EXECUTION_DECISION_SCHEMA } from "./rt25-execution-quota-aware-selector-v1.mjs";

export const PHASE_E_ROUTE = Object.freeze({
  controller: "qwen_local",
  bridge: "hermes",
  target: "chatgpt_web",
});

const DEGRADED_COMMERCIAL_CODES = new Set([
  "POOL_EXHAUSTED",
  "RESERVE_FLOOR_BLOCK",
  "RESERVE_HEADROOM_INSUFFICIENT",
  "CONSERVE_UNKNOWN_MISSING",
  "CONSERVE_UNKNOWN_STALE",
  "CONSERVE_UNKNOWN_STATE",
  "COMMERCIAL_UNAVAILABLE",
  "INELIGIBLE_BY_OPERATOR_POLICY",
]);

function output(extra = {}) {
  return {
    status: "DEFERRED",
    mode: "SHADOW_TEST_INPUT",
    route: null,
    commercial_decision_reused: false,
    production_dispatch: false,
    promotion_phase_executed: false,
    hidden_fallback: false,
    authorization_bypass: false,
    reason_codes: [],
    ...extra,
  };
}

function decisionCodes(decision) {
  const codes = new Set(Array.isArray(decision?.reason_codes) ? decision.reason_codes : []);
  for (const rejected of decision?.rejected_candidates || []) {
    for (const code of rejected?.reason_codes || []) codes.add(code);
  }
  return [...codes];
}

function chatgptWebReady(web) {
  return web?.availability_domain === "SEPARATE_AVAILABILITY_DOMAIN" &&
    web?.state === "AVAILABLE" &&
    web?.freshness === "fresh" &&
    web?.reachable === true &&
    web?.authenticated === true &&
    web?.throttled !== true;
}

/**
 * Consume an existing RT25 execution decision and compose the Phase E shadow
 * candidate. Inputs are deterministic, injectable observations only:
 *
 * - commercialDecision: output of selectQuotaAwareExecutionRoute;
 * - localController: { available: boolean, adequate: boolean } from the local
 *   resource/role-admission boundary;
 * - chatgptWeb: existing separate-availability-domain observation;
 * - authorization: Phase E requires production_dispatch_authorized === false.
 */
export function evaluateHermesPhaseEShadowRoute({ commercialDecision, localController, chatgptWeb, authorization } = {}) {
  if (!commercialDecision || commercialDecision.schema_version !== EXECUTION_DECISION_SCHEMA) {
    return output({ reason_codes: ["COMMERCIAL_DECISION_INVALID"] });
  }

  if (commercialDecision.status === "ROUTE_SELECTED" && commercialDecision.selected) {
    return output({
      status: "DIRECT_COMMERCIAL_ROUTE_SELECTED",
      mode: "DIRECT_COMMERCIAL",
      route: commercialDecision.selected,
      commercial_decision_reused: true,
      reason_codes: ["NORMAL_COMMERCIAL_PREFERENCE_PRESERVED"],
    });
  }

  if (commercialDecision.status !== "NO_ROUTE_SELECTED" || commercialDecision.selected !== null) {
    return output({ reason_codes: ["COMMERCIAL_DECISION_NOT_FAIL_CLOSED"] });
  }

  const commercialCodes = decisionCodes(commercialDecision);
  if (!commercialCodes.some((code) => DEGRADED_COMMERCIAL_CODES.has(code))) {
    return output({ reason_codes: ["COMMERCIAL_DEGRADATION_NOT_PROVEN"] });
  }

  if (authorization?.production_dispatch_authorized !== false) {
    return output({ reason_codes: ["PHASE_E_PRODUCTION_AUTHORIZATION_FORBIDDEN"] });
  }

  if (localController?.available !== true || localController?.adequate !== true) {
    return output({ reason_codes: ["QWEN_LOCAL_UNAVAILABLE_OR_INADEQUATE"] });
  }

  if (!chatgptWebReady(chatgptWeb)) {
    return output({ reason_codes: ["CHATGPT_WEB_UNAVAILABLE_OR_STALE"] });
  }

  return output({
    status: "SHADOW_ROUTE_SELECTED",
    mode: "SHADOW_ONLY",
    route: PHASE_E_ROUTE,
    commercial_decision_reused: true,
    reason_codes: [
      "COMMERCIAL_ROUTE_FAIL_CLOSED",
      ...commercialCodes.filter((code) => DEGRADED_COMMERCIAL_CODES.has(code)),
      "QWEN_LOCAL_ADMITTED",
      "CHATGPT_WEB_SEPARATE_AVAILABILITY_DOMAIN_ADMITTED",
      "SHADOW_ONLY_NO_PRODUCTION_DISPATCH",
    ],
  });
}
