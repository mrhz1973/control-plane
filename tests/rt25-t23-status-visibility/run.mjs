#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T23 runtime status/observability visibility. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwarePlannerRoute } from "../../tools/rt25-planner-quota-aware-selector-v1.mjs";
import { buildRouteQuotaProvenance } from "../../tools/rt25-route-quota-provenance-v1.mjs";
import { buildRt25RuntimeStatusVisibility } from "../../tools/rt25-runtime-status-visibility-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

const codexContribution = {
  schema_version: "v4-resource-status-contribution-v1",
  contribution_id: "rt25-codex-quota-chatgpt_codex_subscription-2026-09-05T15:58:00.000Z",
  producer_id: "rt25-quota-ingest-codex-v1",
  source: "dashboard_snapshot",
  produced_at: "2026-09-05T15:58:00.000Z",
  resources: {
    codex: {
      available: true,
      quota_remaining: { value: 62, unit: "percent" },
      reset_at: "2026-09-05T19:00:00.000Z",
      cost_mode: "included",
      location: "cloud",
      updated_at: "2026-09-05T15:58:00.000Z",
      evidence: { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" },
    },
  },
};

// Real chain artifacts (composer → join → selector → provenance)
const composed = await composeV4ResourceStatus(
  { registry, baseline, contributions: [codexContribution] },
  { nowMs: NOW },
);
const joined = joinQuotaPoolState(composed, registry, { nowMs: NOW });
const decision = selectQuotaAwarePlannerRoute(
  joined,
  [{ route_id: "codex-route", resource_id: "codex", model: "codex-ide", select_rank: 1 }],
  { nowMs: NOW, decision_id: "planner-vis-1" },
);
const provenance = buildRouteQuotaProvenance(decision, { nowMs: NOW });

// 1. full visibility over REAL chain artifacts
{
  const v = buildRt25RuntimeStatusVisibility(
    {
      composed,
      joined,
      decision,
      provenance,
      audit: { planner_log_path: "reports/runtime/rt25-decision-audit/planner.jsonl" },
    },
    { nowMs: NOW },
  );
  check(
    "full-visibility-real-chain",
    v.ok === true && v.visibility === "FULL" && v.components.length === 5 &&
      v.authorization_neutral === true && v.d0025_gate_state === "UNCHANGED_CLOSED",
    JSON.stringify({ vis: v.visibility, comps: v.components.map((c) => `${c.component}:${c.status}`) }),
  );
  const rd = v.components.find((c) => c.component === "route_decision");
  check(
    "decision-details-visible",
    rd.state === "VISIBLE" && rd.selected_route === "codex-route" &&
      rd.decision_id === "planner-vis-1" && rd.decision_status === "ROUTE_SELECTED",
    JSON.stringify(rd),
  );
}

// 2. missing inputs → explicit degraded components (fail-closed visibility)
{
  const v = buildRt25RuntimeStatusVisibility({}, { nowMs: NOW });
  check(
    "empty-inputs-none-visibility",
    v.ok === false && v.visibility === "NONE" &&
      v.components.every((c) => c.state === "DEGRADED") &&
      v.components.every((c) => Array.isArray(c.reason_codes) && c.reason_codes.length > 0),
    JSON.stringify(v.components.map((c) => c.component)),
  );
}

// 3. partial visibility names exactly the degraded component
{
  const v = buildRt25RuntimeStatusVisibility(
    { composed, joined, decision, provenance, audit: null },
    { nowMs: NOW },
  );
  const degraded = v.components.filter((c) => c.state === "DEGRADED").map((c) => c.component);
  check(
    "partial-names-degraded",
    v.visibility === "PARTIAL" && degraded.length === 1 && degraded[0] === "decision_audit",
    JSON.stringify(degraded),
  );
}

// 4. blocked decision still visible (with reason codes), not hidden
{
  const composedEmpty = await composeV4ResourceStatus({ registry, baseline, contributions: [] }, { nowMs: NOW });
  const joinedEmpty = joinQuotaPoolState(composedEmpty, registry, { nowMs: NOW });
  const blockedDecision = selectQuotaAwarePlannerRoute(
    joinedEmpty,
    [{ route_id: "codex-route", resource_id: "codex", model: "codex-ide" }],
    { nowMs: NOW },
  );
  const v = buildRt25RuntimeStatusVisibility(
    { composed: composedEmpty, joined: joinedEmpty, decision: blockedDecision, provenance: buildRouteQuotaProvenance(blockedDecision, { nowMs: NOW }), audit: null },
    { nowMs: NOW },
  );
  const rd = v.components.find((c) => c.component === "route_decision");
  const pp = v.components.find((c) => c.component === "packet_quota_provenance");
  check(
    "blocked-decision-visible-with-reasons",
    rd.state === "VISIBLE" && rd.decision_status === "NO_ROUTE_SELECTED" && Array.isArray(rd.reason_codes) && rd.reason_codes.length > 0 &&
      pp.state === "VISIBLE" && pp.present === false,
    JSON.stringify({ rd, pp }),
  );
}

// 5. pool evaluations visible incl. non-healthy pools named
{
  const v = buildRt25RuntimeStatusVisibility({ composed, joined }, { nowMs: NOW });
  const ps = v.components.find((c) => c.component === "quota_pool_state_join");
  check(
    "pool-evaluations-visible",
    ps.state === "VISIBLE" && ps.pools >= 1 && typeof ps.evaluations === "object" && "chatgpt_codex_subscription" in ps.evaluations,
    JSON.stringify(ps),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
