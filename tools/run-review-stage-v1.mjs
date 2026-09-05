#!/usr/bin/env node
/**
 * V4_CANONICAL_REVIEW_STAGE_ARCHITECTURE_AND_BOUNDARY_V1 — canonical review stage.
 *
 * THE canonical post-implementation REVIEW-STAGE boundary. Closes the proven
 * STOP dependency of V4_CANONICAL_REVIEWER_RUNTIME_BOUNDARY_V1: a governed
 * runtime stage that legitimately invokes the existing quota-aware reviewer
 * selector (tools/rt25-reviewer-quota-aware-selector-v1.mjs).
 *
 * Canonical call path (REUSE, DO NOT REBUILD):
 *
 *   implementation result (local-dev-execution-result-v1, or minimal subset)
 *     -> runReviewStage (THIS boundary)
 *     -> buildReviewerBoundaryState (rt25-canonical-quota-state-v1: real
 *        registry-v2 + fail-closed baseline + real ingest-lane contributions
 *        -> real composer -> real join, recomputed AT REVIEW TIME)
 *     -> buildReviewerCandidates (registry-v2 reviewer-role metadata ONLY;
 *        OpenAI API/BYOK surfaces are structurally forbidden)
 *     -> selectQuotaAwareReviewerRoute (REAL selector, T18 law incl.
 *        implementer-independence preference)
 *     -> guardQualityDowngrade (T13 no-silent-downgrade law on the reviewer
 *        decision envelope)
 *     -> bounded v4-review-stage-result-v1 (machine readable, execution_performed=false)
 *
 * LAWS (inherited, none reinvented):
 *   - freshness/reserve/economics enforced by the canonical join (T04/T05/T06/T07);
 *   - quota is NEVER invented: absent/stale ingest lane => pools fail closed;
 *   - Codex reviewer only through qualified ChatGPT-subscription surfaces
 *     (openai_api_route is forbidden in the registry and never emitted);
 *   - Qwen local reviewer participates through the same join (unmetered local
 *     lane; composer gates availability behind the strict Qwen probe);
 *   - implementer model is known when the caller provides it; independence is
 *     PREFERRED, never fabricated (selector law);
 *   - NO reviewer model inference/execution happens here: this boundary wires
 *     selection only; review EXECUTION requires a separately authorized
 *     reviewer execution surface which does not exist yet.
 */

import { buildReviewerBoundaryState } from "./rt25-canonical-quota-state-v1.mjs";
import { selectQuotaAwareReviewerRoute, REVIEWER_DECISION_SCHEMA } from "./rt25-reviewer-quota-aware-selector-v1.mjs";
import { guardQualityDowngrade } from "./rt25-quality-downgrade-guard-v1.mjs";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const REVIEW_STAGE_RESULT_SCHEMA = "v4-review-stage-result-v1";
export const IMPLEMENTATION_RESULT_SCHEMA = "local-dev-execution-result-v1";
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Runtime model-identity convention for registry-derived reviewer candidates.
 * The registry stores role-capable MODEL CLASSES (dynamic selection, frozen_list
 * false); the runtime guards and selectors use concrete runtime ids — this is
 * the exact convention of ROUTE_QUALITY_INVENTORY (rt25-quality-downgrade-guard)
 * and QWEN_INVENTORY (rt25-qwen-adequacy-fallback): "codex-ide" (the qualified
 * ChatGPT-subscription Codex surface) and "qwen-local". Reused, not invented.
 */
export const RUNTIME_MODEL_IDS = Object.freeze({
  codex_subscription_models: "codex-ide",
  qwen_local: "qwen-local",
});

/**
 * Derive reviewer candidates FROM REGISTRY-V2 metadata only.
 * A model is a reviewer candidate iff:
 *   - models[id].roles includes "reviewer";
 *   - its default access surface is NOT a forbidden surface (openai_api_route);
 *   - the mapped resource exists in the registry v1-projection (`resources`).
 * select_rank: deterministic registry order (insertion order), never invented.
 * The caller may restrict (options.reviewCandidateModels) but never widen.
 */
export const FORBIDDEN_SURFACES = Object.freeze(["openai_api_route"]);

export function buildReviewerCandidates(registry, options = {}) {
  if (!registry || registry.schema_version !== "resource-registry-v2" || !registry.models || !registry.resources) {
    return { ok: false, candidates: [], reason_codes: ["REGISTRY_INVALID_FOR_REVIEW_CANDIDATES"] };
  }
  const allowed = Array.isArray(options.reviewCandidateModels) && options.reviewCandidateModels.length > 0
    ? new Set(options.reviewCandidateModels)
    : null;
  const surfaceFor = (surfaceId) => registry.access_surfaces?.[surfaceId] || null;
  const candidates = [];
  let rank = 10;
  for (const [modelId, model] of Object.entries(registry.models)) {
    if (!model || Array.isArray(model.roles) === false || !model.roles.includes("reviewer")) continue;
    if (allowed && !allowed.has(modelId)) continue;
    const surfaceId = model.default_access_surface;
    const surface = surfaceFor(surfaceId);
    if (surface && FORBIDDEN_SURFACES.includes(surfaceId)) continue; // structurally forbidden (OpenAI API/BYOK)
    // Resolve the v1-projection resource that carries this model for the join.
    const rid = options.modelResourceBinding?.[modelId]
      ?? (modelId === "codex_subscription_models" ? "codex"
        : modelId === "qwen_local" ? "qwen_local"
          : modelId);
    if (!registry.resources[rid]) continue;
    candidates.push({
      route_id: `review-${modelId}`,
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
    reason_codes: candidates.length ? ["REVIEWER_CANDIDATES_FROM_REGISTRY"] : ["NO_REVIEWER_CANDIDATES_IN_REGISTRY"],
  };
}

/**
 * Validate the implementation-result input. Fail closed on malformed input.
 * Accepts the full local-dev-execution-result-v1 envelope (status/classification/
 * profile_id) or a minimal { task_ref?, implementer_model? } subset; the caller
 * is responsible for semantic honesty — this boundary only wires selection.
 */
export function validateReviewStageInput(implementationResult) {
  if (!implementationResult || typeof implementationResult !== "object" || Array.isArray(implementationResult)) {
    return { ok: false, reason_codes: ["IMPLEMENTATION_RESULT_INVALID"] };
  }
  if (implementationResult.schema_version && implementationResult.schema_version !== IMPLEMENTATION_RESULT_SCHEMA) {
    return { ok: false, reason_codes: ["IMPLEMENTATION_RESULT_SCHEMA_UNKNOWN", String(implementationResult.schema_version).slice(0, 60)] };
  }
  const statusKnown = !implementationResult.status || typeof implementationResult.status === "string";
  if (!statusKnown) return { ok: false, reason_codes: ["IMPLEMENTATION_RESULT_STATUS_INVALID"] };
  return { ok: true, reason_codes: [] };
}

function baseResult(partial) {
  return {
    schema_version: REVIEW_STAGE_RESULT_SCHEMA,
    review_required: partial.review_required === true,
    reviewer_selection_status: partial.reviewer_selection_status ?? "SELECTION_FAILED",
    selected_reviewer: partial.selected_reviewer ?? null,
    reason_codes: partial.reason_codes || [],
    quota_provenance: partial.quota_provenance ?? null,
    implementer_model: partial.implementer_model ?? null,
    implementer_reference: partial.implementer_reference ?? null,
    execution_performed: false, // LAWFUL CONSTANT: no authorized reviewer execution surface exists
    decision: partial.decision ?? null,
    quality_guard: partial.quality_guard ?? null,
    reviewed_at: partial.reviewed_at ?? null,
  };
}

/**
 * Run the canonical review stage.
 *
 * @param {object} implementationResult  local-dev-execution-result-v1 (or minimal subset)
 * @param {object} [options] {
 *   registry?, registryPath?, implementerModel?, reviewCandidateModels?,
 *   demand?: { risk?, min_quality_tier?, required_capabilities? },
 *   quotaStateOptions?: forwarded to buildReviewerBoundaryState (contributions,
 *     ingestDir, reservePolicy, economics, nowMs, baseline, registry),
 *   buildState?: injectable boundary-state builder (tests),
 * }
 */
export async function runReviewStage(implementationResult, options = {}) {
  const input = validateReviewStageInput(implementationResult);
  const reviewedAt = new Date(
    typeof options.quotaStateOptions?.nowMs === "number" && Number.isFinite(options.quotaStateOptions.nowMs)
      ? options.quotaStateOptions.nowMs
      : Date.now(),
  ).toISOString();

  const implementerModel =
    (typeof options.implementerModel === "string" && options.implementerModel) ||
    (typeof implementationResult?.implementer_model === "string" && implementationResult.implementer_model) ||
    (typeof implementationResult?.profile_id === "string" && implementationResult.profile_id) ||
    null;

  if (!input.ok) {
    return baseResult({
      review_required: false,
      reviewer_selection_status: "INPUT_INVALID",
      reason_codes: ["REVIEW_STAGE_INPUT_INVALID", ...input.reason_codes],
      implementer_model: implementerModel,
      implementer_reference: implementationResult?.task_ref ?? null,
      reviewed_at: reviewedAt,
    });
  }

  // 1. Fresh canonical quota state AT REVIEW TIME (real producer, recomputed).
  const registry = options.registry
    || (options.registryPath ? JSON.parse(readFileSync(resolve(ROOT, options.registryPath), "utf8").replace(/^\uFEFF/, "")) : null)
    || JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8").replace(/^\uFEFF/, ""));
  const buildState = options.buildState || buildReviewerBoundaryState;
  let boundary;
  try {
    boundary = await buildState({
      implementer_model: implementerModel,
      ...(options.quotaStateOptions || {}),
    });
  } catch {
    return baseResult({
      review_required: true,
      reviewer_selection_status: "QUOTA_STATE_COMPOSITION_FAILED",
      reason_codes: ["QUOTA_STATE_COMPOSITION_FAILED"],
      implementer_model: implementerModel,
      implementer_reference: implementationResult?.task_ref ?? null,
      reviewed_at: reviewedAt,
    });
  }
  const canonical = boundary?.canonical;
  if (!canonical || canonical.ok !== true) {
    return baseResult({
      review_required: true,
      reviewer_selection_status: "QUOTA_STATE_COMPOSITION_FAILED",
      reason_codes: ["QUOTA_STATE_COMPOSITION_FAILED", ...((canonical && canonical.reason_codes) || [])],
      quota_provenance: null,
      implementer_model: implementerModel,
      implementer_reference: implementationResult?.task_ref ?? null,
      reviewed_at: reviewedAt,
    });
  }
  const joined = canonical.joined;

  // 2. Reviewer candidates from REGISTRY metadata only.
  const cand = buildReviewerCandidates(registry, { reviewCandidateModels: options.reviewCandidateModels });
  if (!cand.ok) {
    return baseResult({
      review_required: true,
      reviewer_selection_status: "NO_CANDIDATES",
      reason_codes: ["REVIEWER_CANDIDATES_DERIVATION_FAILED", ...cand.reason_codes],
      quota_provenance: quotaProvenanceOf(canonical),
      implementer_model: implementerModel,
      implementer_reference: implementationResult?.task_ref ?? null,
      reviewed_at: reviewedAt,
    });
  }

  // 3. REAL reviewer selector (T18 law, independence preference active).
  // No-pool LOCAL lanes carry the T12 availability law: an unmetered local
  // reviewer candidate participates ONLY when the joined state observes the
  // resource available (composer Qwen gate). Unobserved => rejected here with
  // explicit audit; the selector's ADMIT_NO_POOL never bypasses observation.
  const candidates = cand.candidates.map((c) => {
    const res = joined.resources?.[c.resource_id];
    if (res && res.quota_pool_id === null && res.resource_available !== true) {
      return {
        ...c,
        rejected_pre_selector: true,
        reason: res.pool_semantics === "local_unmetered" ? "LOCAL_RESOURCE_UNOBSERVED_UNAVAILABLE" : "NO_POOL_RESOURCE_UNAVAILABLE",
      };
    }
    return c;
  });
  const preRejected = candidates.filter((c) => c.rejected_pre_selector);
  const selectableCandidates = candidates.filter((c) => !c.rejected_pre_selector);

  if (selectableCandidates.length === 0) {
    return baseResult({
      review_required: true,
      reviewer_selection_status: "NO_ROUTE_SELECTED",
      reason_codes: ["ALL_CANDIDATES_REJECTED", ...preRejected.map((c) => `${c.route_id}:${c.reason}`)],
      quota_provenance: quotaProvenanceOf(canonical),
      implementer_model: implementerModel,
      implementer_reference: implementationResult?.task_ref ?? null,
      reviewed_at: reviewedAt,
      decision: null,
      quality_guard: null,
    });
  }

  const decision = selectQuotaAwareReviewerRoute(joined, selectableCandidates, {
    implementer_model: implementerModel,
    ...(options.quotaStateOptions?.nowMs !== undefined ? { nowMs: options.quotaStateOptions.nowMs } : {}),
  });
  if (decision.schema_version !== REVIEWER_DECISION_SCHEMA) {
    return baseResult({
      review_required: true,
      reviewer_selection_status: "SELECTOR_ENVELOPE_INVALID",
      reason_codes: ["SELECTOR_ENVELOPE_INVALID"],
      quota_provenance: quotaProvenanceOf(canonical),
      implementer_model: implementerModel,
      implementer_reference: implementationResult?.task_ref ?? null,
      reviewed_at: reviewedAt,
    });
  }

  // 4. No-silent-downgrade guard on the reviewer decision envelope (T13).
  const demand = options.demand && typeof options.demand === "object" ? options.demand : {};
  const qualityGuard = guardQualityDowngrade(decision, {
    risk: demand.risk === "high" ? "high" : "normal",
    ...(demand.min_quality_tier !== undefined ? { min_quality_tier: demand.min_quality_tier } : {}),
    ...(Array.isArray(demand.required_capabilities) ? { required_capabilities: demand.required_capabilities } : {}),
  });

  const selected = decision.status === "ROUTE_SELECTED" && qualityGuard.veto !== true
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

  const status = qualityGuard.veto === true
    ? "VETOED_QUALITY_DOWNGRADE"
    : decision.status === "ROUTE_SELECTED"
      ? "REVIEWER_SELECTED"
      : "NO_ROUTE_SELECTED";

  return baseResult({
    review_required: true,
    reviewer_selection_status: status,
    selected_reviewer: selected,
    reason_codes: [
      ...(decision.reason_codes || []),
      ...(qualityGuard.veto === true ? qualityGuard.reason_codes : []),
      ...preRejected.map((c) => `${c.route_id}:${c.reason}`),
    ],
    quota_provenance: quotaProvenanceOf(canonical),
    implementer_model: implementerModel,
    implementer_reference: implementationResult?.task_ref ?? null,
    reviewed_at: reviewedAt,
    decision,
    quality_guard: qualityGuard,
  });
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
 * Caller-side attach helper (used by the local-dev live runner main()).
 * APPEND-ONLY: attaches the bounded review-stage result to an implementation
 * result WITHOUT altering status/classification/exit semantics. All
 * review-stage vocabulary stays in THIS module (isolation law of the DEV
 * runner: no production-authorization vocabulary in the runner source).
 * Failures never alter the caller result.
 */
export async function attachReviewStage(implementationResult, options = {}) {
  try {
    const review = await runReviewStage(implementationResult, options);
    if (implementationResult && typeof implementationResult === "object" && !Array.isArray(implementationResult)) {
      implementationResult.review_stage = review;
    }
    return review;
  } catch (err) {
    const fallback = {
      schema_version: REVIEW_STAGE_RESULT_SCHEMA,
      review_required: true,
      reviewer_selection_status: "REVIEW_STAGE_RUNNER_ERROR",
      selected_reviewer: null,
      reason_codes: ["REVIEW_STAGE_RUNNER_ERROR", String(err?.message || err).slice(0, 120)],
      quota_provenance: null,
      implementer_model: options?.implementerModel ?? null,
      implementer_reference: implementationResult?.task_ref ?? null,
      execution_performed: false,
    };
    if (implementationResult && typeof implementationResult === "object" && !Array.isArray(implementationResult)) {
      implementationResult.review_stage = fallback;
    }
    return fallback;
  }
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/run-review-stage-v1.mjs");

if (isMain) {
  // Canonical CLI: node tools/run-review-stage-v1.mjs --input-file <result.json> [--implementer-model x]
  const args = process.argv.slice(2);
  const inputFile = args[args.indexOf("--input-file") + 1];
  const implementerModel = args.includes("--implementer-model") ? args[args.indexOf("--implementer-model") + 1] : undefined;
  const outFile = args.includes("--output-file") ? args[args.indexOf("--output-file") + 1] : null;
  const run = async () => {
    if (!inputFile) {
      process.stderr.write("Usage: node tools/run-review-stage-v1.mjs --input-file <implementation-result.json> [--implementer-model <id>] [--output-file <path>]\n");
      process.exit(2);
    }
    const implementationResult = JSON.parse(readFileSync(resolve(process.cwd(), inputFile), "utf8").replace(/^\uFEFF/, ""));
    const review = await runReviewStage(implementationResult, implementerModel ? { implementerModel } : {});
    const payload = JSON.stringify(review, null, 2);
    if (outFile) {
      const { writeFileSync, mkdirSync } = await import("node:fs");
      const { dirname: dn } = await import("node:path");
      const abs = resolve(process.cwd(), outFile);
      mkdirSync(dn(abs), { recursive: true });
      writeFileSync(abs, payload, "utf8");
    }
    process.stdout.write(`${payload}\n`);
    process.exit(review.reviewer_selection_status === "REVIEWER_SELECTED" ? 0 : 1);
  };
  run().catch((err) => {
    process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
