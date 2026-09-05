#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T14 urgency/defer guard. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwarePlannerRoute } from "../../tools/rt25-planner-quota-aware-selector-v1.mjs";
import { guardUrgencyDeferral } from "../../tools/rt25-urgency-defer-guard-v1.mjs";

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
        reset_at: "2026-09-05T19:00:00.000Z", // future vs NOW
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

async function selectedDecision() {
  const joined = await joinedFor([codexContribution(8)]);
  return selectQuotaAwarePlannerRoute(joined, [
    { route_id: "codex-route", resource_id: "codex", model: "codex-ide", select_rank: 1 },
  ], { nowMs: NOW });
}

// 1. urgent + selected route → RUN NOW, defer NEVER
{
  const d = await selectedDecision();
  const g = guardUrgencyDeferral(d, { urgent: true }, { nowMs: NOW, defer_policy: { allowed: true, policy_ref: "defer-v1" } });
  check("urgent-never-deferred", g.defer_allowed === false && g.guard === "GUARD_URGENT_RUN_NOW" && g.reason_codes[0] === "URGENT_NEVER_DEFERRED", JSON.stringify(g));
}

// 2. urgent + no route (quota blocked) → still RUN/BLOCKED, never deferred
{
  const joined = await joinedFor([]);
  const d = selectQuotaAwarePlannerRoute(joined, [{ route_id: "codex-route", resource_id: "codex", model: "codex-ide" }], { nowMs: NOW });
  const g = guardUrgencyDeferral(d, { urgent: true }, { nowMs: NOW });
  check("urgent-no-route-still-run", g.defer_allowed === false && g.guard === "GUARD_URGENT_RUN_NOW");
}

// 3. non-urgent + no policy → deny defer
{
  const d = await selectedDecision();
  const g = guardUrgencyDeferral(d, { urgent: false }, { nowMs: NOW });
  check("no-policy-no-defer", g.defer_allowed === false && g.guard === "GUARD_DEFER_NO_POLICY", JSON.stringify(g));
}

// 4. non-urgent + policy but NO known future reset → deny (window unknown)
{
  // real chain: contribution WITHOUT reset evidence → decision envelope has no reset_at
  const noReset = codexContribution(8);
  noReset.resources.codex.reset_at = null;
  const joined = await joinedFor([noReset]);
  const d = selectQuotaAwarePlannerRoute(joined, [{ route_id: "codex-route", resource_id: "codex", model: "codex-ide" }], { nowMs: NOW });
  const g = guardUrgencyDeferral(d, { urgent: false }, {
    nowMs: NOW,
    defer_policy: { allowed: true, policy_ref: "defer-v1" },
  });
  check("no-reset-evidence-no-defer", g.defer_allowed === false && g.guard === "GUARD_DEFER_NO_KNOWN_RESET_WINDOW", JSON.stringify(g));
}

// 5. non-urgent + policy + future reset observed (from pool evaluation) → defer allowed
{
  const d = await selectedDecision();
  const g = guardUrgencyDeferral(d, { urgent: false }, {
    nowMs: NOW,
    defer_policy: { allowed: true, policy_ref: "defer-v1" },
  });
  check(
    "policy+reset-allows-defer",
    g.defer_allowed === true && g.guard === "GUARD_DEFER_ALLOWED_POLICY_AND_RESET_KNOWN" && g.known_reset_at === "2026-09-05T19:00:00.000Z",
    JSON.stringify(g),
  );
}

// 6. past reset_at is NOT a future window
{
  const d = await selectedDecision();
  const g = guardUrgencyDeferral(d, { urgent: false }, {
    nowMs: NOW,
    defer_policy: { allowed: true, policy_ref: "defer-v1" },
    selected_reset_at: "2026-09-05T15:00:00.000Z",
  });
  check("past-reset-no-defer", g.defer_allowed === false && g.reason_codes.includes("NO_FUTURE_RESET_EVIDENCE"));
}

// 7. invalid envelope guard
{
  const g = guardUrgencyDeferral(null, { urgent: false }, { nowMs: NOW });
  check("invalid-envelope", g.defer_allowed === false && g.guard === "GUARD_DECISION_ENVELOPE_INVALID");
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
