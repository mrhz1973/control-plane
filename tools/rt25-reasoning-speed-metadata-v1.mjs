#!/usr/bin/env node
/**
 * V4_RT25_T15 — Codex reasoning/speed metadata propagation (REAL runtime path).
 *
 * Campaign #41 task 15. Propagates the SELECTED reasoning requirement and
 * speed preference through the real route decision object. Values come ONLY
 * from the caller-supplied runtime inventory/demand; unsupported combinations
 * degrade to explicit "unsupported" markers — never invented, never guessed.
 *
 * Codex subscription surfaces: reasoning requirement ∈ {none, low, medium,
 * high} ∩ caller inventory supported_reasoning; speed preference ∈ {quality,
 * balanced, fast} ∩ caller inventory supported_speed. Non-Codex routes carry
 * reasoning_level: null + explicit not_applicable code.
 */

export const REASONING_METADATA_SCHEMA = "v4-rt25-reasoning-speed-metadata-v1";
const SUPPORTED_REASONING = new Set(["none", "low", "medium", "high"]);
const SUPPORTED_SPEED = new Set(["quality", "balanced", "fast"]);

/**
 * @param {object} decision   planner/execution decision envelope (post-selection)
 * @param {object} demand     { reasoning?: string, speed?: string }
 * @param {object} [options]  { inventory?: { supported_reasoning?: string[], supported_speed?: string[] } }
 */
export function attachReasoningSpeedMetadata(decision, demand = {}, options = {}) {
  const base = {
    schema_version: REASONING_METADATA_SCHEMA,
    route_id: decision?.selected?.route_id ?? null,
    model: decision?.selected?.model ?? null,
    quota_pool_id: decision?.selected?.quota_pool_id ?? null,
    reasoning_metadata: { reasoning_level: null, propagation: "not_propagated", reason_codes: [] },
    speed_metadata: { speed_preference: null, propagation: "not_propagated", reason_codes: [] },
  };
  if (!decision || typeof decision !== "object" || decision.status !== "ROUTE_SELECTED" || !decision.selected) {
    base.reasoning_metadata.reason_codes = ["NO_SELECTED_ROUTE"];
    base.speed_metadata.reason_codes = ["NO_SELECTED_ROUTE"];
    return base;
  }

  const inv = options.inventory && typeof options.inventory === "object" ? options.inventory : {};
  const supReasoning = Array.isArray(inv.supported_reasoning) ? inv.supported_reasoning.filter((r) => SUPPORTED_REASONING.has(r)) : [];
  const supSpeed = Array.isArray(inv.supported_speed) ? inv.supported_speed.filter((s) => SUPPORTED_SPEED.has(s)) : [];

  const isCodexPool = decision.selected.quota_pool_id === "chatgpt_codex_subscription";

  // Reasoning
  if (!isCodexPool) {
    base.reasoning_metadata.reason_codes = ["REASONING_NOT_APPLICABLE_NON_CODEX"];
  } else {
    const wanted = typeof demand.reasoning === "string" && SUPPORTED_REASONING.has(demand.reasoning) ? demand.reasoning : null;
    if (!wanted) {
      base.reasoning_metadata.reason_codes = ["REASONING_REQUIREMENT_UNSPECIFIED_OR_UNSUPPORTED"];
    } else if (!supReasoning.includes(wanted)) {
      base.reasoning_metadata = { reasoning_level: null, propagation: "unsupported_by_inventory", reason_codes: [`REASONING_${wanted.toUpperCase()}_NOT_IN_RUNTIME_INVENTORY`] };
    } else {
      base.reasoning_metadata = { reasoning_level: wanted, propagation: "propagated_from_inventory", reason_codes: ["REASONING_PROPAGATED"] };
    }
  }

  // Speed
  const wantedSpeed = typeof demand.speed === "string" && SUPPORTED_SPEED.has(demand.speed) ? demand.speed : null;
  if (!wantedSpeed) {
    base.speed_metadata.reason_codes = ["SPEED_PREFERENCE_UNSPECIFIED_OR_UNSUPPORTED"];
  } else if (!supSpeed.includes(wantedSpeed)) {
    base.speed_metadata = { speed_preference: null, propagation: "unsupported_by_inventory", reason_codes: [`SPEED_${wantedSpeed.toUpperCase()}_NOT_IN_RUNTIME_INVENTORY`] };
  } else {
    base.speed_metadata = { speed_preference: wantedSpeed, propagation: "propagated_from_inventory", reason_codes: ["SPEED_PROPAGATED"] };
  }

  return base;
}
