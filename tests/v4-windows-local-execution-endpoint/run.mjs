#!/usr/bin/env node
/**
 * Target suite for tools/serve-v4-windows-local-execution-endpoint-v1.mjs.
 * Offline DI only. No real PowerShell, no OpenCode spawn, no Qwen/provider.
 * HTTP binds exclusively to ephemeral port 0 (never production 18791).
 */
import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { EventEmitter } from "node:events";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { executeOpenCodeBounded } from "../../tools/opencode-execution-adapter-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const TOOL = join(ROOT, "tools", "serve-v4-windows-local-execution-endpoint-v1.mjs");
const SRC = await readFile(TOOL, "utf8");

const mod = await import(pathToFileURL(TOOL).href);

let pass = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    pass += 1;
    console.log(`ok ${pass} - ${name}`);
  } catch (err) {
    failures.push({ name, message: String(err && err.message) });
    console.log(`FAIL - ${name}: ${err && err.message}`);
  }
}

function validAuth(overrides = {}) {
  return {
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: overrides.authorization_id || "AUTH-ENDPT-1",
    authorization_state: "ACTIVE",
    route_id: "opencode+qwen_local",
    scope: {
      execution_harness: "opencode",
      model: "qwen_local",
      single_generation_guard_required: true,
      max_opencode_executions: 1,
      max_qwen_generation_calls: 1,
      retry: 0,
      fallback: 0,
      qwen_profile: "fast_8k",
      dflash_required: true,
    },
  };
}

function validBody(overrides = {}) {
  const authOverrides = {};
  if (overrides.authorization_id) {
    authOverrides.authorization_id = overrides.authorization_id;
  }
  return {
    schema_version: "v4-windows-local-execution-endpoint-request-v1",
    execution_id: overrides.execution_id || "exec-1",
    runtime_authorization:
      overrides.runtime_authorization || validAuth(authOverrides),
    message: overrides.message || "bounded offline goal",
  };
}

function responseLeak(obj) {
  const text = JSON.stringify(obj).toLowerCase();
  return (
    text.includes("stdout") ||
    text.includes("stderr") ||
    text.includes('"pid"') ||
    text.includes("process.env") ||
    text.includes("bearer ") ||
    text.includes("sk-") ||
    /["']prompt["']/.test(text) ||
    text.includes("appdata") ||
    text.includes("\\users\\")
  );
}

function post(port, body, { path = "/v4/execution/opencode-local", headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const payload = typeof body === "string" ? body : JSON.stringify(body);
    const r = http.request(
      {
        host: "127.0.0.1",
        port,
        method: "POST",
        path,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => {
          data += c;
        });
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {
            /* ignore */
          }
          resolve({ status: res.statusCode, json, text: data });
        });
      },
    );
    r.on("error", reject);
    r.write(payload);
    r.end();
  });
}

function rawReq(port, { method = "POST", path = "/v4/execution/opencode-local", headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: "127.0.0.1", port, method, path, headers }, (res) => {
      let data = "";
      res.on("data", (c) => {
        data += c;
      });
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          /* ignore */
        }
        resolve({ status: res.statusCode, json, text: data });
      });
    });
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

let runnerCalls = 0;
let occupancyCalls = 0;
let lastRunnerCtx = null;

function mockOccupancy(classification = "QWEN_READY_IDLE") {
  return async () => {
    occupancyCalls += 1;
    return classification;
  };
}

function mockRunner() {
  return async (ctx) => {
    runnerCalls += 1;
    lastRunnerCtx = ctx;
    return {
      opencode_execution_count: 1,
      qwen_generation_calls: 1,
      upstream_generation_requests: 1,
      retry_calls: 0,
      fallback_calls: 0,
      response_validation: "VALID",
    };
  };
}

async function startEphemeral(extra = {}) {
  return mod.startWindowsLocalExecutionService({
    host: "127.0.0.1",
    port: 0,
    workspaceRoot: ROOT,
    getOccupancy: mockOccupancy(),
    runOpenCode: mockRunner(),
    ...extra,
  });
}

await test("module imports without side effects and exposes production defaults", async () => {
  assert.equal(mod.DEFAULT_HOST, "127.0.0.1");
  assert.equal(mod.DEFAULT_PORT, 18791);
  assert.equal(mod.CANONICAL_PATH, "/v4/execution/opencode-local");
  assert.equal(mod.RESULT_SCHEMA, "v4-windows-local-execution-endpoint-result-v1");
  assert.ok(!SRC.includes("shell: true") && !SRC.includes("shell:true"), "production runner must not use shell:true");
  assert.ok(SRC.includes("shell: false") || SRC.includes("shell:false"));
  assert.ok(
    !/guardStart\s*:/.test(SRC),
    "endpoint must not inject a custom guardStart option",
  );
  assert.ok(!SRC.includes("stdout +="), "must not accumulate stdout");
  assert.ok(!SRC.includes("stderr +="), "must not accumulate stderr");
});

await test("resolveOpenCodeNoShellInvocation never returns shell:true", async () => {
  const r = mod.resolveOpenCodeNoShellInvocation({
    fsEvidence: {
      shimExists: true,
      binExists: true,
      binEntry: "bin/opencode",
      packageJsonPath: join(ROOT, "package.json"),
    },
  });
  // package.json may not have that bin — either ok:false or shell:false
  if (r.ok) {
    assert.equal(r.shell, false);
    assert.ok(r.nodePath);
    assert.ok(r.scriptPath);
  } else {
    assert.equal(r.classification, "SAFE_OPENCODE_RUNNER_RESOLUTION_UNAVAILABLE");
  }
});

await test("buildOpenCodeArgv uses proven CLI surface only", async () => {
  const argv = mod.buildOpenCodeArgv({
    workspaceRoot: "C:\\\\repo",
    modelId: "qwen38-original-dflash2-8k",
    message: "goal text",
  });
  assert.deepEqual(argv, [
    "run",
    "--dir",
    "C:\\\\repo",
    "-m",
    "qwen_local/qwen38-original-dflash2-8k",
    "--format",
    "json",
    "--auto",
    "goal text",
  ]);
});

await test("production getOccupancy uses DI and never PowerShell", async () => {
  let gatherCalls = 0;
  const getOcc = mod.createProductionGetOccupancy({
    loadRuntimeConfig: () => ({ profiles: {} }),
    gatherQwenDiagnostics: () => {
      gatherCalls += 1;
      return { sampleA: { a: 1 }, sampleB: { b: 2 } };
    },
    classifyQwenSharedRuntime: (a, b) => {
      assert.deepEqual(a, { a: 1 });
      assert.deepEqual(b, { b: 2 });
      return { classification: "QWEN_READY_IDLE" };
    },
  });
  const c = await getOcc();
  assert.equal(c, "QWEN_READY_IDLE");
  assert.equal(gatherCalls, 1);
  assert.ok(!SRC.includes("powershell") || SRC.includes("gatherQwenDiagnostics"), "no local PowerShell in endpoint");
});

let srv;
let port;

await test("service binds ephemeral port 0 only", async () => {
  runnerCalls = 0;
  occupancyCalls = 0;
  srv = await startEphemeral();
  port = srv.address.port;
  assert.ok(port > 0);
  assert.notEqual(port, mod.DEFAULT_PORT, "must not bind production 18791");
});

await test("valid mocked execution invokes adapter/runner once", async () => {
  const beforeR = runnerCalls;
  const beforeO = occupancyCalls;
  const r = await post(port, validBody({ execution_id: "exec-ok-1", authorization_id: "AUTH-OK-1" }));
  assert.equal(r.status, 200);
  assert.equal(r.json.schema_version, "v4-windows-local-execution-endpoint-result-v1");
  assert.equal(r.json.ok, true);
  assert.equal(r.json.replayed, false);
  assert.equal(r.json.execution_id, "exec-ok-1");
  assert.ok(r.json.adapter_result);
  assert.equal(r.json.execution_performed, r.json.adapter_result.execution_performed);
  assert.equal(r.json.adapter_result.schema_version, "opencode-execution-result-v1");
  assert.equal(runnerCalls, beforeR + 1);
  assert.equal(occupancyCalls, beforeO + 1);
  assert.ok(lastRunnerCtx);
  assert.ok(String(lastRunnerCtx.guardBaseUrl).startsWith("http://127.0.0.1:"));
  assert.notEqual(lastRunnerCtx.guardBaseUrl, "http://127.0.0.1:8080");
  assert.ok(!responseLeak(r.json));
});

await test("wrong method fail-closed before occupancy/runner", async () => {
  const beforeR = runnerCalls;
  const beforeO = occupancyCalls;
  const r = await rawReq(port, { method: "GET" });
  assert.equal(r.status, 405);
  assert.equal(r.json.classification, "ENDPOINT_METHOD_REJECTED");
  assert.equal(runnerCalls, beforeR);
  assert.equal(occupancyCalls, beforeO);
});

await test("query parameters fail-closed", async () => {
  const beforeR = runnerCalls;
  const beforeO = occupancyCalls;
  const r = await rawReq(port, {
    method: "POST",
    path: "/v4/execution/opencode-local?x=1",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validBody({ execution_id: "q1", authorization_id: "AUTH-Q1" })),
  });
  assert.equal(r.status, 400);
  assert.equal(r.json.classification, "ENDPOINT_QUERY_REJECTED");
  assert.equal(runnerCalls, beforeR);
  assert.equal(occupancyCalls, beforeO);
});

await test("wrong content-type fail-closed", async () => {
  const beforeR = runnerCalls;
  const beforeO = occupancyCalls;
  const r = await rawReq(port, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(validBody({ execution_id: "ct1", authorization_id: "AUTH-CT1" })),
  });
  assert.equal(r.status, 400);
  assert.equal(r.json.classification, "ENDPOINT_CONTENT_TYPE_REJECTED");
  assert.equal(runnerCalls, beforeR);
  assert.equal(occupancyCalls, beforeO);
});

await test("invalid JSON body fail-closed", async () => {
  const beforeR = runnerCalls;
  const beforeO = occupancyCalls;
  const r = await rawReq(port, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not-json",
  });
  assert.equal(r.status, 400);
  assert.equal(r.json.classification, "ENDPOINT_BODY_INVALID");
  assert.equal(runnerCalls, beforeR);
  assert.equal(occupancyCalls, beforeO);
});

await test("unknown/extra fields rejected", async () => {
  const beforeR = runnerCalls;
  const beforeO = occupancyCalls;
  const body = { ...validBody({ execution_id: "extra-1", authorization_id: "AUTH-EXTRA-1" }), cwd: "C:\\\\hack" };
  const r = await post(port, body);
  assert.equal(r.status, 400);
  assert.equal(r.json.classification, "ENDPOINT_SCHEMA_REJECTED");
  assert.equal(runnerCalls, beforeR);
  assert.equal(occupancyCalls, beforeO);
});

await test("command/script/model/base_url/retry overrides impossible via request", async () => {
  const beforeR = runnerCalls;
  const beforeO = occupancyCalls;
  for (const forbidden of [
    { command: "calc.exe" },
    { script: "x.ps1" },
    { argv: ["a"] },
    { path: "C:\\\\" },
    { cwd: "C:\\\\" },
    { model: "other" },
    { profile: "other" },
    { base_url: "http://evil" },
    { guard: {} },
    { retry: 1 },
    { fallback: 1 },
    { parallelism: 2 },
  ]) {
    const body = { ...validBody({ execution_id: `f-${Object.keys(forbidden)[0]}`, authorization_id: `AUTH-F-${Object.keys(forbidden)[0]}` }), ...forbidden };
    const r = await post(port, body);
    assert.equal(r.status, 400, Object.keys(forbidden)[0]);
    assert.equal(r.json.classification, "ENDPOINT_SCHEMA_REJECTED");
  }
  assert.equal(runnerCalls, beforeR);
  assert.equal(occupancyCalls, beforeO);
});

await test("invalid authorization (schema) → zero occupancy/runner", async () => {
  const beforeR = runnerCalls;
  const beforeO = occupancyCalls;
  const body = validBody({ execution_id: "bad-auth", authorization_id: "AUTH-BAD" });
  body.runtime_authorization.authorization_state = "SPENT";
  const r = await post(port, body);
  assert.equal(r.status, 400);
  assert.equal(r.json.classification, "ENDPOINT_SCHEMA_REJECTED");
  assert.equal(runnerCalls, beforeR);
  assert.equal(occupancyCalls, beforeO);
});

await test("occupancy blocked → zero runner", async () => {
  await srv.close();
  runnerCalls = 0;
  occupancyCalls = 0;
  srv = await startEphemeral({
    getOccupancy: mockOccupancy("QWEN_BUSY"),
    runOpenCode: mockRunner(),
  });
  port = srv.address.port;
  const r = await post(port, validBody({ execution_id: "occ-block", authorization_id: "AUTH-OCC" }));
  assert.equal(r.status, 200);
  assert.equal(r.json.adapter_result.classification, "OCCUPANCY_BLOCKED");
  assert.equal(r.json.execution_performed, false);
  assert.equal(occupancyCalls, 1);
  assert.equal(runnerCalls, 0);
});

await test("same execution_id + same request → cached replay, zero second execution", async () => {
  await srv.close();
  runnerCalls = 0;
  occupancyCalls = 0;
  srv = await startEphemeral();
  port = srv.address.port;
  const body = validBody({ execution_id: "replay-1", authorization_id: "AUTH-REPLAY-1" });
  const r1 = await post(port, body);
  assert.equal(r1.json.replayed, false);
  assert.equal(runnerCalls, 1);
  const r2 = await post(port, body);
  assert.equal(r2.status, 200);
  assert.equal(r2.json.replayed, true);
  assert.equal(r2.json.execution_id, "replay-1");
  assert.equal(runnerCalls, 1);
  assert.equal(occupancyCalls, 1);
});

await test("same execution_id + changed request → EXECUTION_ID_CONFLICT", async () => {
  const body2 = validBody({
    execution_id: "replay-1",
    authorization_id: "AUTH-REPLAY-1",
    message: "changed message",
  });
  const beforeR = runnerCalls;
  const r = await post(port, body2);
  assert.equal(r.status, 409);
  assert.equal(r.json.classification, "EXECUTION_ID_CONFLICT");
  assert.equal(runnerCalls, beforeR);
});

await test("same authorization_id + new execution_id → AUTHORIZATION_ID_REUSED", async () => {
  const beforeR = runnerCalls;
  const r = await post(
    port,
    validBody({ execution_id: "replay-2", authorization_id: "AUTH-REPLAY-1" }),
  );
  assert.equal(r.status, 409);
  assert.equal(r.json.classification, "AUTHORIZATION_ID_REUSED");
  assert.equal(runnerCalls, beforeR);
});

await test("SPENT authorization cannot produce a second execution", async () => {
  // First successful path marks SPENT in adapter when executed.
  await srv.close();
  runnerCalls = 0;
  srv = await startEphemeral();
  port = srv.address.port;
  const r1 = await post(port, validBody({ execution_id: "spent-1", authorization_id: "AUTH-SPENT-1" }));
  assert.equal(r1.json.adapter_result.authorization_state_final, "SPENT");
  assert.equal(runnerCalls, 1);
  const r2 = await post(port, validBody({ execution_id: "spent-2", authorization_id: "AUTH-SPENT-1" }));
  assert.equal(r2.status, 409);
  assert.equal(r2.json.classification, "AUTHORIZATION_ID_REUSED");
  assert.equal(runnerCalls, 1);
});

await test("single-flight concurrency → second request fail-closed without execution", async () => {
  await srv.close();
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  let occStarted = 0;
  runnerCalls = 0;
  srv = await startEphemeral({
    getOccupancy: async () => {
      occStarted += 1;
      await gate;
      return "QWEN_READY_IDLE";
    },
    runOpenCode: mockRunner(),
  });
  port = srv.address.port;

  const p1 = post(port, validBody({ execution_id: "busy-1", authorization_id: "AUTH-BUSY-1" }));
  // Wait until first holds inFlight
  for (let i = 0; i < 50 && occStarted < 1; i += 1) {
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.equal(occStarted, 1);
  const r2 = await post(port, validBody({ execution_id: "busy-2", authorization_id: "AUTH-BUSY-2" }));
  assert.equal(r2.status, 409);
  assert.equal(r2.json.classification, "EXECUTION_BUSY");
  assert.equal(runnerCalls, 0);
  release();
  const r1 = await p1;
  assert.equal(r1.status, 200);
  assert.equal(runnerCalls, 1);
});

await test("runtime authorization forwarded unchanged to adapter", async () => {
  await srv.close();
  let seenAuth = null;
  srv = await startEphemeral({
    getOccupancy: mockOccupancy(),
    runOpenCode: async (ctx) => {
      seenAuth = ctx.authorization;
      return mockRunner()(ctx);
    },
  });
  port = srv.address.port;
  const auth = validAuth({ authorization_id: "AUTH-FWD-1" });
  await post(port, validBody({ execution_id: "fwd-1", runtime_authorization: auth }));
  assert.deepEqual(seenAuth, auth);
});

await test("workspace is server-side only; request cannot override", async () => {
  const body = {
    ...validBody({ execution_id: "ws-1", authorization_id: "AUTH-WS-1" }),
    workspaceRoot: "C:\\\\evil",
    workspace: "C:\\\\evil",
  };
  const r = await post(port, body);
  assert.equal(r.status, 400);
  assert.equal(r.json.classification, "ENDPOINT_SCHEMA_REJECTED");
});

await test("response conforms and execution_performed matches adapter", async () => {
  const r = await post(port, validBody({ execution_id: "shape-1", authorization_id: "AUTH-SHAPE-1" }));
  assert.equal(r.json.schema_version, "v4-windows-local-execution-endpoint-result-v1");
  for (const k of [
    "schema_version",
    "ok",
    "classification",
    "execution_id",
    "replayed",
    "execution_performed",
    "adapter_result",
    "reason_codes",
  ]) {
    assert.ok(k in r.json, k);
  }
  assert.equal(r.json.execution_performed, r.json.adapter_result.execution_performed);
  assert.ok(!responseLeak(r.json));
  // fingerprint helper deterministic
  const fp1 = mod.requestFingerprint(validBody({ execution_id: "x" }));
  const fp2 = mod.requestFingerprint(validBody({ execution_id: "x" }));
  assert.equal(fp1, fp2);
  assert.equal(fp1.length, 64);
  void createHash;
});

function mockSpawnChildClose(code, signal = null) {
  return () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    setImmediate(() => child.emit("close", code, signal));
    return child;
  };
}

function productionRunnerWithSpawn(spawnImpl) {
  return mod.createProductionRunOpenCode({
    workspaceRoot: ROOT,
    resolveOpenCodeNoShellInvocation: () => ({
      ok: true,
      nodePath: process.execPath,
      scriptPath: join(ROOT, "package.json"),
      shell: false,
    }),
    writeOverlay: () => join(ROOT, "package.json"),
    spawnImpl,
  });
}

await test("production runner exit code 0 returns success accounting", async () => {
  let spawnCount = 0;
  const run = productionRunnerWithSpawn(() => {
    spawnCount += 1;
    return mockSpawnChildClose(0)();
  });
  const result = await run({
    guardBaseUrl: "http://127.0.0.1:59999",
    modelId: "m",
    message: "hi",
  });
  assert.equal(spawnCount, 1);
  assert.equal(result.opencode_execution_count, 1);
  assert.equal(result.retry_calls, 0);
  assert.equal(result.fallback_calls, 0);
  assert.equal(Object.hasOwn(result, "qwen_generation_calls"), false);
  assert.equal(Object.hasOwn(result, "upstream_generation_requests"), false);
});

await test("voluminous child output is drained without retention and does not leak", async () => {
  const marker = "VOLUMINOUS_RAW_OUTPUT_MUST_NOT_LEAK_" + "X".repeat(1024);
  let stdoutResumed = false;
  let stderrResumed = false;
  const run = productionRunnerWithSpawn(() => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdout.resume = function resume() {
      stdoutResumed = true;
      return this;
    };
    child.stderr.resume = function resume() {
      stderrResumed = true;
      return this;
    };
    setImmediate(() => {
      const chunk = Buffer.from(marker);
      for (let i = 0; i < 40; i += 1) {
        child.stdout.emit("data", chunk);
        child.stderr.emit("data", chunk);
      }
      child.emit("close", 0, null);
    });
    return child;
  });
  const result = await run({
    guardBaseUrl: "http://127.0.0.1:59999",
    modelId: "m",
    message: "hi",
  });
  assert.equal(stdoutResumed, true);
  assert.equal(stderrResumed, true);
  assert.equal(result.opencode_execution_count, 1);
  assert.ok(!JSON.stringify(result).includes("VOLUMINOUS_RAW_OUTPUT"));
});

function mockGuardStart(upstream = 0) {
  return async () => ({
    base_url: "http://127.0.0.1:59999",
    getAccounting: () => ({
      upstream_generation_requests: upstream,
      blocked_generation_requests: 0,
    }),
    close: async () => {},
  });
}

await test("exit 0 + guard upstream 0 → ZERO_GENERATION, EXECUTED, no synthetic runner gens", async () => {
  const runOpenCode = productionRunnerWithSpawn(mockSpawnChildClose(0));
  const adapter = await executeOpenCodeBounded(
    {
      execution_id: "zero-gen-1",
      runtime_authorization: validAuth({ authorization_id: "AUTH-ZERO-GEN-1" }),
      message: "bounded offline goal",
    },
    {
      getOccupancy: async () => "QWEN_READY_IDLE",
      runOpenCode,
      guardStart: mockGuardStart(0),
    },
  );
  assert.equal(adapter.status, "EXECUTED");
  assert.equal(adapter.execution_performed, true);
  assert.equal(adapter.authorization_state_final, "SPENT");
  assert.equal(adapter.opencode_execution_count, 1);
  assert.equal(adapter.guard_upstream_generation_requests, 0);
  assert.equal(adapter.qwen_generation_calls, 0);
  assert.ok(adapter.reason_codes.includes("ZERO_GENERATION"));
  assert.ok(!adapter.reason_codes.includes("SINGLE_GENERATION"));
});

await test("exit 0 + guard upstream 1 → SINGLE_GENERATION from guard accounting", async () => {
  const runOpenCode = productionRunnerWithSpawn(mockSpawnChildClose(0));
  const adapter = await executeOpenCodeBounded(
    {
      execution_id: "single-gen-1",
      runtime_authorization: validAuth({ authorization_id: "AUTH-SINGLE-GEN-1" }),
      message: "bounded offline goal",
    },
    {
      getOccupancy: async () => "QWEN_READY_IDLE",
      runOpenCode,
      guardStart: mockGuardStart(1),
    },
  );
  assert.equal(adapter.status, "EXECUTED");
  assert.equal(adapter.execution_performed, true);
  assert.equal(adapter.authorization_state_final, "SPENT");
  assert.equal(adapter.opencode_execution_count, 1);
  assert.equal(adapter.guard_upstream_generation_requests, 1);
  assert.equal(adapter.qwen_generation_calls, 1);
  assert.ok(adapter.reason_codes.includes("SINGLE_GENERATION"));
});

await test("production runner exit code non-zero rejects without success accounting", async () => {
  const run = productionRunnerWithSpawn(mockSpawnChildClose(1));
  await assert.rejects(
    () =>
      run({
        guardBaseUrl: "http://127.0.0.1:59999",
        modelId: "m",
        message: "hi",
      }),
    /OPENCODE_EXIT_NONZERO/,
  );
});

await test("production runner signal termination fails closed", async () => {
  const run = productionRunnerWithSpawn(mockSpawnChildClose(null, "SIGTERM"));
  await assert.rejects(
    () =>
      run({
        guardBaseUrl: "http://127.0.0.1:59999",
        modelId: "m",
        message: "hi",
      }),
    /OPENCODE_TERMINATED_BY_SIGNAL/,
  );
});

await test("endpoint non-zero OpenCode exit → ERROR/SPENT/execution_performed=false", async () => {
  let spawnCount = 0;
  const failSrv = await mod.startWindowsLocalExecutionService({
    host: "127.0.0.1",
    port: 0,
    workspaceRoot: ROOT,
    getOccupancy: mockOccupancy(),
    runOpenCode: productionRunnerWithSpawn(() => {
      spawnCount += 1;
      const child = mockSpawnChildClose(2)();
      child.stderr.emit("data", Buffer.from("secret stderr must not leak"));
      child.stdout.emit("data", Buffer.from("model output must not leak"));
      return child;
    }),
  });
  const failPort = failSrv.address.port;
  const r = await post(
    failPort,
    validBody({ execution_id: "nz-exit-1", authorization_id: "AUTH-NZ-EXIT-1" }),
  );
  assert.equal(r.status, 200);
  assert.equal(spawnCount, 1);
  assert.equal(r.json.execution_performed, false);
  assert.equal(r.json.adapter_result.status, "ERROR");
  assert.equal(r.json.adapter_result.authorization_state_final, "SPENT");
  assert.notEqual(r.json.adapter_result.status, "EXECUTED");
  assert.ok(r.json.adapter_result.reason_codes.includes("EXECUTION_BOUNDS_VIOLATION"));
  assert.ok(r.json.adapter_result.reason_codes.includes("OPENCODE_EXIT_NONZERO"));
  assert.ok(!responseLeak(r.json));
  assert.ok(!r.text.includes("secret stderr"));
  assert.ok(!r.text.includes("model output"));
  await failSrv.close();
});

await test("production runner rejects missing workspace before spawn", async () => {
  const run = mod.createProductionRunOpenCode({
    workspaceRoot: null,
    resolveOpenCodeNoShellInvocation: () => ({
      ok: true,
      nodePath: process.execPath,
      scriptPath: "x.js",
      shell: false,
    }),
    spawnImpl: () => {
      throw new Error("SPAWN_MUST_NOT_RUN");
    },
  });
  await assert.rejects(
    () =>
      run({
        guardBaseUrl: "http://127.0.0.1:9",
        modelId: "m",
        message: "hi",
      }),
    /WORKSPACE_ROOT_INVALID/,
  );
});

await test("production runner rejects direct Qwen endpoint as OpenCode target", async () => {
  const run = mod.createProductionRunOpenCode({
    workspaceRoot: ROOT,
    spawnImpl: () => {
      throw new Error("SPAWN_MUST_NOT_RUN");
    },
  });
  await assert.rejects(
    () =>
      run({
        guardBaseUrl: "http://127.0.0.1:8080",
        modelId: "m",
        message: "hi",
      }),
    /DIRECT_QWEN_ENDPOINT_FORBIDDEN|GUARD_BASE_URL_INVALID/,
  );
});

await srv.close();

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`- ${f.name}: ${f.message}`);
  process.exit(1);
}
process.exit(0);
