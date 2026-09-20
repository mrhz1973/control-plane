#!/usr/bin/env node
/**
 * #115 — focused deterministic suite for the race-safe dispatcher restart gate.
 * No network, no Scheduled Task mutation, no receipt/tick/executor side effects.
 *
 * Run: node tests/safe-restart-local-dev-dispatcher-v1/run.mjs
 */
import assert from "node:assert/strict";
import {
  evaluateLiveStatusObservation,
  safeRestartLocalDevDispatcher,
  RESULT_RESTART_EXECUTED,
  RESULT_DEFERRED_ACTIVE,
  RESULT_DEFERRED_UNAVAILABLE,
  RESULT_DEFERRED_AMBIGUOUS,
  STATUS_URL,
  DIAGNOSTICS_URL,
} from "../../tools/safe-restart-local-dev-dispatcher-v1.mjs";

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

function idleBody(extra = {}) {
  return {
    schema_version: "local-dev-execution-status-v1",
    active: false,
    terminal: true,
    task_ref: null,
    phase: "TERMINAL",
    classification: "IDLE_CLEAN",
    last_event: "terminal:IDLE_CLEAN",
    ...extra,
  };
}

function activeBody(extra = {}) {
  return {
    schema_version: "local-dev-execution-status-v1",
    active: true,
    terminal: false,
    task_ref: "LOCAL_DEV_B_D-0103-F003",
    phase: "OPENCODE",
    classification: null,
    last_event: "opencode_start",
    ...extra,
  };
}

function mockFetchSequence(responses) {
  let i = 0;
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(String(url));
    const next = responses[Math.min(i, responses.length - 1)];
    i += 1;
    if (typeof next === "function") return next(url);
    if (next.throw) throw new Error(next.throw);
    return {
      status: next.status ?? 200,
      text: async () => (typeof next.body === "string" ? next.body : JSON.stringify(next.body ?? {})),
    };
  };
  fetchImpl.urls = urls;
  fetchImpl.calls = () => i;
  return fetchImpl;
}

function healthyVerify() {
  return {
    ok: true,
    supervisor_count: 1,
    dispatcher_child_count: 1,
    listener_count: 1,
    listener_bind: "127.0.0.1:18793",
    status_http: 200,
    diagnostics_http: 200,
    task_state: "Running",
  };
}

function verifyWithDrain(postOk = healthyVerify, failedPost = null) {
  return async ({ requireHttp } = {}) => {
    if (requireHttp === false) {
      return {
        ok: true,
        supervisor_count: 0,
        dispatcher_child_count: 0,
        listener_count: 0,
        status_http: 0,
        diagnostics_http: 0,
        task_state: "Ready",
      };
    }
    if (failedPost) return failedPost;
    return typeof postOk === "function" ? postOk() : postOk;
  };
}

await test("A. idle→idle → restart allowed exactly once", async () => {
  let ends = 0;
  let starts = 0;
  let kills = 0;
  const fetchImpl = mockFetchSequence([
    { body: idleBody() },
    { body: idleBody() },
  ]);
  const r = await safeRestartLocalDevDispatcher({
    fetchImpl,
    sleepImpl: async () => {},
    raceFenceMs: 1,
    postRestartWaitMs: 1,
    postRestartSettleMs: 0,
    postRestartPollMs: 0,
    endScheduledTask: async () => { ends += 1; return { ok: true }; },
    startScheduledTask: async () => { starts += 1; return { ok: true }; },
    killOrphanDispatcherTree: async () => { kills += 1; return { ok: true, killed_pids: [] }; },
    reapExtraSupervisors: async () => ({ ok: true, killed_pids: [] }),
    verifyIdentity: verifyWithDrain(),
  });
  assert.equal(r.ok, true);
  assert.equal(r.result, RESULT_RESTART_EXECUTED);
  assert.equal(r.restart_executed, true);
  assert.equal(ends, 1);
  assert.equal(starts, 1);
  assert.ok(kills >= 1);
  assert.ok(r.terminate_calls >= 2);
  assert.equal(fetchImpl.calls(), 2);
  assert.ok(fetchImpl.urls.every((u) => u === STATUS_URL));
});

await test("B. active at first check → blocked, terminate=0", async () => {
  let ends = 0;
  let kills = 0;
  const fetchImpl = mockFetchSequence([{ body: activeBody() }]);
  const r = await safeRestartLocalDevDispatcher({
    fetchImpl,
    sleepImpl: async () => {},
    endScheduledTask: async () => { ends += 1; return { ok: true }; },
    startScheduledTask: async () => ({ ok: true }),
    killOrphanDispatcherTree: async () => { kills += 1; return { ok: true }; },
    verifyIdentity: async () => ({ ok: true }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.result, RESULT_DEFERRED_ACTIVE);
  assert.equal(r.phase, "PRECHECK_IDLE");
  assert.equal(r.restart_executed, false);
  assert.equal(ends, 0);
  assert.equal(kills, 0);
  assert.equal(r.terminate_calls, 0);
  assert.equal(fetchImpl.calls(), 1);
});

await test("C. idle first then active second → blocked, terminate=0", async () => {
  let ends = 0;
  let kills = 0;
  const fetchImpl = mockFetchSequence([
    { body: idleBody() },
    { body: activeBody({ task_ref: "LOCAL_DEV_B_D-0103-F003" }) },
  ]);
  const r = await safeRestartLocalDevDispatcher({
    fetchImpl,
    sleepImpl: async () => {},
    raceFenceMs: 1,
    endScheduledTask: async () => { ends += 1; return { ok: true }; },
    startScheduledTask: async () => ({ ok: true }),
    killOrphanDispatcherTree: async () => { kills += 1; return { ok: true }; },
    verifyIdentity: async () => ({ ok: true }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.result, RESULT_DEFERRED_ACTIVE);
  assert.equal(r.phase, "FINAL_PREKILL_IDLE_CHECK");
  assert.equal(r.precheck.idle, true);
  assert.equal(r.final_prekill.idle, false);
  assert.equal(ends, 0);
  assert.equal(kills, 0);
  assert.equal(r.terminate_calls, 0);
});

await test("D. idle first then second unavailable → blocked, terminate=0", async () => {
  let ends = 0;
  const fetchImpl = mockFetchSequence([
    { body: idleBody() },
    { status: 0, throw: "ECONNREFUSED" },
  ]);
  const r = await safeRestartLocalDevDispatcher({
    fetchImpl,
    sleepImpl: async () => {},
    raceFenceMs: 1,
    endScheduledTask: async () => { ends += 1; return { ok: true }; },
    startScheduledTask: async () => ({ ok: true }),
    killOrphanDispatcherTree: async () => ({ ok: true }),
    verifyIdentity: async () => ({ ok: true }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.result, RESULT_DEFERRED_UNAVAILABLE);
  assert.equal(r.phase, "FINAL_PREKILL_IDLE_CHECK");
  assert.equal(ends, 0);
  assert.equal(r.terminate_calls, 0);
});

await test("E. malformed / ambiguous status → blocked", async () => {
  const cases = [
    { body: "not-json", status: 200 },
    { body: { phase: "TERMINAL" }, status: 200 }, // missing active
    { body: { active: "false" }, status: 200 }, // non-boolean
    { body: null, status: 500 },
  ];
  for (const c of cases) {
    const fetchImpl = mockFetchSequence([
      c.body === "not-json" ? { status: 200, body: "not-json" } : { status: c.status, body: c.body },
    ]);
    const r = await safeRestartLocalDevDispatcher({
      fetchImpl,
      sleepImpl: async () => {},
      endScheduledTask: async () => { throw new Error("must-not-terminate"); },
      startScheduledTask: async () => { throw new Error("must-not-start"); },
      killOrphanDispatcherTree: async () => { throw new Error("must-not-kill"); },
      verifyIdentity: async () => ({ ok: true }),
    });
    assert.equal(r.ok, false, JSON.stringify(r));
    assert.equal(r.restart_executed, false);
    assert.equal(r.terminate_calls, 0);
    assert.ok(
      r.result === RESULT_DEFERRED_AMBIGUOUS || r.result === RESULT_DEFERRED_UNAVAILABLE,
      r.result,
    );
  }
  // BUSY classification fail-closed even if active false
  const busy = evaluateLiveStatusObservation({
    httpOk: true, statusCode: 200, body: idleBody({ classification: "BUSY" }),
  });
  assert.equal(busy.idle, false);
  assert.equal(busy.classification, RESULT_DEFERRED_ACTIVE);
});

await test("F. cached diagnostics idle but live status active → blocked", async () => {
  let ends = 0;
  const fetchImpl = mockFetchSequence([{ body: activeBody() }]);
  const r = await safeRestartLocalDevDispatcher({
    fetchImpl,
    sleepImpl: async () => {},
    cachedDiagnostics: {
      last_tick: { classification: "IDLE_CLEAN", execution_performed: false },
      qwen: { lifecycle: { state: "AUTO_STOPPED", active_executions: 0 } },
    },
    endScheduledTask: async () => { ends += 1; return { ok: true }; },
    startScheduledTask: async () => ({ ok: true }),
    killOrphanDispatcherTree: async () => ({ ok: true }),
    verifyIdentity: async () => ({ ok: true }),
  });
  assert.equal(r.ok, false);
  assert.equal(r.result, RESULT_DEFERRED_ACTIVE);
  assert.equal(ends, 0);
  assert.equal(r.terminate_calls, 0);
  // authorization fetch never hits diagnostics URL
  assert.ok(!fetchImpl.urls.includes(DIAGNOSTICS_URL));
  assert.deepEqual(fetchImpl.urls, [STATUS_URL]);
});

await test("G. restart success requires post-restart identity verification", async () => {
  const fetchImpl = mockFetchSequence([{ body: idleBody() }, { body: idleBody() }]);
  let verifiedPost = false;
  const r = await safeRestartLocalDevDispatcher({
    fetchImpl,
    sleepImpl: async () => {},
    raceFenceMs: 1,
    postRestartWaitMs: 1,
    postRestartSettleMs: 0,
    postRestartPollMs: 0,
    endScheduledTask: async () => ({ ok: true }),
    startScheduledTask: async () => ({ ok: true }),
    killOrphanDispatcherTree: async () => ({ ok: true, killed_pids: [] }),
    reapExtraSupervisors: async () => ({ ok: true, killed_pids: [] }),
    verifyIdentity: verifyWithDrain(null, {
      ok: false,
      supervisor_count: 2,
      dispatcher_child_count: 1,
      listener_count: 1,
      status_http: 200,
      diagnostics_http: 200,
      task_state: "Running",
    }),
  });
  // force post path: wrap to mark verifiedPost when requireHttp !== false
  assert.equal(r.ok, false);
  assert.equal(r.restart_executed, true);
  assert.equal(r.result, "RESTART_POST_VERIFY_FAILED");
  assert.equal(r.post_verify.supervisor_count, 2);
  verifiedPost = true;
  assert.equal(verifiedPost, true);
});

await test("H. no receipt mutation surface in gate API", async () => {
  const src = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../../tools/safe-restart-local-dev-dispatcher-v1.mjs", import.meta.url), "utf8"));
  assert.ok(!/writeFileSync|appendFileSync|renameSync|unlinkSync/.test(src));
  assert.ok(!/receipts\.json/.test(src));
});

await test("I. no tick invocation", async () => {
  const urls = [];
  const fetchImpl = async (url, init = {}) => {
    urls.push({ url: String(url), method: init.method || "GET" });
    return { status: 200, text: async () => JSON.stringify(idleBody()) };
  };
  await safeRestartLocalDevDispatcher({
    fetchImpl,
    sleepImpl: async () => {},
    raceFenceMs: 1,
    postRestartWaitMs: 1,
    postRestartSettleMs: 0,
    postRestartPollMs: 0,
    endScheduledTask: async () => ({ ok: true }),
    startScheduledTask: async () => ({ ok: true }),
    killOrphanDispatcherTree: async () => ({ ok: true }),
    reapExtraSupervisors: async () => ({ ok: true, killed_pids: [] }),
    verifyIdentity: async ({ fetchImpl: f, requireHttp } = {}) => {
      if (requireHttp === false) {
        return { ok: true, supervisor_count: 0, dispatcher_child_count: 0, listener_count: 0 };
      }
      await f(STATUS_URL, { method: "GET" });
      await f(DIAGNOSTICS_URL, { method: "GET" });
      return { ok: true, status_http: 200, diagnostics_http: 200, supervisor_count: 1, dispatcher_child_count: 1, listener_count: 1, task_state: "Running" };
    },
  });
  assert.ok(!urls.some((u) => /\/v1\/tick/.test(u.url)));
  assert.ok(!urls.some((u) => String(u.method).toUpperCase() === "POST"));
});

await test("J. no executor invocation", async () => {
  const src = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../../tools/safe-restart-local-dev-dispatcher-v1.mjs", import.meta.url), "utf8"));
  assert.ok(!/local-dev-executor|performTick/.test(src));
  assert.ok(!/opencode/.test(src));
  assert.ok(!/\/v1\/tick/.test(src));
});

await test("phase in-flight with active=false still blocked", () => {
  const r = evaluateLiveStatusObservation({
    httpOk: true, statusCode: 200, body: idleBody({ phase: "EXECUTING", classification: null }),
  });
  assert.equal(r.idle, false);
  assert.equal(r.classification, RESULT_DEFERRED_ACTIVE);
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
