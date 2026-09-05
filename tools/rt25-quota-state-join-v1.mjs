#!/usr/bin/env node
/**
 * V4_RT25_T04 — runtime quota-state JOIN (real runtime path).
 *
 * Campaign #41 task 04. Joins quota-pool state onto the REAL composer output
 * (compose-v4-resource-status-control-plane-v1.mjs result) so downstream runtime
 * selectors (planner/execution/reviewer/retry) see one deterministic
 * MODEL/ROLE -> ACCESS SURFACE -> QUOTA_POOL -> CURRENT QUOTA-POOL STATUS view.
 *
 * - pool identity validated against registry-v2 `quota_pools`;
 * - v1-projection resource -> pool binding is EXPLICIT (no invention);
 * - freshness reuses the composer's own STATUS_MAX_AGE_MS law;
 * - one shared pool is evaluated ONCE even when several resources/surfaces
 *   reference it;
 * - resources with no pool binding (local unmetered / unverified) join as
 *   pool:null with explicit no-pool semantics — never fake quota.
 *
 * Library module (imported by runtime guards/selectors and the T24 E2E proof).
 */
import { STATUS_MAX_AGE_MS } from "./compose-v4-resource-status-control-plane-v1.mjs";
import { POOL_IDS } from "./translate-quota-pool-snapshot-v1.mjs";

export const JOIN_SCHEMA = "v4-rt25-quota-state-join-v1";

/**
 * Explicit binding: v1 projection resource id -> registry-v2 quota pool id.
 * null = no commercial pool (local unmetered / harness / unverified allowance).
 * Only pools that exist in registry-v2 quota_pools are accepted at join time.
 */
export const RESOURCE_POOL_BINDINGS = Object.freeze({
  codex: POOL_IDS.codex,
  glm: POOL_IDS.glm,
  cursor: null,
  composer: null,
  qwen_local: null,
  opencode: null,
  grok_bot: null,
});

/** Explicit no-pool semantics (static registry-v2 knowledge, not runtime inference). */
export const RESOURCE_NO_POOL_SEMANTICS = Object.freeze({
  qwen_local: "local_unmetered",
  opencode: "local_unmetered",
  cursor: "no_pool_binding",
  composer: "no_pool_binding",
  grok_bot: "no_pool_binding",
});

function ageOk(updatedAt, nowMs) {
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t)) return false;
  if (t > nowMs) return false;
  return nowMs - t <= STATUS_MAX_AGE_MS;
}

/**
 * Derive one pool observation state from a composer resource status entry.
 * Pure deterministic classification — never invents availability.
 */
function classifyResourceQuota(resourceStatus, nowMs) {
  if (!resourceStatus || typeof resourceStatus !== "object") {
    return { state: "unknown", freshness: "stale", remaining_percent: null };
  }
  const fresh = resourceStatus.available !== undefined && ageOk(resourceStatus.updated_at, nowMs);
  const unit = resourceStatus.quota_remaining?.unit;
  const value = resourceStatus.quota_remaining?.value;
  const observedQuota = typeof value === "number" && (unit === "percent" || unit === "credits" || unit === "calls" || unit === "tokens");
  let state = "unknown";
  if (observedQuota) {
    if (value > 0) state = "available";
    else state = "exhausted";
  } else if (unit === "unlimited") {
    state = "available";
  }
  return {
    state: fresh ? state : "unknown",
    freshness: fresh ? "fresh" : "stale",
    remaining_percent: unit === "percent" && typeof value === "number" ? value : null,
    observed: fresh,
  };
}

/**
 * Join composer result + registry into the runtime quota-state view.
 * options: { nowMs, reservePolicy?: {pool_id:{floor_percent, policy_ref}}, economics?: {pool_id:{verified,payload}} }
 */
export function joinQuotaPoolState(composerResult, registry, options = {}) {
  const nowMs =
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const base = {
    schema_version: JOIN_SCHEMA,
    joined_at: new Date(nowMs).toISOString(),
    ok: false,
    classification: null,
    pools: {},
    resources: {},
    reason_codes: [],
  };
  if (!composerResult || composerResult.schema_version !== "v4-resource-status-control-plane-source-result-v1" || composerResult.ok !== true || !composerResult.resource_status) {
    return { ...base, classification: "JOIN_REJECTED_COMPOSER_RESULT_INVALID", reason_codes: ["COMPOSER_RESULT_INVALID"] };
  }
  if (!registry || !registry.quota_pools || !registry.resources) {
    return { ...base, classification: "JOIN_REJECTED_REGISTRY_INVALID", reason_codes: ["REGISTRY_INVALID"] };
  }

  const status = composerResult.resource_status;
  const reservePolicy = options.reservePolicy || {};

  // one evaluation per pool
  const pools = {};
  const resources = {};
  for (const [resourceId, poolId] of Object.entries(RESOURCE_POOL_BINDINGS)) {
    const rStatus = status.resources[resourceId];
    if (!rStatus) continue; // resource not present in this composer output — skip silently (composer law)
    if (poolId === null) {
      resources[resourceId] = {
        quota_pool_id: null,
        pool_semantics: RESOURCE_NO_POOL_SEMANTICS[resourceId] || "no_pool_binding",
        resource_available: rStatus.available === true,
      };
      continue;
    }
    if (!registry.quota_pools[poolId]) {
      // binding points at a pool the registry does not define — fail closed per pool
      resources[resourceId] = { quota_pool_id: poolId, pool_semantics: "QUOTA_POOL_UNKNOWN" };
      if (!pools[poolId]) {
        pools[poolId] = { state: "unknown", freshness: "stale", remaining_percent: null, evaluation: "QUOTA_POOL_UNKNOWN", reserve_floor_percent: null };
      }
      continue;
    }
    const cls = classifyResourceQuota(rStatus, nowMs);
    const decision = composerResult.resource_decisions?.[resourceId];
    // A stale contribution is REJECTED by the composer and never selected: the
    // winning entry falls back to the seeded baseline (source unknown, decision
    // FAIL_CLOSED_NO_VALID_OBSERVATION). Rejected CONTRIBUTION_STALE rejections
    // tell us evidence EXISTED but expired → CONSERVE_UNKNOWN_STALE; with no such
    // rejection the pool simply has no observation → CONSERVE_UNKNOWN_MISSING.
    const neverObserved =
      (decision?.classification === "FAIL_CLOSED_NO_VALID_OBSERVATION" || rStatus.source === "unknown") &&
      !(composerResult.rejected_contributions || []).some((r) => r.classification === "CONTRIBUTION_STALE");
    resources[resourceId] = {
      quota_pool_id: poolId,
      pool_semantics: "shared_pool_joined",
      resource_available: rStatus.available === true,
    };
    if (!pools[poolId]) {
      const floor = reservePolicy[poolId];
      const belowReserve =
        typeof floor?.floor_percent === "number" &&
        cls.remaining_percent !== null &&
        cls.remaining_percent <= floor.floor_percent;
      pools[poolId] = {
        state: cls.state,
        freshness: cls.freshness,
        remaining_percent: cls.remaining_percent,
        reset_at: rStatus.reset_at ?? null,
        evaluation: neverObserved
          ? "CONSERVE_UNKNOWN_MISSING"
          : !cls.observed
            ? "CONSERVE_UNKNOWN_STALE"
            : belowReserve
              ? "RESERVE_FLOOR_BLOCK"
              : cls.state === "exhausted"
                ? "POOL_EXHAUSTED"
                : cls.state === "unknown"
                  ? "CONSERVE_UNKNOWN_STATE"
                  : "POOL_HEALTHY",
        reserve_floor_percent: typeof floor?.floor_percent === "number" ? floor.floor_percent : null,
        reserve_policy_ref: floor?.policy_ref ?? null,
      };
    }
  }

  // economics metadata propagation (T07 law): only verified payloads ride along
  const economics = {};
  for (const [poolId, econ] of Object.entries(options.economics || {})) {
    if (!registry.quota_pools[poolId]) continue;
    economics[poolId] =
      econ && econ.verified === true && econ.payload && typeof econ.payload === "object"
        ? { verified: true, payload: econ.payload }
        : { verified: false, payload: null };
  }

  return {
    ...base,
    ok: true,
    classification: "PASS_QUOTA_STATE_JOINED",
    pools,
    resources,
    economics,
    reason_codes: ["JOINED_FROM_REAL_COMPOSER_OUTPUT", "SHARED_POOLS_EVALUATED_ONCE"],
  };
}
