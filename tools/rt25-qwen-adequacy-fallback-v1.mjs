#!/usr/bin/env node
/**
 * V4_RT25_T12 — Qwen runtime adequacy fallback integration (REAL runtime law).
 *
 * Campaign #41 task 12. Connects the existing Qwen role qualification to the
 * quota-aware selection chain: the unmetered local lane (qwen_local) is
 * preferred ONLY when it is ADEQUATE for the demand and ACTUALLY AVAILABLE in
 * the joined runtime state. Adequacy is caller-declared structured demand
 * (required capabilities + min quality tier); the selector never invents it.
 *
 * Law:
 *   qwen route admitted only if:
 *     - qwen_local in joined state AND available === true (composer gate,
 *       which already enforces the QWEN hard gates: local_probe, READY_IDLE,
 *       no launch, zero generation calls);
 *     - required_capabilities ⊆ declared qwen capability inventory;
 *     - declared min_quality_tier ≤ qwen tier (unknown tier → inadequate →
 *       never silently preferred).
 *   Otherwise the fallback outcome is explicit: FALLBACK_NOT_ADEQUATE /
 *   FALLBACK_NOT_AVAILABLE — callers keep their cloud alternatives auditable.
 */

export const QWEN_FALLBACK_SCHEMA = "v4-rt25-qwen-adequacy-fallback-v1";

/** Runtime capability inventory for the local Qwen lane (caller-declared domain). */
export const QWEN_INVENTORY = Object.freeze({
  resource_id: "qwen_local",
  model: "qwen-local",
  capabilities: Object.freeze(["planning", "code_generation", "repo_read"]),
  quality_tier: 2,
});

/**
 * @param {object} joined  rt25-quota-state-join-v1 output (ok===true)
 * @param {object} demand  { required_capabilities?: string[], min_quality_tier?: number }
 */
export function evaluateQwenAdequacyFallback(joined, demand = {}) {
  const base = {
    schema_version: QWEN_FALLBACK_SCHEMA,
    resource_id: QWEN_INVENTORY.resource_id,
    quota_pool_id: null,
    adequate: false,
    fallback: null,
    reason_codes: [],
  };
  if (!joined || joined.schema_version !== "v4-rt25-quota-state-join-v1" || joined.ok !== true) {
    return { ...base, fallback: "FALLBACK_JOIN_STATE_INVALID", reason_codes: ["JOIN_STATE_INVALID"] };
  }

  const res = joined.resources?.[QWEN_INVENTORY.resource_id];
  if (!res) {
    return { ...base, fallback: "FALLBACK_RESOURCE_NOT_IN_JOIN", reason_codes: ["RESOURCE_NOT_IN_JOIN"] };
  }
  if (res.resource_available !== true) {
    return { ...base, fallback: "FALLBACK_NOT_AVAILABLE", reason_codes: ["QWEN_NOT_AVAILABLE_IN_JOINED_STATE"] };
  }

  const required = Array.isArray(demand.required_capabilities) ? demand.required_capabilities : [];
  const missing = required.filter((c) => !QWEN_INVENTORY.capabilities.includes(c));
  if (missing.length > 0) {
    return {
      ...base,
      fallback: "FALLBACK_NOT_ADEQUATE",
      reason_codes: missing.map((c) => `QWEN_CAPABILITY_MISSING_${String(c).toUpperCase()}`),
    };
  }

  const minTier = typeof demand.min_quality_tier === "number" && Number.isFinite(demand.min_quality_tier) ? demand.min_quality_tier : null;
  if (minTier !== null && QWEN_INVENTORY.quality_tier > minTier) {
    return { ...base, fallback: "FALLBACK_NOT_ADEQUATE", reason_codes: ["QWEN_QUALITY_TIER_INSUFFICIENT"] };
  }

  return {
    ...base,
    adequate: true,
    fallback: "FALLBACK_ADEQUATE_AND_AVAILABLE",
    reason_codes: ["QWEN_AVAILABLE", "QWEN_ADEQUATE_FOR_DEMAND", "UNMETERED_LOCAL_PREFERRED"],
  };
}
