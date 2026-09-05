#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T11 GLM 5.3 vs Flash shared-pool selection. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectGlmModel } from "../../tools/rt25-glm-model-selection-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

// Runtime suitability inventory (caller-supplied at runtime; registry stays static).
const registryWithSuitability = JSON.parse(JSON.stringify(registry));
registryWithSuitability.models["glm-5.3"].runtime_suitability = { quality_rank: 10, speed_rank: 40 };
registryWithSuitability.models["glm-5.3-flash"].runtime_suitability = { quality_rank: 30, speed_rank: 10 };

function glmContribution(value, available = true) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: "rt25-glm-quota-glm_coding_plan-2026-09-05T15:58:00.000Z",
    producer_id: "rt25-quota-ingest-glm-v1",
    source: "dashboard_snapshot",
    produced_at: "2026-09-05T15:58:00.000Z",
    resources: {
      glm: {
        available,
        quota_remaining: { value, unit: "percent" },
        reset_at: "2026-10-01T00:00:00.000Z",
        cost_mode: "included",
        location: "cloud",
        updated_at: "2026-09-05T15:58:00.000Z",
        evidence: { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_MODE_MANUAL_FRESH_FRESH" },
      },
    },
  };
}

async function joinedFor(contributions, opts = {}) {
  const composed = await composeV4ResourceStatus({ registry, baseline, contributions }, { nowMs: NOW });
  return joinQuotaPoolState(composed, registry, { nowMs: NOW, ...opts });
}

// 1. fresh pool + quality preference → glm-5.3 (better quality_rank)
{
  const joined = await joinedFor([glmContribution(41)]);
  const s = selectGlmModel(registryWithSuitability, joined, { prefer: "quality" });
  check("quality-prefers-5-3", s.selected_model === "glm-5.3" && s.selection === "GLM_MODEL_SELECTED_SHARED_POOL_SINGLE_ADMISSION", JSON.stringify(s));
}

// 2. speed preference → glm-5.3-flash
{
  const joined = await joinedFor([glmContribution(41)]);
  const s = selectGlmModel(registryWithSuitability, joined, { prefer: "speed" });
  check("speed-prefers-flash", s.selected_model === "glm-5.3-flash", JSON.stringify(s.selected_model));
}

// 3. no preference → best min(quality,speed): 5.3=min(10,40)=10, flash=min(30,10)=10 → tie → lexical
{
  const joined = await joinedFor([glmContribution(41)]);
  const s = selectGlmModel(registryWithSuitability, joined, {});
  check("no-preference-tie-lexical-5-3", s.selected_model === "glm-5.3", JSON.stringify(s.selected_model));
}

// 4. pool admitted ONCE for both models (single admission evidence)
{
  const joined = await joinedFor([glmContribution(41)]);
  const s = selectGlmModel(registryWithSuitability, joined, {});
  check(
    "single-pool-admission",
    s.reason_codes.includes("SHARED_POOL_ADMITTED_ONCE") && s.pool_admission.admitted === true && s.pool_admission.provenance.pool_id === "glm_coding_plan",
    JSON.stringify(s.pool_admission),
  );
}

// 5. exhausted pool → blocked for BOTH models, one blocked reason
{
  const joined = await joinedFor([glmContribution(0, false)]);
  const s = selectGlmModel(registryWithSuitability, joined, { prefer: "quality" });
  check("exhausted-blocks-both", s.selected_model === null && s.selection === "SELECTION_BLOCKED_DENY_POOL_EXHAUSTED", JSON.stringify(s));
}

// 6. no evidence → fail closed
{
  const joined = await joinedFor([]);
  const s = selectGlmModel(registryWithSuitability, joined, {});
  check("no-evidence-blocked", s.selection === "SELECTION_BLOCKED_DENY_CONSERVE_UNKNOWN_MISSING", JSON.stringify(s.selection));
}

// 7. capability gate: unknown requirement fails closed for both
{
  const joined = await joinedFor([glmContribution(41)]);
  const s = selectGlmModel(registryWithSuitability, joined, { required_capabilities: ["nonexistent_capability"] });
  check(
    "capability-gate-fail-closed",
    s.selected_model === null && s.selection === "SELECTION_NO_MODEL_ELIGIBLE" &&
      s.rejected_models.every((r) => r.reason_codes.includes("CAPABILITY_MISSING_NONEXISTENT_CAPABILITY")),
    JSON.stringify(s.rejected_models),
  );
}

// 8. valid capability requirement passes for both
{
  const joined = await joinedFor([glmContribution(41)]);
  const s = selectGlmModel(registryWithSuitability, joined, { required_capabilities: ["planning", "code_generation"], prefer: "quality" });
  check("capability-gate-pass", s.selected_model === "glm-5.3");
}

// 9. reserve floor blocks the shared pool
{
  const joined = await joinedFor([glmContribution(15)], {
    reservePolicy: { glm_coding_plan: { floor_percent: 20, policy_ref: "glm-reserve-v1" } },
  });
  const s = selectGlmModel(registryWithSuitability, joined, {});
  check("reserve-blocks-shared-pool", s.selection === "SELECTION_BLOCKED_DENY_RESERVE_FLOOR_BLOCK", JSON.stringify(s.selection));
}

// 10. base registry (no runtime suitability inventory) → default ranks, deterministic lexical tie
{
  const joined = await joinedFor([glmContribution(41)]);
  const s = selectGlmModel(registry, joined, { prefer: "quality" });
  check("default-ranks-lexical-tie", s.selected_model === "glm-5.3", JSON.stringify(s.selected_model));
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
