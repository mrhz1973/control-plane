#!/usr/bin/env node
/** Focused suite — V4_CANONICAL_RETRY_REPAIR_RUNTIME_BOUNDARY_V1. */
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { runRetryStage, buildRetryCandidates, RETRY_STAGE_RESULT_SCHEMA } from "../../tools/run-retry-stage-v1.mjs";
import { buildRetryBoundaryState } from "../../tools/rt25-canonical-quota-state-v1.mjs";
import { selectQuotaAwareRetryRoute, RETRY_DECISION_SCHEMA } from "../../tools/rt25-retry-quota-aware-selector-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-06T00:30:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 260) });
}

const registry = JSON.parse(readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"));

function contribution(resourceId, value, extra = {}) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `c-${resourceId}-${Math.random().toString(36).slice(2, 8)}`,
    producer_id: "retry-stage-tests",
    source: extra.source || "dashboard_snapshot",
    produced_at: "2026-09-06T00:28:00.000Z",
    resources: {
      [resourceId]: {
        available: value !== 0,
        quota_remaining: { value, unit: extra.unit || "percent" },
        reset_at: "2026-09-06T05:00:00.000Z",
        cost_mode: extra.cost_mode || "included",
        location: extra.location || "cloud",
        updated_at: "2026-09-06T00:28:00.000Z",
        evidence: extra.source === "local_probe"
          ? { kind: "qwen_occupancy", classification: "QWEN_READY_IDLE", launch_performed: false, generation_calls: 0 }
          : { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" },
      },
    },
  };
}
const qwenReady = () => contribution("qwen_local", null, { source: "local_probe", unit: "unlimited", location: "local", cost_mode: "free" });
const failedResult = (over = {}) => ({
  schema_version: "local-dev-execution-result-v1",
  task_ref: "LOCAL_DEV_B_D-RETRY-1",
  status: "STOP",
  classification: "STOP:TEST_FAILED",
  actor: "local-dev-executor-v1",
  profile_id: "qwen38-opus-q3-opencode-24k",
  reason_codes: ["TEST_FAILED"],
  ...over,
});

// A. retry boundary recomposes canonical quota state FRESHLY each invocation
{
  const states = [];
  const buildState = async (opts) => {
    const s = await buildRetryBoundaryState(opts);
    states.push(s.canonical.joined?.joined_at);
    return s;
  };
  const r1 = await runRetryStage(failedResult(), {
    attempt: 2, previousRouteId: "retry-glm-5-3", previousModel: "qwen38-opus-q3-opencode-24k",
    quotaStateOptions: { contributions: [contribution("glm", 55), contribution("codex", 62)], nowMs: NOW },
    buildState,
  });
  const r2 = await runRetryStage(failedResult(), {
    attempt: 3, previousRouteId: r1.selected_retry_route?.route_id ?? null,
    quotaStateOptions: { contributions: [contribution("glm", 40), contribution("codex", 62)], nowMs: NOW + 60_000 },
    buildState,
  });
  check(
    "A-fresh-state-recomposed-each-invocation",
    states.length === 2 &&
      states[0] === new Date(NOW).toISOString() &&
      states[1] === new Date(NOW + 60_000).toISOString() &&
      r1.quota_provenance?.joined_at === new Date(NOW).toISOString() &&
      r2.quota_provenance?.joined_at === new Date(NOW + 60_000).toISOString() &&
      r1.quota_provenance?.composition_reason_codes?.includes("CANONICAL_QUOTA_STATE_COMPOSED"),
    JSON.stringify({ a: states, p1: r1.quota_provenance?.joined_at, p2: r2.quota_provenance?.joined_at }),
  );
  check("A2-retry-required-attempt-and-previous-visible",
    r1.retry_required === true && r1.retry_attempt_index === 2 &&
      r1.previous_route_reference === "retry-glm-5-3" &&
      r1.previous_model_reference === "qwen38-opus-q3-opencode-24k",
    JSON.stringify({ req: r1.retry_required, att: r1.retry_attempt_index, prev: r1.previous_route_reference, m: r1.previous_model_reference }));
}

// B. REAL retry selector is invoked (T19 envelope, decision_role retry)
{
  const r = await runRetryStage(failedResult(), {
    attempt: 2,
    quotaStateOptions: { contributions: [contribution("glm", 55)], nowMs: NOW },
  });
  check(
    "B-real-retry-selector-invoked",
    r.decision?.schema_version === RETRY_DECISION_SCHEMA && r.decision?.decision_role === "retry" &&
      (r.retry_selection_status === "RETRY_ROUTE_SELECTED" || r.retry_selection_status === "RETRY_BLOCKED"),
    JSON.stringify({ d: r.decision?.schema_version, role: r.decision?.decision_role, s: r.retry_selection_status }),
  );
  // direct parity with raw selector on identical fresh state
  const bs = await buildRetryBoundaryState({ contributions: [contribution("glm", 55)], nowMs: NOW });
  const cand = buildRetryCandidates(registry, { retryCandidateModels: ["glm-5.3"] });
  const direct = await selectQuotaAwareRetryRoute(bs.canonical.composed, registry, cand.candidates, { attempt: 2, nowMs: NOW });
  check("B2-parity-with-raw-selector", JSON.stringify(direct.selected) === JSON.stringify(r.decision?.selected),
    JSON.stringify({ raw: direct.selected?.route_id, via: r.decision?.selected?.route_id }));
}

// C. changed quota evidence between attempt N and N+1 changes selection
{
  const rFresh = await runRetryStage(failedResult(), {
    attempt: 2, previousRouteId: "retry-glm-5-3", previousPoolId: "glm_coding_plan",
    quotaStateOptions: { contributions: [contribution("glm", 55), contribution("codex", 62)], nowMs: NOW },
  });
  const rExhausted = await runRetryStage(failedResult(), {
    attempt: 3, previousRouteId: "retry-glm-5-3", previousPoolId: "glm_coding_plan",
    quotaStateOptions: { contributions: [contribution("glm", 0), contribution("codex", 62)], nowMs: NOW + 60_000 },
  });
  check(
    "C-changed-evidence-changes-selection",
    rFresh.retry_selection_status === "RETRY_ROUTE_SELECTED" && rExhausted.retry_selection_status === "RETRY_ROUTE_SELECTED" &&
      rFresh.selected_retry_route?.model === "glm-5.3" &&
      rExhausted.selected_retry_route?.model === "codex-ide" &&
      rExhausted.decision.rejected_candidates.some((x) => x.reason_codes.includes("POOL_EXHAUSTED")) &&
      rExhausted.decision.previous_pool_id === "glm_coding_plan",
    JSON.stringify({ n: rFresh.selected_retry_route?.model, n1: rExhausted.selected_retry_route?.model, rej: rExhausted.decision?.rejected_candidates?.flatMap((x) => x.reason_codes) }),
  );
}

// D. stale/missing commercial quota rejects commercial retry fail-closed
{
  const stale = contribution("glm", 55);
  stale.produced_at = "2026-09-05T22:00:00.000Z";
  stale.resources.glm.updated_at = "2026-09-05T22:00:00.000Z";
  const r = await runRetryStage(failedResult(), {
    attempt: 2,
    retryCandidateModels: ["glm-5.3"],
    quotaStateOptions: { contributions: [stale], nowMs: NOW },
  });
  check(
    "D-commercial-stale-fail-closed",
    r.retry_selection_status === "RETRY_BLOCKED" && r.selected_retry_route === null &&
      r.decision.rejected_candidates.some((x) => x.reason_codes.includes("CONSERVE_UNKNOWN_STALE")),
    JSON.stringify({ s: r.retry_selection_status, rej: r.decision?.rejected_candidates?.flatMap((x) => x.reason_codes) }),
  );
  const r2 = await runRetryStage(failedResult(), {
    attempt: 2,
    retryCandidateModels: ["codex_subscription_models", "glm-5.3"],
    quotaStateOptions: { contributions: [], nowMs: NOW },
  });
  check("D2-missing-commercial-fail-closed",
    r2.retry_selection_status === "RETRY_BLOCKED" && r2.selected_retry_route === null,
    JSON.stringify(r2.retry_selection_status));
}

// E. adequate local retry route survives when commercial route is blocked
{
  const r = await runRetryStage(failedResult(), {
    attempt: 2, previousRouteId: "retry-glm-5-3", previousPoolId: "glm_coding_plan",
    quotaStateOptions: { contributions: [contribution("glm", 0), qwenReady()], nowMs: NOW },
  });
  check(
    "E-local-retry-survives-commercial-blocked",
    r.retry_selection_status === "RETRY_ROUTE_SELECTED" &&
      r.selected_retry_route?.model === "qwen-local" && r.selected_retry_route?.resource_id === "qwen_local" &&
      r.selected_retry_route?.quota_pool_id === null &&
      r.quota_provenance?.pools?.glm_coding_plan?.evaluation === "POOL_EXHAUSTED",
    JSON.stringify({ s: r.selected_retry_route?.model, pools: r.quota_provenance?.pools?.glm_coding_plan?.evaluation }),
  );
}

// F. no silent quality downgrade (high-risk demand vetoes inadequate retry route)
{
  const r = await runRetryStage(failedResult(), {
    attempt: 2,
    retryCandidateModels: ["qwen_local"], // qwen-local quality_tier 2 in guard inventory
    demand: { risk: "high", min_quality_tier: 1 },
    quotaStateOptions: { contributions: [qwenReady()], nowMs: NOW },
  });
  check(
    "F-no-silent-quality-downgrade",
    r.retry_selection_status === "VETOED_QUALITY_DOWNGRADE" && r.selected_retry_route === null &&
      r.quality_guard?.veto === true && r.decision?.status === "RETRY_ROUTE_SELECTED",
    JSON.stringify({ s: r.retry_selection_status, g: r.quality_guard?.guard, rc: r.quality_guard?.reason_codes }),
  );
}

// G. malformed input fails closed (null/array/unknown schema/bad attempt/PASS result)
{
  const r1 = await runRetryStage(null, {});
  const r2 = await runRetryStage("nope", {});
  const r3 = await runRetryStage({ schema_version: "unknown-v99" }, {});
  const r4 = await runRetryStage(failedResult(), { attempt: 0 });
  const r5 = await runRetryStage(failedResult({ status: "PASS", classification: "PASS" }), {});
  check(
    "G-malformed-input-fails-closed",
    [r1, r2, r3, r4, r5].every((x) => x.retry_selection_status === "INPUT_INVALID" && x.selected_retry_route === null && x.retry_required === false && x.execution_performed === false),
    JSON.stringify([r1, r2, r3, r4, r5].map((x) => x.retry_selection_status)),
  );
  const r6 = await runRetryStage(failedResult(), { buildState: async () => { throw new Error("boom"); } });
  check("G2-composition-failure-fails-closed",
    r6.retry_selection_status === "QUOTA_STATE_COMPOSITION_FAILED" && r6.selected_retry_route === null,
    JSON.stringify(r6.retry_selection_status));
}

// H. execution_performed remains false (no authorized retry execution path)
{
  const r = await runRetryStage(failedResult(), {
    attempt: 2,
    quotaStateOptions: { contributions: [contribution("glm", 55)], nowMs: NOW },
  });
  check(
    "H-execution-performed-false-always",
    r.execution_performed === false && r.selected_retry_route !== null,
    JSON.stringify({ ep: r.execution_performed, s: r.selected_retry_route?.model }),
  );
}

// I. exact real caller proof — dedicated canonical CLI: failed result in ->
// bounded retry-stage result out (direct canonical invocation; NO fake caller).
{
  const tmp = tmpdir();
  const inFile = join(tmp, `retry-stage-in-${Date.now()}.json`);
  const outFile = join(tmp, `retry-stage-out-${Date.now()}.json`);
  writeFileSync(inFile, JSON.stringify(failedResult()), "utf8");
  const proc = spawnSync(process.execPath, [
    resolve(ROOT, "tools/run-retry-stage-v1.mjs"),
    "--input-file", inFile,
    "--attempt", "2",
    "--previous-route-id", "retry-glm-5-3",
    "--previous-pool-id", "glm_coding_plan",
    "--previous-model", "qwen38-opus-q3-opencode-24k",
    "--output-file", outFile,
  ], { cwd: ROOT, encoding: "utf8", timeout: 120_000 });
  let out = null;
  try { out = JSON.parse(proc.stdout); } catch { out = null; }
  check(
    "I-canonical-cli-direct-invocation",
    out !== null && out.schema_version === RETRY_STAGE_RESULT_SCHEMA &&
      out.retry_required === true && out.retry_attempt_index === 2 &&
      out.previous_route_reference === "retry-glm-5-3" &&
      out.previous_model_reference === "qwen38-opus-q3-opencode-24k" &&
      out.execution_performed === false &&
      (out.retry_selection_status === "RETRY_ROUTE_SELECTED" || out.retry_selection_status === "RETRY_BLOCKED"),
    JSON.stringify({ s: out?.retry_selection_status, ep: out?.execution_performed, exit: proc.status, stdout: (proc.stdout || proc.stderr || "").slice(0, 100) }),
  );
  // selection success => exit 0; selection blocked => exit 1 (selection semantics, never execution)
  check("I2-cli-exit-mirrors-selection-only", proc.status === (out?.retry_selection_status === "RETRY_ROUTE_SELECTED" ? 0 : 1), JSON.stringify(proc.status));
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
