#!/usr/bin/env node
/**
 * V4_RT25_T11 — GLM 5.3 vs Flash runtime selection (shared pool, no double count).
 *
 * Campaign #41 task 11. Runtime law for choosing between glm-5.3 and
 * glm-5.3-flash on the SHARED glm_coding_plan pool:
 *   - both models must exist in registry-v2 models and be bound to
 *     glm_coding_plan_client (same surface, same pool);
 *   - pool admission evaluated ONCE (T06) — never per-model;
 *   - selection between the two by caller-supplied suitability/quality/speed
 *     metadata (inventory supplied at runtime; selector never invents ranks);
 *   - deterministic tie-break (lexical model id);
 *   - suitability gate: required_capabilities ⊆ model capabilities from the
 *     registry; unknown capability requirements fail closed.
 */

import { admitRouteWithReserve } from "./rt25-reserve-admission-v1.mjs";

export const GLM_SELECTION_SCHEMA = "v4-rt25-glm-model-selection-v1";
export const GLM_POOL_ID = "glm_coding_plan";
export const GLM_SURFACE_ID = "glm_coding_plan_client";

/**
 * @param {object} registry  registry-v2
 * @param {object} joined    rt25-quota-state-join-v1 output
 * @param {object} [demand]  { required_capabilities?: string[], prefer: "quality"|"speed" }
 */
export function selectGlmModel(registry, joined, demand = {}) {
  const base = {
    schema_version: GLM_SELECTION_SCHEMA,
    quota_pool_id: GLM_POOL_ID,
    selected_model: null,
    selection: null,
    pool_admission: null,
    rejected_models: [],
    reason_codes: [],
  };

  if (!registry || !registry.models || !registry.access_surfaces) {
    return { ...base, selection: "SELECTION_REGISTRY_INVALID", reason_codes: ["REGISTRY_INVALID"] };
  }
  if (!joined || joined.schema_version !== "v4-rt25-quota-state-join-v1" || joined.ok !== true) {
    return { ...base, selection: "SELECTION_JOIN_STATE_INVALID", reason_codes: ["JOIN_STATE_INVALID"] };
  }

  const surface = registry.access_surfaces[GLM_SURFACE_ID];
  if (!surface || surface.quota_pool_id !== GLM_POOL_ID) {
    return { ...base, selection: "SELECTION_SURFACE_POOL_MISCONFIGURED", reason_codes: ["SURFACE_POOL_MISMATCH"] };
  }

  // Pool admission ONCE for the whole shared pool (both models together).
  const admission = admitRouteWithReserve(joined, "glm");
  base.pool_admission = { admitted: admission.admitted, admission: admission.admission, provenance: admission.provenance };
  if (admission.admitted !== true) {
    return { ...base, selection: `SELECTION_BLOCKED_${admission.admission}`, reason_codes: [...(admission.reason_codes || [])] };
  }

  const required = Array.isArray(demand.required_capabilities) ? demand.required_capabilities : [];
  const prefer = demand.prefer === "speed" ? "speed" : demand.prefer === "quality" ? "quality" : null;

  const eligible = [];
  for (const modelId of ["glm-5.3", "glm-5.3-flash"]) {
    const m = registry.models[modelId];
    if (!m) {
      base.rejected_models.push({ model_id: modelId, reason_codes: ["MODEL_NOT_IN_REGISTRY"] });
      continue;
    }
    if (m.default_access_surface !== GLM_SURFACE_ID) {
      base.rejected_models.push({ model_id: modelId, reason_codes: ["MODEL_SURFACE_MISMATCH"] });
      continue;
    }
    const caps = Array.isArray(m.capabilities) ? m.capabilities : [];
    const missing = required.filter((r) => !caps.includes(r));
    if (missing.length > 0) {
      base.rejected_models.push({ model_id: modelId, reason_codes: missing.map((x) => `CAPABILITY_MISSING_${String(x).toUpperCase()}`) });
      continue;
    }
    // suitability metadata: caller-supplied inventory only; absence = rank 50
    const meta = m.runtime_suitability && typeof m.runtime_suitability === "object" ? m.runtime_suitability : {};
    const qualityRank = typeof meta.quality_rank === "number" ? meta.quality_rank : 50;
    const speedRank = typeof meta.speed_rank === "number" ? meta.speed_rank : 50;
    eligible.push({
      model_id: modelId,
      select_rank: prefer === "speed" ? speedRank : prefer === "quality" ? qualityRank : Math.min(qualityRank, speedRank),
    });
  }

  if (eligible.length === 0) {
    return { ...base, selection: "SELECTION_NO_MODEL_ELIGIBLE", reason_codes: ["NO_MODEL_ELIGIBLE", ...base.rejected_models.flatMap((r) => r.reason_codes)] };
  }

  eligible.sort((a, b) => (a.select_rank !== b.select_rank ? a.select_rank - b.select_rank : a.model_id.localeCompare(b.model_id)));
  const winner = eligible[0];
  return {
    ...base,
    selected_model: winner.model_id,
    selection: "GLM_MODEL_SELECTED_SHARED_POOL_SINGLE_ADMISSION",
    selected_select_rank: winner.select_rank,
    eligible_models: eligible,
    reason_codes: ["SHARED_POOL_ADMITTED_ONCE", "SUITABILITY_SELECTION", ...(prefer ? [`PREFER_${prefer.toUpperCase()}`] : [])],
  };
}
