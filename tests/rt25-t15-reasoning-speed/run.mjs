#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T15 Codex reasoning/speed metadata propagation. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwarePlannerRoute } from "../../tools/rt25-planner-quota-aware-selector-v1.mjs";
import { attachReasoningSpeedMetadata } from "../../tools/rt25-reasoning-speed-metadata-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-05T16:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));
const baseline = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/status.fail-closed.json"), "utf8"));

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

async function codexSelected() {
  const joined = await joinedFor([codexContribution(62)]);
  return selectQuotaAwarePlannerRoute(joined, [
    { route_id: "codex-route", resource_id: "codex", model: "codex-ide", access_surface: "codex_ide_cursor_extension", select_rank: 1 },
  ], { nowMs: NOW });
}

const INVENTORY = { supported_reasoning: ["low", "high"], supported_speed: ["balanced", "fast"] };

// 1. supported reasoning+speed propagate onto the real decision
{
  const d = await codexSelected();
  const m = attachReasoningSpeedMetadata(d, { reasoning: "high", speed: "fast" }, { inventory: INVENTORY });
  check(
    "propagated",
    m.reasoning_metadata.reasoning_level === "high" && m.reasoning_metadata.propagation === "propagated_from_inventory" &&
      m.speed_metadata.speed_preference === "fast" && m.speed_metadata.propagation === "propagated_from_inventory",
    JSON.stringify(m),
  );
}

// 2. reasoning requested but NOT in runtime inventory → explicit unsupported (no invention)
{
  const d = await codexSelected();
  const m = attachReasoningSpeedMetadata(d, { reasoning: "medium", speed: "fast" }, { inventory: INVENTORY });
  check("reasoning-unsupported-explicit", m.reasoning_metadata.reasoning_level === null && m.reasoning_metadata.propagation === "unsupported_by_inventory", JSON.stringify(m.reasoning_metadata));
}

// 3. speed not in inventory → explicit unsupported
{
  const d = await codexSelected();
  const m = attachReasoningSpeedMetadata(d, { reasoning: "low", speed: "quality" }, { inventory: INVENTORY });
  check("speed-unsupported-explicit", m.speed_metadata.speed_preference === null && m.speed_metadata.propagation === "unsupported_by_inventory");
}

// 4. non-codex route → reasoning not applicable, speed still propagates
{
  const qwenPositive = {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: "q1",
    producer_id: "p",
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
  const joined = await joinedFor([qwenPositive]);
  const d = selectQuotaAwarePlannerRoute(joined, [
    { route_id: "qwen-route", resource_id: "qwen_local", model: "qwen-local", select_rank: 1 },
  ], { nowMs: NOW });
  const m = attachReasoningSpeedMetadata(d, { reasoning: "high", speed: "fast" }, { inventory: INVENTORY });
  check("non-codex-reasoning-na", m.reasoning_metadata.reason_codes[0] === "REASONING_NOT_APPLICABLE_NON_CODEX" && m.speed_metadata.speed_preference === "fast", JSON.stringify(m));
}

// 5. invalid reasoning value (not in enum) → unspecified
{
  const d = await codexSelected();
  const m = attachReasoningSpeedMetadata(d, { reasoning: "ultra", speed: "fast" }, { inventory: INVENTORY });
  check("invalid-reasoning-unspecified", m.reasoning_metadata.reason_codes[0] === "REASONING_REQUIREMENT_UNSPECIFIED_OR_UNSUPPORTED");
}

// 6. no selected route → no propagation both sides
{
  const joined = await joinedFor([]);
  const d = selectQuotaAwarePlannerRoute(joined, [{ route_id: "codex-route", resource_id: "codex", model: "codex-ide" }], { nowMs: NOW });
  const m = attachReasoningSpeedMetadata(d, { reasoning: "high", speed: "fast" }, { inventory: INVENTORY });
  check("no-route-no-propagation", m.reasoning_metadata.reason_codes[0] === "NO_SELECTED_ROUTE" && m.speed_metadata.reason_codes[0] === "NO_SELECTED_ROUTE");
}

// 7. inventory absent → nothing propagates even for valid demand (fail-closed)
{
  const d = await codexSelected();
  const m = attachReasoningSpeedMetadata(d, { reasoning: "high", speed: "fast" }, {});
  check(
    "no-inventory-fail-closed",
    m.reasoning_metadata.propagation === "unsupported_by_inventory" && m.speed_metadata.propagation === "unsupported_by_inventory",
    JSON.stringify({ r: m.reasoning_metadata, s: m.speed_metadata }),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
