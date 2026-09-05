#!/usr/bin/env node
/**
 * V4_RT25_CANONICAL_ENTRYPOINT_INTEGRATION — canonical quota-state producer.
 *
 * Single canonical producer of the runtime quota-pool state consumed INSIDE the
 * canonical planner boundary (tools/evaluate-planner-selection.mjs via
 * run-litellm-primary-cycle prepare) and the canonical execution-router
 * boundary (tools/evaluate-execution-route.mjs via the n8n bridge).
 *
 * Law (no synthetic side input invented for tests):
 *   - RESOURCE_REGISTRY  = real configs/resources/registry.json (v2: quota_pools)
 *   - baseline           = real fail-closed resource-status baseline
 *   - contributions      = REAL v4-resource-status-contribution-v1 envelopes
 *     produced by the RT25 runtime ingest (rt25-quota-ingest-codex-v1 /
 *     rt25-quota-ingest-glm-v1) read from the runtime ingest lane directory
 *     (one ingest decision JSON per file; invalid/failed decisions are
 *     skipped fail-closed, never fabricated);
 *   - composer           = REAL compose-v4-resource-status-control-plane-v1
 *   - join               = REAL rt25-quota-state-join-v1 (freshness/reserve/
 *                          economics, shared pools evaluated once)
 *
 * The module never invents quota values, never touches credentials/network,
 * and never opens D-0025: it only normalizes what real ingest produced.
 */

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  composeV4ResourceStatus,
  DEFAULT_REGISTRY_PATH,
  DEFAULT_BASELINE_PATH,
} from "./compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "./rt25-quota-state-join-v1.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CANONICAL_QUOTA_STATE_SCHEMA = "v4-rt25-canonical-quota-state-v1";

/** Runtime ingest lane (untracked; absent/empty lane => pools fail closed). */
export const DEFAULT_INGEST_DIR = resolve(ROOT, "configs/runtime/quota-ingest");

export const INGEST_DECISION_SCHEMA = "v4-rt25-quota-ingest-result-v1";
export const CONTRIBUTION_SCHEMA = "v4-resource-status-contribution-v1";

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

/**
 * Read REAL ingest decisions from the runtime ingest lane and collect their
 * contribution envelopes. Failures are skipped (fail-closed), never faked.
 */
export function collectIngestContributions(ingestDir) {
  const dir = resolve(ingestDir);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return { contributions: [], files: [], skipped: [] };
  }
  const files = readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .sort();
  const contributions = [];
  const skipped = [];
  for (const f of files) {
    const abs = resolve(dir, f);
    let decision;
    try {
      decision = loadJson(abs);
    } catch {
      skipped.push({ file: f, reason: "JSON_INVALID" });
      continue;
    }
    if (
      decision &&
      decision.schema_version === INGEST_DECISION_SCHEMA &&
      decision.ok === true &&
      decision.contribution &&
      decision.contribution.schema_version === CONTRIBUTION_SCHEMA
    ) {
      contributions.push(decision.contribution);
    } else {
      skipped.push({ file: f, reason: "NOT_A_VALID_INGEST_CONTRIBUTION" });
    }
  }
  return { contributions, files, skipped };
}

/**
 * Compose the canonical runtime quota-pool state.
 * options: { registry?, baseline?, contributions?, ingestDir?, reservePolicy?, economics?, nowMs? }
 * Returns { ok, schema_version, composed, joined, source_paths, reason_codes }.
 */
export async function composeCanonicalQuotaState(options = {}) {
  const base = {
    schema_version: CANONICAL_QUOTA_STATE_SCHEMA,
    ok: false,
    composed: null,
    joined: null,
    source_paths: null,
    reason_codes: [],
  };

  const registryPath = options.registryPath || DEFAULT_REGISTRY_PATH;
  const baselinePath = options.baselinePath || DEFAULT_BASELINE_PATH;
  const ingestDir = options.ingestDir || DEFAULT_INGEST_DIR;

  let registry;
  let baseline;
  try {
    registry = options.registry || loadJson(registryPath);
    baseline = options.baseline || loadJson(baselinePath);
  } catch {
    return { ...base, reason_codes: ["CANONICAL_SOURCE_UNREADABLE"] };
  }
  if (!registry || registry.schema_version !== "resource-registry-v2" || !registry.quota_pools) {
    return { ...base, reason_codes: ["CANONICAL_REGISTRY_MUST_BE_V2"] };
  }

  const lane = Array.isArray(options.contributions)
    ? { contributions: options.contributions, files: [], skipped: [] }
    : collectIngestContributions(ingestDir);

  const composed = await composeV4ResourceStatus(
    { registry, baseline, contributions: lane.contributions },
    { nowMs: options.nowMs },
  );
  if (!composed || composed.ok !== true) {
    return {
      ...base,
      composed: null,
      reason_codes: ["CANONICAL_COMPOSER_FAILED", ...(composed?.reason_codes || [])],
    };
  }

  const joined = joinQuotaPoolState(composed, registry, {
    nowMs: options.nowMs,
    ...(options.reservePolicy ? { reservePolicy: options.reservePolicy } : {}),
    ...(options.economics ? { economics: options.economics } : {}),
  });
  if (!joined || joined.ok !== true) {
    return {
      ...base,
      composed,
      joined: null,
      reason_codes: ["CANONICAL_JOIN_FAILED", ...(joined?.reason_codes || [])],
    };
  }

  return {
    ...base,
    ok: true,
    composed,
    joined,
    source_paths: {
      registry: registryPath,
      baseline: baselinePath,
      ingest_dir: resolve(ingestDir),
      ingest_files: lane.files,
      ingest_skipped: lane.skipped,
    },
    reason_codes: [
      "CANONICAL_QUOTA_STATE_COMPOSED",
      "REAL_COMPOSER_AND_JOIN_REUSED",
      ...(lane.contributions.length ? ["REAL_INGEST_CONTRIBUTIONS_CONSUMED"] : ["INGEST_LANE_EMPTY_POOLS_FAIL_CLOSED"]),
    ],
  };
}

/** Structural validity check shared by the canonical entrypoints. */
export function isValidQuotaState(joined) {
  return Boolean(
    joined &&
    typeof joined === "object" &&
    joined.schema_version === "v4-rt25-quota-state-join-v1" &&
    joined.ok === true,
  );
}

/**
 * V4_RT25 reviewer/retry bindings (REQUIRED WORK §6).
 *
 * Canonical reviewer/retry RUNTIME BOUNDARIES DO NOT EXIST YET: the runtime
 * has no reviewer/retry runner that selects routes (qwen-local-adapter roles
 * are prompt-level, not route-selection boundaries; the n8n bridge and the
 * primary remote cycle have no reviewer/retry stage). Per the correction law
 * we do NOT invent a fake production path. These bindings expose the canonical
 * quota state to those boundaries so that, when they are created by a governed
 * pass, they consume the SAME producer as the planner/execution entrypoints:
 *
 *   buildReviewerBoundaryState(implementerModel) → joined state for
 *     selectQuotaAwareReviewerRoute (rt25-reviewer-quota-aware-selector-v1)
 *   buildRetryBoundaryState() → joined state for
 *     selectQuotaAwareRetryRoute (rt25-retry-quota-aware-selector-v1)
 *
 * MISSING INTEGRATION DEPENDENCY (reported, not faked): a canonical
 * reviewer/retry invocation point in the runtime chain (see
 * reports/architecture/v4_rt25_canonical_entrypoint_integration_correction_v1.md).
 */
export async function buildReviewerBoundaryState(options = {}) {
  const canonical = await composeCanonicalQuotaState(options);
  return { canonical, implementer_model: options.implementer_model ?? null };
}

export async function buildRetryBoundaryState(options = {}) {
  const canonical = await composeCanonicalQuotaState(options);
  return { canonical, task_delta_id: options.task_delta_id ?? null };
}
