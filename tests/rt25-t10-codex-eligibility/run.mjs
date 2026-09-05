#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T10 Codex subscription runtime eligibility. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { evaluateCodexRouteEligibility } from "../../tools/rt25-codex-eligibility-v1.mjs";

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

const IDE_ROUTE = {
  route_id: "codex-ide-route",
  access_surface: "codex_ide_cursor_extension",
  auth: "chatgpt_subscription",
  resource_id: "codex",
};

// 1. qualified surface + fresh pool + subscription auth → ELIGIBLE
{
  const joined = await joinedFor([codexContribution(62)]);
  const e = evaluateCodexRouteEligibility(registry, joined, IDE_ROUTE);
  check("eligible-happy-path", e.eligible === true && e.eligibility === "ELIGIBLE_SUBSCRIPTION_FRESH_WITHIN_RESERVE", JSON.stringify(e));
}

// 2. OpenAI API key auth → structurally ineligible even though surface qualified
{
  const joined = await joinedFor([codexContribution(62)]);
  const e = evaluateCodexRouteEligibility(registry, joined, { ...IDE_ROUTE, auth: "openai_api_key" });
  check("api-key-structurally-ineligible", e.eligible === false && e.eligibility === "INELIGIBLE_AUTH_NOT_ALLOWED", JSON.stringify(e));
}

// 3. BYOK auth → structurally ineligible
{
  const joined = await joinedFor([codexContribution(62)]);
  const e = evaluateCodexRouteEligibility(registry, joined, { ...IDE_ROUTE, auth: "byok_openai" });
  check("byok-structurally-ineligible", e.eligible === false && e.eligibility === "INELIGIBLE_AUTH_NOT_ALLOWED");
}

// 4. unknown surface → ineligible
{
  const joined = await joinedFor([codexContribution(62)]);
  const e = evaluateCodexRouteEligibility(registry, joined, { ...IDE_ROUTE, access_surface: "nonexistent_surface" });
  check("unknown-surface-ineligible", e.eligible === false && e.eligibility === "INELIGIBLE_SURFACE_UNKNOWN");
}

// 5. non-codex surface bound to another pool → wrong pool binding
{
  const joined = await joinedFor([codexContribution(62)]);
  const e = evaluateCodexRouteEligibility(registry, joined, { ...IDE_ROUTE, access_surface: "glm_coding_plan_client" });
  check("wrong-pool-binding-ineligible", e.eligible === false && e.eligibility === "INELIGIBLE_NOT_CODEX_SUBSCRIPTION_SURFACE", JSON.stringify(e));
}

// 6. stale pool → ineligible CONSERVE_UNKNOWN_STALE
{
  const stale = codexContribution(62);
  stale.produced_at = "2026-09-05T14:00:00.000Z";
  stale.resources.codex.updated_at = "2026-09-05T14:00:00.000Z";
  const joined = await joinedFor([stale]);
  const e = evaluateCodexRouteEligibility(registry, joined, IDE_ROUTE);
  check("stale-pool-ineligible", e.eligible === false && e.eligibility === "INELIGIBLE_DENY_CONSERVE_UNKNOWN_STALE", JSON.stringify(e));
}

// 7. reserve floor → ineligible
{
  const joined = await joinedFor([codexContribution(12)], {
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
  });
  const e = evaluateCodexRouteEligibility(registry, joined, IDE_ROUTE);
  check("reserve-ineligible", e.eligible === false && e.eligibility === "INELIGIBLE_DENY_RESERVE_FLOOR_BLOCK", JSON.stringify(e));
}

// 8. no evidence → ineligible MISSING
{
  const joined = await joinedFor([]);
  const e = evaluateCodexRouteEligibility(registry, joined, IDE_ROUTE);
  check("missing-evidence-ineligible", e.eligible === false && e.eligibility === "INELIGIBLE_DENY_CONSERVE_UNKNOWN_MISSING");
}

// 9. external planner surface also eligible when fresh (subscription-shared pool)
{
  const joined = await joinedFor([codexContribution(62)]);
  const e = evaluateCodexRouteEligibility(registry, joined, {
    route_id: "codex-ext-route",
    access_surface: "codex_external_planner",
    auth: "chatgpt_subscription",
    resource_id: "codex",
  });
  check("external-planner-eligible", e.eligible === true, JSON.stringify(e));
}

// 10. invalid registry/join guards
{
  const a = evaluateCodexRouteEligibility(null, {}, IDE_ROUTE);
  const joined = await joinedFor([codexContribution(62)]);
  const b = evaluateCodexRouteEligibility({ bogus: true }, joined, IDE_ROUTE);
  check("guards", a.eligibility === "INELIGIBLE_REGISTRY_INVALID" && b.eligibility === "INELIGIBLE_REGISTRY_INVALID");
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
