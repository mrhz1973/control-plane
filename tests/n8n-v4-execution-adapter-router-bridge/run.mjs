#!/usr/bin/env node
/**
 * Offline tests for n8n-v4-execution-adapter-router-bridge-v1.
 * No Qwen, OpenCode CLI, provider, network, occupancy, or live runner.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runN8nExecutionAdapterRouterBridge,
  buildRouterRequest,
  RESULT_SCHEMA,
  UNEXPECTED_LIVE,
  BRIDGE_INPUT_INVALID,
} from "../../tools/n8n-v4-execution-adapter-router-bridge-v1.mjs";
import {
  createExecutionAdapterRegistry,
  OPENCODE_QWEN_LOCAL_ROUTE,
} from "../../tools/v4-execution-adapter-registry-v1.mjs";
import { FIXED_AUTHORIZATION_SCOPE_V3 } from "../../tools/qwen-execution-scope-v3.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TOOL = resolve(ROOT, "tools/n8n-v4-execution-adapter-router-bridge-v1.mjs");
const SCHEMA = resolve(
  ROOT,
  "docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.schema.json",
);
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function routedResult(routeId = "opencode+qwen_local", implementer = "opencode", model = "qwen_local") {
  return {
    schema_version: "execution-route-result-v1",
    request_id: "req-bridge-1",
    status: "ROUTED",
    execution_route: {
      route_id: routeId,
      implementer,
      model,
      confidence: "high",
      reason_codes: ["TECHNICAL_REQUIREMENTS_MATCH"],
    },
    arbitration: { required: false, used: false, arbiter: null },
    reason_codes: ["TECHNICAL_REQUIREMENTS_MATCH"],
    arbiter_call_count: 0,
  };
}

function packet() {
  return { packet_id: "PK-BRIDGE-1", goal: "offline bridge test" };
}

function activeAuth() {
  return {
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: "AUTH-BRIDGE-1",
    authorization_state: "ACTIVE",
    spent: false,
    used: false,
    route_id: "opencode+qwen_local",
    scope: { ...FIXED_AUTHORIZATION_SCOPE_V3 },
  };
}

function dispatchReady() {
  return {
    schema_version: "opencode-execution-dispatch-result-v1",
    dispatch_id: "disp-bridge-1",
    status: "READY",
    route_id: "opencode+qwen_local",
    implementer: "opencode",
    model: "qwen_local",
    qwen_session_status: "READY",
    opencode_available: true,
    dispatch_ready: true,
    execution_performed: false,
    classification: "DISPATCH_READY",
    reason_codes: ["DISPATCH_READY"],
  };
}

function hasSecrets(obj) {
  const t = JSON.stringify(obj).toLowerCase();
  return (
    t.includes("sk-") ||
    t.includes("bearer ") ||
    t.includes("\"api_key\"") ||
    t.includes("password=")
  );
}

function cli(inputObj) {
  const b64 = Buffer.from(JSON.stringify(inputObj), "utf8").toString("base64");
  const out = execFileSync(process.execPath, [TOOL, "--input-b64", b64], {
    encoding: "utf8",
    cwd: ROOT,
  });
  const lines = out.trim().split(/\r?\n/).filter(Boolean);
  return JSON.parse(lines[lines.length - 1]);
}

// --- tests ---

{
  const input = {
    schema_version: "n8n-v4-execution-adapter-router-bridge-input-v1",
    execution_id: "wf40:T1:PK1",
    execution_route_result: routedResult(),
    execution_packet: packet(),
  };
  const r = await runN8nExecutionAdapterRouterBridge(input);
  check(
    "no-dispatch-fail-closed-dispatch-not-ready",
    r.ok === true &&
      r.schema_version === RESULT_SCHEMA &&
      r.classification === "DISPATCH_NOT_READY" &&
      r.execution_performed === false &&
      r.dispatch_supplied === false &&
      r.runtime_authorization_supplied === false &&
      r.route_id === OPENCODE_QWEN_LOCAL_ROUTE &&
      r.adapter_id === "opencode-execution-adapter-v1",
    JSON.stringify({ c: r.classification, ep: r.execution_performed }),
  );
}

{
  const input = {
    execution_id: "wf40:T2:PK2",
    execution_route_result: routedResult(),
    execution_packet: packet(),
    dispatch_result: dispatchReady(),
  };
  const r = await runN8nExecutionAdapterRouterBridge(input);
  check(
    "dispatch-ready-auth-absent-authorization-rejected",
    r.ok === true &&
      r.classification === "AUTHORIZATION_REJECTED" &&
      r.execution_performed === false &&
      r.dispatch_supplied === true &&
      r.runtime_authorization_supplied === false &&
      r.router_result?.adapter_result?.execution_performed === false,
    r.classification,
  );
}

{
  // Selected OPUS24K reaches the bridge; without occupancy it fails closed
  // at the next boundary.
  const input = {
    execution_id: "wf40:T3:PK3-agg",
    execution_route_result: routedResult(),
    execution_packet: packet(),
    dispatch_result: dispatchReady(),
    runtime_authorization: activeAuth(),
  };
  const rAgg = await runN8nExecutionAdapterRouterBridge(input);
  check(
    "selected-opus-valid-auth-reaches-occupancy-gate",
    rAgg.ok === true &&
      rAgg.classification === "OCCUPANCY_BLOCKED" &&
      rAgg.execution_performed === false &&
      rAgg.router_result?.adapter_result?.reason_codes?.includes(
        "OCCUPANCY_SOURCE_MISSING",
      ),
    rAgg.classification,
  );
}

{
  const input = {
    execution_id: "wf40:T3:PK3",
    execution_route_result: routedResult(),
    execution_packet: packet(),
    dispatch_result: dispatchReady(),
    runtime_authorization: activeAuth(),
    // offline test injection only: qualified-role gate to reach occupancy check
    roleGate: () => ({ ok: true, qualified: true, reason_codes: [] }),
  };
  const r = await runN8nExecutionAdapterRouterBridge(input);
  check(
    "valid-auth-without-occupancy-stops-fail-closed",
    r.ok === true &&
      r.classification === "OCCUPANCY_BLOCKED" &&
      r.execution_performed === false &&
      r.dispatch_supplied === true &&
      r.runtime_authorization_supplied === true &&
      Array.isArray(r.reason_codes) &&
      r.router_result?.adapter_result?.reason_codes?.includes("OCCUPANCY_SOURCE_MISSING"),
    r.classification,
  );
}

{
  const input = {
    execution_id: "wf40:T4:PK4",
    execution_route_result: routedResult(),
    execution_packet: packet(),
    dispatch_result: null,
    runtime_authorization: null,
    getOccupancy: async () => "QWEN_READY_IDLE",
    guardStart: async () => ({}),
    runOpenCode: async () => ({}),
  };
  const built = buildRouterRequest(input);
  check(
    "never-forwards-null-optional-or-live-callbacks",
    built.dispatch_supplied === false &&
      built.runtime_authorization_supplied === false &&
      !("dispatch_result" in built.request) &&
      !("runtime_authorization" in built.request) &&
      !("getOccupancy" in built.request) &&
      !("guardStart" in built.request) &&
      !("runOpenCode" in built.request),
    JSON.stringify(Object.keys(built.request)),
  );
  const r = await runN8nExecutionAdapterRouterBridge(input);
  check(
    "injected-live-callbacks-on-input-ignored",
    r.execution_performed === false && r.classification === "DISPATCH_NOT_READY",
    r.classification,
  );
}

{
  const input = {
    execution_id: "wf40:T5:PK5",
    execution_route_result: routedResult("cursor+composer", "cursor", "composer"),
    execution_packet: packet(),
  };
  const r = await runN8nExecutionAdapterRouterBridge(input);
  check(
    "unregistered-route-adapter-not-registered",
    r.classification === "ADAPTER_NOT_REGISTERED" && r.execution_performed === false,
    r.classification,
  );
}

{
  const input = {
    execution_id: "wf40:T6:PK6",
    execution_route_result: {
      ...routedResult(),
      status: "NO_ROUTE",
    },
    execution_packet: packet(),
  };
  const r = await runN8nExecutionAdapterRouterBridge(input);
  check(
    "route-not-routed",
    r.classification === "ROUTE_NOT_ROUTED" && r.execution_performed === false,
    r.classification,
  );
}

{
  const r = await runN8nExecutionAdapterRouterBridge({
    execution_id: "x",
    execution_packet: packet(),
  });
  check(
    "missing-route-result-fail-closed",
    r.ok === false &&
      r.classification === BRIDGE_INPUT_INVALID &&
      r.execution_performed === false,
    r.classification,
  );
}

{
  // Inject registry with live-claiming adapter to prove UNEXPECTED_LIVE_EXECUTION.
  const liveEntry = {
    route_id: OPENCODE_QWEN_LOCAL_ROUTE,
    adapter_id: "opencode-execution-adapter-v1",
    implementer: "opencode",
    model: "qwen_local",
    dispatch_required: true,
    async run() {
      return {
        schema_version: "opencode-execution-result-v1",
        status: "EXECUTED",
        classification: "EXECUTED_OK",
        execution_performed: true,
        reason_codes: ["TEST_LIVE_CLAIM"],
      };
    },
  };
  const created = createExecutionAdapterRegistry([liveEntry]);
  check("live-claim-registry-builds", created.ok === true, JSON.stringify(created.reason_codes));
  const r = await runN8nExecutionAdapterRouterBridge(
    {
      execution_id: "wf40:LIVE:1",
      execution_route_result: routedResult(),
      execution_packet: packet(),
      dispatch_result: dispatchReady(),
    },
    { registry: created.registry },
  );
  check(
    "unexpected-live-execution-fail-closed",
    r.ok === false &&
      r.classification === UNEXPECTED_LIVE &&
      r.execution_performed === false &&
      r.reason_codes.includes(UNEXPECTED_LIVE),
    JSON.stringify({ c: r.classification, ep: r.execution_performed }),
  );
}

{
  const src = readFileSync(TOOL, "utf8");
  check(
    "bridge-source-has-no-live-injection-paths",
    !src.includes("getOccupancy:") &&
      !src.includes("guardStart:") &&
      !src.includes("runOpenCode:") &&
      !src.includes("child_process") &&
      !src.includes("spawn") &&
      !src.includes("fetch(") &&
      !src.includes("compose-v4-resource-status") &&
      src.includes("routeToExecutionAdapter"),
    "source boundary",
  );
}

{
  const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
  check(
    "schema-forces-execution-performed-false",
    schema.properties.execution_performed?.const === false &&
      schema.properties.schema_version?.const === RESULT_SCHEMA,
    "schema",
  );
}

{
  const r = cli({
    schema_version: "n8n-v4-execution-adapter-router-bridge-input-v1",
    execution_id: "cli-1",
    execution_route_result: routedResult(),
    execution_packet: packet(),
  });
  check(
    "cli-one-json-structural",
    r.schema_version === RESULT_SCHEMA &&
      r.execution_performed === false &&
      r.classification === "DISPATCH_NOT_READY" &&
      !hasSecrets(r),
    r.classification,
  );
}

{
  const out = execFileSync(process.execPath, [TOOL, "--input-b64", "!!!"], {
    encoding: "utf8",
    cwd: ROOT,
  });
  const r = JSON.parse(out.trim().split(/\r?\n/).filter(Boolean).pop());
  check(
    "cli-malformed-fail-closed",
    r.ok === false &&
      r.classification === BRIDGE_INPUT_INVALID &&
      r.execution_performed === false,
    r.classification,
  );
}

{
  const out = execFileSync(process.execPath, [TOOL], { encoding: "utf8", cwd: ROOT });
  const r = JSON.parse(out.trim().split(/\r?\n/).filter(Boolean).pop());
  check(
    "cli-missing-input-fail-closed",
    r.ok === false && r.execution_performed === false,
    r.classification,
  );
}

{
  // Explicitly supplied invalid auth still fail-closed through adapter.
  const r = await runN8nExecutionAdapterRouterBridge({
    execution_id: "wf40:T7:PK7",
    execution_route_result: routedResult(),
    execution_packet: packet(),
    dispatch_result: dispatchReady(),
    runtime_authorization: { schema_version: "operator-runtime-authorization-v1" },
  });
  check(
    "invalid-auth-object-authorization-rejected",
    r.classification === "AUTHORIZATION_REJECTED" &&
      r.runtime_authorization_supplied === true &&
      r.execution_performed === false,
    r.classification,
  );
}

{
  check(
    "no-secrets-in-results",
    results.every((x) => !hasSecrets(x)),
    "secret scan",
  );
}

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);
process.stdout.write(
  `${JSON.stringify(
    {
      suite: "n8n-v4-execution-adapter-router-bridge",
      root: ROOT,
      total: results.length,
      passed,
      failed: failed.length,
      results,
    },
    null,
    0,
  )}\n`,
);
if (failed.length) process.exit(1);
