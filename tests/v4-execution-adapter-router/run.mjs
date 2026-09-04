#!/usr/bin/env node
/**
 * Offline tests for v4-execution-adapter-router-v1.
 * Mocked adapter deps; no opencode run, no Qwen, no provider, no n8n.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  routeToExecutionAdapter,
  defaultAdapterRegistry,
  RESULT_SCHEMA,
} from "../../tools/v4-execution-adapter-router-v1.mjs";
import {
  validateRuntimeAuthorization,
} from "../../tools/opencode-execution-adapter-v1.mjs";
import {
  registerExecutionAdapter,
} from "../../tools/v4-execution-adapter-registry-v1.mjs";
import { FIXED_AUTHORIZATION_SCOPE_V3 } from "../../tools/qwen-execution-scope-v3.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function routedResult(routeId, implementer, model) {
  return {
    schema_version: "execution-route-result-v1",
    request_id: "req-test",
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

function activeAuth() {
  return {
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: "AUTH-ROUTING-TEST-1",
    authorization_state: "ACTIVE",
    spent: false,
    used: false,
    route_id: "opencode+qwen_local",
    scope: { ...FIXED_AUTHORIZATION_SCOPE_V3 },
  };
}

// AGG 2026-09-03: FAST_AGENT is UNQUALIFIED by default; mechanics tests inject
// a qualified-role gate at request level so router delegation can be exercised.
const qualifiedRoleGate = () => ({ ok: true, qualified: true, reason_codes: [] });

function dispatchReady() {
  return {
    schema_version: "opencode-execution-dispatch-result-v1",
    dispatch_id: "disp-test-1",
    status: "READY",
    route_id: "opencode+qwen_local",
    implementer: "opencode",
    model: "qwen_local",
    qwen_session_status: "READY",
    opencode_available: true,
    dispatch_ready: true,
    execution_performed: false,
    classification: "DISPATCH_READY",
    reason_codes: [],
    dispatch_spec: { schema_version: "opencode-dispatch-spec-v1" },
  };
}

function mockAdapterDeps() {
  // The returned object IS the capture object: mocks write counters onto it
  // so assertions observe live delegation counts and guard target directly.
  const deps = {};
  deps.getOccupancy = async () => {
    deps.occupancyCalls = (deps.occupancyCalls || 0) + 1;
    return "QWEN_READY_IDLE";
  };
  deps.guardStart = async () => {
    deps.guardStarts = (deps.guardStarts || 0) + 1;
    return {
      base_url: "http://127.0.0.1:59998",
      getAccounting: () => ({ upstream_generation_requests: 1, blocked_generation_requests: 0 }),
      close: async () => {
        deps.guardCloses = (deps.guardCloses || 0) + 1;
      },
    };
  };
  deps.runOpenCode = async (ctx) => {
    deps.runCalls = (deps.runCalls || 0) + 1;
    deps.guardBaseUrl = ctx.guardBaseUrl;
    return {
      opencode_execution_count: 1,
      qwen_generation_calls: 1,
      upstream_generation_requests: 1,
      retry_calls: 0,
      fallback_calls: 0,
      response_validation: true,
    };
  };
  return deps;
}

function resultHasSecrets(result) {
  const t = JSON.stringify(result).toLowerCase();
  return t.includes("sk-") || t.includes("bearer ") || t.includes('"prompt"') || t.includes('"messages"');
}

async function run() {
  // 1 NO_ROUTE => no adapter invocation
  {
    const deps = mockAdapterDeps();
    const r = await routeToExecutionAdapter({
      execution_id: "t1",
      execution_route_result: routedResult("opencode+qwen_local", "opencode", "qwen_local"),
      execution_packet: { goal: "g" },
      ...deps,
    });
    // sanity: ROUTED+dispatch-ready path would call deps; here simulate NO_ROUTE
    const r2 = await routeToExecutionAdapter({
      execution_id: "t1b",
      execution_route_result: {
        ...routedResult("opencode+qwen_local", "opencode", "qwen_local"),
        status: "NO_ROUTE",
        execution_route: null,
      },
      execution_packet: { goal: "g" },
      ...deps,
    });
    check(
      "no-route-no-adapter-invocation",
      r2.classification === "ROUTE_NOT_ROUTED" &&
        r2.execution_performed === false &&
        r2.adapter_result === null &&
        r2.reason_codes.includes("ROUTE_NOT_ROUTED"),
      JSON.stringify(r2.reason_codes),
    );
  }

  // 2/3 cursor routes => ADAPTER_NOT_REGISTERED
  for (const [rid, impl, model] of [
    ["cursor+composer", "cursor", "composer"],
    ["cursor+glm", "cursor", "glm-4.7"],
  ]) {
    const deps = mockAdapterDeps();
    const r = await routeToExecutionAdapter({
      execution_id: `t-${rid}`,
      execution_route_result: routedResult(rid, impl, model),
      execution_packet: { goal: "g" },
      ...deps,
    });
    check(
      `${rid}-adapter-not-registered`,
      r.classification === "ADAPTER_NOT_REGISTERED" &&
        r.execution_performed === false &&
        r.adapter_registered === false &&
        deps.guardStarts === undefined,
      JSON.stringify(r.reason_codes),
    );
  }

  // 4 missing dispatch-ready => blocked
  {
    const deps = mockAdapterDeps();
    const r = await routeToExecutionAdapter({
      execution_id: "t4",
      execution_route_result: routedResult("opencode+qwen_local", "opencode", "qwen_local"),
      execution_packet: { goal: "g" },
      ...deps,
    });
    check(
      "missing-dispatch-ready-blocked",
      r.classification === "DISPATCH_NOT_READY" &&
        r.execution_performed === false &&
        r.adapter_result === null &&
        r.reason_codes.includes("DISPATCH_MISSING"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 5 invalid dispatch => blocked
  {
    const deps = mockAdapterDeps();
    const bad = { ...dispatchReady(), classification: "QWEN_UNAVAILABLE", dispatch_ready: false, status: "FAILED" };
    const r = await routeToExecutionAdapter({
      execution_id: "t5",
      execution_route_result: routedResult("opencode+qwen_local", "opencode", "qwen_local"),
      execution_packet: { goal: "g" },
      dispatch_result: bad,
      ...deps,
    });
    check(
      "invalid-dispatch-blocked",
      r.classification === "DISPATCH_NOT_READY" &&
        r.execution_performed === false &&
        r.dispatch_classification === "QWEN_UNAVAILABLE",
      JSON.stringify(r.reason_codes),
    );
  }

  // 6 valid route + dispatch + NO auth => adapter returns no execution
  {
    const deps = mockAdapterDeps();
    const r = await routeToExecutionAdapter({
      execution_id: "t6",
      execution_route_result: routedResult("opencode+qwen_local", "opencode", "qwen_local"),
      execution_packet: { goal: "g" },
      dispatch_result: dispatchReady(),
      ...deps,
    });
    check(
      "no-auth-adapter-no-execution",
      r.adapter_result?.classification === "AUTHORIZATION_REJECTED" &&
        r.execution_performed === false &&
        r.adapter_result?.guard_started === false,
      JSON.stringify(r.adapter_result?.reason_codes),
    );
  }

  // 7 valid route + dispatch + mocked valid auth delegates exactly once
  {
    const deps = mockAdapterDeps();
    const r = await routeToExecutionAdapter({
      execution_id: "t7",
      execution_route_result: routedResult("opencode+qwen_local", "opencode", "qwen_local"),
      execution_packet: { goal: "g" },
      dispatch_result: dispatchReady(),
      runtime_authorization: activeAuth(),
      roleGate: qualifiedRoleGate,
      ...deps,
    });
    check(
      "valid-delegates-exactly-once",
      r.classification === "EXECUTED_OK" &&
        r.execution_performed === true &&
        deps.runCalls === 1 &&
        deps.guardStarts === 1 &&
        r.adapter_id === "opencode-execution-adapter-v1",
      JSON.stringify({ c: r.classification, runCalls: deps.runCalls, guardStarts: deps.guardStarts }),
    );
    // 8 adapter result propagated structurally
    check(
      "adapter-result-propagated",
      r.adapter_result?.schema_version === "opencode-execution-result-v1" &&
        r.adapter_result?.qwen_generation_calls === 1 &&
        r.adapter_result?.opencode_execution_count === 1 &&
        r.schema_version === RESULT_SCHEMA,
      JSON.stringify(r.adapter_result?.schema_version),
    );
    // 10 no direct Qwen endpoint introduced
    check(
      "no-direct-qwen-endpoint",
      deps.guardBaseUrl === "http://127.0.0.1:59998" &&
        !JSON.stringify(r).includes("http://127.0.0.1:8080/v1"),
      String(deps.guardBaseUrl),
    );
    check("no-secret-persistence", !resultHasSecrets(r), "secrets found");
  }

  // 9 no fallback: unregistered route never invokes any adapter
  {
    const registry = defaultAdapterRegistry();
    let fallbackTouched = false;
    const reg = registerExecutionAdapter(registry, {
      route_id: "synthetic_future+model_x",
      adapter_id: "synthetic-future-adapter-v0",
      implementer: "synthetic_future",
      model: "model_x",
      dispatch_required: false,
      run: async () => {
        fallbackTouched = true;
        return { classification: "EXECUTED_OK", status: "EXECUTED", execution_performed: true };
      },
    });
    if (!reg.ok) throw new Error(`synthetic registration failed: ${reg.reason_codes}`);
    // request cursor route: synthetic adapter registered but must NOT be invoked
    const r = await routeToExecutionAdapter(
      {
        execution_id: "t9",
        execution_route_result: routedResult("cursor+composer", "cursor", "composer"),
        execution_packet: { goal: "g" },
      },
      { registry },
    );
    check(
      "no-fallback-to-other-executor",
      r.classification === "ADAPTER_NOT_REGISTERED" && fallbackTouched === false,
      `${r.classification}/${fallbackTouched}`,
    );
  }

  // 11 execution-router source unchanged during THIS suite run (in-memory hash
  // before/after — independent of intentional working-tree AGG changes)
  {
    const { createHash } = await import("node:crypto");
    const { readFileSync: rfs } = await import("node:fs");
    const { join: j } = await import("node:path");
    const files = [
      "tools/evaluate-execution-route.mjs",
      "tools/dispatch-opencode-execution-v1.mjs",
      "tools/opencode-execution-adapter-v1.mjs",
    ];
    const hashOf = () =>
      files
        .map((f) =>
          createHash("sha256").update(rfs(j(ROOT, f), "utf8")).digest("hex").slice(0, 12),
        )
        .join(",");
    const before = hashOf();
    // Re-run one delegation to ensure no lazy writer mutates sources.
    const deps = mockAdapterDeps();
    await routeToExecutionAdapter({
      execution_id: "t11-mutation-probe",
      execution_route_result: routedResult("opencode+qwen_local", "opencode", "qwen_local"),
      execution_packet: { goal: "g" },
      dispatch_result: dispatchReady(),
      runtime_authorization: activeAuth(),
      roleGate: qualifiedRoleGate,
      ...deps,
    });
    const after = hashOf();
    check(
      "no-execution-router-dispatch-adapter-mutation",
      before === after,
      `${before} -> ${after}`,
    );
  }

  // 12 default CLI path performs zero live execution
  {
    const r = await routeToExecutionAdapter({ execution_id: "t12-default" });
    check(
      "default-zero-live-execution",
      r.classification === "INVALID_INPUT" && r.execution_performed === false && r.adapter_result === null,
      r.classification,
    );
    // AGG 2026-09-03: qualified-role gate injected via request; default path now
    // fails earlier (AUTHORIZATION_REJECTED / ROLE_UNQUALIFIED) — covered in
    // the AGG qualification suite.
    const r2 = await routeToExecutionAdapter({
      execution_id: "t12b",
      execution_route_result: routedResult("opencode+qwen_local", "opencode", "qwen_local"),
      execution_packet: { goal: "g" },
      dispatch_result: dispatchReady(),
      runtime_authorization: activeAuth(),
      roleGate: qualifiedRoleGate,
    });
    check(
      "default-no-deps-fail-closed-occupancy-first",
      r2.adapter_result?.classification === "OCCUPANCY_BLOCKED" &&
        r2.adapter_result?.reason_codes?.includes("OCCUPANCY_SOURCE_MISSING") === true &&
        r2.execution_performed === false,
      JSON.stringify(r2.adapter_result?.reason_codes),
    );
  }

  // adapter validator passthrough sanity (bridge does not duplicate validation)
  {
    check(
      "bridge-does-not-duplicate-validator",
      typeof validateRuntimeAuthorization === "function" &&
        validateRuntimeAuthorization(activeAuth()).ok === true,
      "validator import ok",
    );
  }

  const failed = results.filter((x) => !x.pass);
  const summary = {
    suite: "v4-execution-adapter-router",
    root: ROOT,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});
