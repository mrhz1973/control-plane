#!/usr/bin/env node
/**
 * qwen-execution-scope-v3 — canonical scope for the selected OPUS Agent 24K
 * next-WF40 executor. Scope-v2 remains historical and is not rewritten.
 */
import { createHash } from "node:crypto";
import { roleQualifiedForLiveExecution } from "./qwen-local-runtime-v1.mjs";

export const SCOPE_VERSION = "qwen-execution-scope-v3";
export const REQUIRED_ROUTE_ID = "opencode+qwen_local";
export const REQUIRED_PROFILE_ID = "qwen38-opus-q3-agent-24k";
export const REQUIRED_ROLE = "FAST_AGENT";
export const CANONICAL_ENDPOINT = "http://127.0.0.1:8080";

export const FIXED_AUTHORIZATION_SCOPE_V3 = Object.freeze({
  scope_version: SCOPE_VERSION,
  execution_harness: "opencode",
  model: "qwen_local",
  profile_id: REQUIRED_PROFILE_ID,
  role: REQUIRED_ROLE,
  canonical_endpoint: CANONICAL_ENDPOINT,
  single_generation_guard_required: true,
  max_opencode_executions: 1,
  max_qwen_generation_calls: 1,
  retry: 0,
  fallback: 0,
});

export const CANONICAL_SCOPE_DIGEST_V3 =
  "934123f0fe8c39b4783632aa014b9952a28396d8e7d6e8c6ca246cfe1f2548f7";

export const SCOPE_V3_KEYS = Object.freeze(Object.keys(FIXED_AUTHORIZATION_SCOPE_V3));

export function compactScopeV3Json(scope = FIXED_AUTHORIZATION_SCOPE_V3) {
  return JSON.stringify(scope);
}

export function canonicalScopeDigestV3(scope = FIXED_AUTHORIZATION_SCOPE_V3) {
  return createHash("sha256").update(compactScopeV3Json(scope), "utf8").digest("hex");
}

export function validateScopeV3(scope) {
  const codes = [];
  if (!scope || typeof scope !== "object" || Array.isArray(scope)) {
    return { ok: false, reason_codes: ["AUTH_SCOPE_MISSING"] };
  }
  const keys = Object.keys(scope);
  if (keys.length !== SCOPE_V3_KEYS.length || keys.some((key, index) => key !== SCOPE_V3_KEYS[index])) {
    codes.push("AUTH_SCOPE_KEY_ORDER_INVALID");
  }
  if (scope.scope_version !== SCOPE_VERSION) codes.push("AUTH_SCOPE_VERSION_INVALID");
  if (scope.execution_harness !== "opencode") codes.push("AUTH_WRONG_IMPLEMENTER");
  if (scope.model !== "qwen_local") codes.push("AUTH_WRONG_MODEL");
  if (scope.profile_id !== REQUIRED_PROFILE_ID) codes.push("AUTH_PROFILE_INVALID");
  if (scope.role !== REQUIRED_ROLE) codes.push("AUTH_ROLE_INVALID");
  if (scope.canonical_endpoint !== CANONICAL_ENDPOINT) codes.push("AUTH_ENDPOINT_INVALID");
  if (scope.single_generation_guard_required !== true) codes.push("AUTH_GUARD_NOT_REQUIRED");
  if (scope.max_opencode_executions !== 1) codes.push("AUTH_MAX_OPENCODE_EXECUTIONS_INVALID");
  if (scope.max_qwen_generation_calls !== 1) codes.push("AUTH_MAX_QWEN_GENERATIONS_INVALID");
  if (scope.retry !== 0) codes.push("AUTH_RETRY_INVALID");
  if (scope.fallback !== 0) codes.push("AUTH_FALLBACK_INVALID");
  if ("dflash_required" in scope) codes.push("AUTH_DFLASH_FORBIDDEN");
  if ("qwen_profile" in scope) codes.push("AUTH_LEGACY_QWEN_PROFILE_FORBIDDEN");
  const digest = canonicalScopeDigestV3(scope);
  if (digest !== CANONICAL_SCOPE_DIGEST_V3) codes.push("AUTH_SCOPE_DIGEST_MISMATCH");
  return codes.length
    ? { ok: false, reason_codes: codes, digest }
    : { ok: true, reason_codes: [], digest };
}

export function buildScopeV3(overrides = {}) {
  const merged = { ...FIXED_AUTHORIZATION_SCOPE_V3, ...overrides };
  const ordered = {};
  for (const key of SCOPE_V3_KEYS) ordered[key] = merged[key];
  return ordered;
}

export function scopeRoleQualifiedForLiveExecution(scope = FIXED_AUTHORIZATION_SCOPE_V3) {
  const role = scope && typeof scope === "object" ? scope.role : null;
  const gate = roleQualifiedForLiveExecution(role);
  return {
    ...gate,
    qualified: gate.qualified === true,
    reason_codes: gate.reason_codes || [],
  };
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("qwen-execution-scope-v3.mjs");

if (isMain) {
  process.stdout.write(
    `${JSON.stringify({
      scope: FIXED_AUTHORIZATION_SCOPE_V3,
      compact_json: compactScopeV3Json(),
      digest: canonicalScopeDigestV3(),
      validation: validateScopeV3(FIXED_AUTHORIZATION_SCOPE_V3),
    }, null, 2)}\n`,
  );
}
