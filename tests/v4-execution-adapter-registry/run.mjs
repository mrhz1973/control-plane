#!/usr/bin/env node
/**
 * Offline tests for v4-execution-adapter-registry-v1.
 * No opencode run, no Qwen, no provider, no n8n, no live execution.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateAdapterRegistration,
  createExecutionAdapterRegistry,
  registerExecutionAdapter,
  validateExecutionAdapterRegistry,
  registrySnapshot,
  createDefaultExecutionAdapterRegistry,
  openCodeQwenLocalRegistration,
  OPENCODE_QWEN_LOCAL_ROUTE,
  OPENCODE_ADAPTER_ID,
  SNAPSHOT_SCHEMA,
} from "../../tools/v4-execution-adapter-registry-v1.mjs";
import { routeToExecutionAdapter } from "../../tools/v4-execution-adapter-router-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function syntheticFuture(overrides = {}) {
  return {
    route_id: "synthetic_future+model_x",
    adapter_id: "synthetic-future-adapter-v0",
    implementer: "synthetic_future",
    model: "model_x",
    dispatch_required: false,
    run: async () => ({
      schema_version: "synthetic-result-v0",
      status: "EXECUTED",
      classification: "EXECUTED_OK",
      execution_performed: true,
      reason_codes: ["SYNTHETIC"],
    }),
    ...overrides,
  };
}

function routedResult(routeId, implementer, model) {
  return {
    schema_version: "execution-route-result-v1",
    request_id: "req-reg",
    status: "ROUTED",
    execution_route: {
      route_id: routeId,
      implementer,
      model,
      confidence: "high",
      reason_codes: [],
    },
    arbitration: { required: false, used: false, arbiter: null },
    reason_codes: [],
    arbiter_call_count: 0,
  };
}

async function run() {
  // 1 default registry validates
  {
    const registry = createDefaultExecutionAdapterRegistry();
    const v = validateExecutionAdapterRegistry(registry);
    check("default-registry-validates", v.ok === true, JSON.stringify(v.reason_codes));
  }

  // 2 default contains exactly opencode+qwen_local
  {
    const registry = createDefaultExecutionAdapterRegistry();
    const snap = registrySnapshot(registry);
    check(
      "default-exactly-opencode-qwen-local",
      registry.size === 1 &&
        registry.has(OPENCODE_QWEN_LOCAL_ROUTE) &&
        snap.entries.length === 1 &&
        snap.entries[0].route_id === OPENCODE_QWEN_LOCAL_ROUTE &&
        snap.entries[0].adapter_id === OPENCODE_ADAPTER_ID,
      JSON.stringify(snap.entries),
    );
  }

  // 3 valid synthetic future adapter can register
  {
    const registry = createDefaultExecutionAdapterRegistry();
    const r = registerExecutionAdapter(registry, syntheticFuture());
    check(
      "synthetic-future-can-register",
      r.ok === true && registry.size === 2 && registry.has("synthetic_future+model_x"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 4 malformed route_id rejected
  {
    const v = validateAdapterRegistration(syntheticFuture({ route_id: "" }));
    check(
      "malformed-route-id-rejected",
      v.ok === false && v.reason_codes.includes("ROUTE_ID_INVALID"),
      JSON.stringify(v.reason_codes),
    );
  }

  // 5 implementer/model/route mismatch rejected
  {
    const v = validateAdapterRegistration(
      syntheticFuture({ route_id: "synthetic_future+model_x", implementer: "other", model: "model_x" }),
    );
    check(
      "route-implementer-model-mismatch-rejected",
      v.ok === false && v.reason_codes.includes("ROUTE_IMPLEMENTER_MODEL_MISMATCH"),
      JSON.stringify(v.reason_codes),
    );
  }

  // 6 missing run rejected
  {
    const entry = syntheticFuture();
    delete entry.run;
    const v = validateAdapterRegistration(entry);
    check(
      "missing-run-rejected",
      v.ok === false && v.reason_codes.includes("RUN_MISSING"),
      JSON.stringify(v.reason_codes),
    );
  }

  // 7 non-boolean dispatch_required rejected
  {
    const v = validateAdapterRegistration(syntheticFuture({ dispatch_required: "yes" }));
    check(
      "non-boolean-dispatch-required-rejected",
      v.ok === false && v.reason_codes.includes("DISPATCH_REQUIRED_INVALID"),
      JSON.stringify(v.reason_codes),
    );
  }

  // 8 wildcard/catch-all route rejected
  {
    const wild = validateAdapterRegistration(
      syntheticFuture({ route_id: "*+*", implementer: "*", model: "*" }),
    );
    const star = validateAdapterRegistration(
      syntheticFuture({ route_id: "synthetic*", implementer: "synthetic*", model: "model_x" }),
    );
    check(
      "wildcard-catchall-rejected",
      wild.ok === false &&
        wild.reason_codes.includes("WILDCARD_ROUTE_REJECTED") &&
        star.ok === false &&
        star.reason_codes.includes("WILDCARD_ROUTE_REJECTED"),
      JSON.stringify([wild.reason_codes, star.reason_codes]),
    );
  }

  // 9 duplicate route_id rejected
  {
    const registry = createDefaultExecutionAdapterRegistry();
    const r = registerExecutionAdapter(registry, {
      ...openCodeQwenLocalRegistration(),
      adapter_id: "different-adapter-id",
      run: async () => ({}),
    });
    check(
      "duplicate-route-id-rejected",
      r.ok === false && r.reason_codes.includes("DUPLICATE_ROUTE_ID"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 10 ambiguous duplicate adapter rejected
  {
    const registry = createDefaultExecutionAdapterRegistry();
    const r = registerExecutionAdapter(registry, {
      ...syntheticFuture(),
      adapter_id: OPENCODE_ADAPTER_ID, // already used by default OpenCode entry
    });
    check(
      "ambiguous-duplicate-adapter-rejected",
      r.ok === false && r.reason_codes.includes("AMBIGUOUS_DUPLICATE_ADAPTER"),
      JSON.stringify(r.reason_codes),
    );
  }

  // 11 snapshot metadata only — never run function
  {
    const registry = createDefaultExecutionAdapterRegistry();
    registerExecutionAdapter(registry, syntheticFuture());
    const snap = registrySnapshot(registry);
    const text = JSON.stringify(snap);
    check(
      "snapshot-metadata-only-no-run",
      snap.schema_version === SNAPSHOT_SCHEMA &&
        snap.valid === true &&
        !text.includes('"run"') &&
        typeof snap.entries[0].run === "undefined" &&
        snap.entries.every((e) => e.route_id && e.adapter_id && e.implementer && e.model && typeof e.dispatch_required === "boolean"),
      text.slice(0, 200),
    );
  }

  // 12/13 invalid custom registry fail-closed + zero adapter runs
  {
    let runs = 0;
    const badMap = new Map();
    badMap.set("broken+route", {
      route_id: "broken+route",
      adapter_id: "broken",
      implementer: "broken",
      model: "route",
      dispatch_required: true,
      // missing run
    });
    const r = await routeToExecutionAdapter(
      {
        execution_id: "t-invalid-reg",
        execution_route_result: routedResult("opencode+qwen_local", "opencode", "qwen_local"),
        execution_packet: { goal: "g" },
        runOpenCode: async () => {
          runs += 1;
          return {};
        },
      },
      { registry: badMap },
    );
    check(
      "invalid-custom-registry-fail-closed",
      r.classification === "ADAPTER_REGISTRY_INVALID" && r.execution_performed === false,
      JSON.stringify(r.reason_codes),
    );
    check("invalid-registry-zero-adapter-runs", runs === 0, `runs=${runs}`);
  }

  // 14 valid registry exact lookup works
  {
    const registry = createDefaultExecutionAdapterRegistry();
    registerExecutionAdapter(registry, syntheticFuture());
    const hit = registry.get("synthetic_future+model_x");
    const miss = registry.get("cursor+composer");
    check(
      "exact-lookup-works",
      hit && hit.adapter_id === "synthetic-future-adapter-v0" && miss === undefined,
      String(hit?.adapter_id),
    );
  }

  // 15 unsupported route does not fallback
  {
    let syntheticRuns = 0;
    const registry = createDefaultExecutionAdapterRegistry();
    registerExecutionAdapter(registry, {
      ...syntheticFuture(),
      run: async () => {
        syntheticRuns += 1;
        return { status: "EXECUTED", classification: "EXECUTED_OK", execution_performed: true };
      },
    });
    const r = await routeToExecutionAdapter(
      {
        execution_id: "t-nofallback",
        execution_route_result: routedResult("cursor+composer", "cursor", "composer"),
        execution_packet: { goal: "g" },
      },
      { registry },
    );
    check(
      "unsupported-route-no-fallback",
      r.classification === "ADAPTER_NOT_REGISTERED" && syntheticRuns === 0 && r.execution_performed === false,
      `${r.classification}/${syntheticRuns}`,
    );
  }

  // 16 existing OpenCode registration identity unchanged
  {
    const entry = openCodeQwenLocalRegistration();
    const registry = createDefaultExecutionAdapterRegistry();
    const got = registry.get(OPENCODE_QWEN_LOCAL_ROUTE);
    check(
      "opencode-registration-identity-unchanged",
      entry.route_id === "opencode+qwen_local" &&
        entry.adapter_id === "opencode-execution-adapter-v1" &&
        entry.implementer === "opencode" &&
        entry.model === "qwen_local" &&
        entry.dispatch_required === true &&
        got.route_id === entry.route_id &&
        got.adapter_id === entry.adapter_id &&
        got.implementer === entry.implementer &&
        got.model === entry.model &&
        got.dispatch_required === true,
      JSON.stringify(registrySnapshot(registry).entries[0]),
    );
  }

  // 17 grok_bot resource role remains unchanged
  {
    const registryJson = JSON.parse(
      readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8").replace(/^\uFEFF/, ""),
    );
    const roles = registryJson?.resources?.grok_bot?.roles;
    check(
      "grok-bot-role-unchanged",
      Array.isArray(roles) && roles.length === 1 && roles[0] === "routing_arbiter",
      JSON.stringify(roles),
    );
  }

  // 18 default CLI/test path performs zero live execution
  {
    const { execFileSync } = await import("node:child_process");
    const out = execFileSync("node", ["tools/v4-execution-adapter-registry-v1.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const snap = JSON.parse(out);
    check(
      "default-cli-zero-live-execution",
      snap.schema_version === SNAPSHOT_SCHEMA &&
        snap.entries.length === 1 &&
        snap.entries[0].route_id === OPENCODE_QWEN_LOCAL_ROUTE &&
        !out.toLowerCase().includes("opencode run") &&
        !JSON.stringify(snap).includes('"run"'),
      out.slice(0, 120),
    );
  }

  // create with invalid entries fail-closed
  {
    const created = createExecutionAdapterRegistry([
      openCodeQwenLocalRegistration(),
      { route_id: "bad", adapter_id: "x", implementer: "a", model: "b", dispatch_required: true, run: () => {} },
    ]);
    check(
      "create-rejects-mismatch-batch",
      created.ok === false && created.registry === null,
      JSON.stringify(created.reason_codes),
    );
  }

  const failed = results.filter((x) => !x.pass);
  const summary = {
    suite: "v4-execution-adapter-registry",
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
