#!/usr/bin/env node
/**
 * V4_RT25_T08 — planner quota-aware selector (REAL runtime decision core).
 *
 * Campaign #41 task 08. Canonical planner-side selection over quota-joined
 * runtime state (T04), enforced freshness (T05), reserve admission (T06) and
 * economics metadata (T07). Deterministic; no inference; no invented quota.
 *
 * Candidate law (caller supplies the route inventory; selector never invents):
 *   - candidate.resource_id must exist in the joined state;
 *   - candidate.forbidden === true → rejected FORBIDDEN_ROUTE, never selectable
 *     (e.g. OpenAI API/BYOK routes for Codex);
 *   - admission via admitRouteWithReserve (freshness gate + reserve + economics
 *     estimate when caller supplies base cost);
 *   - among admitted candidates: lowest select_rank wins; ties broken by
 *     lexical route_id (deterministic);
 *   - candidates sharing one resource reuse the SAME admission evidence
 *     (shared pools evaluated once — no double counting);
 *   - no admitted candidates → NO_ROUTE_SELECTED fail-closed with full audit.
 *
 * Output envelope is the planner decision record consumed by the audit (T16),
 * the Execution Packet provenance (T20) and the n8n bridge (T21).
 */

import { admitRouteWithReserve } from "./rt25-reserve-admission-v1.mjs";
import { attachEconomicsMetadata } from "./rt25-economics-metadata-v1.mjs";

export const PLANNER_DECISION_SCHEMA = "v4-rt25-planner-quota-aware-decision-v1";

/**
 * @param {object} joined      rt25-quota-state-join-v1 output (ok===true)
 * @param {Array}  candidates  [{route_id, resource_id, model, access_surface, select_rank, forbidden?, base_cost_percent?}]
 * @param {object} [options]   { decision_id, nowMs }
 */
export function selectQuotaAwarePlannerRoute(joined, candidates, options = {}) {
  const nowIso = new Date(
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now(),
  ).toISOString();
  const base = {
    schema_version: PLANNER_DECISION_SCHEMA,
    decision_id: options.decision_id || `planner-${nowIso}`,
    decided_at: nowIso,
    ok: false,
    status: null,
    selected: null,
    admitted_candidates: [],
    rejected_candidates: [],
    pool_evaluations: {},
    economics_attachments: {},
    reason_codes: [],
  };

  if (!joined || joined.schema_version !== "v4-rt25-quota-state-join-v1" || joined.ok !== true) {
    return { ...base, status: "NO_ROUTE_SELECTED", reason_codes: ["JOIN_STATE_INVALID"] };
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { ...base, status: "NO_ROUTE_SELECTED", reason_codes: ["NO_CANDIDATES_SUPPLIED"] };
  }

  const admissionCache = new Map(); // resource_id -> admission result (shared pools evaluated once)
  const economicsCache = new Map();

  for (const c of candidates) {
    const rid = c?.route_id ? c.resource_id : null;
    const routeId = typeof c?.route_id === "string" ? c.route_id : null;
    if (!routeId || !rid) {
      base.rejected_candidates.push({ route_id: routeId || null, reason_codes: ["CANDIDATE_MALFORMED"] });
      continue;
    }
    if (c.forbidden === true) {
      base.rejected_candidates.push({ route_id: routeId, resource_id: rid, reason_codes: ["FORBIDDEN_ROUTE"] });
      continue;
    }
    if (!joined.resources?.[rid]) {
      base.rejected_candidates.push({ route_id: routeId, resource_id: rid, reason_codes: ["RESOURCE_NOT_IN_JOIN"] });
      continue;
    }

    if (!admissionCache.has(rid)) {
      admissionCache.set(rid, admitRouteWithReserve(joined, rid));
      economicsCache.set(rid, attachEconomicsMetadata(joined, rid, { base_cost_percent: c.base_cost_percent }));
    }
    const admission = admissionCache.get(rid);
    const economics = economicsCache.get(rid);

    if (admission.admitted !== true) {
      base.rejected_candidates.push({
        route_id: routeId,
        resource_id: rid,
        reason_codes: [admission.admission, ...(admission.reason_codes || [])],
        pool_evaluation: admission.provenance?.pool_evaluation ?? null,
      });
      continue;
    }

    const selectRank = typeof c.select_rank === "number" && Number.isFinite(c.select_rank) ? c.select_rank : 100;
    const record = {
      route_id: routeId,
      resource_id: rid,
      model: typeof c.model === "string" ? c.model : null,
      access_surface: typeof c.access_surface === "string" ? c.access_surface : null,
      select_rank: selectRank,
      quota_pool_id: admission.pool_id,
      admission: admission.admission,
      admission_provenance: admission.provenance,
      economics,
    };
    base.admitted_candidates.push(record);
  }

  if (base.admitted_candidates.length === 0) {
    return {
      ...base,
      status: "NO_ROUTE_SELECTED",
      reason_codes: ["ALL_CANDIDATES_REJECTED", ...new Set(base.rejected_candidates.flatMap((r) => r.reason_codes))],
    };
  }

  base.admitted_candidates.sort((a, b) =>
    a.select_rank !== b.select_rank ? a.select_rank - b.select_rank : String(a.route_id).localeCompare(String(b.route_id)),
  );
  const winner = base.admitted_candidates[0];
  base.selected = winner;
  base.status = "ROUTE_SELECTED";
  base.reason_codes = ["QUOTA_AWARE_SELECTION", `SELECTED_${String(winner.admission).toUpperCase()}`];

  // pool_evaluations: one entry per pool actually touched (shared pools appear once)
  for (const rec of base.admitted_candidates) {
    if (rec.quota_pool_id && !base.pool_evaluations[rec.quota_pool_id]) {
      base.pool_evaluations[rec.quota_pool_id] = joined.pools[rec.quota_pool_id] || null;
    }
  }
  for (const [rid, econ] of economicsCache) {
    if (econ.quota_pool_id) base.economics_attachments[econ.quota_pool_id] = econ.economics;
  }

  base.ok = true;
  return base;
}
