#!/usr/bin/env node
/**
 * V4 — offline tests for six-profile qwen_local router transport/policy.
 * Generation calls: zero.
 */
import {
  resolveQwenLocalBackend,
  validateBackend,
} from "../../tools/qwen-local-adapter-v1.mjs";
import {
  PROFILE_IDS,
  STARTUP_PROFILE_ID,
  getProfile,
  loadQwenLocalRuntime,
  validateProfilePolicy,
  validateRuntimeDocument,
} from "../../tools/qwen-local-runtime-v1.mjs";

const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

const prevBackend = process.env.QWEN_LOCAL_BACKEND;
delete process.env.QWEN_LOCAL_BACKEND;

check(
  "default-backend-llama-cpp",
  resolveQwenLocalBackend({}) === "llama_cpp",
  `got ${resolveQwenLocalBackend({})}`,
);

check(
  "explicit-backend-ollama-supported",
  resolveQwenLocalBackend({ backend: "ollama" }) === "ollama" &&
    validateBackend("ollama").ok === true,
  "ollama backend not accepted",
);

const runtime = loadQwenLocalRuntime();
const runtimeOk = validateRuntimeDocument(runtime);
check(
  "startup-opus-daily-default",
  runtimeOk.ok === true && runtime.default_profile === STARTUP_PROFILE_ID,
  runtimeOk.reason || `default=${runtime.default_profile}`,
);

const noDflashRequired = PROFILE_IDS.every((id) => {
  const p = getProfile(runtime, id);
  return p.ok && p.profile.dflash_required !== true;
});
check("no-profile-requires-dflash", noDflashRequired, "dflash_required still true");

const contextsOk =
  getProfile(runtime, "qwen38-opus-q3-daily-16k").profile.context_tokens === 16384 &&
  getProfile(runtime, "qwen38-opus-q3-agent-24k").profile.context_tokens === 24576 &&
  getProfile(runtime, "qwen38-dcfr-iq3-fast-16k").profile.context_tokens === 16384 &&
  getProfile(runtime, "qwen38-dcfr-iq3-agent-24k").profile.context_tokens === 24576;
check("context-token-values-validate", contextsOk, "context token mismatch");

check(
  "unknown-backend-fail",
  validateBackend("remote_gateway").ok === false,
  "unknown backend should fail",
);

const retiredDflash = validateProfilePolicy(
  {
    backend_lane: "normal_llama_cpp",
    dflash_required: true,
    context_tokens: 8192,
    llama_cpp_model_id: "synthetic",
    keep_in_selector: true,
  },
  "synthetic",
);
check(
  "profile-dflash-required-true-fail",
  retiredDflash.ok === false && retiredDflash.classification === "DFLASH_PROFILE_RETIRED",
  `got ${retiredDflash.classification}`,
);

check(
  "unknown-profile-fail",
  getProfile(runtime, "fast_8k").ok === false,
  "legacy fast_8k should fail",
);

check(
  "normal-llama-runtime-preserved",
  runtime.normal_llama_cpp_runtime_preserved === true &&
    String(runtime.launcher.normal_server_executable || "").includes("llama.cpp-dflash2"),
  "normal runtime path",
);

if (prevBackend === undefined) {
  delete process.env.QWEN_LOCAL_BACKEND;
} else {
  process.env.QWEN_LOCAL_BACKEND = prevBackend;
}

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
}
const summary = {
  ok: failed.length === 0,
  classification: failed.length === 0 ? "PASS" : "FAIL",
  passed: results.filter((r) => r.pass).length,
  failed: failed.length,
  total: results.length,
};
console.log(JSON.stringify(summary));
process.exit(failed.length === 0 ? 0 : 1);
