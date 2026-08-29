#!/usr/bin/env node
/**
 * V4 — offline tests for EXECUTION_ROUTER (evaluate-execution-route).
 * No live Qwen / provider calls. Arbiter injectable/mocked.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateExecutionRoute,
  REASON_CODES,
} from "../../tools/evaluate-execution-route.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = JSON.parse(
  readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"),
);
const FAIL_CLOSED = JSON.parse(
  readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"),
);

function baseStatusEntry(overrides = {}) {
  return {
    available: false,
    quota_remaining: { value: null, unit: "unknown" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode: "unknown",
    location: "unknown",
    source: "manual",
    updated_at: "2026-08-29T00:00:00.000Z",
    ...overrides,
  };
}

function statusDoc(map) {
  return {
    schema_version: "resource-status-v1",
    generated_at: "2026-08-29T00:00:00.000Z",
    resources: map,
  };
}

function request(partial = {}) {
  return {
    schema_version: "execution-route-request-v1",
    request_id: "er-test-1",
    technical_requirements: ["filesystem", "code_edit"],
    risk_level: "low",
    ...partial,
  };
}

/** All registry resources present; set only listed ids available. */
function statusWithAvailable(availableMap, extra = {}) {
  const resources = {};
  for (const id of Object.keys(REGISTRY.resources)) {
    resources[id] = baseStatusEntry({
      available: false,
      cost_mode: id === "qwen_local" ? "free" : "unknown",
      location: REGISTRY.resources[id].execution_location || "unknown",
    });
  }
  // composer may be needed but is not in fail-closed; ensure present when registry has it
  for (const id of Object.keys(REGISTRY.resources)) {
    if (!resources[id]) {
      resources[id] = baseStatusEntry();
    }
  }
  for (const [id, patch] of Object.entries(availableMap)) {
    resources[id] = baseStatusEntry({
      ...resources[id],
      available: true,
      ...patch,
    });
  }
  for (const [id, patch] of Object.entries(extra)) {
    resources[id] = baseStatusEntry({
      ...(resources[id] || {}),
      ...patch,
    });
  }
  return statusDoc(resources);
}

const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

let arbiterCalls = 0;

async function run() {
  // 1. fail-closed baseline => NO_ROUTE, arbiter=0
  {
    arbiterCalls = 0;
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status: FAIL_CLOSED,
      semanticArbiter: async () => {
        arbiterCalls += 1;
        return { selection: "x" };
      },
    });
    check(
      "01-fail-closed-no-route",
      out.status === "NO_ROUTE" &&
        out.arbiter_call_count === 0 &&
        arbiterCalls === 0 &&
        out.reason_codes.includes(REASON_CODES.NO_AVAILABLE_ROUTE),
      JSON.stringify(out),
    );
  }

  // 2. both routes available; qwen free vs composer included => opencode+qwen deterministic
  {
    arbiterCalls = 0;
    const status = statusWithAvailable({
      opencode: { available: true, cost_mode: "free", location: "local" },
      qwen_local: { available: true, cost_mode: "free", location: "local" },
      cursor: { available: true, cost_mode: "included", location: "cloud" },
      composer: { available: true, cost_mode: "included", location: "cloud" },
    });
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status,
      semanticArbiter: async () => {
        arbiterCalls += 1;
        return { selection: "cursor+composer" };
      },
    });
    check(
      "02-prefer-free-local-deterministic",
      out.status === "ROUTED" &&
        out.execution_route?.route_id === "opencode+qwen_local" &&
        out.arbiter_call_count === 0 &&
        arbiterCalls === 0,
      JSON.stringify(out),
    );
  }

  // 3. only cursor+composer valid
  {
    arbiterCalls = 0;
    const status = statusWithAvailable({
      cursor: { available: true, cost_mode: "included" },
      composer: { available: true, cost_mode: "included" },
    });
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status,
      semanticArbiter: async () => {
        arbiterCalls += 1;
        return { selection: "x" };
      },
    });
    check(
      "03-only-cursor-composer",
      out.status === "ROUTED" &&
        out.execution_route?.route_id === "cursor+composer" &&
        out.arbiter_call_count === 0 &&
        arbiterCalls === 0,
      JSON.stringify(out),
    );
  }

  // 4. qwen unavailable; cursor+composer valid => cursor+composer, no arbitration
  {
    arbiterCalls = 0;
    const status = statusWithAvailable({
      cursor: { available: true, cost_mode: "included" },
      composer: { available: true, cost_mode: "included" },
      opencode: { available: true, cost_mode: "free" },
      // qwen_local remains unavailable
    });
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status,
      semanticArbiter: async () => {
        arbiterCalls += 1;
        return { selection: "opencode+qwen_local" };
      },
    });
    check(
      "04-qwen-unavailable-cursor-composer",
      out.status === "ROUTED" &&
        out.execution_route?.route_id === "cursor+composer" &&
        out.arbiter_call_count === 0 &&
        arbiterCalls === 0,
      JSON.stringify(out),
    );
  }

  // 5. two equivalent routes + arbiter available => mock once
  {
    arbiterCalls = 0;
    // Make both routes same cost_mode=included and neither free so cost/local prefs don't collapse
    const status = statusWithAvailable({
      opencode: { available: true, cost_mode: "included", location: "local" },
      qwen_local: {
        available: true,
        cost_mode: "included",
        location: "local",
      },
      cursor: { available: true, cost_mode: "included", location: "cloud" },
      composer: { available: true, cost_mode: "included", location: "cloud" },
    });
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status,
      semanticArbiter: async (payload) => {
        arbiterCalls += 1;
        if (!payload.survivors.includes("cursor+composer")) {
          throw new Error("expected survivors");
        }
        return { selection: "cursor+composer", confidence: "medium" };
      },
    });
    check(
      "05-ambiguous-mock-arbitration-once",
      out.status === "ROUTED" &&
        out.execution_route?.route_id === "cursor+composer" &&
        out.arbiter_call_count === 1 &&
        arbiterCalls === 1 &&
        out.arbitration.used === true &&
        out.reason_codes.includes(REASON_CODES.SEMANTIC_ARBITRATION),
      JSON.stringify(out),
    );
  }

  // 6. mock invents unknown route => NO_ROUTE ARBITRATION_INVALID
  {
    arbiterCalls = 0;
    const status = statusWithAvailable({
      opencode: { available: true, cost_mode: "included", location: "local" },
      qwen_local: { available: true, cost_mode: "included", location: "local" },
      cursor: { available: true, cost_mode: "included", location: "cloud" },
      composer: { available: true, cost_mode: "included", location: "cloud" },
    });
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status,
      semanticArbiter: async () => {
        arbiterCalls += 1;
        return { selection: "invented+route" };
      },
    });
    check(
      "06-arbiter-invents-route-fail-closed",
      out.status === "NO_ROUTE" &&
        out.arbiter_call_count === 1 &&
        arbiterCalls === 1 &&
        out.reason_codes.includes(REASON_CODES.ARBITRATION_INVALID),
      JSON.stringify(out),
    );
  }

  // 7. unsupported capability => NO_TECHNICAL_ROUTE
  {
    const out = await evaluateExecutionRoute(
      request({ technical_requirements: ["browser"] }),
      { registry: REGISTRY, status: FAIL_CLOSED },
    );
    check(
      "07-unsupported-capability",
      out.status === "NO_ROUTE" &&
        out.reason_codes.includes(REASON_CODES.NO_TECHNICAL_ROUTE) &&
        out.arbiter_call_count === 0,
      JSON.stringify(out),
    );
  }

  // 8. finite quota at/below reserve floor => excluded; other route wins
  {
    arbiterCalls = 0;
    const status = statusWithAvailable({
      opencode: { available: true, cost_mode: "free", location: "local" },
      qwen_local: {
        available: true,
        cost_mode: "free",
        location: "local",
        quota_remaining: { value: 5, unit: "percent" },
        reserve_floor: { value: 10, unit: "percent" },
      },
      cursor: { available: true, cost_mode: "included" },
      composer: { available: true, cost_mode: "included" },
    });
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status,
      semanticArbiter: async () => {
        arbiterCalls += 1;
        return { selection: "x" };
      },
    });
    check(
      "08-reserve-floor-excludes-route",
      out.status === "ROUTED" &&
        out.execution_route?.route_id === "cursor+composer" &&
        out.arbiter_call_count === 0 &&
        arbiterCalls === 0,
      JSON.stringify(out),
    );
  }

  // 9. positive reserve + unknown quota => fail-closed for that resource
  {
    arbiterCalls = 0;
    const status = statusWithAvailable({
      opencode: { available: true, cost_mode: "free", location: "local" },
      qwen_local: {
        available: true,
        cost_mode: "free",
        location: "local",
        quota_remaining: { value: null, unit: "unknown" },
        reserve_floor: { value: 5, unit: "percent" },
      },
      cursor: { available: true, cost_mode: "included" },
      composer: { available: true, cost_mode: "included" },
    });
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status,
      semanticArbiter: async () => {
        arbiterCalls += 1;
        return { selection: "x" };
      },
    });
    check(
      "09-unknown-quota-with-reserve-fail-closed",
      out.status === "ROUTED" &&
        out.execution_route?.route_id === "cursor+composer" &&
        out.arbiter_call_count === 0,
      JSON.stringify(out),
    );
  }

  // 10. registry resource missing from status => unavailable
  {
    const resources = {};
    for (const id of Object.keys(REGISTRY.resources)) {
      if (id === "composer") continue; // missing
      resources[id] = baseStatusEntry({
        available: id === "cursor" || id === "composer",
      });
    }
    // cursor available but composer missing entirely
    resources.cursor = baseStatusEntry({ available: true, cost_mode: "included" });
    resources.opencode = baseStatusEntry({ available: false });
    resources.qwen_local = baseStatusEntry({ available: false });
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status: statusDoc(resources),
    });
    check(
      "10-missing-status-entry-unavailable",
      out.status === "NO_ROUTE" &&
        out.reason_codes.includes(REASON_CODES.NO_AVAILABLE_ROUTE),
      JSON.stringify(out),
    );
  }

  // 11. codex cannot become implementation_model
  {
    const status = statusWithAvailable({
      cursor: { available: true, cost_mode: "included" },
      codex: { available: true, cost_mode: "included" },
    });
    // Force a request that would only work if codex were an implementation model
    // paired somehow — with current registry, no cursor+codex pair exists.
    const out = await evaluateExecutionRoute(request(), {
      registry: REGISTRY,
      status,
    });
    const routedCodex =
      out.status === "ROUTED" && out.execution_route?.model === "codex";
    check(
      "11-codex-not-implementation-model",
      !routedCodex &&
        (out.status === "NO_ROUTE" ||
          (out.status === "ROUTED" && out.execution_route.model !== "codex")),
      JSON.stringify(out),
    );
  }

  // 12. technical requirements not silently weakened (browser still fails even if other caps available)
  {
    const status = statusWithAvailable({
      opencode: { available: true, cost_mode: "free", location: "local" },
      qwen_local: { available: true, cost_mode: "free", location: "local" },
      cursor: { available: true, cost_mode: "included" },
      composer: { available: true, cost_mode: "included" },
    });
    const out = await evaluateExecutionRoute(
      request({
        technical_requirements: ["filesystem", "browser"],
      }),
      { registry: REGISTRY, status },
    );
    check(
      "12-requirements-not-weakened",
      out.status === "NO_ROUTE" &&
        out.reason_codes.includes(REASON_CODES.NO_TECHNICAL_ROUTE) &&
        out.arbiter_call_count === 0,
      JSON.stringify(out),
    );
  }

  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
  }
  const failed = results.filter((r) => !r.pass);
  const summary = {
    ok: failed.length === 0,
    classification: failed.length === 0 ? "PASS" : "FAIL",
    passed: results.filter((r) => r.pass).length,
    failed: failed.length,
    total: results.length,
  };
  console.log(JSON.stringify(summary));
  process.exit(failed.length === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(String(err && err.stack ? err.stack : err));
  process.exit(1);
});
