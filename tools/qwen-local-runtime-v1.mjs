#!/usr/bin/env node
/**
 * qwen-local-runtime-v1 — load/validate committed qwen_local runtime profiles.
 * Offline. No process launch. Does not mutate launcher parameters.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RUNTIME_SCHEMA = "qwen-local-runtime-v1";
export const BACKENDS = Object.freeze(["llama_cpp", "ollama"]);
export const PROFILE_IDS = Object.freeze(["fast_8k", "balanced_16k", "long_32k"]);
export const CONTEXT_TOKENS = Object.freeze([8192, 16384, 32768]);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const RUNTIME_CONFIG_PATH = resolve(
  ROOT,
  "configs/resources/qwen-local-runtime.json",
);

export function loadQwenLocalRuntime(path = RUNTIME_CONFIG_PATH) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

export function resolveQwenLocalBackend(options = {}) {
  const raw =
    options.backend ||
    process.env.QWEN_LOCAL_BACKEND ||
    "llama_cpp";
  return String(raw).trim();
}

export function validateBackend(backend) {
  if (!BACKENDS.includes(backend)) {
    return {
      ok: false,
      classification: "UNKNOWN_BACKEND",
      reason: `backend must be llama_cpp|ollama; got ${backend}`,
    };
  }
  return { ok: true, backend };
}

export function validateProfileId(profileId) {
  if (!PROFILE_IDS.includes(profileId)) {
    return {
      ok: false,
      classification: "UNKNOWN_PROFILE",
      reason: `profile must be fast_8k|balanced_16k|long_32k; got ${profileId}`,
    };
  }
  return { ok: true, profileId };
}

/**
 * Fail-closed policy for normal qwen_local profiles.
 * AR / dflash_required=false is forbidden.
 */
export function validateProfilePolicy(profile, profileId) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return {
      ok: false,
      classification: "INVALID_PROFILE",
      reason: "profile must be an object",
    };
  }
  if (profile.backend !== "llama_cpp") {
    return {
      ok: false,
      classification: "INVALID_PROFILE",
      reason: "normal qwen_local profiles require backend=llama_cpp",
      profileId,
    };
  }
  if (profile.dflash_required !== true) {
    return {
      ok: false,
      classification: "DFLASH_REQUIRED",
      reason: "dflash_required must be true for normal qwen_local profiles",
      profileId,
    };
  }
  if (!CONTEXT_TOKENS.includes(profile.context_tokens)) {
    return {
      ok: false,
      classification: "INVALID_CONTEXT_TOKENS",
      reason: "context_tokens must be 8192|16384|32768",
      profileId,
    };
  }
  if (profile.spec_type !== "draft-dflash") {
    return {
      ok: false,
      classification: "DFLASH_REQUIRED",
      reason: "spec_type must be draft-dflash",
      profileId,
    };
  }
  return { ok: true, profileId, profile };
}

export function getProfile(runtime, profileId) {
  const idCheck = validateProfileId(profileId);
  if (!idCheck.ok) return idCheck;
  const profile = runtime?.profiles?.[profileId];
  return validateProfilePolicy(profile, profileId);
}

export function validateRuntimeDocument(runtime) {
  if (!runtime || typeof runtime !== "object") {
    return { ok: false, classification: "INVALID_RUNTIME", reason: "runtime missing" };
  }
  if (runtime.schema_version !== RUNTIME_SCHEMA) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "schema_version must be qwen-local-runtime-v1",
    };
  }
  if (runtime.primary_backend !== "llama_cpp") {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "primary_backend must be llama_cpp",
    };
  }
  if (runtime.default_profile !== "fast_8k") {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "default_profile must be fast_8k",
    };
  }
  if (runtime.ar_fallback_forbidden !== true) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "ar_fallback_forbidden must be true",
    };
  }
  for (const id of PROFILE_IDS) {
    const checked = getProfile(runtime, id);
    if (!checked.ok) return checked;
  }
  return { ok: true, runtime };
}
