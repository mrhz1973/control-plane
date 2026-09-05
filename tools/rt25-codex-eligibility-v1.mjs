#!/usr/bin/env node
/**
 * V4_RT25_T10 — Codex subscription route runtime ELIGIBILITY (real runtime law).
 *
 * Campaign #41 task 10. Runtime eligibility gate for Codex subscription
 * surfaces (codex_ide_cursor_extension / codex_external_planner). A Codex
 * route is runtime-ELIGIBLE only when ALL hold:
 *   1. the access surface exists in registry-v2 and is bound to
 *      chatgpt_codex_subscription;
 *   2. surface.qualification.runtime_qualified === true (registry evidence);
 *   3. the route's declared auth is a SUBSCRIPTION auth listed in
 *      surface.auth.allowed and NOT in surface.auth.forbidden
 *      (NO OpenAI API / BYOK / API billing — structural, not advisory);
 *   4. the shared pool passes runtime admission (fresh + reserve, T05/T06);
 *   5. the projected resource is available in the joined state.
 *
 * Any violation → ineligible with explicit reason codes. Unknown stays unknown.
 */

import { admitRouteWithReserve } from "./rt25-reserve-admission-v1.mjs";

export const CODEX_ELIGIBILITY_SCHEMA = "v4-rt25-codex-eligibility-v1";
export const CODEX_POOL_ID = "chatgpt_codex_subscription";

/**
 * @param {object} registry  registry-v2 object (models/access_surfaces/quota_pools)
 * @param {object} joined    rt25-quota-state-join-v1 output (ok===true)
 * @param {object} route     { route_id, access_surface, auth, resource_id }
 */
export function evaluateCodexRouteEligibility(registry, joined, route) {
  const base = {
    schema_version: CODEX_ELIGIBILITY_SCHEMA,
    route_id: typeof route?.route_id === "string" ? route.route_id : null,
    access_surface: typeof route?.access_surface === "string" ? route.access_surface : null,
    quota_pool_id: CODEX_POOL_ID,
    eligible: false,
    eligibility: null,
    reason_codes: [],
  };

  if (!registry || !registry.access_surfaces || !registry.quota_pools) {
    return { ...base, eligibility: "INELIGIBLE_REGISTRY_INVALID", reason_codes: ["REGISTRY_INVALID"] };
  }
  if (!joined || joined.schema_version !== "v4-rt25-quota-state-join-v1" || joined.ok !== true) {
    return { ...base, eligibility: "INELIGIBLE_JOIN_STATE_INVALID", reason_codes: ["JOIN_STATE_INVALID"] };
  }
  const surfaceId = route?.access_surface;
  if (typeof surfaceId !== "string" || !registry.access_surfaces[surfaceId]) {
    return { ...base, eligibility: "INELIGIBLE_SURFACE_UNKNOWN", reason_codes: ["ACCESS_SURFACE_UNKNOWN"] };
  }
  const surface = registry.access_surfaces[surfaceId];

  // 1. surface must belong to the codex subscription pool
  if (surface.quota_pool_id !== CODEX_POOL_ID) {
    return { ...base, eligibility: "INELIGIBLE_NOT_CODEX_SUBSCRIPTION_SURFACE", reason_codes: ["WRONG_QUOTA_POOL_BINDING"] };
  }

  // 2. runtime qualification from registry evidence
  if (surface.qualification?.runtime_qualified !== true) {
    return { ...base, eligibility: "INELIGIBLE_SURFACE_NOT_RUNTIME_QUALIFIED", reason_codes: ["SURFACE_NOT_RUNTIME_QUALIFIED"] };
  }

  // 3. auth law: subscription-only, forbidden list absolute
  const auth = typeof route?.auth === "string" ? route.auth : null;
  const allowed = Array.isArray(surface.auth?.allowed) ? surface.auth.allowed : [];
  const forbidden = Array.isArray(surface.auth?.forbidden) ? surface.auth.forbidden : [];
  if (!auth || !allowed.includes(auth)) {
    return { ...base, eligibility: "INELIGIBLE_AUTH_NOT_ALLOWED", reason_codes: ["AUTH_NOT_IN_SURFACE_ALLOWED"] };
  }
  if (forbidden.includes(auth)) {
    return { ...base, eligibility: "INELIGIBLE_AUTH_FORBIDDEN", reason_codes: ["AUTH_FORBIDDEN_ON_SURFACE"] };
  }

  // 4. shared pool runtime admission (fresh + reserve)
  const rid = typeof route?.resource_id === "string" ? route.resource_id : "codex";
  const admission = admitRouteWithReserve(joined, rid);
  if (admission.admitted !== true) {
    return {
      ...base,
      eligibility: `INELIGIBLE_${admission.admission}`,
      reason_codes: [...(admission.reason_codes || [])],
    };
  }

  // 5. projected resource availability in the joined state
  const res = joined.resources?.[rid];
  if (!res || res.resource_available !== true) {
    return { ...base, eligibility: "INELIGIBLE_RESOURCE_NOT_AVAILABLE", reason_codes: ["PROJECTED_RESOURCE_UNAVAILABLE"] };
  }

  return {
    ...base,
    resource_id: rid,
    eligible: true,
    eligibility: "ELIGIBLE_SUBSCRIPTION_FRESH_WITHIN_RESERVE",
    reason_codes: ["SURFACE_RUNTIME_QUALIFIED", "SUBSCRIPTION_AUTH_OK", "POOL_HEALTHY", "RESOURCE_AVAILABLE"],
  };
}
