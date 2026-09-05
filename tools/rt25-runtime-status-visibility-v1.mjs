#!/usr/bin/env node
/**
 * V4_RT25_T23 — runtime status / observability visibility (REAL runtime path).
 *
 * Campaign #41 task 23. Produces a machine-readable runtime visibility summary
 * over the quota-aware chain components that RT25 wired: the composed
 * RESOURCE_STATUS, the quota-joined pool state, and the latest route decision
 * envelopes (planner/execution/reviewer/retry) with their provenance.
 *
 * Law:
 *   - read-only aggregation of REAL runtime artifacts (no inference, no
 *     invented values, no network);
 *   - any input missing/invalid yields an explicit degraded component entry
 *     with a reason code (fail-closed visibility, never silent);
 *   - the summary carries an authorization_neutral flag: observability NEVER
 *     changes gates, admission, or activation state (D-0025 untouched).
 */

export const RT25_RUNTIME_STATUS_SCHEMA = "v4-rt25-runtime-status-visibility-v1";

function component(name, ok, detail = {}) {
  return { component: name, state: ok ? "VISIBLE" : "DEGRADED", ...detail };
}

/**
 * @param {object} inputs
 *   composed   — composer result (v4-resource-status-v1) or null
 *   joined     — joinQuotaPoolState() output or null
 *   decision   — any RT25 decision envelope or null
 *   provenance — buildRouteQuotaProvenance() output or null
 *   audit      — { planner_log_path, execution_log_path } last-audit pointer or null
 * @param {object} [options] { nowMs }
 */
export function buildRt25RuntimeStatusVisibility(inputs = {}, options = {}) {
  const nowIso = new Date(
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now(),
  ).toISOString();
  const components = [];

  // 1. composer status
  if (inputs.composed && inputs.composed.schema_version === "v4-resource-status-control-plane-source-result-v1" && inputs.composed.resource_status) {
    const res = inputs.composed.resource_status.resources || {};
    components.push(
      component("resource_status_composer", true, {
        resources: Object.keys(res).length,
        available: Object.values(res).filter((r) => r?.available === true).length,
        generated_at: inputs.composed.resource_status.generated_at ?? null,
      }),
    );
  } else {
    components.push(component("resource_status_composer", false, { reason_codes: ["COMPOSED_STATUS_ABSENT_OR_INVALID"] }));
  }

  // 2. quota-joined pool state
  if (inputs.joined && inputs.joined.ok === true && inputs.joined.pools) {
    const poolEvals = {};
    for (const [poolId, pool] of Object.entries(inputs.joined.pools)) {
      poolEvals[poolId] = pool?.evaluation ?? null;
    }
    components.push(
      component("quota_pool_state_join", true, {
        pools: Object.keys(inputs.joined.pools).length,
        evaluations: poolEvals,
        blocked_pools: Object.entries(poolEvals).filter(([, e]) => e && e !== "POOL_HEALTHY").map(([id]) => id),
      }),
    );
  } else {
    components.push(component("quota_pool_state_join", false, { reason_codes: ["JOINED_STATE_ABSENT_OR_INVALID"] }));
  }

  // 3. latest route decision
  const d = inputs.decision;
  if (d && typeof d === "object" && typeof d.schema_version === "string" && typeof d.status === "string") {
    components.push(
      component("route_decision", true, {
        decision_id: d.decision_id ?? null,
        decision_role: d.decision_role ?? null,
        decision_schema_version: d.schema_version,
        decision_status: d.status,
        selected_route: d.selected?.route_id ?? null,
        reason_codes: Array.isArray(d.reason_codes) ? d.reason_codes : [],
      }),
    );
  } else {
    components.push(component("route_decision", false, { reason_codes: ["DECISION_ENVELOPE_ABSENT_OR_INVALID"] }));
  }

  // 4. packet provenance
  const p = inputs.provenance;
  if (p && p.schema_version === "v4-rt25-route-quota-provenance-v1") {
    components.push(
      component("packet_quota_provenance", true, {
        present: p.present === true,
        selected_route: p.selected_route ?? null,
        absence_reason: p.absence_reason ?? null,
      }),
    );
  } else {
    components.push(component("packet_quota_provenance", false, { reason_codes: ["PROVENANCE_ABSENT_OR_INVALID"] }));
  }

  // 5. audit trail pointer
  const a = inputs.audit;
  if (a && typeof a === "object" && typeof a.planner_log_path === "string" && a.planner_log_path.trim()) {
    components.push(
      component("decision_audit", true, {
        planner_log_path: a.planner_log_path,
        execution_log_path: typeof a.execution_log_path === "string" ? a.execution_log_path : null,
      }),
    );
  } else {
    components.push(component("decision_audit", false, { reason_codes: ["AUDIT_POINTER_ABSENT"] }));
  }

  const visible = components.filter((c) => c.state === "VISIBLE").length;
  return {
    schema_version: RT25_RUNTIME_STATUS_SCHEMA,
    generated_at: nowIso,
    ok: visible === components.length,
    visibility: visible === components.length ? "FULL" : visible === 0 ? "NONE" : "PARTIAL",
    authorization_neutral: true,
    d0025_gate_state: "UNCHANGED_CLOSED",
    chain: "RESOURCE_STATUS -> composer -> planner/execution/reviewer/retry selectors -> packet -> bridge -> endpoint",
    components,
  };
}
