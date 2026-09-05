#!/usr/bin/env node
/**
 * V4_RT25_T06 — runtime RESERVE admission at route-selection boundaries.
 *
 * Campaign #41 task 06. The function runtime selectors (planner T08,
 * execution T09, reviewer T18, retry T19) call when they pick a route bound
 * to a shared quota pool. Reserve floors come ONLY from explicit reserve
 * policy input (carried through rt25-quota-state-join-v1); thresholds are
 * never invented. Unknown/comparable-law violations fail closed.
 *
 * Law:
 *   pool not allowed by freshness/enforcement gate (T05) -> deny (same reason)
 *   floor policy present + remaining_percent null        -> deny RESERVE_INCOMPARABLE (fail closed)
 *   remaining_percent <= floor                            -> deny RESERVE_FLOOR_BLOCK
 *   estimated_cost_percent known and headroom below it    -> deny RESERVE_HEADROOM_INSUFFICIENT
 *   otherwise                                             -> admit with provenance
 *   no pool binding                                        -> admit NO_POOL (local lanes unchanged)
 */

export const RESERVE_ADMISSION_SCHEMA = "v4-rt25-reserve-admission-v1";

export function admitRouteWithReserve(joined, resourceId, options = {}) {
  const base = {
    schema_version: RESERVE_ADMISSION_SCHEMA,
    admitted: false,
    admission: null,
    pool_id: null,
    reason_codes: [],
  };
  if (!joined || joined.schema_version !== "v4-rt25-quota-state-join-v1" || joined.ok !== true) {
    return { ...base, admission: "DENY_JOIN_STATE_INVALID", reason_codes: ["JOIN_STATE_INVALID"] };
  }
  const binding = joined.resources?.[resourceId];
  if (!binding) {
    return { ...base, admission: "DENY_RESOURCE_NOT_IN_JOIN", reason_codes: ["RESOURCE_NOT_IN_JOIN"] };
  }
  if (binding.quota_pool_id === null) {
    return {
      ...base,
      admitted: true,
      admission: "ADMIT_NO_POOL",
      reason_codes: [`NO_POOL_${String(binding.pool_semantics).toUpperCase()}`],
    };
  }
  const poolId = binding.quota_pool_id;
  const pool = joined.pools?.[poolId];
  const remaining = pool?.remaining_percent;
  const floor = pool?.reserve_floor_percent;
  const policyRef = pool?.reserve_policy_ref ?? null;
  const provenance = {
    pool_id: poolId,
    remaining_percent: remaining,
    reserve_floor_percent: floor,
    reserve_policy_ref: policyRef,
    pool_evaluation: pool?.evaluation ?? null,
  };

  // Freshness/health gate (T05) first — reserve never overrides fail-closed.
  const enforcementMod = null; // inline law to avoid import cycle; parity tested
  const blockedEvaluations = {
    QUOTA_POOL_UNKNOWN: "CONSERVE_UNKNOWN_MISSING",
    CONSERVE_UNKNOWN_MISSING: "CONSERVE_UNKNOWN_MISSING",
    CONSERVE_UNKNOWN_STALE: "CONSERVE_UNKNOWN_STALE",
    CONSERVE_UNKNOWN_STATE: "CONSERVE_UNKNOWN_STATE",
    POOL_EXHAUSTED: "POOL_EXHAUSTED",
  };
  const ev = pool?.evaluation;
  if (blockedEvaluations[ev]) {
    return { ...base, admission: `DENY_${blockedEvaluations[ev]}`, pool_id: poolId, reason_codes: [blockedEvaluations[ev]], provenance };
  }
  if (ev === "RESERVE_FLOOR_BLOCK") {
    return { ...base, admission: "DENY_RESERVE_FLOOR_BLOCK", pool_id: poolId, reason_codes: ["RESERVE_FLOOR_BLOCK"], provenance };
  }
  if (ev !== "POOL_HEALTHY") {
    return { ...base, admission: "DENY_CONSERVE_UNKNOWN_STATE", pool_id: poolId, reason_codes: [`UNRECOGNIZED_EVALUATION_${String(ev).toUpperCase()}`], provenance };
  }

  // Reserve law (only on healthy pools). Floor is explicit policy input only.
  if (typeof floor === "number") {
    if (typeof remaining !== "number") {
      return { ...base, admission: "DENY_RESERVE_INCOMPARABLE", pool_id: poolId, reason_codes: ["RESERVE_INCOMPARABLE_UNIT"], provenance };
    }
    if (remaining <= floor) {
      return { ...base, admission: "DENY_RESERVE_FLOOR_BLOCK", pool_id: poolId, reason_codes: ["RESERVE_FLOOR_BLOCK"], provenance };
    }
    const est = options.estimated_cost_percent;
    if (typeof est === "number" && Number.isFinite(est) && est >= 0) {
      if (remaining - floor < est) {
        return {
          ...base,
          admission: "DENY_RESERVE_HEADROOM_INSUFFICIENT",
          pool_id: poolId,
          reason_codes: ["RESERVE_HEADROOM_INSUFFICIENT"],
          provenance: { ...provenance, estimated_cost_percent: est, headroom_percent: Math.round((remaining - floor) * 100) / 100 },
        };
      }
    }
  }

  return {
    ...base,
    admitted: true,
    admission: "ADMIT_FRESH_WITHIN_RESERVE",
    pool_id: poolId,
    reason_codes: ["POOL_HEALTHY", "RESERVE_OK"],
    provenance,
  };
}
