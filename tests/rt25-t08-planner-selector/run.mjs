#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T08 planner quota-aware selector. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwarePlannerRoute } from "../../tools/rt25-planner-quota-aware-selector-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

function codexContribution(value, available = true) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: "rt25-codex-quota-chatgpt_codex_subscription-2026-09-05T15:58:00.000Z",
    producer_id: "rt25-quota-ingest-codex-v1",
    source: "dashboard_snapshot",
    produced_at: "2026-09-05T15:58:00.000Z",
    resources: {
      codex: {
        available,
        quota_remaining: { value, unit: "percent" },
        reset_at: "2026-09-05T19:00:00.000Z",
        cost_mode: "included",
        location: "cloud",
        updated_at: "2026-09-05T15:58:00.000Z",
        evidence: { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" },
      },
    },
  };
}

async function joinedFor(contributions, opts = {}) {
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions }, { nowMs: NOW });
  return joinQuotaPoolState(composed, registry, { nowMs: NOW, ...opts });
}

const CANDIDATES = [
  { route_id: "codex-ide-planner", resource_id: "codex", model: "codex-ide", access_surface: "codex_ide_cursor_extension", select_rank: 10 },
  { route_id: "glm-planner", resource_id: "glm", model: "glm-5.3", access_surface: "glm_coding_plan_cli", select_rank: 20 },
  { route_id: "qwen-local-planner", resource_id: "qwen_local", model: "qwen-local", access_surface: "local_harness", select_rank: 30 },
];

// 1. healthy pools → best-rank admitted route selected deterministically
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwarePlannerRoute(joined, CANDIDATES, { nowMs: NOW });
  check(
    "selects-best-rank",
    d.ok === true && d.status === "ROUTE_SELECTED" && d.selected.route_id === "codex-ide-planner" && d.selected.quota_pool_id === "chatgpt_codex_subscription",
    JSON.stringify({ s: d.selected?.route_id, rc: d.reason_codes }),
  );
}

// 2. codex pool stale → codex rejected, glm ALSO stale (no evidence) → falls to qwen local
{
  const stale = codexContribution(62);
  stale.produced_at = "2026-09-05T14:00:00.000Z";
  stale.resources.codex.updated_at = "2026-09-05T14:00:00.000Z";
  const joined = await joinedFor([stale]);
  const d = selectQuotaAwarePlannerRoute(joined, CANDIDATES, { nowMs: NOW });
  check(
    "stale-cloud-falls-to-local",
    d.ok === true && d.selected.route_id === "qwen-local-planner" && d.selected.quota_pool_id === null &&
      d.rejected_candidates.some((r) => r.route_id === "codex-ide-planner" && r.reason_codes.includes("CONSERVE_UNKNOWN_STALE")),
    JSON.stringify({ s: d.selected?.route_id, rej: d.rejected_candidates }),
  );
}

// 3. reserve floor respected at selection boundary
{
  const joined = await joinedFor([codexContribution(12)], {
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
  });
  const d = selectQuotaAwarePlannerRoute(joined, CANDIDATES, { nowMs: NOW });
  check(
    "reserve-redirects-selection",
    d.ok === true && d.selected.route_id === "qwen-local-planner" &&
      d.rejected_candidates.some((r) => r.route_id === "codex-ide-planner" && r.reason_codes.includes("RESERVE_FLOOR_BLOCK")),
    JSON.stringify({ s: d.selected?.route_id }),
  );
}

// 4. forbidden route never selected even with best rank
{
  const joined = await joinedFor([codexContribution(62)]);
  const cands = [
    { route_id: "openai-api-planner", resource_id: "codex", model: "gpt-x", access_surface: "openai_api", select_rank: 1, forbidden: true },
    ...CANDIDATES,
  ];
  const d = selectQuotaAwarePlannerRoute(joined, cands, { nowMs: NOW });
  check(
    "forbidden-never-selected",
    d.ok === true && d.selected.route_id === "codex-ide-planner" &&
      d.rejected_candidates.some((r) => r.route_id === "openai-api-planner" && r.reason_codes.includes("FORBIDDEN_ROUTE")),
    JSON.stringify({ s: d.selected?.route_id }),
  );
}

// 5. shared pool evaluated once (two routes on same resource → one pool_evaluation entry)
{
  const joined = await joinedFor([codexContribution(62)]);
  const cands = [
    { route_id: "codex-ide-planner", resource_id: "codex", select_rank: 10 },
    { route_id: "codex-ext-planner", resource_id: "codex", select_rank: 11 },
  ];
  const d = selectQuotaAwarePlannerRoute(joined, cands, { nowMs: NOW });
  check(
    "shared-pool-single-evaluation",
    d.ok === true && Object.keys(d.pool_evaluations).length === 1 && d.admitted_candidates.length === 2,
    JSON.stringify({ pools: Object.keys(d.pool_evaluations), adm: d.admitted_candidates.length }),
  );
}

// 6. no evidence anywhere + no local → fail-closed NO_ROUTE_SELECTED
{
  const joined = await joinedFor([]);
  const d = selectQuotaAwarePlannerRoute(joined, [
    { route_id: "codex-ide-planner", resource_id: "codex", select_rank: 10 },
    { route_id: "glm-planner", resource_id: "glm", select_rank: 20 },
  ], { nowMs: NOW });
  check(
    "no-evidence-fail-closed",
    d.ok === false && d.status === "NO_ROUTE_SELECTED" && d.selected === null && d.reason_codes.includes("ALL_CANDIDATES_REJECTED"),
    JSON.stringify(d.reason_codes),
  );
}

// 7. invalid joined state → fail closed
{
  const d = selectQuotaAwarePlannerRoute({ bogus: 1 }, CANDIDATES, { nowMs: NOW });
  check("invalid-join-fail-closed", d.status === "NO_ROUTE_SELECTED" && d.reason_codes.includes("JOIN_STATE_INVALID"));
}

// 8. malformed candidate rejected without breaking others
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwarePlannerRoute(joined, [{ route_id: "x" }, CANDIDATES[0]], { nowMs: NOW });
  check(
    "malformed-candidate-rejected",
    d.ok === true && d.rejected_candidates.some((r) => r.reason_codes.includes("CANDIDATE_MALFORMED")) && d.selected.route_id === "codex-ide-planner",
  );
}

// 9. tie-break deterministic (same rank → lexical route_id)
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwarePlannerRoute(joined, [
    { route_id: "b-route", resource_id: "codex", select_rank: 10 },
    { route_id: "a-route", resource_id: "codex", select_rank: 10 },
  ], { nowMs: NOW });
  check("tie-break-lexical", d.ok === true && d.selected.route_id === "a-route", JSON.stringify(d.selected?.route_id));
}

// 10. economics attached to decision for pool routes
{
  const joined = await joinedFor([codexContribution(62)], {
    economics: { chatgpt_codex_subscription: { verified: true, payload: { effective_multiplier: 1.5 } } },
  });
  const d = selectQuotaAwarePlannerRoute(joined, CANDIDATES, { nowMs: NOW });
  check(
    "economics-in-decision",
    d.ok === true && d.economics_attachments.chatgpt_codex_subscription?.verified === true,
    JSON.stringify(d.economics_attachments),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
