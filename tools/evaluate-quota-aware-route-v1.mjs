#!/usr/bin/env node
/**
 * V4 — OFFLINE quota-pool-aware route selection (campaign #39 phase 3).
 *
 * Deterministic, NON-LIVE evaluation layer composing:
 *   MODEL/ROLE -> ACCESS SURFACE -> QUOTA_POOL -> CURRENT QUOTA-POOL STATUS
 * from the canonical registry-v2 + quota-pool-status-v1 inputs.
 *
 * Laws (docs/contracts/quota-pool-status-v1.md + campaign #39 phase 3):
 * - one shared pool is evaluated ONCE even when referenced by many models/surfaces;
 * - missing/stale/unknown pool status -> CONSERVE_UNKNOWN (fail closed, never quota);
 * - below reserve floor -> unavailable for ordinary work (deferrable when policy permits);
 * - adequate unmetered local route preferred over scarce remote pools;
 * - urgent work is never deferred; deferral only when explicit policy permits;
 * - unknown economics are never treated as cheap (unverified allowance -> fail closed);
 * - OpenAI API/BYOK surfaces are structurally forbidden;
 * - no activation, no n8n wiring, no runtime authorization change.
 *
 * Library only (offline tests import evaluateQuotaAwareRoute directly).
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const RESULT_SCHEMA = "quota-aware-route-selection-v1";

function result(requestId, extra = {}) {
  return {
    schema_version: RESULT_SCHEMA,
    request_id: requestId ?? null,
    status: "NO_ROUTE",
    classification: null,
    selection: null,
    pool_evaluations: {},
    reason_codes: [],
    ...extra,
  };
}

function surfaceQualified(surface) {
  if (!surface || typeof surface !== "object") return false;
  if (surface.surface_type === "none" || surface.representational_only === true) return false;
  if (surface.status === "forbidden") return false;
  if (surface.auth && Array.isArray(surface.auth.allowed) && surface.auth.allowed.length === 0) return false;
  const q = surface.qualification;
  if (q && typeof q === "object" && q.runtime_qualified === false) return false;
  return true;
}

/**
 * Derive candidate (model, surface) pairs: each model's default surface plus every
 * surface sharing that model's default pool (registry-v2 shared_by_surfaces).
 */
export function deriveCandidates(registry) {
  const out = [];
  for (const [modelId, model] of Object.entries(registry?.models || {})) {
    const surfaceId = model.default_access_surface;
    const surface = registry.access_surfaces?.[surfaceId];
    if (!surface) continue;
    const poolId = surface.quota_pool_id;
    const surfaceIds = new Set([surfaceId]);
    if (poolId && registry.quota_pools?.[poolId]?.shared_by_surfaces) {
      for (const s of registry.quota_pools[poolId].shared_by_surfaces) surfaceIds.add(s);
    }
    for (const sid of [...surfaceIds].sort()) {
      const s = registry.access_surfaces?.[sid];
      if (!surfaceQualified(s)) continue;
      out.push({ model_id: modelId, model, surface_id: sid, surface: s, quota_pool_id: s.quota_pool_id ?? null });
    }
  }
  return out.sort(
    (a, b) =>
      a.model_id.localeCompare(b.model_id) || a.surface_id.localeCompare(b.surface_id),
  );
}

function bestObservedPercent(statusEntry) {
  // Deterministic: max remaining across fresh windows, normalized to percent.
  let best = null;
  for (const w of statusEntry?.windows || []) {
    if (w.freshness !== "fresh") continue;
    const { value, unit } = w.remaining || {};
    if (typeof value !== "number") continue;
    const pct = unit === "percent" ? value : unit === "normalized" ? value * 100 : null;
    if (pct === null) continue;
    best = best === null ? pct : Math.max(best, pct);
  }
  return best;
}

/**
 * Evaluate ONE pool once. Returns { evaluation, blocked, deferrable }.
 */
function evaluatePool(poolId, poolStatus, reservePolicy) {
  const entry = poolStatus?.quota_pools?.[poolId];
  if (!entry) return { evaluation: "CONSERVE_UNKNOWN_MISSING", blocked: true, deferrable: false };
  if (entry.freshness === "stale") return { evaluation: "CONSERVE_UNKNOWN_STALE", blocked: true, deferrable: false };
  if (entry.state === "unknown") return { evaluation: "CONSERVE_UNKNOWN_STATE", blocked: true, deferrable: false };
  if (entry.state === "exhausted") return { evaluation: "POOL_EXHAUSTED", blocked: true, deferrable: false };
  const remaining = bestObservedPercent(entry);
  if (remaining === null) return { evaluation: "CONSERVE_UNKNOWN_STATE", blocked: true, deferrable: false };
  const floor = reservePolicy?.[poolId];
  if (floor && typeof floor.floor === "number" && remaining <= floor.floor) {
    return { evaluation: "RESERVE_FLOOR_BLOCK", blocked: true, deferrable: true, remaining };
  }
  return { evaluation: "POOL_HEALTHY", blocked: false, deferrable: false, remaining };
}

/**
 * Deterministic offline selection.
 *
 * request: { request_id, required_capabilities[], risk_level, urgency: "urgent"|"normal",
 *            defer_allowed: boolean, quality_requirement?: "standard"|"high" }
 * options: { registry (v2), poolStatus (quota-pool-status-v1 doc | null),
 *            reservePolicy ({[pool_id]: {floor, unit, policy_ref}}),
 *            surfaceAvailability ({[surface_id]: boolean}),
 *            qualityMap ({[model_id]: "standard"|"high"}), nowMs }
 */
export function evaluateQuotaAwareRoute(request, options = {}) {
  const requestId = request?.request_id ?? null;
  const registry = options.registry;
  if (!registry || typeof registry !== "object" || !registry.models || !registry.access_surfaces) {
    return result(requestId, { reason_codes: ["INVALID_INPUT"] });
  }
  const required = Array.isArray(request?.required_capabilities) ? request.required_capabilities : [];
  const urgency = request?.urgency === "urgent" ? "urgent" : "normal";
  const deferAllowed = request?.defer_allowed === true;
  const qualityReq = request?.quality_requirement === "high" ? "high" : null;
  const qualityMap = options.qualityMap || {};
  const surfaceAvailability = options.surfaceAvailability || {};
  const reservePolicy = options.reservePolicy || {};

  let candidates = deriveCandidates(registry);

  // capability adequacy — inadequate candidates are dropped, never silently substituted
  const inadequate = candidates.filter(
    (c) => !required.every((cap) => (c.model.capabilities || []).includes(cap)),
  );
  if (required.length > 0 && inadequate.length === candidates.length) {
    return result(requestId, {
      reason_codes: ["NO_ADEQUATE_CAPABILITY", "SUBSTITUTION_FORBIDDEN"],
    });
  }
  candidates = candidates.filter((c) => !inadequate.includes(c));

  // quality requirement (input-provided verified metadata only; absent = unknown -> fails)
  if (qualityReq === "high") {
    candidates = candidates.filter((c) => qualityMap[c.model_id] === "high");
    if (candidates.length === 0) {
      return result(requestId, { reason_codes: ["NO_ADEQUATE_QUALITY", "SUBSTITUTION_FORBIDDEN"] });
    }
  }

  // evaluate each referenced pool ONCE
  const poolEvaluations = {};
  for (const c of candidates) {
    if (c.quota_pool_id && !poolEvaluations[c.quota_pool_id]) {
      const ev = evaluatePool(c.quota_pool_id, options.poolStatus, reservePolicy);
      poolEvaluations[c.quota_pool_id] = ev;
    }
  }

  const available = [];
  const blocked = [];
  for (const c of candidates) {
    if (c.quota_pool_id) {
      const ev = poolEvaluations[c.quota_pool_id];
      if (ev.blocked) {
        blocked.push({ ...c, block: ev.evaluation, deferrable: ev.deferrable });
      } else {
        available.push({ ...c, reason: "QUOTA_POOL_HEALTHY" });
      }
      continue;
    }
    // null pool: local unmetered vs unverified allowance
    if (c.surface.commercial_quota === "none_local_unmetered") {
      if (surfaceAvailability[c.surface_id] === true) {
        available.push({ ...c, reason: "LOCAL_UNMETERED_ADEQUATE" });
      } else {
        blocked.push({ ...c, block: "SURFACE_UNAVAILABLE", deferrable: false });
      }
      continue;
    }
    // pool null without unmetered semantics => allowance ownership unverified/unknown
    blocked.push({ ...c, block: "UNVERIFIED_ALLOWANCE_UNKNOWN", deferrable: false });
  }

  // preference 1: adequate unmetered local route preserves scarce pools
  const local = available.filter((c) => c.reason === "LOCAL_UNMETERED_ADEQUATE");
  if (local.length > 0) {
    const pick = local[0];
    return result(requestId, {
      status: "ROUTE_SELECTED",
      selection: {
        model: pick.model_id,
        access_surface: pick.surface_id,
        quota_pool_id: null,
        reason: pick.reason,
      },
      pool_evaluations: summarizePools(poolEvaluations),
      reason_codes: ["LOCAL_UNMETERED_PREFERRED", "SCARCE_POOL_PRESERVED"],
    });
  }

  // preference 2: healthy shared pool (cost equal among subscription pools; unknown
  // economics never ranked cheap — unverified-allowance candidates never got here)
  if (available.length > 0) {
    const pick = available[0];
    return result(requestId, {
      status: "ROUTE_SELECTED",
      selection: {
        model: pick.model_id,
        access_surface: pick.surface_id,
        quota_pool_id: pick.quota_pool_id,
        reason: pick.reason,
      },
      pool_evaluations: summarizePools(poolEvaluations),
      reason_codes: ["QUOTA_POOL_HEALTHY", "SHARED_POOL_EVALUATED_ONCE"],
    });
  }

  // deferral: only non-urgent + explicit policy + a reserve-block was the blocker
  const reserveBlocks = blocked.filter((b) => b.deferrable === true);
  if (urgency !== "urgent" && deferAllowed && reserveBlocks.length > 0) {
    return result(requestId, {
      status: "DEFERRED",
      classification: "DEFER_UNTIL_CHEAPER_WINDOW",
      pool_evaluations: summarizePools(poolEvaluations),
      reason_codes: ["DEFER_POLICY_PERMITTED", "RESERVE_FLOOR_BLOCK"],
    });
  }

  // fail closed; classify conserve-unknown when every pool reference was unknown-ish
  const conservePools = Object.values(poolEvaluations).filter((e) =>
    e.evaluation.startsWith("CONSERVE_UNKNOWN"),
  );
  const reasonCodes = [];
  if (urgency === "urgent" && reserveBlocks.length > 0) reasonCodes.push("URGENT_NO_DEFER");
  for (const b of blocked) reasonCodes.push(b.block);
  if (conservePools.length > 0 && reserveBlocks.length === 0) {
    return result(requestId, {
      status: "CONSERVE_UNKNOWN",
      pool_evaluations: summarizePools(poolEvaluations),
      reason_codes: [...new Set(reasonCodes)],
    });
  }
  return result(requestId, {
    status: "NO_ROUTE",
    pool_evaluations: summarizePools(poolEvaluations),
    reason_codes: [...new Set(reasonCodes)],
  });
}

function summarizePools(poolEvaluations) {
  const out = {};
  for (const [poolId, ev] of Object.entries(poolEvaluations)) {
    out[poolId] = {
      evaluation: ev.evaluation,
      remaining_percent: typeof ev.remaining === "number" ? ev.remaining : null,
    };
  }
  return out;
}
