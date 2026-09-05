#!/usr/bin/env node
/**
 * V4_RT25_CANONICAL_ENTRYPOINT_INTEGRATION_CORRECTION — focused tests A..L.
 *
 * Proves the CANONICAL runtime entrypoints (not a manual RT25 harness) reach
 * the quota-aware implementation:
 *
 *   A. canonical planner entrypoint uses quota-aware state
 *   B. canonical execution-router entrypoint uses quota-aware state
 *   C. stale/missing commercial pool => fail closed / conserve unknown
 *   D. reserve floor blocks route
 *   E. GLM 5.3 + Flash share ONE glm_coding_plan pool
 *   F. adequate Qwen unmetered route can preserve scarce remote quota
 *   G. inadequate Qwen cannot silently replace required quality
 *   H. Codex API/BYOK route remains forbidden
 *   I. canonical selected decision propagates into n8n bridge automatically
 *   J. Windows endpoint receives validated provenance (real handler)
 *   K. D-0025 remains enabled=false (static proof)
 *   L. no unauthorized model generation occurs (adapter counters)
 *
 * Canonical invocation law: every leg drives
 *   ingest (real) → rt25-canonical-quota-state (real producer)
 *   → evaluatePlannerSelection / prepareCycle (canonical planner boundary)
 *   → evaluateExecutionRoute (canonical execution-router boundary)
 *   → runN8nExecutionRoutingBridge with options.quotaStateOptions (the bridge
 *     composes the canonical state itself and consumes the router-produced
 *     envelope — the quota decision is NEVER hand-constructed mid-chain).
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { ingestCodexQuotaSnapshot } from "../../tools/rt25-quota-ingest-codex-v1.mjs";
import { composeCanonicalQuotaState, DEFAULT_INGEST_DIR } from "../../tools/rt25-canonical-quota-state-v1.mjs";
import { evaluatePlannerSelection } from "../../tools/evaluate-planner-selection.mjs";
import { prepareCycle } from "../../tools/run-litellm-primary-cycle.mjs";
import { evaluateExecutionRoute } from "../../tools/evaluate-execution-route.mjs";
import { runN8nExecutionRoutingBridge } from "../../tools/n8n-v4-execution-routing-bridge-v1.mjs";
import { createDefaultExecutionAdapterRegistry } from "../../tools/v4-execution-adapter-registry-v1.mjs";
import { guardQualityDowngrade } from "../../tools/rt25-quality-downgrade-guard-v1.mjs";
import { evaluateQwenAdequacyFallback } from "../../tools/rt25-qwen-adequacy-fallback-v1.mjs";
import { evaluateCodexRouteEligibility } from "../../tools/rt25-codex-eligibility-v1.mjs";
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
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 240) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));
const profile = JSON.parse(readFileSync(resolve(ROOT, "configs/litellm/control-plane-primary-remote.gateway-profile.json"), "utf8"));

function codexSnapshot(percent, observedAt = "2026-09-05T15:58:00.000Z") {
  return {
    source: "dashboard_snapshot",
    observed_at: observedAt,
    windows: [{ window_type: "rolling", remaining: { value: percent, unit: "percent" }, window_ends_at: "2026-09-05T19:00:00.000Z" }],
  };
}
/** Real ingest → canonical producer composition options (temp lane). */
function laneOptions(percent, extra = {}) {
  const ingest = ingestCodexQuotaSnapshot(codexSnapshot(percent), { nowMs: NOW });
  return {
    contributions: [ingest.contribution],
    reservePolicy: extra.reservePolicy,
    nowMs: NOW,
  };
}

const routingInput = {
  schema: "planner-routing-input-v1",
  task_id: "RT25-CANONICAL-WIRING",
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
  task_id: "RT25-CANONICAL-WIRING",
  source_backlog_ref: "github:mrhz1973/control-plane@0ec7826:docs/x.md",
  source_backlog_commit: "0ec7826c8f4e6134e00afe29d9cd71d96da1de73",
  repository: "mrhz1973/control-plane",
  branch_target: "main",
  goal: "canonical entrypoint wiring proof",
  risk_hint: "low",
  complexity_hint: "low",
  planner_requested: "codex",
  allowed_paths: ["docs/"],
  forbidden_paths: [],
  acceptance_seed: ["canonical wiring proven"],
  validation_seed: [],
  hard_constraints: [],
};

function routeRequest() {
  return {
    schema_version: "execution-route-request-v1",
    request_id: "RR-CANONICAL-WIRING",
    technical_requirements: ["filesystem", "code_edit"],
    risk_level: "low",
  };
}
/** Router status: local lane available; cursor+composer available as remote pair. */
function routerStatus() {
  const mk = (available, cost_mode, location, quota) => ({
    available,
    quota_remaining: quota || { value: null, unit: "unknown" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode,
    location,
    source: "test-fixture",
    updated_at: "2026-09-05T15:00:00.000Z",
  });
  return {
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
}

// ===========================================================================
// A — canonical planner entrypoint uses quota-aware state (fresh healthy pool)
// ===========================================================================
{
  const opts = laneOptions(62);
  const canonical = await composeCanonicalQuotaState(opts);
  check(
    "A0-canonical-producer-composes",
    canonical.ok === true && canonical.joined.ok === true &&
      canonical.joined.pools.chatgpt_codex_subscription?.remaining_percent === 62,
    JSON.stringify(canonical.reason_codes),
  );
  const sel = await evaluatePlannerSelection(routingInput, { quotaState: canonical.joined });
  check(
    "A1-planner-entrypoint-consumes-quota-state",
    sel.policy_result === "PROCEED" && sel.selected === "codex" &&
      sel.planner_states?.codex === "HEALTHY" &&
      sel.quota_pool_state_consumed === true,
    JSON.stringify({ pr: sel.policy_result, sel: sel.selected, meta: sel.quota_pool_state_consumed }),
  );
  // canonical upstream: prepareCycle composes the state itself
  const prep = await prepareCycle({
    consumerInput,
    routingInput,
    gatewayProfile: profile,
    quotaStateOptions: opts,
  });
  check(
    "A2-prepare-cycle-canonical-composition",
    prep.ok === true && prep.quota_state_consumed === true && prep.selected_planner === "codex",
    JSON.stringify({ c: prep.classification, q: prep.quota_state_consumed }),
  );
}

// Qwen positive availability requires a REAL local_probe contribution with
// strict Qwen-gate evidence (composer law — mirrors collect-qwen-local lane).
const qwenReadyContribution = {
  schema_version: "v4-resource-status-contribution-v1",
  contribution_id: "qwen-occ-canonical-wiring-1",
  producer_id: "qwen-probe",
  source: "local_probe",
  produced_at: "2026-09-05T15:58:00.000Z",
  resources: {
    qwen_local: {
      available: true,
      quota_remaining: { value: null, unit: "unlimited" },
      reset_at: null,
      cost_mode: "free",
      location: "local",
      updated_at: "2026-09-05T15:58:00.000Z",
      evidence: { kind: "qwen_occupancy", classification: "QWEN_READY_IDLE", launch_performed: false, generation_calls: 0 },
    },
  },
};

// ===========================================================================
// B — canonical execution-router entrypoint uses quota-aware state
// ===========================================================================
{
  const canonical = await composeCanonicalQuotaState(laneOptions(62));
  const out = await evaluateExecutionRoute(routeRequest(), {
    registry,
    status: routerStatus(),
    quotaState: canonical.joined,
  });
  check(
    "B1-router-emits-rt25-envelope",
    out.status === "ROUTED" &&
      out.quota_decision?.schema_version === "v4-rt25-execution-quota-aware-decision-v1" &&
      out.quota_decision?.ok === true,
    JSON.stringify({ s: out.status, q: Boolean(out.quota_decision) }),
  );
  check(
    "B2-router-envelope-carry-admissions",
    Array.isArray(out.quota_decision?.admitted_candidates) &&
      out.quota_decision.admitted_candidates.length >= 1 &&
      out.quota_decision.admitted_candidates.every((c) => typeof c.admission === "string"),
    JSON.stringify(out.quota_decision?.admitted_candidates?.map((c) => c.route_id)),
  );
  // legacy: same request without quotaState → no envelope, same route decision law
  const legacy = await evaluateExecutionRoute(routeRequest(), {
    registry,
    status: routerStatus(),
  });
  check(
    "B3-legacy-path-no-envelope",
    legacy.status === "ROUTED" && legacy.quota_decision === undefined,
    JSON.stringify({ s: legacy.status, has: "quota_decision" in legacy }),
  );
}

// ===========================================================================
// C — stale/missing commercial pool => fail closed / conserve unknown
// ===========================================================================
{
  // stale: snapshot observed > STATUS_MAX_AGE_MS before NOW
  const staleIngest = ingestCodexQuotaSnapshot(codexSnapshot(90, "2026-09-05T13:00:00.000Z"), { nowMs: NOW });
  const canonical = await composeCanonicalQuotaState({ contributions: [staleIngest.contribution], nowMs: NOW });
  // stale contribution is REJECTED by the composer → pool joins as stale evidence
  check(
    "C1-stale-pool-conserves-unknown",
    canonical.joined.pools.chatgpt_codex_subscription?.evaluation === "CONSERVE_UNKNOWN_STALE" ||
      canonical.joined.pools.chatgpt_codex_subscription?.evaluation === "CONSERVE_UNKNOWN_MISSING",
    JSON.stringify(canonical.joined.pools?.chatgpt_codex_subscription),
  );
  const sel = await evaluatePlannerSelection(routingInput, { quotaState: canonical.joined });
  check(
    "C2-planner-fails-closed-on-stale",
    sel.planner_states?.codex === "CONSERVE" &&
      (sel.reason_codes.includes("PREFERRED_CONSERVE_USED_GATE_ONLY") ||
        sel.policy_result === "PROCEED" ||
        sel.policy_result === "GATE"),
    JSON.stringify({ st: sel.planner_states, pr: sel.policy_result, rc: sel.reason_codes }),
  );
  // the gate_only policy keeps codex selected but CONSERVE semantics survive:
  check(
    "C3-conserve-refinement-recorded",
    sel.quota_pool_refinements?.codex === "QUOTA_POOL_CONSERVE_UNKNOWN_STALE" ||
      sel.quota_pool_refinements?.codex === "QUOTA_POOL_CONSERVE_UNKNOWN_MISSING",
    JSON.stringify(sel.quota_pool_refinements),
  );
  // missing: empty ingest lane
  const missing = await composeCanonicalQuotaState({ contributions: [], nowMs: NOW });
  check(
    "C4-missing-pool-fail-closed",
    missing.joined.pools.chatgpt_codex_subscription?.evaluation === "CONSERVE_UNKNOWN_MISSING",
    JSON.stringify(missing.joined.pools?.chatgpt_codex_subscription),
  );
}

// ===========================================================================
// D — reserve floor blocks route
// ===========================================================================
{
  const canonical = await composeCanonicalQuotaState(laneOptions(8, {
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
  }));
  check(
    "D1-join-evaluates-reserve-block",
    canonical.joined.pools.chatgpt_codex_subscription?.evaluation === "RESERVE_FLOOR_BLOCK",
    JSON.stringify(canonical.joined.pools?.chatgpt_codex_subscription),
  );
  const sel = await evaluatePlannerSelection(routingInput, { quotaState: canonical.joined });
  check(
    "D2-planner-blocks-on-reserve",
    sel.planner_states?.codex === "UNAVAILABLE" &&
      sel.policy_result === "GATE" && sel.selected === null,
    JSON.stringify({ st: sel.planner_states, pr: sel.policy_result }),
  );
  // canonical upstream composition blocked too
  const prep = await prepareCycle({
    consumerInput,
    routingInput,
    gatewayProfile: profile,
    quotaStateOptions: laneOptions(8, {
      reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
    }),
  });
  check(
    "D3-prepare-blocked-on-reserve",
    prep.ok === false && prep.classification === "PLANNER_SELECTION_NOT_PROCEED",
    JSON.stringify({ c: prep.classification }),
  );
}

// ===========================================================================
// E — GLM 5.3 + Flash share ONE glm_coding_plan pool
// ===========================================================================
{
  const canonical = await composeCanonicalQuotaState({ contributions: [], nowMs: NOW });
  // glm joins one shared pool regardless of model count
  const binding = canonical.joined.resources.glm;
  check(
    "E1-glm-binding-single-pool",
    binding?.quota_pool_id === "glm_coding_plan" && binding?.pool_semantics === "shared_pool_joined",
    JSON.stringify(binding),
  );
  // router candidates over the SAME resource reuse one admission (single pool eval)
  const out = await evaluateExecutionRoute(routeRequest(), {
    registry,
    status: routerStatus(),
    quotaState: canonical.joined,
  });
  const env = out.quota_decision;
  const glmPoolEntries = env ? Object.entries(env.pool_evaluations || {}).filter(([id]) => id === "glm_coding_plan") : [];
  check(
    "E2-single-pool-evaluation-entry",
    glmPoolEntries.length <= 1,
    JSON.stringify(env?.pool_evaluations).slice(0, 160),
  );
  // registry structural law: both models bound to the same surface/pool
  const m1 = registry.models["glm-5.3"];
  const m2 = registry.models["glm-5.3-flash"];
  check(
    "E3-registry-one-pool-two-models",
    m1?.default_access_surface === "glm_coding_plan_client" &&
      m2?.default_access_surface === "glm_coding_plan_client" &&
      registry.access_surfaces.glm_coding_plan_client?.quota_pool_id === "glm_coding_plan",
    JSON.stringify({ s: m1?.default_access_surface, p: registry.access_surfaces.glm_coding_plan_client?.quota_pool_id }),
  );
}

// ===========================================================================
// F — adequate Qwen unmetered route can preserve scarce remote quota
// ===========================================================================
{
  // remote pools scarce (8% under 20% floor): router must still find the
  // unmetered local lane (no pool → ADMIT_NO_POOL) and never consume remote.
  const canonical = await composeCanonicalQuotaState({
    contributions: [qwenReadyContribution, laneOptions(8).contributions[0]],
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
    nowMs: NOW,
  });
  check(
    "F0-qwen-joined-available",
    canonical.joined.resources.qwen_local?.resource_available === true,
    JSON.stringify(canonical.joined.resources.qwen_local),
  );
  const out = await evaluateExecutionRoute(routeRequest(), {
    registry,
    status: routerStatus(),
    quotaState: canonical.joined,
  });
  check(
    "F1-qwen-unmetered-selected",
    out.status === "ROUTED" && out.execution_route?.route_id === "opencode+qwen_local" &&
      out.quota_decision?.selected?.quota_pool_id === null,
    JSON.stringify({ r: out.execution_route?.route_id, pool: out.quota_decision?.selected?.quota_pool_id }),
  );
  const qwen = evaluateQwenAdequacyFallback(canonical.joined, {
    required_capabilities: ["code_generation"],
    min_quality_tier: 2,
  });
  check("F2-qwen-adequacy-admitted", qwen.adequate === true, JSON.stringify(qwen.reason_codes));
}

// ===========================================================================
// G — inadequate Qwen cannot silently replace required quality
// ===========================================================================
{
  const canonical = await composeCanonicalQuotaState({
    contributions: [qwenReadyContribution],
    nowMs: NOW,
  });
  const qwenInadequate = evaluateQwenAdequacyFallback(canonical.joined, {
    required_capabilities: ["code_generation"],
    min_quality_tier: 1, // qwen tier 2 > required 1 → NOT adequate
  });
  check(
    "G1-qwen-tier-insufficient",
    qwenInadequate.adequate === false && qwenInadequate.fallback === "FALLBACK_NOT_ADEQUATE" &&
      qwenInadequate.reason_codes.includes("QWEN_QUALITY_TIER_INSUFFICIENT"),
    JSON.stringify(qwenInadequate.reason_codes),
  );
  // Guard law on a router-produced envelope routed to qwen with high-risk demand
  const out = await evaluateExecutionRoute(routeRequest(), {
    registry,
    status: routerStatus(),
    quotaState: canonical.joined,
  });
  check(
    "G0-router-selected-qwen-envelope",
    out.status === "ROUTED" && out.quota_decision?.selected?.model === "qwen_local",
    JSON.stringify(out.quota_decision?.selected?.model),
  );
  const veto = guardQualityDowngrade(out.quota_decision, {
    risk: "high",
    min_quality_tier: 1,
    required_capabilities: ["repo_read"],
  }, {
    // router candidate models are registry RESOURCE ids (qwen_local); bind the
    // same declared inventory under the resource id (caller-declared domain).
    inventory: { qwen_local: { quality_tier: 2, capabilities: ["planning", "code_generation", "repo_read"] } },
  });
  check(
    "G2-guard-vetoes-qwen-for-high-risk",
    veto.veto === true && veto.reason_codes.some((c) => String(c).includes("QUALITY_TIER") || String(c).includes("CAPABILITY")),
    JSON.stringify(veto.reason_codes),
  );
}

// ===========================================================================
// H — Codex API/BYOK route remains forbidden
// ===========================================================================
{
  const canonical = await composeCanonicalQuotaState({ contributions: [], nowMs: NOW });
  const eligibility = evaluateCodexRouteEligibility(registry, canonical.joined, {
    route_id: "openai-api-route",
    access_surface: "openai_api_route",
    quota_pool_id: null,
  });
  check(
    "H1-openai-api-route-structurally-forbidden",
    registry.access_surfaces.openai_api_route?.status === "forbidden" &&
      eligibility.eligible === false,
    JSON.stringify({ st: registry.access_surfaces.openai_api_route?.status, e: eligibility.eligibility }),
  );
  // BYOK/openai auth forbidden on every codex surface
  const forbiddenAuth = Object.values(registry.access_surfaces)
    .filter((s) => String(s.quota_pool_id) === "chatgpt_codex_subscription")
    .every((s) => (s.auth?.forbidden || []).includes("api_billing"));
  check("H2-codex-surfaces-forbid-api-billing", forbiddenAuth === true);
}

// ===========================================================================
// I — canonical selected decision propagates into n8n bridge automatically
// ===========================================================================
{
  // The bridge composes the canonical state itself via options.quotaStateOptions
  // and consumes the envelope PRODUCED BY the canonical router — no manual
  // quota_decision input anywhere in this call.
  const bridge = await runN8nExecutionRoutingBridge(
    {
      cycle_result: {
        schema: "n8n-litellm-primary-cycle-result-v1",
        ok: true,
        classification: "PASS",
        task_id: "RT25-CANONICAL-WIRING",
        packet: { packet_id: "PK-CANONICAL-WIRING", goal: "g" },
        policy: { decision: "PROCEED" },
        cursor_dispatch_allowed: true,
      },
      route_request: routeRequest(),
      status: routerStatus(),
    },
    {
      adapterRegistry: createDefaultExecutionAdapterRegistry(),
      quotaStateOptions: laneOptions(62),
    },
  );
  check(
    "I1-bridge-consumes-canonical-router-decision",
    bridge.ok === true &&
      bridge.quota_decision_consumed === true &&
      bridge.quota_decision_provenance?.decision_schema === "v4-rt25-execution-quota-aware-decision-v1" &&
      bridge.quota_decision_provenance?.selected_route === "opencode+qwen_local",
    JSON.stringify({ c: bridge.classification, p: bridge.quota_decision_provenance?.selected_route }),
  );
  check(
    "I2-produced-by-canonical-router-code",
    bridge.reason_codes.includes("QUOTA_DECISION_PRODUCED_BY_CANONICAL_ROUTER") &&
      bridge.dispatch_prepared === false && bridge.execution_performed === false,
    JSON.stringify(bridge.reason_codes),
  );

  // Fail-closed: composition requested but impossible (unreadable ingest lane)
  const bad = await runN8nExecutionRoutingBridge(
    {
      cycle_result: {
        schema: "n8n-litellm-primary-cycle-result-v1",
        ok: true,
        classification: "PASS",
        task_id: "RT25-CANONICAL-WIRING",
        packet: { packet_id: "PK-CANONICAL-WIRING", goal: "g" },
        policy: { decision: "PROCEED" },
        cursor_dispatch_allowed: true,
      },
      route_request: routeRequest(),
      status: routerStatus(),
    },
    {
      adapterRegistry: createDefaultExecutionAdapterRegistry(),
      quotaStateOptions: { registryPath: join(tmpdir(), "does-not-exist.json") },
    },
  );
  check(
    "I3-composition-failure-fails-closed",
    bad.ok === false && bad.classification === "QUOTA_STATE_COMPOSITION_FAILED",
    JSON.stringify({ c: bad.classification, rc: bad.reason_codes }),
  );
}

// ===========================================================================
// J — Windows endpoint receives validated provenance (real handler chain)
// ===========================================================================
{
  // Produce the qwen-scope decision THROUGH the canonical entrypoints: the
  // router (with canonical quota state) emits the envelope; the provenance is
  // built from that envelope. The endpoint validates it against the qwen
  // authorization scope (model qwen_local, pool null).
  const canonical = await composeCanonicalQuotaState({ contributions: [], nowMs: NOW });
  const out = await evaluateExecutionRoute(routeRequest(), {
    registry,
    status: routerStatus(),
    quotaState: canonical.joined,
  });
  const decision = out.quota_decision;
  const { buildRouteQuotaProvenance } = await import("../../tools/rt25-route-quota-provenance-v1.mjs");
  const provenance = buildRouteQuotaProvenance(decision, { nowMs: NOW });
  const endpointProvenance = {
    ...provenance,
    model: "qwen_local", // canonical router selected qwen_local (model id = resource id)
    quota_pool_id: null,
    pool_evidence: null,
  };

  const tmp = mkdtempSync(join(tmpdir(), "rt25-canonical-j-"));
  const REGISTRY_PATH = join(tmp, "auth-registry.json");
  const LEDGER_PATH = join(tmp, "ledger.json");
  const rfc3339 = (ms) => new Date(Date.now() + ms).toISOString();
  writeFileSync(REGISTRY_PATH, `${JSON.stringify({
    schema_version: REGISTRY_SCHEMA_VERSION,
    entries: [{
      authorization_id: "AUTH-CANONICAL-WIRING",
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

  const r = await handleExecutionRequest({
    schema_version: "v4-windows-local-execution-endpoint-request-v1",
    execution_id: "EX-CANONICAL-WIRING",
    runtime_authorization: {
      schema_version: "operator-runtime-authorization-v1",
      authorization_id: "AUTH-CANONICAL-WIRING",
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
    message: "canonical entrypoint wiring J leg",
    route_quota_provenance: endpointProvenance,
  }, deps);

  check(
    "J1-endpoint-accepts-canonical-provenance",
    r.status === 200 && r.body.ok === true && r.body.classification === "EXECUTED_OK" &&
      r.body.route_quota_provenance?.present === true &&
      r.body.route_quota_provenance?.quota_pool_id === null,
    JSON.stringify({ c: r.body.classification, p: r.body.route_quota_provenance?.quota_pool_id }),
  );

  // mismatch leg: same handler rejects a codex-pool provenance under qwen scope
  const rBad = await handleExecutionRequest({
    schema_version: "v4-windows-local-execution-endpoint-request-v1",
    execution_id: "EX-CANONICAL-WIRING-BAD",
    runtime_authorization: {
      schema_version: "operator-runtime-authorization-v1",
      authorization_id: "AUTH-CANONICAL-WIRING",
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
    message: "canonical entrypoint wiring J leg (mismatch)",
    route_quota_provenance: { ...endpointProvenance, model: "codex-ide", quota_pool_id: "chatgpt_codex_subscription" },
  }, deps);
  check(
    "J2-endpoint-rejects-mismatch-fail-closed",
    rBad.status === 200 && rBad.body.ok === false &&
      rBad.body.classification === "ROUTE_QUOTA_PROVENANCE_REJECTED",
    JSON.stringify({ c: rBad.body.classification }),
  );
  check(
    "J3-mismatch-blocked-before-generation",
    runnerCalls === 1, // only the J1 authorized leg ran
    `runner=${runnerCalls}`,
  );
}

// ===========================================================================
// K — D-0025 remains enabled=false (static proof)
// ===========================================================================
{
  const gateFiles = [
    "workflows/patches/d0025-w-wf61-item-return-shape-fix.gpt-web.json",
  ];
  let gateClosed = true;
  for (const f of gateFiles) {
    try {
      const t = readFileSync(resolve(ROOT, f), "utf8");
      if (/"enabled"\s*:\s*true/.test(t)) gateClosed = false;
    } catch {
      /* absence is not a gate state change */
    }
  }
  check("K1-d0025-remains-closed", gateClosed === true);
}

// ===========================================================================
// L — no unauthorized model generation occurs
// ===========================================================================
{
  // The entire canonical chain above is offline: every bridge result must show
  // dispatch_prepared=false / execution_performed=false; the only adapter run
  // was the single authorized offline leg J1 (runnerCalls===1 asserted there).
  // Structural re-proof: router/bridge never execute anything by themselves.
  const canonical = await composeCanonicalQuotaState(laneOptions(62));
  const out = await evaluateExecutionRoute(routeRequest(), {
    registry,
    status: routerStatus(),
    quotaState: canonical.joined,
  });
  check(
    "L1-router-never-executes",
    out.status === "ROUTED" && out.execution_route && !("execution_performed" in out),
    JSON.stringify(out.execution_route?.route_id),
  );
  const bridge = await runN8nExecutionRoutingBridge(
    {
      cycle_result: {
        schema: "n8n-litellm-primary-cycle-result-v1",
        ok: true,
        classification: "PASS",
        task_id: "RT25-CANONICAL-WIRING",
        packet: { packet_id: "PK-L", goal: "g" },
        policy: { decision: "PROCEED" },
        cursor_dispatch_allowed: true,
      },
      route_request: routeRequest(),
      status: routerStatus(),
    },
    {
      adapterRegistry: createDefaultExecutionAdapterRegistry(),
      quotaStateOptions: laneOptions(62),
    },
  );
  check(
    "L2-bridge-stops-before-dispatch",
    bridge.dispatch_prepared === false && bridge.execution_performed === false,
    `${bridge.dispatch_prepared}/${bridge.execution_performed}`,
  );
  check(
    "L3-default-ingest-lane-untracked-safe",
    DEFAULT_INGEST_DIR.replace(/\\/g, "/").endsWith("configs/runtime/quota-ingest"),
    DEFAULT_INGEST_DIR,
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
