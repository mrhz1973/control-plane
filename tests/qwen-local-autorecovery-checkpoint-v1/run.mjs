#!/usr/bin/env node
/**
 * Exhaustive autorecovery checkpoint matrix for DEV Qwen session ensure.
 * S1–S11 are deterministic offline (injectable fakes). S12 is live when the
 * workstation state allows a safe cold/zombie recycle on :8080.
 *
 * Run: node tests/qwen-local-autorecovery-checkpoint-v1/run.mjs
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  ensureWorkstationDevQwenReady,
  ensureWorkstationDevRouterReady,
  classifyCanonicalRouterOccupant,
  collectCanonicalRouterTreePids,
  DEFAULT_DEV_ROUTER_TIMEOUT_MS,
  __resetDevSessionManagerLockForTests,
} from "../../tools/qwen-local-session-manager-v1.mjs";
import { loadQwenLocalRuntime } from "../../tools/qwen-local-runtime-v1.mjs";

const DEV_PROFILE = "qwen38-opus-q3-opencode-64k";
const REAL_RUNTIME = loadQwenLocalRuntime();

let passed = 0;
const failures = [];
const scenarioResults = [];

function record(id, ok, detail) {
  scenarioResults.push({ id, ok, detail: detail || "" });
  if (ok) {
    passed += 1;
    process.stdout.write(`PASS ${id} ${detail || ""}\n`);
  } else {
    failures.push(id);
    process.stdout.write(`FAIL ${id}: ${detail || ""}\n`);
  }
}

async function scenario(id, fn) {
  try {
    __resetDevSessionManagerLockForTests();
    const detail = await fn();
    record(id, true, detail || "");
  } catch (err) {
    record(id, false, err?.message || String(err));
  }
}

const BASE_OPTS = {
  loadRuntime: () => REAL_RUNTIME,
  existsPath: () => true,
  sleepFn: async () => {},
  readinessTimeoutMs: 50,
  pollIntervalMs: 1,
  pythonExecutable: "python.exe",
  profile: DEV_PROFILE,
};

assert.ok(DEFAULT_DEV_ROUTER_TIMEOUT_MS >= 120_000, "DEV timeout must cover backend ~90s budget");

await scenario("S1_COLD_ROUTER", async () => {
  let launches = 0;
  let models = [];
  const r = await ensureWorkstationDevQwenReady({
    ...BASE_OPTS,
    checkReadiness: async ({ modelId }) => (
      models.includes(modelId)
        ? { ok: true, classification: "READY", http_status: 200, ids: [...models] }
        : { ok: false, classification: "API_UNREACHABLE" }
    ),
    ensureDevRouterReady: async () => {
      launches += 1;
      models = [DEV_PROFILE];
      return { ready: true, status: "LAUNCH_STARTED_AND_READY", launch_performed: true, launch_count: 1 };
    },
    loadExactProfile: async () => { throw new Error("must not load before router ready"); },
  });
  assert.equal(r.ready, true);
  assert.equal(launches, 1);
  assert.equal(r.launch_count, 1);
  return "launch once then READY";
});

await scenario("S2_WARM_ROUTER_PROFILE_READY", async () => {
  let launches = 0;
  let loads = 0;
  const r = await ensureWorkstationDevQwenReady({
    ...BASE_OPTS,
    checkReadiness: async ({ modelId }) => ({ ok: true, classification: "READY", ids: [modelId] }),
    ensureDevRouterReady: async () => { launches += 1; return { ready: true, status: "READY", launch_count: 1 }; },
    loadExactProfile: async () => { loads += 1; return { ok: true }; },
  });
  assert.equal(r.ready, true);
  assert.equal(r.status, "READY");
  assert.equal(launches, 0);
  assert.equal(loads, 0);
  assert.equal(r.launch_count, 0);
  return "reuse zero launch/load";
});

await scenario("S3_ROUTER_UP_PROFILE_MISSING_LOAD", async () => {
  let launches = 0;
  let loads = 0;
  let ids = ["qwen38-opus-q3-daily-16k"];
  const r = await ensureWorkstationDevQwenReady({
    ...BASE_OPTS,
    checkReadiness: async ({ modelId }) => (
      ids.includes(modelId)
        ? { ok: true, classification: "READY", http_status: 200, ids: [...ids] }
        : { ok: false, classification: "PROFILE_NOT_EXPOSED", http_status: 200, ids: [...ids] }
    ),
    ensureDevRouterReady: async () => { launches += 1; return { ready: true, launch_count: 0 }; },
    loadExactProfile: async ({ modelId }) => {
      loads += 1;
      assert.equal(modelId, DEV_PROFILE);
      ids = [modelId];
      return { ok: true, classification: "PROFILE_LOAD_ACCEPTED", http_status: 200 };
    },
  });
  assert.equal(r.ready, true);
  assert.equal(r.status, "PROFILE_LOADED_AND_READY");
  assert.equal(launches, 0);
  assert.equal(loads, 1);
  return "exact load no fallback";
});

await scenario("S4_WRONG_PROFILE_NEVER_READY", async () => {
  const r = await ensureWorkstationDevQwenReady({
    ...BASE_OPTS,
    checkReadiness: async () => ({
      ok: false,
      classification: "PROFILE_NOT_EXPOSED",
      http_status: 200,
      ids: ["other-model"],
    }),
    ensureDevRouterReady: async () => { throw new Error("no router restore"); },
    loadExactProfile: async () => ({ ok: false, classification: "PROFILE_LOAD_REJECTED", http_status: 500 }),
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "PROFILE_LOAD_REJECTED");
  assert.notEqual(r.model_id, "other-model");
  assert.equal(r.model_id, DEV_PROFILE);
  return "fail closed exact id retained";
});

await scenario("S5_DEAD_UNREACHABLE_ROUTER_BOUNDED", async () => {
  const r = await ensureWorkstationDevRouterReady({
    ...BASE_OPTS,
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async () => ({ pid: 1 }),
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "READINESS_TIMEOUT");
  assert.equal(r.launch_performed, true);
  return "bounded READINESS_TIMEOUT";
});

await scenario("S6_PORT_OCCUPIED_FOREIGN", async () => {
  let kills = 0;
  const r = await ensureWorkstationDevRouterReady({
    ...BASE_OPTS,
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => true,
    recycleCanonicalZombieRouter: async () => {
      kills += 1;
      return { ok: false, recycled: false, reason_code: "FOREIGN_OR_UNKNOWN_OCCUPANT" };
    },
    launchHeadlessRouter: async () => { throw new Error("must not launch"); },
  });
  assert.equal(r.ready, false);
  assert.equal(r.status, "ENDPOINT_OCCUPIED_UNHEALTHY");
  assert.equal(r.reason_code, "FOREIGN_OR_UNKNOWN_OCCUPANT");
  assert.equal(kills, 1);
  return "foreign fail-closed no launch";
});

await scenario("S7_ROUTER_ENTRYPOINT_MISSING", async () => {
  const r = await ensureWorkstationDevRouterReady({
    ...BASE_OPTS,
    existsPath: (p) => !String(p).includes("qwen_runtime_router.py"),
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async () => { throw new Error("must not launch"); },
  });
  assert.equal(r.status, "ROUTER_ENTRYPOINT_NOT_FOUND");
  assert.equal(r.ready, false);
  return "deterministic classification";
});

await scenario("S8_ROUTER_CONFIG_MISSING", async () => {
  const r = await ensureWorkstationDevRouterReady({
    ...BASE_OPTS,
    existsPath: (p) => !String(p).includes("qwen-runtime-router.json"),
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async () => { throw new Error("must not launch"); },
  });
  assert.equal(r.status, "ROUTER_CONFIG_NOT_FOUND");
  assert.equal(r.ready, false);
  return "deterministic classification";
});

await scenario("S9_PYTHON_RESOLUTION_FAILURE", async () => {
  const r = await ensureWorkstationDevRouterReady({
    ...BASE_OPTS,
    pythonExecutable: "C:\\missing\\python.exe",
    existsPath: (p) => !String(p).toLowerCase().includes("python.exe"),
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async () => { throw new Error("must not launch"); },
  });
  assert.equal(r.status, "PYTHON_NOT_FOUND");
  assert.equal(r.ready, false);
  return "deterministic classification";
});

await scenario("S10_ROUTER_SPAWN_IMMEDIATE_EXIT", async () => {
  const r = await ensureWorkstationDevRouterReady({
    ...BASE_OPTS,
    checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async () => ({ pid: 999 }),
  });
  assert.equal(r.ready, false);
  assert.ok(
    r.status === "READINESS_TIMEOUT" || r.status === "LAUNCH_FAILED",
    `unexpected ${r.status}`,
  );
  assert.equal(r.launch_performed, true);
  return `useful failure ${r.status}`;
});

await scenario("S11_CONCURRENT_PREFLIGHTS_SINGLE_LAUNCH", async () => {
  let launches = 0;
  let healthy = false;
  const opts = {
    ...BASE_OPTS,
    readinessTimeoutMs: 200,
    pollIntervalMs: 5,
    sleepFn: (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 5))),
    checkRouterApi: async () => (
      healthy
        ? { ok: true, classification: "ROUTER_API_HEALTHY", http_status: 200, ids: [] }
        : { ok: false, classification: "API_UNREACHABLE" }
    ),
    checkEndpointOccupied: async () => false,
    launchHeadlessRouter: async () => {
      launches += 1;
      await new Promise((r) => setTimeout(r, 30));
      healthy = true;
      return { pid: 42 };
    },
  };
  __resetDevSessionManagerLockForTests();
  const [a, b] = await Promise.all([
    ensureWorkstationDevRouterReady(opts),
    ensureWorkstationDevRouterReady(opts),
  ]);
  assert.equal(a.ready, true);
  assert.equal(b.ready, true);
  assert.equal(launches, 1, `expected single launch, got ${launches}`);
  return "single lifecycle launch";
});

await scenario("S6b_CANONICAL_ZOMBIE_RECYCLE_THEN_LAUNCH", async () => {
  let occupied = true;
  let recycle = 0;
  let launches = 0;
  const r = await ensureWorkstationDevRouterReady({
    ...BASE_OPTS,
    checkRouterApi: async () => (
      launches >= 1
        ? { ok: true, classification: "ROUTER_API_HEALTHY", http_status: 200, ids: [] }
        : { ok: false, classification: "API_UNREACHABLE" }
    ),
    checkEndpointOccupied: async () => occupied,
    recycleCanonicalZombieRouter: async () => {
      recycle += 1;
      occupied = false;
      return { ok: true, recycled: true, reason_code: "CANONICAL_ZOMBIE_RECYCLED", killed_pids: [1] };
    },
    launchHeadlessRouter: async () => {
      launches += 1;
      return { pid: 7 };
    },
  });
  assert.equal(r.ready, true);
  assert.equal(recycle, 1);
  assert.equal(launches, 1);
  return "canonical recycle then READY";
});

await scenario("S_CLASSIFY_CANONICAL_VS_FOREIGN", async () => {
  const entry = "C:/Users/mrhz/Documents/AI/QWEN/qwen_runtime_router.py";
  const cfg = "C:/Users/mrhz/Documents/AI/QWEN/qwen-runtime-router.json";
  const can = classifyCanonicalRouterOccupant({
    processes: [{
      pid: 11,
      name: "python.exe",
      commandLine: `python -u ${entry} --config ${cfg}`,
    }],
    routerEntrypoint: entry,
    routerConfig: cfg,
  });
  assert.equal(can.is_canonical, true);
  const foreign = classifyCanonicalRouterOccupant({
    processes: [{ pid: 12, name: "node.exe", commandLine: "node fake-server.js" }],
    routerEntrypoint: entry,
    routerConfig: cfg,
  });
  assert.equal(foreign.is_canonical, false);
  const tree = collectCanonicalRouterTreePids({
    processes: [
      { pid: 11, name: "python.exe", commandLine: `python -u ${entry} --config ${cfg}` },
      { pid: 22, name: "llama-server.exe", commandLine: "llama-server.exe --port 18080" },
      { pid: 33, name: "llama-server.exe", commandLine: "llama-server.exe --port 9999" },
    ],
    routerPids: [11],
    routerConfig: cfg,
    existsPath: () => false,
  });
  assert.ok(tree.includes(11));
  assert.ok(tree.includes(22));
  assert.ok(!tree.includes(33));
  return "classify+tree ports";
});

/** Live S12: recycle canonical zombie or cold-start when safe. */
await scenario("S12_LIVE_COLD_OR_ZOMBIE_THEN_WARM", async () => {
  const baseUrl = "http://127.0.0.1:8080";
  let modelsHttp = null;
  try {
    const r = await fetch(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(3000) });
    modelsHttp = r.status;
  } catch {
    modelsHttp = "UNREACHABLE";
  }

  const probeOccupied = await new Promise((resolvePromise) => {
    import("node:net").then(({ createConnection }) => {
      const s = createConnection({ host: "127.0.0.1", port: 8080 });
      const t = setTimeout(() => { s.destroy(); resolvePromise(false); }, 400);
      s.on("connect", () => { clearTimeout(t); s.end(); resolvePromise(true); });
      s.on("error", () => { clearTimeout(t); resolvePromise(false); });
    });
  });

  const safeColdOrZombie = modelsHttp !== 200;
  if (!safeColdOrZombie) {
    // Healthy exact runtime already present — do not tear down for S12.
    const warm = await ensureWorkstationDevQwenReady({
      profile: DEV_PROFILE,
      readinessTimeoutMs: 15_000,
      pollIntervalMs: 500,
    });
    assert.equal(warm.ready, true, `warm ensure failed: ${warm.reason_code || warm.status}`);
    assert.equal(warm.launch_count, 0);
    return `SKIP_DESTRUCTIVE_COLD healthy_runtime reuse launch_count=0 models_http=${modelsHttp}`;
  }

  const first = await ensureWorkstationDevQwenReady({
    profile: DEV_PROFILE,
    readinessTimeoutMs: 120_000,
    pollIntervalMs: 1000,
  });
  assert.equal(first.ready, true, `live ensure failed: ${JSON.stringify({
    status: first.status,
    reason_code: first.reason_code,
    stage: first.stage,
    modelsHttp,
    probeOccupied,
  })}`);

  const listed = await fetch(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(5000) });
  assert.equal(listed.status, 200);
  const body = await listed.json();
  const ids = (body?.data || []).map((x) => x?.id).filter(Boolean);
  assert.ok(ids.includes(DEV_PROFILE), `exact profile missing in /v1/models: ${ids.join(",")}`);
  const row = (body?.data || []).find((x) => x?.id === DEV_PROFILE);
  const st = row?.status?.value;
  if (st) {
    assert.ok(st === "loaded" || st === "loading", `exact profile not loading/loaded: ${st}`);
  }

  const second = await ensureWorkstationDevQwenReady({
    profile: DEV_PROFILE,
    readinessTimeoutMs: 15_000,
    pollIntervalMs: 500,
  });
  assert.equal(second.ready, true);
  assert.equal(second.launch_count, 0);
  assert.equal(second.load_performed, false);
  assert.equal(second.status, "READY");
  return `cold/zombie→READY then warm reuse; first=${first.status}; occupied_before=${probeOccupied}; models_http_before=${modelsHttp}`;
});

await scenario("S13_ISOLATED_FOREIGN_PORT_OCCUPANT", async () => {
  // Ephemeral listener on a free port — prove fail-closed without touching :8080.
  const server = createServer((req, res) => { res.writeHead(200); res.end("not-router"); });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  try {
    const r = await ensureWorkstationDevRouterReady({
      ...BASE_OPTS,
      baseUrl: `http://127.0.0.1:${port}`,
      checkRouterApi: async () => ({ ok: false, classification: "API_UNREACHABLE" }),
      // Real TCP occupied + recycle returns foreign when processes don't match router.
      recycleCanonicalZombieRouter: async () => ({
        ok: false,
        recycled: false,
        reason_code: "FOREIGN_OR_UNKNOWN_OCCUPANT",
      }),
      launchHeadlessRouter: async () => { throw new Error("must not launch"); },
    });
    assert.equal(r.ready, false);
    assert.equal(r.status, "ENDPOINT_OCCUPIED_UNHEALTHY");
  } finally {
    await new Promise((r) => server.close(r));
  }
  return `isolated port ${port}`;
});

process.stdout.write("\nSCENARIO_SUMMARY\n");
for (const s of scenarioResults) {
  process.stdout.write(`${s.ok ? "PASS" : "FAIL"} ${s.id} ${s.detail}\n`);
}
process.stdout.write(`SCENARIO_TOTAL=${scenarioResults.length}\n`);
process.stdout.write(`SCENARIO_PASS=${scenarioResults.filter((s) => s.ok).length}\n`);
process.stdout.write(`SCENARIO_FAIL=${failures.length}\n`);

if (failures.length) {
  process.stderr.write(`FAILED: ${failures.join(", ")}\n`);
  process.exit(1);
}
process.stdout.write("ALL_CHECKPOINT_SCENARIOS_PASS\n");
