#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T05 freshness fail-closed enforcement. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { enforcePoolFreshness, enforceResourcePool } from "../../tools/rt25-quota-freshness-enforcement-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 200) });
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

// 1. healthy pool → ALLOWED
{
  const joined = await joinedFor([codexContribution(62)]);
  const e = enforceResourcePool(joined, "codex");
  check("healthy-allowed", e.allowed === true && e.enforcement === "ALLOWED_FRESH_WITHIN_RESERVE", JSON.stringify(e));
}

// 2. missing evidence → BLOCKED
{
  const joined = await joinedFor([]);
  const e = enforceResourcePool(joined, "codex");
  check("missing-blocked", e.allowed === false && e.enforcement === "CONSERVE_UNKNOWN_MISSING", JSON.stringify(e));
}

// 3. stale evidence → BLOCKED
{
  const stale = codexContribution(62);
  stale.produced_at = "2026-09-05T14:00:00.000Z";
  stale.resources.codex.updated_at = "2026-09-05T14:00:00.000Z";
  const joined = await joinedFor([stale]);
  const e = enforceResourcePool(joined, "codex");
  check("stale-blocked", e.allowed === false && e.enforcement === "CONSERVE_UNKNOWN_STALE", JSON.stringify(e));
}

// 4. reserve floor → BLOCKED (policy input only)
{
  const joined = await joinedFor([codexContribution(12)], {
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
  });
  const e = enforceResourcePool(joined, "codex");
  check("reserve-blocked", e.allowed === false && e.enforcement === "RESERVE_FLOOR_BLOCK", JSON.stringify(e));
}

// 5. exhausted → BLOCKED
{
  const joined = await joinedFor([codexContribution(0, false)]);
  const e = enforceResourcePool(joined, "codex");
  check("exhausted-blocked", e.allowed === false && e.enforcement === "POOL_EXHAUSTED", JSON.stringify(e));
}

// 6. no-pool resource → allowed with explicit NO_POOL enforcement (local lane unaffected)
{
  const joined = await joinedFor([codexContribution(62)]);
  const e = enforceResourcePool(joined, "qwen_local");
  check("no-pool-resource-passes", e.allowed === true && e.enforcement === "NO_POOL_BINDING" && e.reason_codes[0] === "NO_POOL_LOCAL_UNMETERED", JSON.stringify(e));
}

// 7. invalid join state → BLOCKED
{
  const e = enforceResourcePool({ schema_version: "bogus", ok: true }, "codex");
  check("invalid-join-blocked", e.allowed === false && e.enforcement === "CONSERVE_UNKNOWN_MISSING");
}

// 8. raw pool evaluation enforcement paths
{
  const a = enforcePoolFreshness(null);
  const b = enforcePoolFreshness({ evaluation: "WEIRD" });
  const c = enforcePoolFreshness({ evaluation: "POOL_HEALTHY" });
  check(
    "raw-paths",
    a.enforcement === "CONSERVE_UNKNOWN_MISSING" && b.allowed === false && b.enforcement === "CONSERVE_UNKNOWN_STATE" && c.allowed === true,
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
