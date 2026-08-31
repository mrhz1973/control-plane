#!/usr/bin/env node
/**
 * Target suite for tools/serve-v4-local-runtime-readonly-contribution-v1.mjs.
 * Offline: DI/mocks only. No real PowerShell, no provider/network beyond loopback test server.
 * Test binds use OS-assigned ephemeral ports (listen port 0); production default 18790 is untouched.
 */
import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOL = join(HERE, "..", "..", "tools", "serve-v4-local-runtime-readonly-contribution-v1.mjs");
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

function fakeProducerWrapper() {
  const now = new Date().toISOString();
  return {
    schema_version: "v4-local-runtime-readonly-contribution-result-v1",
    ok: true,
    qwen_occupancy_classification: "QWEN_OCCUPANCY_UNCERTAIN",
    qwen_classification_reason: "test_reason",
    opencode_static_classification: "OPENCODE_STATIC_DISPATCH_READY",
    contribution: {
      schema_version: "v4-resource-status-contribution-v1",
      contribution_id: "test-c-1",
      producer_id: "local-runtime-readonly-adapter-v1",
      source: "local_probe",
      produced_at: now,
      resources: {
        qwen_local: {
          resource_id: "qwen_local",
          updated_at: now,
          availability: "unavailable",
          observed: { kind: "qwen_occupancy", occupancy: "uncertain" },
        },
        opencode: {
          resource_id: "opencode",
          updated_at: now,
          availability: "available",
          observed: { kind: "filesystem_static" },
        },
      },
    },
    launch_performed: false,
    generation_calls: 0,
  };
}

async function req(port, { method = "GET", path = "/v4/resource-status/local-readonly", body = null } = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { method, body });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

function rawReq(port, { method = "GET", path = "/", headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: "127.0.0.1", port, method, path, headers }, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, json, text: data });
      });
    });
    r.on("error", reject);
    if (body) r.write(body);
    r.end();
  });
}

/** Start a test service on OS-assigned ephemeral port (listen 0). */
async function startEphemeral(evaluate) {
  return mod.startLocalRuntimeStatusService({
    host: "127.0.0.1",
    port: 0,
    evaluate,
  });
}

let srv;
let port;

await test("service binds to injected host/port and reports address", async () => {
  srv = await startEphemeral(fakeProducerWrapper);
  port = srv.address.port;
  assert.equal(typeof port, "number");
  assert.ok(port > 0, "OS must assign a positive ephemeral port");
  assert.notEqual(port, mod.DEFAULT_PORT, "test must not bind production default 18790");
  assert.equal(srv.address.address, "127.0.0.1");
});

await test("valid GET returns producer wrapper", async () => {
  const r = await req(port);
  assert.equal(r.status, 200);
  assert.equal(r.json.schema_version, "v4-local-runtime-readonly-contribution-result-v1");
  assert.equal(r.json.ok, true);
  assert.equal(typeof r.json.qwen_occupancy_classification, "string");
  assert.equal(typeof r.json.qwen_classification_reason, "string");
  assert.equal(typeof r.json.opencode_static_classification, "string");
});

await test("contribution contains qwen_local + opencode only", async () => {
  const r = await req(port);
  const keys = Object.keys(r.json.contribution.resources).sort();
  assert.deepEqual(keys, ["opencode", "qwen_local"]);
  assert.equal(r.json.contribution.schema_version, "v4-resource-status-contribution-v1");
});

await test("launch_performed=false and generation_calls=0", async () => {
  const r = await req(port);
  assert.equal(r.json.launch_performed, false);
  assert.equal(r.json.generation_calls, 0);
});

await test("exactly one producer invocation per accepted request", async () => {
  let calls = 0;
  const s2 = await startEphemeral(() => { calls += 1; return fakeProducerWrapper(); });
  const p2 = s2.address.port;
  await req(p2);
  await req(p2);
  assert.equal(calls, 2);
  await s2.close();
});

await test("concurrent second request does not invoke producer again and fails closed", async () => {
  let calls = 0;
  let release;
  const gate = new Promise((r) => { release = r; });
  const s2 = await startEphemeral(async () => { calls += 1; await gate; return fakeProducerWrapper(); });
  const p2 = s2.address.port;
  const first = req(p2);
  await new Promise((r) => setTimeout(r, 100));
  const second = await req(p2);
  assert.equal(second.status, 503);
  assert.equal(second.json.ok, false);
  assert.equal(second.json.classification, "LOCAL_RUNTIME_PRODUCER_BUSY");
  assert.equal(second.json.contribution, undefined);
  release();
  const f = await first;
  assert.equal(f.status, 200);
  assert.equal(f.json.ok, true);
  assert.equal(calls, 1);
  await s2.close();
});

await test("POST rejected", async () => { const r = await req(port, { method: "POST" }); assert.equal(r.status, 405); assert.equal(r.json.ok, false); });
await test("PUT rejected", async () => { const r = await req(port, { method: "PUT" }); assert.equal(r.status, 405); });
await test("PATCH rejected", async () => { const r = await req(port, { method: "PATCH" }); assert.equal(r.status, 405); });
await test("DELETE rejected", async () => { const r = await req(port, { method: "DELETE" }); assert.equal(r.status, 405); });

await test("unknown path rejected", async () => { const r = await req(port, { path: "/other" }); assert.equal(r.status, 404); assert.equal(r.json.ok, false); });
await test("query params rejected", async () => { const r = await req(port, { path: "/v4/resource-status/local-readonly?model=x" }); assert.equal(r.status, 400); assert.equal(r.json.ok, false); });

await test("body input rejected (GET with body)", async () => {
  const r = await rawReq(port, { method: "GET", path: "/v4/resource-status/local-readonly", headers: { "content-length": "3" }, body: "abc" });
  assert.equal(r.status, 400);
  assert.equal(r.json.ok, false);
  assert.equal(r.json.classification, "ENDPOINT_BODY_REJECTED");
});

await test("root alias accepted (Serve prefix strip)", async () => { const r = await req(port, { path: "/" }); assert.equal(r.status, 200); assert.equal(r.json.ok, true); });

await test("no command/model/profile selector accepted", async () => {
  const r1 = await req(port, { path: "/v4/resource-status/local-readonly/command/run" });
  assert.equal(r1.status, 404);
  const r2 = await req(port, { path: "/v4/resource-status/local-readonly/profile/qwen" });
  assert.equal(r2.status, 404);
});

await test("no raw diagnostic evidence returned", async () => {
  const r = await req(port);
  const text = r.text.toLowerCase();
  for (const banned of ["pid", "processlist", "commandline", "powershell", "executablepath", "apikey", "token", "sockettable", "environment"]) {
    assert.ok(!text.includes(banned), `body leaked '${banned}'`);
  }
});

await test("producer error fails closed 500 without availability", async () => {
  const s2 = await startEphemeral(() => { throw new Error("boom"); });
  const r = await req(s2.address.port);
  assert.equal(r.status, 500);
  assert.equal(r.json.ok, false);
  assert.equal(r.json.classification, "ENDPOINT_INTERNAL_FAIL_CLOSED");
  await s2.close();
});

await test("shutdown path only stops its own HTTP server", async () => {
  const s2 = await startEphemeral(fakeProducerWrapper);
  const p2 = s2.address.port;
  await s2.close();
  let refused = false;
  try { await req(p2); } catch { refused = true; }
  assert.ok(refused, "connection should be refused after close");
  const stillUp = await req(port);
  assert.equal(stillUp.status, 200);
});

await test("serve tool spawns no diagnostic process itself and reuses producer boundaries (static)", async () => {
  assert.ok(!SRC.includes("child_process"), "serve tool must not spawn processes directly");
  assert.ok(!SRC.includes("spawnSync"), "serve tool must not spawn processes directly");
  assert.ok(SRC.includes("gatherQwenDiagnostics"), "must reuse producer boundaries");
  assert.ok(SRC.includes("classifyQwenSharedRuntime"), "must reuse producer boundaries");
  assert.ok(SRC.includes("gatherOpenCodeFilesystemEvidence"), "must reuse producer boundaries");
  assert.ok(SRC.includes("buildLocalRuntimeContribution"), "must reuse producer boundaries");
  assert.ok(!SRC.includes("compose-v4-resource-status"), "must not compose RESOURCE_STATUS");
});

await test("defaultEvaluateProducer invokes gatherQwenDiagnostics exactly once (static)", async () => {
  const fn = SRC.split("export function defaultEvaluateProducer")[1] || "";
  const body = fn.split("\n}")[0];
  const count = (body.match(/gatherQwenDiagnostics\(/g) || []).length;
  assert.equal(count, 1);
});

await test("no provider/OpenCode/Qwen HTTP path exists in service (static)", async () => {
  for (const banned of ["fetch(", "axios", "http.request", "https.request", "exec(", "execSync", "ollama", "litellm"]) {
    assert.ok(!SRC.includes(banned), `forbidden: ${banned}`);
  }
});

await test("CLI accepts --host/--port and emits bounded startup JSON then keeps serving", async () => {
  // CLI also uses OS-assigned ephemeral bind via --port 0 (no fixed test port).
  const child = spawn(process.execPath, [TOOL, "--host", "127.0.0.1", "--port", "0"], { stdio: ["ignore", "pipe", "pipe"] });
  const line = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("no startup line within 10s")), 10000);
    let buf = "";
    child.stdout.on("data", (c) => {
      buf += c;
      const lines = buf.trim().split("\n");
      if (lines.length) {
        const last = lines[lines.length - 1];
        if (last.startsWith("{")) {
          clearTimeout(timer);
          resolve(last);
        }
      }
    });
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
  });
  const parsed = JSON.parse(line);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.host, "127.0.0.1");
  assert.ok(parsed.port > 0, "CLI must report assigned ephemeral port");
  assert.notEqual(parsed.port, mod.DEFAULT_PORT);
  assert.equal(parsed.canonical_path, "/v4/resource-status/local-readonly");
  const probe = await rawReq(parsed.port, { method: "HEAD", path: "/" });
  assert.equal(probe.status, 405);
  child.kill();
  await new Promise((r) => { child.on("exit", r); setTimeout(r, 3000); });
});

if (srv) await srv.close();

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
