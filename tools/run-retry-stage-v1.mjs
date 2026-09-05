#!/usr/bin/env node
/**
 * V4_CANONICAL_RETRY_REPAIR_RUNTIME_BOUNDARY_V1 — canonical retry/repair stage.
 *
 * THE canonical post-failure RETRY/REPAIR-SELECTION boundary. Every invocation
 * recomputes the CURRENT canonical quota/resource state — quota evidence from
 * the initial implementation attempt is NEVER reused.
 *
 * Canonical call path (REUSE, DO NOT REBUILD):
 *
 *   failed/STOP implementation result (local-dev-execution-result-v1)
 *     -> runRetryStage (THIS boundary)
 *     -> buildRetryBoundaryState (rt25-canonical-quota-state-v1: real
 *        registry-v2 + fail-closed baseline + REAL ingest-lane contributions
 *        read FRESH at every invocation -> real composer -> real join)
 *     -> buildRetryCandidates (registry-v2 reviewer/implementation-capable
 *        candidate derivation, identical law to the review-stage boundary:
 *        OpenAI API/BYOK structurally forbidden)
 *     -> selectQuotaAwareRetryRoute (REAL T19 selector: fresh internal join +
 *        scarce-pool protection + RETRY_BLOCKED on no-silent-reuse)
 *     -> guardQualityDowngrade (T13 no-silent-downgrade law on the retry
 *        decision envelope)
 *     -> guardUrgencyDeferral (T14 law, only when caller supplies urgency
 *        context; never invents deferral policy)
 *     -> bounded v4-retry-stage-result-v1 (machine readable, execution_performed=false)
 *
 * LAWS (inherited, none reinvented):
 *   - freshness/reserve/economics enforced by the canonical join + selector;
 *   - scarce pools (at/below reserve floor) are EXCLUDED from retry candidates
 *     by the T19 selector — retry never re-enters a scarce pool;
 *   - Codex only through qualified ChatGPT-subscription surfaces;
 *   - Qwen local only if adequate and CURRENTLY observed available (unobserved
 *     local lane rejected with explicit audit — never ADMIT_NO_POOL blind);
 *   - quota/availability NEVER invented: absent/stale ingest lane => fail closed;
 *   - NO retry inference/execution: this boundary wires SELECTION only; the
 *     retry execution path is a separately governed authorization.
 */

import { buildRetryBoundaryState } from "./rt25-canonical-quota-state-v1.mjs";
import { selectQuotaAwareRetryRoute, RETRY_DECISION_SCHEMA } from "./rt25-retry-quota-aware-selector-v1.mjs";
import { guardQualityDowngrade } from "./rt25-quality-downgrade-guard-v1.mjs";
import { guardUrgencyDeferral } from "./rt25-urgency-defer-guard-v1.mjs";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const RETRY_STAGE_RESULT_SCHEMA = "v4-retry-stage-result-v1";
export const IMPLEMENTATION_RESULT_SCHEMA = "local-dev-execution-result-v1";
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Runtime model-identity convention (identical law to run-review-stage-v1). */
export const RUNTIME_MODEL_IDS = Object.freeze({
  codex_subscription_models: "codex-ide",
  qwen_local: "qwen-local",
});
export const FORBIDDEN_SURFACES = Object.freeze(["openai_api_route"]);

/** Registry MODEL CLASS -> v1-projection RESOURCE binding (registry truth:
 * both GLM model classes execute through the single `glm` resource). */
export const MODEL_RESOURCE_BINDING = Object.freeze({
  codex_subscription_models: "codex",
  qwen_local: "qwen_local",
  "glm-5.3": "glm",
  "glm-5.3-flash": "glm",
  composer: "composer",
});

/**
 * Derive retry candidates FROM REGISTRY-V2 metadata only.
 * A model is a retry candidate iff it can execute the SAME KIND of work that
 * failed: roles include "reviewer" OR "implementation_model" (repair work is
 * implementation-class work; the review stage covers review-class work).
 * Identical structural law to the review-stage candidate builder: forbidden
 * surfaces excluded, deterministic registry-order ranks, no invented routes.
 */
export function buildRetryCandidates(registry, options = {}) {
  if (!registry || registry.schema_version !== "resource-registry-v2" || !registry.models || !registry.resources) {
    return { ok: false, candidates: [], reason_codes: ["REGISTRY_INVALID_FOR_RETRY_CANDIDATES"] };
  }
  const allowed = Array.isArray(options.retryCandidateModels) && options.retryCandidateModels.length > 0
    ? new Set(options.retryCandidateModels)
    : null;
  const candidates = [];
  let rank = 10;
  for (const [modelId, model] of Object.entries(registry.models)) {
    if (!model || Array.isArray(model.roles) === false) continue;
    if (!model.roles.includes("implementation_model") && !model.roles.includes("reviewer")) continue;
    if (allowed && !allowed.has(modelId)) continue;
    const surfaceId = model.default_access_surface;
    if (surfaceId && FORBIDDEN_SURFACES.includes(surfaceId)) continue; // OpenAI API/BYOK never emitted
    const rid = options.modelResourceBinding?.[modelId] ?? MODEL_RESOURCE_BINDING[modelId] ?? modelId;
    if (!registry.resources[rid]) continue;
    candidates.push({
      route_id: `retry-${modelId}`,
      resource_id: rid,
      model: RUNTIME_MODEL_IDS[modelId] || modelId,
      access_surface: surfaceId,
      forbidden: false,
      select_rank: rank,
    });
    rank += 10;
  }
  return {
    ok: candidates.length > 0,
    candidates,
    reason_codes: candidates.length ? ["RETRY_CANDIDATES_FROM_REGISTRY"] : ["NO_RETRY_CANDIDATES_IN_REGISTRY"],
  };
}

/**
 * Validate the retry input. FAIL CLOSED on malformed input or a non-failed
 * implementation result (a retry is only meaningful after a STOP/failure
 * classification; a PASS result must never trigger a repair selection).
 */
export function validateRetryStageInput(implementationResult, options = {}) {
  if (!implementationResult || typeof implementationResult !== "object" || Array.isArray(implementationResult)) {
    return { ok: false, reason_codes: ["IMPLEMENTATION_RESULT_INVALID"] };
  }
  if (implementationResult.schema_version && implementationResult.schema_version !== IMPLEMENTATION_RESULT_SCHEMA) {
    return { ok: false, reason_codes: ["IMPLEMENTATION_RESULT_SCHEMA_UNKNOWN", String(implementationResult.schema_version).slice(0, 60)] };
  }
  const status = implementationResult.status;
  if (status !== undefined && typeof status !== "string") {
    return { ok: false, reason_codes: ["IMPLEMENTATION_RESULT_STATUS_INVALID"] };
  }
  if (!options.forceRetryEligible && status === "PASS") {
    return { ok: false, reason_codes: ["RETRY_NOT_REQUIRED_ON_PASS"] };
  }
  const attempt = options.attempt;
  if (attempt !== undefined && (typeof attempt !== "number" || !Number.isFinite(attempt) || attempt < 1)) {
    return { ok: false, reason_codes: ["RETRY_ATTEMPT_INDEX_INVALID"] };
  }
  return { ok: true, reason_codes: [] };
}

function baseResult(partial) {
  return {
    schema_version: RETRY_STAGE_RESULT_SCHEMA,
    retry_required: partial.retry_required === true,
    retry_selection_status: partial.retry_selection_status ?? "SELECTION_FAILED",
    retry_attempt_index: partial.retry_attempt_index ?? null,
    selected_retry_route: partial.selected_retry_route ?? null,
    reason_codes: partial.reason_codes || [],
    quota_provenance: partial.quota_provenance ?? null,
    previous_route_reference: partial.previous_route_reference ?? null,
    previous_model_reference: partial.previous_model_reference ?? null,
    execution_performed: false, // LAWFUL CONSTANT: no authorized retry execution path exists
    decision: partial.decision ?? null,
    quality_guard: partial.quality_guard ?? null,
    urgency_guard: partial.urgency_guard ?? null,
    decided_at: partial.decided_at ?? null,
  };
}

function quotaProvenanceOf(canonical) {
  return {
    schema_version: canonical.joined?.schema_version ?? null,
    joined_at: canonical.joined?.joined_at ?? null,
    pools: canonical.joined?.pools ?? null,
    source_paths: canonical.source_paths ?? null,
    composition_reason_codes: canonical.reason_codes ?? [],
  };
}

/**
 * Run the canonical retry stage.
 *
 * @param {object} implementationResult  local-dev-execution-result-v1 (STOP/failure)
 * @param {object} [options] {
 *   attempt?: number (1-based retry attempt index),
 *   previousRouteId?: string, previousPoolId?: string, previousModel?: string,
 *   retryCandidateModels?: string[], modelResourceBinding?: object,
 *   urgency?: { urgent?: boolean }, deferPolicy?: { allowed, policy_ref },
 *   demand?: { risk?, min_quality_tier?, required_capabilities? },
 *   forceRetryEligible?: boolean (test/CLI escape for PASS results),
 *   registry?, registryPath?,
 *   quotaStateOptions?: forwarded to buildRetryBoundaryState (contributions,
 *     ingestDir, reservePolicy, economics, nowMs, baseline, registry),
 *   buildState?: injectable boundary-state builder (tests),
 * }
 */
export async function runRetryStage(implementationResult, options = {}) {
  const decidedAt = new Date(
    typeof options.quotaStateOptions?.nowMs === "number" && Number.isFinite(options.quotaStateOptions.nowMs)
      ? options.quotaStateOptions.nowMs
      : Date.now(),
  ).toISOString();
  const attempt = options.attempt ?? null;

  const input = validateRetryStageInput(implementationResult, options);
  if (!input.ok) {
    return baseResult({
      retry_required: false,
      retry_selection_status: "INPUT_INVALID",
      retry_attempt_index: attempt,
      reason_codes: ["RETRY_STAGE_INPUT_INVALID", ...input.reason_codes],
      previous_route_reference: options.previousRouteId ?? null,
      previous_model_reference: options.previousModel ?? null,
      decided_at: decidedAt,
    });
  }

  const previousModel =
    (typeof options.previousModel === "string" && options.previousModel) ||
    (typeof implementationResult?.profile_id === "string" && implementationResult.profile_id) ||
    null;

  // 1. FRESH canonical quota state AT RETRY TIME — recomputed EVERY invocation,
  //    never the state captured at initial implementation time.
  let registry;
  try {
    registry = options.registry
      || (options.registryPath ? JSON.parse(readFileSync(resolve(ROOT, options.registryPath), "utf8").replace(/^\uFEFF/, "")) : null)
      || JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return baseResult({
      retry_required: true,
      retry_selection_status: "REGISTRY_UNREADABLE",
      retry_attempt_index: attempt,
      reason_codes: ["REGISTRY_UNREADABLE"],
      previous_route_reference: options.previousRouteId ?? null,
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }
  const buildState = options.buildState || buildRetryBoundaryState;
  let canonical;
  try {
    const boundary = await buildState({ task_delta_id: implementationResult?.task_ref ?? null, ...(options.quotaStateOptions || {}) });
    canonical = boundary?.canonical;
  } catch {
    canonical = null;
  }
  if (!canonical || canonical.ok !== true || !canonical.composed) {
    return baseResult({
      retry_required: true,
      retry_selection_status: "QUOTA_STATE_COMPOSITION_FAILED",
      retry_attempt_index: attempt,
      reason_codes: ["QUOTA_STATE_COMPOSITION_FAILED", ...((canonical && canonical.reason_codes) || [])],
      previous_route_reference: options.previousRouteId ?? null,
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }

  // 2. Retry candidates from REGISTRY metadata only.
  const cand = buildRetryCandidates(registry, { retryCandidateModels: options.retryCandidateModels, modelResourceBinding: options.modelResourceBinding });
  if (!cand.ok) {
    return baseResult({
      retry_required: true,
      retry_selection_status: "NO_CANDIDATES",
      retry_attempt_index: attempt,
      reason_codes: ["RETRY_CANDIDATES_DERIVATION_FAILED", ...cand.reason_codes],
      quota_provenance: quotaProvenanceOf(canonical),
      previous_route_reference: options.previousRouteId ?? null,
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }

  // 3. REAL retry selector (T19: fresh internal join + scarce-pool protection).
  //    The T19 selector joins internally WITHOUT a caller reservePolicy; when
  //    the caller supplies one we pre-join for AUDIT purposes only (provenance)
  //    and let the selector's own fresh join remain the decision authority.
  let decision;
  try {
    decision = await selectQuotaAwareRetryRoute(canonical.composed, registry, cand.candidates, {
      attempt,
      previous_route_id: options.previousRouteId ?? null,
      previous_pool_id: options.previousPoolId ?? null,
      ...(options.quotaStateOptions?.nowMs !== undefined ? { nowMs: options.quotaStateOptions.nowMs } : {}),
    });
  } catch (err) {
    return baseResult({
      retry_required: true,
      retry_selection_status: "SELECTOR_INVOCATION_FAILED",
      retry_attempt_index: attempt,
      reason_codes: ["SELECTOR_INVOCATION_FAILED", String(err?.message || err).slice(0, 80)],
      quota_provenance: quotaProvenanceOf(canonical),
      previous_route_reference: options.previousRouteId ?? null,
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }
  if (!decision || decision.schema_version !== RETRY_DECISION_SCHEMA) {
    return baseResult({
      retry_required: true,
      retry_selection_status: "SELECTOR_ENVELOPE_INVALID",
      retry_attempt_index: attempt,
      reason_codes: ["SELECTOR_ENVELOPE_INVALID"],
      quota_provenance: quotaProvenanceOf(canonical),
      previous_route_reference: options.previousRouteId ?? null,
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }

  // 4. No-silent-downgrade guard on the retry decision envelope (T13). The
  // T13 guard consumes planner/execution envelopes whose success status is
  // "ROUTE_SELECTED"; the T19 retry envelope uses "RETRY_ROUTE_SELECTED" for
  // the same semantic. Status is NORMALIZED for the guard call only — the
  // stored audit decision keeps the original T19 envelope verbatim.
  const demand = options.demand && typeof options.demand === "object" ? options.demand : {};
  const qualityGuard = guardQualityDowngrade(
    decision.status === "RETRY_ROUTE_SELECTED" ? { ...decision, status: "ROUTE_SELECTED" } : decision,
    {
      risk: demand.risk === "high" ? "high" : "normal",
      ...(demand.min_quality_tier !== undefined ? { min_quality_tier: demand.min_quality_tier } : {}),
      ...(Array.isArray(demand.required_capabilities) ? { required_capabilities: demand.required_capabilities } : {}),
    },
  );

  // 5. Urgency/defer law (T14) ONLY when the caller supplies urgency context.
  let urgencyGuard = null;
  if (options.urgency && typeof options.urgency === "object") {
    urgencyGuard = guardUrgencyDeferral(decision, options.urgency, {
      ...(options.quotaStateOptions?.nowMs !== undefined ? { nowMs: options.quotaStateOptions.nowMs } : {}),
      ...(options.deferPolicy ? { defer_policy: options.deferPolicy } : {}),
    });
  }

  const selected = decision.status === "RETRY_ROUTE_SELECTED" && qualityGuard.veto !== true
    ? {
        route_id: decision.selected.route_id,
        resource_id: decision.selected.resource_id,
        model: decision.selected.model,
        access_surface: decision.selected.access_surface,
        quota_pool_id: decision.selected.quota_pool_id ?? null,
        admission: decision.selected.admission,
        select_rank: decision.selected.select_rank,
      }
    : null;

  // T19 selector uses status RETRY_ROUTE_SELECTED / RETRY_BLOCKED.
  const status = qualityGuard.veto === true
    ? "VETOED_QUALITY_DOWNGRADE"
    : decision.status === "RETRY_ROUTE_SELECTED"
      ? "RETRY_ROUTE_SELECTED"
      : "RETRY_BLOCKED";

  const reasonCodes = [
    ...decision.reason_codes,
    ...(qualityGuard.veto === true ? qualityGuard.reason_codes : []),
    ...(urgencyGuard ? urgencyGuard.reason_codes : []),
  ];
  // Local-lane observation law: an admitted no-pool (local unmetered) retry
  // route must be CURRENTLY observed available in the fresh state — identical
  // to the review-stage boundary law. Unobserved => veto the selection.
  if (selected && selected.quota_pool_id === null) {
    const res = canonical.joined?.resources?.[selected.resource_id];
    if (!res || res.resource_available !== true) {
      return baseResult({
        retry_required: true,
        retry_selection_status: "RETRY_BLOCKED",
        retry_attempt_index: attempt,
        selected_retry_route: null,
        reason_codes: [...reasonCodes, `RETRY_LOCAL_RESOURCE_UNOBSERVED_UNAVAILABLE:${selected.route_id}`],
        quota_provenance: quotaProvenanceOf(canonical),
        previous_route_reference: options.previousRouteId ?? null,
        previous_model_reference: previousModel,
        decided_at: decidedAt,
        decision,
        quality_guard: qualityGuard,
        urgency_guard: urgencyGuard,
      });
    }
  }

  return baseResult({
    retry_required: true,
    retry_selection_status: status,
    retry_attempt_index: attempt,
    selected_retry_route: selected,
    reason_codes: reasonCodes,
    quota_provenance: quotaProvenanceOf(canonical),
    previous_route_reference: options.previousRouteId ?? null,
    previous_model_reference: previousModel,
    decided_at: decidedAt,
    decision,
    quality_guard: qualityGuard,
    urgency_guard: urgencyGuard,
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/run-retry-stage-v1.mjs");

if (isMain) {
  // Canonical CLI: node tools/run-retry-stage-v1.mjs --input-file <result.json> [--attempt N]
  //                [--previous-route-id id] [--previous-pool-id id] [--previous-model id]
  //                [--output-file path]
  const args = process.argv.slice(2);
  const inputFile = args[args.indexOf("--input-file") + 1];
  const num = (flag) => (args.includes(flag) ? Number(args[args.indexOf(flag) + 1]) : undefined);
  const str = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const outFile = str("--output-file");
  const run = async () => {
    if (!inputFile) {
      process.stderr.write("Usage: node tools/run-retry-stage-v1.mjs --input-file <implementation-result.json> [--attempt N] [--previous-route-id id] [--previous-pool-id id] [--previous-model id] [--output-file <path>]\n");
      process.exit(2);
    }
    const implementationResult = JSON.parse(readFileSync(resolve(process.cwd(), inputFile), "utf8").replace(/^\uFEFF/, ""));
    const review = await runRetryStage(implementationResult, {
      ...(num("--attempt") !== undefined ? { attempt: num("--attempt") } : {}),
      ...(str("--previous-route-id") ? { previousRouteId: str("--previous-route-id") } : {}),
      ...(str("--previous-pool-id") ? { previousPoolId: str("--previous-pool-id") } : {}),
      ...(str("--previous-model") ? { previousModel: str("--previous-model") } : {}),
    });
    const payload = JSON.stringify(review, null, 2);
    if (outFile) {
      const { writeFileSync, mkdirSync } = await import("node:fs");
      const { dirname: dn } = await import("node:path");
      const abs = resolve(process.cwd(), outFile);
      mkdirSync(dn(abs), { recursive: true });
      writeFileSync(abs, payload, "utf8");
    }
    process.stdout.write(`${payload}\n`);
    process.exit(review.retry_selection_status === "RETRY_ROUTE_SELECTED" ? 0 : 1);
  };
  run().catch((err) => {
    process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
