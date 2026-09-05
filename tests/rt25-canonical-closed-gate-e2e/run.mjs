#!/usr/bin/env node
/**
 * V4_RT25_CANONICAL_ENTRYPOINT_INTEGRATION_CORRECTION — CLOSED-GATE E2E.
 *
 * End-to-end proof STARTING FROM THE CANONICAL ENTRYPOINTS with D-0025 CLOSED
 * and NO production activation. The quota decision is NEVER manually
 * constructed mid-chain:
 *
 *   1. REAL ingest lane (temp dir) ← real rt25-quota-ingest-codex decision
 *   2. CANONICAL planner entrypoint: run-litellm-primary-cycle prepareCycle
 *      with quotaStateOptions (the canonical upstream composition point)
 *   3. CANONICAL execution-router entrypoint: evaluateExecutionRoute with the
 *      canonical quota state → router EMITS the RT25 envelope itself
 *   4. n8n bridge with options.quotaStateOptions: bridge composes the state
 *      and consumes the ROUTER-PRODUCED envelope automatically
 *   5. Windows endpoint (real handler) validates the provenance built from the
 *      router-produced envelope under the qwen authorization scope
 *
 * Also proves the CLI planner path: evaluate-planner-selection.mjs <input>
 * <quota-state.json> produced by the canonical producer module.
 */
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { ingestCodexQuotaSnapshot, runIngestPass } from "../../tools/rt25-quota-ingest-codex-v1.mjs";
import { composeCanonicalQuotaState } from "../../tools/rt25-canonical-quota-state-v1.mjs";
import { prepareCycle } from "../../tools/run-litellm-primary-cycle.mjs";
import { evaluateExecutionRoute } from "../../tools/evaluate-execution-route.mjs";
import { runN8nExecutionRoutingBridge } from "../../tools/n8n-v4-execution-routing-bridge-v1.mjs";
import { createDefaultExecutionAdapterRegistry } from "../../tools/v4-execution-adapter-registry-v1.mjs";
import { buildRouteQuotaProvenance } from "../../tools/rt25-route-quota-provenance-v1.mjs";
import {
  handleExecutionRequest,
  createExecutionState,
} from "../../tools/serve-v4-windows-local-execution-endpoint-v1.mjs";
import {
  admitAuthorization as realAdmit,
  inspectAuthorization as realInspect,
  REGISTRY_SCHEMA_VERSION,
} from "../../tools/v4-runtime-authorization-provenance-registry-v1.mjs";
import {
  inspectDurableSpend as realInspectLedger,
  recordDurableSpend as realRecordLedger,
  LEDGER_SCHEMA_VERSION,
} from "../../tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NODE = process.execPath;
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 240) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));
const profile = JSON.parse(readFileSync(resolve(ROOT, "configs/litellm/control-plane-primary-remote.gateway-profile.json"), "utf8"));

// ===========================================================================
// STAGE 1 — REAL runtime ingest lane (temp): snapshot → real ingest pass →
// decision JSON files exactly as the runtime ingest lane produces them.
// ===========================================================================
const tmp = mkdtempSync(join(tmpdir(), "rt25-canonical-e2e-"));
const snapDir = join(tmp, "snapshots");
const ingestDir = join(tmp, "ingest-lane");
mkdirSync(snapDir, { recursive: true });
mkdirSync(ingestDir, { recursive: true });
writeFileSync(join(snapDir, "codex-a.json"), `${JSON.stringify({
  source: "dashboard_snapshot",
  observed_at: "2026-09-05T15:58:00.000Z",
  windows: [
    { window_type: "rolling", remaining: { value: 62, unit: "percent" }, window_ends_at: "2026-09-05T19:00:00.000Z" },
  ],
})}\n`);
const pass1 = runIngestPass({ watchDir: snapDir, outDir: ingestDir, nowMs: NOW });
check(
  "S1-real-ingest-lane-written",
  pass1.length === 1 && pass1[0].decision.ok === true && pass1[0].decision.classification === "INGEST_PASS_QUOTA_PROJECTED",
  JSON.stringify(pass1.map((p) => p.decision.classification)),
);

// The canonical producer consumes the ingest LANE (default path shape: files).
const laneQuotaStateOptions = { ingestDir, nowMs: NOW };

// ===========================================================================
// STAGE 2 — CANONICAL planner entrypoint (upstream composition point).
// prepareCycle composes the canonical quota state itself from the ingest lane.
// ===========================================================================
const routingInput = {
  schema: "planner-routing-input-v1",
  task_id: "RT25-CANONICAL-E2E",
  risk_hint: "low",
  complexity_hint: "low",
  preferred: "codex",
  fallback: [],
  fallback_policy: "gate_only",
  provider_state: {
    qwen: { available: false, resource_pressure: "low" },
    glm: { available: false, quota_state: "unknown" },
    codex: { available: true, quota_state: "healthy" },
  },
};
const consumerInput = {
  task_id: "RT25-CANONICAL-E2E",
  source_backlog_ref: `github:mrhz1973/control-plane@0ec7826:docs/x.md`,
  source_backlog_commit: "0ec7826c8f4e6134e00afe29d9cd71d96da1de73",
  repository: "mrhz1973/control-plane",
  branch_target: "main",
  goal: "canonical closed-gate e2e",
  risk_hint: "low",
  complexity_hint: "low",
  planner_requested: "codex",
  allowed_paths: ["docs/"],
  forbidden_paths: [],
  acceptance_seed: ["canonical e2e proven"],
  validation_seed: [],
  hard_constraints: [],
};
const prep = await prepareCycle({
  consumerInput,
  routingInput,
  gatewayProfile: profile,
  quotaStateOptions: laneQuotaStateOptions,
});
check(
  "S2-canonical-planner-prepare-pass",
  prep.ok === true && prep.quota_state_consumed === true && prep.selected_planner === "codex",
  JSON.stringify({ c: prep.classification, q: prep.quota_state_consumed, p: prep.selected_planner }),
);

// CLI planner leg: canonical producer result → evaluate-planner-selection CLI
const canonicalResult = await composeCanonicalQuotaState(laneQuotaStateOptions);
const qsPath = join(tmp, "quota-state.json");
writeFileSync(qsPath, `${JSON.stringify(canonicalResult.joined)}\n`);
const routingPath = join(tmp, "routing-input.json");
writeFileSync(routingPath, `${JSON.stringify(routingInput)}\n`);
const cli = spawnSync(NODE, [join(ROOT, "tools/evaluate-planner-selection.mjs"), routingPath, qsPath], {
  encoding: "utf8",
  cwd: ROOT,
});
let cliOut = null;
try {
  cliOut = JSON.parse((cli.stdout || "").trim().split(/\r?\n/).filter(Boolean).pop());
} catch {
  cliOut = null;
}
check(
  "S3-planner-cli-consumes-canonical-state",
  cliOut && cliOut.policy_result === "PROCEED" && cliOut.selected === "codex" &&
    cliOut.quota_pool_state_consumed === true,
  JSON.stringify({ pr: cliOut?.policy_result, q: cliOut?.quota_pool_state_consumed }),
);

// ===========================================================================
// STAGE 3 — CANONICAL execution-router entrypoint: router emits the envelope.
// ===========================================================================
const routeRequest = {
  schema_version: "execution-route-request-v1",
  request_id: "RR-CANONICAL-E2E",
  technical_requirements: ["filesystem", "code_edit"],
  risk_level: "low",
};
const mk = (available, cost_mode, location) => ({
  available,
  quota_remaining: { value: null, unit: "unknown" },
  reserve_floor: { value: 0, unit: "none" },
  reset_at: null,
  cost_mode,
  location,
  source: "test-fixture",
  updated_at: "2026-09-05T15:00:00.000Z",
});
const routerStatusDoc = {
  schema_version: "resource-status-v1",
  generated_at: "2026-09-05T16:00:00.000Z",
  resources: {
    cursor: mk(true, "included", "cloud"),
    grok_bot: mk(false, "unknown", "cloud"),
    opencode: mk(true, "free", "local"),
    qwen_local: mk(true, "free", "local"),
    glm: mk(false, "unknown", "cloud"),
    codex: mk(false, "unknown", "cloud"),
    composer: mk(true, "included", "cloud"),
  },
};
const routed = await evaluateExecutionRoute(routeRequest, {
  registry,
  status: routerStatusDoc,
  quotaState: canonicalResult.joined,
});
check(
  "S4-canonical-router-emits-envelope",
  routed.status === "ROUTED" &&
    routed.quota_decision?.schema_version === "v4-rt25-execution-quota-aware-decision-v1" &&
    routed.quota_decision?.selected?.route_id === routed.execution_route.route_id,
  JSON.stringify({ r: routed.execution_route?.route_id, e: routed.quota_decision?.selected?.route_id }),
);

// ===========================================================================
// STAGE 4 — n8n bridge: canonical composition + AUTOMATIC consumption of the
// router-produced envelope (no inputs.quota_decision anywhere).
// ===========================================================================
const cycleResult = {
  schema: "n8n-litellm-primary-cycle-result-v1",
  ok: true,
  classification: "PASS",
  task_id: "RT25-CANONICAL-E2E",
  packet: { packet_id: "PK-CANONICAL-E2E", goal: "canonical closed-gate e2e" },
  policy: { decision: "PROCEED" },
  cursor_dispatch_allowed: true,
};
const bridge = await runN8nExecutionRoutingBridge(
  { cycle_result: cycleResult, route_request: routeRequest, status: routerStatusDoc },
  {
    adapterRegistry: createDefaultExecutionAdapterRegistry(),
    quotaStateOptions: laneQuotaStateOptions,
  },
);
check(
  "S5-bridge-automatically-consumes-canonical-decision",
  bridge.ok === true &&
    bridge.quota_decision_consumed === true &&
    bridge.quota_decision_provenance?.decision_schema === "v4-rt25-execution-quota-aware-decision-v1" &&
    bridge.quota_decision_provenance?.selected_route === bridge.route_id &&
    bridge.reason_codes.includes("QUOTA_DECISION_PRODUCED_BY_CANONICAL_ROUTER"),
  JSON.stringify({ c: bridge.classification, r: bridge.route_id, p: bridge.quota_decision_provenance?.selected_route }),
);
check(
  "S6-bridge-stops-before-dispatch",
  bridge.dispatch_prepared === false && bridge.execution_performed === false,
  `${bridge.dispatch_prepared}/${bridge.execution_performed}`,
);

// Blocked leg: empty ingest lane (no contributions) + reserve floor → the
// canonical router must fail closed and the bridge must carry the blocked
// envelope with QUOTA provenance (metadata only).
const emptyLane = mkdtempSync(join(tmpdir(), "rt25-canonical-e2e-empty-"));
mkdirSync(emptyLane, { recursive: true });
const bridgeBlocked = await runN8nExecutionRoutingBridge(
  { cycle_result: cycleResult, route_request: routeRequest, status: routerStatusDoc },
  {
    adapterRegistry: createDefaultExecutionAdapterRegistry(),
    quotaStateOptions: {
      ingestDir: emptyLane,
      nowMs: NOW,
      reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
    },
  },
);
// With no contributions the pools evaluate CONSERVE_UNKNOWN; only no-pool
// routes (local lane + cursor+composer no-pool) remain admissible, so the
// router still routes the unmetered lane — provenance reflects no-pool.
check(
  "S7-blocked-lane-still-fail-safe",
  bridgeBlocked.ok === true &&
    bridgeBlocked.quota_decision_consumed === true &&
    (bridgeBlocked.route_id === "opencode+qwen_local" || bridgeBlocked.classification === "NO_ROUTE"),
  JSON.stringify({ c: bridgeBlocked.classification, r: bridgeBlocked.route_id }),
);

// ===========================================================================
// STAGE 5 — Windows endpoint receives validated provenance from the envelope
// PRODUCED BY THE CANONICAL ROUTER (qwen scope: model qwen_local, pool null).
// ===========================================================================
const provenance = buildRouteQuotaProvenance(routed.quota_decision, { nowMs: NOW });
const endpointProvenance = {
  ...provenance,
  model: "qwen_local",
  quota_pool_id: null,
  pool_evidence: null,
};
const authTmp = mkdtempSync(join(tmpdir(), "rt25-canonical-e2e-auth-"));
const REGISTRY_PATH = join(authTmp, "auth-registry.json");
const LEDGER_PATH = join(authTmp, "ledger.json");
const rfc3339 = (ms) => new Date(Date.now() + ms).toISOString();
writeFileSync(REGISTRY_PATH, `${JSON.stringify({
  schema_version: REGISTRY_SCHEMA_VERSION,
  entries: [{
    authorization_id: "AUTH-CANONICAL-E2E",
    state: "ACTIVE",
    route_id: "opencode+qwen_local",
    issued_at: rfc3339(-60_000),
    expires_at: rfc3339(3_600_000),
    spent_at: null,
  }],
})}\n`);
writeFileSync(LEDGER_PATH, `${JSON.stringify({ schema_version: LEDGER_SCHEMA_VERSION, spends: [] })}\n`);

let runnerCalls = 0;
const deps = {
  state: createExecutionState(),
  authorizationRegistryPath: REGISTRY_PATH,
  authorizationSpendLedgerPath: LEDGER_PATH,
  inspectAuthorization: (p, id, o) => realInspect(p, id, o),
  admitAuthorization: (p, id, o) => realAdmit(p, id, o),
  inspectDurableSpend: (p, id, o) => realInspectLedger(p, id, o),
  recordDurableSpend: (p, r, o) => realRecordLedger(p, r, o),
  getOccupancy: async () => "QWEN_READY_IDLE",
  runOpenCode: async () => {
    runnerCalls += 1;
    return { opencode_execution_count: 1, retry_calls: 0, fallback_calls: 0, response_validation: "NOT_VALIDATED" };
  },
  executeOpenCodeBounded: undefined,
};
const authBody = (executionId, prov) => ({
  schema_version: "v4-windows-local-execution-endpoint-request-v1",
  execution_id: executionId,
  runtime_authorization: {
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: "AUTH-CANONICAL-E2E",
    authorization_state: "ACTIVE",
    route_id: "opencode+qwen_local",
    scope: {
      scope_version: "qwen-execution-scope-v3",
      execution_harness: "opencode",
      model: "qwen_local",
      profile_id: "qwen38-opus-q3-agent-24k",
      role: "FAST_AGENT",
      canonical_endpoint: "http://127.0.0.1:8080",
      single_generation_guard_required: true,
      max_opencode_executions: 1,
      max_qwen_generation_calls: 1,
      retry: 0,
      fallback: 0,
    },
  },
  message: "canonical closed-gate e2e",
  route_quota_provenance: prov,
});
const r = await handleExecutionRequest(authBody("EX-CANONICAL-E2E-1", endpointProvenance), deps);
check(
  "S8-endpoint-validates-canonical-provenance",
  r.status === 200 && r.body.ok === true && r.body.classification === "EXECUTED_OK" &&
    r.body.route_quota_provenance?.present === true,
  JSON.stringify({ c: r.body.classification }),
);

// Unauthorized leg (no ACTIVE authorization): blocked BEFORE generation with
// the SAME canonical provenance — provenance never bypasses authorization.
const authTmp2 = mkdtempSync(join(tmpdir(), "rt25-canonical-e2e-noauth-"));
const REGISTRY_PATH2 = join(authTmp2, "auth-registry.json");
const LEDGER_PATH2 = join(authTmp2, "ledger.json");
writeFileSync(REGISTRY_PATH2, `${JSON.stringify({ schema_version: REGISTRY_SCHEMA_VERSION, entries: [] })}\n`);
writeFileSync(LEDGER_PATH2, `${JSON.stringify({ schema_version: LEDGER_SCHEMA_VERSION, spends: [] })}\n`);
const callsBefore = runnerCalls;
const deps2 = {
  ...deps,
  state: createExecutionState(),
  authorizationRegistryPath: REGISTRY_PATH2,
  authorizationSpendLedgerPath: LEDGER_PATH2,
  runOpenCode: async () => {
    runnerCalls += 1;
    throw new Error("UNAUTHORIZED_GENERATION_ATTEMPT");
  },
};
const rBlocked = await handleExecutionRequest(authBody("EX-CANONICAL-E2E-2", endpointProvenance), deps2);
check(
  "S9-unauthorized-blocked-before-generation",
  rBlocked.status === 200 && rBlocked.body.ok === false &&
    rBlocked.body.classification === "AUTHORIZATION_REJECTED" &&
    runnerCalls === callsBefore,
  JSON.stringify({ c: rBlocked.body.classification, ran: runnerCalls - callsBefore }),
);

// ===========================================================================
// STAGE 6 — D-0025 static proof + no-generation invariants
// ===========================================================================
{
  const gateText = readFileSync(resolve(ROOT, "workflows/patches/d0025-w-wf61-item-return-shape-fix.gpt-web.json"), "utf8");
  check("S10-d0025-still-closed", !/"enabled"\s*:\s*true/.test(gateText));
  check(
    "S11-no-unauthorized-generation",
    runnerCalls === 1, // exactly the single authorized offline leg S8
    `runner=${runnerCalls}`,
  );
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));
  check(
    "S12-ledger-single-authorized-spend",
    ledger.spends.length === 1 && ledger.spends[0].authorization_id === "AUTH-CANONICAL-E2E",
    JSON.stringify(ledger.spends.map((s) => s.authorization_id)),
  );
}

const failed = results.filter((r2) => !r2.pass);
for (const r2 of results) console.log(`${r2.pass ? "PASS" : "FAIL"} ${r2.name}${r2.pass ? "" : ` — ${r2.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
