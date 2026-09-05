#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T13 no-silent-quality-downgrade guard. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwarePlannerRoute } from "../../tools/rt25-planner-quota-aware-selector-v1.mjs";
import { guardQualityDowngrade } from "../../tools/rt25-quality-downgrade-guard-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

function contribution(resourceId, value, unit = "percent", source = "dashboard_snapshot") {
  const cid = `c-${resourceId}`;
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: cid,
    producer_id: "rt25-tests",
    source,
    produced_at: "2026-09-05T15:58:00.000Z",
    resources: {
      [resourceId]: {
        available: true,
        quota_remaining: { value, unit },
        reset_at: "2026-09-05T19:00:00.000Z",
        cost_mode: "included",
        location: source === "local_probe" ? "local" : "cloud",
        updated_at: "2026-09-05T15:58:00.000Z",
        evidence: source === "local_probe"
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

// Real chain: only glm-5.3-flash fresh; high-risk demand arrives.
async function flashOnlyDecision() {
  const joined = await joinedFor([contribution("glm", 41)]);
  return selectQuotaAwarePlannerRoute(
    joined,
    [
      { route_id: "glm-flash-route", resource_id: "glm", model: "glm-5.3-flash", access_surface: "glm_coding_plan_client", select_rank: 5 },
      { route_id: "qwen-route", resource_id: "qwen_local", model: "qwen-local", access_surface: "local_harness", select_rank: 30 },
    ],
    { nowMs: NOW },
  );
}

// 1. high-risk + flash selected (tier 2 > required 1) → VETO, decision not silently downgraded
{
  const d = await flashOnlyDecision();
  const g = guardQualityDowngrade(d, { risk: "high", min_quality_tier: 1, required_capabilities: ["code_generation"] });
  check(
    "high-risk-vetoes-flash",
    g.veto === true && g.guard === "GUARD_VETO_QUALITY_DOWNGRADE" && g.reason_codes[0] === "SELECTED_QUALITY_TIER_2_ABOVE_REQUIRED_1",
    JSON.stringify(g),
  );
}

// 2. normal-risk passes through untouched
{
  const d = await flashOnlyDecision();
  const g = guardQualityDowngrade(d, { risk: "normal" });
  check("normal-risk-passthrough", g.veto === false && g.guard === "GUARD_PASS_NORMAL_RISK");
}

// 3. high-risk + tier-1 selected → PASS (codex fresh chain)
{
  const joined = await joinedFor([contribution("codex", 62)]);
  const d = selectQuotaAwarePlannerRoute(joined, [
    { route_id: "codex-route", resource_id: "codex", model: "codex-ide", access_surface: "codex_ide_cursor_extension", select_rank: 1 },
    { route_id: "qwen-route", resource_id: "qwen_local", model: "qwen-local", access_surface: "local_harness", select_rank: 30 },
  ], { nowMs: NOW });
  const g = guardQualityDowngrade(d, { risk: "high", min_quality_tier: 1, required_capabilities: ["planning", "code_generation"] });
  check("high-risk-pass-tier1", g.veto === false && g.guard === "GUARD_PASS_HIGH_RISK_ADEQUATE", JSON.stringify(g));
}

// 4. high-risk + unknown model quality → fail-closed VETO
{
  const d = await flashOnlyDecision();
  const tampered = JSON.parse(JSON.stringify(d));
  tampered.selected.model = "mystery-model";
  const g = guardQualityDowngrade(tampered, { risk: "high", min_quality_tier: 1 });
  check("unknown-quality-veto", g.veto === true && g.reason_codes[0] === "SELECTED_ROUTE_QUALITY_UNKNOWN_HIGH_RISK");
}

// 5. high-risk capability missing on selected → VETO with explicit capability code
{
  const joined = await joinedFor([contribution("codex", 62)]);
  const d = selectQuotaAwarePlannerRoute(joined, [
    { route_id: "codex-route", resource_id: "codex", model: "codex-ide", select_rank: 1 },
  ], { nowMs: NOW });
  const g = guardQualityDowngrade(d, { risk: "high", min_quality_tier: 1, required_capabilities: ["vision_multimodal"] });
  check("capability-veto", g.veto === true && g.reason_codes[0] === "SELECTED_CAPABILITY_MISSING_VISION_MULTIMODAL", JSON.stringify(g));
}

// 6. no-route decision stays blocked (guard does not invent routes)
{
  const joined = await joinedFor([]);
  const d = selectQuotaAwarePlannerRoute(joined, [
    { route_id: "codex-route", resource_id: "codex", model: "codex-ide", select_rank: 1 },
  ], { nowMs: NOW });
  const g = guardQualityDowngrade(d, { risk: "high", min_quality_tier: 1 });
  check("no-route-stays-blocked", g.veto === false && g.guard === "GUARD_PASS_NO_ROUTE_ANYWAY" && d.selected === null);
}

// 7. invalid envelope → guard veto
{
  const g = guardQualityDowngrade({ bogus: 1 }, { risk: "high" });
  check("invalid-envelope-veto", g.veto === true && g.guard === "GUARD_DECISION_ENVELOPE_INVALID");
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
