#!/usr/bin/env node
/**
 * V4_RT25_T07 — runtime ECONOMICS metadata propagation (real runtime path).
 *
 * Campaign #41 task 07. Attaches verified pricing-window / effective-multiplier
 * economics metadata to runtime route decision envelopes (planner/execution/
 * reviewer/retry), and derives `estimated_cost_percent` ONLY as arithmetic on
 * caller-supplied base cost × verified multiplier. Unknown economics propagate
 * as explicit verified=false with null payload — never invented, never guessed.
 *
 * Integration: reserve admission (T06) consumes the derived
 * estimated_cost_percent; with unverified economics the estimate is null and
 * the admission falls back to the floor-only reserve law.
 */

export const ECONOMICS_SCHEMA = "v4-rt25-economics-metadata-v1";

/**
 * Normalize an economics input for a pool (same law as join: verified or nothing).
 */
export function normalizeEconomics(poolId, econ) {
  if (econ && econ.verified === true && econ.payload && typeof econ.payload === "object") {
    return { verified: true, payload: econ.payload };
  }
  return { verified: false, payload: null };
}

/**
 * Attach economics metadata for the pool bound to a resource in a joined state.
 * Returns the metadata envelope (economics + optional derived estimate).
 *
 * @param {object} joined        rt25-quota-state-join output
 * @param {string} resourceId    v1 projection resource id
 * @param {object} [options]     { base_cost_percent?: number }
 */
export function attachEconomicsMetadata(joined, resourceId, options = {}) {
  const base = {
    schema_version: ECONOMICS_SCHEMA,
    resource_id: resourceId,
    quota_pool_id: null,
    economics: { verified: false, payload: null },
    estimated_cost_percent: null,
    reason_codes: [],
  };
  if (!joined || joined.schema_version !== "v4-rt25-quota-state-join-v1" || joined.ok !== true) {
    return { ...base, reason_codes: ["JOIN_STATE_INVALID"] };
  }
  const binding = joined.resources?.[resourceId];
  if (!binding) {
    return { ...base, reason_codes: ["RESOURCE_NOT_IN_JOIN"] };
  }
  if (binding.quota_pool_id === null) {
    return {
      ...base,
      reason_codes: [`NO_POOL_${String(binding.pool_semantics).toUpperCase()}`],
    };
  }
  const poolId = binding.quota_pool_id;
  const economics = joined.economics?.[poolId] || { verified: false, payload: null };

  // Derived estimate: ONLY arithmetic on caller-supplied base × verified multiplier.
  let estimated = null;
  const mult =
    economics.verified === true && typeof economics.payload?.effective_multiplier === "number"
      ? economics.payload.effective_multiplier
      : null;
  const baseCost = typeof options.base_cost_percent === "number" && Number.isFinite(options.base_cost_percent) && options.base_cost_percent >= 0
    ? options.base_cost_percent
    : null;
  if (mult !== null && baseCost !== null) {
    estimated = Math.round(baseCost * mult * 100) / 100;
  }

  return {
    schema_version: ECONOMICS_SCHEMA,
    resource_id: resourceId,
    quota_pool_id: poolId,
    economics,
    estimated_cost_percent: estimated,
    reason_codes: [
      ...(economics.verified ? ["ECONOMICS_VERIFIED"] : ["ECONOMICS_UNKNOWN"]),
      ...(estimated !== null ? ["ESTIMATE_DERIVED_ARITHMETIC"] : []),
    ],
  };
}
