#!/usr/bin/env node
/**
 * Offline tests for collect-qwen-local-resource-status-v1.
 * Session manager mocked. No live generation. No baseline mutation.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASELINE_PATH,
  collectQwenLocalResourceStatus,
} from "../../tools/collect-qwen-local-resource-status-v1.mjs";
import { evaluateExecutionRoute } from "../../tools/evaluate-execution-route.mjs";
import { validateResourceStatusObject } from "../../tools/validate-resource-status-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const REGISTRY = JSON.parse(
  readFileSync(resolve(ROOT, "configs/resources/registry.json"), "utf8"),
);
const BASELINE = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
const FIXED_TS = "2026-08-29T12:00:00.000Z";

function sessionReady(status = "READY") {
  return {
    schema_version: "qwen-local-session-manager-result-v1",
    status,
    ready: true,
    profile: "fast_8k",
    model_id: "qwen38-original-dflash2-8k",
    base_url: "http://127.0.0.1:8080",
    launch_performed: status === "LAUNCH_STARTED_AND_READY",
    wait_elapsed_ms: 0,
    reason_code: status,
    launch_count: status === "LAUNCH_STARTED_AND_READY" ? 1 : 0,
  };
}

function sessionFail(status) {
  return {
    schema_version: "qwen-local-session-manager-result-v1",
    status,
    ready: false,
    profile: "fast_8k",
    model_id: "qwen38-original-dflash2-8k",
    base_url: "http://127.0.0.1:8080",
    launch_performed: false,
    wait_elapsed_ms: 0,
    reason_code: status,
    launch_count: 0,
  };
}

const results = [];
function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function othersRemainFailClosed(status) {
  for (const id of Object.keys(status.resources)) {
    if (id === "qwen_local" || id === "opencode") continue;
    if (status.resources[id].available !== false) return false;
  }
  return true;
}

async function run() {
  // 1 READY => available true
  {
    const collected = await collectQwenLocalResourceStatus({
      ensureReady: async () => sessionReady("READY"),
      clock: () => FIXED_TS,
      baseline: BASELINE,
    });
    const q = collected.status?.resources?.qwen_local;
    check(
      "01-ready-available-true",
      collected.ok &&
        q?.available === true &&
        q.source === "local_probe" &&
        q.cost_mode === "free" &&
        q.quota_remaining?.unit === "unlimited" &&
        q.quota_remaining?.value === null,
      JSON.stringify(q),
    );
  }

  // 2 LAUNCH_STARTED_AND_READY
  {
    const collected = await collectQwenLocalResourceStatus({
      ensureReady: async () => sessionReady("LAUNCH_STARTED_AND_READY"),
      clock: () => FIXED_TS,
      baseline: BASELINE,
    });
    check(
      "02-launch-started-and-ready",
      collected.ok && collected.status.resources.qwen_local.available === true,
      JSON.stringify(collected.status?.resources?.qwen_local),
    );
  }

  // 3-6 failures
  for (const [name, status] of [
    ["03-readiness-timeout", "READINESS_TIMEOUT"],
    ["04-launch-failed", "LAUNCH_FAILED"],
    ["05-profile-not-exposed", "PROFILE_NOT_EXPOSED"],
    ["06-dflash-required", "DFLASH_REQUIRED"],
  ]) {
    const collected = await collectQwenLocalResourceStatus({
      ensureReady: async () => sessionFail(status),
      clock: () => FIXED_TS,
      baseline: BASELINE,
    });
    const q = collected.status?.resources?.qwen_local;
    check(
      name,
      collected.ok &&
        q?.available === false &&
        q.source === "local_probe" &&
        q.quota_remaining?.unit === "unknown",
      JSON.stringify(q),
    );
  }

  // 7 non-qwen remain fail-closed
  {
    const collected = await collectQwenLocalResourceStatus({
      ensureReady: async () => sessionReady("READY"),
      clock: () => FIXED_TS,
      baseline: BASELINE,
    });
    check(
      "07-others-remain-fail-closed",
      collected.ok && othersRemainFailClosed(collected.status),
      JSON.stringify(
        Object.fromEntries(
          Object.entries(collected.status.resources).map(([k, v]) => [
            k,
            v.available,
          ]),
        ),
      ),
    );
  }

  // 8 fresh timestamps from clock
  {
    const collected = await collectQwenLocalResourceStatus({
      ensureReady: async () => sessionReady("READY"),
      clock: () => FIXED_TS,
      baseline: BASELINE,
    });
    check(
      "08-fresh-timestamps",
      collected.status.generated_at === FIXED_TS &&
        collected.status.resources.qwen_local.updated_at === FIXED_TS &&
        collected.status.generated_at !== BASELINE.generated_at,
      JSON.stringify({
        generated_at: collected.status.generated_at,
        baseline: BASELINE.generated_at,
      }),
    );
  }

  // 9 schema valid
  {
    const collected = await collectQwenLocalResourceStatus({
      ensureReady: async () => sessionReady("READY"),
      clock: () => FIXED_TS,
      baseline: BASELINE,
    });
    const v = await validateResourceStatusObject(collected.status);
    check("09-schema-valid", collected.ok && v.ok === true, JSON.stringify(v));
  }

  // 10 malformed session
  {
    const collected = await collectQwenLocalResourceStatus({
      ensureReady: async () => ({ hello: "world" }),
      clock: () => FIXED_TS,
      baseline: BASELINE,
    });
    check(
      "10-malformed-session-fail-closed",
      collected.ok === false &&
        collected.classification === "COLLECTOR_MALFORMED_SESSION" &&
        collected.status === null,
      JSON.stringify(collected),
    );
  }

  // 11 baseline object/file not mutated
  {
    const baselineCopy = JSON.parse(JSON.stringify(BASELINE));
    const mutable = JSON.parse(JSON.stringify(BASELINE));
    await collectQwenLocalResourceStatus({
      ensureReady: async () => sessionReady("READY"),
      clock: () => FIXED_TS,
      baseline: mutable,
    });
    const fileNow = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
    check(
      "11-baseline-not-mutated",
      JSON.stringify(mutable) === JSON.stringify(baselineCopy) &&
        JSON.stringify(fileNow) === JSON.stringify(BASELINE) &&
        fileNow.resources.qwen_local.available === false,
      "baseline mutated",
    );
  }

  // 12 integration: qwen ready + opencode synthetic => opencode+qwen_local
  {
    const collected = await collectQwenLocalResourceStatus({
      ensureReady: async () => sessionReady("READY"),
      clock: () => FIXED_TS,
      baseline: BASELINE,
      probeOpenCode: false,
    });
    const status = JSON.parse(JSON.stringify(collected.status));
    status.resources.opencode = {
      ...status.resources.opencode,
      available: true,
      cost_mode: "free",
      location: "local",
      source: "manual",
      updated_at: FIXED_TS,
    };
    // collector itself must not have marked opencode
    check(
      "14-collector-never-marks-others",
      collected.status.resources.opencode.available === false &&
        collected.status.resources.cursor.available === false &&
        collected.status.resources.glm.available === false &&
        collected.status.resources.codex.available === false,
      "collector marked non-qwen available",
    );

    const routed = await evaluateExecutionRoute(
      {
        schema_version: "execution-route-request-v1",
        request_id: "overlay-int-1",
        technical_requirements: ["filesystem", "code_edit"],
        risk_level: "low",
      },
      { registry: REGISTRY, status },
    );
    check(
      "12-router-selects-opencode-qwen",
      routed.status === "ROUTED" &&
        routed.execution_route?.route_id === "opencode+qwen_local" &&
        routed.arbiter_call_count === 0,
      JSON.stringify(routed),
    );
  }

  // 13 qwen unavailable => cannot select qwen route
  {
    const collected = await collectQwenLocalResourceStatus({
      ensureReady: async () => sessionFail("READINESS_TIMEOUT"),
      clock: () => FIXED_TS,
      baseline: BASELINE,
    });
    const status = JSON.parse(JSON.stringify(collected.status));
    status.resources.opencode = {
      ...status.resources.opencode,
      available: true,
      cost_mode: "free",
      updated_at: FIXED_TS,
    };
    status.resources.cursor = {
      ...status.resources.cursor,
      available: true,
      cost_mode: "included",
      updated_at: FIXED_TS,
    };
    status.resources.composer = {
      available: true,
      quota_remaining: { value: null, unit: "unknown" },
      reserve_floor: { value: 0, unit: "none" },
      reset_at: null,
      cost_mode: "included",
      location: "cloud",
      source: "manual",
      updated_at: FIXED_TS,
    };
    const routed = await evaluateExecutionRoute(
      {
        schema_version: "execution-route-request-v1",
        request_id: "overlay-int-2",
        technical_requirements: ["filesystem", "code_edit"],
        risk_level: "low",
      },
      { registry: REGISTRY, status },
    );
    check(
      "13-qwen-unavailable-filtered",
      collected.status.resources.qwen_local.available === false &&
        !(
          routed.status === "ROUTED" &&
          routed.execution_route?.model === "qwen_local"
        ),
      JSON.stringify(routed),
    );
  }

  for (const r of results) {
    console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
  }
  const failed = results.filter((r) => !r.pass);
  console.log(
    JSON.stringify({
      ok: failed.length === 0,
      classification: failed.length === 0 ? "PASS" : "FAIL",
      passed: results.filter((r) => r.pass).length,
      failed: failed.length,
      total: results.length,
    }),
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(String(err && err.stack ? err.stack : err));
  process.exit(1);
});
