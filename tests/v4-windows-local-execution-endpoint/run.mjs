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
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { executeOpenCodeBounded } from "../../tools/opencode-execution-adapter-v1.mjs";
import {
  admitAuthorization as realAdmit,
  inspectAuthorization as realInspect,
  loadRegistry as realLoad,
  REGISTRY_SCHEMA_VERSION,
} from "../../tools/v4-runtime-authorization-provenance-registry-v1.mjs";
import {
  inspectDurableSpend as realInspectLedger,
  recordDurableSpend as realRecordLedger,
  loadSpendLedger as realLoadLedger,
  LEDGER_SCHEMA_VERSION,
} from "../../tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs";

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

function countingAdapter() {
  return async (request, options) => {
    adapterCalls += 1;
    return executeOpenCodeBounded(request, options);
  };
}

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

function rfc3339(offsetMs) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function writeRegistry(path, entries) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ schema_version: REGISTRY_SCHEMA_VERSION, entries }, null, 2)}\n`);
}

function writeLedger(path, spends = []) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify({ schema_version: LEDGER_SCHEMA_VERSION, spends }, null, 2)}\n`,
  );
}

function ledgerState(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const REG_DIR = mkdtempSync(join(tmpdir(), "v4-auth-reg-"));
const REGISTRY_PATH = join(REG_DIR, "registry.json");
const LEDGER_PATH = join(REG_DIR, "ledger.json");

function activeEntry(authorization_id, overrides = {}) {
  return {
    authorization_id,
    state: "ACTIVE",
    route_id: "opencode+qwen_local",
    issued_at: rfc3339(-60_000),
    expires_at: rfc3339(3_600_000),
    spent_at: null,
    ...overrides,
  };
}

let adapterCalls = 0;

async function startEphemeral(extra = {}) {
  if (!extra.authorizationSpendLedgerPath && !existsSync(LEDGER_PATH)) {
    writeLedger(LEDGER_PATH, []);
  }
  return mod.startWindowsLocalExecutionService({
    host: "127.0.0.1",
    port: 0,
    workspaceRoot: ROOT,
    getOccupancy: mockOccupancy(),
    runOpenCode: mockRunner(),
    executeOpenCodeBounded: countingAdapter(),
    authorizationRegistryPath: REGISTRY_PATH,
    authorizationSpendLedgerPath: LEDGER_PATH,
    inspectAuthorization: (path, id, opts) => realInspect(path, id, opts),
    admitAuthorization: (path, id, opts) => realAdmit(path, id, opts),
    inspectDurableSpend: (path, id, opts) => realInspectLedger(path, id, opts),
    recordDurableSpend: (path, rec, opts) => realRecordLedger(path, rec, opts),
    ...extra,
  });
}

async function startWithPaths(regPath, ledgerPath, extra = {}) {
  return mod.startWindowsLocalExecutionService({
    host: "127.0.0.1",
    port: 0,
    workspaceRoot: ROOT,
    authorizationRegistryPath: regPath,
    authorizationSpendLedgerPath: ledgerPath,
    inspectAuthorization: (path, id, opts) => realInspect(path, id, opts),
    admitAuthorization: (path, id, opts) => realAdmit(path, id, opts),
    inspectDurableSpend: (path, id, opts) => realInspectLedger(path, id, opts),
    recordDurableSpend: (path, rec, opts) => realRecordLedger(path, rec, opts),
    getOccupancy: mockOccupancy(),
    runOpenCode: mockRunner(),
    executeOpenCodeBounded: countingAdapter(),
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
  adapterCalls = 0;
  // Registry with the ids used by the happy-path tests below.
  writeRegistry(REGISTRY_PATH, [
    activeEntry("AUTH-OK-1"),
    activeEntry("AUTH-Q1"),
    activeEntry("AUTH-CT1"),
    activeEntry("AUTH-EXTRA-1"),
    activeEntry("AUTH-BAD"),
    activeEntry("AUTH-OCC"),
    activeEntry("AUTH-REPLAY-1"),
    activeEntry("AUTH-SPENT-1"),
    activeEntry("AUTH-BUSY-1"),
    activeEntry("AUTH-BUSY-2"),
    activeEntry("AUTH-FWD-1"),
    activeEntry("AUTH-WS-1"),
    activeEntry("AUTH-SHAPE-1"),
    activeEntry("AUTH-NZ-EXIT-1"),
  ]);
  writeLedger(LEDGER_PATH, []);
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
  writeRegistry(REGISTRY_PATH, [activeEntry("AUTH-OCC")]);
  writeLedger(LEDGER_PATH, []);
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
  writeRegistry(REGISTRY_PATH, [activeEntry("AUTH-REPLAY-1")]);
  writeLedger(LEDGER_PATH, []);
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

await test("same authorization_id + new execution_id after registry spend → AUTHORIZATION_REJECTED", async () => {
  const beforeR = runnerCalls;
  const r = await post(
    port,
    validBody({ execution_id: "replay-2", authorization_id: "AUTH-REPLAY-1" }),
  );
  assert.equal(r.status, 200);
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_ALREADY_SPENT"));
  assert.equal(r.json.adapter_result, null);
  assert.equal(runnerCalls, beforeR);
});

await test("SPENT authorization cannot produce a second execution", async () => {
  await srv.close();
  runnerCalls = 0;
  writeRegistry(REGISTRY_PATH, [activeEntry("AUTH-SPENT-1")]);
  writeLedger(LEDGER_PATH, []);
  srv = await startEphemeral();
  port = srv.address.port;
  const r1 = await post(port, validBody({ execution_id: "spent-1", authorization_id: "AUTH-SPENT-1" }));
  assert.equal(r1.json.adapter_result.authorization_state_final, "SPENT");
  assert.equal(runnerCalls, 1);
  const r2 = await post(port, validBody({ execution_id: "spent-2", authorization_id: "AUTH-SPENT-1" }));
  assert.equal(r2.status, 200);
  assert.equal(r2.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r2.json.reason_codes.includes("AUTHORIZATION_ALREADY_SPENT"));
  assert.equal(r2.json.adapter_result, null);
  assert.equal(runnerCalls, 1);
});

await test("single-flight concurrency → second request fail-closed without execution", async () => {
  await srv.close();
  writeRegistry(REGISTRY_PATH, [activeEntry("AUTH-BUSY-1"), activeEntry("AUTH-BUSY-2")]);
  writeLedger(LEDGER_PATH, []);
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
  writeRegistry(REGISTRY_PATH, [activeEntry("AUTH-FWD-1")]);
  writeLedger(LEDGER_PATH, []);
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
  writeRegistry(REGISTRY_PATH, [activeEntry("AUTH-SHAPE-1")]);
  writeLedger(LEDGER_PATH, []);
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
  const nzReg = join(REG_DIR, "nz-exit.json");
  const nzLed = join(REG_DIR, "nz-exit.ledger.json");
  writeRegistry(nzReg, [activeEntry("AUTH-NZ-EXIT-1")]);
  writeLedger(nzLed, []);
  const failSrv = await startWithPaths(nzReg, nzLed, {
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

// ---------- provenance registry + durable ledger tests ----------

function registryState(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function pairPaths(name) {
  return {
    reg: join(REG_DIR, `${name}.json`),
    led: join(REG_DIR, `${name}.ledger.json`),
  };
}

await test("P1 registry empty + unknown schema-valid id → rejected, zero adapter/occupancy/runner", async () => {
  const { reg, led } = pairPaths("p1");
  writeRegistry(reg, []);
  writeLedger(led, []);
  let occ = 0;
  let run = 0;
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    getOccupancy: async () => {
      occ += 1;
      return "QWEN_READY_IDLE";
    },
    runOpenCode: async () => {
      run += 1;
      return {
        opencode_execution_count: 1,
        retry_calls: 0,
        fallback_calls: 0,
        response_validation: "NOT_VALIDATED",
      };
    },
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "p1-1", authorization_id: "AUTH-UNKNOWN-1" }));
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, false);
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_ID_NOT_ISSUED"));
  assert.equal(r.json.execution_performed, false);
  assert.equal(r.json.adapter_result, null);
  assert.equal(r.json.replayed, false);
  assert.equal(exec, 0);
  assert.equal(occ, 0);
  assert.equal(run, 0);
  await s.close();
});

await test("P2 registry missing → fail closed pre-adapter", async () => {
  const { reg, led } = pairPaths("p2");
  writeLedger(led, []);
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "p2-1", authorization_id: "AUTH-P2" }));
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_REGISTRY_UNAVAILABLE"));
  assert.equal(exec, 0);
  await s.close();
});

await test("P3 registry malformed → fail closed pre-adapter", async () => {
  const { reg, led } = pairPaths("p3");
  mkdirSync(dirname(reg), { recursive: true });
  writeFileSync(reg, "{ not json");
  writeLedger(led, []);
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "p3-1", authorization_id: "AUTH-P3" }));
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_REGISTRY_INVALID"));
  assert.equal(exec, 0);
  await s.close();
});

await test("P4 duplicate authorization_id in registry → fail closed", async () => {
  const regPath = join(REG_DIR, "dup.json");
  writeRegistry(regPath, [activeEntry("AUTH-DUP"), activeEntry("AUTH-DUP")]);
  const result = realAdmit(regPath, "AUTH-DUP", {});
  assert.equal(result.ok, false);
  assert.ok(result.reason_codes.includes("AUTHORIZATION_REGISTRY_INVALID"));
});

await test("P5 SPENT id → AUTHORIZATION_ALREADY_SPENT", async () => {
  const regPath = join(REG_DIR, "p5.json");
  writeRegistry(regPath, [activeEntry("AUTH-P5", { state: "SPENT", spent_at: rfc3339(-1_000) })]);
  const result = realAdmit(regPath, "AUTH-P5", {});
  assert.equal(result.ok, false);
  assert.ok(result.reason_codes.includes("AUTHORIZATION_ALREADY_SPENT"));
});

await test("P6 expired id → AUTHORIZATION_EXPIRED", async () => {
  const regPath = join(REG_DIR, "p6.json");
  writeRegistry(regPath, [activeEntry("AUTH-P6", { expires_at: rfc3339(-60_000) })]);
  const result = realAdmit(regPath, "AUTH-P6", {});
  assert.equal(result.ok, false);
  assert.ok(result.reason_codes.includes("AUTHORIZATION_EXPIRED"));
});

await test("P7 invalid registry route_id → AUTHORIZATION_REGISTRY_INVALID", async () => {
  const regPath = join(REG_DIR, "p7.json");
  writeRegistry(regPath, [activeEntry("AUTH-P7", { route_id: "other+route" })]);
  const result = realLoad(regPath);
  assert.equal(result.ok, false);
  assert.ok(result.reason_codes.includes("AUTHORIZATION_REGISTRY_INVALID"));
});

await test("P8 ACTIVE valid id → ledger+registry spent before adapter", async () => {
  const { reg, led } = pairPaths("p8");
  writeRegistry(reg, [activeEntry("AUTH-P8")]);
  writeLedger(led, []);
  let registryStateAtAdapter = null;
  let ledgerStateAtAdapter = null;
  const s = await startWithPaths(reg, led, {
    executeOpenCodeBounded: async (req, o) => {
      registryStateAtAdapter = registryState(reg);
      ledgerStateAtAdapter = ledgerState(led);
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "p8-1", authorization_id: "AUTH-P8" }));
  assert.equal(r.json.ok, true);
  const entry = registryStateAtAdapter.entries.find((e) => e.authorization_id === "AUTH-P8");
  assert.equal(entry.state, "SPENT");
  assert.ok(entry.spent_at);
  assert.equal(ledgerStateAtAdapter.spends.length, 1);
  assert.equal(ledgerStateAtAdapter.spends[0].authorization_id, "AUTH-P8");
  await s.close();
});

await test("P9 registry spend persistence failure after ledger → adapter 0, ledger durable", async () => {
  const { reg, led } = pairPaths("p9");
  writeRegistry(reg, [activeEntry("AUTH-P9")]);
  writeLedger(led, []);
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    admitAuthorization: (p, id, o) =>
      realAdmit(p, id, {
        ...o,
        persistRegistry: () => {
          throw new Error("DISK_FULL");
        },
      }),
    executeOpenCodeBounded: async (req, opts) => {
      exec += 1;
      return executeOpenCodeBounded(req, opts);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "p9-1", authorization_id: "AUTH-P9" }));
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_REGISTRY_UNAVAILABLE"));
  assert.equal(exec, 0);
  assert.equal(ledgerState(led).spends.length, 1);
  assert.equal(registryState(reg).entries.find((e) => e.authorization_id === "AUTH-P9").state, "ACTIVE");
  await s.close();
});

await test("P10 second request same authorization_id → rejected server-side, no second adapter", async () => {
  const { reg, led } = pairPaths("p10");
  writeRegistry(reg, [activeEntry("AUTH-P10")]);
  writeLedger(led, []);
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const p = s.address.port;
  const r1 = await post(p, validBody({ execution_id: "p10-1", authorization_id: "AUTH-P10" }));
  assert.equal(r1.json.ok, true);
  const r2 = await post(p, validBody({ execution_id: "p10-2", authorization_id: "AUTH-P10" }));
  assert.equal(r2.status, 200);
  assert.equal(r2.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r2.json.reason_codes.includes("AUTHORIZATION_ALREADY_SPENT"));
  assert.equal(r2.json.adapter_result, null);
  assert.equal(r2.json.execution_performed, false);
  assert.equal(exec, 1);
  await s.close();
});

await test("P11 occupancy-blocked after admission → ledger consumed + registry SPENT", async () => {
  const { reg, led } = pairPaths("p11");
  writeRegistry(reg, [activeEntry("AUTH-P11")]);
  writeLedger(led, []);
  const s = await startWithPaths(reg, led, {
    getOccupancy: mockOccupancy("QWEN_BUSY"),
  });
  const r = await post(s.address.port, validBody({ execution_id: "p11-1", authorization_id: "AUTH-P11" }));
  assert.equal(r.json.adapter_result.classification, "OCCUPANCY_BLOCKED");
  assert.equal(registryState(reg).entries.find((e) => e.authorization_id === "AUTH-P11").state, "SPENT");
  assert.equal(ledgerState(led).spends.length, 1);
  await s.close();
});

await test("P12 same execution_id + same fingerprint retained replay preserved", async () => {
  const { reg, led } = pairPaths("p12");
  writeRegistry(reg, [activeEntry("AUTH-P12")]);
  writeLedger(led, []);
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const p = s.address.port;
  const body = validBody({ execution_id: "p12-replay", authorization_id: "AUTH-P12" });
  const r1 = await post(p, body);
  assert.equal(r1.json.replayed, false);
  const r2 = await post(p, body);
  assert.equal(r2.json.replayed, true);
  assert.equal(exec, 1);
  await s.close();
});

await test("P13 same execution_id + different fingerprint → EXECUTION_ID_CONFLICT preserved", async () => {
  const { reg, led } = pairPaths("p13");
  writeRegistry(reg, [activeEntry("AUTH-P13")]);
  writeLedger(led, []);
  const s = await startWithPaths(reg, led, {});
  const p = s.address.port;
  await post(p, validBody({ execution_id: "p13-x", authorization_id: "AUTH-P13" }));
  const r2 = await post(p, validBody({ execution_id: "p13-x", authorization_id: "AUTH-P13", message: "changed" }));
  assert.equal(r2.status, 409);
  assert.equal(r2.json.classification, "EXECUTION_ID_CONFLICT");
  await s.close();
});

await test("P14 request-supplied registry/path override impossible", async () => {
  const body = {
    ...validBody({ execution_id: "p14-1", authorization_id: "AUTH-OK-1" }),
    authorization_registry: "C:\\\\evil\\\\reg.json",
    registry_path: "C:\\\\evil\\\\reg.json",
    authorization_spend_ledger: "C:\\\\evil\\\\led.json",
    spend_ledger_path: "C:\\\\evil\\\\led.json",
  };
  const r = await post(port, body);
  assert.equal(r.status, 400);
  assert.equal(r.json.classification, "ENDPOINT_SCHEMA_REJECTED");
});

await test("P15 old Git operator auth ids are NOT automatically trusted", async () => {
  const { reg, led } = pairPaths("p15");
  writeRegistry(reg, []);
  writeLedger(led, []);
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(
    s.address.port,
    validBody({
      execution_id: "p15-1",
      authorization_id: "V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF",
    }),
  );
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_ID_NOT_ISSUED"));
  assert.equal(exec, 0);
  await s.close();
});

await test("P16 response contains no registry filesystem details", async () => {
  const { reg, led } = pairPaths("p16");
  writeRegistry(reg, [activeEntry("AUTH-P16")]);
  writeLedger(led, []);
  const s = await startWithPaths(reg, led, {});
  const r = await post(s.address.port, validBody({ execution_id: "p16-1", authorization_id: "AUTH-P16" }));
  assert.ok(!r.text.includes("p16.json"));
  assert.ok(!r.text.includes("v4-auth-reg"));
  assert.ok(!r.text.toLowerCase().includes("localappdata"));
  assert.ok(!responseLeak(r.json));
  await s.close();
});

await test("P17 no registry path configured → fail closed pre-adapter", async () => {
  const led = join(REG_DIR, "p17.ledger.json");
  writeLedger(led, []);
  let exec = 0;
  const s = await startWithPaths(null, led, {
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "p17-1", authorization_id: "AUTH-P17" }));
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_REGISTRY_UNAVAILABLE"));
  assert.equal(exec, 0);
  await s.close();
});

await test("L13 missing ledger → pre-adapter AUTHORIZATION_REJECTED", async () => {
  const { reg, led } = pairPaths("l13");
  writeRegistry(reg, [activeEntry("AUTH-L13")]);
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    authorizationSpendLedgerPath: null,
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "l13-1", authorization_id: "AUTH-L13" }));
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE"));
  assert.equal(exec, 0);
  await s.close();
});

await test("L14 spent ledger id → pre-registry/adapter reject", async () => {
  const { reg, led } = pairPaths("l14");
  writeRegistry(reg, [activeEntry("AUTH-L14")]);
  writeLedger(led, [
    {
      authorization_id: "AUTH-L14",
      execution_id: "prior",
      route_id: "future+other_route",
      spent_at: rfc3339(-1000),
      spend_kind: "ADMISSION_CONSUMED",
    },
  ]);
  let exec = 0;
  let inspectRegCalls = 0;
  const s = await startWithPaths(reg, led, {
    inspectAuthorization: (p, id, o) => {
      inspectRegCalls += 1;
      return realInspect(p, id, o);
    },
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "l14-1", authorization_id: "AUTH-L14" }));
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_ALREADY_SPENT"));
  assert.equal(r.json.adapter_result, null);
  assert.equal(exec, 0);
  assert.equal(inspectRegCalls, 0);
  await s.close();
});

await test("L15 ledger persistence failure → registry unspent + adapter 0", async () => {
  const { reg, led } = pairPaths("l15");
  writeRegistry(reg, [activeEntry("AUTH-L15")]);
  writeLedger(led, []);
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    recordDurableSpend: (p, rec, o) =>
      realRecordLedger(p, rec, {
        ...o,
        persistSpendLedger: () => {
          throw new Error("LEDGER_DISK");
        },
      }),
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "l15-1", authorization_id: "AUTH-L15" }));
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE"));
  assert.equal(exec, 0);
  assert.equal(ledgerState(led).spends.length, 0);
  assert.equal(registryState(reg).entries.find((e) => e.authorization_id === "AUTH-L15").state, "ACTIVE");
  await s.close();
});

await test("L16 ledger success + registry spend failure → ledger durable + adapter 0", async () => {
  const { reg, led } = pairPaths("l16");
  writeRegistry(reg, [activeEntry("AUTH-L16")]);
  writeLedger(led, []);
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    admitAuthorization: (p, id, o) =>
      realAdmit(p, id, {
        ...o,
        persistRegistry: () => {
          throw new Error("REG_DISK");
        },
      }),
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "l16-1", authorization_id: "AUTH-L16" }));
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_REGISTRY_UNAVAILABLE"));
  assert.equal(exec, 0);
  assert.equal(ledgerState(led).spends.length, 1);
  assert.equal(registryState(reg).entries.find((e) => e.authorization_id === "AUTH-L16").state, "ACTIVE");
  await s.close();
});

await test("L17 retry after L16 partial failure → AUTHORIZATION_ALREADY_SPENT from ledger", async () => {
  const { reg, led } = pairPaths("l16");
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "l17-1", authorization_id: "AUTH-L16" }));
  assert.equal(r.json.classification, "AUTHORIZATION_REJECTED");
  assert.ok(r.json.reason_codes.includes("AUTHORIZATION_ALREADY_SPENT"));
  assert.equal(exec, 0);
  await s.close();
});

await test("L18 admission order spy: ledger persist BEFORE registry persist BEFORE adapter", async () => {
  const { reg, led } = pairPaths("l18");
  writeRegistry(reg, [activeEntry("AUTH-L18")]);
  writeLedger(led, []);
  const order = [];
  const s = await startWithPaths(reg, led, {
    recordDurableSpend: (p, rec, o) => {
      order.push("ledger");
      return realRecordLedger(p, rec, o);
    },
    admitAuthorization: (p, id, o) => {
      order.push("registry");
      return realAdmit(p, id, o);
    },
    executeOpenCodeBounded: async (req, o) => {
      order.push("adapter");
      return executeOpenCodeBounded(req, o);
    },
  });
  const r = await post(s.address.port, validBody({ execution_id: "l18-1", authorization_id: "AUTH-L18" }));
  assert.equal(r.json.ok, true);
  assert.deepEqual(order, ["ledger", "registry", "adapter"]);
  await s.close();
});

await test("L19 occupancy blocked after admission → ledger consumed + registry SPENT", async () => {
  const { reg, led } = pairPaths("l19");
  writeRegistry(reg, [activeEntry("AUTH-L19")]);
  writeLedger(led, []);
  const s = await startWithPaths(reg, led, {
    getOccupancy: mockOccupancy("QWEN_BUSY"),
  });
  const r = await post(s.address.port, validBody({ execution_id: "l19-1", authorization_id: "AUTH-L19" }));
  assert.equal(r.json.adapter_result.classification, "OCCUPANCY_BLOCKED");
  assert.equal(ledgerState(led).spends.length, 1);
  assert.equal(registryState(reg).entries.find((e) => e.authorization_id === "AUTH-L19").state, "SPENT");
  await s.close();
});

await test("L20 same execution_id/same fingerprint replay before ledger", async () => {
  const { reg, led } = pairPaths("l20");
  writeRegistry(reg, [activeEntry("AUTH-L20")]);
  writeLedger(led, []);
  let ledgerInspects = 0;
  let exec = 0;
  const s = await startWithPaths(reg, led, {
    inspectDurableSpend: (p, id, o) => {
      ledgerInspects += 1;
      return realInspectLedger(p, id, o);
    },
    executeOpenCodeBounded: async (req, o) => {
      exec += 1;
      return executeOpenCodeBounded(req, o);
    },
  });
  const body = validBody({ execution_id: "l20-replay", authorization_id: "AUTH-L20" });
  const r1 = await post(s.address.port, body);
  assert.equal(r1.json.replayed, false);
  const afterFirst = ledgerInspects;
  const r2 = await post(s.address.port, body);
  assert.equal(r2.json.replayed, true);
  assert.equal(ledgerInspects, afterFirst);
  assert.equal(exec, 1);
  await s.close();
});

await test("L21 same execution_id/different fingerprint conflict before ledger", async () => {
  const { reg, led } = pairPaths("l21");
  writeRegistry(reg, [activeEntry("AUTH-L21")]);
  writeLedger(led, []);
  let ledgerInspects = 0;
  const s = await startWithPaths(reg, led, {
    inspectDurableSpend: (p, id, o) => {
      ledgerInspects += 1;
      return realInspectLedger(p, id, o);
    },
  });
  await post(s.address.port, validBody({ execution_id: "l21-x", authorization_id: "AUTH-L21" }));
  const afterFirst = ledgerInspects;
  const r2 = await post(
    s.address.port,
    validBody({ execution_id: "l21-x", authorization_id: "AUTH-L21", message: "changed" }),
  );
  assert.equal(r2.status, 409);
  assert.equal(r2.json.classification, "EXECUTION_ID_CONFLICT");
  assert.equal(ledgerInspects, afterFirst);
  await s.close();
});

await test("L22 busy path does not consume ledger for second auth", async () => {
  const { reg, led } = pairPaths("l22");
  writeRegistry(reg, [activeEntry("AUTH-L22A"), activeEntry("AUTH-L22B")]);
  writeLedger(led, []);
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  let occStarted = 0;
  const s = await startWithPaths(reg, led, {
    getOccupancy: async () => {
      occStarted += 1;
      await gate;
      return "QWEN_READY_IDLE";
    },
  });
  const p1 = post(s.address.port, validBody({ execution_id: "l22-1", authorization_id: "AUTH-L22A" }));
  for (let i = 0; i < 50 && occStarted < 1; i += 1) {
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.equal(occStarted, 1);
  const r2 = await post(s.address.port, validBody({ execution_id: "l22-2", authorization_id: "AUTH-L22B" }));
  assert.equal(r2.status, 409);
  assert.equal(r2.json.classification, "EXECUTION_BUSY");
  const mid = ledgerState(led);
  assert.equal(mid.spends.length, 1);
  assert.equal(mid.spends[0].authorization_id, "AUTH-L22A");
  assert.ok(!mid.spends.some((e) => e.authorization_id === "AUTH-L22B"));
  release();
  await p1;
  await s.close();
});

await test("L23 request cannot override ledger/path", async () => {
  const body = {
    ...validBody({ execution_id: "l23-1", authorization_id: "AUTH-SHAPE-1" }),
    authorization_spend_ledger: "C:\\\\evil\\\\ledger.json",
    spend_ledger: { spends: [] },
  };
  const r = await post(port, body);
  assert.equal(r.status, 400);
  assert.equal(r.json.classification, "ENDPOINT_SCHEMA_REJECTED");
});

await test("L24 response leaks no ledger path/content", async () => {
  const { reg, led } = pairPaths("l24");
  writeRegistry(reg, [activeEntry("AUTH-L24")]);
  writeLedger(led, []);
  const s = await startWithPaths(reg, led, {});
  const r = await post(s.address.port, validBody({ execution_id: "l24-1", authorization_id: "AUTH-L24" }));
  assert.ok(!r.text.includes("l24.ledger"));
  assert.ok(!r.text.includes("spend-ledger"));
  assert.ok(!r.text.toLowerCase().includes("localappdata"));
  assert.ok(!responseLeak(r.json));
  await s.close();
});

await test("L25 request/response schema files unchanged vs contracts", async () => {
  const req = await readFile(
    join(ROOT, "docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json"),
    "utf8",
  );
  const res = await readFile(
    join(ROOT, "docs/contracts/v4-windows-local-execution-endpoint-v1.response.schema.json"),
    "utf8",
  );
  assert.ok(req.includes("v4-windows-local-execution-endpoint-request-v1"));
  assert.ok(res.includes("v4-windows-local-execution-endpoint-result-v1"));
  assert.ok(!req.includes("spend_ledger"));
  assert.ok(!req.includes("authorization_spend_ledger"));
  assert.ok(!res.includes("spend_ledger"));
});

await srv.close();

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.error(`- ${f.name}: ${f.message}`);
  process.exit(1);
}
process.exit(0);
