#!/usr/bin/env node
/**
 * Exact WF61/WF40 CLI proofs for V4_RT25_CANONICAL_CLI_AND_MIXED_ROUTE_FIX_V1.
 *
 * Unmodified tracked runtime modules/configuration are copied into a fresh
 * temporary repository layout. Its real DEFAULT_INGEST_DIR is populated only
 * by the real Codex/GLM ingest modules. No quota flag, injected quota state,
 * injected decision, network request, or actual execution is used by the CLI
 * proofs. Controlled numbers below are test observations, not account values.
 */
import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { resolveAjvModules } from "../../tools/validate-execution-packet-v1.mjs";
import { prepareCycle } from "../../tools/run-litellm-primary-cycle.mjs";
import { runN8nExecutionRoutingBridge } from "../../tools/n8n-v4-execution-routing-bridge-v1.mjs";
import { buildRouteQuotaProvenance } from "../../tools/rt25-route-quota-provenance-v1.mjs";
import {
  createExecutionState,
  handleExecutionRequest,
  validateRouteQuotaProvenanceForEndpoint,
} from "../../tools/serve-v4-windows-local-execution-endpoint-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PROFILE = "configs/litellm/control-plane-primary-remote.gateway-profile.json";
const POOLS = ["chatgpt_codex_subscription", "glm_coding_plan"];
const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (error) {
    results.push({ name, pass: false, detail: String(error.message).slice(0, 500) });
  }
}
const readJson = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64");

// Copy only paths enumerated by Git: pre-existing untracked files cannot enter
// this sandbox. Current working-tree bytes retain the production CLI changes.
const sandbox = mkdtempSync(join(tmpdir(), "rt25-canonical-cli-"));
const tracked = spawnSync("git", ["ls-files", "-z", "--", "tools", "configs/resources", PROFILE, "docs/contracts"], {
  cwd: ROOT, encoding: "utf8", windowsHide: true,
});
assert.equal(tracked.status, 0, tracked.stderr || tracked.error?.message);
for (const path of tracked.stdout.split("\0").filter(Boolean)) {
  if (!path.endsWith(".mjs") && !path.endsWith(".json")) continue;
  const destination = join(sandbox, path);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(ROOT, path), destination);
}
const ingestDir = join(sandbox, "configs/runtime/quota-ingest");
const { ajv2020Path } = resolveAjvModules();
const cliEnv = {
  ...process.env,
  CONTROL_PLANE_AJV_NODE_MODULES: process.env.CONTROL_PLANE_AJV_NODE_MODULES || resolve(dirname(ajv2020Path), "../.."),
};
const runtime = (name) => import(pathToFileURL(join(sandbox, "tools", name)).href);
const { composeCanonicalQuotaState, DEFAULT_INGEST_DIR } = await runtime("rt25-canonical-quota-state-v1.mjs");
const { runIngestPass } = await runtime("rt25-quota-ingest-codex-v1.mjs");
const { runGlmIngestPass } = await runtime("rt25-quota-ingest-glm-v1.mjs");

const consumer = readJson(join(ROOT, "tests/litellm-primary-cycle/fixtures/consumer-codex.json"));
const routing = readJson(join(ROOT, "tests/litellm-primary-cycle/fixtures/routing-codex-gate-only.json"));
const profile = readJson(join(sandbox, PROFILE));
const cycle = {
  schema: "n8n-litellm-primary-cycle-result-v1",
  ok: true,
  classification: "PASS",
  task_id: "RT25-EXACT-CLI",
  packet: { packet_id: "PK-RT25-EXACT-CLI", goal: "offline CLI wiring proof" },
  policy: { decision: "PROCEED" },
  cursor_dispatch_allowed: true,
};
const routeRequest = {
  schema_version: "execution-route-request-v1",
  request_id: "RR-RT25-EXACT-CLI",
  technical_requirements: ["filesystem", "code_edit"],
  risk_level: "low",
};
function statusDocument(localAvailable = false) {
  const status = readJson(join(sandbox, "configs/resources/status.fail-closed.json"));
  status.generated_at = new Date().toISOString();
  for (const [id, entry] of Object.entries(status.resources)) {
    entry.available = id === "cursor" || id === "glm" || (localAvailable && ["opencode", "qwen_local"].includes(id));
    entry.cost_mode = ["opencode", "qwen_local"].includes(id) ? "free" : "included";
    entry.location = ["opencode", "qwen_local"].includes(id) ? "local" : "cloud";
    entry.source = "manual";
    entry.updated_at = status.generated_at;
  }
  // GLM is structurally available with unknown legacy quota and a zero reserve.
  // Only canonical pool admission can prevent a legacy healthy-looking route.
  return status;
}
function executeCli(file, args) {
  const child = spawnSync(process.execPath, [join(sandbox, "tools", file), ...args], {
    cwd: sandbox, env: cliEnv, encoding: "utf8", windowsHide: true, timeout: 30_000,
  });
  assert.equal(child.error, undefined, child.error?.message);
  assert.equal(child.signal, null, child.stderr);
  const lines = child.stdout.trim().split(/\r?\n/);
  assert.equal(lines.length, 1, `CLI must emit exactly one JSON record: ${child.stdout}`);
  return { code: child.status, output: JSON.parse(lines[0]) };
}
function prepareCli(extra = []) {
  return executeCli("run-litellm-primary-cycle.mjs", [
    "prepare", "--consumer-b64", b64(consumer), "--routing-b64", b64(routing), "--profile", PROFILE,
    ...extra,
  ]);
}
function bridgeCli(localAvailable = false) {
  return executeCli("n8n-v4-execution-routing-bridge-v1.mjs", [
    "--cycle-result-b64", b64(cycle), "--route-request-b64", b64(routeRequest), "--status-b64", b64(statusDocument(localAvailable)),
  ]);
}
function assertClosedBridge(bridge) {
  assert.equal(bridge.dispatch_prepared, false);
  assert.equal(bridge.execution_performed, false);
}
function assertNoEvidencePrepare(cli, evaluation) {
  assert.equal(cli.code, 1);
  assert.equal(cli.output.ok, false);
  assert.equal(cli.output.request_envelope, null);
  const selection = cli.output.planner_selection;
  assert.equal(selection?.quota_pool_state_consumed, true);
  assert.equal(selection.quota_pool_refinements.codex, `QUOTA_POOL_${evaluation}`);
  assert.notEqual(selection.planner_states.codex, "HEALTHY");
}
function assertNoEvidenceBridge(cli, evaluation) {
  assert.equal(cli.code, 0);
  assert.equal(cli.output.ok, false);
  assert.equal(cli.output.classification, "NO_ROUTE");
  assert.equal(cli.output.route_id, null);
  assert.equal(cli.output.quota_decision_consumed, true);
  assert.equal(cli.output.quota_decision_provenance.pool_evaluations.glm_coding_plan.evaluation, evaluation);
  assert.ok(cli.output.execution_route_result.reason_codes.includes("QUOTA_POOL_BLOCKED"));
  assertClosedBridge(cli.output);
}

check("sandbox-default-lane-is-isolated-and-absent", () => {
  assert.equal(DEFAULT_INGEST_DIR, ingestDir);
  assert.notEqual(DEFAULT_INGEST_DIR, join(ROOT, "configs/runtime/quota-ingest"));
  assert.equal(existsSync(ingestDir), false);
});

// A/B/C: the exact existing commands receive no quota-related option at all.
for (const lane of ["absent", "empty"]) {
  if (lane === "empty") mkdirSync(ingestDir, { recursive: true });
  const canonical = await composeCanonicalQuotaState();
  check(`${lane}-default-producer-fails-closed`, () => {
    assert.equal(canonical.ok, true);
    assert.equal(canonical.source_paths.ingest_dir, ingestDir);
    assert.deepEqual(canonical.source_paths.ingest_files, []);
    for (const poolId of POOLS) {
      assert.equal(canonical.joined.pools[poolId].state, "unknown");
      assert.equal(canonical.joined.pools[poolId].evaluation, "CONSERVE_UNKNOWN_MISSING");
    }
  });
  const prepare = prepareCli();
  check(`A-C-WF61-exact-no-quota-flag-${lane}`, () => assertNoEvidencePrepare(prepare, "CONSERVE_UNKNOWN_MISSING"));
  const bridge = bridgeCli();
  check(`B-C-WF40-exact-three-inputs-${lane}`, () => assertNoEvidenceBridge(bridge, "CONSERVE_UNKNOWN_MISSING"));
}

async function ingestControlledEvidence(atMs) {
  const snapshots = join(sandbox, "test-snapshots");
  mkdirSync(snapshots, { recursive: true });
  const snapshot = (remaining, window_type) => ({
    source: "dashboard_snapshot",
    observed_at: new Date(atMs - 60_000).toISOString(),
    windows: [{
      window_type,
      remaining: { value: remaining, unit: "percent" },
      reset_at: new Date(atMs + 3_600_000).toISOString(),
    }],
  });
  const codexPath = join(snapshots, "codex.json");
  const glmPath = join(snapshots, "glm.json");
  writeFileSync(codexPath, `${JSON.stringify(snapshot(62, "rolling"))}\n`);
  writeFileSync(glmPath, `${JSON.stringify(snapshot(41, "monthly"))}\n`);
  const codex = runIngestPass({ snapshotPath: codexPath, outDir: ingestDir, nowMs: atMs });
  const glm = await runGlmIngestPass({ snapshotPath: glmPath, outDir: ingestDir, nowMs: atMs, mode: "manual" });
  return { codex: codex[0].decision, glm };
}

// Ingest observations valid at collection time, then consume them more than
// five minutes later through the real default producer. Do not edit envelopes.
const staleIngest = await ingestControlledEvidence(Date.now() - 3_600_000);
check("stale-evidence-was-produced-by-real-ingesters", () => {
  for (const decision of Object.values(staleIngest)) {
    assert.equal(decision.classification, "INGEST_PASS_QUOTA_PROJECTED");
    assert.equal(decision.ok, true);
  }
});
const staleCanonical = await composeCanonicalQuotaState();
check("stale-default-lane-is-rejected-by-real-composer-and-join", () => {
  assert.equal(staleCanonical.ok, true);
  assert.equal(staleCanonical.source_paths.ingest_files.length, 2);
  for (const poolId of POOLS) {
    assert.equal(staleCanonical.joined.pools[poolId].state, "unknown");
    assert.equal(staleCanonical.joined.pools[poolId].evaluation, "CONSERVE_UNKNOWN_STALE");
  }
});
const stalePrepare = prepareCli();
check("A-C-WF61-exact-no-quota-flag-stale", () => assertNoEvidencePrepare(stalePrepare, "CONSERVE_UNKNOWN_STALE"));
const staleBridge = bridgeCli();
check("B-C-WF40-exact-three-inputs-stale", () => assertNoEvidenceBridge(staleBridge, "CONSERVE_UNKNOWN_STALE"));
const staleMixed = bridgeCli(true);
check("B-C-WF40-stale-commercial-narrowed-to-local-without-exception", () => {
  assert.equal(staleMixed.output.ok, true);
  assert.equal(staleMixed.output.route_id, "opencode+qwen_local");
  assert.ok(staleMixed.output.reason_codes.includes("QUOTA_POOL_NARROWED"));
  assert.equal(staleMixed.output.execution_route_result.quota_decision.selected.route_id, staleMixed.output.route_id);
  assertClosedBridge(staleMixed.output);
});

const freshIngest = await ingestControlledEvidence(Date.now());
check("valid-controlled-evidence-enters-real-default-ingest-lane", () => {
  for (const decision of Object.values(freshIngest)) {
    assert.equal(decision.ok, true);
    assert.equal(decision.classification, "INGEST_PASS_QUOTA_PROJECTED");
  }
});
const freshCanonical = await composeCanonicalQuotaState();
check("valid-default-producer-preserves-controlled-values", () => {
  assert.equal(freshCanonical.ok, true);
  assert.equal(freshCanonical.joined.pools.chatgpt_codex_subscription.remaining_percent, 62);
  assert.equal(freshCanonical.joined.pools.glm_coding_plan.remaining_percent, 41);
  for (const poolId of POOLS) assert.equal(freshCanonical.joined.pools[poolId].evaluation, "POOL_HEALTHY");
});
const freshPrepare = prepareCli();
check("A-D-WF61-exact-no-quota-flag-fresh", () => {
  assert.equal(freshPrepare.code, 0);
  assert.equal(freshPrepare.output.ok, true);
  assert.equal(freshPrepare.output.selected_planner, "codex");
  assert.equal(freshPrepare.output.quota_state_consumed, true);
  assert.equal(freshPrepare.output.request_envelope.path, "/v1/responses");
  assert.equal(freshPrepare.output.quota_pool_refinements.codex, undefined);
});
const freshCommercial = bridgeCli();
check("B-D-WF40-exact-three-inputs-fresh-commercial", () => {
  // Canonical dispatch law: remote routes have NO registered adapter (default
  // registry registers opencode+qwen_local only — proven by bridge suite #15),
  // so a routed cursor+glm is correctly ADAPTER_NOT_REGISTERED (fail-closed,
  // dispatch never prepared). The quota-aware routing evidence still flows:
  // the router-produced envelope is consumed and carries the healthy pool.
  assert.equal(freshCommercial.code, 0);
  assert.equal(freshCommercial.output.ok, false);
  assert.equal(freshCommercial.output.classification, "ADAPTER_NOT_REGISTERED");
  assert.equal(freshCommercial.output.route_id, "cursor+glm");
  assert.equal(freshCommercial.output.quota_decision_consumed, true);
  assert.equal(freshCommercial.output.quota_decision_provenance.selected_quota_pool_id, "glm_coding_plan");
  assert.equal(freshCommercial.output.quota_decision_provenance.selected_route, "cursor+glm");
  assert.equal(freshCommercial.output.quota_decision_provenance.pool_evaluations.glm_coding_plan.evaluation, "POOL_HEALTHY");
  assertClosedBridge(freshCommercial.output);
});
const freshLocal = bridgeCli(true);
const routerDecision = freshLocal.output.execution_route_result?.quota_decision;
const endpointProvenance = buildRouteQuotaProvenance(routerDecision);
check("D-router-envelope-propagates-through-real-bridge-CLI", () => {
  assert.equal(freshLocal.output.ok, true);
  assert.equal(freshLocal.output.route_id, "opencode+qwen_local");
  assert.equal(routerDecision.schema_version, "v4-rt25-execution-quota-aware-decision-v1");
  assert.equal(routerDecision.status, "ROUTE_SELECTED");
  assert.equal(routerDecision.selected.route_id, freshLocal.output.route_id);
  assert.equal(freshLocal.output.quota_decision_consumed, true);
  assert.ok(freshLocal.output.reason_codes.includes("QUOTA_DECISION_PRODUCED_BY_CANONICAL_ROUTER"));
  assert.equal(endpointProvenance.selected_route, freshLocal.output.quota_decision_provenance.selected_route);
  assert.equal(endpointProvenance.model, freshLocal.output.quota_decision_provenance.selected_model);
  assert.equal(endpointProvenance.quota_pool_id, freshLocal.output.quota_decision_provenance.selected_quota_pool_id);
  assertClosedBridge(freshLocal.output);
});

const runtimeAuthorization = {
  schema_version: "operator-runtime-authorization-v1",
  authorization_id: "AUTH-CLI-PROOF-NOT-ISSUED",
  authorization_state: "ACTIVE",
  route_id: "opencode+qwen_local",
  scope: {
    scope_version: "qwen-execution-scope-v3",
    execution_harness: "opencode", model: "qwen_local", profile_id: "qwen38-opus-q3-agent-24k",
    role: "FAST_AGENT", canonical_endpoint: "http://127.0.0.1:8080",
    single_generation_guard_required: true, max_opencode_executions: 1, max_qwen_generation_calls: 1,
    retry: 0, fallback: 0,
  },
};
check("D-unmodified-bridge-router-provenance-passes-real-Windows-validator", () => {
  assert.equal(endpointProvenance.present, true);
  assert.equal(endpointProvenance.model, "qwen_local");
  assert.equal(endpointProvenance.quota_pool_id, null);
  const validation = validateRouteQuotaProvenanceForEndpoint(endpointProvenance, runtimeAuthorization);
  assert.equal(validation.ok, true);
  assert.equal(validation.present, true);
  assert.deepEqual(validation.provenance, endpointProvenance);
});
let adapterCalls = 0;
const endpointOptions = {
  state: createExecutionState(),
  getOccupancy: async () => { throw new Error("UNAUTHORIZED_OCCUPANCY_CALL"); },
  runOpenCode: async () => { adapterCalls += 1; throw new Error("UNAUTHORIZED_GENERATION"); },
};
const endpointBody = (executionId, provenance) => ({
  schema_version: "v4-windows-local-execution-endpoint-request-v1",
  execution_id: executionId,
  runtime_authorization: runtimeAuthorization,
  message: "offline exact CLI provenance proof; no issued authorization",
  route_quota_provenance: provenance,
});
const closed = await handleExecutionRequest(endpointBody("EX-CLI-PROOF-CLOSED", endpointProvenance), endpointOptions);
check("D-real-Windows-handler-validates-provenance-and-keeps-authorization-closed", () => {
  assert.equal(closed.body.classification, "AUTHORIZATION_REJECTED");
  assert.ok(closed.body.reason_codes.includes("AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE"));
  assert.equal(adapterCalls, 0);
});
const remoteProvenance = buildRouteQuotaProvenance(freshCommercial.output.execution_route_result?.quota_decision);
const mismatch = await handleExecutionRequest(endpointBody("EX-CLI-PROOF-REMOTE", remoteProvenance), endpointOptions);
check("D-real-Windows-handler-rejects-unaltered-commercial-route-for-local-scope", () => {
  assert.equal(remoteProvenance.present, true);
  assert.equal(remoteProvenance.model, "glm");
  assert.equal(mismatch.body.classification, "ROUTE_QUOTA_PROVENANCE_REJECTED");
  assert.ok(mismatch.body.reason_codes.includes("ROUTE_QUOTA_PROVENANCE_MODEL_MISMATCH"));
  assert.equal(adapterCalls, 0);
});

for (const invalid of [null, false, "legacy", []]) {
  const cli = prepareCli(["--quota-state-options-b64", b64(invalid)]);
  check(`explicit-invalid-quota-options-${JSON.stringify(invalid)}-cannot-bypass-CLI`, () => {
    assert.equal(cli.code, 1);
    assert.equal(cli.output.ok, false);
    assert.equal(cli.output.classification, "INPUT_INVALID");
    assert.equal(cli.output.request_envelope, null);
  });
  const imported = await prepareCycle({ consumerInput: consumer, routingInput: routing, gatewayProfile: profile, quotaStateOptions: invalid });
  check(`explicit-invalid-quota-options-${JSON.stringify(invalid)}-cannot-bypass-library`, () => {
    assert.equal(imported.ok, false);
    assert.equal(imported.classification, "QUOTA_STATE_COMPOSITION_FAILED");
  });
}
const explicitEmpty = join(sandbox, "explicit-empty-lane");
mkdirSync(explicitEmpty);
const explicit = prepareCli(["--quota-state-options-b64", b64({ ingestDir: explicitEmpty })]);
check("explicit-valid-options-preserved-over-healthy-default-lane", () => assertNoEvidencePrepare(explicit, "CONSERVE_UNKNOWN_MISSING"));

const legacyPrepare = await prepareCycle({ consumerInput: consumer, routingInput: routing, gatewayProfile: profile });
check("explicit-library-legacy-compatibility-preserved", () => {
  assert.equal(legacyPrepare.ok, true);
  assert.equal(legacyPrepare.quota_state_consumed, false);
});
const legacyBridge = await runN8nExecutionRoutingBridge({ cycle_result: cycle, route_request: routeRequest, status: statusDocument() });
check("bridge-library-legacy-compatibility-preserved", () => {
  // Imported callers remain opt-in (no quotaStateOptions): routing law is the
  // legacy v1 one (no quota stage) and the envelope is NOT produced. The
  // routed remote pair correctly stops at ADAPTER_NOT_REGISTERED (canonical
  // default registry has no remote adapters — dispatch never prepared).
  assert.equal(legacyBridge.ok, false);
  assert.equal(legacyBridge.classification, "ADAPTER_NOT_REGISTERED");
  assert.equal(legacyBridge.route_id, "cursor+glm");
  assert.equal(legacyBridge.quota_decision_consumed, false);
  assertClosedBridge(legacyBridge);
});

for (const result of results) console.log(`${result.pass ? "PASS" : "FAIL"} ${result.name}${result.pass ? "" : ` — ${result.detail}`}`);
const failed = results.filter((result) => !result.pass).length;
console.log(JSON.stringify({ ok: failed === 0, passed: results.length - failed, failed, total: results.length }));
process.exitCode = failed ? 1 : 0;
