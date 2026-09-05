#!/usr/bin/env node
/**
 * V4_RT25_T18 — reviewer quota-aware selector (REAL runtime path).
 *
 * Campaign #41 task 18. Independent reviewer route selection using the CURRENT
 * quota-joined state. Same admission law as planner/execution (T08 core), plus
 * the reviewer INDEPENDENCE law:
 *   - candidates must declare their model; reviewer candidates sharing the
 *     implementer's model id are penalized ONLY when an alternative admitted
 *     candidate exists (independence preferred, never fabricated);
 *   - if the ONLY admitted candidate is the implementer's model, selection
 *     succeeds with explicit SAME_MODEL_AS_IMPLEMENTER code (runtime decides
 *     policy elsewhere; the selector never hides it).
 *
 * The reviewer selector never reuses the implementer decision object: it
 * re-runs the normalized selection law on reviewer candidates.
 */

import { selectQuotaAwarePlannerRoute } from "./rt25-planner-quota-aware-selector-v1.mjs";

export const REVIEWER_DECISION_SCHEMA = "v4-rt25-reviewer-quota-aware-decision-v1";

/**
 * @param {object} joined          rt25-quota-state-join-v1 output
 * @param {Array}  candidates      reviewer candidates (same law as planner)
 * @param {object} [context]       { implementer_model?: string, decision_id?, nowMs? }
 */
export function selectQuotaAwareReviewerRoute(joined, candidates, context = {}) {
  const nowIso = new Date(
    typeof context.nowMs === "number" && Number.isFinite(context.nowMs) ? context.nowMs : Date.now(),
  ).toISOString();

  const core = selectQuotaAwarePlannerRoute(joined, candidates, {
    ...context,
    decision_id: context.decision_id || `reviewer-${nowIso}`,
  });

  const base = {
    schema_version: REVIEWER_DECISION_SCHEMA,
    decision_role: "reviewer",
    decided_at: nowIso,
    ok: core.ok,
    status: core.status,
    selected: core.selected,
    admitted_candidates: core.admitted_candidates,
    rejected_candidates: core.rejected_candidates,
    pool_evaluations: core.pool_evaluations,
    economics_attachments: core.economics_attachments,
    reason_codes: [...core.reason_codes],
  };

  // Independence law (ACTIVE preference): when the implementer's model is known
  // and an alternative admitted candidate exists, prefer the independent one;
  // the same-model candidate is demoted to rejected with an explicit code.
  const implModel = typeof context.implementer_model === "string" ? context.implementer_model : null;
  if (core.status === "ROUTE_SELECTED" && implModel) {
    const alternatives = core.admitted_candidates.filter((c) => c.model !== implModel);
    const sameModelAdmitted = core.admitted_candidates.filter((c) => c.model === implModel);
    if (alternatives.length > 0 && sameModelAdmitted.length > 0) {
      for (const sm of sameModelAdmitted) {
        base.rejected_candidates.push({
          route_id: sm.route_id,
          resource_id: sm.resource_id,
          reason_codes: ["REVIEWER_INDEPENDENCE_PREFERENCE_SAME_MODEL_DEMOTED"],
        });
      }
      base.admitted_candidates = alternatives;
      alternatives.sort((a, b) =>
        a.select_rank !== b.select_rank ? a.select_rank - b.select_rank : String(a.route_id).localeCompare(String(b.route_id)),
      );
      base.selected = alternatives[0];
      base.reason_codes = ["QUOTA_AWARE_SELECTION", `SELECTED_${String(base.selected.admission).toUpperCase()}`, "REVIEWER_INDEPENDENT_OF_IMPLEMENTER"];
    } else if (alternatives.length === 0) {
      base.reason_codes.push("REVIEWER_SAME_MODEL_AS_IMPLEMENTER_ONLY_ADMITTED");
    } else {
      base.reason_codes.push("REVIEWER_INDEPENDENT_OF_IMPLEMENTER");
    }
  }
  return base;
}
