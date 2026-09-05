#!/usr/bin/env node
/**
 * V4_RT25_T20 — Execution Packet route/quota PROVENANCE propagation (REAL runtime path).
 *
 * Campaign #41 task 20. Builds the canonical `route_quota_provenance` block
 * that rides on the Execution Packet: selected model/access-surface/quota-pool,
 * reasoning/speed metadata and decision provenance (decision id, boundary,
 * admission evidence, pool freshness). AUTHORIZATION-NEUTRAL: the block carries
 * routing metadata only and changes no authorization semantics (no gate flags,
 * no admission bypass; D-0025 untouched).
 *
 * Consumers: the n8n bridge envelope (T21), the Windows endpoint validation
 * (T22) and the runtime status visibility (T23).
 *
 * Build fails closed: provenance can only be derived from a SELECTED decision
 * envelope; blocked decisions produce explicit provenance_absent blocks.
 */

export const ROUTE_QUOTA_PROVENANCE_SCHEMA = "v4-rt25-route-quota-provenance-v1";

/**
 * @param {object} decision   any RT25 decision envelope (planner/execution/reviewer/retry) with status ROUTE_SELECTED
 * @param {object} [options]  { nowMs, reasoning_metadata?, speed_metadata? }
 */
export function buildRouteQuotaProvenance(decision, options = {}) {
  const nowIso = new Date(
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now(),
  ).toISOString();
  const base = {
    schema_version: ROUTE_QUOTA_PROVENANCE_SCHEMA,
    built_at: nowIso,
    present: false,
    decision_ref: null,
    decision_role: decision?.decision_role ?? null,
    selected_route: null,
    model: null,
    access_surface: null,
    quota_pool_id: null,
    pool_evidence: null,
    admission_evidence: null,
    economics_summary: null,
    reasoning_metadata: options.reasoning_metadata ?? null,
    speed_metadata: options.speed_metadata ?? null,
    authorization_note: "routing metadata only; no authorization semantics changed; D-0025 gate untouched",
  };

  if (!decision || typeof decision !== "object" || !decision.schema_version) {
    return { ...base, present: false, absence_reason: "DECISION_ENVELOPE_INVALID" };
  }
  if (decision.status !== "ROUTE_SELECTED" || !decision.selected) {
    return {
      ...base,
      present: false,
      absence_reason: "NO_ROUTE_SELECTED",
      blocked_reason_codes: Array.isArray(decision.reason_codes) ? decision.reason_codes : [],
    };
  }

  const sel = decision.selected;
  return {
    ...base,
    present: true,
    decision_ref: decision.decision_id ?? null,
    selected_route: sel.route_id ?? null,
    model: sel.model ?? null,
    access_surface: sel.access_surface ?? null,
    quota_pool_id: sel.quota_pool_id ?? null,
    pool_evidence: sel.quota_pool_id && decision.pool_evaluations?.[sel.quota_pool_id]
      ? {
          state: decision.pool_evaluations[sel.quota_pool_id].state,
          freshness: decision.pool_evaluations[sel.quota_pool_id].freshness,
          evaluation: decision.pool_evaluations[sel.quota_pool_id].evaluation,
          remaining_percent: decision.pool_evaluations[sel.quota_pool_id].remaining_percent,
          reset_at: decision.pool_evaluations[sel.quota_pool_id].reset_at ?? null,
        }
      : null,
    admission_evidence: {
      admission: sel.admission ?? null,
      provenance: sel.admission_provenance ?? null,
    },
    economics_summary: sel.economics
      ? { verified: sel.economics.verified === true, payload: sel.economics.verified === true ? sel.economics.payload : null }
      : null,
  };
}

/**
 * Attach provenance to an existing Execution Packet object (schema execution-packet-v1)
 * WITHOUT altering any authorization-relevant field. Returns a new object with
 * `route_quota_provenance` added; input is never mutated.
 * Fails closed: unknown packet shape → { attached: false }.
 */
export function attachProvenanceToPacket(packet, provenance) {
  if (!packet || typeof packet !== "object" || packet.schema !== "execution-packet-v1" || typeof packet.packet_id !== "string") {
    return { attached: false, reason: "PACKET_SHAPE_UNKNOWN" };
  }
  if (!provenance || provenance.schema_version !== ROUTE_QUOTA_PROVENANCE_SCHEMA) {
    return { attached: false, reason: "PROVENANCE_INVALID" };
  }
  const next = structuredClone(packet);
  next.route_quota_provenance = provenance;
  return { attached: true, packet: next };
}

/**
 * Extract + validate provenance FROM a packet (Windows endpoint side, T22).
 */
export function readProvenanceFromPacket(packet) {
  const p = packet?.route_quota_provenance;
  if (!p || p.schema_version !== ROUTE_QUOTA_PROVENANCE_SCHEMA) {
    return { valid: false, present: false, reason: "PROVENANCE_ABSENT_OR_INVALID" };
  }
  if (p.present === true) {
    const okShape =
      typeof p.selected_route === "string" &&
      typeof p.model === "string" &&
      typeof p.quota_pool_id === "string" &&
      p.pool_evidence && typeof p.pool_evidence.evaluation === "string";
    if (!okShape) {
      return { valid: false, present: true, reason: "PROVENANCE_SHAPE_INVALID" };
    }
  }
  return { valid: true, present: p.present === true, provenance: p };
}
