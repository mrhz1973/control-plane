#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T09 execution/TASK-DELTA selector. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { composeV4ResourceStatus } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import { joinQuotaPoolState } from "../../tools/rt25-quota-state-join-v1.mjs";
import { selectQuotaAwareExecutionRoute } from "../../tools/rt25-execution-quota-aware-selector-v1.mjs";

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

const EXEC_CANDIDATES = [
  { route_id: "codex-ide-exec", resource_id: "codex", model: "codex-ide", access_surface: "codex_ide_cursor_extension", select_rank: 10 },
  { route_id: "glm-exec", resource_id: "glm", model: "glm-5.3", access_surface: "glm_coding_plan_cli", select_rank: 20 },
  { route_id: "qwen-local-exec", resource_id: "qwen_local", model: "qwen-local", access_surface: "local_harness", select_rank: 30 },
];

// 1. healthy → implementation route selected with envelope law
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwareExecutionRoute(joined, EXEC_CANDIDATES, { nowMs: NOW, execution_kind: "implementation", task_delta_id: "TD-1" });
  check(
    "implementation-selected",
    d.schema_version === "v4-rt25-execution-quota-aware-decision-v1" && d.decision_role === "execution" &&
      d.execution_kind === "implementation" && d.task_delta_id === "TD-1" &&
      d.status === "ROUTE_SELECTED" && d.selected.route_id === "codex-ide-exec",
    JSON.stringify({ s: d.selected?.route_id, k: d.execution_kind }),
  );
}

// 2. same law as planner: stale codex → local fallback with rejection audit
{
  const stale = codexContribution(62);
  stale.produced_at = "2026-09-05T14:00:00.000Z";
  stale.resources.codex.updated_at = "2026-09-05T14:00:00.000Z";
  const joined = await joinedFor([stale]);
  const d = selectQuotaAwareExecutionRoute(joined, EXEC_CANDIDATES, { nowMs: NOW });
  check(
    "stale-falls-to-local",
    d.status === "ROUTE_SELECTED" && d.selected.route_id === "qwen-local-exec" &&
      d.rejected_candidates.some((r) => r.route_id === "codex-ide-exec" && r.reason_codes.includes("CONSERVE_UNKNOWN_STALE")),
    JSON.stringify({ s: d.selected?.route_id }),
  );
}

// 3. prompt_creator kind routes through the same law
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwareExecutionRoute(joined, EXEC_CANDIDATES, { nowMs: NOW, execution_kind: "prompt_creator" });
  check("prompt-creator-kind", d.execution_kind === "prompt_creator" && d.selected.route_id === "codex-ide-exec");
}

// 4. no evidence at all → fail-closed NO_ROUTE_SELECTED (no silent fallback invention)
{
  const joined = await joinedFor([]);
  const d = selectQuotaAwareExecutionRoute(joined, EXEC_CANDIDATES.slice(0, 2), { nowMs: NOW });
  check("no-evidence-fail-closed", d.ok === false && d.status === "NO_ROUTE_SELECTED" && d.selected === null);
}

// 5. pool evaluations propagate for shared-pool audit
{
  const joined = await joinedFor([codexContribution(62)]);
  const d = selectQuotaAwareExecutionRoute(joined, EXEC_CANDIDATES, { nowMs: NOW });
  check("pool-evaluations-propagate", Object.keys(d.pool_evaluations).includes("chatgpt_codex_subscription"));
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
