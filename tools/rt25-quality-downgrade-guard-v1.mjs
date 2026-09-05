#!/usr/bin/env node
/**
 * V4_RT25_T13 — no-silent-quality-downgrade runtime guard (REAL runtime law).
 *
 * Campaign #41 task 13. Guards ANY quota-aware decision envelope (planner T08
 * / execution T09) so a HIGH-RISK/HIGH-COMPLEXITY demand can never silently
 * fall to a cheaper inadequate route. Runs on the decision ENVELOPE itself —
 * the exact object the runtime would execute — not on a parallel copy.
 *
 * Law:
 *   demand.risk = "high" | "normal".
 *   High-risk demands require the selected route to carry a quality tier
 *   ≤ min_quality_tier (from caller demand inventory) AND required
 *   capabilities. If the selected route misses tier/capability/eligibility
 *   the guard VETOES the decision (status → VETOED_QUALITY_DOWNGRADE) with an
 *   audit trail; it never substitutes a route of its own.
 *   Missing tier information on a selected route counts as UNKNOWN → veto for
 *   high-risk (fail closed). Normal-risk demands pass through untouched.
 */

export const QUALITY_GUARD_SCHEMA = "v4-rt25-quality-downgrade-guard-v1";

/** Minimal runtime route quality inventory (caller-declared domain knowledge). */
export const ROUTE_QUALITY_INVENTORY = Object.freeze({
  "codex-ide": { quality_tier: 1, capabilities: Object.freeze(["planning", "code_generation", "repo_read", "task_delta"]) },
  "glm-5.3": { quality_tier: 1, capabilities: Object.freeze(["planning", "code_generation"]) },
  "glm-5.3-flash": { quality_tier: 2, capabilities: Object.freeze(["planning", "code_generation"]) },
  "qwen-local": { quality_tier: 2, capabilities: Object.freeze(["planning", "code_generation", "repo_read"]) },
});

/**
 * @param {object} decision  planner/execution quota-aware decision envelope
 * @param {object} demand    { risk?: "high"|"normal", min_quality_tier?: number, required_capabilities?: string[] }
 * @param {object} [options] { inventory?: object (defaults to ROUTE_QUALITY_INVENTORY) }
 */
export function guardQualityDowngrade(decision, demand = {}, options = {}) {
  const base = {
    schema_version: QUALITY_GUARD_SCHEMA,
    guard: null,
    veto: false,
    original_status: decision?.status ?? null,
    reason_codes: [],
  };

  if (!decision || typeof decision !== "object" || !decision.schema_version || !Array.isArray(decision.reason_codes)) {
    return { ...base, guard: "GUARD_DECISION_ENVELOPE_INVALID", veto: true, reason_codes: ["DECISION_ENVELOPE_INVALID"] };
  }

  const risk = demand.risk === "high" ? "high" : "normal";
  if (risk === "normal") {
    return { ...base, guard: "GUARD_PASS_NORMAL_RISK", reason_codes: ["NORMAL_RISK_PASS_THROUGH"] };
  }

  // High-risk law on the selected route.
  if (decision.status !== "ROUTE_SELECTED" || !decision.selected) {
    return { ...base, guard: "GUARD_PASS_NO_ROUTE_ANYWAY", reason_codes: ["NO_ROUTE_SELECTED_HIGH_RISK_STAYS_BLOCKED"] };
  }

  const inventory = options.inventory || ROUTE_QUALITY_INVENTORY;
  const model = decision.selected.model;
  const inv = typeof model === "string" ? inventory[model] : null;

  if (!inv) {
    return {
      ...base,
      guard: "GUARD_VETO_QUALITY_DOWNGRADE",
      veto: true,
      reason_codes: ["SELECTED_ROUTE_QUALITY_UNKNOWN_HIGH_RISK"],
    };
  }

  const minTier = typeof demand.min_quality_tier === "number" ? demand.min_quality_tier : 1;
  if (inv.quality_tier > minTier) {
    return {
      ...base,
      guard: "GUARD_VETO_QUALITY_DOWNGRADE",
      veto: true,
      reason_codes: [`SELECTED_QUALITY_TIER_${inv.quality_tier}_ABOVE_REQUIRED_${minTier}`],
    };
  }

  const required = Array.isArray(demand.required_capabilities) ? demand.required_capabilities : [];
  const missing = required.filter((c) => !inv.capabilities.includes(c));
  if (missing.length > 0) {
    return {
      ...base,
      guard: "GUARD_VETO_QUALITY_DOWNGRADE",
      veto: true,
      reason_codes: missing.map((c) => `SELECTED_CAPABILITY_MISSING_${String(c).toUpperCase()}`),
    };
  }

  return { ...base, guard: "GUARD_PASS_HIGH_RISK_ADEQUATE", reason_codes: ["SELECTED_ROUTE_ADEQUATE_HIGH_RISK"] };
}
