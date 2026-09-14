#!/usr/bin/env node
/**
 * V4 — EXPIRING_ALLOWANCE_USE generic preference policy (parent issue #32).
 *
 * PROVIDER-NEUTRAL PREFERENCE MODIFIER — never an authorization mechanism.
 * Deterministic classification of whether an already-admitted, quota-pool-bound
 * candidate's included allowance is verifiably near its reset/expiry, so a
 * caller (e.g. rt25-planner-quota-aware-selector-v1) MAY reorder already
 * eligible candidates to prefer it — ONLY when genuinely useful READY work
 * exists. The policy cannot make an ineligible route eligible, cannot bypass
 * human gates/production authorization/reserve floors/quality requirements,
 * and has no API to create or schedule work (WORK_MANUFACTURE_FOR_QUOTA_BURN
 * is structurally impossible through this module).
 *
 * TIME LAW: reset_at/expiry_at must be a strict ISO-8601 string parsing to a
 * finite timestamp STRICTLY IN THE FUTURE relative to the injected evaluation
 * clock; anything else fails closed for the PREFERENCE FEATURE ONLY
 * (RESET_UNKNOWN) and never marks the route generally unavailable.
 *
 * THRESHOLD LAW: the window is generic caller-supplied configuration
 * (expiring_allowance_window_seconds). The default is a documented, bounded,
 * provider-neutral constant — no provider-specific folklore, no automatic
 * provider-derived threshold, no model-mutable surface. An allowance inside
 * the window (time_remaining_ms <= window_seconds * 1000, inclusive boundary)
 * classifies as expiring.
 *
 * ALLOWANCE VALUE LAW: unknown/stale/unverified allowance is NEVER treated as
 * healthy or expiring (fail closed). Uncertainty is preserved explicitly in
 * reason codes; this module never invents a remaining percentage.
 *
 * Library only — offline deterministic tests import it directly. No runtime
 * wiring, no inference, no provider calls.
 */

export const EXPIRING_ALLOWANCE_POLICY_SCHEMA = "v4-expiring-allowance-policy-v1";

/**
 * Generic default window: an allowance is "expiring" when its verified future
 * reset is within 30 minutes of the evaluation clock. Calibration of this
 * value is explicit caller configuration (never provider-derived, never
 * model-mutable); 1800s is a bounded neutral starting policy.
 */
export const DEFAULT_EXPIRING_ALLOWANCE_WINDOW_SECONDS = 1800;

/** Strict future ISO-8601 timestamp -> epoch ms, else null (never guesses). */
function parseFutureResetMs(resetAt, nowMs) {
  if (typeof resetAt !== "string" || resetAt.length === 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(resetAt)) return null;
  const ms = Date.parse(resetAt);
  if (!Number.isFinite(ms)) return null;
  if (ms <= nowMs) return null; // past/expired/mis-dated -> uninterpretable for preference
  return ms;
}

/**
 * Classify ONE pool's expiring-allowance eligibility.
 *
 * @param {object|null} poolState joined pool entry (rt25-quota-state-join-v1
 *   shape: { state, freshness, remaining_percent, reset_at,
 *   reserve_floor_percent }) — or an equivalent normalized object.
 * @param {object} [options] { nowMs, windowSeconds, adequate, qualityOk,
 *   policyPermitted }
 * @returns {{ schema_version, active, reason_code, metadata }} active=true
 *   only when EVERY condition holds; otherwise reason_code carries the exact
 *   deterministic non-activation cause.
 */
export function classifyExpiringAllowance(poolState, options = {}) {
  const nowMs =
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const windowSeconds =
    typeof options.windowSeconds === "number" && Number.isFinite(options.windowSeconds) && options.windowSeconds > 0
      ? options.windowSeconds
      : DEFAULT_EXPIRING_ALLOWANCE_WINDOW_SECONDS;
  const adequate = options.adequate !== false; // upstream eligibility verified unless caller asserts otherwise
  const qualityOk = options.qualityOk !== false;
  const policyPermitted = options.policyPermitted !== false;

  const metadata = {
    quota_pool_state: null,
    reset_at: typeof poolState?.reset_at === "string" ? poolState.reset_at : null,
    window_seconds: windowSeconds,
    time_remaining_ms: null,
    remaining_percent: typeof poolState?.remaining_percent === "number" ? poolState.remaining_percent : null,
    reserve_floor_percent:
      typeof poolState?.reserve_floor_percent === "number" ? poolState.reserve_floor_percent : null,
    evaluation_clock: new Date(nowMs).toISOString(),
  };

  const fail = (reason_code) => ({ schema_version: EXPIRING_ALLOWANCE_POLICY_SCHEMA, active: false, reason_code, metadata });

  if (!policyPermitted) return fail("POLICY_BLOCKED"); // mandatory policy restriction always wins
  if (!adequate) return fail("ROUTE_INADEQUATE"); // capability/role adequacy (upstream-enforced in selectors)
  if (!qualityOk) return fail("QUALITY_REQUIREMENT_BLOCKED"); // never trade quality for expiring quota

  if (!poolState || typeof poolState !== "object") return fail("ALLOWANCE_UNKNOWN");
  metadata.quota_pool_state = typeof poolState.state === "string" ? poolState.state : null;
  if (poolState.freshness === "stale") return fail("ALLOWANCE_STALE");
  if (poolState.freshness !== "fresh") return fail("ALLOWANCE_UNKNOWN");
  if (poolState.state === "exhausted") return fail("ALLOWANCE_EXHAUSTED");
  if (poolState.state !== "available") return fail("ALLOWANCE_UNKNOWN");

  // reserve floor: never consume below required reserve (belt & braces —
  // selectors already enforce this at admission; direct callers are covered too)
  if (
    typeof poolState.reserve_floor_percent === "number" &&
    typeof poolState.remaining_percent === "number" &&
    poolState.remaining_percent <= poolState.reserve_floor_percent
  ) {
    return fail("RESERVE_FLOOR_BLOCKED");
  }

  const resetMs = parseFutureResetMs(poolState.reset_at, nowMs);
  if (resetMs === null) return fail("RESET_UNKNOWN");
  const timeRemainingMs = resetMs - nowMs;
  metadata.time_remaining_ms = timeRemainingMs;
  if (timeRemainingMs > windowSeconds * 1000) return fail("OUTSIDE_EXPIRING_WINDOW");

  metadata.reset_at = poolState.reset_at;
  return { schema_version: EXPIRING_ALLOWANCE_POLICY_SCHEMA, active: true, reason_code: "EXPIRING_ALLOWANCE_USE", metadata };
}

/**
 * Deterministic candidate reordering for ALREADY-ELIGIBLE (admitted)
 * candidates. Preference priority: expiring-active first, then the caller's
 * own order preserved (selectors re-sort by select_rank/route_id afterwards
 * if they need their own tie-break — this helper only expresses the
 * preference). Never adds, removes, or mutates candidate identity.
 *
 * @param {Array} classified [{ candidate, classification }] — classification
 *   from classifyExpiringAllowance.
 * @returns {Array} reordered [{ candidate, classification }]
 */
export function reorderWithExpiringPreference(classified) {
  if (!Array.isArray(classified)) return [];
  return [...classified].sort((a, b) => {
    const ax = a?.classification?.active === true ? 0 : 1;
    const bx = b?.classification?.active === true ? 0 : 1;
    return ax - bx;
  });
}
