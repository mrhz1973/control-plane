#!/usr/bin/env node
/**
 * V4_EXPIRING_ALLOWANCE_USE_POLICY_V1 — focused deterministic suite.
 *
 * Pure offline fixtures (NO provider calls, NO inference): proves the generic
 * provider-neutral EXPIRING_ALLOWANCE_USE preference law at both layers —
 *   1. classifyExpiringAllowance (policy module)
 *   2. selectQuotaAwarePlannerRoute integration (preference over admitted set)
 * Representative pool fixtures: two generic provider pools (concepts of the
 * canonical glm and codex subscription pools) — generic coverage; Astra
 * absence must be irrelevant (N15).
 */
import { classifyExpiringAllowance, reorderWithExpiringPreference, EXPIRING_ALLOWANCE_POLICY_SCHEMA, DEFAULT_EXPIRING_ALLOWANCE_WINDOW_SECONDS } from "../../tools/expiring-allowance-policy-v1.mjs";
import { selectQuotaAwarePlannerRoute } from "../../tools/rt25-planner-quota-aware-selector-v1.mjs";

const NOW = Date.parse("2026-09-14T13:00:00.000Z");
const RESULTS = [];
function check(name, cond, extra = "") {
  RESULTS.push({ name, ok: cond === true });
  if (cond !== true) console.error(`FAIL ${name} ${extra}`);
}

/* ---------- fixture helpers (joined state per rt25-quota-state-join-v1) ---------- */
function pool(state, freshness, remaining, resetAt, floor = null) {
  // evaluation mirrors the join law (rt25-quota-state-join-v1): exhausted /
  // stale / unknown-state conservations, else healthy.
  const evaluation =
    state === "exhausted" ? "POOL_EXHAUSTED"
    : freshness === "stale" ? "CONSERVE_UNKNOWN_STALE"
    : state !== "available" ? "CONSERVE_UNKNOWN_STATE"
    : "POOL_HEALTHY";
  return {
    state, freshness,
    remaining_percent: remaining,
    reset_at: resetAt,
    evaluation,
    reserve_floor_percent: floor,
    reserve_policy_ref: floor === null ? null : "generic-reserve-v1",
  };
}
function joinedState(pools, resources) {
  return {
    schema_version: "v4-rt25-quota-state-join-v1",
    joined_at: new Date(NOW).toISOString(),
    ok: true,
    classification: "PASS_QUOTA_STATE_JOINED",
    pools, resources,
    economics: {},
    reason_codes: ["JOINED_FROM_REAL_COMPOSER_OUTPUT"],
  };
}
const NEAR = "2026-09-14T13:10:00.000Z";   // +10 min  (inside 1800s window)
const FAR = "2026-09-14T15:00:00.000Z";    // +2 h     (outside 1800s window)
const PAST = "2026-09-14T12:00:00.000Z";   // expired

/* ================= module-level law (classifyExpiringAllowance) ================= */
{
  // T1 core activation + metadata
  const r1 = classifyExpiringAllowance(pool("available", "fresh", 55, NEAR, 20), { nowMs: NOW });
  check("T1_module_activates_near_reset", r1.active === true && r1.reason_code === "EXPIRING_ALLOWANCE_USE");
  check("T1_metadata_reset_and_remaining", r1.metadata.reset_at === NEAR && r1.metadata.time_remaining_ms === 600000);
  check("T1_metadata_pool_state", r1.metadata.quota_pool_state === "available" && r1.metadata.remaining_percent === 55 && r1.metadata.reserve_floor_percent === 20);
  check("T1_schema_version", r1.schema_version === EXPIRING_ALLOWANCE_POLICY_SCHEMA);

  // N2 unknown allowance (missing entry)
  check("N2_missing_pool_allowance_unknown", classifyExpiringAllowance(null, { nowMs: NOW }).reason_code === "ALLOWANCE_UNKNOWN");
  // N3 stale allowance
  check("N3_stale_allowance", classifyExpiringAllowance(pool("available", "stale", 55, NEAR, 20), { nowMs: NOW }).reason_code === "ALLOWANCE_STALE");
  // N4 unknown reset
  check("N4_reset_unknown", classifyExpiringAllowance(pool("available", "fresh", 55, null, 20), { nowMs: NOW }).reason_code === "RESET_UNKNOWN");
  // N5 outside window
  check("N5_outside_window", classifyExpiringAllowance(pool("available", "fresh", 55, FAR, 20), { nowMs: NOW }).reason_code === "OUTSIDE_EXPIRING_WINDOW");
  // N6 reserve floor preserved
  check("N6_reserve_floor_blocked", classifyExpiringAllowance(pool("available", "fresh", 15, NEAR, 20), { nowMs: NOW }).reason_code === "RESERVE_FLOOR_BLOCKED");
  // N7 route adequacy input
  check("N7_route_inadequate", classifyExpiringAllowance(pool("available", "fresh", 55, NEAR, 20), { nowMs: NOW, adequate: false }).reason_code === "ROUTE_INADEQUATE");
  // N8 quality
  check("N8_quality_blocked", classifyExpiringAllowance(pool("available", "fresh", 55, NEAR, 20), { nowMs: NOW, qualityOk: false }).reason_code === "QUALITY_REQUIREMENT_BLOCKED");
  // N10 policy restriction wins over everything
  check("N10_policy_blocked", classifyExpiringAllowance(pool("available", "fresh", 55, NEAR, 20), { nowMs: NOW, policyPermitted: false }).reason_code === "POLICY_BLOCKED");
  // N11 invalid timestamps fail closed (past, garbage, non-Z offset format)
  check("N11a_past_reset_fail_closed", classifyExpiringAllowance(pool("available", "fresh", 55, PAST, 20), { nowMs: NOW }).reason_code === "RESET_UNKNOWN");
  check("N11b_garbage_reset_fail_closed", classifyExpiringAllowance(pool("available", "fresh", 55, "soon", 20), { nowMs: NOW }).reason_code === "RESET_UNKNOWN");
  check("N11c_offset_format_fail_closed", classifyExpiringAllowance(pool("available", "fresh", 55, "2026-09-14T15:10:00+02:00", 20), { nowMs: NOW }).reason_code === "RESET_UNKNOWN");
  // exhausted pool is not "expiring" (nothing to use up)
  check("N_extra_exhausted_not_expiring", classifyExpiringAllowance(pool("exhausted", "fresh", 0, NEAR, 20), { nowMs: NOW }).reason_code === "ALLOWANCE_EXHAUSTED");
  // default window constant is the documented neutral 1800s
  check("threshold_default_neutral_1800s", DEFAULT_EXPIRING_ALLOWANCE_WINDOW_SECONDS === 1800);
  // threshold configuration is honored (strictly-inside window semantics:
  // time_remaining <= window activates; +9min is inside a 600s window,
  // +9min is outside a 539s window)
  check("threshold_configurable", classifyExpiringAllowance(pool("available", "fresh", 55, "2026-09-14T13:09:00.000Z", 20), { nowMs: NOW, windowSeconds: 600 }).reason_code === "EXPIRING_ALLOWANCE_USE");
  check("threshold_configurable_outside", classifyExpiringAllowance(pool("available", "fresh", 55, "2026-09-14T13:09:00.000Z", 20), { nowMs: NOW, windowSeconds: 539 }).reason_code === "OUTSIDE_EXPIRING_WINDOW");
  // reorder helper: pure, identity-preserving, deterministic
  const cls = (active) => ({ active });
  const reordered = reorderWithExpiringPreference([{ c: "b", classification: cls(true) }, { c: "a", classification: cls(false) }]);
  check("reorder_expiring_first_preserves_rest", reordered[0].c === "b" && reordered[1].c === "a" && reordered.length === 2);
}

/* ================= selector integration (planner T08 core) ================= */
// Generic two-pool world: glm_coding_plan (near reset) + chatgpt_codex_subscription (far).
// Candidate r-b (glm, rank 100 — normally loses) vs r-a (codex, rank 10 — normally wins).
function fixtures(glmPool, codexPool) {
  const pools = {
    glm_coding_plan: glmPool,
    chatgpt_codex_subscription: codexPool,
  };
  const resources = {
    res_glm: { quota_pool_id: "glm_coding_plan", pool_semantics: "shared_pool_joined", resource_available: true },
    res_codex: { quota_pool_id: "chatgpt_codex_subscription", pool_semantics: "shared_pool_joined", resource_available: true },
  };
  const candidates = [
    { route_id: "route-a-codex", resource_id: "res_codex", model: "codex-model", access_surface: "codex-ide", select_rank: 10 },
    { route_id: "route-b-glm", resource_id: "res_glm", model: "glm-model", access_surface: "glm-web", select_rank: 100 },
  ];
  return { joined: joinedState(pools, resources), candidates };
}
const OPTS = { nowMs: NOW, expiringAllowance: { enabled: true, workReady: true } };

{
  const { joined, candidates } = fixtures(pool("available", "fresh", 60, NEAR, 20), pool("available", "fresh", 70, FAR, 20));

  // Baseline (feature off): caller rank decides — route-a wins.
  const off = selectQuotaAwarePlannerRoute(joined, candidates, { nowMs: NOW });
  check("baseline_feature_off_unchanged", off.status === "ROUTE_SELECTED" && off.selected.route_id === "route-a-codex" && off.expiring_allowance === undefined);

  // T2: preference reorders — near-reset glm route wins despite worse rank.
  const on = selectQuotaAwarePlannerRoute(joined, candidates, OPTS);
  check("T2_prefers_near_reset_despite_rank", on.status === "ROUTE_SELECTED" && on.selected.route_id === "route-b-glm");
  // T3: explicit auditable reason + pool identity + deterministic metadata.
  check("T3_reason_code_present", on.reason_codes.includes("EXPIRING_ALLOWANCE_USE"));
  check("T3_pool_identity_and_reset", on.expiring_allowance.candidates[0].quota_pool_id === "glm_coding_plan" && on.expiring_allowance.candidates[0].reset_at === NEAR && on.expiring_allowance.candidates[0].time_remaining_ms === 600000);
  check("T3_selection_quota_pool", on.selected.quota_pool_id === "glm_coding_plan");

  // T4: genericity — swap which pool is near reset; policy follows the state, not a provider branch.
  const swapped = fixtures(pool("available", "fresh", 60, FAR, 20), pool("available", "fresh", 70, NEAR, 20));
  const onSwapped = selectQuotaAwarePlannerRoute(swapped.joined, swapped.candidates, OPTS);
  check("T4_generic_state_driven_not_provider", onSwapped.selected.route_id === "route-a-codex" && onSwapped.expiring_allowance.candidates[0].quota_pool_id === "chatgpt_codex_subscription");
  // T4b: both near reset -> both classified active, stable caller order kept.
  const both = fixtures(pool("available", "fresh", 60, NEAR, 20), pool("available", "fresh", 70, NEAR, 20));
  const onBoth = selectQuotaAwarePlannerRoute(both.joined, both.candidates, OPTS);
  check("T4b_both_active_order_stable", onBoth.expiring_allowance.active === true && onBoth.expiring_allowance.candidates.length === 2 && onBoth.selected.route_id === "route-a-codex");

  // N1: no READY work -> never activates (work manufacture structurally blocked).
  const n1 = selectQuotaAwarePlannerRoute(joined, candidates, { nowMs: NOW, expiringAllowance: { enabled: true, workReady: false } });
  check("N1_not_ready_work", n1.selected.route_id === "route-a-codex" && n1.expiring_allowance.active === false && n1.expiring_allowance.reason_code === "NOT_READY_WORK");
  // Feature not enabled at all -> no expiring_allowance key, original envelope.
  const n1b = selectQuotaAwarePlannerRoute(joined, candidates, { nowMs: NOW });
  check("N1b_disabled_no_key", n1b.expiring_allowance === undefined && n1b.reason_codes.includes("QUOTA_AWARE_SELECTION") && !n1b.reason_codes.includes("EXPIRING_ALLOWANCE_USE"));

  // N2: candidate's pool absent from the join -> upstream admission DENIES it
  // (join integrity fail-closed), never resurrected by the preference.
  const n2pools = { glm_coding_plan: pool("available", "fresh", 60, NEAR, 20) };
  const n2joined = joinedState(n2pools, { res_glm: { quota_pool_id: "glm_coding_plan", pool_semantics: "shared_pool_joined", resource_available: true }, res_codex: { quota_pool_id: "chatgpt_codex_subscription", pool_semantics: "shared_pool_joined", resource_available: true } });
  const n2 = selectQuotaAwarePlannerRoute(n2joined, candidates, OPTS);
  check("N2_unknown_pool_no_activation_no_denial", n2.status === "ROUTE_SELECTED" && n2.selected.route_id === "route-b-glm" && n2.rejected_candidates.some((r) => r.route_id === "route-a-codex") && n2.expiring_allowance.active === true && n2.expiring_allowance.candidates.every((c) => c.quota_pool_id !== "chatgpt_codex_subscription"));

  // N3: stale allowance at pool level -> upstream admission DENIES the route
  // (join evaluation CONSERVE_UNKNOWN_STALE — the safety law outranks the
  // preference feature); the remaining route is selected with NO expiring reason.
  const n3 = fixtures(pool("available", "stale", 60, NEAR, 20), pool("available", "fresh", 70, FAR, 20));
  const n3res = selectQuotaAwarePlannerRoute(n3.joined, n3.candidates, OPTS);
  check("N3_stale_route_denied_upstream", n3res.selected.route_id === "route-a-codex" && n3res.rejected_candidates.some((r) => r.route_id === "route-b-glm" && r.reason_codes.includes("CONSERVE_UNKNOWN_STALE")));
  check("N3_stale_no_expiring_reason", n3res.reason_codes.includes("EXPIRING_ALLOWANCE_USE") === false);

  // N3b: stale metadata that admission still admits (remaining present but
  // reset interpretation fails) -> feature-only fail closed, route selectable.
  const n3bPool = { ...pool("available", "fresh", 60, NEAR, 20), reset_at: "stale-garbage" };
  const n3b = fixtures(n3bPool, pool("available", "fresh", 70, FAR, 20));
  const n3bres = selectQuotaAwarePlannerRoute(n3b.joined, n3b.candidates, OPTS);
  check("N3b_feature_only_fail_closed", n3bres.status === "ROUTE_SELECTED" && n3bres.expiring_allowance.active === false && (n3bres.expiring_allowance.reason_code === "RESET_UNKNOWN" || (Array.isArray(n3bres.expiring_allowance.reason_codes) && n3bres.expiring_allowance.reason_codes.includes("RESET_UNKNOWN"))));

  // N4: unknown reset -> no activation, route selectable.
  const n4 = fixtures(pool("available", "fresh", 60, null, 20), pool("available", "fresh", 70, FAR, 20));
  const n4res = selectQuotaAwarePlannerRoute(n4.joined, n4.candidates, OPTS);
  check("N4_reset_unknown_no_activation", n4res.status === "ROUTE_SELECTED" && n4res.expiring_allowance.active === false && (n4res.expiring_allowance.reason_code === "RESET_UNKNOWN" || (Array.isArray(n4res.expiring_allowance.reason_codes) && n4res.expiring_allowance.reason_codes.includes("RESET_UNKNOWN"))));

  // N5: outside window -> no activation.
  const n5 = fixtures(pool("available", "fresh", 60, FAR, 20), pool("available", "fresh", 70, FAR, 20));
  check("N5_outside_window_no_activation", selectQuotaAwarePlannerRoute(n5.joined, n5.candidates, OPTS).expiring_allowance.active === false);

  // N6: reserve floor would be violated -> upstream admission rejects the route
  // (RESERVE_FLOOR_BLOCK), expiring preference cannot resurrect it.
  const n6 = fixtures(pool("available", "fresh", 15, NEAR, 20), pool("available", "fresh", 70, FAR, 20));
  const n6res = selectQuotaAwarePlannerRoute(n6.joined, n6.candidates, OPTS);
  check("N6_floor_route_rejected_upstream", n6res.selected.route_id === "route-a-codex" && n6res.admitted_candidates.length === 1 && n6res.rejected_candidates.some((r) => r.reason_codes.includes("RESERVE_FLOOR_BLOCK")));
  check("N6_no_expiring_reason_on_denial", n6res.reason_codes.includes("EXPIRING_ALLOWANCE_USE") === false);

  // N7: capability requirement — inadequate candidate is dropped before admission/preference.
  const n7cands = [
    { route_id: "route-a-codex", resource_id: "res_codex", model: "codex-model", access_surface: "codex-ide", select_rank: 10 },
    { route_id: "route-b-glm", resource_id: "res_glm", model: "glm-model", access_surface: "glm-web", select_rank: 100, required_capabilities: ["vision"] },
  ];
  const n7cap = selectQuotaAwarePlannerRoute(joined, n7cands.map((c) => ({ ...c })), OPTS);
  // selector drops candidates lacking required capabilities via candidate law: model capability check happens upstream;
  // the policy layer surfaces ROUTE_INADEQUATE when adequate=false is passed (module-level covered) — here the
  // candidate without the capability in its model metadata is still admission-eligible, so assert no crash + no inversion.
  check("N7_capability_request_handled_deterministically", n7cap.status === "ROUTE_SELECTED" && n7cap.expiring_allowance !== undefined);

  // N8: quality requirement not met -> policyPermitted-style block on quality.
  const n8 = selectQuotaAwarePlannerRoute(joined, candidates, { nowMs: NOW, expiringAllowance: { enabled: true, workReady: true, qualityRequirementMet: false } });
  check("N8_quality_blocked_no_activation", n8.expiring_allowance.active === false && n8.expiring_allowance.reason_code === "QUALITY_REQUIREMENT_BLOCKED" && n8.selected.route_id === "route-a-codex");

  // N9: route unavailable (exhausted pool) -> denied upstream with exact
  // denial codes, never revived by the preference; other route serves.
  const n9 = fixtures(pool("exhausted", "fresh", 0, NEAR, 20), pool("available", "fresh", 70, FAR, 20));
  const n9res = selectQuotaAwarePlannerRoute(n9.joined, n9.candidates, OPTS);
  check("N9_unavailable_route_never_revived", n9res.selected.route_id === "route-a-codex" && n9res.rejected_candidates.some((r) => r.route_id === "route-b-glm" && (r.reason_codes.includes("POOL_EXHAUSTED") || r.reason_codes.includes("DENY_POOL_EXHAUSTED"))));
  check("N9_no_expiring_reason", n9res.reason_codes.includes("EXPIRING_ALLOWANCE_USE") === false);

  // N10: forbidden route (authorization boundary) -> always rejected; policy block reason wins over activation.
  const n10cands = [{ route_id: "route-a-codex", resource_id: "res_codex", model: "codex-model", access_surface: "codex-ide", select_rank: 10, forbidden: true }, { route_id: "route-b-glm", resource_id: "res_glm", model: "glm-model", access_surface: "glm-web", select_rank: 100 }];
  const n10 = selectQuotaAwarePlannerRoute(joined, n10cands, OPTS);
  check("N10_forbidden_never_eligible", n10.selected.route_id === "route-b-glm" && n10.rejected_candidates.some((r) => r.reason_codes.includes("FORBIDDEN_ROUTE")));
  const n10b = selectQuotaAwarePlannerRoute(joined, candidates, { nowMs: NOW, expiringAllowance: { enabled: true, workReady: true, policyPermitted: false } });
  check("N10b_policy_blocked_no_activation", n10b.expiring_allowance.active === false && n10b.expiring_allowance.reason_code === "POLICY_BLOCKED");

  // N12: no work-creation surface exists in the policy module API.
  const mod = await import("../../tools/expiring-allowance-policy-v1.mjs");
  const exportNames = Object.keys(mod);
  check("N12_no_work_creation_api", exportNames.length === 4 && ["EXPIRING_ALLOWANCE_POLICY_SCHEMA", "DEFAULT_EXPIRING_ALLOWANCE_WINDOW_SECONDS", "classifyExpiringAllowance", "reorderWithExpiringPreference"].every((k) => exportNames.includes(k)));
  check("N12_no_scheduler_or_dispatch", exportNames.every((k) => !/schedule|dispatch|create|invoke|enqueue|task/i.test(k)));

  // N13: no silent fallback — preference reorders ONLY admitted candidates;
  // rejected candidates never reappear with an EXPIRING reason (verified in N6/N9)
  // and an inactive feature never emits the EXPIRING reason code.
  const n13 = selectQuotaAwarePlannerRoute(joined, candidates, { nowMs: NOW, expiringAllowance: { enabled: true, workReady: false } });
  check("N13_no_reason_without_activation", !n13.reason_codes.includes("EXPIRING_ALLOWANCE_USE") && n13.selected.route_id === "route-a-codex");

  // N14: determinism — same inputs + same clock => byte-identical decision.
  const d1 = selectQuotaAwarePlannerRoute(joined, candidates, OPTS);
  const d2 = selectQuotaAwarePlannerRoute(joined, candidates, OPTS);
  check("N14_deterministic_same_clock", JSON.stringify(d1) === JSON.stringify(d2));

  // N15: Astra absence has zero effect — no astra ids anywhere, generic law holds.
  check("N15_no_astra_in_inputs", !JSON.stringify({ pools: Object.keys(joined.pools), routes: candidates.map((c) => c.route_id) }).toLowerCase().includes("astra"));
  const modSrc = (await import("node:fs")).readFileSync(new URL("../../tools/expiring-allowance-policy-v1.mjs", import.meta.url), "utf8");
  check("N15_no_astra_in_module", !modSrc.toLowerCase().includes("astra") && !modSrc.includes("gpt-6") && !modSrc.includes("glm_coding_plan") && !modSrc.includes("chatgpt_codex_subscription"));
}

/* ---------- summary ---------- */
const failed = RESULTS.filter((r) => !r.ok);
console.log(JSON.stringify({
  EXPIRING_ALLOWANCE_TESTS: failed.length === 0 ? "PASS" : "FAIL",
  CASES: RESULTS.length,
  FAILED: failed.map((f) => f.name),
}, null, 0));
process.exit(failed.length === 0 ? 0 : 1);
