#!/usr/bin/env node
/**
 * V4_HERMES_PHASE_F_BOUNDED_PROMOTION_IMPLEMENTATION_V1 — focused suite.
 * Deterministic, offline, no live dispatch, no Web send, no provider call.
 *
 * P01..P14 negative dual-gate proofs, P15 + P16 positive dry-run proof,
 * P17 rollback-after-candidate proof, integration-law proofs (I01..I05).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwareExecutionRoute } from "../../tools/rt25-execution-quota-aware-selector-v1.mjs";
import { collectChatgptWebObservation } from "../../tools/local-dev-resource-observatory-v1.mjs";
import { evaluateHermesPhaseEShadowRoute } from "../../tools/evaluate-hermes-phase-e-shadow-route-v1.mjs";
import {
  emptyRouteControlState, applyRouteCandidateEnable, applyRouteDisable,
  evaluateRouteControl, rollbackObservation,
} from "../../tools/v4-phase-f-route-control-v1.mjs";
import {
  evaluatePromotedRouteDispatch, executePromotedRoute,
  validatePromotedRouteAuthorization, QUALIFIED_HERMES_TRANSPORT_BINDING,
  PROMOTED_ROUTE_ID, PROMOTION_DISPATCH_SCHEMA, READY_CLASSIFICATION,
} from "../../tools/v4-phase-f-promotion-adapter-v1.mjs";
import { buildRouteObservabilityEnvelope } from "../../tools/v4-phase-f-route-observability-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-12T14:00:00.000Z");
const OBS = "2026-09-12T13:59:00.000Z";
const TASK = "V4_HERMES_PHASE_F_BOUNDED_PROMOTION_IMPLEMENTATION_V1";
const RUN = "promo-run-0001";
const results = [];
function pass(id, name) { results.push(`PASS ${id} ${name}`); }
function fail(id, name, e) { results.push(`FAIL ${id} ${name}: ${e.message}`); process.exitCode = 1; }
async function t(id, name, fn) { try { await fn(); pass(id, name); } catch (e) { fail(id, name, e); } }

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8").replace(/^\uFEFF/, ""));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8").replace(/^\uFEFF/, ""));

function contribution(resources, at = OBS, source = "manual") {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `PROMO-${Object.keys(resources).join("-")}-${at}`.replace(/[:.]/g, "-"),
    producer_id: "promotion-impl-test-input",
    source,
    produced_at: at,
    resources,
  };
}
function qwen(available = true, at = OBS) {
  return contribution({
    qwen_local: {
      available, quota_remaining: { value: null, unit: "unlimited" }, reset_at: null,
      cost_mode: "free", location: "local", updated_at: at,
      evidence: { kind: "qwen_occupancy", classification: available ? "QWEN_READY_IDLE" : "QWEN_OCCUPANCY_UNCERTAIN", launch_performed: false, generation_calls: 0 },
    },
  }, at, "local_probe");
}
async function joinedFor(contribs, at = OBS) {
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: contribs }, { nowMs: Date.parse(at) + 60_000 });
  return joinQuotaPoolState(composed, registry, { nowMs: Date.parse(at) + 60_000 });
}
const CANDIDATE = [{ route_id: "codex-direct", resource_id: "codex", model: "codex_subscription_models", access_surface: "codex_ide_cursor_extension", select_rank: 10 }];
async function shadowDecision(joined) {
  const decision = selectQuotaAwareExecutionRoute(joined, CANDIDATE, { nowMs: Date.parse(OBS) + 60_000, execution_kind: "prompt_creator", task_delta_id: "PROMO-IMPL" });
  const phaseE = evaluateHermesPhaseEShadowRoute({
    commercialDecision: decision,
    localController: { available: true, adequate: true },
    chatgptWeb: await collectChatgptWebObservation({ nowMs: NOW, chatgptWebObservation: { state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, observed_at: OBS } }),
    authorization: { production_dispatch_authorized: false },
  });
  return { decision, phaseE };
}
function webObservation(overrides = {}) {
  return { availability_domain: "SEPARATE_AVAILABILITY_DOMAIN", state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, freshness: "fresh", observed_at: OBS, ...overrides };
}
function authFixture({ taskRef = TASK, route = PROMOTED_ROUTE_ID, state = "ACTIVE", spent = false, scope } = {}) {
  return {
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: "TEST-ONLY-SYNTHETIC-FIXTURE-0001",
    authorization_state: state,
    route_id: route,
    spent,
    scope: scope ?? { task_ref: taskRef, base_head: "51a652151aa845dc25715803f9dea9b0e2ad85e6", production_dispatch: true, test_only: true },
  };
}
function candidateDoc() {
  return applyRouteCandidateEnable(emptyRouteControlState({ nowMs: NOW, updatedBy: "promo-test" }), { nowMs: NOW, updatedBy: "promo-test" }).doc;
}
function shadowOnlyDoc() {
  const doc = emptyRouteControlState({ nowMs: NOW, updatedBy: "promo-test" });
  return { ...doc, state: "SHADOW_ONLY" };
}
const freshJoinedPromise = joinedFor([qwen(true)]);
async function freshJoined() { return freshJoinedPromise; }
async function readyRequest(overrides = {}) {
  const has = (k) => Object.prototype.hasOwnProperty.call(overrides, k);
  return {
    task_ref: TASK,
    run_id: RUN,
    route_control_doc: overrides.route_control_doc ?? candidateDoc(),
    phaseE: overrides.phaseE ?? (await shadowDecision(await freshJoined())).phaseE,
    joined: overrides.joined ?? await freshJoined(),
    localController: overrides.localController ?? { available: true, adequate: true },
    chatgptWeb: overrides.chatgptWeb ?? webObservation(),
    authorization: has("authorization") ? overrides.authorization : authFixture(),
    route_id: overrides.route_id,
    fallback_route_id: overrides.fallback_route_id,
    allow_fallback: overrides.allow_fallback,
    fallback_requested: overrides.fallback_requested,
  };
}

function blockCheck(id, name, request, expectedClassification, expectCodes = []) {
  return t(id, name, async () => {
    const out = evaluatePromotedRouteDispatch(await request, { nowMs: NOW });
    assert.equal(out.status, "BLOCKED", JSON.stringify(out));
    assert.equal(out.eligible, false);
    assert.equal(out.execution_performed, false);
    assert.equal(out.production_dispatch, false);
    assert.equal(out.classification, expectedClassification, JSON.stringify(out));
    for (const c of expectCodes) assert.ok(out.reason_codes.includes(c), `expected ${c} in ${JSON.stringify(out.reason_codes)}`);
  });
}

// ---------------- P01..P15 negative + positive dual-gate proofs ----------------

await blockCheck("P01", "route DISABLED blocks dispatch", readyRequest({ route_control_doc: emptyRouteControlState({ nowMs: NOW }) }), "ROUTE_CONTROL_DISABLED");

await blockCheck("P02", "route SHADOW_ONLY blocks production dispatch", readyRequest({ route_control_doc: shadowOnlyDoc() }), "ROUTE_CONTROL_SHADOW_ONLY_NOT_PRODUCTION");

await blockCheck("P03", "candidate + authorization NOT ACTIVE blocks", readyRequest({ authorization: authFixture({ state: "PENDING" }) }), "AUTHORIZATION_REJECTED", ["AUTH_NOT_ACTIVE"]);

await blockCheck("P04", "candidate + MISSING authorization blocks", readyRequest({ authorization: null }), "AUTHORIZATION_REJECTED", ["AUTH_MISSING"]);

await t("P05", "candidate + malformed authorization blocks", async () => {
  for (const bad of ["string", 42, {}, [], { schema_version: "wrong" }, authFixture({ route: "opencode+qwen_local" }), authFixture({ spent: true })]) {
    const out = evaluatePromotedRouteDispatch(await readyRequest({ authorization: bad }), { nowMs: NOW });
    assert.equal(out.status, "BLOCKED", JSON.stringify(bad));
    assert.equal(out.classification, "AUTHORIZATION_REJECTED", JSON.stringify({ bad, out }));
    assert.equal(out.production_dispatch, false);
  }
});

// note: a stale observation is REJECTED by the composer (contribution law) and
// falls back to the fail-closed baseline, so the join reports the controller
// unavailable — either way dispatch MUST be blocked (never eligible).
await blockCheck("P06", "candidate + stale resources blocks (composer fallback law)", readyRequest({ joined: await joinedFor([qwen(true, "2026-09-12T12:00:00.000Z")]) }), "LOCAL_CONTROLLER_UNAVAILABLE", ["QWEN_LOCAL_NOT_AVAILABLE_IN_JOIN"]);

await blockCheck("P07", "candidate + unknown/missing resource admission blocks", readyRequest({ joined: { ok: false } }), "RESOURCE_ADMISSION_BLOCKED", ["JOIN_STATE_INVALID"]);

await blockCheck("P08", "candidate + unavailable local controller blocks", readyRequest({ localController: { available: false, adequate: false } }), "LOCAL_CONTROLLER_UNAVAILABLE");

await blockCheck("P09", "candidate + unavailable Web surface blocks", readyRequest({ chatgptWeb: webObservation({ state: "UNAVAILABLE", reachable: false, authenticated: false }) }), "WEB_SURFACE_UNAVAILABLE");

await blockCheck("P10", "route id mismatch blocks", readyRequest({ route_id: "opencode+qwen_local" }), "ROUTE_ID_MISMATCH");

await t("P11", "wrong task/run provenance blocks (envelope + execution edge)", async () => {
  const req = await readyRequest();
  const out = evaluatePromotedRouteDispatch({ ...req, task_ref: "OTHER-TASK" }, { nowMs: NOW });
  assert.equal(out.status, "BLOCKED");
  const eligible = evaluatePromotedRouteDispatch(req, { nowMs: NOW });
  assert.equal(eligible.status, "ELIGIBLE");
  const edge = await executePromotedRoute({ task_ref: "TAMPERED", run_id: RUN, eligibility: eligible });
  assert.equal(edge.status, "BLOCKED");
  assert.equal(edge.classification, "PROVENANCE_MISMATCH");
});

await t("P12", "legacy/staged route request blocks", async () => {
  const req = await readyRequest({ route_id: "openclaw+legacy" });
  const out = evaluatePromotedRouteDispatch(req, { nowMs: NOW });
  assert.equal(out.status, "BLOCKED");
  assert.equal(out.classification, "ROUTE_ID_MISMATCH");
  // openclaw can never be a valid auth route either
  const badAuth = validatePromotedRouteAuthorization(authFixture({ route: "openclaw+legacy" }), { taskRef: TASK });
  assert.equal(badAuth.ok, false);
  assert.ok(badAuth.reason_codes.includes("AUTH_WRONG_ROUTE"));
});

await t("P13", "silent fallback attempt rejected outright", async () => {
  for (const inject of [{ fallback_route_id: "opencode+qwen_local" }, { allow_fallback: true }, { fallback_requested: true }]) {
    const out = evaluatePromotedRouteDispatch(await readyRequest(inject), { nowMs: NOW });
    assert.equal(out.status, "BLOCKED");
    assert.equal(out.classification, "SILENT_FALLBACK_REJECTED");
    assert.equal(out.production_dispatch, false);
  }
});

await blockCheck("P14", "authorization present but route control DISABLED blocks", readyRequest({ route_control_doc: emptyRouteControlState({ nowMs: NOW }) }), "ROUTE_CONTROL_DISABLED");

await t("P15", "candidate + ALL future conditions true -> ELIGIBLE, never executed", async () => {
  const out = evaluatePromotedRouteDispatch(await readyRequest(), { nowMs: NOW });
  assert.equal(out.status, "ELIGIBLE");
  assert.equal(out.classification, READY_CLASSIFICATION);
  assert.equal(out.eligible, true);
  assert.equal(out.execution_performed, false);
  assert.equal(out.production_dispatch, false, "eligibility is NOT dispatch");
  assert.equal(out.fail_closed, false);
  assert.equal(out.dispatch_binding.task_ref, TASK);
  assert.equal(out.dispatch_binding.route_id, PROMOTED_ROUTE_ID);
  // Default execution edge with NO transport: fail-closed no-op.
  const edge = await executePromotedRoute({ task_ref: TASK, run_id: RUN, eligibility: out });
  assert.equal(edge.status, "BLOCKED");
  assert.equal(edge.classification, "TRANSPORT_NOT_PROVIDED_FAIL_CLOSED");
  assert.equal(edge.execution_performed, false);
  // Even the QUALIFIED live transport is refused without explicit activation confirmation.
  const { chainSend } = await import("../../tools/hermes-per-invocation-browser-allowlist-v1.mjs");
  const edgeLive = await executePromotedRoute({ task_ref: TASK, run_id: RUN, eligibility: out }, { transport: chainSend });
  assert.equal(edgeLive.status, "BLOCKED");
  assert.equal(edgeLive.classification, "ACTIVATION_NOT_CONFIRMED");
  assert.equal(edgeLive.execution_performed, false);
});

// ---------------- P16 positive dry-run proof ----------------

await t("P16", "PROMOTION_CAPABLE_DRY_RUN: stubbed transport reaches READY, execution_performed=false", async () => {
  const eligibility = evaluatePromotedRouteDispatch(await readyRequest(), { nowMs: NOW });
  assert.equal(eligible0(eligibility), true);
  let transportCalls = 0;
  const stub = async (spec) => {
    transportCalls++;
    assert.equal(spec.route_id, PROMOTED_ROUTE_ID);
    assert.equal(spec.task_ref, TASK);
    assert.equal(spec.run_id, RUN);
    assert.equal(spec.dispatch_binding.authorization_id, "TEST-ONLY-SYNTHETIC-FIXTURE-0001");
    return { stubbed: true, execution_performed: false, classification: "DRY_RUN_STUB" };
  };
  const out = await executePromotedRoute({ task_ref: TASK, run_id: RUN, eligibility, payload: { bounded: true } }, { transport: stub });
  assert.equal(transportCalls, 1);
  assert.equal(out.status, "DRY_RUN");
  assert.equal(out.classification, READY_CLASSIFICATION);
  assert.equal(out.execution_performed, false);
  assert.equal(out.production_dispatch, false);
  assert.equal(out.transport_stubbed, true);
  assert.ok(out.reason_codes.includes("DRY_RUN_STUBBED_TRANSPORT"));
  // Tamper: performed=true without verifier -> blocked pending independent confirmation.
  const lying = await executePromotedRoute({ task_ref: TASK, run_id: RUN, eligibility }, { transport: async () => ({ stubbed: false, execution_performed: true }) });
  assert.equal(lying.classification, "INDEPENDENT_VERIFICATION_REQUIRED");
  assert.equal(lying.status, "BLOCKED");
});
function eligible0(e) { return e.status === "ELIGIBLE" && e.eligible === true; }

await t("P17", "authorization identity law (synthetic fixture never active runtime auth)", async () => {
  const ok = validatePromotedRouteAuthorization(authFixture(), { taskRef: TASK });
  assert.equal(ok.ok, true);
  // scope/task binding is enforced
  const mismatch = validatePromotedRouteAuthorization(authFixture({ taskRef: "OTHER" }), { taskRef: TASK });
  assert.equal(mismatch.ok, false);
  assert.ok(mismatch.reason_codes.includes("AUTH_SCOPE_TASK_REF_MISMATCH"));
});

// ---------------- P18 rollback after candidate ----------------

await t("P18", "ROLLBACK_AFTER_CANDIDATE: disable restores SHADOW_ONLY target and blocks future dispatch", async () => {
  const cand = candidateDoc();
  const dis = applyRouteDisable(cand, { nowMs: NOW + 1000, updatedBy: "promo-test" }).doc;
  assert.equal(dis.state, "DISABLED");
  assert.equal(dis.restoration_state, "SHADOW_ONLY");
  assert.equal(dis.disable_history[0].from_state, "CANDIDATE_ENABLED");
  const rb = rollbackObservation(dis, { nowMs: NOW + 1000 });
  assert.equal(rb.rollback_ready, true);
  // idempotent re-disable
  const again = applyRouteDisable(dis, { nowMs: NOW + 2000, updatedBy: "promo-test" });
  assert.equal(again.idempotent_no_op, true);
  assert.equal(again.doc, dis);
  // future dispatch evaluation after rollback: blocked
  const out = evaluatePromotedRouteDispatch(await readyRequest({ route_control_doc: dis }), { nowMs: NOW + 1000 });
  assert.equal(out.status, "BLOCKED");
  assert.equal(out.classification, "ROUTE_CONTROL_DISABLED");
});

// ---------------- Observability attachment ----------------

await t("O01", "observability exposes promotion fields (eligibility, execution_performed, rollback)", async () => {
  const req = await readyRequest();
  const eligibility = evaluatePromotedRouteDispatch(req, { nowMs: NOW });
  const env = buildRouteObservabilityEnvelope({
    task_ref: TASK,
    phaseE: req.phaseE,
    joined: req.joined,
    decision: null,
    visibility: null,
    routeControlDoc: req.route_control_doc,
    localController: req.localController,
    chatgptWeb: req.chatgptWeb,
    failureClass: eligibility.status === "ELIGIBLE" ? "NONE_ELIGIBLE_AWAITING_ACTIVATION" : eligibility.classification,
  }, { nowMs: NOW });
  // Base envelope fields (existing R5 envelope) must all be OBSERVED here.
  assert.equal(env.fields.route_enable_disable_state.value.effective_state, "CANDIDATE_ENABLED");
  assert.equal(env.fields.authorization_result.state, "OBSERVED");
  // Promotion-specific observability rides the dispatch decision envelopes.
  assert.equal(eligibility.schema_version, PROMOTION_DISPATCH_SCHEMA);
  assert.equal(eligibility.execution_performed, false);
  assert.ok(eligibility.classification, "dispatch decision carries EXECUTION_ELIGIBILITY");
  assert.ok(env.observed_at, "OBSERVED_AT present");
});

// ---------------- Integration law ----------------

await t("I01", "ONE authority chain: adapter consumes (never reimplements) selection/admission/control", async () => {
  const src = readFileSync(resolve(ROOT, "tools/v4-phase-f-promotion-adapter-v1.mjs"), "utf8");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(code.includes("evaluateRouteControl"), "consumes R4 route control");
  assert.ok(code.includes("STATUS_MAX_AGE_MS"), "reuses central freshness TTL");
  assert.ok(!code.includes("joinQuotaPoolState"), "does not reimplement quota join");
  assert.ok(!code.includes("selectQuotaAware"), "does not reimplement RT25 selection");
  assert.ok(!code.includes("fetch("), "no network of its own");
});

await t("I02", "qualified Hermes transport structurally bound; model-visible tools unchanged (4)", async () => {
  assert.equal(QUALIFIED_HERMES_TRANSPORT_BINDING.bound, true);
  assert.equal(QUALIFIED_HERMES_TRANSPORT_BINDING.export_name, "chainSend");
  assert.equal(QUALIFIED_HERMES_TRANSPORT_BINDING.model_visible_tools.length, 4);
});

await t("I03", "no second router/authority: adapter not registered into canonical router defaults", async () => {
  const { createDefaultExecutionAdapterRegistry, registrySnapshot } = await import("../../tools/v4-execution-adapter-registry-v1.mjs");
  const snap = registrySnapshot(createDefaultExecutionAdapterRegistry());
  assert.equal(snap.entries.length, 1, "default registry still exactly opencode+qwen_local");
  assert.equal(snap.entries[0].route_id, "opencode+qwen_local");
});

await t("I04", "hard walls in module code: no production promotion execution path baked in", async () => {
  const src = readFileSync(resolve(ROOT, "tools/v4-phase-f-promotion-adapter-v1.mjs"), "utf8");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(code.includes("production_activation_confirmed"), "qualified transport requires explicit future activation flag");
  assert.equal(code.includes("PRODUCTION_ENABLED"), false);
  assert.ok(!/promot\w*\s*[:=]\s*(true|"YES")/i.test(code.replace(/production_dispatch/g, "")));
});

await t("I05", "provenance registry route allow-list NOT widened by this task", async () => {
  const { readFileSync: rf } = await import("node:fs");
  const regSrc = rf(resolve(ROOT, "tools/v4-runtime-authorization-provenance-registry-v1.mjs"), "utf8");
  assert.equal((regSrc.match(/opencode\+qwen_local/g) || []).length >= 3, true);
  assert.ok(!regSrc.includes(PROMOTED_ROUTE_ID), "issuance/spend ownership unchanged");
});

console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`FOCUSED_CHECKS=${results.length}`);
console.log(`PASSED=${results.length - failed}`);
console.log(process.exitCode ? "FOCUSED_TESTS=FAIL" : "FOCUSED_TESTS=PASS");
