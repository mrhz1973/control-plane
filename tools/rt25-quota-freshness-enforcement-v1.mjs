#!/usr/bin/env node
/**
 * V4_RT25_T05 — runtime freshness fail-closed ENFORCEMENT (real runtime path).
 *
 * Campaign #41 task 05. Central runtime gate that every quota-aware runtime
 * selector MUST call before consuming a pool. Enforces the #39/#41 law:
 *   missing pool status  -> blocked (CONSERVE_UNKNOWN_MISSING)
 *   stale pool status    -> blocked (CONSERVE_UNKNOWN_STALE)
 *   unknown state        -> blocked (CONSERVE_UNKNOWN_STATE)
 *   exhausted pool       -> blocked (POOL_EXHAUSTED)
 *   below reserve floor  -> blocked (RESERVE_FLOOR_BLOCK) [policy input only]
 *   healthy + within reserve -> allowed
 *
 * Single source of truth for enforcement used by planner/execution/reviewer/
 * retry selectors (T08/T09/T18/T19) and the Windows endpoint admission (T22).
 * Library module; deterministic via injectable joinedState.
 */

export const ENFORCEMENT_SCHEMA = "v4-rt25-quota-freshness-enforcement-v1";

/**
 * Enforce freshness/fail-closed law for ONE pool evaluation result coming from
 * rt25-quota-state-join-v1 `pools[pool_id]`.
 * Returns { allowed, enforcement, reason_codes }.
 */
export function enforcePoolFreshness(poolEvaluation) {
  const base = {
    schema_version: ENFORCEMENT_SCHEMA,
    allowed: false,
    enforcement: null,
    reason_codes: [],
  };
  if (!poolEvaluation || typeof poolEvaluation !== "object") {
    return { ...base, enforcement: "CONSERVE_UNKNOWN_MISSING", reason_codes: ["POOL_EVALUATION_MISSING"] };
  }
  const ev = poolEvaluation.evaluation;
  const blockedCodes = {
    QUOTA_POOL_UNKNOWN: "CONSERVE_UNKNOWN_MISSING",
    CONSERVE_UNKNOWN_MISSING: "CONSERVE_UNKNOWN_MISSING",
    CONSERVE_UNKNOWN_STALE: "CONSERVE_UNKNOWN_STALE",
    CONSERVE_UNKNOWN_STATE: "CONSERVE_UNKNOWN_STATE",
    POOL_EXHAUSTED: "POOL_EXHAUSTED",
    RESERVE_FLOOR_BLOCK: "RESERVE_FLOOR_BLOCK",
  };
  if (blockedCodes[ev]) {
    return { ...base, enforcement: blockedCodes[ev], reason_codes: [blockedCodes[ev]] };
  }
  if (ev === "POOL_HEALTHY") {
    return { ...base, allowed: true, enforcement: "ALLOWED_FRESH_WITHIN_RESERVE", reason_codes: ["POOL_HEALTHY"] };
  }
  return { ...base, enforcement: "CONSERVE_UNKNOWN_STATE", reason_codes: [`UNRECOGNIZED_EVALUATION_${String(ev).toUpperCase()}`] };
}

/**
 * Convenience: enforce a whole joined state for a specific resource binding.
 * joined = rt25-quota-state-join output; resourceId = v1 projection id.
 */
export function enforceResourcePool(joined, resourceId) {
  if (!joined || joined.schema_version !== "v4-rt25-quota-state-join-v1" || joined.ok !== true) {
    return { schema_version: ENFORCEMENT_SCHEMA, allowed: false, enforcement: "CONSERVE_UNKNOWN_MISSING", reason_codes: ["JOIN_STATE_INVALID"] };
  }
  const binding = joined.resources?.[resourceId];
  if (!binding) {
    return { schema_version: ENFORCEMENT_SCHEMA, allowed: false, enforcement: "CONSERVE_UNKNOWN_MISSING", reason_codes: ["RESOURCE_NOT_IN_JOIN"] };
  }
  if (binding.quota_pool_id === null) {
    return {
      schema_version: ENFORCEMENT_SCHEMA,
      allowed: true,
      enforcement: "NO_POOL_BINDING",
      reason_codes: [`NO_POOL_${String(binding.pool_semantics).toUpperCase()}`],
    };
  }
  const pool = joined.pools?.[binding.quota_pool_id];
  const out = enforcePoolFreshness(pool);
  out.pool_id = binding.quota_pool_id;
  return out;
}
