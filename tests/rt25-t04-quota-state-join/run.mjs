#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T04 quota-state join (real composer output). */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 240) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

function codexContribution(value, available = true) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `rt25-codex-quota-chatgpt_codex_subscription-2026-09-05T15:58:00.000Z`,
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

// 1. healthy codex pool joins as POOL_HEALTHY from REAL composer output
{
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [codexContribution(62)] }, { nowMs: NOW });
  const joined = joinQuotaPoolState(composed, registry, { nowMs: NOW });
  check(
    "healthy-pool-joined",
    joined.ok === true &&
      joined.pools.chatgpt_codex_subscription?.evaluation === "POOL_HEALTHY" &&
      joined.resources.codex?.quota_pool_id === "chatgpt_codex_subscription" &&
      joined.pools.chatgpt_codex_subscription?.remaining_percent === 62,
    JSON.stringify(joined.pools),
  );
}

// 2. no valid contribution → composer fail-closed → join CONSERVE_UNKNOWN_MISSING
{
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [] }, { nowMs: NOW });
  const joined = joinQuotaPoolState(composed, registry, { nowMs: NOW });
  check(
    "missing-evidence-conserve-unknown-missing",
    joined.ok === true &&
      joined.pools.chatgpt_codex_subscription?.evaluation === "CONSERVE_UNKNOWN_MISSING" &&
      joined.pools.glm_coding_plan?.evaluation === "CONSERVE_UNKNOWN_MISSING",
    JSON.stringify(joined.pools),
  );
}

// 3. stale contribution → composer rejects → CONSERVE_UNKNOWN_STALE
{
  const staleContribution = JSON.parse(JSON.stringify(codexContribution(62)));
  staleContribution.produced_at = "2026-09-05T14:00:00.000Z";
  staleContribution.resources.codex.updated_at = "2026-09-05T14:00:00.000Z";
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [staleContribution] }, { nowMs: NOW });
  const joined = joinQuotaPoolState(composed, registry, { nowMs: NOW });
  check(
    "stale-evidence-conserve-unknown-stale",
    joined.ok === true && joined.pools.chatgpt_codex_subscription?.evaluation === "CONSERVE_UNKNOWN_STALE",
    JSON.stringify(joined.pools),
  );
}

// 4. reserve floor blocks
{
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [codexContribution(12)] }, { nowMs: NOW });
  const joined = joinQuotaPoolState(composed, registry, {
    nowMs: NOW,
    reservePolicy: { chatgpt_codex_subscription: { floor_percent: 20, policy_ref: "codex-reserve-v1" } },
  });
  check(
    "reserve-floor-blocked",
    joined.pools.chatgpt_codex_subscription?.evaluation === "RESERVE_FLOOR_BLOCK" &&
      joined.pools.chatgpt_codex_subscription?.reserve_policy_ref === "codex-reserve-v1",
    JSON.stringify(joined.pools),
  );
}

// 5. exhausted pool
{
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [codexContribution(0, false)] }, { nowMs: NOW });
  const joined = joinQuotaPoolState(composed, registry, { nowMs: NOW });
  check("exhausted-pool-joined", joined.pools.chatgpt_codex_subscription?.evaluation === "POOL_EXHAUSTED", JSON.stringify(joined.pools));
}

// 6. shared pools evaluated once; no-pool resources carry explicit semantics
{
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [codexContribution(62)] }, { nowMs: NOW });
  const joined = joinQuotaPoolState(composed, registry, { nowMs: NOW });
  check(
    "pool-ids-unique-and-no-pool-semantics",
    Object.keys(joined.pools).length === 2 &&
      joined.resources.qwen_local?.quota_pool_id === null &&
      joined.resources.qwen_local?.pool_semantics === "local_unmetered" &&
      joined.resources.cursor?.pool_semantics === "no_pool_binding",
    JSON.stringify(joined.resources),
  );
}

// 7. invalid composer result rejected
{
  const joined = joinQuotaPoolState({ schema_version: "wrong", ok: true }, registry, { nowMs: NOW });
  check("invalid-composer-result-rejected", joined.ok === false && joined.classification === "JOIN_REJECTED_COMPOSER_RESULT_INVALID");
}

// 8. economics: only verified rides along (T07 law pre-verified here)
{
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [codexContribution(62)] }, { nowMs: NOW });
  const joined = joinQuotaPoolState(composed, registry, {
    nowMs: NOW,
    economics: {
      glm_coding_plan: { verified: false, payload: { multiplier: 3 } },
      chatgpt_codex_subscription: { verified: true, payload: { note: "synthetic" } },
    },
  });
  check(
    "economics-verified-only",
    joined.economics.glm_coding_plan?.verified === false && joined.economics.glm_coding_plan?.payload === null &&
      joined.economics.chatgpt_codex_subscription?.verified === true,
    JSON.stringify(joined.economics),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
