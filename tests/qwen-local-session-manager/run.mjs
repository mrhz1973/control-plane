#!/usr/bin/env node
/**
 * Offline tests for qwen-local-session-manager-v1.
 * Launch + HTTP readiness are mocked. No live generation. No process kill.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureQwenLocalReady,
  __resetSessionManagerLockForTests,
} from "../../tools/qwen-local-session-manager-v1.mjs";
import { loadQwenLocalRuntime } from "../../tools/qwen-local-runtime-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CANONICAL = loadQwenLocalRuntime();

function cloneRuntime(mutator) {
  const rt = JSON.parse(JSON.stringify(CANONICAL));
  if (mutator) mutator(rt);
  return rt;
}

const results = [];
function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

async function run() {
  // 1. already READY
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const out = await ensureQwenLocalReady({
      profile: "fast_8k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({ ok: true, classification: "READY" }),
      launchLauncher: async () => {
        launches += 1;
        return { pid: 1 };
      },
      existsPath: () => true,
      sleepFn: async () => {},
    });
    check(
      "01-already-ready-no-launch",
      out.ready === true &&
        out.status === "READY" &&
        out.launch_performed === false &&
        out.launch_count === 0 &&
        launches === 0 &&
        out.model_id === "qwen38-original-dflash2-8k",
      JSON.stringify(out),
    );
  }

  // 2. absent -> launch once -> ready
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const out = await ensureQwenLocalReady({
      profile: "fast_8k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => {
        if (launches === 0) {
          return { ok: false, classification: "API_UNREACHABLE" };
        }
        return { ok: true, classification: "READY" };
      },
      launchLauncher: async () => {
        launches += 1;
        return { pid: 2 };
      },
      existsPath: () => true,
      readinessTimeoutMs: 1000,
      pollIntervalMs: 1,
      sleepFn: async () => {},
    });
    check(
      "02-absent-launch-once-ready",
      out.ready === true &&
        out.status === "LAUNCH_STARTED_AND_READY" &&
        out.launch_performed === true &&
        out.launch_count === 1 &&
        launches === 1,
      JSON.stringify({ out, launches }),
    );
  }

  // 3. concurrent ensure while absent -> one launch
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    let checks = 0;
    const deps = {
      profile: "fast_8k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => {
        checks += 1;
        // first wave: not ready; after launch polls become ready
        if (launches === 0) return { ok: false, classification: "API_UNREACHABLE" };
        return { ok: true, classification: "READY" };
      },
      launchLauncher: async () => {
        launches += 1;
        await new Promise((r) => setTimeout(r, 30));
        return { pid: 3 };
      },
      existsPath: () => true,
      readinessTimeoutMs: 2000,
      pollIntervalMs: 5,
      sleepFn: async (ms) => new Promise((r) => setTimeout(r, ms)),
    };
    const [a, b] = await Promise.all([
      ensureQwenLocalReady(deps),
      ensureQwenLocalReady(deps),
    ]);
    check(
      "03-concurrent-single-launch",
      launches === 1 && a.ready === true && b.ready === true,
      JSON.stringify({ launches, a: a.status, b: b.status, checks }),
    );
  }

  // 4. launcher missing
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const out = await ensureQwenLocalReady({
      profile: "fast_8k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
      launchLauncher: async () => {
        launches += 1;
        return { pid: 1 };
      },
      existsPath: () => false,
      sleepFn: async () => {},
    });
    check(
      "04-launcher-not-found",
      out.status === "LAUNCHER_NOT_FOUND" &&
        out.ready === false &&
        launches === 0 &&
        out.launch_count === 0,
      JSON.stringify(out),
    );
  }

  // 5. launch process fails
  {
    __resetSessionManagerLockForTests();
    const out = await ensureQwenLocalReady({
      profile: "fast_8k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
      launchLauncher: async () => {
        throw new Error("spawn failed");
      },
      existsPath: () => true,
      sleepFn: async () => {},
    });
    check(
      "05-launch-failed",
      out.status === "LAUNCH_FAILED" && out.ready === false && out.launch_count === 0,
      JSON.stringify(out),
    );
  }

  // 6. readiness timeout
  {
    __resetSessionManagerLockForTests();
    const out = await ensureQwenLocalReady({
      profile: "fast_8k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
      launchLauncher: async () => ({ pid: 1 }),
      existsPath: () => true,
      readinessTimeoutMs: 20,
      pollIntervalMs: 5,
      sleepFn: async (ms) => new Promise((r) => setTimeout(r, ms)),
    });
    check(
      "06-readiness-timeout",
      (out.status === "READINESS_TIMEOUT" || out.status === "API_UNREACHABLE") &&
        out.ready === false &&
        out.launch_performed === true &&
        out.launch_count === 1,
      JSON.stringify(out),
    );
  }

  // 7. API ready but model absent
  {
    __resetSessionManagerLockForTests();
    const out = await ensureQwenLocalReady({
      profile: "fast_8k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({
        ok: false,
        classification: "PROFILE_NOT_EXPOSED",
        http_status: 200,
      }),
      launchLauncher: async () => ({ pid: 1 }),
      existsPath: () => true,
      readinessTimeoutMs: 20,
      pollIntervalMs: 5,
      sleepFn: async (ms) => new Promise((r) => setTimeout(r, ms)),
    });
    check(
      "07-profile-not-exposed",
      out.status === "PROFILE_NOT_EXPOSED" &&
        out.ready === false &&
        out.launch_performed === true,
      JSON.stringify(out),
    );
  }

  // 8. unknown profile
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const out = await ensureQwenLocalReady({
      profile: "turbo_64k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({ ok: true }),
      launchLauncher: async () => {
        launches += 1;
        return { pid: 1 };
      },
      existsPath: () => true,
    });
    check(
      "08-unknown-profile",
      out.status === "INVALID_PROFILE" && out.ready === false && launches === 0,
      JSON.stringify(out),
    );
  }

  // 9. dflash_required=false
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const rt = cloneRuntime((r) => {
      r.profiles.fast_8k.dflash_required = false;
      r.profiles.fast_8k.spec_type = "none";
    });
    const out = await ensureQwenLocalReady({
      profile: "fast_8k",
      loadRuntime: () => rt,
      checkReadiness: async () => ({ ok: true }),
      launchLauncher: async () => {
        launches += 1;
        return { pid: 1 };
      },
      existsPath: () => true,
    });
    // validateRuntimeDocument fails first OR getProfile returns DFLASH_REQUIRED
    check(
      "09-dflash-required-false",
      (out.status === "DFLASH_REQUIRED" || out.status === "INVALID_RUNTIME_CONFIG") &&
        out.ready === false &&
        launches === 0,
      JSON.stringify(out),
    );
  }

  // 10-12 profile model ids from runtime config
  {
    const fast = CANONICAL.profiles.fast_8k.llama_cpp_model_id;
    const bal = CANONICAL.profiles.balanced_16k.llama_cpp_model_id;
    const lng = CANONICAL.profiles.long_32k.llama_cpp_model_id;
    check(
      "10-fast-8k-from-runtime-config",
      fast === "qwen38-original-dflash2-8k" &&
        !readFileSync(
          resolve(ROOT, "tools/qwen-local-session-manager-v1.mjs"),
          "utf8",
        ).includes('modelId = "qwen38-original-dflash2-8k"'),
      `fast=${fast}`,
    );

    __resetSessionManagerLockForTests();
    const out16 = await ensureQwenLocalReady({
      profile: "balanced_16k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async ({ modelId }) => ({
        ok: modelId === bal,
        classification: modelId === bal ? "READY" : "PROFILE_NOT_EXPOSED",
      }),
      launchLauncher: async () => ({ pid: 1 }),
      existsPath: () => true,
    });
    check(
      "11-balanced-16k-resolution",
      out16.ready === true && out16.model_id === bal && bal === "qwen38-original-dflash2-16k",
      JSON.stringify(out16),
    );

    __resetSessionManagerLockForTests();
    const out32 = await ensureQwenLocalReady({
      profile: "long_32k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async ({ modelId }) => ({
        ok: modelId === lng,
        classification: modelId === lng ? "READY" : "PROFILE_NOT_EXPOSED",
      }),
      launchLauncher: async () => ({ pid: 1 }),
      existsPath: () => true,
    });
    check(
      "12-long-32k-resolution",
      out32.ready === true && out32.model_id === lng && lng === "qwen38-original-dflash2-32k",
      JSON.stringify(out32),
    );
  }

  // 13. healthy server never restarted (second ensure still launch_count=0)
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const deps = {
      profile: "fast_8k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({ ok: true, classification: "READY" }),
      launchLauncher: async () => {
        launches += 1;
        return { pid: 1 };
      },
      existsPath: () => true,
    };
    const a = await ensureQwenLocalReady(deps);
    const b = await ensureQwenLocalReady(deps);
    check(
      "13-healthy-never-restarted",
      a.status === "READY" &&
        b.status === "READY" &&
        launches === 0 &&
        a.launch_count === 0 &&
        b.launch_count === 0,
      JSON.stringify({ launches, a: a.status, b: b.status }),
    );
  }

  // 14. no AR fallback — ar_fallback_forbidden must hold; AR model ids never selected
  {
    __resetSessionManagerLockForTests();
    const src = readFileSync(
      resolve(ROOT, "tools/qwen-local-session-manager-v1.mjs"),
      "utf8",
    );
    const noArFallback =
      CANONICAL.ar_fallback_forbidden === true &&
      !src.includes("original-ar-") &&
      Object.values(CANONICAL.profiles).every((p) => p.dflash_required === true);
    check("14-no-ar-fallback", noArFallback, "AR fallback possible");
  }

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
}

run().catch((err) => {
  console.error(String(err && err.stack ? err.stack : err));
  process.exit(1);
});
