#!/usr/bin/env node
/**
 * Targeted offline suite: six-profile MultiModel router Control Plane policy.
 * No Qwen generation. No OpenCode. No provider/Telegram/register calls.
 */
import {
  PROFILE_IDS,
  ROLE_TO_PROFILE_ID,
  NEXT_WF40_EXECUTOR_PROFILE_ID,
  STARTUP_PROFILE_ID,
  CANONICAL_ENDPOINT,
  POLICY_VERSION,
  assertFastAgentNotDcfr16k,
  getProfile,
  loadQwenLocalModelPolicy,
  loadQwenLocalRuntime,
  resolveProfileForRole,
  selectManualUncensoredOverride,
  selectProfileForSensitiveTopic,
  validateRuntimeDocument,
} from "../../tools/qwen-local-runtime-v1.mjs";
import {
  CANONICAL_SCOPE_DIGEST_V2,
  FIXED_AUTHORIZATION_SCOPE_V2,
  SCOPE_VERSION,
  buildScopeV2,
  canonicalScopeDigestV2,
  validateScopeV2,
} from "../../tools/qwen-execution-scope-v2.mjs";
import { buildRegisterPendingRequest } from "../../tools/build-v4-wf40-live-execution-sidecars-v1.mjs";

const results = [];
function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

const runtime = loadQwenLocalRuntime();
const policy = loadQwenLocalModelPolicy();
const runtimeOk = validateRuntimeDocument(runtime);

check(
  "policy-version",
  policy.policy_version === POLICY_VERSION && runtime.policy_version === POLICY_VERSION,
  `policy=${policy.policy_version}`,
);

check(
  "catalog-exactly-six",
  runtimeOk.ok === true &&
    PROFILE_IDS.length === 6 &&
    Object.keys(runtime.profiles).length === 6 &&
    policy.catalog.required_count === 6,
  runtimeOk.reason || "catalog size",
);

check(
  "startup-daily-opus-16k",
  runtime.startup_profile_id === STARTUP_PROFILE_ID &&
    runtime.default_profile === "qwen38-opus-q3-daily-16k",
  runtime.default_profile,
);

check(
  "endpoint-8080",
  runtime.canonical_endpoint === CANONICAL_ENDPOINT &&
    policy.source.canonical_endpoint === CANONICAL_ENDPOINT,
  runtime.canonical_endpoint,
);

const roleExpectations = {
  DAILY: "qwen38-opus-q3-daily-16k",
  QUALITY: "qwen38-opus-q3-daily-16k",
  QUALITY_AGENT_24K: "qwen38-opus-q3-agent-24k",
  FAST: "qwen38-dcfr-iq3-fast-16k",
  FAST_AGENT: "qwen38-dcfr-iq3-agent-24k",
  MCP: "qwen38-dcfr-iq3-agent-24k",
  BLENDER_FAST: "qwen38-dcfr-iq3-agent-24k",
  REFERENCE: "qwen38-original-ar-16k",
  MANUAL_UNCENSORED: "qwen38-uncensored-ar-16k",
};

for (const [role, profileId] of Object.entries(roleExpectations)) {
  const resolved = resolveProfileForRole(runtime, role);
  check(
    `role-${role}`,
    resolved.ok === true &&
      resolved.profileId === profileId &&
      ROLE_TO_PROFILE_ID[role] === profileId &&
      runtime.role_to_profile_id[role] === profileId,
    JSON.stringify(resolved),
  );
}

check(
  "uncensored-selectable",
  getProfile(runtime, "qwen38-uncensored-ar-16k").ok === true &&
    runtime.profiles["qwen38-uncensored-ar-16k"].keep_in_selector === true &&
    selectManualUncensoredOverride(runtime).ok === true,
  "uncensored missing from selector",
);

const sensitive = selectProfileForSensitiveTopic(runtime, "DAILY");
check(
  "sensitive-topic-not-uncensored",
  sensitive.ok === true && sensitive.profileId !== "qwen38-uncensored-ar-16k",
  JSON.stringify(sensitive),
);

check(
  "explicit-manual-uncensored-override",
  selectManualUncensoredOverride(runtime).profileId === "qwen38-uncensored-ar-16k" &&
    policy.uncensored_policy.auto_route_sensitive_topics === false &&
    policy.uncensored_policy.selection === "explicit_user_choice",
  "manual override policy",
);

check(
  "fast-agent-not-dcfr-16k",
  assertFastAgentNotDcfr16k(NEXT_WF40_EXECUTOR_PROFILE_ID).ok === true &&
    assertFastAgentNotDcfr16k("qwen38-dcfr-iq3-fast-16k").ok === false &&
    runtime.next_wf40_executor_profile_id === "qwen38-dcfr-iq3-agent-24k",
  "FAST_AGENT fallback",
);

const dcfrAgent = getProfile(runtime, "qwen38-dcfr-iq3-agent-24k");
check(
  "dcfr-agent-requires-dcfr-lane",
  dcfrAgent.ok === true &&
    dcfrAgent.profile.backend_lane === "dcfr_patched_llama_cpp" &&
    dcfrAgent.profile.may_not_silently_use_normal_runtime === true &&
    dcfrAgent.profile.may_not_silently_fall_back_to === "qwen38-dcfr-iq3-fast-16k",
  JSON.stringify(dcfrAgent.profile),
);

check(
  "dflash2-profiles-retired-normal-runtime-preserved",
  runtime.dflash2_profiles_retired === true &&
    runtime.normal_llama_cpp_runtime_preserved === true &&
    String(runtime.launcher.normal_server_executable || "").includes("llama.cpp-dflash2"),
  "dflash semantics",
);

check(
  "no-reconstruct-llama-commands",
  runtime.reconstruct_llama_server_commands === false,
  "reconstruct flag",
);

const scopeOk = validateScopeV2(FIXED_AUTHORIZATION_SCOPE_V2);
check(
  "scope-v2-canonical",
  scopeOk.ok === true &&
    canonicalScopeDigestV2() === CANONICAL_SCOPE_DIGEST_V2 &&
    FIXED_AUTHORIZATION_SCOPE_V2.scope_version === SCOPE_VERSION &&
    !("dflash_required" in FIXED_AUTHORIZATION_SCOPE_V2) &&
    !("qwen_profile" in FIXED_AUTHORIZATION_SCOPE_V2),
  JSON.stringify(scopeOk),
);

const badDigest = validateScopeV2(
  buildScopeV2({ max_qwen_generation_calls: 2 }),
);
check(
  "scope-digest-mismatch-fails",
  badDigest.ok === false &&
    badDigest.reason_codes.includes("AUTH_SCOPE_DIGEST_MISMATCH"),
  JSON.stringify(badDigest.reason_codes),
);

const badProfile = validateScopeV2(
  buildScopeV2({ profile_id: "qwen38-dcfr-iq3-fast-16k" }),
);
check(
  "profile-mismatch-fails",
  badProfile.ok === false &&
    (badProfile.reason_codes.includes("AUTH_PROFILE_INVALID") ||
      badProfile.reason_codes.includes("AUTH_SCOPE_DIGEST_MISMATCH")),
  JSON.stringify(badProfile.reason_codes),
);

check(
  "one-generation-retry-fallback-zero",
  FIXED_AUTHORIZATION_SCOPE_V2.max_opencode_executions === 1 &&
    FIXED_AUTHORIZATION_SCOPE_V2.max_qwen_generation_calls === 1 &&
    FIXED_AUTHORIZATION_SCOPE_V2.retry === 0 &&
    FIXED_AUTHORIZATION_SCOPE_V2.fallback === 0,
  "bounds",
);

const reg = buildRegisterPendingRequest({
  task_id: "T-SCOPE-V2",
  packet_id: "PK-SCOPE-V2",
});
check(
  "register-pending-exactly-8-keys",
  reg.ok === true &&
    Object.keys(reg.request).length === 8 &&
    reg.request.route_id === "opencode+qwen_local" &&
    reg.request.scope_digest === CANONICAL_SCOPE_DIGEST_V2,
  JSON.stringify(reg),
);

for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
}
const failed = results.filter((r) => !r.pass);
console.log(
  JSON.stringify({
    ok: failed.length === 0,
    classification: failed.length === 0 ? "PASS" : "FAIL",
    passed: results.filter((r) => r.pass).length,
    failed: failed.length,
    total: results.length,
  }),
);
process.exit(failed.length === 0 ? 0 : 1);
