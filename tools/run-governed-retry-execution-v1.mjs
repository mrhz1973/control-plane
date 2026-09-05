#!/usr/bin/env node
/**
 * V4_GOVERNED_RETRY_EXECUTION_CALLER_INTEGRATION_V1 — governed retry-execution stage.
 *
 * THE smallest real runtime caller/stage between a repairable implementation
 * STOP and retry-execution authorization. Invokes the already-proven
 * tools/run-retry-stage-v1.mjs BEFORE any repair attempt.
 *
 * Canonical call path:
 *
 *   implementation STOP result (local-dev-execution-result-v1)
 *     + governed retry_policy { max_attempts } (existing bound metadata only)
 *     -> classifyRepairability (PASS / non-repairable STOP never enter)
 *     -> runRetryStage (REAL; recomputes fresh canonical quota state EVERY attempt)
 *     -> if RETRY_ROUTE_SELECTED AND no authorized execution surface:
 *          RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION
 *          execution_performed=false (NEVER infer / NEVER execute)
 *     -> if blocked/vetoed: fail-closed, no execution
 *
 * Critical laws:
 *   - Ordinary test-command re-runs (makeRunTests) are NOT model-route retries
 *     and are NOT converted into this stage.
 *   - No safe existing post-failure route-selection caller exists in the
 *     local-dev executor / dispatcher; this stage IS the caller (issue #45
 *     path-b). Final activation into those surfaces remains a governed
 *     dependency and is NOT faked here.
 *   - D-0025 stays CLOSED; no OpenAI API/BYOK; no provider/model calls.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runRetryStage,
  RETRY_STAGE_RESULT_SCHEMA,
  IMPLEMENTATION_RESULT_SCHEMA,
} from "./run-retry-stage-v1.mjs";

export const GOVERNED_RETRY_EXECUTION_SCHEMA = "v4-governed-retry-execution-result-v1";
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Closed allowlist of classifications that MAY enter model-route retry
 * selection. Everything else is non-repairable (preflight/bounds/git/path
 * failures are not fixed by selecting a different model route).
 */
export const REPAIRABLE_CLASSIFICATIONS = Object.freeze([
  "STOP:TEST_FAILED",
  "STOP:OPENCODE_RUN_FAILED",
  "STOP:OPENCODE_TASK_ERROR",
]);

/** Hard ceiling matching the local-dev max_test_cycles cap (never invent unbounded). */
export const MAX_RETRY_ATTEMPTS_HARD_CAP = 3;

/**
 * Classify whether a STOP may enter governed retry selection.
 * Requires an explicit retry_policy.max_attempts from governed metadata —
 * absence of a bound means NO retry (never invent an unbounded loop).
 */
export function classifyRepairability(implementationResult, retryPolicy = {}) {
  if (!implementationResult || typeof implementationResult !== "object" || Array.isArray(implementationResult)) {
    return { repairable: false, reason_codes: ["IMPLEMENTATION_RESULT_INVALID"] };
  }
  if (implementationResult.schema_version && implementationResult.schema_version !== IMPLEMENTATION_RESULT_SCHEMA) {
    return { repairable: false, reason_codes: ["IMPLEMENTATION_RESULT_SCHEMA_UNKNOWN"] };
  }
  if (implementationResult.status === "PASS" || implementationResult.classification === "PASS") {
    return { repairable: false, reason_codes: ["PASS_NEVER_RETRIES"] };
  }
  if (implementationResult.status !== "STOP" && !String(implementationResult.classification || "").startsWith("STOP:")) {
    return { repairable: false, reason_codes: ["NOT_A_STOP_RESULT"] };
  }
  const classification = String(implementationResult.classification || "");
  if (!REPAIRABLE_CLASSIFICATIONS.includes(classification)) {
    return { repairable: false, reason_codes: ["STOP_NOT_REPAIRABLE", classification || "CLASSIFICATION_ABSENT"] };
  }
  const maxAttempts = retryPolicy?.max_attempts;
  if (typeof maxAttempts !== "number" || !Number.isFinite(maxAttempts) || maxAttempts < 1) {
    return { repairable: false, reason_codes: ["RETRY_POLICY_MAX_ATTEMPTS_MISSING"] };
  }
  if (maxAttempts > MAX_RETRY_ATTEMPTS_HARD_CAP) {
    return { repairable: false, reason_codes: ["RETRY_POLICY_MAX_ATTEMPTS_ABOVE_HARD_CAP", String(maxAttempts)] };
  }
  return { repairable: true, reason_codes: ["REPAIRABLE_STOP", "RETRY_POLICY_BOUND_PRESENT"], max_attempts: maxAttempts };
}

/**
 * Authorization probe for retry EXECUTION. Always false today: no authorized
 * retry-execution surface exists behind the closed D-0025 gate, and this stage
 * must not invent one. Injectable for future governed activation tests only.
 */
export function probeRetryExecutionAuthorization(options = {}) {
  if (typeof options.authorizationProbe === "function") {
    try {
      const r = options.authorizationProbe();
      return {
        authorized: r?.authorized === true,
        reason_codes: Array.isArray(r?.reason_codes) ? r.reason_codes : ["AUTHORIZATION_PROBE_RETURNED"],
      };
    } catch {
      return { authorized: false, reason_codes: ["AUTHORIZATION_PROBE_FAILED"] };
    }
  }
  // Default: read D-0025 gate — must stay closed; never authorize execution.
  try {
    const gatePath = options.gatePath || resolve(ROOT, "configs/planner/primary-remote-runtime-gate.json");
    const gate = JSON.parse(readFileSync(gatePath, "utf8").replace(/^\uFEFF/, ""));
    if (gate?.enabled === true) {
      // Even if somehow open, this stage still has no retry-execution adapter —
      // fail closed on execution (selection-only remains lawful).
      return { authorized: false, reason_codes: ["GATE_OPEN_BUT_RETRY_EXECUTION_SURFACE_ABSENT", "D-0025_ENABLED_UNEXPECTED"] };
    }
    return { authorized: false, reason_codes: ["D-0025_CLOSED", "RETRY_EXECUTION_SURFACE_ABSENT"] };
  } catch {
    return { authorized: false, reason_codes: ["GATE_UNREADABLE_FAIL_CLOSED", "RETRY_EXECUTION_SURFACE_ABSENT"] };
  }
}

function baseResult(partial) {
  return {
    schema_version: GOVERNED_RETRY_EXECUTION_SCHEMA,
    caller_status: partial.caller_status ?? "NOT_ELIGIBLE",
    repairable: partial.repairable === true,
    retry_required: partial.retry_required === true,
    retry_attempt_index: partial.retry_attempt_index ?? null,
    max_attempts: partial.max_attempts ?? null,
    retry_stage: partial.retry_stage ?? null,
    selected_retry_route: partial.selected_retry_route ?? null,
    authorization: partial.authorization ?? null,
    reason_codes: partial.reason_codes || [],
    execution_performed: false, // LAWFUL CONSTANT while no authorized surface exists
    previous_model_reference: partial.previous_model_reference ?? null,
    decided_at: partial.decided_at ?? null,
  };
}

/**
 * Run ONE governed retry-execution decision for a single attempt.
 *
 * @param {object} implementationResult  local-dev-execution-result-v1 (STOP)
 * @param {object} [options] {
 *   attempt?: number (1-based),
 *   retryPolicy?: { max_attempts: number },
 *   previousRouteId?, previousPoolId?, previousModel?,
 *   quotaStateOptions?: forwarded to runRetryStage,
 *   runRetryStageFn?: injectable (tests),
 *   authorizationProbe?: injectable (tests),
 *   demand?, urgency?, deferPolicy?,
 * }
 */
export async function runGovernedRetryExecution(implementationResult, options = {}) {
  const decidedAt = new Date(
    typeof options.quotaStateOptions?.nowMs === "number" && Number.isFinite(options.quotaStateOptions.nowMs)
      ? options.quotaStateOptions.nowMs
      : Date.now(),
  ).toISOString();

  const retryPolicy = options.retryPolicy
    || implementationResult?.retry_policy
    || null;
  const eligibility = classifyRepairability(implementationResult, retryPolicy || {});
  const attempt = options.attempt ?? 1;
  const previousModel =
    (typeof options.previousModel === "string" && options.previousModel)
    || (typeof implementationResult?.profile_id === "string" && implementationResult.profile_id)
    || null;

  if (!eligibility.repairable) {
    return baseResult({
      caller_status: eligibility.reason_codes.includes("PASS_NEVER_RETRIES") ? "PASS_NO_RETRY" : "NOT_REPAIRABLE",
      repairable: false,
      retry_required: false,
      retry_attempt_index: null,
      max_attempts: typeof retryPolicy?.max_attempts === "number" ? retryPolicy.max_attempts : null,
      reason_codes: eligibility.reason_codes,
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }

  const maxAttempts = eligibility.max_attempts;
  if (typeof attempt !== "number" || !Number.isFinite(attempt) || attempt < 1) {
    return baseResult({
      caller_status: "INPUT_INVALID",
      repairable: true,
      retry_required: false,
      retry_attempt_index: attempt,
      max_attempts: maxAttempts,
      reason_codes: ["RETRY_ATTEMPT_INDEX_INVALID"],
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }
  if (attempt > maxAttempts) {
    return baseResult({
      caller_status: "MAX_ATTEMPTS_EXCEEDED",
      repairable: true,
      retry_required: false,
      retry_attempt_index: attempt,
      max_attempts: maxAttempts,
      reason_codes: ["MAX_RETRY_ATTEMPTS_EXCEEDED", `ATTEMPT_${attempt}_OF_${maxAttempts}`],
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }

  // Invoke the REAL retry-selection boundary (fresh quota state every attempt).
  const runRetry = options.runRetryStageFn || runRetryStage;
  let retryStage;
  try {
    retryStage = await runRetry(implementationResult, {
      attempt,
      previousRouteId: options.previousRouteId,
      previousPoolId: options.previousPoolId,
      previousModel,
      forceRetryEligible: true, // eligibility already enforced above; STOP may carry status STOP
      ...(options.quotaStateOptions ? { quotaStateOptions: options.quotaStateOptions } : {}),
      ...(options.demand ? { demand: options.demand } : {}),
      ...(options.urgency ? { urgency: options.urgency } : {}),
      ...(options.deferPolicy ? { deferPolicy: options.deferPolicy } : {}),
    });
  } catch (err) {
    return baseResult({
      caller_status: "RETRY_STAGE_INVOCATION_FAILED",
      repairable: true,
      retry_required: true,
      retry_attempt_index: attempt,
      max_attempts: maxAttempts,
      reason_codes: ["RETRY_STAGE_INVOCATION_FAILED", String(err?.message || err).slice(0, 80)],
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }

  if (!retryStage || retryStage.schema_version !== RETRY_STAGE_RESULT_SCHEMA) {
    return baseResult({
      caller_status: "RETRY_STAGE_ENVELOPE_INVALID",
      repairable: true,
      retry_required: true,
      retry_attempt_index: attempt,
      max_attempts: maxAttempts,
      retry_stage: retryStage ?? null,
      reason_codes: ["RETRY_STAGE_ENVELOPE_INVALID"],
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }

  const auth = probeRetryExecutionAuthorization(options);

  // Selected but unauthorized → awaiting authorization; NEVER execute.
  if (retryStage.retry_selection_status === "RETRY_ROUTE_SELECTED" && retryStage.selected_retry_route) {
    if (auth.authorized !== true) {
      return baseResult({
        caller_status: "RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION",
        repairable: true,
        retry_required: true,
        retry_attempt_index: attempt,
        max_attempts: maxAttempts,
        retry_stage: retryStage,
        selected_retry_route: retryStage.selected_retry_route,
        authorization: auth,
        reason_codes: [
          "RETRY_ROUTE_SELECTED",
          "AWAITING_EXECUTION_AUTHORIZATION",
          ...auth.reason_codes,
        ],
        previous_model_reference: previousModel,
        decided_at: decidedAt,
      });
    }
    // Authorized path is reserved for a future governed activation. Even if a
    // probe returns authorized=true, this stage still does not execute —
    // execution requires a separately authorized adapter call that does not
    // exist yet. Fail closed on execution.
    return baseResult({
      caller_status: "RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION",
      repairable: true,
      retry_required: true,
      retry_attempt_index: attempt,
      max_attempts: maxAttempts,
      retry_stage: retryStage,
      selected_retry_route: retryStage.selected_retry_route,
      authorization: { ...auth, reason_codes: [...auth.reason_codes, "EXECUTION_ADAPTER_ABSENT_FAIL_CLOSED"] },
      reason_codes: [
        "RETRY_ROUTE_SELECTED",
        "AWAITING_EXECUTION_AUTHORIZATION",
        "EXECUTION_ADAPTER_ABSENT_FAIL_CLOSED",
      ],
      previous_model_reference: previousModel,
      decided_at: decidedAt,
    });
  }

  // Blocked / vetoed / composition failure — fail closed, no execution.
  return baseResult({
    caller_status: "RETRY_SELECTION_BLOCKED",
    repairable: true,
    retry_required: true,
    retry_attempt_index: attempt,
    max_attempts: maxAttempts,
    retry_stage: retryStage,
    selected_retry_route: null,
    authorization: auth,
    reason_codes: [
      "RETRY_SELECTION_BLOCKED",
      retryStage.retry_selection_status,
      ...(retryStage.reason_codes || []).slice(0, 8),
    ],
    previous_model_reference: previousModel,
    decided_at: decidedAt,
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/run-governed-retry-execution-v1.mjs");

if (isMain) {
  const args = process.argv.slice(2);
  const str = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const num = (flag) => (args.includes(flag) ? Number(args[args.indexOf(flag) + 1]) : undefined);
  const inputFile = str("--input-file");
  const outFile = str("--output-file");
  const run = async () => {
    if (!inputFile) {
      process.stderr.write(
        "Usage: node tools/run-governed-retry-execution-v1.mjs --input-file <stop-result.json> [--attempt N] [--max-attempts N] [--previous-route-id id] [--previous-pool-id id] [--previous-model id] [--output-file path]\n",
      );
      process.exit(2);
    }
    const implementationResult = JSON.parse(readFileSync(resolve(process.cwd(), inputFile), "utf8").replace(/^\uFEFF/, ""));
    const maxAttempts = num("--max-attempts");
    const result = await runGovernedRetryExecution(implementationResult, {
      ...(num("--attempt") !== undefined ? { attempt: num("--attempt") } : {}),
      ...(maxAttempts !== undefined ? { retryPolicy: { max_attempts: maxAttempts } } : {}),
      ...(str("--previous-route-id") ? { previousRouteId: str("--previous-route-id") } : {}),
      ...(str("--previous-pool-id") ? { previousPoolId: str("--previous-pool-id") } : {}),
      ...(str("--previous-model") ? { previousModel: str("--previous-model") } : {}),
    });
    const payload = JSON.stringify(result, null, 2);
    if (outFile) {
      const { writeFileSync, mkdirSync } = await import("node:fs");
      const { dirname: dn } = await import("node:path");
      const abs = resolve(process.cwd(), outFile);
      mkdirSync(dn(abs), { recursive: true });
      writeFileSync(abs, payload, "utf8");
    }
    process.stdout.write(`${payload}\n`);
    const ok = result.caller_status === "RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION";
    process.exit(ok ? 0 : 1);
  };
  run().catch((err) => {
    process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
