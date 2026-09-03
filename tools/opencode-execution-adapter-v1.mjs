#!/usr/bin/env node
/**
 * V4 — bounded OpenCode execution adapter (opencode+qwen_local).
 * Sits AFTER the unchanged DISPATCH_READY boundary. Fail-closed by default:
 * no authorization => no guard, no OpenCode process, no generation.
 * The external single-generation guard is the ONLY hard generation ceiling.
 */
import { startSingleGenerationGuard } from "./opencode-single-generation-guard-v1.mjs";
import { probeOpenCodeLocal } from "./probe-opencode-local-v1.mjs";
import {
  NEXT_WF40_EXECUTOR_PROFILE_ID,
  getProfile,
  loadQwenLocalRuntime,
} from "./qwen-local-runtime-v1.mjs";
import { validateScopeV2 } from "./qwen-execution-scope-v2.mjs";

export const RESULT_SCHEMA = "opencode-execution-result-v1";
export const AUTH_SCHEMA = "operator-runtime-authorization-v1";
export const REQUIRED_ROUTE_ID = "opencode+qwen_local";
export const REQUIRED_IMPLEMENTER = "opencode";
export const REQUIRED_MODEL = "qwen_local";
export const REQUIRED_PROFILE = NEXT_WF40_EXECUTOR_PROFILE_ID;
export const REQUIRED_ROLE = "FAST_AGENT";
export const DEFAULT_UPSTREAM_ORIGIN = "http://127.0.0.1:8080";
export const DIRECT_QWEN_ENDPOINT_FORBIDDEN = "http://127.0.0.1:8080";

const AUTH_REJECT = "AUTHORIZATION_REJECTED";
const OCCUPANCY_REJECT = "OCCUPANCY_BLOCKED";
const EXECUTED = "EXECUTED_OK";
const BOUNDS_VIOLATION = "EXECUTION_BOUNDS_VIOLATION";
const NOT_AUTHORIZED = "NOT_AUTHORIZED";

function baseResult(partial) {
  return {
    schema_version: RESULT_SCHEMA,
    execution_id: partial.execution_id ?? null,
    status: partial.status ?? "BLOCKED",
    classification: partial.classification ?? NOT_AUTHORIZED,
    execution_performed: false,
    authorization_id: partial.authorization_id ?? null,
    authorization_state_final: partial.authorization_state_final ?? "ABSENT",
    route_id: partial.route_id ?? REQUIRED_ROUTE_ID,
    implementer: partial.implementer ?? REQUIRED_IMPLEMENTER,
    model: partial.model ?? REQUIRED_MODEL,
    occupancy_classification: partial.occupancy_classification ?? null,
    guard_required: true,
    guard_started: false,
    guard_upstream_generation_requests: 0,
    guard_blocked_generation_requests: 0,
    opencode_execution_count: 0,
    qwen_generation_calls: 0,
    retry_calls: 0,
    fallback_calls: 0,
    response_validation: "NOT_VALIDATED",
    reason_codes: partial.reason_codes || [],
    ...partial.extra,
  };
}

/**
 * Validate an operator runtime authorization object for this adapter.
 * Returns { ok, reason_codes, authorization_id }.
 */
export function validateRuntimeAuthorization(auth) {
  const codes = [];
  if (!auth || typeof auth !== "object" || Array.isArray(auth)) {
    return { ok: false, reason_codes: ["AUTH_MISSING"], authorization_id: null };
  }
  if (auth.schema_version !== AUTH_SCHEMA) {
    codes.push("AUTH_SCHEMA_MISMATCH");
  }
  const id = typeof auth.authorization_id === "string" ? auth.authorization_id : null;
  if (!id) codes.push("AUTH_ID_MISSING");

  // state: ACTIVE/unused only. Accept either explicit state field or
  // absence of spent flags; explicit "SPENT"/"used" always rejects.
  const state = auth.authorization_state || auth.state;
  if (state && String(state).toUpperCase() !== "ACTIVE") {
    codes.push("AUTH_NOT_ACTIVE");
  }
  if (auth.spent === true || auth.used === true) codes.push("AUTH_ALREADY_SPENT");

  const scope = auth.scope && typeof auth.scope === "object" ? auth.scope : null;
  if (!scope) {
    codes.push("AUTH_SCOPE_MISSING");
  } else {
    const scopeCheck = validateScopeV2(scope);
    if (!scopeCheck.ok) codes.push(...scopeCheck.reason_codes);
  }
  // Route must be exactly opencode+qwen_local if expressed.
  if (auth.route_id !== undefined && auth.route_id !== REQUIRED_ROUTE_ID) {
    codes.push("AUTH_WRONG_ROUTE");
  }
  if (codes.length) return { ok: false, reason_codes: ["AUTHORIZATION_REJECTED", ...codes], authorization_id: id };
  return { ok: true, reason_codes: [], authorization_id: id };
}

/**
 * Occupancy gate: consume canonical occupancy classification only.
 */
export function occupancyAllowed(classification) {
  return (
    classification === "QWEN_READY_IDLE" ||
    classification === "QWEN_NOT_RUNNING_SAFE_TO_START"
  );
}

function sanitizeResponseValidation(validation) {
  if (validation === true) return "VALID";
  if (validation === false) return "INVALID";
  return "NOT_VALIDATED";
}

/**
 * Execute the bounded guarded OpenCode path.
 *
 * options (all injectable for offline tests):
 *  - getOccupancy: async () => classification string
 *  - guardStart: async ({ upstreamOrigin, listenPort }) => guard object { base_url, getAccounting, close }
 *  - runOpenCode: async ({ guardBaseUrl, authorization, message, ... }) => accounting-like
 *  - opencodeProbe: optional probe result
 */
export async function executeOpenCodeBounded(request, options = {}) {
  const executionId =
    request && typeof request.execution_id === "string" && request.execution_id.trim()
      ? request.execution_id.trim()
      : `exec-${Date.now()}`;

  const authInput = request?.runtime_authorization ?? null;
  const authCheck = validateRuntimeAuthorization(authInput);

  if (!authCheck.ok) {
    return baseResult({
      execution_id: executionId,
      status: "BLOCKED",
      classification: AUTH_REJECT,
      authorization_id: authCheck.authorization_id,
      authorization_state_final: authInput ? "REJECTED" : "ABSENT",
      reason_codes: authCheck.reason_codes,
    });
  }

  const occupancy = options.getOccupancy || null;
  if (typeof occupancy !== "function") {
    return baseResult({
      execution_id: executionId,
      status: "BLOCKED",
      classification: OCCUPANCY_REJECT,
      authorization_id: authCheck.authorization_id,
      authorization_state_final: "ACTIVE",
      reason_codes: [OCCUPANCY_REJECT, "OCCUPANCY_SOURCE_MISSING"],
    });
  }

  let occupancyClassification = null;
  try {
    occupancyClassification = await occupancy();
  } catch {
    return baseResult({
      execution_id: executionId,
      status: "BLOCKED",
      classification: OCCUPANCY_REJECT,
      authorization_id: authCheck.authorization_id,
      authorization_state_final: "ACTIVE",
      reason_codes: [OCCUPANCY_REJECT, "OCCUPANCY_SOURCE_ERROR"],
    });
  }

  if (!occupancyAllowed(occupancyClassification)) {
    return baseResult({
      execution_id: executionId,
      status: "BLOCKED",
      classification: OCCUPANCY_REJECT,
      authorization_id: authCheck.authorization_id,
      authorization_state_final: "ACTIVE",
      occupancy_classification: occupancyClassification || "UNKNOWN",
      reason_codes: [OCCUPANCY_REJECT, String(occupancyClassification || "UNKNOWN").toUpperCase()],
    });
  }

  // Resolve runtime profile (offline-safe: config read only).
  let modelId = REQUIRED_PROFILE;
  try {
    const runtime = loadQwenLocalRuntime();
    const prof = getProfile(runtime, REQUIRED_PROFILE);
    if (prof.ok) modelId = prof.profile.llama_cpp_model_id;
  } catch {
    /* fall back to canonical FAST_AGENT profile id */
  }

  const runOpenCode =
    options.runOpenCode && typeof options.runOpenCode === "function"
      ? options.runOpenCode
      : null;
  if (!runOpenCode) {
    // Default path never executes: no runner injected means offline/no-execution mode.
    return baseResult({
      execution_id: executionId,
      status: "BLOCKED",
      classification: "RUNNER_NOT_PROVIDED",
      authorization_id: authCheck.authorization_id,
      authorization_state_final: "ACTIVE",
      occupancy_classification: occupancyClassification,
      reason_codes: ["RUNNER_NOT_PROVIDED", "NO_LIVE_EXECUTION_DEFAULT"],
    });
  }

  const guardStart = options.guardStart || startSingleGenerationGuard;
  const upstreamOrigin =
    options.upstreamOrigin || authInput?.scope?.single_generation_guard_upstream || DEFAULT_UPSTREAM_ORIGIN;

  let guard = null;
  let guardAccounting = null;
  let runAccounting = null;
  let failure = null;

  try {
    guard = await guardStart({ upstreamOrigin, listenPort: 0 });
    if (!guard || !guard.base_url || typeof guard.getAccounting !== "function") {
      throw new Error("GUARD_INVALID");
    }
    // Guard must never be the direct canonical Qwen endpoint.
    if (String(guard.base_url) === DIRECT_QWEN_ENDPOINT_FORBIDDEN) {
      throw new Error("GUARD_TARGET_IS_DIRECT_QWEN_ENDPOINT");
    }

    runAccounting = await runOpenCode({
      guardBaseUrl: guard.base_url,
      authorization: authInput,
      modelId,
      profile: REQUIRED_PROFILE,
      message: request?.message ?? null,
      execution_id: executionId,
    });

    guardAccounting = guard.getAccounting();
  } catch (err) {
    failure = err && err.message ? err.message : "EXECUTION_ERROR";
    // Guard accounting stays authoritative even when the runner throws:
    // read the live guard before the owned guard is closed in finally.
    if (!guardAccounting && guard && typeof guard.getAccounting === "function") {
      try {
        guardAccounting = guard.getAccounting();
      } catch {
        /* accounting unavailable */
      }
    }
  } finally {
    if (guard && typeof guard.close === "function") {
      try {
        await guard.close();
      } catch {
        /* owned guard cleanup best-effort */
      }
    }
  }

  if (failure) {
    const finalGuard = guardAccounting || null;
    return baseResult({
      execution_id: executionId,
      status: "ERROR",
      classification: BOUNDS_VIOLATION,
      authorization_id: authCheck.authorization_id,
      authorization_state_final: "SPENT",
      occupancy_classification: occupancyClassification,
      reason_codes: [BOUNDS_VIOLATION, failure],
      extra: {
        guard_started: Boolean(guard),
        guard_upstream_generation_requests:
          Number(finalGuard?.upstream_generation_requests) || 0,
        guard_blocked_generation_requests:
          Number(finalGuard?.blocked_generation_requests) || 0,
      },
    });
  }

  // Bounds enforcement over runner + guard accounting; guard is authoritative
  // for upstream generation count (the runner must never be able to mask it).
  const guardUp = Number(guardAccounting?.upstream_generation_requests ?? 0);
  const up = Math.max(guardUp, Number(runAccounting?.upstream_generation_requests ?? 0));
  const blocked = Number(guardAccounting?.blocked_generation_requests ?? 0);
  const opencodeRuns = Number(runAccounting?.opencode_execution_count ?? 1);
  const qwenGens = Number(runAccounting?.qwen_generation_calls ?? up);
  const retries = Number(runAccounting?.retry_calls ?? 0);
  const fallbacks = Number(runAccounting?.fallback_calls ?? 0);

  const violations = [];
  if (opencodeRuns > 1) violations.push("OPENCODE_EXECUTIONS_EXCEEDED");
  if (up > 1) violations.push("GUARD_UPSTREAM_EXCEEDED");
  if (qwenGens > 1) violations.push("QWEN_GENERATIONS_EXCEEDED");
  if (retries > 0) violations.push("RETRY_NONZERO");
  if (fallbacks > 0) violations.push("FALLBACK_NONZERO");

  if (violations.length) {
    return baseResult({
      execution_id: executionId,
      status: "ERROR",
      classification: BOUNDS_VIOLATION,
      authorization_id: authCheck.authorization_id,
      authorization_state_final: "SPENT",
      occupancy_classification: occupancyClassification,
      reason_codes: [BOUNDS_VIOLATION, ...violations],
      extra: {
        guard_started: true,
        guard_upstream_generation_requests: Math.min(up, 1),
        guard_blocked_generation_requests: blocked,
        opencode_execution_count: Math.min(opencodeRuns, 1),
        qwen_generation_calls: Math.min(qwenGens, 1),
      },
    });
  }

  return baseResult({
    execution_id: executionId,
    status: "EXECUTED",
    classification: EXECUTED,
    execution_performed: true,
    authorization_id: authCheck.authorization_id,
    authorization_state_final: "SPENT",
    occupancy_classification: occupancyClassification,
    reason_codes: [EXECUTED, ...(up === 1 ? ["SINGLE_GENERATION"] : ["ZERO_GENERATION"])],
    extra: {
      execution_performed: true,
      guard_started: true,
      guard_upstream_generation_requests: up,
      guard_blocked_generation_requests: blocked,
      opencode_execution_count: opencodeRuns,
      qwen_generation_calls: qwenGens,
      retry_calls: retries,
      fallback_calls: fallbacks,
      response_validation: sanitizeResponseValidation(runAccounting?.response_validation),
    },
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("opencode-execution-adapter-v1.mjs");

if (isMain) {
  // Default CLI invocation performs NO live execution — prints fail-closed result.
  executeOpenCodeBounded({ execution_id: "cli-default-no-execution" })
    .then((r) => {
      process.stdout.write(`${JSON.stringify(r, null, 2)}\n`);
    })
    .catch((err) => {
      process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
      process.exit(1);
    });
}
