#!/usr/bin/env node
/**
 * qwen-execution-scope-v2 — canonical authorization scope for next WF40 live proof.
 * Deterministic key order is part of the digest contract.
 */
import { createHash } from "node:crypto";
import {
  CANONICAL_ENDPOINT,
  NEXT_WF40_EXECUTOR_PROFILE_ID,
} from "./qwen-local-runtime-v1.mjs";

export const SCOPE_VERSION = "qwen-execution-scope-v2";
export const REQUIRED_ROUTE_ID = "opencode+qwen_local";

/** Exact fixed scope — key order is part of the canonical digest. */
export const FIXED_AUTHORIZATION_SCOPE_V2 = Object.freeze({
  scope_version: SCOPE_VERSION,
  execution_harness: "opencode",
  model: "qwen_local",
  profile_id: NEXT_WF40_EXECUTOR_PROFILE_ID,
  role: "FAST_AGENT",
  canonical_endpoint: CANONICAL_ENDPOINT,
  single_generation_guard_required: true,
  max_opencode_executions: 1,
  max_qwen_generation_calls: 1,
  retry: 0,
  fallback: 0,
});

export const CANONICAL_SCOPE_DIGEST_V2 =
  "5261290cbdda414de0a6bd5ffd79e939f805eefde3fe2e39a8f490c5a2e02261";

export const SCOPE_V2_KEYS = Object.freeze([
  "scope_version",
  "execution_harness",
  "model",
  "profile_id",
  "role",
  "canonical_endpoint",
  "single_generation_guard_required",
  "max_opencode_executions",
  "max_qwen_generation_calls",
  "retry",
  "fallback",
]);

function sha256Hex(text) {
  return createHash("sha256").update(String(text), "utf8").digest("hex");
}

export function compactScopeV2Json(scope = FIXED_AUTHORIZATION_SCOPE_V2) {
  // Preserve insertion order of the canonical object; do not re-sort keys.
  return JSON.stringify(scope);
}

export function canonicalScopeDigestV2(scope = FIXED_AUTHORIZATION_SCOPE_V2) {
  return sha256Hex(compactScopeV2Json(scope));
}

export function validateScopeV2(scope) {
  const codes = [];
  if (!scope || typeof scope !== "object" || Array.isArray(scope)) {
    return { ok: false, reason_codes: ["AUTH_SCOPE_MISSING"] };
  }
  const keys = Object.keys(scope);
  if (keys.length !== SCOPE_V2_KEYS.length || keys.some((k, i) => k !== SCOPE_V2_KEYS[i])) {
    codes.push("AUTH_SCOPE_KEY_ORDER_INVALID");
  }
  if (scope.scope_version !== SCOPE_VERSION) codes.push("AUTH_SCOPE_VERSION_INVALID");
  if (scope.execution_harness !== "opencode") codes.push("AUTH_WRONG_IMPLEMENTER");
  if (scope.model !== "qwen_local") codes.push("AUTH_WRONG_MODEL");
  if (scope.profile_id !== NEXT_WF40_EXECUTOR_PROFILE_ID) codes.push("AUTH_PROFILE_INVALID");
  if (scope.role !== "FAST_AGENT") codes.push("AUTH_ROLE_INVALID");
  if (scope.canonical_endpoint !== CANONICAL_ENDPOINT) codes.push("AUTH_ENDPOINT_INVALID");
  if (scope.single_generation_guard_required !== true) codes.push("AUTH_GUARD_NOT_REQUIRED");
  if (scope.max_opencode_executions !== 1) codes.push("AUTH_MAX_OPENCODE_EXECUTIONS_INVALID");
  if (scope.max_qwen_generation_calls !== 1) codes.push("AUTH_MAX_QWEN_GENERATIONS_INVALID");
  if (scope.retry !== 0) codes.push("AUTH_RETRY_INVALID");
  if (scope.fallback !== 0) codes.push("AUTH_FALLBACK_INVALID");
  if ("dflash_required" in scope) codes.push("AUTH_DFLASH_FORBIDDEN");
  if ("qwen_profile" in scope) codes.push("AUTH_LEGACY_QWEN_PROFILE_FORBIDDEN");
  const digest = canonicalScopeDigestV2(scope);
  if (digest !== CANONICAL_SCOPE_DIGEST_V2) codes.push("AUTH_SCOPE_DIGEST_MISMATCH");
  if (codes.length) return { ok: false, reason_codes: codes, digest };
  return { ok: true, reason_codes: [], digest };
}

export function buildScopeV2(overrides = {}) {
  const scope = { ...FIXED_AUTHORIZATION_SCOPE_V2, ...overrides };
  // Rebuild with canonical key order only.
  const ordered = {};
  for (const key of SCOPE_V2_KEYS) ordered[key] = scope[key];
  return ordered;
}

/**
 * AGG 2026-09-03 correction: role FAST_AGENT (and short-turn interactive
 * roles) are UNQUALIFIED for live execution pending comparison of retained
 * profiles. The v2 scope remains cryptographically unchanged; this gate only
 * blocks live execution bound to an unqualified role. DCFR is preserved and
 * remains qualified for FAST_THROUGHPUT/LONG_TASK.
 */
import {
  roleQualifiedForLiveExecution as _roleQualifiedForLiveExecution,
} from "./qwen-local-runtime-v1.mjs";

export function scopeRoleQualifiedForLiveExecution(scope = FIXED_AUTHORIZATION_SCOPE_V2) {
  const role = scope && typeof scope === "object" ? scope.role : null;
  if (!role) {
    return {
      ok: false,
      qualified: false,
      reason_codes: ["AUTH_ROLE_INVALID", "ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION"],
    };
  }
  const gate = _roleQualifiedForLiveExecution(role);
  if (!gate.qualified) {
    return {
      ok: false,
      qualified: false,
      role,
      value: gate.value,
      reason_codes: [
        "ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION",
        ...(gate.reason_codes || []),
      ],
    };
  }
  return { ok: true, qualified: true, role, value: gate.value, reason_codes: [] };
}

