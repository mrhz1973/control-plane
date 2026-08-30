#!/usr/bin/env node
/**
 * Offline tests for n8n-v4-execution-routing-bridge-v1.
 * No Qwen, no session manager, no provider, no network, no adapter run.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runN8nExecutionRoutingBridge,
  RESULT_SCHEMA,
} from "../../tools/n8n-v4-execution-routing-bridge-v1.mjs";
import {
  createDefaultExecutionAdapterRegistry,
  registerExecutionAdapter,
} from "../../tools/v4-execution-adapter-registry-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function cycleResult(overrides = {}) {
  return {
    schema: "n8n-litellm-primary-cycle-result-v1",
    ok: true,
    classification: "PASS",
    task_id: "T-001",
    packet: { packet_id: "PK-001", goal: "g" },
    policy: { decision: "PROCEED" },
    cursor_dispatch_allowed: true,
    ...overrides,
  };
}

function routeRequest(overrides = {}) {
  return {
    schema_version: "execution-route-request-v1",
    request_id: "RR-001",
    technical_requirements: ["filesystem", "code_edit"],
    risk_level: "low",
    ...overrides,
  };
}

function statusSnapshot(overridesPerResource = {}) {
  const mk = (available, cost_mode = "free", location = "local") => ({
    available,
    quota_remaining: { value: available ? 1000 : null, unit: "requests" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode,
    location,
    source: "test-fixture",
    updated_at: "2026-08-30T00:00:00.000Z",
  });
  return {
    schema_version: "resource-status-v1",
    generated_at: "2026-08-30T00:00:00.000Z",
    resources: {
      cursor: mk(false, "unknown", "cloud"),
      grok_bot: mk(false, "unknown", "cloud"),
      opencode: mk(true, "free", "local"),
      qwen_local: mk(true, "free", "local"),
      glm: mk(false, "unknown", "cloud"),
      codex: mk(false, "unknown", "cloud"),
      composer: mk(false, "unknown", "cloud"),
      ...overridesPerResource,
    },
  };
}

const DEF = { adapterRegistry: createDefaultExecutionAdapterRegistry() };

function hasSecrets(obj) {
  const t = JSON.stringify(obj).toLowerCase();
  return t.includes("sk-") || t.includes("bearer ") || t.includes("api_key") || t.includes("password");
}

async function run() {
  // 1 malformed cycle result -> fail closed
  {
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: { schema: "wrong" }, route_request: routeRequest(), status: statusSnapshot() },
      DEF,
    );
    check("malformed-cycle-fail-closed", r.classification === "CYCLE_RESULT_INVALID" && r.ok === false, r.classification);
  }

  // 2 cycle not PASS -> fail closed
  {
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult({ classification: "NEEDS_REVIEW" }), route_request: routeRequest(), status: statusSnapshot() },
      DEF,
    );
    check("cycle-not-pass-fail-closed", r.classification === "CYCLE_RESULT_INVALID", r.classification);
  }

  // 3 policy GATE
  {
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult({ policy: { decision: "GATE" } }), route_request: routeRequest(), status: statusSnapshot() },
      DEF,
    );
    check(
      "policy-gate-no-routing",
      r.classification === "POLICY_GATE_REQUIRED" && r.route_status === null && r.execution_performed === false,
      r.classification,
    );
  }

  // 4 policy BLOCKED
  {
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult({ policy: { decision: "BLOCKED" } }), route_request: routeRequest(), status: statusSnapshot() },
      DEF,
    );
    check(
      "policy-blocked-no-routing",
      r.classification === "POLICY_BLOCKED" && r.route_status === null && r.execution_performed === false,
      r.classification,
    );
  }

  // 5 malformed policy
  {
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult({ policy: { decision: "MAYBE" } }), route_request: routeRequest(), status: statusSnapshot() },
      DEF,
    );
    check("malformed-policy-fail-closed", r.classification === "POLICY_INVALID", r.classification);
  }

  // 6 missing route request
  {
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult(), status: statusSnapshot() },
      DEF,
    );
    check(
      "missing-route-request-fail-closed",
      r.classification === "ROUTE_REQUEST_INVALID" && r.reason_codes.includes("ROUTE_REQUEST_MISSING"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 7 invalid route request (bad schema / no requirements)
  {
    const r1 = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult(), route_request: { schema_version: "nope" }, status: statusSnapshot() },
      DEF,
    );
    const r2 = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult(), route_request: routeRequest({ technical_requirements: [] }), status: statusSnapshot() },
      DEF,
    );
    check(
      "invalid-route-request-fail-closed",
      r1.classification === "ROUTE_REQUEST_INVALID" && r2.classification === "ROUTE_REQUEST_INVALID",
      `${r1.classification}/${r2.classification}`,
    );
  }

  // 8 technical_requirements never synthesized (input must be explicit; empty stays invalid)
  {
    const r = await runN8nExecutionRoutingBridge(
      {
        cycle_result: cycleResult({ packet: { packet_id: "PK-001", goal: "edit files and run terminal", allowed_paths: ["src"] } }),
        route_request: { schema_version: "execution-route-request-v1", request_id: "RR-002", risk_level: "low" },
        status: statusSnapshot(),
      },
      DEF,
    );
    check(
      "technical-requirements-never-synthesized",
      r.classification === "ROUTE_REQUEST_INVALID" &&
        r.reason_codes.includes("TECHNICAL_REQUIREMENTS_MISSING") &&
        r.route_status === null,
      JSON.stringify(r.reason_codes),
    );
  }

  // 9 malformed RESOURCE_STATUS
  {
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult(), route_request: routeRequest(), status: { schema_version: "nope" } },
      DEF,
    );
    check("malformed-status-fail-closed", r.classification === "RESOURCE_STATUS_INVALID", r.classification);
  }

  // 10 deterministic ROUTED propagated; 12 opencode+qwen_local resolves
  {
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult(), route_request: routeRequest(), status: statusSnapshot() },
      DEF,
    );
    check(
      "routed-result-propagated",
      r.ok === true &&
        r.classification === "ROUTING_READY_FOR_DISPATCH" &&
        r.route_status === "ROUTED" &&
        r.route_id === "opencode+qwen_local" &&
        r.implementer === "opencode" &&
        r.model === "qwen_local",
      JSON.stringify({ c: r.classification, rid: r.route_id }),
    );
    check(
      "opencode-qwen-local-adapter-metadata",
      r.adapter_registered === true &&
        r.adapter_id === "opencode-execution-adapter-v1" &&
        r.dispatch_required === true,
      JSON.stringify({ a: r.adapter_id, d: r.dispatch_required }),
    );
    check(
      "invariants-false",
      r.dispatch_prepared === false && r.execution_performed === false && r.schema_version === RESULT_SCHEMA,
      `${r.dispatch_prepared}/${r.execution_performed}`,
    );
    check("no-secret-material", !hasSecrets(r), "secrets found");
  }

  // 11 NO_ROUTE propagated without adapter resolution
  {
    const r = await runN8nExecutionRoutingBridge(
      {
        cycle_result: cycleResult(),
        route_request: routeRequest({ technical_requirements: ["browser"] }),
        status: statusSnapshot(),
      },
      DEF,
    );
    check(
      "no-route-propagated-no-adapter-resolution",
      r.classification === "NO_ROUTE" && r.route_id === null && r.adapter_registered === false,
      JSON.stringify(r.reason_codes),
    );
  }

  // 13 unsupported route -> ADAPTER_NOT_REGISTERED
  {
    const cursorStatus = statusSnapshot({
      cursor: { ...statusSnapshot().resources.cursor, available: true, quota_remaining: { value: 500, unit: "requests" } },
      composer: { ...statusSnapshot().resources.composer, available: true, quota_remaining: { value: 500, unit: "requests" } },
      // isolate cursor+composer: local lane must be unavailable
      opencode: { ...statusSnapshot().resources.opencode, available: false, quota_remaining: { value: null, unit: "unknown" } },
      qwen_local: { ...statusSnapshot().resources.qwen_local, available: false, quota_remaining: { value: null, unit: "unknown" } },
    });
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult(), route_request: routeRequest(), status: cursorStatus },
      DEF,
    );
    check(
      "unsupported-route-adapter-not-registered",
      r.classification === "ADAPTER_NOT_REGISTERED" && r.route_id === "cursor+composer" && r.adapter_registered === false,
      JSON.stringify({ c: r.classification, rid: r.route_id }),
    );
  }

  // 14 invalid adapter registry -> fail closed
  {
    const badMap = new Map(); // empty is valid shape-wise; use invalid entry
    badMap.set("opencode+qwen_local", { route_id: "opencode+qwen_local", adapter_id: "x" });
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult(), route_request: routeRequest(), status: statusSnapshot() },
      { adapterRegistry: badMap },
    );
    check(
      "invalid-adapter-registry-fail-closed",
      r.classification === "ADAPTER_REGISTRY_INVALID" && r.ok === false && r.execution_performed === false,
      r.classification,
    );
  }

  // 15/16 no fallback; adapter.run never invoked
  {
    let runs = 0;
    const registry = createDefaultExecutionAdapterRegistry();
    registerExecutionAdapter(registry, {
      route_id: "synthetic_future+model_x",
      adapter_id: "synthetic-future-adapter-v0",
      implementer: "synthetic_future",
      model: "model_x",
      dispatch_required: false,
      run: async () => {
        runs += 1;
        return {};
      },
    });
    // cursor route -> only registered opencode matters; synthetic never invoked;
    // also confirm opencode run not invoked on the READY path either.
    const cursorStatus = statusSnapshot({
      cursor: { ...statusSnapshot().resources.cursor, available: true },
      composer: { ...statusSnapshot().resources.composer, available: true },
      // isolate cursor+composer: local lane must be unavailable
      opencode: { ...statusSnapshot().resources.opencode, available: false, quota_remaining: { value: null, unit: "unknown" } },
      qwen_local: { ...statusSnapshot().resources.qwen_local, available: false, quota_remaining: { value: null, unit: "unknown" } },
    });
    const r = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult(), route_request: routeRequest(), status: cursorStatus },
      { adapterRegistry: registry },
    );
    const r2 = await runN8nExecutionRoutingBridge(
      { cycle_result: cycleResult(), route_request: routeRequest(), status: statusSnapshot() },
      { adapterRegistry: registry },
    );
    check(
      "no-fallback-adapter-run-never-invoked",
      r.classification === "ADAPTER_NOT_REGISTERED" && r2.ok === true && runs === 0,
      `${r.classification}/${runs}`,
    );
  }

  // 17/18 invariants across all classifications
  {
    const samples = [
      await runN8nExecutionRoutingBridge({ cycle_result: null }, DEF),
      await runN8nExecutionRoutingBridge(
        { cycle_result: cycleResult(), route_request: routeRequest(), status: statusSnapshot() },
        DEF,
      ),
    ];
    check(
      "dispatch-and-execution-always-false",
      samples.every((s) => s.dispatch_prepared === false && s.execution_performed === false),
      "invariant violated",
    );
  }

  // 19/20 no Qwen/session-manager/provider/network symbols in tool source
  {
    const src = readFileSync(resolve(ROOT, "tools/n8n-v4-execution-routing-bridge-v1.mjs"), "utf8");
    check(
      "no-qwen-session-provider-imports",
      !src.includes("qwen-local-session-manager") &&
        !src.includes("ensureQwenLocalReady") &&
        !src.includes("collect-qwen-local-resource-status") &&
        !src.includes("opencode-execution-adapter") &&
        !src.includes("dispatch-opencode-execution") &&
        !src.includes("http://") &&
        !src.includes("https://") &&
        !src.includes("fetch("),
      "forbidden dependency found",
    );
  }

  // 21 CLI: one structural JSON result
  {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64");
    const out = execFileSync(
      "node",
      [
        "tools/n8n-v4-execution-routing-bridge-v1.mjs",
        "--cycle-result-b64", b64(cycleResult()),
        "--route-request-b64", b64(routeRequest()),
        "--status-b64", b64(statusSnapshot()),
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    const lines = out.trim().split("\n");
    const parsed = JSON.parse(lines[lines.length - 1]);
    check(
      "cli-one-json-result",
      lines.length === 1 &&
        parsed.schema_version === RESULT_SCHEMA &&
        parsed.classification === "ROUTING_READY_FOR_DISPATCH" &&
        parsed.dispatch_prepared === false &&
        parsed.execution_performed === false,
      `${lines.length} lines / ${parsed.classification}`,
    );

    // CLI fail-closed on malformed b64
    const badOut = execFileSync(
      "node",
      [
        "tools/n8n-v4-execution-routing-bridge-v1.mjs",
        "--cycle-result-b64", "!!!not-base64-json!!!",
        "--route-request-b64", b64(routeRequest()),
        "--status-b64", b64(statusSnapshot()),
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    const badParsed = JSON.parse(badOut.trim());
    check(
      "cli-fail-closed-malformed",
      badParsed.ok === false && badParsed.classification === "CYCLE_RESULT_INVALID" && badParsed.execution_performed === false,
      badParsed.classification,
    );

    // CLI missing args
    const missOut = execFileSync("node", ["tools/n8n-v4-execution-routing-bridge-v1.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const missParsed = JSON.parse(missOut.trim());
    check(
      "cli-missing-args-fail-closed",
      missParsed.ok === false &&
        ["CYCLE_RESULT_INVALID", "ROUTE_REQUEST_INVALID", "RESOURCE_STATUS_INVALID"].includes(missParsed.classification),
      missParsed.classification,
    );
  }

  // 22 no secret-like material persisted (fixtures + results)
  {
    const all = results.map((x) => JSON.stringify(x)).join(" ");
    check("no-secret-like-material", !all.includes("sk-") && !all.toLowerCase().includes("password"), "secret found");
  }

  const failed = results.filter((x) => !x.pass);
  const summary = {
    suite: "n8n-v4-execution-routing-bridge",
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
