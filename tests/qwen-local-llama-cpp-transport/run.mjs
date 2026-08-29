#!/usr/bin/env node
/**
 * V4 — offline tests for llama.cpp primary qwen_local transport/profile policy.
 * Generation calls: zero.
 */
import {
  resolveQwenLocalBackend,
  validateBackend,
} from "../../tools/qwen-local-adapter-v1.mjs";
import {
  CONTEXT_TOKENS,
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
  "fast-8k-canonical-default",
  runtimeOk.ok === true && runtime.default_profile === "fast_8k",
  runtimeOk.reason || `default=${runtime.default_profile}`,
);

const dflashAll = ["fast_8k", "balanced_16k", "long_32k"].every((id) => {
  const p = getProfile(runtime, id);
  return p.ok && p.profile.dflash_required === true;
});
check("all-normal-profiles-require-dflash", dflashAll, "dflash_required missing");

const contextsOk =
  getProfile(runtime, "fast_8k").profile.context_tokens === 8192 &&
  getProfile(runtime, "balanced_16k").profile.context_tokens === 16384 &&
  getProfile(runtime, "long_32k").profile.context_tokens === 32768 &&
  CONTEXT_TOKENS.length === 3;
check("context-token-values-validate", contextsOk, "context token mismatch");

check(
  "unknown-backend-fail",
  validateBackend("remote_gateway").ok === false,
  "unknown backend should fail",
);

const badDflash = validateProfilePolicy(
  {
    backend: "llama_cpp",
    dflash_required: false,
    context_tokens: 8192,
    spec_type: "none",
  },
  "synthetic",
);
check(
  "profile-dflash-required-false-fail",
  badDflash.ok === false && badDflash.classification === "DFLASH_REQUIRED",
  `got ${badDflash.classification}`,
);

check(
  "unknown-profile-fail",
  getProfile(runtime, "turbo_64k").ok === false,
  "unknown profile should fail",
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
