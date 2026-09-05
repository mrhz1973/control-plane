#!/usr/bin/env node
/**
 * V4_RT25_T19 — retry/repair quota-aware selector (REAL runtime path).
 *
 * Campaign #41 task 19. Recomputes the CURRENT quota-joined state from a
 * FRESH composer invocation before every retry (never reuses the original
 * decision's stale evidence) and protects scarce pools:
 *   - a pool whose remaining_percent is at/below its reserve floor is
 *     EXCLUDED from retry candidates entirely (scarce-pool protection),
 *     even though a one-off admission might have passed earlier;
 *   - the retry selection then follows the same normalized law (T08 core)
 *     over the freshly joined state;
 *   - retry context (previous route/pool, attempt number) is audit-visible;
 *   - if the recomputed state blocks everything → RETRY_BLOCKED with the
 *     exact reason codes (no silent reuse of the previous route).
 */

import { selectQuotaAwarePlannerRoute } from "./rt25-planner-quota-aware-selector-v1.mjs";

export const RETRY_DECISION_SCHEMA = "v4-rt25-retry-quota-aware-decision-v1";

/**
 * @param {object} freshComposerResult  a NEWLY composed composer result (this retry)
 * @param {object} registry             registry (v2, validated inside join)
 * @param {Array}  candidates           retry candidates (same candidate law)
 * @param {object} [context]            { attempt, previous_route_id, previous_pool_id, nowMs, decision_id }
 */
export function selectQuotaAwareRetryRoute(freshComposerResult, registry, candidates, context = {}) {
  // Lazy import to avoid module cycle at load time.
  return import("./rt25-quota-state-join-v1.mjs").then(({ joinQuotaPoolState }) => {
    const nowMs = typeof context.nowMs === "number" && Number.isFinite(context.nowMs) ? context.nowMs : Date.now();
    const base = {
      schema_version: RETRY_DECISION_SCHEMA,
      decision_role: "retry",
      attempt: typeof context.attempt === "number" ? context.attempt : null,
      previous_route_id: context.previous_route_id ?? null,
      previous_pool_id: context.previous_pool_id ?? null,
      decided_at: new Date(nowMs).toISOString(),
      ok: false,
      status: null,
      selected: null,
      admitted_candidates: [],
      rejected_candidates: [],
      pool_evaluations: {},
      scarce_pools_excluded: [],
      reason_codes: [],
    };

    const joined = joinQuotaPoolState(freshComposerResult, registry, { nowMs });
    if (!joined.ok) {
      return { ...base, status: "RETRY_BLOCKED", reason_codes: ["JOIN_STATE_INVALID"] };
    }

    // Scarce-pool protection: at/below reserve floor → excluded from THIS retry.
    const scarce = [];
    for (const [poolId, pool] of Object.entries(joined.pools || {})) {
      if (pool?.evaluation === "RESERVE_FLOOR_BLOCK") scarce.push(poolId);
    }
    base.scarce_pools_excluded = scarce;
    const filteredCandidates = Array.isArray(candidates)
      ? candidates.filter((c) => {
          const poolId = joined.resources?.[c?.resource_id]?.quota_pool_id;
          if (poolId && scarce.includes(poolId)) {
            base.rejected_candidates.push({ route_id: c.route_id ?? null, resource_id: c.resource_id, reason_codes: ["SCARCE_POOL_EXCLUDED_RETRY", poolId] });
            return false;
          }
          return true;
        })
      : candidates;

    const core = selectQuotaAwarePlannerRoute(joined, filteredCandidates, {
      nowMs,
      decision_id: context.decision_id || `retry-${nowMs}`,
    });

    base.ok = core.ok;
    base.status = core.status === "ROUTE_SELECTED" ? "RETRY_ROUTE_SELECTED" : "RETRY_BLOCKED";
    base.selected = core.selected;
    base.admitted_candidates = core.admitted_candidates;
    base.rejected_candidates.push(...core.rejected_candidates);
    base.pool_evaluations = core.pool_evaluations;
    base.reason_codes = [
      ...(scarce.length ? [`SCARCE_POOLS_EXCLUDED_${scarce.map((s) => s.toUpperCase()).join("+")}`] : []),
      ...core.reason_codes,
    ];
    return base;
  });
}
