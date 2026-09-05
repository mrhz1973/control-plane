#!/usr/bin/env node
/** Focused suite — V4_GOVERNED_RETRY_EXECUTION_CALLER_INTEGRATION_V1. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  runGovernedRetryExecution,
  classifyRepairability,
  probeRetryExecutionAuthorization,
  GOVERNED_RETRY_EXECUTION_SCHEMA,
  REPAIRABLE_CLASSIFICATIONS,
} from "../../tools/run-governed-retry-execution-v1.mjs";
import { RETRY_STAGE_RESULT_SCHEMA } from "../../tools/run-retry-stage-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-06T01:00:00.000Z");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 280) });
}

function contribution(resourceId, value, extra = {}) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `c-${resourceId}-${Math.random().toString(36).slice(2, 8)}`,
    producer_id: "governed-retry-tests",
    source: extra.source || "dashboard_snapshot",
    produced_at: "2026-09-06T00:58:00.000Z",
    resources: {
      [resourceId]: {
        available: value !== 0,
        quota_remaining: { value, unit: extra.unit || "percent" },
        reset_at: "2026-09-06T06:00:00.000Z",
        cost_mode: extra.cost_mode || "included",
        location: extra.location || "cloud",
        updated_at: "2026-09-06T00:58:00.000Z",
        evidence: extra.source === "local_probe"
          ? { kind: "qwen_occupancy", classification: "QWEN_READY_IDLE", launch_performed: false, generation_calls: 0 }
          : { kind: "source_snapshot", classification: "QUOTA_POOL_INGEST_AVAILABLE_FRESH_FRESH" },
      },
    },
  };
}
const qwenReady = () => contribution("qwen_local", null, { source: "local_probe", unit: "unlimited", location: "local", cost_mode: "free" });
const stopResult = (over = {}) => ({
  schema_version: "local-dev-execution-result-v1",
  task_ref: "LOCAL_DEV_B_D-GOV-RETRY-1",
  status: "STOP",
  classification: "STOP:TEST_FAILED",
  actor: "local-dev-executor-v1",
  profile_id: "qwen38-opus-q3-opencode-24k",
  reason_codes: ["TEST_FAILED"],
  ...over,
});
const policy = { max_attempts: 2 };
const freshOpts = (contributions, nowMs = NOW) => ({
  retryPolicy: policy,
  attempt: 1,
  previousRouteId: "retry-glm-5.3",
  previousPoolId: "glm_coding_plan",
  quotaStateOptions: { contributions, nowMs },
});

// A. PASS never retries
{
  const pass = stopResult({ status: "PASS", classification: "PASS", reason_codes: ["PASS"] });
  const r = await runGovernedRetryExecution(pass, { retryPolicy: policy, attempt: 1 });
  check(
    "A-pass-never-retries",
    r.schema_version === GOVERNED_RETRY_EXECUTION_SCHEMA &&
      r.caller_status === "PASS_NO_RETRY" && r.repairable === false &&
      r.retry_stage === null && r.execution_performed === false &&
      r.reason_codes.includes("PASS_NEVER_RETRIES"),
    JSON.stringify({ s: r.caller_status, rc: r.reason_codes }),
  );
}

// B. non-repairable STOP never retries
{
  const cases = [
    "STOP:PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE",
    "STOP:BOUNDS_TIMEBOX_EXPIRED",
    "STOP:GIT_PERSISTENCE_FAILED",
    "STOP:UNEXPECTED_FILE_CHANGES",
    "STOP:ENVELOPE_INVALID",
    "STOP:BOUNDS_TEST_CYCLES_EXCEEDED",
  ];
  let all = true;
  const details = [];
  for (const classification of cases) {
    const r = await runGovernedRetryExecution(stopResult({ classification }), { retryPolicy: policy, attempt: 1 });
    const ok = r.caller_status === "NOT_REPAIRABLE" && r.retry_stage === null && r.execution_performed === false;
    if (!ok) all = false;
    details.push(`${classification}=${r.caller_status}`);
  }
  // also: repairable classification but missing retry_policy bound
  const noPolicy = await runGovernedRetryExecution(stopResult(), { attempt: 1 });
  check(
    "B-non-repairable-stop-never-retries",
    all === true && noPolicy.caller_status === "NOT_REPAIRABLE" &&
      noPolicy.reason_codes.includes("RETRY_POLICY_MAX_ATTEMPTS_MISSING") &&
      REPAIRABLE_CLASSIFICATIONS.includes("STOP:TEST_FAILED"),
    JSON.stringify({ all, details, noPolicy: noPolicy.reason_codes }),
  );
}

// C. repairable STOP invokes REAL runRetryStage
{
  let invoked = 0;
  const r = await runGovernedRetryExecution(stopResult(), {
    ...freshOpts([contribution("glm", 55), contribution("codex", 62)]),
    runRetryStageFn: async (impl, opts) => {
      invoked += 1;
      // Delegate to the REAL module so the proof is not a fake.
      const { runRetryStage } = await import("../../tools/run-retry-stage-v1.mjs");
      return runRetryStage(impl, opts);
    },
  });
  check(
    "C-repairable-stop-invokes-real-runRetryStage",
    invoked === 1 &&
      r.repairable === true &&
      r.retry_stage?.schema_version === RETRY_STAGE_RESULT_SCHEMA &&
      r.retry_attempt_index === 1 &&
      (r.caller_status === "RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION" ||
        r.caller_status === "RETRY_SELECTION_BLOCKED"),
    JSON.stringify({ invoked, status: r.caller_status, rs: r.retry_stage?.retry_selection_status }),
  );
}

// D. attempt N and N+1 each recompose fresh quota state
{
  const joinedAts = [];
  const r1 = await runGovernedRetryExecution(stopResult(), {
    retryPolicy: policy,
    attempt: 1,
    quotaStateOptions: { contributions: [contribution("glm", 55)], nowMs: NOW },
  });
  joinedAts.push(r1.retry_stage?.quota_provenance?.joined_at);
  const r2 = await runGovernedRetryExecution(stopResult(), {
    retryPolicy: policy,
    attempt: 2,
    previousRouteId: r1.selected_retry_route?.route_id,
    quotaStateOptions: { contributions: [contribution("glm", 0), contribution("codex", 62)], nowMs: NOW + 60_000 },
  });
  joinedAts.push(r2.retry_stage?.quota_provenance?.joined_at);
  check(
    "D-attempt-N-and-N1-fresh-quota-state",
    joinedAts[0] === new Date(NOW).toISOString() &&
      joinedAts[1] === new Date(NOW + 60_000).toISOString() &&
      joinedAts[0] !== joinedAts[1] &&
      r1.retry_attempt_index === 1 && r2.retry_attempt_index === 2,
    JSON.stringify({ joinedAts, a1: r1.retry_attempt_index, a2: r2.retry_attempt_index }),
  );
}

// E. blocked route fails closed
{
  const stale = contribution("glm", 55);
  stale.produced_at = "2026-09-05T22:00:00.000Z";
  stale.resources.glm.updated_at = "2026-09-05T22:00:00.000Z";
  const r = await runGovernedRetryExecution(stopResult(), {
    retryPolicy: policy,
    attempt: 1,
    // Restrict to commercial glm only so stale evidence blocks selection.
    runRetryStageFn: async (impl, opts) => {
      const { runRetryStage } = await import("../../tools/run-retry-stage-v1.mjs");
      return runRetryStage(impl, { ...opts, retryCandidateModels: ["glm-5.3"] });
    },
    quotaStateOptions: { contributions: [stale], nowMs: NOW },
  });
  check(
    "E-blocked-route-fails-closed",
    r.caller_status === "RETRY_SELECTION_BLOCKED" &&
      r.selected_retry_route === null &&
      r.execution_performed === false &&
      r.retry_stage?.retry_selection_status === "RETRY_BLOCKED",
    JSON.stringify({ s: r.caller_status, rs: r.retry_stage?.retry_selection_status }),
  );
}

// F. selected but unauthorized route does NOT execute
{
  const r = await runGovernedRetryExecution(stopResult(), {
    ...freshOpts([contribution("glm", 55), contribution("codex", 62), qwenReady()]),
  });
  check(
    "F-selected-unauthorized-does-not-execute",
    r.caller_status === "RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION" &&
      r.selected_retry_route !== null &&
      r.execution_performed === false &&
      r.authorization?.authorized === false &&
      r.authorization?.reason_codes?.includes("D-0025_CLOSED") &&
      r.reason_codes.includes("AWAITING_EXECUTION_AUTHORIZATION"),
    JSON.stringify({ s: r.caller_status, ep: r.execution_performed, auth: r.authorization, route: r.selected_retry_route?.model }),
  );
  // Even a probe that claims authorized still must not execute (adapter absent).
  const r2 = await runGovernedRetryExecution(stopResult(), {
    ...freshOpts([contribution("glm", 55)]),
    authorizationProbe: () => ({ authorized: true, reason_codes: ["PROBE_CLAIMS_AUTHORIZED"] }),
  });
  check(
    "F2-probe-authorized-still-no-execution",
    r2.execution_performed === false &&
      r2.caller_status === "RETRY_ROUTE_SELECTED_AWAITING_EXECUTION_AUTHORIZATION" &&
      r2.reason_codes.includes("EXECUTION_ADAPTER_ABSENT_FAIL_CLOSED"),
    JSON.stringify({ s: r2.caller_status, ep: r2.execution_performed, rc: r2.reason_codes }),
  );
}

// G. max attempts enforced
{
  const r = await runGovernedRetryExecution(stopResult(), {
    retryPolicy: { max_attempts: 2 },
    attempt: 3,
    quotaStateOptions: { contributions: [contribution("glm", 55)], nowMs: NOW },
  });
  check(
    "G-max-attempts-enforced",
    r.caller_status === "MAX_ATTEMPTS_EXCEEDED" &&
      r.retry_stage === null &&
      r.execution_performed === false &&
      r.reason_codes.includes("MAX_RETRY_ATTEMPTS_EXCEEDED") &&
      r.max_attempts === 2,
    JSON.stringify({ s: r.caller_status, rc: r.reason_codes }),
  );
  const overCap = classifyRepairability(stopResult(), { max_attempts: 99 });
  check(
    "G2-hard-cap-rejects-unbounded-policy",
    overCap.repairable === false && overCap.reason_codes.includes("RETRY_POLICY_MAX_ATTEMPTS_ABOVE_HARD_CAP"),
    JSON.stringify(overCap),
  );
}

// H. existing authorization / D-0025 semantics unchanged
{
  const gate = JSON.parse(readFileSync(resolve(ROOT, "configs/planner/primary-remote-runtime-gate.json"), "utf8"));
  const auth = probeRetryExecutionAuthorization({});
  check(
    "H-d0025-authorization-unchanged",
    gate.enabled === false &&
      auth.authorized === false &&
      auth.reason_codes.includes("D-0025_CLOSED") &&
      auth.reason_codes.includes("RETRY_EXECUTION_SURFACE_ABSENT"),
    JSON.stringify({ enabled: gate.enabled, auth }),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
