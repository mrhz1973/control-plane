#!/usr/bin/env node
/**
 * Offline tests for compose-v4-resource-status-control-plane-v1.
 * No collectors, probes, providers, Qwen, OpenCode, network, or workflow mutation.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  composeV4ResourceStatus,
  validateComposerResult,
  STATUS_MAX_AGE_MS,
  DEFAULT_REGISTRY_PATH,
  DEFAULT_BASELINE_PATH,
  RESULT_SCHEMA,
} from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

const REGISTRY = loadJson(DEFAULT_REGISTRY_PATH);
const BASELINE = loadJson(DEFAULT_BASELINE_PATH);
const NOW = Date.parse("2026-08-31T12:00:00.000Z");

function iso(ms) {
  return new Date(ms).toISOString();
}

function obs(overrides = {}) {
  return {
    available: false,
    quota_remaining: { value: null, unit: "unknown" },
    reset_at: null,
    cost_mode: "unknown",
    location: "local",
    updated_at: iso(NOW - 1000),
    evidence: { kind: "source_snapshot", classification: null, launch_performed: null, generation_calls: null },
    ...overrides,
  };
}

function contrib(partial) {
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: "c-default",
    producer_id: "test-producer",
    source: "manual",
    produced_at: iso(NOW - 1000),
    resources: {},
    ...partial,
  };
}

async function run() {
  // 1 zero contributions -> schema-valid fail-closed
  {
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [] },
      { nowMs: NOW },
    );
    check(
      "zero-contributions-fail-closed",
      r.ok === true &&
        r.classification === "PASS_RESOURCE_STATUS_COMPOSED" &&
        r.resource_status?.schema_version === "resource-status-v1",
      r.classification,
    );
    // 2 output keys match registry
    const regKeys = Object.keys(REGISTRY.resources).sort();
    const outKeys = Object.keys(r.resource_status.resources).sort();
    check(
      "output-keys-match-registry",
      JSON.stringify(regKeys) === JSON.stringify(outKeys),
      JSON.stringify(outKeys),
    );
    // 3 composer exists despite missing baseline
    check(
      "composer-present-despite-missing-baseline",
      Object.prototype.hasOwnProperty.call(r.resource_status.resources, "composer"),
      "composer missing",
    );
    // 4 synthetic composer shell available=false
    check(
      "composer-shell-unavailable",
      r.resource_status.resources.composer.available === false &&
        r.resource_status.resources.composer.source === "unknown",
      JSON.stringify(r.resource_status.resources.composer),
    );
    // 5 baseline reserve_floor preserved
    check(
      "baseline-reserve-floor-preserved",
      JSON.stringify(r.resource_status.resources.opencode.reserve_floor) ===
        JSON.stringify(BASELINE.resources.opencode.reserve_floor) &&
        JSON.stringify(r.resource_status.resources.qwen_local.reserve_floor) ===
          JSON.stringify(BASELINE.resources.qwen_local.reserve_floor),
      "reserve mismatch",
    );
    // 31 final validates (via compose internal) + 32 wrapper
    const wrap = await validateComposerResult(r);
    check("result-wrapper-validates", wrap.ok === true, JSON.stringify(wrap.reason_codes));
  }

  // 6 valid local opencode contribution selected
  {
    const c = contrib({
      contribution_id: "c-opencode-local",
      source: "local_probe",
      resources: {
        opencode: obs({
          available: true,
          quota_remaining: { value: 10, unit: "calls" },
          cost_mode: "free",
          location: "local",
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "local-opencode-selected",
      r.resource_status.resources.opencode.available === true &&
        r.resource_status.resources.opencode.source === "local_probe" &&
        r.resource_decisions.opencode.selected_contribution_id === "c-opencode-local",
      JSON.stringify(r.resource_decisions.opencode),
    );
  }

  // 7 valid cloud dashboard contribution selected
  {
    const c = contrib({
      contribution_id: "c-cursor-dash",
      source: "dashboard_snapshot",
      resources: {
        cursor: obs({
          available: true,
          quota_remaining: { value: 50, unit: "percent" },
          cost_mode: "included",
          location: "cloud",
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "cloud-dashboard-selected",
      r.resource_status.resources.cursor.available === true &&
        r.resource_status.resources.cursor.source === "dashboard_snapshot",
      JSON.stringify(r.resource_decisions.cursor),
    );
  }

  // 8 provider_api outranks dashboard_snapshot
  {
    const dash = contrib({
      contribution_id: "c-glm-dash",
      source: "dashboard_snapshot",
      produced_at: iso(NOW - 500),
      resources: {
        glm: obs({
          available: true,
          quota_remaining: { value: 20, unit: "percent" },
          cost_mode: "metered",
          location: "cloud",
          updated_at: iso(NOW - 500),
        }),
      },
    });
    const api = contrib({
      contribution_id: "c-glm-api",
      source: "provider_api",
      produced_at: iso(NOW - 2000),
      resources: {
        glm: obs({
          available: true,
          quota_remaining: { value: 80, unit: "percent" },
          cost_mode: "metered",
          location: "cloud",
          updated_at: iso(NOW - 2000),
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [dash, api] },
      { nowMs: NOW },
    );
    check(
      "provider-outranks-dashboard",
      r.resource_decisions.glm.selected_contribution_id === "c-glm-api" &&
        r.resource_status.resources.glm.quota_remaining.value === 80,
      JSON.stringify(r.resource_decisions.glm),
    );
  }

  // 9 same source priority newest updated_at wins
  {
    const older = contrib({
      contribution_id: "c-codex-old",
      source: "manual",
      resources: {
        codex: obs({
          available: true,
          location: "cloud",
          cost_mode: "included",
          updated_at: iso(NOW - 10_000),
        }),
      },
    });
    const newer = contrib({
      contribution_id: "c-codex-new",
      source: "manual",
      resources: {
        codex: obs({
          available: true,
          location: "cloud",
          cost_mode: "on_demand",
          updated_at: iso(NOW - 1000),
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [older, newer] },
      { nowMs: NOW },
    );
    check(
      "same-priority-newest-wins",
      r.resource_decisions.codex.selected_contribution_id === "c-codex-new" &&
        r.resource_status.resources.codex.cost_mode === "on_demand",
      JSON.stringify(r.resource_decisions.codex),
    );
  }

  // 10 same rank + same timestamp + same values deterministic
  {
    const a = contrib({
      contribution_id: "c-equiv-b",
      source: "manual",
      resources: {
        grok_bot: obs({
          available: false,
          location: "cloud",
          updated_at: iso(NOW - 2000),
        }),
      },
    });
    const b = contrib({
      contribution_id: "c-equiv-a",
      source: "manual",
      resources: {
        grok_bot: obs({
          available: false,
          location: "cloud",
          updated_at: iso(NOW - 2000),
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [a, b] },
      { nowMs: NOW },
    );
    check(
      "same-rank-same-time-equivalent-deterministic",
      r.resource_decisions.grok_bot.selected_contribution_id === "c-equiv-a" &&
        r.resource_decisions.grok_bot.reason_codes.includes(
          "SAME_RANK_EQUIVALENT_DETERMINISTIC",
        ),
      JSON.stringify(r.resource_decisions.grok_bot),
    );
  }

  // 11 same rank + same timestamp + conflicting values fails closed
  {
    const a = contrib({
      contribution_id: "c-conf-a",
      source: "manual",
      resources: {
        grok_bot: obs({
          available: true,
          location: "cloud",
          cost_mode: "included",
          updated_at: iso(NOW - 2000),
        }),
      },
    });
    const b = contrib({
      contribution_id: "c-conf-b",
      source: "manual",
      resources: {
        grok_bot: obs({
          available: false,
          location: "cloud",
          cost_mode: "unknown",
          updated_at: iso(NOW - 2000),
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [a, b] },
      { nowMs: NOW },
    );
    check(
      "same-rank-conflict-fail-closed",
      r.resource_decisions.grok_bot.classification ===
        "CONTRIBUTION_CONFLICT_FAIL_CLOSED" &&
        r.resource_status.resources.grok_bot.available === false &&
        r.resource_status.resources.grok_bot.source === "unknown",
      JSON.stringify(r.resource_decisions.grok_bot),
    );
  }

  // 12 malformed contribution ignored
  {
    const r = await composeV4ResourceStatus(
      {
        registry: REGISTRY,
        baseline: BASELINE,
        contributions: [{ schema_version: "nope" }],
      },
      { nowMs: NOW },
    );
    check(
      "malformed-contribution-ignored",
      r.ok === true &&
        r.rejected_contributions.some(
          (x) => x.classification === "CONTRIBUTION_SCHEMA_INVALID",
        ),
      JSON.stringify(r.rejected_contributions),
    );
  }

  // 13 duplicate contribution_id copies both rejected
  {
    const a = contrib({
      contribution_id: "dup-id",
      source: "local_probe",
      resources: {
        opencode: obs({ available: true, location: "local", cost_mode: "free" }),
      },
    });
    const b = contrib({
      contribution_id: "dup-id",
      source: "local_probe",
      resources: {
        opencode: obs({ available: true, location: "local", cost_mode: "free" }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [a, b] },
      { nowMs: NOW },
    );
    const dups = r.rejected_contributions.filter(
      (x) => x.classification === "CONTRIBUTION_DUPLICATE_ID",
    );
    check(
      "duplicate-contribution-id-both-rejected",
      dups.length >= 2 &&
        r.resource_status.resources.opencode.available === false,
      JSON.stringify(r.rejected_contributions),
    );
  }

  // 14 unknown resource cannot be created
  {
    const c = contrib({
      contribution_id: "c-unknown-res",
      source: "manual",
      resources: {
        telepathy: obs({ available: true, location: "cloud" }),
      },
    });
    // schema may reject unknown resource as additionalProperties on resources is free
    // but resourceObservation schema applies to any key — telepathy would validate schema-wise
    // then composer rejects unknown registry id
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "unknown-resource-not-created",
      !Object.prototype.hasOwnProperty.call(r.resource_status.resources, "telepathy") &&
        r.rejected_contributions.some(
          (x) => x.classification === "CONTRIBUTION_RESOURCE_UNKNOWN",
        ),
      JSON.stringify(Object.keys(r.resource_status.resources)),
    );
  }

  // 15 stale >300s ignored
  {
    const c = contrib({
      contribution_id: "c-stale",
      source: "local_probe",
      produced_at: iso(NOW - STATUS_MAX_AGE_MS - 1),
      resources: {
        opencode: obs({
          available: true,
          location: "local",
          cost_mode: "free",
          updated_at: iso(NOW - STATUS_MAX_AGE_MS - 1),
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "stale-ignored",
      r.resource_status.resources.opencode.available === false &&
        r.rejected_contributions.some((x) => x.classification === "CONTRIBUTION_STALE"),
      JSON.stringify(r.rejected_contributions),
    );
  }

  // 16 exactly 300s accepted
  {
    const c = contrib({
      contribution_id: "c-exact-300",
      source: "local_probe",
      produced_at: iso(NOW - STATUS_MAX_AGE_MS),
      resources: {
        opencode: obs({
          available: true,
          location: "local",
          cost_mode: "free",
          updated_at: iso(NOW - STATUS_MAX_AGE_MS),
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "exactly-300s-accepted",
      r.resource_status.resources.opencode.available === true &&
        r.resource_decisions.opencode.selected_contribution_id === "c-exact-300",
      JSON.stringify(r.resource_decisions.opencode),
    );
  }

  // 17 future produced_at ignored
  {
    const c = contrib({
      contribution_id: "c-future-prod",
      source: "local_probe",
      produced_at: iso(NOW + 60_000),
      resources: {
        opencode: obs({ available: true, location: "local", cost_mode: "free" }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "future-produced-at-ignored",
      r.resource_status.resources.opencode.available === false &&
        r.rejected_contributions.some(
          (x) => x.classification === "CONTRIBUTION_FUTURE_DATED",
        ),
      JSON.stringify(r.rejected_contributions),
    );
  }

  // 18 future updated_at ignored
  {
    const c = contrib({
      contribution_id: "c-future-upd",
      source: "local_probe",
      produced_at: iso(NOW - 1000),
      resources: {
        opencode: obs({
          available: true,
          location: "local",
          cost_mode: "free",
          updated_at: iso(NOW + 60_000),
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "future-updated-at-ignored",
      r.resource_status.resources.opencode.available === false &&
        r.rejected_contributions.some(
          (x) => x.classification === "CONTRIBUTION_FUTURE_DATED",
        ),
      JSON.stringify(r.rejected_contributions),
    );
  }

  // 19 secret-like contribution rejected
  {
    const c = contrib({
      contribution_id: "c-secret",
      source: "manual",
      producer_id: "Bearer sk-abcdefghijklmnopqrstuvwxyz012345",
      resources: {
        cursor: obs({ available: true, location: "cloud", cost_mode: "included" }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "secret-like-rejected",
      r.resource_status.resources.cursor.available === false &&
        r.rejected_contributions.some(
          (x) => x.classification === "CONTRIBUTION_SECRET_LIKE",
        ),
      JSON.stringify(r.rejected_contributions),
    );
  }

  // 20 local_probe positive cloud resource rejected
  {
    const c = contrib({
      contribution_id: "c-local-cloud",
      source: "local_probe",
      resources: {
        cursor: obs({ available: true, location: "cloud", cost_mode: "included" }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "local-probe-cloud-rejected",
      r.resource_status.resources.cursor.available === false &&
        r.rejected_contributions.some(
          (x) => x.classification === "CONTRIBUTION_SOURCE_INCOMPATIBLE",
        ),
      JSON.stringify(r.rejected_contributions),
    );
  }

  // 21 provider/dashboard positive local resource rejected
  {
    const c = contrib({
      contribution_id: "c-api-local",
      source: "provider_api",
      resources: {
        opencode: obs({ available: true, location: "local", cost_mode: "free" }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "provider-local-rejected",
      r.resource_status.resources.opencode.available === false &&
        r.rejected_contributions.some(
          (x) => x.classification === "CONTRIBUTION_SOURCE_INCOMPATIBLE",
        ),
      JSON.stringify(r.rejected_contributions),
    );
  }

  function qwenObs(extra) {
    return obs({
      available: true,
      location: "local",
      cost_mode: "free",
      quota_remaining: { value: null, unit: "unknown" },
      evidence: {
        kind: "qwen_occupancy",
        classification: "QWEN_READY_IDLE",
        launch_performed: false,
        generation_calls: 0,
        ...extra,
      },
    });
  }

  // 22 qwen READY_IDLE + no launch + generations0 -> available=true
  {
    const c = contrib({
      contribution_id: "c-qwen-ready",
      source: "local_probe",
      resources: { qwen_local: qwenObs({}) },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "qwen-ready-idle-available",
      r.resource_status.resources.qwen_local.available === true &&
        r.resource_decisions.qwen_local.classification === "QWEN_READY_IDLE_ACCEPTED",
      JSON.stringify(r.resource_decisions.qwen_local),
    );
  }

  // 23 BUSY -> available=false
  {
    const c = contrib({
      contribution_id: "c-qwen-busy",
      source: "local_probe",
      resources: {
        qwen_local: qwenObs({ classification: "QWEN_BUSY_SHARED_RUNTIME" }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "qwen-busy-unavailable",
      r.resource_status.resources.qwen_local.available === false &&
        r.resource_decisions.qwen_local.classification === "QWEN_BUSY_FAIL_CLOSED",
      JSON.stringify(r.resource_decisions.qwen_local),
    );
  }

  // 24 UNCERTAIN
  {
    const c = contrib({
      contribution_id: "c-qwen-unc",
      source: "local_probe",
      resources: {
        qwen_local: qwenObs({ classification: "QWEN_OCCUPANCY_UNCERTAIN" }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "qwen-uncertain-unavailable",
      r.resource_status.resources.qwen_local.available === false &&
        r.resource_decisions.qwen_local.classification ===
          "QWEN_OCCUPANCY_UNCERTAIN_FAIL_CLOSED",
      JSON.stringify(r.resource_decisions.qwen_local),
    );
  }

  // 25 NOT_RUNNING_SAFE_TO_START
  {
    const c = contrib({
      contribution_id: "c-qwen-nr",
      source: "local_probe",
      resources: {
        qwen_local: qwenObs({ classification: "QWEN_NOT_RUNNING_SAFE_TO_START" }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "qwen-not-running-unavailable",
      r.resource_status.resources.qwen_local.available === false &&
        r.resource_decisions.qwen_local.classification === "QWEN_NOT_RUNNING_FAIL_CLOSED",
      JSON.stringify(r.resource_decisions.qwen_local),
    );
  }

  // 26 READY_IDLE + launch_performed=true cannot become available
  {
    const c = contrib({
      contribution_id: "c-qwen-launch",
      source: "local_probe",
      resources: { qwen_local: qwenObs({ launch_performed: true }) },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "qwen-launch-forbidden",
      r.resource_status.resources.qwen_local.available === false,
      JSON.stringify(r.resource_decisions.qwen_local),
    );
  }

  // 27 READY_IDLE + generation_calls=1 cannot become available
  {
    const c = contrib({
      contribution_id: "c-qwen-gen",
      source: "local_probe",
      resources: { qwen_local: qwenObs({ generation_calls: 1 }) },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "qwen-generation-forbidden",
      r.resource_status.resources.qwen_local.available === false,
      JSON.stringify(r.resource_decisions.qwen_local),
    );
  }

  // 28 manual qwen available=true rejected
  {
    const c = contrib({
      contribution_id: "c-qwen-manual",
      source: "manual",
      resources: {
        qwen_local: obs({
          available: true,
          location: "local",
          cost_mode: "free",
          evidence: {
            kind: "qwen_occupancy",
            classification: "QWEN_READY_IDLE",
            launch_performed: false,
            generation_calls: 0,
          },
        }),
      },
    });
    const r = await composeV4ResourceStatus(
      { registry: REGISTRY, baseline: BASELINE, contributions: [c] },
      { nowMs: NOW },
    );
    check(
      "manual-qwen-available-rejected",
      r.resource_status.resources.qwen_local.available === false &&
        r.rejected_contributions.some(
          (x) =>
            x.classification === "CONTRIBUTION_SOURCE_INCOMPATIBLE" ||
            x.contribution_id === "c-qwen-manual",
        ),
      JSON.stringify({
        d: r.resource_decisions.qwen_local,
        rej: r.rejected_contributions,
      }),
    );
  }

  // 29 invalid canonical registry -> whole composer fail
  {
    const r = await composeV4ResourceStatus(
      {
        registry: { schema_version: "nope", resources: {} },
        baseline: BASELINE,
        contributions: [],
      },
      { nowMs: NOW },
    );
    check(
      "invalid-registry-fail",
      r.ok === false &&
        r.classification === "RESOURCE_REGISTRY_INVALID" &&
        r.resource_status === null,
      r.classification,
    );
  }

  // 30 invalid baseline -> whole composer fail
  {
    const r = await composeV4ResourceStatus(
      {
        registry: REGISTRY,
        baseline: { schema_version: "nope" },
        contributions: [],
      },
      { nowMs: NOW },
    );
    check(
      "invalid-baseline-fail",
      r.ok === false &&
        r.classification === "FAIL_CLOSED_BASELINE_INVALID" &&
        r.resource_status === null,
      r.classification,
    );
  }

  // 33 no collector/session-manager import
  {
    const src = readFileSync(
      resolve(ROOT, "tools/compose-v4-resource-status-control-plane-v1.mjs"),
      "utf8",
    );
    check(
      "no-collector-session-imports",
      !src.includes("collect-qwen-local-resource-status") &&
        !src.includes("qwen-local-session-manager") &&
        !src.includes("ensureQwenLocalReady") &&
        !src.includes("collectQwenLocalResourceStatus"),
      "forbidden import found",
    );
  }

  // 34 no network/subprocess path
  {
    const src = readFileSync(
      resolve(ROOT, "tools/compose-v4-resource-status-control-plane-v1.mjs"),
      "utf8",
    );
    check(
      "no-network-subprocess",
      !src.includes("fetch(") &&
        !src.includes("child_process") &&
        !src.includes("http://") &&
        !src.includes("https://") &&
        !src.includes("net.") &&
        !src.includes("spawn("),
      "network/subprocess found",
    );
  }

  // 35 CLI emits exactly one structural JSON
  {
    const b64 = Buffer.from(JSON.stringify([])).toString("base64");
    const out = execFileSync(
      "node",
      [
        "tools/compose-v4-resource-status-control-plane-v1.mjs",
        "--contributions-b64",
        b64,
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    const lines = out.trim().split(/\r?\n/).filter(Boolean);
    const parsed = JSON.parse(lines[lines.length - 1]);
    check(
      "cli-one-json-result",
      lines.length === 1 &&
        parsed.schema_version === RESULT_SCHEMA &&
        parsed.ok === true &&
        parsed.classification === "PASS_RESOURCE_STATUS_COMPOSED",
      `${lines.length}/${parsed.classification}`,
    );
  }

  const failed = results.filter((x) => !x.pass);
  const summary = {
    suite: "v4-resource-status-control-plane-source",
    root: ROOT,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});
