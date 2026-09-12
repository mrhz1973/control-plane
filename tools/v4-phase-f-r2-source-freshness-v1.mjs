#!/usr/bin/env node
/**
 * V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1 — R2 fresh-source
 * coverage matrix (GAP R2).
 *
 * Answers, per commercial resource domain, the readiness packet's six source
 * questions from EXISTING implementation law (no new schema, no new
 * observatory, no scraping, no private endpoints):
 *
 *   SOURCE_IMPLEMENTED / SOURCE_MACHINE_READABLE / SOURCE_FRESHNESS_PROVEN /
 *   SOURCE_TTL_PROVEN / SOURCE_RESET_SEMANTICS_PROVEN / FAIL_CLOSED_WHEN_UNAVAILABLE
 *
 * Determination basis (repository canon, read-only):
 *   - codex pool  : rt25-quota-ingest-codex-v1 (MANUAL_DASHBOARD_ONLY source
 *     law; deterministic translator; freshness TTL enforced by composer/join);
 *     machine-readable monitor automation is NOT implemented — the source is
 *     an operator dashboard snapshot consumed through the standard lane.
 *   - glm pool    : rt25-quota-ingest-glm-v1 (documented read-only monitor
 *     endpoint implemented; requires operator-provisioned credential which is
 *     absent -> runtime outcome is fail-closed UNKNOWN; manual snapshot lane).
 *   - qwen_local  : local unmetered; local_probe/occupancy collector exists
 *     (collect-qwen-local-resource-status-v1) — no commercial freshness claim.
 *   - chatgpt_web : SEPARATE_AVAILABILITY_DOMAIN; observed availability only;
 *     never a quota pool (registry + observatory law).
 *   - cursor      : registry quota_pool_id=null, allowance unverified — no
 *     stable pool identity; manual bounded observation only (no invented
 *     mapping).
 *
 * The future promoted route (qwen_local -> hermes -> chatgpt_web) relies on
 * qwen_local (local) and chatgpt_web (availability domain): NEITHER carries a
 * commercial freshness dependency. Commercial pools (codex/glm) gate DIRECT
 * commercial routes through RT25, where missing/stale/unknown evidence is
 * fail-closed by construction (T04/T05 proven). R2 therefore closes as:
 * the admission decision for the future route never RELIES on unproven
 * automatic fresh commercial coverage — it either has fresh evidence or
 * fail-closes, with the operator manual path bounded and supported.
 */

export const R2_MATRIX_SCHEMA = "v4-phase-f-r2-source-freshness-matrix-v1";

const MATRIX = Object.freeze({
  codex: {
    quota_pool_id: "chatgpt_codex_subscription",
    source_law: "MANUAL_DASHBOARD_ONLY",
    implemented_by: "tools/rt25-quota-ingest-codex-v1.mjs",
    source_implemented: true,
    source_machine_readable: false,
    machine_readable_gap: "automatic collector absent; operator dashboard snapshot consumed through deterministic translator",
    freshness_proven: true,
    freshness_evidence: "tests/rt25-t04 + tests/rt25-t05 + tests/rt25-t02 (stale snapshot -> INGEST_FAIL_CLOSED_STALE; TTL 300s enforced at join)",
    ttl_proven: true,
    ttl_evidence: "STATUS_MAX_AGE_MS=300000 enforced by compose/rt25-quota-state-join (classifyResourceQuota ageOk)",
    reset_semantics_proven: true,
    reset_evidence: "window reset_at carried from snapshot when sourced from evidence; never invented (translate-quota-pool-snapshot-v1 law)",
    fail_closed_when_unavailable: true,
    fail_closed_evidence: "missing -> CONSERVE_UNKNOWN_MISSING; stale -> CONSERVE_UNKNOWN_STALE; invalid -> INGEST_REJECTED_* (all block admission via T05/T06)",
    dependency_of_future_promoted_route: false,
    dependency_note: "codex gates DIRECT commercial preference only; the degraded route selected by Phase E does not rely on codex freshness",
  },
  glm: {
    quota_pool_id: "glm_coding_plan",
    source_law: "MACHINE_STATUS_SOURCE_CONFIRMED_CREDENTIAL_PENDING",
    implemented_by: "tools/rt25-quota-ingest-glm-v1.mjs",
    source_implemented: true,
    source_machine_readable: true,
    machine_readable_gap: "documented read-only monitor endpoint implemented; automation inactive because operator credential is not provisioned (by policy, not by defect)",
    freshness_proven: true,
    freshness_evidence: "tests/rt25-t03 (monitor normalization -> fresh windows; absent credential -> fail-closed UNKNOWN ingest)",
    ttl_proven: true,
    ttl_evidence: "same central TTL law (STATUS_MAX_AGE_MS) enforced at join for all pools",
    reset_semantics_proven: true,
    reset_evidence: "monitor payload nextResetTime -> window reset_at (5h rolling + weekly); unknown units skipped, never invented",
    fail_closed_when_unavailable: true,
    fail_closed_evidence: "CREDENTIAL_ABSENT_FAIL_CLOSED / INGEST_FAIL_CLOSED_UNKNOWN_NO_EVIDENCE (valid fail-closed runtime outcome)",
    dependency_of_future_promoted_route: false,
    dependency_note: "glm is not a Phase E candidate surface; INELIGIBLE_BY_OPERATOR_POLICY window consumed deterministically",
  },
  qwen_local: {
    quota_pool_id: null,
    source_law: "LOCAL_UNMETERED_LOCAL_PROBE",
    implemented_by: "tools/collect-qwen-local-resource-status-v1.mjs",
    source_implemented: true,
    source_machine_readable: true,
    machine_readable_gap: null,
    freshness_proven: true,
    freshness_evidence: "local_probe source class with observed_at; freshness classification at join (same TTL law)",
    ttl_proven: true,
    ttl_evidence: "central STATUS_MAX_AGE_MS law applies to every composer entry including local_probe",
    reset_semantics_proven: true,
    reset_evidence: "no commercial window: quota_remaining unit=unlimited with local compute availability semantics; reset_at null by contract (not an invented value)",
    fail_closed_when_unavailable: true,
    fail_closed_evidence: "probe failure -> available=false -> Phase E QWEN_LOCAL_UNAVAILABLE_OR_INADEQUATE defer (E7)",
    dependency_of_future_promoted_route: true,
    dependency_note: "controller of the future promoted route; coverage proven via local probe collector (machine-readable)",
  },
  chatgpt_web: {
    quota_pool_id: null,
    source_law: "SEPARATE_AVAILABILITY_DOMAIN",
    implemented_by: "tools/local-dev-resource-observatory-v1.mjs (collectChatgptWebObservation)",
    source_implemented: true,
    source_machine_readable: true,
    machine_readable_gap: null,
    freshness_proven: true,
    freshness_evidence: "observation carries observed_at + freshness classification; Phase E requires freshness=fresh for admission (E6/E5 law)",
    ttl_proven: true,
    ttl_evidence: "QUOTA_DISPLAY_FRESH_MS classification in observatory; stale observation -> admission refused",
    reset_semantics_proven: true,
    reset_evidence: "no quota pool exists (registry quota_pool_id=null): no reset semantics are claimed or needed; availability-only domain",
    fail_closed_when_unavailable: true,
    fail_closed_evidence: "unavailable/unauthenticated/throttled -> CHATGPT_WEB_UNAVAILABLE_OR_STALE defer (E6); never unlimited/free claims",
    dependency_of_future_promoted_route: true,
    dependency_note: "target surface of the future promoted route; coverage proven via observatory observation contract",
  },
  cursor: {
    quota_pool_id: null,
    source_law: "NO_POOL_BINDING_ALLOWANCE_UNVERIFIED",
    implemented_by: "configs/resources/registry.json (cursor_native_model_route)",
    source_implemented: false,
    source_machine_readable: false,
    machine_readable_gap: "no stable pool identity / model-to-bucket mapping; manual observation is bounded and preserved; mapping must not be invented",
    freshness_proven: false,
    freshness_evidence: "manual operator observation only (CURSOR_USAGE_SOURCE=OPERATOR_MANUAL_OBSERVATION)",
    ttl_proven: false,
    ttl_evidence: "reset date observed manually (DATE_ONLY precision); no machine TTL",
    reset_semantics_proven: false,
    reset_evidence: "plan reset date manual; time-of-day NOT_OBSERVED — explicitly not invented",
    fail_closed_when_unavailable: true,
    fail_closed_evidence: "registry pool binding null -> NO_POOL_/no commercial admission path at all; cannot silently enable any route",
    dependency_of_future_promoted_route: false,
    dependency_note: "cursor is a harness surface, not part of the future promoted route",
  },
});

/**
 * R2 determination. Pure and deterministic.
 * Future-route readiness = every resource the promoted route depends on has
 * proven coverage OR deterministic fail-closed behavior, and every commercial
 * pool gates through proven fail-closed freshness enforcement.
 */
export function buildR2SourceFreshnessMatrix(options = {}) {
  const domains = {};
  for (const [id, d] of Object.entries(MATRIX)) {
    domains[id] = { ...d };
  }
  const routeDependencies = Object.entries(MATRIX).filter(([, d]) => d.dependency_of_future_promoted_route);
  const routeDependenciesProven = routeDependencies.every(([, d]) =>
    d.source_implemented === true && d.source_machine_readable === true &&
    d.freshness_proven === true && d.fail_closed_when_unavailable === true);

  const commercialPools = ["codex", "glm"];
  const commercialFailClosed = commercialPools.every((id) => MATRIX[id].fail_closed_when_unavailable === true);

  const admitted_to_pass = routeDependenciesProven && commercialFailClosed;

  return {
    schema_version: R2_MATRIX_SCHEMA,
    evaluated_at: new Date(typeof options.nowMs === "number" && options.nowMs ? options.nowMs : Date.now()).toISOString(),
    no_parallel_schema: true,
    no_scraping: true,
    no_private_undocumented_endpoints: true,
    domains,
    route_dependencies: routeDependencies.map(([id]) => id),
    route_dependencies_proven: routeDependenciesProven,
    commercial_pools_fail_closed: commercialFailClosed,
    manual_bounded_observation_preserved: ["codex", "glm", "cursor"],
    r2_source_freshness_readiness: admitted_to_pass ? "PASS" : "UNKNOWN",
    basis: admitted_to_pass
      ? "The future promoted route depends only on qwen_local (proven machine-readable local probe) and chatgpt_web (proven availability observation); commercial pools gate direct routes through proven fail-closed freshness enforcement (T04/T05/T06). Every unautomatable source (codex manual snapshot, glm credential-gated monitor, cursor manual observation) fails closed to UNKNOWN and never becomes capacity."
      : "One or more route dependencies or fail-closed proofs are unproven; readiness remains UNKNOWN.",
  };
}
