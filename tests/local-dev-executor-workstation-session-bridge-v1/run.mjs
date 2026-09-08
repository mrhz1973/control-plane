#!/usr/bin/env node
/**
 * Deterministic offline tests for the workstation DEV session bridge.
 * No Qwen. No OpenCode. No service start/stop. No network (readiness via
 * injectable fakes). Headless router path only for DEV ensure.
 *
 * Run: node tests/local-dev-executor-workstation-session-bridge-v1/run.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ensureQwenLocalReady,
  ensureWorkstationDevQwenReady,
  ensureWorkstationDevRouterReady,
  resolveWorkstationDevProfile,
  resolveDevRouterPaths,
  resolvePythonExecutable,
  __resetDevSessionManagerLockForTests,
  __resetSessionManagerLockForTests,
} from "../../tools/qwen-local-session-manager-v1.mjs";
import { loadQwenLocalRuntime } from "../../tools/qwen-local-runtime-v1.mjs";
import { makeEnsureQwenReady } from "../../tools/run-local-dev-executor-v1.mjs";

let passed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    failures.push(name);
    process.stdout.write(`FAIL ${name}: ${err?.message || err}\n`);
  }
}

const REAL_RUNTIME = loadQwenLocalRuntime();
const DEV_PROFILE = "qwen38-opus-q3-opencode-64k";

function reset() {
  __resetDevSessionManagerLockForTests();
  __resetSessionManagerLockForTests();
}

const BRIDGE_OPTS = {
  loadRuntime: () => REAL_RUNTIME,
  existsPath: () => true,
  sleepFn: async () => {},
  readinessTimeoutMs: 10,
  pollIntervalMs: 1,
  pythonExecutable: "python.exe",
};

await test("workstation DEV profile resolves successfully via bridge", async () => {
  reset();
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: async ({ modelId }) => ({ ok: true, classification: "READY", ids: [modelId] }),
    profile: DEV_PROFILE,
  });
  assert.equal(r.ready, true);
  assert.equal(r.status, "READY");
  assert.equal(r.profile, DEV_PROFILE);
  assert.equal(r.model_id, DEV_PROFILE);
  assert.equal(r.launch_count, 0);
});

await test("resolveWorkstationDevProfile returns profile + model id", () => {
  const r = resolveWorkstationDevProfile(REAL_RUNTIME, DEV_PROFILE);
  assert.equal(r.ok, true);
  assert.equal(r.profile.category, "workstation_dev_executor_profile");
  assert.equal(r.model_id, DEV_PROFILE);
});

await test("production profile rejected by DEV session bridge", async () => {
  reset();
  const calls = [];
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: async (args) => { calls.push(args); return { ok: true, classification: "READY", ids: [args.modelId] }; },
    profile: "qwen38-opus-q3-agent-24k",
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "DEV_PROFILE_INVALID");
  assert.equal(calls.length, 0);
});

await test("wrong/missing DEV category rejected", () => {
  const wrongCat = resolveWorkstationDevProfile(
    { workstation_manual_profiles: { p1: { category: "control_plane_eligible_profile" } } }, "p1",
  );
  assert.equal(wrongCat.ok, false);
  const prodFlags = resolveWorkstationDevProfile(
    { workstation_manual_profiles: { p3: { category: "workstation_dev_executor_profile", control_plane_eligible: true } } }, "p3",
  );
  assert.equal(prodFlags.ok, false);
});

await test("missing profile id rejected fail-closed", async () => {
  reset();
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: async () => ({ ok: true, classification: "READY" }),
    profile: "",
  });
  assert.equal(r.status, "DEV_PROFILE_INVALID");
});

await test("router already healthy -> reuse, zero launches", async () => {
  reset();
  let launchCount = 0;
  const r = await ensureWorkstationDevRouterReady({
    ...BRIDGE_OPTS,
    checkRouterApi: async () => ({ ok: true, classification: "ROUTER_API_HEALTHY", http_status: 200, ids: [] }),
    launchHeadlessRouter: async () => { launchCount += 1; },
    checkEndpointOccupied: async () => false,
  });
  assert.equal(r.ready, true);
  assert.equal(r.status, "READY");
  assert.equal(r.launch_count, 0);
  assert.equal(launchCount, 0);
});

await test("router absent + port free -> headless router launch exactly once, then READY", async () => {
  reset();
  let launchCount = 0;
  const r = await ensureWorkstationDevRouterReady({
    ...BRIDGE_OPTS,
    checkRouterApi: async () => (launchCount >= 1
      ? { ok: true, classification: "ROUTER_API_HEALTHY", http_status: 200, ids: [] }
      : { ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async (args) => {
      launchCount += 1;
      assert.equal(args.pythonExecutable, "python.exe");
      assert.ok(String(args.routerEntrypoint).includes("qwen_runtime_router.py"));
      assert.ok(String(args.routerConfig).includes("qwen-runtime-router.json"));
      return { pid: 42 };
    },
  });
  assert.equal(r.ready, true);
  assert.equal(r.status, "LAUNCH_STARTED_AND_READY");
  assert.equal(launchCount, 1);
  assert.equal(r.launch_count, 1);
});

await test("router port occupied by foreign process + API unhealthy -> fail closed, zero launches", async () => {
  reset();
  let launchCount = 0;
  let recycleCount = 0;
  const r = await ensureWorkstationDevRouterReady({
    ...BRIDGE_OPTS,
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => true,
    recycleCanonicalZombieRouter: async () => {
      recycleCount += 1;
      return { ok: false, recycled: false, reason_code: "FOREIGN_OR_UNKNOWN_OCCUPANT" };
    },
    launchHeadlessRouter: async () => { launchCount += 1; },
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "ENDPOINT_OCCUPIED_UNHEALTHY");
  assert.equal(r.reason_code, "FOREIGN_OR_UNKNOWN_OCCUPANT");
  assert.equal(r.launch_count, 0);
  assert.equal(launchCount, 0);
  assert.equal(recycleCount, 1);
});

await test("canonical zombie router on port -> recycle once then headless relaunch READY", async () => {
  reset();
  let launchCount = 0;
  let recycleCount = 0;
  let occupied = true;
  const r = await ensureWorkstationDevRouterReady({
    ...BRIDGE_OPTS,
    checkRouterApi: async () => (launchCount >= 1
      ? { ok: true, classification: "ROUTER_API_HEALTHY", http_status: 200, ids: [] }
      : { ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => occupied,
    recycleCanonicalZombieRouter: async () => {
      recycleCount += 1;
      occupied = false;
      return { ok: true, recycled: true, reason_code: "CANONICAL_ZOMBIE_RECYCLED", killed_pids: [99] };
    },
    launchHeadlessRouter: async () => {
      launchCount += 1;
      return { pid: 42 };
    },
  });
  assert.equal(r.ready, true);
  assert.equal(r.status, "LAUNCH_STARTED_AND_READY");
  assert.equal(recycleCount, 1);
  assert.equal(launchCount, 1);
  assert.equal(r.launch_count, 1);
});

await test("missing router entrypoint -> fail closed", async () => {
  reset();
  const r = await ensureWorkstationDevRouterReady({
    ...BRIDGE_OPTS,
    existsPath: (p) => !String(p).includes("qwen_runtime_router.py"),
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async () => { throw new Error("must not launch"); },
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "ROUTER_ENTRYPOINT_NOT_FOUND");
  assert.equal(r.launch_count, 0);
});

await test("missing router config -> fail closed", async () => {
  reset();
  const r = await ensureWorkstationDevRouterReady({
    ...BRIDGE_OPTS,
    existsPath: (p) => !String(p).includes("qwen-runtime-router.json"),
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async () => { throw new Error("must not launch"); },
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "ROUTER_CONFIG_NOT_FOUND");
  assert.equal(r.launch_count, 0);
});

await test("missing/unresolvable Python -> fail closed", async () => {
  reset();
  const r = await ensureWorkstationDevRouterReady({
    ...BRIDGE_OPTS,
    pythonExecutable: "C:\\missing\\python.exe",
    existsPath: (p) => !String(p).toLowerCase().includes("python.exe"),
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async () => { throw new Error("must not launch"); },
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "PYTHON_NOT_FOUND");
  assert.equal(r.launch_count, 0);
  const py = resolvePythonExecutable({
    pythonExecutable: "C:\\missing\\python.exe",
    existsPath: () => false,
  });
  assert.equal(py.ok, false);
});

await test("pythoncore-3.14-64 LOCALAPPDATA fallback is selected when it exists", () => {
  const localApp = process.env.LOCALAPPDATA || "C:\\Users\\fixture\\AppData\\Local";
  const core314 = join(localApp, "Python", "pythoncore-3.14-64", "python.exe");
  const py = resolvePythonExecutable({
    existsPath: (p) => p === core314,
  });
  assert.equal(py.ok, true);
  assert.equal(py.python_executable, core314);
  assert.ok(String(py.python_executable).includes(join("Python", "pythoncore-3.14-64", "python.exe")));
});

await test("explicit injected valid Python wins over LOCALAPPDATA fallbacks", () => {
  const localApp = process.env.LOCALAPPDATA || "C:\\Users\\fixture\\AppData\\Local";
  const core314 = join(localApp, "Python", "pythoncore-3.14-64", "python.exe");
  const injected = join(localApp, "custom", "python.exe");
  const py = resolvePythonExecutable({
    pythonExecutable: injected,
    existsPath: (p) => p === injected || p === core314,
  });
  assert.equal(py.ok, true);
  assert.equal(py.python_executable, injected);
});

await test("no resolvable Python with existsPath probe -> fail closed", () => {
  const py = resolvePythonExecutable({ existsPath: () => false });
  assert.equal(py.ok, false);
  assert.equal(py.reason_code, "PYTHON_NOT_FOUND");
});

await test("exact DEV profile already exposed -> READY, zero launch", async () => {
  reset();
  let launchCount = 0;
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: async ({ modelId }) => ({ ok: true, classification: "READY", ids: [modelId] }),
    ensureDevRouterReady: async () => { launchCount += 1; return { ready: true, status: "READY", launch_count: 1 }; },
    profile: DEV_PROFILE,
  });
  assert.equal(r.ready, true);
  assert.equal(r.launch_count, 0);
  assert.equal(launchCount, 0);
});

await test("API absent -> one router restore -> exact requested profile becomes READY", async () => {
  reset();
  let routerLaunches = 0;
  let profileReady = false;
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: async ({ modelId }) => {
      if (!profileReady) return { ok: false, classification: "API_UNREACHABLE" };
      return { ok: true, classification: "READY", http_status: 200, ids: [modelId] };
    },
    ensureDevRouterReady: async () => {
      routerLaunches += 1;
      profileReady = true;
      return { ready: true, status: "LAUNCH_STARTED_AND_READY", launch_performed: true, launch_count: 1 };
    },
    profile: DEV_PROFILE,
  });
  assert.equal(r.ready, true);
  assert.equal(r.status, "LAUNCH_STARTED_AND_READY");
  assert.equal(routerLaunches, 1);
  assert.equal(r.launch_count, 1);
  assert.equal(r.profile, DEV_PROFILE);
  assert.equal(r.model_id, DEV_PROFILE);
});

await test("router healthy + exact requested profile absent -> exact load attempt, fail closed, zero launch", async () => {
  reset();
  let routerCalls = 0;
  let loadCalls = 0;
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: async () => ({
      ok: false,
      classification: "PROFILE_NOT_EXPOSED",
      http_status: 200,
      ids: ["other-model"],
    }),
    ensureDevRouterReady: async () => { routerCalls += 1; return { ready: true, status: "READY", launch_count: 0 }; },
    loadExactProfile: async ({ modelId }) => {
      loadCalls += 1;
      assert.equal(modelId, DEV_PROFILE);
      return { ok: false, classification: "PROFILE_LOAD_REJECTED", http_status: 404 };
    },
    profile: DEV_PROFILE,
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "PROFILE_LOAD_REJECTED");
  assert.equal(r.load_performed, true);
  assert.equal(r.launch_count, 0);
  assert.equal(routerCalls, 0);
  assert.equal(loadCalls, 1);
});

await test("wrong profile exposed -> exact load then READY without fallback", async () => {
  reset();
  let loadCalls = 0;
  let exposed = ["other-model"];
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: async ({ modelId }) => (
      exposed.includes(modelId)
        ? { ok: true, classification: "READY", http_status: 200, ids: [...exposed] }
        : { ok: false, classification: "PROFILE_NOT_EXPOSED", http_status: 200, ids: [...exposed] }
    ),
    ensureDevRouterReady: async () => { throw new Error("must not restore router"); },
    loadExactProfile: async ({ modelId }) => {
      loadCalls += 1;
      exposed = [modelId];
      return { ok: true, classification: "PROFILE_LOAD_ACCEPTED", http_status: 200 };
    },
    profile: DEV_PROFILE,
  });
  assert.equal(r.ready, true);
  assert.equal(r.status, "PROFILE_LOADED_AND_READY");
  assert.equal(r.model_id, DEV_PROFILE);
  assert.equal(r.load_performed, true);
  assert.equal(loadCalls, 1);
  assert.equal(r.launch_count, 0);
});

await test("no profile fallback: requested id stays exact", async () => {
  reset();
  const seen = [];
  await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: async ({ modelId }) => {
      seen.push(modelId);
      return { ok: true, classification: "READY", ids: [modelId] };
    },
    profile: DEV_PROFILE,
  });
  assert.deepEqual(seen, [DEV_PROFILE]);
  const paths = resolveDevRouterPaths(REAL_RUNTIME, { existsPath: () => true });
  assert.equal(paths.ok, true);
});

await test("current production role-map drift does NOT block DEV session resolution", async () => {
  reset();
  const drifted = JSON.parse(JSON.stringify(REAL_RUNTIME));
  drifted.role_to_profile_id = { ...drifted.role_to_profile_id, FAST_AGENT: "qwen38-dcfr-iq3-agent-24k" };
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    loadRuntime: () => drifted,
    checkReadiness: async ({ modelId }) => ({ ok: true, classification: "READY", ids: [modelId] }),
    profile: DEV_PROFILE,
  });
  assert.equal(r.ready, true);
});

await test("production ensureQwenLocalReady behavior remains unchanged", async () => {
  reset();
  const makeCheck = () => async ({ modelId }) => ({ ok: true, classification: "READY", http_status: 200, ids: [modelId] });
  const drifted = JSON.parse(JSON.stringify(REAL_RUNTIME));
  drifted.role_to_profile_id = { ...drifted.role_to_profile_id, FAST_AGENT: "qwen38-dcfr-iq3-agent-24k" };
  const r = await ensureQwenLocalReady({
    loadRuntime: () => drifted,
    checkReadiness: makeCheck(),
    existsPath: () => true,
    profile: "qwen38-opus-q3-agent-24k",
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "INVALID_RUNTIME_CONFIG");
  const aligned = JSON.parse(JSON.stringify(REAL_RUNTIME));
  aligned.role_to_profile_id = { ...aligned.role_to_profile_id, FAST_AGENT: "qwen38-opus-q3-agent-24k" };
  const r2 = await ensureQwenLocalReady({
    loadRuntime: () => aligned,
    checkReadiness: makeCheck(),
    existsPath: () => true,
    profile: "qwen38-opus-q3-agent-24k",
  });
  assert.equal(r2.ready, true);
  assert.equal(r2.launch_performed, false);
});

await test("makeEnsureQwenReady default uses the DEV bridge", async () => {
  reset();
  const ensure = makeEnsureQwenReady(async (opts) =>
    ensureWorkstationDevQwenReady({
      ...BRIDGE_OPTS,
      checkReadiness: async ({ modelId }) => ({ ok: true, classification: "READY", ids: [modelId] }),
      ...opts,
    }));
  const s = await ensure({ profile: DEV_PROFILE });
  assert.equal(s.ready, true);
  assert.equal(s.router_was_running, true);
});

await test("test suite performs zero Qwen generations and zero real service start/stop", () => {
  const src = readFileSync(new URL("./run.mjs", import.meta.url), "utf8");
  assert.ok(!src.includes(["startLocalDev", "GenerationGuard"].join("")));
  assert.ok(!src.includes(["opencode", ".cmd"].join("")));
  assert.ok(!src.includes(["Start-Qwen", "-MultiModel"].join("")));
  assert.ok(src.includes("checkReadiness:"));
  assert.ok(src.includes("launchHeadlessRouter:"));
  assert.ok(src.includes("ensureDevRouterReady:"));
  assert.ok(!src.includes(["/v1/chat/", "completions"].join("")));
});

await test("headless bootstrap source is router-only and operationally safe", () => {
  const bootstrapPath = new URL("../../tools/qwen-dev-headless-bootstrap-v1.mjs", import.meta.url);
  const src = readFileSync(bootstrapPath, "utf8");
  assert.ok(src.includes("ensureWorkstationDevRouterReady"));
  assert.ok(!src.includes(["Start-Qwen", "-MultiModel"].join("")));
  assert.ok(!src.toLowerCase().includes("msedge"));
  assert.ok(!src.includes("Stop-Process"));
  assert.ok(!src.toLowerCase().includes("opencode"));
  assert.ok(!src.includes(["/v1/chat/", "completions"].join("")));
  assert.ok(!src.includes(["/v1/", "responses"].join("")));
});

await test("headless bootstrap thrown error normalizes to bounded BOOTSTRAP_ERROR", async () => {
  const { runDevHeadlessBootstrap, BOOTSTRAP_SCHEMA } = await import("../../tools/qwen-dev-headless-bootstrap-v1.mjs");
  const long = `X${"boom".repeat(40)}`;
  const out = await runDevHeadlessBootstrap({
    ensureDevRouterReady: async () => {
      throw new Error(long);
    },
  });
  assert.equal(out.schema_version, BOOTSTRAP_SCHEMA);
  assert.equal(out.status, "BOOTSTRAP_ERROR");
  assert.equal(out.ready, false);
  assert.equal(out.base_url, null);
  assert.equal(out.launch_performed, false);
  assert.equal(out.launch_count, 0);
  assert.equal(out.wait_elapsed_ms, 0);
  assert.ok(typeof out.reason_code === "string");
  assert.ok(out.reason_code.length <= 80);
  assert.ok(!out.reason_code.includes("\n"));
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
process.exit(failures.length ? 1 : 0);
