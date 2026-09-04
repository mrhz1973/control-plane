#!/usr/bin/env node
/**
 * Deterministic offline tests for the workstation DEV session bridge.
 * No Qwen. No OpenCode. No service start/stop. No network (readiness via
 * injectable fakes).
 *
 * Run: node tests/local-dev-executor-workstation-session-bridge-v1/run.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ensureQwenLocalReady,
  ensureWorkstationDevQwenReady,
  resolveWorkstationDevProfile,
  __resetDevSessionManagerLockForTests,
  __resetSessionManagerLockForTests,
} from "../../tools/qwen-local-session-manager-v1.mjs";
import { loadQwenLocalRuntime } from "../../tools/qwen-local-runtime-v1.mjs";
import { makeEnsureQwenReady, composeRunners } from "../../tools/run-local-dev-executor-v1.mjs";

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

function readyCheck(ok) {
  return async ({ baseUrl, modelId }) => {
    readyCheck.calls.push({ baseUrl, modelId });
    return ok
      ? { ok: true, classification: "READY", http_status: 200, ids: [modelId] }
      : { ok: false, classification: "API_UNREACHABLE" };
  };
}
readyCheck.calls = [];

function reset() {
  readyCheck.calls = [];
  __resetDevSessionManagerLockForTests();
  __resetSessionManagerLockForTests();
}

const BRIDGE_OPTS = {
  loadRuntime: () => REAL_RUNTIME,
  existsPath: () => true,
  sleepFn: async () => {},
  readinessTimeoutMs: 10,
  pollIntervalMs: 1,
};

// ---------- 1. workstation DEV profile resolves ----------
await test("workstation DEV profile resolves successfully via bridge", async () => {
  reset();
  const check = readyCheck(true);
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS, checkReadiness: check,
    profile: "qwen38-opus-q3-cline-64k",
  });
  assert.equal(r.ready, true);
  assert.equal(r.status, "READY");
  assert.equal(r.profile, "qwen38-opus-q3-cline-64k");
  assert.equal(r.model_id, "qwen38-opus-q3-cline-64k");
  assert.equal(r.launch_performed, false);
  assert.equal(r.reason_code, "READY");
  assert.ok(r.base_url.startsWith("http://127.0.0.1"));
});

await test("resolveWorkstationDevProfile returns profile + model id", () => {
  const r = resolveWorkstationDevProfile(REAL_RUNTIME, "qwen38-opus-q3-cline-64k");
  assert.equal(r.ok, true);
  assert.equal(r.profile.category, "workstation_dev_executor_profile");
  assert.equal(r.model_id, "qwen38-opus-q3-cline-64k");
});

// ---------- 2. production profile rejected by DEV bridge ----------
await test("production profile rejected by DEV session bridge", async () => {
  reset();
  const calls = [];
  const check = async (args) => { calls.push(args); return { ok: true, classification: "READY", ids: [args.modelId] }; };
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS, checkReadiness: check,
    profile: "qwen38-opus-q3-agent-24k",
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "DEV_PROFILE_INVALID");
  assert.equal(calls.length, 0, "no readiness call for invalid profile");
});

// ---------- 3. wrong/missing category rejected ----------
await test("wrong/missing DEV category rejected", () => {
  const wrongCat = resolveWorkstationDevProfile(
    { workstation_manual_profiles: { p1: { category: "control_plane_eligible_profile" } } }, "p1",
  );
  assert.equal(wrongCat.ok, false);
  assert.equal(wrongCat.classification, "DEV_PROFILE_INVALID");
  const noCat = resolveWorkstationDevProfile(
    { workstation_manual_profiles: { p2: { purpose: "x" } } }, "p2",
  );
  assert.equal(noCat.ok, false);
  assert.ok(noCat.reason_codes.includes("CATEGORY_MISMATCH") || noCat.reason_codes.includes("DEV_PROFILE_INVALID"));
  const prodFlags = resolveWorkstationDevProfile(
    { workstation_manual_profiles: { p3: { category: "workstation_dev_executor_profile", control_plane_eligible: true } } }, "p3",
  );
  assert.equal(prodFlags.ok, false);
  assert.ok(prodFlags.reason_codes.includes("PRODUCTION_FLAGS_PRESENT"));
});

await test("missing profile id rejected fail-closed", async () => {
  reset();
  const r = await ensureWorkstationDevQwenReady({ ...BRIDGE_OPTS, checkReadiness: readyCheck(true), profile: "" });
  assert.equal(r.status, "DEV_PROFILE_INVALID");
});

// ---------- 4. healthy router -> reuse, launch_performed=false ----------
await test("existing healthy router -> reuse, launch_performed=false, no launcher", async () => {
  reset();
  let launchCount = 0;
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: readyCheck(true),
    launchLauncher: async () => { launchCount += 1; },
    profile: "qwen38-opus-q3-cline-64k",
  });
  assert.equal(r.status, "READY");
  assert.equal(r.launch_performed, false);
  assert.equal(launchCount, 0);
});

// ---------- 5. absent router -> launcher exactly once, then READY ----------
await test("absent router -> launcher called exactly once, then LAUNCH_STARTED_AND_READY", async () => {
  reset();
  let launchCount = 0;
  let readinessCalls = 0;
  const check = async ({ modelId }) => {
    readinessCalls += 1;
    // not ready before launch; ready from the poll after launch
    return launchCount >= 1
      ? { ok: true, classification: "READY", http_status: 200, ids: [modelId] }
      : { ok: false, classification: "API_UNREACHABLE" };
  };
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: check,
    launchLauncher: async () => { launchCount += 1; return { pid: 123 }; },
    profile: "qwen38-opus-q3-cline-64k",
  });
  assert.equal(r.status, "LAUNCH_STARTED_AND_READY");
  assert.equal(r.ready, true);
  assert.equal(r.launch_performed, true);
  assert.equal(launchCount, 1, "launcher must be called exactly once");
  assert.equal(r.launch_count, 1);
  assert.ok(readinessCalls >= 2);
});

// ---------- 6. readiness timeout -> fail closed ----------
await test("readiness timeout -> fail closed", async () => {
  reset();
  let launchCount = 0;
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: readyCheck(false),
    launchLauncher: async () => { launchCount += 1; },
    profile: "qwen38-opus-q3-cline-64k",
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "API_UNREACHABLE"); // last classification surfaces
  assert.equal(r.launch_performed, true);
  assert.equal(launchCount, 1);
});

// ---------- 7. launcher failure -> fail closed ----------
await test("launcher failure -> fail closed, LAUNCH_FAILED", async () => {
  reset();
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    checkReadiness: readyCheck(false),
    launchLauncher: async () => { throw new Error("spawn failed"); },
    profile: "qwen38-opus-q3-cline-64k",
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "LAUNCH_FAILED");
  assert.equal(r.launch_performed, false);
  assert.equal(r.launch_count, 0);
});

// ---------- 8. production role-map drift does NOT block DEV ----------
await test("current production role-map drift does NOT block DEV session resolution", async () => {
  reset();
  // runtime fixture reproducing the live drift: config role_to_profile_id.FAST_AGENT -> DCFR
  // while module constant says OPUS (validateRuntimeDocument fails on this).
  const drifted = JSON.parse(JSON.stringify(REAL_RUNTIME));
  drifted.role_to_profile_id = { ...drifted.role_to_profile_id, FAST_AGENT: "qwen38-dcfr-iq3-agent-24k" };
  const check = readyCheck(true);
  const r = await ensureWorkstationDevQwenReady({
    ...BRIDGE_OPTS,
    loadRuntime: () => drifted,
    checkReadiness: check,
    profile: "qwen38-opus-q3-cline-64k",
  });
  assert.equal(r.ready, true, JSON.stringify(r));
  assert.equal(r.status, "READY");
});

// ---------- 9. production session-manager default behavior unchanged ----------
await test("production ensureQwenLocalReady still validates production domain (unchanged)", async () => {
  reset();
  const makeCheck = () => async ({ modelId }) => ({ ok: true, classification: "READY", http_status: 200, ids: [modelId] });
  // drifted fixture (config FAST_AGENT -> DCFR): production path must FAIL
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
  // aligned fixture (module-constant mapping): production path works unchanged
  const aligned = JSON.parse(JSON.stringify(REAL_RUNTIME));
  aligned.role_to_profile_id = { ...aligned.role_to_profile_id, FAST_AGENT: "qwen38-opus-q3-agent-24k" };
  const r2 = await ensureQwenLocalReady({
    loadRuntime: () => aligned,
    checkReadiness: makeCheck(),
    existsPath: () => true,
    profile: "qwen38-opus-q3-agent-24k",
  });
  assert.equal(r2.ready, true, JSON.stringify(r2));
  assert.equal(r2.status, "READY");
  assert.equal(r2.launch_performed, false);
});

// ---------- 10. makeEnsureQwenReady wired to DEV bridge ----------
await test("makeEnsureQwenReady default uses the DEV bridge", async () => {
  reset();
  const check = readyCheck(true);
  const ensure = makeEnsureQwenReady(async (opts) =>
    ensureWorkstationDevQwenReady({ ...BRIDGE_OPTS, checkReadiness: check, ...opts }));
  const s = await ensure({ profile: "qwen38-opus-q3-cline-64k" });
  assert.equal(s.ready, true);
  assert.equal(s.router_was_running, true);
});

await test("composeRunners default ensureQwenReady routes DEV profiles via bridge (wiring source)", async () => {
  const src = readFileSync(new URL("../../tools/run-local-dev-executor-v1.mjs", import.meta.url), "utf8");
  assert.ok(src.includes("ensureWorkstationDevQwenReady"));
  assert.ok(!src.match(/makeEnsureQwenReady\(\s*ensureQwenLocalReady/) && !src.includes("ensureQwenLocalReady"));
});

// ---------- 11-13. zero executions in tests ----------
await test("test suite performs zero Qwen generations, zero OpenCode runs, zero service start/stop", () => {
  const src = readFileSync(new URL("./run.mjs", import.meta.url), "utf8");
  // no live guard started, no CLI/launcher binaries invoked (split literals
  // avoid self-matching this test's own source)
  assert.ok(!src.includes(["startLocalDev", "GenerationGuard"].join("")));
  assert.ok(!src.includes(["opencode", ".cmd"].join("")));
  assert.ok(!src.includes(["Start-Qwen", "-MultiModel"].join("")));
  // readiness/launcher fully injected: no default (live) implementations required
  assert.ok(src.includes("checkReadiness:"));
  assert.ok(src.includes("launchLauncher:"));
});

// ---------- summary ----------
process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
process.exit(failures.length ? 1 : 0);
