#!/usr/bin/env node
/**
 * Focused issue #89 suite — governed LOCAL_DEV Qwen idle auto-stop.
 *
 * Deterministic, offline, no real Qwen processes touched. All collaborators
 * injected. Covers the 12 required proofs:
 *   1  idle grace does NOT stop before deadline
 *   2  idle grace stops canonical owned runtime after deadline
 *   3  active dispatcher execution prevents stop
 *   4  active model request prevents stop
 *   5  established canonical active client prevents stop (TCP fence)
 *   6  new task cancels pending stop
 *   7  repeated stop is idempotent
 *   8  foreign llama-server process is never terminated
 *   9  STOPPED runtime is not started by observability (reconcile)
 *   10 next ensure after auto-stop restarts exact requested profile
 *   11 lifecycle states transition correctly
 *   12 shutdown failure is surfaced rather than hidden
 *
 * Run: node tests/qwen-local-idle-autostop-v1/run.mjs
 */
import assert from "node:assert/strict";
import {
  createQwenIdleLifecycle,
  createCanonicalQwenIdleLifecycle,
  resolveIdleShutdownMs,
  evaluateForeignClientActivity,
  DEFAULT_IDLE_SHUTDOWN_MS,
  MIN_IDLE_SHUTDOWN_MS,
  MAX_IDLE_SHUTDOWN_MS,
  LIFECYCLE_STATES,
  __resetQwenIdleLifecycleForTests,
} from "../../tools/qwen-local-idle-lifecycle-v1.mjs";
import {
  classifyCanonicalRouterOccupant,
  collectCanonicalRouterTreePids,
  defaultUnloadExactDevModel,
} from "../../tools/qwen-local-session-manager-v1.mjs";
import { performTick, wrapTickResult, REQUEST_SCHEMA } from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";
import { loadQwenLocalRuntime } from "../../tools/qwen-local-runtime-v1.mjs";

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

const ROUTER_ENTRY = "C:/Users/mrhz/Documents/AI/QWEN/qwen_runtime_router.py";
const ROUTER_CFG = "C:/Users/mrhz/Documents/AI/QWEN/qwen-runtime-router.json";

/** Canonical fake tree: router python + manager llama + worker llama on :18080. */
function canonicalProcesses({ routerPid = 101, managerPid = 202, workerPid = 303 } = {}) {
  return [
    { pid: routerPid, parentProcessId: 1, name: "python.exe", commandLine: `python -u ${ROUTER_ENTRY} --config ${ROUTER_CFG}` },
    { pid: managerPid, parentProcessId: routerPid, name: "llama-server.exe", commandLine: "llama-server.exe --host 127.0.0.1 --port 18080" },
    { pid: workerPid, parentProcessId: managerPid, name: "llama-server.exe", commandLine: "llama-server.exe --port 18080 --model qwen38" },
  ];
}

function noopIdentify({ pids } = {}) {
  return async () => {
    const procs = canonicalProcesses(pids ? { routerPid: pids.router, managerPid: pids.manager, workerPid: pids.worker } : {});
    return {
      ok: true,
      reason_code: "CANONICAL_ROUTER",
      router_pids: [pids?.router ?? 101],
      worker_pids: [pids?.manager ?? 202, pids?.worker ?? 303],
      tree_pids: pids ? [pids.router, pids.manager, pids.worker].filter(Boolean) : [101, 202, 303],
      base_url: "http://127.0.0.1:8080",
      endpoint: { base_url: "http://127.0.0.1:8080", host: "127.0.0.1", port: 8080 },
      processes: procs,
    };
  };
}

function loadedModelsStub(ids) {
  return async () => ({ ok: true, classification: "READY", loaded: ids.map((id) => ({ id, state: "loaded" })) });
}

/** Instant-virtual clock for grace-timer determinism. */
function makeClock(startMs = 1_000_000) {
  let now = startMs;
  const timers = [];
  return {
    nowMs: () => now,
    timerFn: (fn, ms) => { const t = { fn, at: now + ms, cleared: false }; timers.push(t); return t; },
    clearTimerFn: (t) => { if (t) t.cleared = true; },
    advance: async (ms) => {
      now += ms;
      for (const t of [...timers]) {
        if (!t.cleared && !t.fired && t.at <= now) { t.fired = true; await t.fn(); }
      }
    },
    timers,
  };
}

/** Stateful identify: simulates worker exit after successful unload. */
function statefulIdentify({ routerPids = [101] } = {}) {
  const identify = { workersGone: false };
  const fn = async () => {
    if (identify.workersGone) {
      // Manager exited too; bare router supervisor remains (lightweight).
      return {
        ok: true,
        reason_code: "CANONICAL_ROUTER",
        router_pids: [...routerPids],
        worker_pids: [],
        tree_pids: [...routerPids],
        base_url: "http://127.0.0.1:8080",
        endpoint: { base_url: "http://127.0.0.1:8080", host: "127.0.0.1", port: 8080 },
        processes: [],
      };
    }
    return noopIdentify()();
  };
  fn.workersGoneRef = identify;
  return fn;
}

function makeUnloadAwareLifecycle(clock, { stopCalls = [] } = {}) {
  const identify = statefulIdentify();
  const lc = createQwenIdleLifecycle({
    idleShutdownMs: 60_000,
    nowMs: clock.nowMs,
    timerFn: clock.timerFn,
    clearTimerFn: clock.clearTimerFn,
    identifyCanonicalTree: identify,
    listLoadedModels: async () => (
      // After unload the exact model is gone from the catalog.
      identify.workersGoneRef.workersGone ? { ok: true, loaded: [] } : loadedModelsStub(["qwen38-opus-q3-opencode-64k"])()
    ),
    unloadExactModel: async () => { identify.workersGoneRef.workersGone = true; stopCalls.push("unload"); return { ok: true }; },
    stopCanonicalTree: async (pids) => { stopCalls.push("tree"); return { ok: true, stopped: true, requested_pids: pids || [] }; },
    listEstablishedTcpConnections: async () => [],
    isDispatcherBusy: () => false,
  });
  return lc;
}

// T1 — idle grace does NOT stop before deadline.
await test("T1_idle_grace_no_stop_before_deadline", async () => {
  const clock = makeClock();
  const stopCalls = [];
  const lc = createQwenIdleLifecycle({
    idleShutdownMs: 90_000,
    nowMs: clock.nowMs,
    timerFn: clock.timerFn,
    clearTimerFn: clock.clearTimerFn,
    identifyCanonicalTree: noopIdentify(),
    listLoadedModels: loadedModelsStub(["qwen38-opus-q3-opencode-64k"]),
    unloadExactModel: async () => { stopCalls.push("unload"); return { ok: true }; },
    stopCanonicalTree: async () => { stopCalls.push("tree"); return { ok: true, stopped: true, requested_pids: [] }; },
    listEstablishedTcpConnections: async () => [],
    isDispatcherBusy: () => false,
  });
  lc.markExecutionStart({ taskRef: "LOCAL_DEV_B_D-89", profileId: "qwen38-opus-q3-opencode-64k" });
  lc.markExecutionEnd({ taskRef: "LOCAL_DEV_B_D-89" });
  assert.equal(lc.snapshot().state, "IDLE_GRACE");
  await clock.advance(89_000);
  assert.equal(lc.snapshot().state, "IDLE_GRACE", "must still be in grace one second before deadline");
  assert.deepEqual(stopCalls, [], "no shutdown side-effect before deadline");
  assert.ok(lc.snapshot().ms_remaining > 0 && lc.snapshot().ms_remaining <= 1000);
});

// T2 — idle grace stops canonical owned runtime after deadline (unload path).
await test("T2_idle_grace_stops_after_deadline", async () => {
  const clock = makeClock();
  const stopCalls = [];
  const lc = makeUnloadAwareLifecycle(clock, { stopCalls });
  lc.markExecutionStart({});
  lc.markExecutionEnd({});
  assert.equal(lc.snapshot().state, "IDLE_GRACE");
  await clock.advance(60_000);
  const s = lc.snapshot();
  assert.equal(s.state, "AUTO_STOPPED");
  assert.equal(s.shutdown_result?.mode, "model_unload");
  assert.ok(stopCalls.includes("unload"), "unload strategy used");
});

// T3 — active dispatcher execution prevents stop.
await test("T3_active_execution_prevents_stop", async () => {
  const clock = makeClock();
  const lc = createQwenIdleLifecycle({
    idleShutdownMs: 60_000,
    nowMs: clock.nowMs,
    timerFn: clock.timerFn,
    clearTimerFn: clock.clearTimerFn,
    identifyCanonicalTree: noopIdentify(),
    listLoadedModels: loadedModelsStub(["qwen38-opus-q3-opencode-64k"]),
    listEstablishedTcpConnections: async () => [],
    isDispatcherBusy: () => false,
  });
  lc.markExecutionStart({ taskRef: "LOCAL_DEV_B_D-90", profileId: "qwen38-opus-q3-opencode-64k" });
  const outcome = await lc.performIdleStop({ reason: "TEST" });
  assert.equal(outcome.stopped, false);
  assert.equal(outcome.deferred, true);
  assert.ok(outcome.fences.includes("DISPATCHER_EXECUTION_ACTIVE"));
  assert.equal(lc.snapshot().state, "IDLE_GRACE", "deferred => rearmed grace, not stopped");
});

// T4 — active model request prevents stop.
await test("T4_active_model_request_prevents_stop", async () => {
  const lc = createQwenIdleLifecycle({
    identifyCanonicalTree: noopIdentify(),
    listLoadedModels: loadedModelsStub(["qwen38-opus-q3-opencode-64k"]),
    listEstablishedTcpConnections: async () => [],
    isDispatcherBusy: () => false,
  });
  lc.markModelRequestStart({ tag: "test-request" });
  const outcome = await lc.performIdleStop({ reason: "TEST" });
  assert.equal(outcome.stopped, false);
  assert.ok(outcome.fences.includes("MODEL_REQUEST_IN_FLIGHT"));
  lc.markModelRequestEnd();
});

// T5 — established canonical active client prevents stop (TCP fence).
await test("T5_established_foreign_client_prevents_stop", async () => {
  const treePids = [101, 202, 303];
  const connections = [
    // Internal manager<->worker loopback pair: NOT a foreign client.
    { owning_pid: 202, local_address: "127.0.0.1", local_port: 18080, remote_address: "127.0.0.1", remote_port: 55100, peer: "internal" },
    { owning_pid: 303, local_address: "127.0.0.1", local_port: 55100, remote_address: "127.0.0.1", remote_port: 18080 },
    // Foreign client on an ephemeral port to the manager: ACTIVE CLIENT.
    { owning_pid: 202, local_address: "127.0.0.1", local_port: 18080, remote_address: "127.0.0.1", remote_port: 55999 },
  ];
  const eval1 = evaluateForeignClientActivity({ connections: connections.slice(0, 2), treePids });
  assert.equal(eval1.active, false, "internal tree pair must not count as client");
  const lc = createQwenIdleLifecycle({
    identifyCanonicalTree: noopIdentify(),
    listLoadedModels: loadedModelsStub(["qwen38-opus-q3-opencode-64k"]),
    listEstablishedTcpConnections: async () => connections,
    isDispatcherBusy: () => false,
  });
  const outcome = await lc.performIdleStop({ reason: "TEST" });
  assert.equal(outcome.stopped, false);
  assert.ok(outcome.fences.includes("FOREIGN_ESTABLISHED_CLIENT"));
  // Census failure => fail-safe fence.
  const lc2 = createQwenIdleLifecycle({
    identifyCanonicalTree: noopIdentify(),
    listEstablishedTcpConnections: async () => null,
    isDispatcherBusy: () => false,
  });
  const outcome2 = await lc2.performIdleStop({ reason: "TEST" });
  assert.equal(outcome2.stopped, false);
  assert.ok(outcome2.fences.includes("TCP_CENSUS_UNAVAILABLE"));
});

// T6 — new task cancels pending stop.
await test("T6_new_task_cancels_pending_stop", async () => {
  const clock = makeClock();
  const stopCalls = [];
  const lc = createQwenIdleLifecycle({
    idleShutdownMs: 60_000,
    nowMs: clock.nowMs,
    timerFn: clock.timerFn,
    clearTimerFn: clock.clearTimerFn,
    identifyCanonicalTree: noopIdentify(),
    listLoadedModels: loadedModelsStub(["qwen38-opus-q3-opencode-64k"]),
    unloadExactModel: async () => { stopCalls.push("unload"); return { ok: true }; },
    listEstablishedTcpConnections: async () => [],
    isDispatcherBusy: () => false,
  });
  lc.markExecutionStart({});
  lc.markExecutionEnd({});
  assert.equal(lc.snapshot().state, "IDLE_GRACE");
  await clock.advance(50_000);
  lc.markExecutionStart({ taskRef: "LOCAL_DEV_B_D-91", profileId: "qwen38-opus-q3-opencode-64k" });
  await clock.advance(50_000); // would fire the old deadline
  assert.equal(lc.snapshot().state, "SERVING", "pending stop must be cancelled by new task");
  assert.deepEqual(stopCalls, [], "cancelled timer must never fire shutdown");
  assert.equal(lc.snapshot().idle_deadline, null);
});

// T7 — repeated stop is idempotent.
await test("T7_repeated_stop_idempotent", async () => {
  const clock = makeClock();
  const stopCalls = [];
  const lc = makeUnloadAwareLifecycle(clock, { stopCalls });
  const first = await lc.performIdleStop({ reason: "TEST" });
  assert.equal(first.stopped, true);
  const second = await lc.performIdleStop({ reason: "TEST" });
  assert.equal(second.stopped, true);
  assert.equal(second.mode, "tree_absent", "second stop sees no canonical tree");
  assert.equal(stopCalls.filter((c) => c === "unload").length, 1, "no second termination attempt");
  assert.equal(lc.snapshot().state, "AUTO_STOPPED");
});

// T8 — foreign llama-server process is never terminated.
await test("T8_foreign_llama_never_terminated", async () => {
  const killed = [];
  const stopTree = async (pids) => { killed.push(...pids); return { ok: true, stopped: true, requested_pids: pids }; };
  // Foreign-only census: canonical router absent.
  const lc = createQwenIdleLifecycle({
    identifyCanonicalTree: async () => ({
      ok: false,
      reason_code: "FOREIGN_OR_UNKNOWN_OCCUPANT",
    }),
    stopCanonicalTree: stopTree,
    listEstablishedTcpConnections: async () => [],
    isDispatcherBusy: () => false,
  });
  const outcome = await lc.performIdleStop({ reason: "TEST" });
  assert.deepEqual(killed, [], "no PID may be killed when ownership is not canonical");
  assert.equal(outcome.stopped, true);
  assert.equal(outcome.mode, "tree_absent");
  // Classification-level proof with the REAL classifier:
  const foreignLlama = { pid: 999, name: "llama-server.exe", commandLine: "llama-server.exe --port 9999 --model other" };
  const classified = classifyCanonicalRouterOccupant({
    processes: [foreignLlama, canonicalProcesses()[0]],
    routerEntrypoint: ROUTER_ENTRY,
    routerConfig: ROUTER_CFG,
  });
  assert.equal(classified.is_canonical, true, "canonical router still classified");
  const tree = collectCanonicalRouterTreePids({
    processes: [foreignLlama, ...canonicalProcesses()],
    routerPids: classified.router_pids,
    routerConfig: ROUTER_CFG,
    existsPath: () => false,
  });
  assert.ok(!tree.includes(999), "foreign llama-server on :9999 excluded from tree");
});

// T9 — STOPPED runtime is not started by observability (reconcile).
await test("T9_reconcile_never_starts_qwen", async () => {
  const lc = createQwenIdleLifecycle({
    identifyCanonicalTree: async () => ({ ok: false, reason_code: "FOREIGN_OR_UNKNOWN_OCCUPANT" }),
    listEstablishedTcpConnections: async () => [],
    isDispatcherBusy: () => false,
  });
  const s = await lc.reconcile();
  assert.equal(s.state, "STOPPED");
  assert.equal(s.router_pids.length, 0);
  // IDLE_CLEAN dispatcher path with reconcile-stub also never launches ensure.
  let ensureCalls = 0;
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "lc89-1", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "a".repeat(40), reason_codes: [] }),
      scanQueue: () => [],
      runDispatchLoop: () => ({ ok: true, claims: [], skipped: [] }),
      ensureDevQwenReady: async () => { ensureCalls += 1; return { ready: true }; },
      runExecutor: async () => { throw new Error("must not execute"); },
      qwenLifecycle: { onIdleCleanTick: async () => ({ state: "STOPPED" }), markPreflightStart() {}, markPreflightEnd() {}, markExecutionStart() {}, markExecutionEnd() {} },
    },
  );
  assert.equal(result.classification, "IDLE_CLEAN");
  assert.equal(ensureCalls, 0, "IDLE_CLEAN must not ensure/start Qwen");
});

// T10 — next ensure after auto-stop restarts exact requested profile.
await test("T10_ensure_after_autostop_restarts_exact_profile", async () => {
  const REAL_RUNTIME = loadQwenLocalRuntime();
  const DEV_PROFILE = "qwen38-opus-q3-opencode-64k";
  const ensureCalls = [];
  // Simulate: after AUTO_STOPPED, canonical ensure is called with the exact
  // profile and must reach READY via exact load (no fallback profile).
  const clock = makeClock();
  const lc = makeUnloadAwareLifecycle(clock, {});
  await lc.performIdleStop({ reason: "TEST" });
  assert.equal(lc.snapshot().state, "AUTO_STOPPED");
  // Real dispatcher path: ensureDevQwenReady invoked with exact envelope profile.
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "lc89-2", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "b".repeat(40), reason_codes: [] }),
      scanQueue: () => [{ ok: true, item: { id: "D-89T" }, markdown: "m", source: "x.md", backlog_path: "q/x.md" }],
      runDispatchLoop: () => ({ ok: true, claims: [{ task_ref: "LOCAL_DEV_B_D-89T", source_file: "x.md", envelope: { task_ref: "LOCAL_DEV_B_D-89T", profile_id: DEV_PROFILE }, receipt: { task_ref: "LOCAL_DEV_B_D-89T" } }], skipped: [] }),
      ensureDevQwenReady: async (opts) => {
        ensureCalls.push(opts?.profile);
        return { ready: true, status: "READY", profile: opts?.profile, model_id: opts?.profile };
      },
      runExecutor: async () => ({ status: "PASS", classification: "PASS", task_ref: "LOCAL_DEV_B_D-89T", reason_codes: ["PASS"] }),
      qwenLifecycle: { markPreflightStart() {}, markPreflightEnd() {}, markExecutionStart() {}, markExecutionEnd() {}, onIdleCleanTick: async () => ({}) },
    },
  );
  assert.deepEqual(ensureCalls, [DEV_PROFILE], "ensure receives exactly the requested DEV profile");
  assert.equal(result.classification, "WORK_EXECUTED_PASS");
  // The runtime document itself has no fallback: ensure never substitutes.
  const resolved = REAL_RUNTIME.workstation_manual_profiles[DEV_PROFILE];
  assert.equal(resolved.category, "workstation_dev_executor_profile");
});

// T11 — lifecycle states transition correctly.
await test("T11_lifecycle_state_transitions", async () => {
  const clock = makeClock();
  const stopCalls = [];
  const lc = makeUnloadAwareLifecycle(clock, { stopCalls });
  assert.equal(lc.snapshot().state, "STOPPED");
  lc.markPreflightStart({ profileId: "qwen38-opus-q3-opencode-64k" });
  assert.equal(lc.snapshot().state, "STARTING");
  lc.markPreflightEnd({ ready: true });
  assert.equal(lc.snapshot().state, "IDLE_GRACE");
  lc.markModelRequestStart({});
  assert.equal(lc.snapshot().state, "SERVING");
  lc.markModelRequestEnd();
  assert.equal(lc.snapshot().state, "IDLE_GRACE");
  lc.markExecutionStart({});
  assert.equal(lc.snapshot().state, "SERVING");
  lc.markExecutionEnd({});
  assert.equal(lc.snapshot().state, "IDLE_GRACE");
  await clock.advance(60_000);
  assert.equal(lc.snapshot().state, "AUTO_STOPPED");
  assert.ok(LIFECYCLE_STATES.includes("SHUTDOWN_FAILED"));
});

// T12 — shutdown failure is surfaced rather than hidden.
await test("T12_shutdown_failure_surfaced", async () => {
  const lc = createQwenIdleLifecycle({
    identifyCanonicalTree: noopIdentify(),
    listLoadedModels: loadedModelsStub(["qwen38-opus-q3-opencode-64k"]),
    unloadExactModel: async () => ({ ok: false, classification: "MODEL_UNLOAD_FAILED" }),
    stopCanonicalTree: async () => ({ ok: false, stopped: false, reason_code: "CANONICAL_STOP_INCOMPLETE" }),
    listEstablishedTcpConnections: async () => [],
    isDispatcherBusy: () => false,
  });
  const outcome = await lc.performIdleStop({ reason: "TEST" });
  assert.equal(outcome.stopped, false);
  assert.equal(outcome.reason_code, "CANONICAL_STOP_INCOMPLETE");
  const s = lc.snapshot();
  assert.equal(s.state, "SHUTDOWN_FAILED");
  assert.equal(s.last_error, "CANONICAL_STOP_INCOMPLETE");
  assert.ok(s.shutdown_reason, "shutdown_reason recorded");
});

// Config bounds: 90 default; 45k/130k out-of-bounds rejected; 60k/120k accepted.
await test("T13_config_bounds_and_dispatch_grace_end_to_end", async () => {
  assert.equal(DEFAULT_IDLE_SHUTDOWN_MS, 90_000);
  assert.equal(resolveIdleShutdownMs({}).ms, 90_000);
  assert.equal(resolveIdleShutdownMs({ qwen_local_idle_shutdown_ms: 45_000 }).config_source, "default");
  assert.equal(resolveIdleShutdownMs({ qwen_local_idle_shutdown_ms: 130_000 }).config_source, "default");
  assert.equal(resolveIdleShutdownMs({ qwen_local_idle_shutdown_ms: 60_000 }).ms, 60_000);
  assert.equal(resolveIdleShutdownMs({ qwen_local_idle_shutdown_ms: 120_000 }).ms, 120_000);
  // End-to-end through performTick: PASS terminal result arms IDLE_GRACE on the
  // injected lifecycle (grace entered, not immediate kill).
  const clock = makeClock();
  const lc = createQwenIdleLifecycle({
    idleShutdownMs: 90_000,
    nowMs: clock.nowMs,
    timerFn: clock.timerFn,
    clearTimerFn: clock.clearTimerFn,
    identifyCanonicalTree: async () => ({ ok: false, reason_code: "FOREIGN_OR_UNKNOWN_OCCUPANT" }),
    listEstablishedTcpConnections: async () => [],
    isDispatcherBusy: () => false,
  });
  const result = await performTick(
    { schema_version: REQUEST_SCHEMA, request_id: "lc89-3", source: "n8n" },
    {
      verifyRepo: async () => ({ ok: true, head: "c".repeat(40), reason_codes: [] }),
      scanQueue: () => [{ ok: true, item: { id: "D-89E" }, markdown: "m", source: "y.md", backlog_path: "q/y.md" }],
      runDispatchLoop: () => ({ ok: true, claims: [{ task_ref: "LOCAL_DEV_B_D-89E", source_file: "y.md", envelope: { task_ref: "LOCAL_DEV_B_D-89E", profile_id: "qwen38-opus-q3-opencode-64k" }, receipt: { task_ref: "LOCAL_DEV_B_D-89E" } }], skipped: [] }),
      ensureDevQwenReady: async () => ({ ready: true, status: "READY" }),
      runExecutor: async () => ({ status: "STOP", classification: "STOP:TEST_FAILED", task_ref: "LOCAL_DEV_B_D-89E", reason_codes: ["TEST_FAILED"] }),
      qwenLifecycle: lc,
    },
  );
  assert.equal(result.classification, "WORK_EXECUTED_STOP");
  assert.equal(lc.snapshot().state, "IDLE_GRACE", "STOP terminal still enters bounded grace");
  assert.ok(lc.snapshot().idle_deadline, "grace timer armed after execution window");
  // markExecutionEnd without a prior markExecutionStart must not fabricate state.
  const bare = createQwenIdleLifecycle({ identifyCanonicalTree: async () => ({ ok: false, reason_code: "X" }) });
  const before = bare.snapshot().state;
  bare.markExecutionEnd({});
  assert.equal(bare.snapshot().state, before, "no fabricated grace from unbalanced end");
  assert.equal(bare.snapshot().idle_deadline, null);
});

// Unload helper classification proof (bounded, no network in offline test).
await test("T14_unload_helper_contract", async () => {
  // Contract-only probe against an unreachable port proves fail-closed shape.
  const r = await defaultUnloadExactDevModel({ baseUrl: "http://127.0.0.1:9", modelId: "x", timeoutMs: 300 });
  assert.equal(r.ok, false);
  assert.ok(["MODEL_UNLOAD_FAILED", "MODEL_UNLOAD_REJECTED"].includes(r.classification));
});

process.stdout.write("\nSUMMARY\n");
process.stdout.write(`TOTAL=${passed + failures.length}\n`);
process.stdout.write(`PASS=${passed}\n`);
process.stdout.write(`FAIL=${failures.length}\n`);
if (failures.length) {
  process.stdout.write(`FAILED_TESTS=${failures.join(",")}\n`);
  process.exit(1);
}
process.exit(0);
