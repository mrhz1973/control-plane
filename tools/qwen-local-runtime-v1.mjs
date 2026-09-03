#!/usr/bin/env node
/**
 * qwen-local-runtime-v1 — load/validate committed qwen_local six-profile router config.
 * Offline. No process launch. Does not reconstruct llama-server commands.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RUNTIME_SCHEMA = "qwen-local-runtime-v1";
export const POLICY_VERSION = "qwen38-rtx3060-2026-09-03";
export const CANONICAL_ENDPOINT = "http://127.0.0.1:8080";

export const PROFILE_IDS = Object.freeze([
  "qwen38-opus-q3-daily-16k",
  "qwen38-opus-q3-agent-24k",
  "qwen38-dcfr-iq3-fast-16k",
  "qwen38-dcfr-iq3-agent-24k",
  "qwen38-original-ar-16k",
  "qwen38-uncensored-ar-16k",
]);

export const ROLE_TO_PROFILE_ID = Object.freeze({
  DAILY: "qwen38-opus-q3-daily-16k",
  QUALITY: "qwen38-opus-q3-daily-16k",
  QUALITY_AGENT_24K: "qwen38-opus-q3-agent-24k",
  FAST: "qwen38-dcfr-iq3-fast-16k",
  FAST_AGENT: "qwen38-dcfr-iq3-agent-24k",
  MCP: "qwen38-dcfr-iq3-agent-24k",
  BLENDER_FAST: "qwen38-dcfr-iq3-agent-24k",
  REFERENCE: "qwen38-original-ar-16k",
  MANUAL_UNCENSORED: "qwen38-uncensored-ar-16k",
});

export const NEXT_WF40_EXECUTOR_PROFILE_ID = "qwen38-dcfr-iq3-agent-24k";
export const STARTUP_PROFILE_ID = "qwen38-opus-q3-daily-16k";
export const BACKENDS = Object.freeze(["llama_cpp", "ollama"]);
export const CONTEXT_TOKENS = Object.freeze([16384, 24576]);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const RUNTIME_CONFIG_PATH = resolve(
  ROOT,
  "configs/resources/qwen-local-runtime.json",
);
export const POLICY_CONFIG_PATH = resolve(
  ROOT,
  "configs/resources/qwen-local-model-policy.json",
);

export function loadQwenLocalRuntime(path = RUNTIME_CONFIG_PATH) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

export function loadQwenLocalModelPolicy(path = POLICY_CONFIG_PATH) {
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
      reason: `profile must be one of ${PROFILE_IDS.join("|")}; got ${profileId}`,
    };
  }
  return { ok: true, profileId };
}

export function resolveRoleToProfileId(role) {
  const key = String(role || "").trim().toUpperCase();
  const profileId = ROLE_TO_PROFILE_ID[key];
  if (!profileId) {
    return {
      ok: false,
      classification: "UNKNOWN_ROLE",
      reason: `unknown role ${role}`,
      profileId: null,
    };
  }
  return { ok: true, role: key, profileId };
}

/**
 * Fail-closed profile policy for the six-profile router catalog.
 */
export function validateProfilePolicy(profile, profileId) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return {
      ok: false,
      classification: "INVALID_PROFILE",
      reason: "profile must be an object",
    };
  }
  if (profile.dflash_required === true) {
    return {
      ok: false,
      classification: "DFLASH_PROFILE_RETIRED",
      reason: "dflash_required must not be true under policy qwen38-rtx3060-2026-09-03",
      profileId,
    };
  }
  if (profile.llama_cpp_model_id !== profileId) {
    return {
      ok: false,
      classification: "INVALID_PROFILE",
      reason: "llama_cpp_model_id must equal exact profile_id",
      profileId,
    };
  }
  if (profile.keep_in_selector !== true) {
    return {
      ok: false,
      classification: "INVALID_PROFILE",
      reason: "keep_in_selector must be true for all six production profiles",
      profileId,
    };
  }
  if (profileId === "qwen38-uncensored-ar-16k") {
    if (profile.selection !== "explicit_user_choice") {
      return {
        ok: false,
        classification: "UNCENSORED_POLICY_INVALID",
        reason: "uncensored selection must be explicit_user_choice",
        profileId,
      };
    }
    if (profile.auto_route_sensitive_topics !== false) {
      return {
        ok: false,
        classification: "UNCENSORED_POLICY_INVALID",
        reason: "auto_route_sensitive_topics must be false",
        profileId,
      };
    }
    if (profile.delete_without_explicit_user_authorization !== false) {
      return {
        ok: false,
        classification: "UNCENSORED_POLICY_INVALID",
        reason: "delete_without_explicit_user_authorization must be false",
        profileId,
      };
    }
  }
  if (
    profileId === "qwen38-dcfr-iq3-agent-24k" &&
    profile.may_not_silently_fall_back_to === "qwen38-dcfr-iq3-fast-16k" &&
    profile.backend_lane !== "dcfr_patched_llama_cpp"
  ) {
    return {
      ok: false,
      classification: "DCFR_RUNTIME_POLICY_INVALID",
      reason: "FAST_AGENT must remain on dcfr_patched_llama_cpp lane",
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

export function resolveProfileForRole(runtime, role) {
  const mapped = resolveRoleToProfileId(role);
  if (!mapped.ok) return mapped;
  const checked = getProfile(runtime, mapped.profileId);
  if (!checked.ok) return checked;
  return {
    ok: true,
    role: mapped.role,
    profileId: mapped.profileId,
    profile: checked.profile,
  };
}

/**
 * Sensitive-topic auto-routing must never select Uncensored.
 */
export function selectProfileForSensitiveTopic(runtime, preferredRole = "DAILY") {
  const resolved = resolveProfileForRole(runtime, preferredRole);
  if (!resolved.ok) return resolved;
  if (resolved.profileId === "qwen38-uncensored-ar-16k") {
    return {
      ok: false,
      classification: "SENSITIVE_TOPIC_AUTO_UNCENSORED_FORBIDDEN",
      reason: "sensitive topics must not auto-select Uncensored",
    };
  }
  return resolved;
}

/**
 * Explicit user override may select Uncensored.
 */
export function selectManualUncensoredOverride(runtime) {
  return resolveProfileForRole(runtime, "MANUAL_UNCENSORED");
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
  if (runtime.policy_version !== POLICY_VERSION) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: `policy_version must be ${POLICY_VERSION}`,
    };
  }
  if (runtime.canonical_endpoint !== CANONICAL_ENDPOINT) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "canonical_endpoint must be http://127.0.0.1:8080",
    };
  }
  if (runtime.default_profile !== STARTUP_PROFILE_ID) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "default_profile must be startup OPUS daily 16K",
    };
  }
  if (runtime.next_wf40_executor_profile_id !== NEXT_WF40_EXECUTOR_PROFILE_ID) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "next_wf40_executor_profile_id must be qwen38-dcfr-iq3-agent-24k",
    };
  }
  if (runtime.dflash2_profiles_retired !== true) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "dflash2_profiles_retired must be true",
    };
  }
  if (runtime.normal_llama_cpp_runtime_preserved !== true) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "normal_llama_cpp_runtime_preserved must be true",
    };
  }
  if (runtime.sensitive_topic_auto_selects_uncensored !== false) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "sensitive_topic_auto_selects_uncensored must be false",
    };
  }
  if (runtime.reconstruct_llama_server_commands !== false) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "reconstruct_llama_server_commands must be false",
    };
  }
  const keys = Object.keys(runtime.profiles || {});
  if (keys.length !== PROFILE_IDS.length || PROFILE_IDS.some((id) => !keys.includes(id))) {
    return {
      ok: false,
      classification: "INVALID_RUNTIME",
      reason: "profiles must be exactly the six production profile_ids",
    };
  }
  for (const id of PROFILE_IDS) {
    const checked = getProfile(runtime, id);
    if (!checked.ok) return checked;
  }
  for (const [role, profileId] of Object.entries(ROLE_TO_PROFILE_ID)) {
    if (runtime.role_to_profile_id?.[role] !== profileId) {
      return {
        ok: false,
        classification: "INVALID_RUNTIME",
        reason: `role_to_profile_id.${role} mismatch`,
      };
    }
  }
  return { ok: true, runtime };
}

export function assertFastAgentNotDcfr16k(profileId) {
  if (profileId === "qwen38-dcfr-iq3-fast-16k") {
    return {
      ok: false,
      classification: "FAST_AGENT_FALLBACK_FORBIDDEN",
      reason: "FAST_AGENT cannot silently use DCFR 16K",
    };
  }
  if (profileId !== NEXT_WF40_EXECUTOR_PROFILE_ID) {
    return {
      ok: false,
      classification: "FAST_AGENT_PROFILE_MISMATCH",
      reason: "FAST_AGENT requires qwen38-dcfr-iq3-agent-24k",
    };
  }
  return { ok: true, profileId };
}
