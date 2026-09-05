#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T18 reviewer selector. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwareReviewerRoute } from "../../tools/rt25-reviewer-quota-aware-selector-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

function contribution(resourceId, value, extra = {}) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `c-${resourceId}`,
    producer_id: "rt25-tests",
    source: extra.source || "dashboard_snapshot",
    produced_at: "2026-09-05T15:58:00.000Z",
    resources: {
      [resourceId]: {
        available: value !== 0,
        quota_remaining: { value, unit: extra.unit || "percent" },
        reset_at: "2026-09-05T19:00:00.000Z",
        cost_mode: extra.cost_mode || "included",
        location: extra.location || "cloud",
        updated_at: "2026-09-05T15:58:00.000Z",
        evidence: extra.source === "local_probe"
          ? { kind: "qwen_occupancy", classification: "QWEN_READY_IDLE", launch_performed: false, generation_calls: 0 }
          : { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" },
      },
    },
  };
}

async function joinedFor(contributions, opts = {}) {
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions }, { nowMs: NOW });
  return joinQuotaPoolState(composed, registry, { nowMs: NOW, ...opts });
}

// 1. independent reviewer preferred (glm reviewer while implementer is codex-ide)
{
  const joined = await joinedFor([contribution("codex", 62), contribution("glm", 55)]);
  const d = selectQuotaAwareReviewerRoute(
    joined,
    [
      { route_id: "rev-codex", resource_id: "codex", model: "codex-ide", select_rank: 10 },
      { route_id: "rev-glm", resource_id: "glm", model: "glm-5.3", select_rank: 20 },
    ],
    { implementer_model: "codex-ide", nowMs: NOW },
  );
  check(
    "independent-reviewer-preferred",
    d.ok === true && d.status === "ROUTE_SELECTED" && d.selected.route_id === "rev-glm" &&
      d.reason_codes.includes("REVIEWER_INDEPENDENT_OF_IMPLEMENTER") &&
      d.rejected_candidates.some((r) => r.reason_codes.includes("REVIEWER_INDEPENDENCE_PREFERENCE_SAME_MODEL_DEMOTED")),
    JSON.stringify({ s: d.selected?.route_id, rc: d.reason_codes, rej: d.rejected_candidates }),
  );
}

// 2. reviewer candidates all blocked (stale pools) → fail-closed NO_ROUTE_SELECTED
{
  const staleCodex = contribution("codex", 62);
  staleCodex.produced_at = "2026-09-05T14:00:00.000Z";
  staleCodex.resources.codex.updated_at = "2026-09-05T14:00:00.000Z";
  const joined = await joinedFor([staleCodex]);
  const d = selectQuotaAwareReviewerRoute(joined, [
    { route_id: "rev-codex", resource_id: "codex", model: "codex-ide", select_rank: 10 },
  ], { implementer_model: "codex-ide", nowMs: NOW });
  check(
    "reviewer-fail-closed-stale",
    d.ok === false && d.status === "NO_ROUTE_SELECTED" && d.rejected_candidates.some((r) => r.reason_codes.includes("CONSERVE_UNKNOWN_STALE")),
    JSON.stringify(d.reason_codes),
  );
}

// 3. reviewer NOT forced to reuse implementer: local qwen admitted as reviewer when fresh
{
  const joined = await joinedFor([contribution("qwen_local", null, { source: "local_probe", unit: "unlimited", location: "local", cost_mode: "free" })]);
  const d = selectQuotaAwareReviewerRoute(joined, [
    { route_id: "rev-qwen", resource_id: "qwen_local", model: "qwen-local", select_rank: 40 },
  ], { implementer_model: "codex-ide", nowMs: NOW });
  check(
    "local-reviewer-usable",
    d.ok === true && d.selected.route_id === "rev-qwen" && d.reason_codes.includes("REVIEWER_INDEPENDENT_OF_IMPLEMENTER"),
    JSON.stringify(d.reason_codes),
  );
}

// 4. same-model-only case is explicit, never silent
{
  const joined = await joinedFor([contribution("codex", 62)]);
  const d = selectQuotaAwareReviewerRoute(joined, [
    { route_id: "rev-codex", resource_id: "codex", model: "codex-ide", select_rank: 10 },
  ], { implementer_model: "codex-ide", nowMs: NOW });
  check(
    "same-model-explicit",
    d.ok === true && d.reason_codes.includes("REVIEWER_SAME_MODEL_AS_IMPLEMENTER_ONLY_ADMITTED"),
    JSON.stringify(d.reason_codes),
  );
}

// 5. pool evidence propagates for reviewer audit
{
  const joined = await joinedFor([contribution("glm", 55)]);
  const d = selectQuotaAwareReviewerRoute(joined, [
    { route_id: "rev-glm", resource_id: "glm", model: "glm-5.3", select_rank: 10 },
  ], { nowMs: NOW });
  check("pool-evidence-propagates", d.pool_evaluations.glm_coding_plan?.evaluation === "POOL_HEALTHY");
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
