#!/usr/bin/env node
/**
 * V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1 — end-to-end promoted-
 * route observability envelope builder (GAP R5).
 *
 * Reuses EXISTING observability machinery; builds no dashboard and no second
 * router:
 *   - rt25-runtime-status-visibility-v1  (read-only chain visibility)
 *   - rt25 decision envelopes            (route selection + reason codes)
 *   - rt25-quota-state-join-v1           (pool freshness / admission evidence)
 *   - v4-phase-f-route-control-v1        (disable/rollback state, R4)
 *   - Phase E composition output         (shadow route + defer reasons)
 *
 * Law:
 *   - pure aggregation: reads structured inputs, emits one bounded
 *     observation envelope; never mutates gates, admission, or state;
 *   - authorization-neutral (same law as T23 visibility);
 *   - fail-closed observability: a missing/invalid slice produces an explicit
 *     degraded field with a reason code — never a silently absent field;
 *   - no chain-of-thought, no secrets: inputs are structured envelopes only;
 *   - every required packet field is ALWAYS present (possibly null with a
 *     reason), so downstream consumers can audit absence explicitly.
 */

import { evaluateRouteControl, rollbackObservation, CONTROLLED_ROUTE_ID } from "./v4-phase-f-route-control-v1.mjs";

export const ROUTE_OBSERVABILITY_SCHEMA = "v4-phase-f-route-observability-v1";

const REQUIRED_FIELDS = Object.freeze([
  "task_ref", "route_selected", "mode", "resource_admission_result",
  "resource_freshness_state", "local_controller_availability",
  "web_surface_availability", "authorization_result",
  "fallback_or_defer_reason", "failure_class", "route_enable_disable_state",
  "rollback_state", "observed_at",
]);

function degraded(field, reason) {
  return { state: "DEGRADED", reason_code: reason, value: null };
}

/**
 * @param {object} inputs
 *   task_ref        — string task identity (required)
 *   phaseE          — evaluateHermesPhaseEShadowRoute output (or null)
 *   joined          — rt25-quota-state-join-v1 output (or null)
 *   decision        — any RT25 decision envelope (or null)
 *   visibility      — buildRt25RuntimeStatusVisibility output (or null)
 *   routeControlDoc — v4-phase-f-route-control state document (or null)
 *   localController — { available, adequate } (or null)
 *   chatgptWeb      — separate-availability observation (or null)
 *   failureClass    — explicit failure class string (or null)
 * @param {object} [options] { nowMs }
 */
export function buildRouteObservabilityEnvelope(inputs = {}, options = {}) {
  const nowMs = typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const env = {
    schema_version: ROUTE_OBSERVABILITY_SCHEMA,
    authorization_neutral: true,
    observed_at: nowIso,
    observability_complete: false,
    missing_fields: [],
    fields: {
      // observed_at is always present and always OBSERVED (it is this envelope's own timestamp).
      observed_at: { state: "OBSERVED", value: nowIso },
    },
  };

  const taskRef = typeof inputs.task_ref === "string" && inputs.task_ref.trim() ? inputs.task_ref.trim().slice(0, 120) : null;
  env.fields.task_ref = taskRef ? { state: "OBSERVED", value: taskRef } : degraded("task_ref", "TASK_REF_ABSENT");

  // Route selection + mode + defer/fallback reason from the Phase E composition (existing authority).
  const pe = inputs.phaseE;
  if (pe && typeof pe.status === "string") {
    const routeSelected = pe.route
      ? (typeof pe.route === "object" && pe.route.route_id ? pe.route.route_id : (pe.route.controller ? `${pe.route.controller}->${pe.route.bridge}->${pe.route.target}` : "SELECTED"))
      : (pe.status === "NO_ROUTE_SELECTED" ? null : null);
    env.fields.route_selected = pe.route
      ? { state: "OBSERVED", value: routeSelected ?? "PHASE_E_ROUTE" }
      : { state: "OBSERVED", value: null, note: "NO_ROUTE_SELECTED — explicit defer, never silent" };
    env.fields.mode = { state: "OBSERVED", value: typeof pe.mode === "string" ? pe.mode : null };
    env.fields.fallback_or_defer_reason = {
      state: "OBSERVED",
      value: Array.isArray(pe.reason_codes) ? pe.reason_codes.slice(0, 12) : [],
    };
    env.fields.authorization_result = {
      state: "OBSERVED",
      value: {
        production_dispatch: pe.production_dispatch === true,
        hidden_fallback: pe.hidden_fallback === true,
        authorization_bypass: pe.authorization_bypass === true,
        shadow_only: pe.mode === "SHADOW_ONLY",
      },
    };
  } else {
    env.fields.route_selected = degraded("route_selected", "PHASE_E_ENVELOPE_ABSENT_OR_INVALID");
    env.fields.mode = degraded("mode", "PHASE_E_ENVELOPE_ABSENT_OR_INVALID");
    env.fields.fallback_or_defer_reason = degraded("fallback_or_defer_reason", "PHASE_E_ENVELOPE_ABSENT_OR_INVALID");
    env.fields.authorization_result = degraded("authorization_result", "PHASE_E_ENVELOPE_ABSENT_OR_INVALID");
  }

  // Resource admission + freshness from the existing quota join.
  const joined = inputs.joined;
  if (joined && joined.ok === true && joined.pools && joined.resources) {
    const evaluations = Object.fromEntries(Object.entries(joined.pools).map(([id, p]) => [id, p?.evaluation ?? null]));
    const freshness = Object.fromEntries(Object.entries(joined.pools).map(([id, p]) => [id, p?.freshness ?? null]));
    env.fields.resource_admission_result = { state: "OBSERVED", value: { ok: true, pool_evaluations: evaluations } };
    env.fields.resource_freshness_state = { state: "OBSERVED", value: freshness };
  } else {
    env.fields.resource_admission_result = degraded("resource_admission_result", "QUOTA_JOIN_ABSENT_OR_INVALID");
    env.fields.resource_freshness_state = degraded("resource_freshness_state", "QUOTA_JOIN_ABSENT_OR_INVALID");
  }

  // Local controller / Web surface availability (independent admission inputs).
  const lc = inputs.localController;
  env.fields.local_controller_availability = lc && typeof lc === "object"
    ? { state: "OBSERVED", value: { available: lc.available === true, adequate: lc.adequate === true } }
    : degraded("local_controller_availability", "LOCAL_CONTROLLER_INPUT_ABSENT");
  const web = inputs.chatgptWeb;
  env.fields.web_surface_availability = web && typeof web === "object"
    ? {
        state: "OBSERVED",
        value: {
          availability_domain: web.availability_domain ?? null,
          state: web.state ?? null,
          reachable: web.reachable ?? null,
          authenticated: web.authenticated ?? null,
          freshness: web.freshness ?? null,
        },
      }
    : degraded("web_surface_availability", "WEB_OBSERVATION_ABSENT");

  env.fields.failure_class = typeof inputs.failureClass === "string" && inputs.failureClass.trim()
    ? { state: "OBSERVED", value: inputs.failureClass.trim().slice(0, 80) }
    : degraded("failure_class", "FAILURE_CLASS_NOT_PROVIDED");

  // Route disable / rollback state from the R4 control (fail-closed evaluator reused).
  const doc = inputs.routeControlDoc ?? null;
  const rcEval = evaluateRouteControl(doc, { nowMs });
  const rb = rollbackObservation(doc, { nowMs });
  env.fields.route_enable_disable_state = {
    state: "OBSERVED",
    value: {
      route_id: CONTROLLED_ROUTE_ID,
      effective_state: rcEval.effective_state, // DISABLED | SHADOW_ONLY | CANDIDATE_ENABLED | null
      state_class: rcEval.state_class,         // SAFE | CANDIDATE | FAIL_CLOSED
      fail_closed: rcEval.fail_closed,
      reason_codes: rcEval.reason_codes,
    },
  };
  env.fields.rollback_state = {
    state: "OBSERVED",
    value: {
      rollback_ready: rb.rollback_ready === true,
      restoration_state: rb.restoration_state,
      disable_count: rb.disable_count,
      last_disable: rb.last_disable,
    },
  };

  // RT25 read-only visibility pointer (existing T23 machinery).
  const vis = inputs.visibility;
  env.rt25_visibility = vis && vis.schema_version === "v4-rt25-runtime-status-visibility-v1"
    ? { state: "OBSERVED", visibility: vis.visibility, ok: vis.ok === true }
    : { state: "DEGRADED", reason_code: "RT25_VISIBILITY_ABSENT_OR_INVALID", visibility: null };

  // Completeness: every required field present and OBSERVED.
  for (const f of REQUIRED_FIELDS) {
    const field = env.fields[f];
    if (!field || field.state !== "OBSERVED") env.missing_fields.push(f);
  }
  env.observability_complete = env.missing_fields.length === 0 && env.rt25_visibility.state === "OBSERVED";
  return env;
}
