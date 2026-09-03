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
import {
  STARTUP_PROFILE_ID,
  loadQwenLocalRuntime,
} from "../../tools/qwen-local-runtime-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CANONICAL = loadQwenLocalRuntime();
const DEFAULT_PROFILE = STARTUP_PROFILE_ID;

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
      profile: DEFAULT_PROFILE,
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
        out.model_id === DEFAULT_PROFILE,
      JSON.stringify(out),
    );
  }

  // 2. absent -> launch once -> ready
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const out = await ensureQwenLocalReady({
      profile: DEFAULT_PROFILE,
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
      profile: DEFAULT_PROFILE,
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => {
        checks += 1;
        if (launches === 0) {
          return { ok: false, classification: "API_UNREACHABLE" };
        }
        return { ok: true, classification: "READY" };
      },
      launchLauncher: async () => {
        launches += 1;
        await new Promise((r) => setTimeout(r, 5));
        return { pid: 3 };
      },
      existsPath: () => true,
      readinessTimeoutMs: 2000,
      pollIntervalMs: 1,
      sleepFn: async () => {},
    };
    const [a, b] = await Promise.all([
      ensureQwenLocalReady(deps),
      ensureQwenLocalReady(deps),
    ]);
    check(
      "03-concurrent-single-launch",
      launches === 1 && a.ready === true && b.ready === true && checks >= 2,
      JSON.stringify({ launches, checks, a: a.status, b: b.status }),
    );
  }

  // 4. launcher missing
  {
    __resetSessionManagerLockForTests();
    const out = await ensureQwenLocalReady({
      profile: DEFAULT_PROFILE,
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({ ok: false }),
      launchLauncher: async () => ({ pid: 1 }),
      existsPath: () => false,
      sleepFn: async () => {},
    });
    check(
      "04-launcher-missing",
      out.ready === false &&
        (out.status === "LAUNCHER_NOT_FOUND" || out.status === "LAUNCH_FAILED") &&
        out.launch_performed === false,
      JSON.stringify(out),
    );
  }

  // 5. launch fails
  {
    __resetSessionManagerLockForTests();
    const out = await ensureQwenLocalReady({
      profile: DEFAULT_PROFILE,
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({ ok: false }),
      launchLauncher: async () => {
        throw new Error("launch boom");
      },
      existsPath: () => true,
      sleepFn: async () => {},
    });
    check(
      "05-launch-failed",
      out.ready === false && out.status === "LAUNCH_FAILED",
      JSON.stringify(out),
    );
  }

  // 6. readiness timeout
  {
    __resetSessionManagerLockForTests();
    const out = await ensureQwenLocalReady({
      profile: DEFAULT_PROFILE,
      loadRuntime: () => CANONICAL,
      checkReadiness: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
      launchLauncher: async () => ({ pid: 9 }),
      existsPath: () => true,
      readinessTimeoutMs: 20,
      pollIntervalMs: 5,
      sleepFn: async () => {},
    });
    check(
      "06-readiness-timeout",
      out.ready === false &&
        (out.status === "READINESS_TIMEOUT" ||
          out.status === "API_UNREACHABLE") &&
        out.launch_performed === true,
      JSON.stringify(out),
    );
  }

  // 7. invalid runtime config
  {
    __resetSessionManagerLockForTests();
    const out = await ensureQwenLocalReady({
      profile: DEFAULT_PROFILE,
      loadRuntime: () => ({ schema_version: "nope" }),
      checkReadiness: async () => ({ ok: true }),
      launchLauncher: async () => ({ pid: 1 }),
      existsPath: () => true,
    });
    check(
      "07-invalid-runtime",
      out.status === "INVALID_RUNTIME_CONFIG" && out.ready === false,
      JSON.stringify(out),
    );
  }

  // 8. unknown profile
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const out = await ensureQwenLocalReady({
      profile: "fast_8k",
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

  // 9. dflash_required=true is retired
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const rt = cloneRuntime((r) => {
      r.profiles[DEFAULT_PROFILE].dflash_required = true;
    });
    const out = await ensureQwenLocalReady({
      profile: DEFAULT_PROFILE,
      loadRuntime: () => rt,
      checkReadiness: async () => ({ ok: true }),
      launchLauncher: async () => {
        launches += 1;
        return { pid: 1 };
      },
      existsPath: () => true,
    });
    check(
      "09-dflash-required-true-retired",
      (out.status === "DFLASH_REQUIRED" || out.status === "INVALID_RUNTIME_CONFIG") &&
        out.ready === false &&
        launches === 0,
      JSON.stringify(out),
    );
  }

  // 10-12 exact profile model ids
  {
    const daily = CANONICAL.profiles[DEFAULT_PROFILE].llama_cpp_model_id;
    const agent24 = CANONICAL.profiles["qwen38-opus-q3-agent-24k"].llama_cpp_model_id;
    const dcfrAgent = CANONICAL.profiles["qwen38-dcfr-iq3-agent-24k"].llama_cpp_model_id;
    check(
      "10-daily-from-runtime-config",
      daily === DEFAULT_PROFILE &&
        !readFileSync(
          resolve(ROOT, "tools/qwen-local-session-manager-v1.mjs"),
          "utf8",
        ).includes('modelId = "qwen38-original-dflash2-8k"'),
      `daily=${daily}`,
    );

    __resetSessionManagerLockForTests();
    const out24 = await ensureQwenLocalReady({
      profile: "qwen38-opus-q3-agent-24k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async ({ modelId }) => ({
        ok: modelId === agent24,
        classification: modelId === agent24 ? "READY" : "PROFILE_NOT_EXPOSED",
      }),
      launchLauncher: async () => ({ pid: 1 }),
      existsPath: () => true,
    });
    check(
      "11-opus-agent-24k-resolution",
      out24.ready === true && out24.model_id === agent24,
      JSON.stringify(out24),
    );

    __resetSessionManagerLockForTests();
    const outFastAgent = await ensureQwenLocalReady({
      profile: "qwen38-dcfr-iq3-agent-24k",
      loadRuntime: () => CANONICAL,
      checkReadiness: async ({ modelId }) => ({
        ok: modelId === dcfrAgent,
        classification: modelId === dcfrAgent ? "READY" : "PROFILE_NOT_EXPOSED",
      }),
      launchLauncher: async () => ({ pid: 1 }),
      existsPath: () => true,
    });
    check(
      "12-dcfr-agent-24k-resolution",
      outFastAgent.ready === true && outFastAgent.model_id === dcfrAgent,
      JSON.stringify(outFastAgent),
    );
  }

  // 13. healthy server never restarted
  {
    __resetSessionManagerLockForTests();
    let launches = 0;
    const deps = {
      profile: DEFAULT_PROFILE,
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

  // 14. uncensored retained; no reconstruct; dflash profiles retired
  {
    __resetSessionManagerLockForTests();
    const src = readFileSync(
      resolve(ROOT, "tools/qwen-local-session-manager-v1.mjs"),
      "utf8",
    );
    const uncensored = CANONICAL.profiles["qwen38-uncensored-ar-16k"];
    const ok =
      CANONICAL.dflash2_profiles_retired === true &&
      CANONICAL.reconstruct_llama_server_commands === false &&
      uncensored.keep_in_selector === true &&
      uncensored.selection === "explicit_user_choice" &&
      uncensored.auto_route_sensitive_topics === false &&
      Object.values(CANONICAL.profiles).every((p) => p.dflash_required !== true) &&
      !src.includes("ar_fallback_forbidden");
    check("14-uncensored-retained-no-reconstruct", ok, "policy drift");
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
