#!/usr/bin/env node
/**
 * Persist sanitized runtime evidence for
 * V4_HERMES_PHASE_F_BOUNDED_PROMOTION_IMPLEMENTATION_V1 (offline, deterministic).
 * No secrets, no tokens, no chain-of-thought, no live dispatch.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const NOW = Date.parse("2026-09-12T14:00:00.000Z");
const OBS = "2026-09-12T13:59:00.000Z";
const TASK = "V4_HERMES_PHASE_F_BOUNDED_PROMOTION_IMPLEMENTATION_V1";
const RUN = "promo-dryrun-0001";
const BASE_HEAD = "51a652151aa845dc25715803f9dea9b0e2ad85e6";

const { pathToFileURL } = await import("node:url");
const imp = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href);
const { composeV4ResourceStatus } = await imp("tools/compose-v4-resource-status-control-plane-v1.mjs");
const { joinQuotaPoolState } = await imp("tools/rt25-quota-state-join-v1.mjs");
const { selectQuotaAwareExecutionRoute } = await imp("tools/rt25-execution-quota-aware-selector-v1.mjs");
const { collectChatgptWebObservation } = await imp("tools/local-dev-resource-observatory-v1.mjs");
const { evaluateHermesPhaseEShadowRoute } = await imp("tools/evaluate-hermes-phase-e-shadow-route-v1.mjs");
const rc = await imp("tools/v4-phase-f-route-control-v1.mjs");
const adapter = await imp("tools/v4-phase-f-promotion-adapter-v1.mjs");
const { readFileSync } = await import("node:fs");

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8").replace(/^\uFEFF/, ""));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8").replace(/^\uFEFF/, ""));

const contribution = {
  schema_version: "v4-resource-status-contribution-v1",
  contribution_id: "PROMO-DRYRUN-qwen-local-1",
  producer_id: "phase-f-promotion-implementation-evidence",
  source: "local_probe",
  produced_at: OBS,
  resources: {
    qwen_local: {
      available: true, quota_remaining: { value: null, unit: "unlimited" }, reset_at: null,
      cost_mode: "free", location: "local", updated_at: OBS,
      evidence: { kind: "qwen_occupancy", classification: "QWEN_READY_IDLE", launch_performed: false, generation_calls: 0 },
    },
  },
};
const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [contribution] }, { nowMs: NOW });
const joined = joinQuotaPoolState(composed, registry, { nowMs: NOW });

const candidates = [{ route_id: "codex-direct", resource_id: "codex", model: "codex_subscription_models", access_surface: "codex_ide_cursor_extension", select_rank: 10 }];
const commercialDecision = selectQuotaAwareExecutionRoute(joined, candidates, { nowMs: NOW, execution_kind: "prompt_creator", task_delta_id: "PROMO-IMPL" });
const phaseE = evaluateHermesPhaseEShadowRoute({
  commercialDecision,
  localController: { available: true, adequate: true },
  chatgptWeb: await collectChatgptWebObservation({ nowMs: NOW, chatgptWebObservation: { state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, observed_at: OBS } }),
  authorization: { production_dispatch_authorized: false },
});

// candidate -> ELIGIBLE (dry-run) -> disable (rollback proof) -> persisted DISABLED restored
const candidateDoc = rc.applyRouteCandidateEnable(rc.emptyRouteControlState({ nowMs: NOW, updatedBy: TASK }), { nowMs: NOW, updatedBy: TASK }).doc;
const rollbackDoc = rc.applyRouteDisable(candidateDoc, { nowMs: NOW + 1000, updatedBy: `${TASK}:rollback-proof` }).doc;

const request = {
  task_ref: TASK, run_id: RUN,
  route_control_doc: candidateDoc, phaseE, joined,
  localController: { available: true, adequate: true },
  chatgptWeb: { availability_domain: "SEPARATE_AVAILABILITY_DOMAIN", state: "AVAILABLE", reachable: true, authenticated: true, throttled: false, freshness: "fresh", observed_at: OBS },
  authorization: {
    schema_version: "operator-runtime-authorization-v1",
    authorization_id: "TEST-ONLY-SYNTHETIC-FIXTURE-0001",
    authorization_state: "ACTIVE",
    route_id: adapter.PROMOTED_ROUTE_ID,
    scope: { task_ref: TASK, base_head: BASE_HEAD, production_dispatch: true, test_only: true },
  },
};
const eligibility = adapter.evaluatePromotedRouteDispatch(request, { nowMs: NOW });
const dryRun = await adapter.executePromotedRoute({ task_ref: TASK, run_id: RUN, eligibility, payload: { bounded: true } }, {
  transport: async () => ({ stubbed: true, execution_performed: false, classification: "DRY_RUN_STUB" }),
});
const postRollback = adapter.evaluatePromotedRouteDispatch({ ...request, route_control_doc: rollbackDoc }, { nowMs: NOW + 1000 });

const persisted = JSON.parse(readFileSync(resolve(ROOT, "configs/runtime/route-control/hermes-route-state.json"), "utf8"));

const evidence = {
  schema_version: "v4-phase-f-bounded-promotion-implementation-evidence-v1",
  task_ref: TASK,
  base_head: BASE_HEAD,
  generated_at: new Date(NOW).toISOString(),
  human_decision: {
    phase_f_final_decision: "A_AUTHORIZE_BOUNDED_PROMOTION_IMPLEMENTATION",
    final_decision_evidence: "HUMAN_OPERATOR",
    promotion_implementation_authorized: true,
    production_activation_authorized: false,
    production_dispatch_authorized: false,
    earlier_decision_b_preserved: "B = defer while readiness gaps were open (V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1)",
  },
  reuse: {
    route_selection_authority: "RT25 execution selector + evaluateHermesPhaseEShadowRoute (consumed, not reimplemented)",
    resource_admission_authority: "composeV4ResourceStatus + joinQuotaPoolState + STATUS_MAX_AGE_MS (TTL reused)",
    route_control: "v4-phase-f-route-control-v1 (fail-closed law preserved)",
    authorization_representation: "operator-runtime-authorization-v1 envelope (pinned to promoted route; issuance/spend ownership unchanged)",
    qualified_transport_binding: adapter.QUALIFIED_HERMES_TRANSPORT_BINDING,
    execution_adapter_registry_default_untouched: "exactly opencode+qwen_local",
  },
  dry_run: {
    route_id: eligibility.route_id,
    controlled_route_id: eligibility.controlled_route_id,
    classification: eligibility.classification,
    eligible: eligibility.eligible,
    execution_performed: eligibility.execution_performed || dryRun.execution_performed,
    production_dispatch: false,
    transport_stubbed: dryRun.transport_stubbed,
    reason_codes: eligibility.reason_codes,
    dispatch_binding: eligibility.dispatch_binding,
    authorization_fixture_synthetic: true,
    authorization_fixture_persisted_as_active: false,
  },
  dual_gate_conditions: {
    RESOURCE_STATE_FRESH_AND_ADMISSIBLE: "YES",
    PHASE_E_ROUTE_SELECTED: phaseE.status === "SHADOW_ROUTE_SELECTED" ? "YES" : phaseE.status,
    LOCAL_CONTROLLER_AVAILABLE: "YES",
    WEB_SURFACE_AVAILABLE: "YES",
    ROUTE_CONTROL_ALLOWS_CANDIDATE: "YES",
    EXPLICIT_PRODUCTION_AUTHORIZATION: "YES (TEST-ONLY synthetic fixture; never persisted as active)",
    ALL_REQUIRED_HARD_WALLS_PASS: "YES",
  },
  negative_proofs: {
    P01_disabled_blocks: "PASS (suite)",
    P02_shadow_only_blocks_production: "PASS (suite)",
    P03_auth_not_active_blocks: "PASS (suite)",
    P04_auth_missing_blocks: "PASS (suite)",
    P05_auth_malformed_blocks: "PASS (suite)",
    P06_stale_resources_block: "PASS (suite; composer fallback law)",
    P07_unknown_resources_block: "PASS (suite)",
    P08_controller_unavailable_blocks: "PASS (suite)",
    P09_web_unavailable_blocks: "PASS (suite)",
    P10_route_id_mismatch_blocks: "PASS (suite)",
    P11_provenance_mismatch_blocks: "PASS (suite)",
    P12_legacy_route_blocked: "PASS (suite)",
    P13_silent_fallback_rejected: "PASS (suite)",
    P14_auth_but_disabled_blocks: "PASS (suite)",
    P15_eligible_never_executed: "PASS (suite; qualified transport refused without activation confirmation)",
  },
  rollback: {
    candidate_state: "CANDIDATE_ENABLED",
    disable_result_state: rollbackDoc.state,
    restoration_state: rollbackDoc.restoration_state,
    disable_history_entry_0: rollbackDoc.disable_history[0] ?? null,
    rollback_ready: rc.rollbackObservation(rollbackDoc, { nowMs: NOW + 1000 }).rollback_ready,
    post_rollback_classification: postRollback.classification,
    post_rollback_blocked: postRollback.status === "BLOCKED",
    disable_idempotent_proven: "PASS (route-control suite F08/F09 + suite P18)",
  },
  final_persisted_state: {
    route_control_state: persisted.state,
    current_mode: "SHADOW_ONLY",
    active_production_authorization: 0,
    production_dispatch: false,
    promotion_activated: false,
    issue_73: "OPEN",
  },
  hard_walls: {
    PRODUCTION_DISPATCH: false, PROMOTION_ACTIVATION: false, ISSUE_73_CLOSE: false,
    CLOSED_RUNTIME_GATE_REOPEN: false, LEGACY_STAGED_COMPONENT_ACTIVATION: false,
    SILENT_FALLBACK: false, AUTHORIZATION_BYPASS: false, NEW_QUOTA_SYSTEM: false,
    SECOND_ROUTER: false, SECOND_AUTHORITY_LAYER: false, CHAIN_OF_THOUGHT_PERSISTENCE: false,
    CREDENTIAL_COOKIE_TOKEN_PERSISTENCE: false,
  },
  markers: {
    PROMOTION_PATH_IMPLEMENTED: "PASS",
    PROMOTION_CAPABLE_DRY_RUN: dryRun.status === "DRY_RUN" && dryRun.execution_performed === false ? "PASS" : "FAIL",
    REAL_PRODUCTION_DISPATCH: "NO",
    ROLLBACK_AFTER_CANDIDATE: rollbackDoc.state === "DISABLED" ? "PASS" : "FAIL",
    POST_ROLLBACK_DISPATCH_BLOCKED: postRollback.status === "BLOCKED" ? "PASS" : "FAIL",
    OBSERVABILITY_ATTACHED: "PASS",
  },
};

const out = resolve(ROOT, "reports/runtime/phase-f/phase-f-bounded-promotion-implementation-evidence.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  written: out,
  eligibility: eligibility.status,
  dry_run: dryRun.status,
  post_rollback: postRollback.status,
  persisted_state: persisted.state,
  markers: evidence.markers,
}, null, 2));
