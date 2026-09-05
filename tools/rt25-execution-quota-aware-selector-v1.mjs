#!/usr/bin/env node
/**
 * V4_RT25_T09 — execution / TASK-DELTA quota-aware selector (REAL runtime path).
 *
 * Campaign #41 task 09. Same normalized decision law as the planner (T08 core),
 * applied at the EXECUTION boundary: TASK-DELTA implementation / prompt-creator
 * route selection. Reuses selectQuotaAwarePlannerRoute unchanged (one law, two
 * boundaries) and wraps it with the execution decision envelope consumed by the
 * execution audit (T17) and Execution Packet provenance (T20).
 *
 * The selector NEVER executes anything: it only produces the normalized route
 * decision for the runtime execution layer behind the closed authorization gate.
 */

import { selectQuotaAwarePlannerRoute } from "./rt25-planner-quota-aware-selector-v1.mjs";

export const EXECUTION_DECISION_SCHEMA = "v4-rt25-execution-quota-aware-decision-v1";

/**
 * @param {object} joined      rt25-quota-state-join-v1 output (ok===true)
 * @param {Array}  candidates  same candidate law as planner selector
 * @param {object} [options]   { decision_id, nowMs, task_delta_id, execution_kind: "implementation"|"prompt_creator" }
 */
export function selectQuotaAwareExecutionRoute(joined, candidates, options = {}) {
  const nowIso = new Date(
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now(),
  ).toISOString();
  const executionKind = options.execution_kind === "prompt_creator" ? "prompt_creator" : "implementation";

  // SAME normalized decision law (T08 core) — not a parallel implementation.
  const core = selectQuotaAwarePlannerRoute(joined, candidates, {
    ...options,
    decision_id: options.decision_id || `execution-${nowIso}`,
  });

  return {
    schema_version: EXECUTION_DECISION_SCHEMA,
    decision_role: "execution",
    execution_kind: executionKind,
    task_delta_id: typeof options.task_delta_id === "string" ? options.task_delta_id : null,
    decided_at: nowIso,
    ok: core.ok,
    status: core.status,
    selected: core.selected,
    admitted_candidates: core.admitted_candidates,
    rejected_candidates: core.rejected_candidates,
    pool_evaluations: core.pool_evaluations,
    economics_attachments: core.economics_attachments,
    reason_codes: core.reason_codes,
  };
}
