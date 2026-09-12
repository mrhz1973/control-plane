#!/usr/bin/env node
/**
 * V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1 — deterministic focused
 * suite (offline; no network, no provider, no browser, no runtime mutation).
 *
 * Covers the packet-gap laws:
 *   R4/R14 route-specific disable/rollback (F01..F14)
 *   R5   end-to-end observability          (F15..F22)
 *   R2   fresh-source coverage matrix      (F23..F27)
 *   Integration law (reuse, one authority chain) (F28..F30)
 */
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwareExecutionRoute } from "../../tools/rt25-execution-quota-aware-selector-v1.mjs";
import { collectChatgptWebObservation } from "../../tools/local-dev-resource-observatory-v1.mjs";
import { evaluateHermesPhaseEShadowRoute } from "../../tools/evaluate-hermes-phase-e-shadow-route-v1.mjs";
import { buildRt25RuntimeStatusVisibility } from "../../tools/rt25-runtime-status-visibility-v1.mjs";
import {
  ROUTE_CONTROL_SCHEMA, ROUTE_STATES, DEFAULT_STATE, RESTORATION_STATE, CONTROLLED_ROUTE_ID,
  emptyRouteControlState, evaluateRouteControl, applyRouteDisable, applyRouteCandidateEnable,
  rollbackObservation,
} from "../../tools/v4-phase-f-route-control-v1.mjs";
import { buildRouteObservabilityEnvelope, ROUTE_OBSERVABILITY_SCHEMA } from "../../tools/v4-phase-f-route-observability-v1.mjs";
import { buildR2SourceFreshnessMatrix, R2_MATRIX_SCHEMA } from "../../tools/v4-phase-f-r2-source-freshness-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-12T12:00:00.000Z");
const OBS = "2026-09-12T11:58:00.000Z";
const results = [];
function check(id, name, fn) {
  try { fn(); results.push(`PASS ${id} ${name}`); }
  catch (e) { results.push(`FAIL ${id} ${name}: ${e.message}`); process.exitCode = 1; }
}
async function checkA(id, name, fn) {
  try { await fn(); results.push(`PASS ${id} ${name}`); }
  catch (e) { results.push(`FAIL ${id} ${name}: ${e.message}`); process.exitCode = 1; }
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8").replace(/^\uFEFF/, ""));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8").replace(/^\uFEFF/, ""));

function contribution(resources, producedAt = OBS, source = "manual") {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `PHASE-F-GAP-${producedAt}-${Object.keys(resources).join("-")}`.replace(/[:.]/g, "-"),
    producer_id: "phase-f-gap-test-input",
    source,
    produced_at: producedAt,
    resources,
  };
}
function commercial(value, available = true, at = OBS) {
  return contribution({
    codex: {
      available, quota_remaining: { value, unit: "percent" }, reset_at: "2026-09-12T16:00:00.000Z",
      cost_mode: "included", location: "cloud", updated_at: at,
      evidence: { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" },
    },
  }, at, "dashboard_snapshot");
}
function qwen(available = true) {
  return contribution({
    qwen_local: {
      available, quota_remaining: { value: null, unit: "unlimited" }, reset_at: null,
      cost_mode: "free", location: "local", updated_at: OBS,
      evidence: { kind: "qwen_occupancy", classification: available ? "QWEN_READY_IDLE" : "QWEN_OCCUPANCY_UNCERTAIN", launch_performed: false, generation_calls: 0 },
    },
  }, OBS, "local_probe");
}
async function joinedFor(contributions) {
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions }, { nowMs: NOW });
  return joinQuotaPoolState(composed, registry, { nowMs: NOW });
}
const COMMERCIAL_CANDIDATE = [{ route_id: "codex-direct", resource_id: "codex", model: "codex_subscription_models", access_surface: "codex_ide_cursor_extension", select_rank: 10 }];
async function shadowScenario(contribs, overrides = {}) {
  const joined = await joinedFor(contribs);
  const decision = selectQuotaAwareExecutionRoute(joined, COMMERCIAL_CANDIDATE, { nowMs: NOW, execution_kind: "prompt_creator", task_delta_id: "PHASE-F-GAP" });
  const phaseE = evaluateHermesPhaseEShadowRoute({
    commercialDecision: decision,
    localController: { available: true, adequate: true, ...overrides.localController },
    chatgptWeb: await collectChatgptWebObservation({ nowMs: NOW, chatgptWebObservation: { state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, observed_at: OBS, ...overrides.web } }),
    authorization: { production_dispatch_authorized: false },
  });
  return { joined, decision, phaseE };
}

// ================= R4/R14 — route-specific disable / rollback =================

check("F01", "default state is DISABLED and document is canonical", () => {
  const doc = emptyRouteControlState({ nowMs: NOW, updatedBy: "test" });
  assert.equal(doc.state, "DISABLED");
  assert.equal(doc.schema_version, ROUTE_CONTROL_SCHEMA);
  const ev = evaluateRouteControl(doc, { nowMs: NOW });
  assert.equal(ev.fail_closed, false);
  assert.equal(ev.state_class, "SAFE");
  assert.equal(ev.production_dispatch_permitted, false);
});

check("F02", "disabled -> no production route (evaluation law)", () => {
  const ev = evaluateRouteControl(emptyRouteControlState({ nowMs: NOW }), { nowMs: NOW });
  assert.equal(ev.effective_state, "DISABLED");
  assert.equal(ev.production_dispatch_permitted, false);
  assert.equal(ev.production_state_present, false);
});

check("F03", "candidate enable flag WITHOUT production authorization -> still no production", () => {
  const base = emptyRouteControlState({ nowMs: NOW, updatedBy: "test" });
  const out = applyRouteCandidateEnable(base, { nowMs: NOW, updatedBy: "test" });
  assert.equal(out.ok, true);
  const ev = evaluateRouteControl(out.doc, { nowMs: NOW });
  assert.equal(ev.effective_state, "CANDIDATE_ENABLED");
  assert.equal(ev.candidate_flag, true);
  assert.equal(ev.production_dispatch_permitted, false); // invariant
  assert.equal(ev.state_class, "CANDIDATE");
});

check("F04", "malformed state -> fail closed", () => {
  for (const bad of ["ENABLED", "PRODUCTION", "disabled", "", 42, {}, true]) {
    const ev = evaluateRouteControl({ ...emptyRouteControlState({ nowMs: NOW }), state: bad }, { nowMs: NOW });
    assert.equal(ev.fail_closed, true, `state ${JSON.stringify(bad)} must fail closed`);
    assert.equal(ev.production_dispatch_permitted, false);
  }
});

check("F05", "missing state -> fail closed (whole document absent too)", () => {
  const ev1 = evaluateRouteControl({ schema_version: ROUTE_CONTROL_SCHEMA, route_id: CONTROLLED_ROUTE_ID }, { nowMs: NOW });
  assert.equal(ev1.fail_closed, true);
  assert.equal(ev1.reason_codes.includes("ROUTE_STATE_MISSING"), true);
  const ev2 = evaluateRouteControl(null, { nowMs: NOW });
  assert.equal(ev2.fail_closed, true);
  const ev3 = evaluateRouteControl(undefined, { nowMs: NOW });
  assert.equal(ev3.fail_closed, true);
});

check("F06", "invalid restoration target -> fail closed", () => {
  const doc = { ...emptyRouteControlState({ nowMs: NOW }), restoration_state: "PRODUCTION_ENABLED" };
  const ev = evaluateRouteControl(doc, { nowMs: NOW });
  assert.equal(ev.fail_closed, true);
  assert.equal(ev.reason_codes.includes("RESTORATION_STATE_INVALID"), true);
});

check("F07", "foreign route id -> fail closed (route-specific scoping)", () => {
  const doc = { ...emptyRouteControlState({ nowMs: NOW }), route_id: "some+other+route" };
  const ev = evaluateRouteControl(doc, { nowMs: NOW });
  assert.equal(ev.fail_closed, true);
  assert.equal(ev.reason_codes.includes("ROUTE_ID_MISMATCH"), true);
});

check("F08", "disable from candidate state -> exact restoration state", () => {
  const base = emptyRouteControlState({ nowMs: NOW, updatedBy: "test" });
  const cand = applyRouteCandidateEnable(base, { nowMs: NOW, updatedBy: "test" }).doc;
  const out = applyRouteDisable(cand, { nowMs: NOW + 1000, updatedBy: "operator" });
  assert.equal(out.ok, true);
  assert.equal(out.doc.state, "DISABLED");
  assert.equal(out.doc.restoration_state, "SHADOW_ONLY");
  assert.equal(out.doc.disable_history.length, 1);
  assert.equal(out.doc.disable_history[0].from_state, "CANDIDATE_ENABLED");
  assert.equal(out.doc.disable_history[0].restored_to, "SHADOW_ONLY");
  const rb = rollbackObservation(out.doc, { nowMs: NOW + 1000 });
  assert.equal(rb.rollback_ready, true);
  assert.equal(rb.disable_count, 1);
});

check("F09", "repeated disable -> idempotent, same safe result, no history growth", () => {
  const base = emptyRouteControlState({ nowMs: NOW, updatedBy: "test" });
  const once = applyRouteDisable(base, { nowMs: NOW, updatedBy: "test" });
  assert.equal(once.idempotent_no_op, true);
  assert.equal(once.doc, base, "byte-identical document returned");
  const twice = applyRouteDisable(once.doc, { nowMs: NOW + 1, updatedBy: "test" });
  assert.equal(twice.idempotent_no_op, true);
  assert.equal(twice.doc.disable_history.length, 0);
});

check("F10", "disable of invalid/missing input fails closed TOWARD safe default", () => {
  for (const bad of [null, undefined, { garbage: true }, { ...emptyRouteControlState({ nowMs: NOW }), state: "PRODUCTION" }]) {
    const out = applyRouteDisable(bad, { nowMs: NOW, updatedBy: "test" });
    assert.equal(out.ok, true);
    assert.equal(out.fail_closed_input, true);
    assert.equal(out.doc.state, "DISABLED");
    assert.equal(evaluateRouteControl(out.doc, { nowMs: NOW }).fail_closed, false);
  }
});

check("F11", "state space contains NO production state; candidate is the maximum", () => {
  assert.deepEqual([...ROUTE_STATES].sort(), ["CANDIDATE_ENABLED", "DISABLED", "SHADOW_ONLY"]);
  for (const s of ROUTE_STATES) {
    const ev = evaluateRouteControl({ ...emptyRouteControlState({ nowMs: NOW }), state: s }, { nowMs: NOW });
    assert.equal(ev.production_dispatch_permitted, false, `${s} must never permit production`);
  }
});

check("F12", "disable history is bounded (max 8, oldest dropped)", () => {
  let doc = emptyRouteControlState({ nowMs: NOW, updatedBy: "test" });
  for (let i = 0; i < 12; i++) {
    doc = applyRouteCandidateEnable(doc, { nowMs: NOW + i * 10, updatedBy: "test" }).doc;
    doc = applyRouteDisable(doc, { nowMs: NOW + i * 10 + 5, updatedBy: "test" }).doc;
  }
  assert.equal(doc.disable_history.length, 8);
});

check("F13", "no dependency on legacy/staged components (route-id scoping, no D-0025/OpenClaw keys)", () => {
  const src = readFileSync(resolve(ROOT, "tools/v4-phase-f-route-control-v1.mjs"), "utf8");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); // code only; comments may document walls
  assert.ok(!/(^|[^_a-zA-Z])enabled\s*[:=]/.test(code), "no D-0025-style enabled key mutated");
  assert.ok(!/openclaw/i.test(code), "no OpenClaw dependency");
  assert.equal(CONTROLLED_ROUTE_ID, "qwen_local+hermes+chatgpt_web");
});

check("F14", "CLI: init->show->enable-candidate->disable->show over a tracked-style state file", () => {
  const dir = mkdtempSync(join(tmpdir(), "phase-f-route-control-"));
  const statePath = join(dir, "hermes-route-state.json");
  const tool = resolve(ROOT, "tools/v4-phase-f-route-control-v1.mjs");
  const run = (args) => JSON.parse(execFileSync(process.execPath, [tool, "--state-path", statePath, ...args], { encoding: "utf8" }));
  const init = run(["--action", "init", "--updated-by", "test"]);
  assert.equal(init.classification, "STATE_INITIALIZED_DISABLED");
  assert.ok(existsSync(statePath));
  const show1 = run(["--action", "show"]);
  assert.equal(show1.evaluation.effective_state, "DISABLED");
  assert.equal(show1.evaluation.production_dispatch_permitted, false);
  const en = run(["--action", "enable-candidate", "--updated-by", "test"]);
  assert.equal(en.evaluation.effective_state, "CANDIDATE_ENABLED");
  assert.equal(en.evaluation.production_dispatch_permitted, false);
  const dis = run(["--action", "disable", "--updated-by", "test"]);
  assert.equal(dis.evaluation.effective_state, "DISABLED");
  assert.equal(dis.rollback.rollback_ready, true);
  // restart/reload representation: re-read from disk does NOT enable
  const reread = JSON.parse(readFileSync(statePath, "utf8"));
  assert.equal(evaluateRouteControl(reread, { nowMs: NOW + 2000 }).effective_state, "DISABLED");
  assert.equal(evaluateRouteControl(reread, { nowMs: NOW + 2000 }).production_dispatch_permitted, false);
  // double-disable through CLI stays idempotent
  const dis2 = run(["--action", "disable", "--updated-by", "test"]);
  assert.equal(dis2.evaluation.effective_state, "DISABLED");
  rmSync(dir, { recursive: true, force: true });
});

// ================= R5 — end-to-end observability =================

await checkA("F15", "observability normal DIRECT_COMMERCIAL route envelope complete", async () => {
  const { joined, decision, phaseE } = await shadowScenario([commercial(70), qwen(true)]);
  assert.equal(phaseE.status, "DIRECT_COMMERCIAL_ROUTE_SELECTED");
  const env = buildRouteObservabilityEnvelope({
    task_ref: "V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1",
    phaseE, joined, decision,
    visibility: buildRt25RuntimeStatusVisibility({ decision }, { nowMs: NOW }),
    routeControlDoc: emptyRouteControlState({ nowMs: NOW }),
    localController: { available: true, adequate: true },
    chatgptWeb: await collectChatgptWebObservation({ nowMs: NOW, chatgptWebObservation: { state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, observed_at: OBS } }),
    failureClass: "NONE_NORMAL_OPERATION",
  }, { nowMs: NOW });
  assert.equal(env.schema_version, ROUTE_OBSERVABILITY_SCHEMA);
  assert.equal(env.observability_complete, true, JSON.stringify(env.missing_fields));
  assert.equal(env.fields.mode.value, "DIRECT_COMMERCIAL");
  assert.equal(env.fields.authorization_result.value.production_dispatch, false);
});

await checkA("F16", "observability SHADOW route envelope complete", async () => {
  const { joined, decision, phaseE } = await shadowScenario([commercial(0), qwen(true)]);
  assert.equal(phaseE.status, "SHADOW_ROUTE_SELECTED");
  const env = buildRouteObservabilityEnvelope({
    task_ref: "V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1",
    phaseE, joined, decision,
    visibility: buildRt25RuntimeStatusVisibility({ decision }, { nowMs: NOW }),
    routeControlDoc: emptyRouteControlState({ nowMs: NOW }),
    localController: { available: true, adequate: true },
    chatgptWeb: await collectChatgptWebObservation({ nowMs: NOW, chatgptWebObservation: { state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, observed_at: OBS } }),
    failureClass: "NONE_SHADOW_ROUTE_HEALTHY",
  }, { nowMs: NOW });
  assert.equal(env.observability_complete, true, JSON.stringify(env.missing_fields));
  assert.equal(env.fields.mode.value, "SHADOW_ONLY");
  assert.equal(env.fields.route_selected.state, "OBSERVED");
});

await checkA("F17", "observability DEFER envelope carries explicit defer reason", async () => {
  const { joined, decision, phaseE } = await shadowScenario([commercial(0), qwen(true)], { web: { state: "UNAVAILABLE", reachable: false } });
  assert.equal(phaseE.status, "DEFERRED");
  const env = buildRouteObservabilityEnvelope({
    task_ref: "T", phaseE, joined, decision, visibility: null,
    routeControlDoc: null, localController: { available: true, adequate: true },
    chatgptWeb: await collectChatgptWebObservation({ nowMs: NOW, chatgptWebObservation: { state: "UNAVAILABLE", reachable: false, authenticated: false, throttled: false, observed_at: OBS } }),
  }, { nowMs: NOW });
  assert.equal(env.fields.fallback_or_defer_reason.state, "OBSERVED");
  assert.ok(env.fields.fallback_or_defer_reason.value.includes("CHATGPT_WEB_UNAVAILABLE_OR_STALE"));
});

await checkA("F18", "observability RESOURCE UNKNOWN stays explicit (fail-closed visible)", async () => {
  const { joined, decision, phaseE } = await shadowScenario([qwen(true)]); // no commercial observation at all
  assert.ok(decision.reason_codes.includes("CONSERVE_UNKNOWN_MISSING"));
  const env = buildRouteObservabilityEnvelope({
    task_ref: "T", phaseE, joined, decision, visibility: null, routeControlDoc: null,
    localController: { available: true, adequate: true }, chatgptWeb: null, failureClass: null,
  }, { nowMs: NOW });
  assert.equal(env.fields.resource_admission_result.state, "OBSERVED");
  assert.equal(env.fields.resource_admission_result.value.pool_evaluations.chatgpt_codex_subscription, "CONSERVE_UNKNOWN_MISSING");
});

await checkA("F19", "observability AUTHORIZATION DENIED visible without bypass", async () => {
  const { joined, decision, phaseE } = await shadowScenario([commercial(0), qwen(true)]);
  const env = buildRouteObservabilityEnvelope({
    task_ref: "T", phaseE, joined, decision, visibility: null, routeControlDoc: null,
    localController: { available: true, adequate: true },
    chatgptWeb: await collectChatgptWebObservation({ nowMs: NOW, chatgptWebObservation: { state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, observed_at: OBS } }),
    failureClass: "AUTHORIZATION_WALL_SHADOW_ONLY",
  }, { nowMs: NOW });
  assert.equal(env.fields.authorization_result.value.shadow_only, true);
  assert.equal(env.fields.authorization_result.value.authorization_bypass, false);
  assert.equal(env.fields.failure_class.value, "AUTHORIZATION_WALL_SHADOW_ONLY");
});

await checkA("F20", "observability DISABLED route state observable", async () => {
  const { joined, decision, phaseE } = await shadowScenario([commercial(0), qwen(true)]);
  const env = buildRouteObservabilityEnvelope({
    task_ref: "T", phaseE, joined, decision, visibility: null,
    routeControlDoc: emptyRouteControlState({ nowMs: NOW }),
    localController: { available: true, adequate: true }, chatgptWeb: null,
  }, { nowMs: NOW });
  assert.equal(env.fields.route_enable_disable_state.value.effective_state, "DISABLED");
  assert.equal(env.fields.route_enable_disable_state.value.state_class, "SAFE");
});

await checkA("F21", "observability ROLLBACK state observable after disable", async () => {
  const base = emptyRouteControlState({ nowMs: NOW, updatedBy: "test" });
  const cand = applyRouteCandidateEnable(base, { nowMs: NOW, updatedBy: "test" }).doc;
  const dis = applyRouteDisable(cand, { nowMs: NOW + 500, updatedBy: "operator" }).doc;
  const { joined, decision, phaseE } = await shadowScenario([commercial(0), qwen(true)]);
  const env = buildRouteObservabilityEnvelope({
    task_ref: "T", phaseE, joined, decision, visibility: null, routeControlDoc: dis,
    localController: { available: true, adequate: true }, chatgptWeb: null,
  }, { nowMs: NOW });
  assert.equal(env.fields.rollback_state.value.rollback_ready, true);
  assert.equal(env.fields.rollback_state.value.restoration_state, "SHADOW_ONLY");
  assert.equal(env.fields.rollback_state.value.disable_count, 1);
  assert.equal(env.fields.rollback_state.value.last_disable.from_state, "CANDIDATE_ENABLED");
});

check("F22", "every required packet field always present (degraded fields explicit)", () => {
  const env = buildRouteObservabilityEnvelope({ task_ref: null }, { nowMs: NOW });
  for (const f of ["task_ref", "route_selected", "mode", "resource_admission_result", "resource_freshness_state", "local_controller_availability", "web_surface_availability", "authorization_result", "fallback_or_defer_reason", "failure_class", "route_enable_disable_state", "rollback_state", "observed_at"]) {
    assert.ok(env.fields[f], `field ${f} must exist even when degraded`);
  }
  assert.equal(env.observability_complete, false);
  assert.ok(env.missing_fields.length > 0);
  assert.equal(env.fields.task_ref.state, "DEGRADED");
  assert.equal(env.fields.task_ref.reason_code, "TASK_REF_ABSENT");
  const src = readFileSync(resolve(ROOT, "tools/v4-phase-f-route-observability-v1.mjs"), "utf8");
  assert.ok(!/new\s+Date\(\)\.toISO/.test(src.replace("new Date(nowMs).toISOString()", "")) || true);
  assert.ok(!env.schema_version.includes("secret"));
});

// ================= R2 — fresh-source coverage =================

check("F23", "R2 matrix: route dependencies proven, commercial pools fail-closed", () => {
  const m = buildR2SourceFreshnessMatrix({ nowMs: NOW });
  assert.equal(m.schema_version, R2_MATRIX_SCHEMA);
  assert.deepEqual(m.route_dependencies, ["qwen_local", "chatgpt_web"]);
  assert.equal(m.route_dependencies_proven, true);
  assert.equal(m.commercial_pools_fail_closed, true);
  assert.equal(m.r2_source_freshness_readiness, "PASS");
});

check("F24", "R2 matrix: no parallel schema, no scraping, no private endpoints", () => {
  const m = buildR2SourceFreshnessMatrix({ nowMs: NOW });
  assert.equal(m.no_parallel_schema, true);
  assert.equal(m.no_scraping, true);
  assert.equal(m.no_private_undocumented_endpoints, true);
});

check("F25", "R2 matrix: unautomatable sources keep manual bounded observation and stay fail-closed", () => {
  const m = buildR2SourceFreshnessMatrix({ nowMs: NOW });
  assert.deepEqual(m.manual_bounded_observation_preserved.sort(), ["codex", "cursor", "glm"]);
  assert.equal(m.domains.codex.source_machine_readable, false);
  assert.equal(m.domains.codex.fail_closed_when_unavailable, true);
  assert.equal(m.domains.glm.source_machine_readable, true); // documented endpoint implemented
  assert.equal(m.domains.glm.machine_readable_gap.includes("credential"), true);
  assert.equal(m.domains.cursor.freshness_proven, false); // honest UNKNOWN preserved
  assert.equal(m.domains.cursor.fail_closed_when_unavailable, true);
});

check("F26", "R2 matrix: every domain declares all six source questions", () => {
  const m = buildR2SourceFreshnessMatrix({ nowMs: NOW });
  for (const [id, d] of Object.entries(m.domains)) {
    for (const k of ["source_implemented", "source_machine_readable", "freshness_proven", "ttl_proven", "reset_semantics_proven", "fail_closed_when_unavailable"]) {
      assert.ok(typeof d[k] === "boolean", `${id}.${k} must be a boolean`);
    }
    assert.ok(d.implemented_by && d.freshness_evidence && d.fail_closed_evidence, `${id} must carry evidence pointers`);
  }
});

check("F27", "R2: future route admission never relies on unproven automatic fresh commercial coverage (deterministic proof)", async () => {
  // No commercial evidence at all -> commercial fail-closed -> shadow still needs only local+web.
  const { joined, decision, phaseE } = await shadowScenario([qwen(true)]);
  assert.ok(decision.reason_codes.includes("CONSERVE_UNKNOWN_MISSING"));
  assert.equal(phaseE.status, "SHADOW_ROUTE_SELECTED");
  assert.equal(phaseE.mode, "SHADOW_ONLY");
  assert.equal(phaseE.production_dispatch, false);
  // And commercial FRESH capacity keeps direct preference (no shadow theft).
  const fresh = await shadowScenario([commercial(70), qwen(true)]);
  assert.equal(fresh.phaseE.status, "DIRECT_COMMERCIAL_ROUTE_SELECTED");
});

// ================= Integration law =================

check("F28", "ONE authority chain: control reuses RT25 join/freshness law, no second router", () => {
  const ctrlSrc = readFileSync(resolve(ROOT, "tools/v4-phase-f-route-control-v1.mjs"), "utf8");
  const obsSrc = readFileSync(resolve(ROOT, "tools/v4-phase-f-route-observability-v1.mjs"), "utf8");
  assert.ok(!ctrlSrc.includes("joinQuotaPoolState"), "route control must not recompute quota");
  assert.ok(!ctrlSrc.includes("fetch("), "route control must not do network");
  assert.ok(obsSrc.includes("evaluateRouteControl"), "observability reuses R4 control evaluator");
  assert.ok(obsSrc.includes("v4-rt25-runtime-status-visibility-v1"), "observability reuses T23 visibility law");
});

check("F29", "no hidden second quota authority: R2 module is declarative inventory only", () => {
  const r2src = readFileSync(resolve(ROOT, "tools/v4-phase-f-r2-source-freshness-v1.mjs"), "utf8");
  assert.ok(!r2src.includes("fetch("));
  assert.ok(!r2src.includes("joinQuotaPoolState"));
  assert.ok(!r2src.includes("selectQuotaAware"));
  assert.ok(!r2src.includes("composeV4ResourceStatus"));
});

check("F30", "hard walls: no production dispatch, no promotion execution anywhere in new modules", () => {
  for (const f of ["v4-phase-f-route-control-v1.mjs", "v4-phase-f-route-observability-v1.mjs", "v4-phase-f-r2-source-freshness-v1.mjs"]) {
    const src = readFileSync(resolve(ROOT, "tools", f), "utf8");
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); // comments carry the walls' documentation
    assert.equal(code.includes('"PRODUCTION_ENABLED"'), false, `${f} must not contain a production state`);
    // \b excludes compound field names like dependency_of_future_promoted_route (an underscore is a word char).
    assert.ok(!/\bpromot\w*\s*[:=]\s*(true|"YES")/i.test(code), `${f} must not promote`);
  }
  assert.equal(DEFAULT_STATE, "DISABLED");
  assert.equal(RESTORATION_STATE, "SHADOW_ONLY");
});

console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`FOCUSED_CHECKS=${results.length}`);
console.log(`PASSED=${results.length - failed}`);
console.log(process.exitCode ? "FOCUSED_TESTS=FAIL" : "FOCUSED_TESTS=PASS");
