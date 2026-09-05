#!/usr/bin/env node
/**
 * V4_RT25_T14 — urgency/defer runtime guard (REAL runtime law).
 *
 * Campaign #41 task 14. Guards a quota-aware decision envelope against
 * unlawful deferral:
 *   - URGENT work is NEVER deferred (deferral decision → veto, always run).
 *   - NON-urgent work may defer ONLY IF (all true):
 *       1. an explicit defer policy allows it (policy input; no invented policy);
 *       2. a cheaper reset/cheaper-window route is KNOWN — i.e. the pool has a
 *          fresh reset_at in the future (observed evidence, not invented);
 *       3. the selected route exists (ROUTE_SELECTED) or is blocked by quota
 *          (NO_ROUTE_SELECTED with pool reasons) — deferral of a healthy
 *          already-selected route for non-urgent work still requires (1)+(2).
 *
 * The guard returns { defer_allowed, guard, reason_codes } — it does not
 * mutate the decision; runtime callers branch on defer_allowed.
 */

export const URGENCY_GUARD_SCHEMA = "v4-rt25-urgency-defer-guard-v1";

function parseFuture(iso, nowMs) {
  if (typeof iso !== "string") return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t) || t <= nowMs) return null;
  return t;
}

/**
 * @param {object} decision    planner/execution decision envelope
 * @param {object} urgency     { urgent: boolean }
 * @param {object} [context]   { nowMs, defer_policy?: { allowed: boolean, policy_ref: string }, selected_reset_at?: string, selected_pool_id?: string }
 */
export function guardUrgencyDeferral(decision, urgency = {}, context = {}) {
  const nowMs = typeof context.nowMs === "number" && Number.isFinite(context.nowMs) ? context.nowMs : Date.now();
  const base = {
    schema_version: URGENCY_GUARD_SCHEMA,
    guard: null,
    defer_allowed: false,
    reason_codes: [],
  };

  if (!decision || typeof decision !== "object" || !decision.schema_version) {
    return { ...base, guard: "GUARD_DECISION_ENVELOPE_INVALID", reason_codes: ["DECISION_ENVELOPE_INVALID"] };
  }

  const urgent = urgency.urgent === true;
  if (urgent) {
    return { ...base, guard: "GUARD_URGENT_RUN_NOW", reason_codes: ["URGENT_NEVER_DEFERRED"] };
  }

  // Non-urgent: defer requires explicit policy.
  const policy = context.defer_policy;
  if (!policy || policy.allowed !== true || typeof policy.policy_ref !== "string" || !policy.policy_ref) {
    return { ...base, guard: "GUARD_DEFER_NO_POLICY", reason_codes: ["DEFERRAL_POLICY_MISSING_OR_DISALLOWED"] };
  }

  // …and a KNOWN cheaper window: fresh observed reset_at in the future for the selected/bound pool.
  const poolId = context.selected_pool_id || decision.selected?.quota_pool_id || null;
  let resetAt = context.selected_reset_at ?? null;
  if (!resetAt && poolId) {
    resetAt = decision.pool_evaluations?.[poolId]?.reset_at ?? null;
  }
  const futureReset = parseFuture(resetAt, nowMs);
  if (!futureReset) {
    return {
      ...base,
      guard: "GUARD_DEFER_NO_KNOWN_RESET_WINDOW",
      reason_codes: ["NO_FUTURE_RESET_EVIDENCE", "CHEAPER_WINDOW_UNKNOWN"],
    };
  }

  return {
    ...base,
    defer_allowed: true,
    guard: "GUARD_DEFER_ALLOWED_POLICY_AND_RESET_KNOWN",
    reason_codes: ["NON_URGENT", `DEFER_POLICY_${String(policy.policy_ref).toUpperCase()}`, "FUTURE_RESET_OBSERVED"],
    known_reset_at: resetAt,
  };
}
