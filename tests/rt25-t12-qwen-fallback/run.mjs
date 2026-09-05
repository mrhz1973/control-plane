#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T12 Qwen adequacy fallback. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { evaluateQwenAdequacyFallback } from "../../tools/rt25-qwen-adequacy-fallback-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

// Qwen positive availability requires local_probe with strict evidence (composer Qwen gate).
const qwenPositive = {
  schema_version: "v4-resource-status-contribution-v1",
  contribution_id: "qwen-occ-positive-1",
  producer_id: "qwen-probe",
  source: "local_probe",
  produced_at: "2026-09-05T15:58:00.000Z",
  resources: {
    qwen_local: {
      available: true,
      quota_remaining: { value: null, unit: "unlimited" },
      reset_at: null,
      cost_mode: "free",
      location: "local",
      updated_at: "2026-09-05T15:58:00.000Z",
      evidence: { kind: "qwen_occupancy", classification: "QWEN_READY_IDLE", launch_performed: false, generation_calls: 0 },
    },
  },
};

function codexContribution(value) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: "rt25-codex-quota-chatgpt_codex_subscription-2026-09-05T15:58:00.000Z",
    producer_id: "rt25-quota-ingest-codex-v1",
    source: "dashboard_snapshot",
    produced_at: "2026-09-05T15:58:00.000Z",
    resources: {
      codex: {
        available: true,
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

// 1. qwen READY_IDLE + adequate demand → FALLBACK eligible (unmetered preferred)
{
  const joined = await joinedFor([qwenPositive]);
  const f = evaluateQwenAdequacyFallback(joined, { required_capabilities: ["code_generation"] });
  check("adequate-and-available", f.adequate === true && f.fallback === "FALLBACK_ADEQUATE_AND_AVAILABLE", JSON.stringify(f));
}

// 2. qwen not available (baseline fail-closed) → FALLBACK_NOT_AVAILABLE (no silent preference)
{
  const joined = await joinedFor([]);
  const f = evaluateQwenAdequacyFallback(joined, { required_capabilities: ["code_generation"] });
  check("not-available-no-silent-preference", f.adequate === false && f.fallback === "FALLBACK_NOT_AVAILABLE", JSON.stringify(f));
}

// 3. capability beyond inventory → NOT_ADEQUATE even when available
{
  const joined = await joinedFor([qwenPositive]);
  const f = evaluateQwenAdequacyFallback(joined, { required_capabilities: ["vision_multimodal"] });
  check("capability-inadequate", f.adequate === false && f.fallback === "FALLBACK_NOT_ADEQUATE" && f.reason_codes[0] === "QWEN_CAPABILITY_MISSING_VISION_MULTIMODAL", JSON.stringify(f));
}

// 4. quality tier gate: tier-2 local inadequate for tier-1 demand
{
  const joined = await joinedFor([qwenPositive]);
  const f = evaluateQwenAdequacyFallback(joined, { min_quality_tier: 1 });
  check("tier-inadequate", f.adequate === false && f.reason_codes[0] === "QWEN_QUALITY_TIER_INSUFFICIENT", JSON.stringify(f));
}

// 5. tier-2 demand OK
{
  const joined = await joinedFor([qwenPositive]);
  const f = evaluateQwenAdequacyFallback(joined, { min_quality_tier: 2, required_capabilities: ["planning", "repo_read"] });
  check("tier-2-ok", f.adequate === true);
}

// 6. integration: Qwen fallback preferred over stale cloud in the planner selector chain
{
  const stale = codexContribution(62);
  stale.produced_at = "2026-09-05T14:00:00.000Z";
  stale.resources.codex.updated_at = "2026-09-05T14:00:00.000Z";
  const joined = await joinedFor([stale, qwenPositive]);
  const f = evaluateQwenAdequacyFallback(joined, { required_capabilities: ["code_generation"] });
  check(
    "stale-cloud-qwen-fallback-live",
    f.adequate === true && f.quota_pool_id === null,
    JSON.stringify({ f: f.fallback }),
  );
}

// 7. manual positive availability is NOT accepted (composer qwen gate downstream)
{
  const manualPositive = JSON.parse(JSON.stringify(qwenPositive));
  manualPositive.source = "manual";
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions: [manualPositive] }, { nowMs: NOW });
  check(
    "manual-positive-rejected-by-composer",
    composed.ok === true && composed.resource_status.resources.qwen_local.available === false,
    JSON.stringify({ cls: composed.resource_decisions.qwen_local.classification }),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
