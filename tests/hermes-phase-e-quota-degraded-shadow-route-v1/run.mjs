#!/usr/bin/env node
/** Focused deterministic qualification for Phase E composition. */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwareExecutionRoute, EXECUTION_DECISION_SCHEMA } from "../../tools/rt25-execution-quota-aware-selector-v1.mjs";
import { collectChatgptWebObservation } from "../../tools/local-dev-resource-observatory-v1.mjs";
import { evaluateHermesPhaseEShadowRoute, PHASE_E_ROUTE } from "../../tools/evaluate-hermes-phase-e-shadow-route-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-12T12:00:00.000Z");
const OBS = "2026-09-12T11:58:00.000Z";
const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8").replace(/^\uFEFF/, ""));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8").replace(/^\uFEFF/, ""));
const results = [];

function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 260) });
}

function contribution(resources, producedAt = OBS, source = "manual") {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `SHADOW_TEST_INPUT-phase-e-${source}-${producedAt}-${Object.keys(resources).join("-")}`.replace(/[:.]/g, "-"),
    producer_id: "phase-e-shadow-test-input",
    source,
    produced_at: producedAt,
    resources,
  };
}

function commercial(value, available = true, at = OBS) {
  return contribution({
    codex: {
      available,
      quota_remaining: { value, unit: "percent" },
      reset_at: "2026-09-12T16:00:00.000Z",
      cost_mode: "included",
      location: "cloud",
      updated_at: at,
      evidence: { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" },
    },
  }, at, "dashboard_snapshot");
}

function qwen(available = true) {
  return contribution({
    qwen_local: {
      available,
      quota_remaining: { value: null, unit: "unknown" },
      reset_at: null,
      cost_mode: "free",
      location: "local",
      updated_at: OBS,
      evidence: {
        kind: "qwen_occupancy",
        classification: available ? "QWEN_READY_IDLE" : "QWEN_OCCUPANCY_UNCERTAIN",
        launch_performed: false,
        generation_calls: 0,
      },
    },
  }, OBS, "local_probe");
}

async function joinedFor(contributions, reservePolicy = {}) {
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions }, { nowMs: NOW });
  return joinQuotaPoolState(composed, registry, { nowMs: NOW, reservePolicy });
}

const DIRECT_COMMERCIAL = [{
  route_id: "codex-direct-commercial",
  resource_id: "codex",
  model: "codex_subscription_models",
  access_surface: "codex_ide_cursor_extension",
  select_rank: 10,
}];

function directDecision(joined) {
  return selectQuotaAwareExecutionRoute(joined, DIRECT_COMMERCIAL, {
    nowMs: NOW,
    execution_kind: "prompt_creator",
    task_delta_id: "PHASE-E-SHADOW",
  });
}

async function web(overrides = {}) {
  const observation = await collectChatgptWebObservation({
    nowMs: NOW,
    chatgptWebObservation: {
    state: "AVAILABLE",
    reachable: true,
    authenticated: true,
    throttled: false,
      observed_at: OBS,
    ...overrides,
    },
  });
  return { ...observation, test_input_label: "SHADOW_TEST_INPUT" };
}

async function gate(decision, joined, overrides = {}) {
  return evaluateHermesPhaseEShadowRoute({
    commercialDecision: decision,
    localController: {
      available: joined.resources.qwen_local?.resource_available === true,
      adequate: true,
      ...overrides.localController,
    },
    chatgptWeb: await web(overrides.chatgptWeb),
    authorization: { production_dispatch_authorized: false, ...overrides.authorization },
  });
}

// E1 — healthy direct commercial capacity remains preferred; no Hermes selection.
{
  const joined = await joinedFor([commercial(70), qwen(true)]);
  const decision = directDecision(joined);
  const out = await gate(decision, joined);
  check("E1-normal-commercial-preferred", out.status === "DIRECT_COMMERCIAL_ROUTE_SELECTED" && out.mode === "DIRECT_COMMERCIAL" && out.route?.route_id === "codex-direct-commercial", JSON.stringify(out));
}

// E2 — reserve protects the commercial pool and permits the separately admitted shadow path.
{
  const joined = await joinedFor([commercial(20), qwen(true)], { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "phase-e-test-reserve" } });
  const decision = directDecision(joined);
  const out = await gate(decision, joined);
  check("E2-reserve-preserved-shadow-selected", decision.reason_codes.includes("RESERVE_FLOOR_BLOCK") && out.status === "SHADOW_ROUTE_SELECTED" && out.reason_codes.includes("RESERVE_FLOOR_BLOCK"), JSON.stringify({ decision, out }));
}

// E3 — exhausted commercial route, explicit local controller and Web health select the exact shadow route.
{
  const joined = await joinedFor([commercial(0), qwen(true)]);
  const decision = directDecision(joined);
  const out = await gate(decision, joined);
  check("E3-exhausted-commercial-shadow-selected", decision.reason_codes.includes("POOL_EXHAUSTED") && out.status === "SHADOW_ROUTE_SELECTED" && JSON.stringify(out.route) === JSON.stringify(PHASE_E_ROUTE), JSON.stringify({ decision, out }));
}

// E4 — stale commercial evidence fails closed upstream; shadow selection uses only independent local/Web admission.
{
  const staleAt = "2026-09-12T10:00:00.000Z";
  const joined = await joinedFor([commercial(70, true, staleAt), qwen(true)], {});
  const decision = directDecision(joined);
  const out = await gate(decision, joined);
  check("E4-stale-commercial-fail-closed", decision.reason_codes.includes("CONSERVE_UNKNOWN_STALE") && out.status === "SHADOW_ROUTE_SELECTED" && out.reason_codes.includes("CONSERVE_UNKNOWN_STALE"), JSON.stringify({ decision, out }));
}

// E5 — missing/unknown commercial evidence never becomes healthy; independent shadow admission remains explicit.
{
  const joined = await joinedFor([qwen(true)]);
  const decision = directDecision(joined);
  const out = await gate(decision, joined);
  check("E5-unknown-commercial-fail-closed", decision.reason_codes.includes("CONSERVE_UNKNOWN_MISSING") && out.status === "SHADOW_ROUTE_SELECTED" && out.reason_codes.includes("CONSERVE_UNKNOWN_MISSING"), JSON.stringify({ decision, out }));
}

// Operator-window ineligibility arrives as deterministic admission state; Phase E does not duplicate provider policy.
{
  const joined = await joinedFor([qwen(true)]);
  const ineligible = {
    schema_version: EXECUTION_DECISION_SCHEMA,
    status: "NO_ROUTE_SELECTED",
    selected: null,
    reason_codes: ["ALL_CANDIDATES_REJECTED"],
    rejected_candidates: [{ route_id: "commercial-window", reason_codes: ["INELIGIBLE_BY_OPERATOR_POLICY"] }],
  };
  const out = await gate(ineligible, joined);
  check("operator-policy-ineligibility-consumed-not-reimplemented", out.status === "SHADOW_ROUTE_SELECTED" && out.reason_codes.includes("INELIGIBLE_BY_OPERATOR_POLICY"), JSON.stringify(out));
}

// E6 — unavailable Web never selects the Hermes shadow route.
{
  const joined = await joinedFor([commercial(0), qwen(true)]);
  const out = await gate(directDecision(joined), joined, { chatgptWeb: { state: "UNAVAILABLE", reachable: false } });
  check("E6-chatgpt-web-unavailable-fail-closed", out.status === "DEFERRED" && out.route === null && out.reason_codes.includes("CHATGPT_WEB_UNAVAILABLE_OR_STALE"), JSON.stringify(out));
}

// E7 — unavailable or inadequate Qwen never selects the degraded route.
{
  const joined = await joinedFor([commercial(0), qwen(false)]);
  const out = await gate(directDecision(joined), joined, { localController: { adequate: false } });
  check("E7-qwen-unavailable-fail-closed", out.status === "DEFERRED" && out.route === null && out.reason_codes.includes("QWEN_LOCAL_UNAVAILABLE_OR_INADEQUATE"), JSON.stringify(out));
}

// E8 — even with route conditions met, Phase E can only select shadow and never production dispatch.
{
  const joined = await joinedFor([commercial(0), qwen(true)]);
  const out = await gate(directDecision(joined), joined);
  check("E8-authorization-wall-shadow-only", out.status === "SHADOW_ROUTE_SELECTED" && out.mode === "SHADOW_ONLY" && out.production_dispatch === false && out.promotion_phase_executed === false && out.authorization_bypass === false, JSON.stringify(out));
}

// Composition module is deliberately narrow: it must not contain a provider/browser/runtime route switch.
{
  const src = readFileSync(resolve(ROOT, "tools/evaluate-hermes-phase-e-shadow-route-v1.mjs"), "utf8");
  check("no-provider-browser-or-legacy-activation", !/\bfetch\s*\(|browser_|openclaw|n8n|dispatch\s*\(/i.test(src), "composition gate is pure");
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
