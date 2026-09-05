#!/usr/bin/env node
/**
 * V4_RT25_T03 — GLM Coding Plan runtime quota INGEST (real runtime path).
 *
 * Campaign #41 task 03. Source law (#40): MACHINE_STATUS_SOURCE_CONFIRMED
 * (`GET /api/monitor/usage/quota/limit`) but account credential currently ABSENT.
 * This is the REAL runtime ingest for `glm_coding_plan` with two modes:
 *
 *   mode "monitor" — when an operator-provisioned credential is present in the
 *     environment at RUNTIME (name only checked; value never read, logged or
 *     persisted), performs a read-only GET against the documented monitor
 *     endpoint and normalizes the documented JSON envelope
 *     (data.limits[]: type/unit/usage/currentValue/remaining/percentage/
 *     nextResetTime + data.level) into a quota-pool status;
 *   mode "manual"  — normalizes an already-collected snapshot through the
 *     phase-2 translator law (translateQuotaPoolSnapshot kind "glm").
 *
 * With no credential (today) the adapter emits a fail-closed UNKNOWN ingest
 * decision (valid runtime outcome) so downstream joins stay conservative.
 *
 * Output: the same real v4-resource-status-contribution-v1 envelope shape as
 * T02, projecting onto the v1 projection resource `glm`. One shared pool
 * observation serves glm-5.3 + glm-5.3-flash — no per-model counters.
 *
 * CLI:
 *   node tools/rt25-quota-ingest-glm-v1.mjs --out <dir> [--mode auto|manual] [--snapshot <path>] [--now <iso>]
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  translateQuotaPoolSnapshot,
  POOL_IDS,
} from "./translate-quota-pool-snapshot-v1.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const INGEST_SCHEMA = "v4-rt25-quota-ingest-result-v1";

/** v1 projection resource governed by the shared glm pool. */
export const GOVERNED_RESOURCES = Object.freeze(["glm"]);

/** Documented monitor endpoints (from #40 evidence; region selected by env). */
export const MONITOR_ENDPOINTS = Object.freeze({
  global: "https://api.z.ai/api/monitor/usage/quota/limit",
  cn: "https://open.bigmodel.cn/api/monitor/usage/quota/limit",
});

/** Credential env names checked for PRESENCE only (values never read). */
export const CREDENTIAL_ENV_NAMES = Object.freeze(["ZAI_API_KEY", "ZHIPUAI_API_KEY"]);

export function credentialPresent() {
  return CREDENTIAL_ENV_NAMES.some((n) => Boolean(process.env[n]));
}

function iso(ms) {
  return new Date(ms).toISOString();
}

/**
 * Normalize a documented monitor payload (already-fetched JSON body) into the
 * shared pool observation. Pure function — no network here. Only documented
 * fields are read; anything else is ignored (never invented).
 */
export function normalizeMonitorPayload(payload, options = {}) {
  const nowMs = options.nowMs;
  if (!payload || typeof payload !== "object" || !payload.data || typeof payload.data !== "object") {
    return { ok: false, classification: "MONITOR_PAYLOAD_INVALID" };
  }
  const limits = Array.isArray(payload.data.limits) ? payload.data.limits : null;
  if (!limits || limits.length === 0) {
    return { ok: false, classification: "MONITOR_PAYLOAD_NO_LIMITS" };
  }
  const UNIT_MAP = { 3: { window: "rolling", name: "5h" }, 6: { window: "weekly", name: "weekly" } };
  const windows = [];
  for (const lim of limits) {
    if (!lim || typeof lim !== "object") continue;
    const unitInfo = UNIT_MAP[lim.unit];
    if (!unitInfo) continue; // unknown window unit: skip, never invent
    const current = typeof lim.currentValue === "number" ? lim.currentValue : null;
    const total = typeof lim.usage === "number" ? lim.usage : null;
    if (current === null || total === null || total <= 0) continue;
    const remainingFraction = Math.max(0, Math.min(1, (total - current) / total));
    windows.push({
      window_type: unitInfo.window,
      remaining: { value: Math.round(remainingFraction * 1000) / 10, unit: "percent" },
      reset_at: typeof lim.nextResetTime === "number" ? new Date(lim.nextResetTime).toISOString() : null,
    });
  }
  if (windows.length === 0) {
    return { ok: false, classification: "MONITOR_PAYLOAD_NO_KNOWN_WINDOWS" };
  }
  return {
    ok: true,
    status: {
      quota_pool_id: POOL_IDS.glm,
      state: windows.every((w) => w.remaining.value === 0) ? "exhausted" : "available",
      windows,
      source: "provider_api",
      observed_at: iso(nowMs),
      updated_at: iso(nowMs),
      freshness: "fresh",
      reserve_policy_ref: null,
      economics: null,
      plan_level: typeof payload.data.level === "string" ? payload.data.level : null,
    },
  };
}

/** Read-only monitor fetch. Requires credential present; NEVER logs/persists it. */
export async function fetchMonitorPayload(options = {}) {
  if (!credentialPresent()) {
    return { ok: false, classification: "CREDENTIAL_ABSENT_FAIL_CLOSED" };
  }
  const region = options.region === "cn" ? "cn" : "global";
  const url = MONITOR_ENDPOINTS[region];
  try {
    const name = CREDENTIAL_ENV_NAMES.find((n) => process.env[n]);
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env[name]}` },
      signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
    });
    if (!res.ok) {
      return { ok: false, classification: `MONITOR_HTTP_${res.status}` };
    }
    const payload = await res.json();
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, classification: "MONITOR_FETCH_FAILED" };
  }
}

/**
 * Ingest decision for the glm pool. Deterministic given inputs.
 * mode: "auto" (monitor if credential present, else manual snapshot), "manual".
 */
export async function ingestGlmQuota(options = {}) {
  const nowMs =
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const base = {
    schema_version: INGEST_SCHEMA,
    quota_pool_id: POOL_IDS.glm,
    governed_resources: GOVERNED_RESOURCES,
    source_law: "MACHINE_STATUS_SOURCE_CONFIRMED_CREDENTIAL_PENDING",
    classification: null,
    ok: false,
    contribution: null,
    projection_status: null,
    reason_codes: [],
  };

  let poolStatus = null;
  let mode = null;
  if (options.mode !== "manual" && credentialPresent()) {
    const f = await fetchMonitorPayload({ nowMs, region: options.region });
    if (f.ok) {
      const n = normalizeMonitorPayload(f.payload, { nowMs });
      if (n.ok) {
        poolStatus = n.status;
        mode = "monitor";
      } else {
        return { ...base, ok: false, classification: `INGEST_REJECTED_${n.classification}` };
      }
    } else if (options.mode === "monitor") {
      return { ...base, ok: false, classification: `INGEST_FAIL_CLOSED_${f.classification}` };
    }
  }

  if (!poolStatus) {
    // Manual snapshot lane (already-collected evidence), translator law.
    if (!options.snapshot) {
      return {
        ...base,
        ok: true, // fail-closed UNKNOWN is a valid runtime ingest outcome
        classification: "INGEST_FAIL_CLOSED_UNKNOWN_NO_EVIDENCE",
        reason_codes: ["CREDENTIAL_ABSENT", "NO_SNAPSHOT_PROVIDED"],
      };
    }
    const t = translateQuotaPoolSnapshot(options.snapshot, { kind: "glm", nowMs });
    if (!t.ok) {
      const isStale = t.classification === "SNAPSHOT_STALE";
      return {
        ...base,
        ok: isStale,
        classification: isStale ? "INGEST_FAIL_CLOSED_STALE" : `INGEST_REJECTED_${t.reason_codes[0] || t.classification}`,
        reason_codes: [...t.reason_codes],
      };
    }
    poolStatus = t.quota_pool_status;
    mode = "manual";
  }

  const freshWindow = [...poolStatus.windows]
    .filter((w) => w.freshness === "fresh" && typeof w.remaining?.value === "number")
    .sort((a, b) => b.remaining.value - a.remaining.value)[0] || null;
  const projectedAvailable = poolStatus.state === "available" && freshWindow && freshWindow.remaining.value > 0;
  const quotaValue = freshWindow ? freshWindow.remaining.value : null;

  const evidenceClassification = `QUOTA_POOL_INGEST_${poolStatus.state.toUpperCase()}_MODE_${mode.toUpperCase()}_FRESH_${poolStatus.freshness.toUpperCase()}`;
  const projection_status = {};
  for (const rid of GOVERNED_RESOURCES) {
    projection_status[rid] = {
      available: projectedAvailable === true,
      quota_remaining: { value: projectedAvailable ? quotaValue : quotaValue ?? 0, unit: quotaValue === null ? "unknown" : "percent" },
      reset_at: freshWindow?.reset_at || freshWindow?.window_ends_at || null,
      cost_mode: "included",
      location: "cloud",
      updated_at: iso(nowMs),
      evidence: { kind: "source_snapshot", classification: evidenceClassification },
    };
  }

  const contribution = {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `rt25-glm-quota-${POOL_IDS.glm}-${poolStatus.observed_at}`,
    producer_id: "rt25-quota-ingest-glm-v1",
    source: poolStatus.source === "provider_api" ? "provider_api" : "dashboard_snapshot",
    produced_at: iso(nowMs),
    resources: projection_status,
  };

  return {
    ...base,
    ok: true,
    mode,
    classification: projectedAvailable
      ? "INGEST_PASS_QUOTA_PROJECTED"
      : poolStatus.state === "exhausted"
        ? "INGEST_PASS_POOL_EXHAUSTED_PROJECTED_UNAVAILABLE"
        : "INGEST_PASS_UNKNOWN_PROJECTED_UNAVAILABLE",
    contribution,
    projection_status,
    reason_codes: [
      projectedAvailable ? "QUOTA_REMAINING_OBSERVED" : "QUOTA_UNKNOWN_FAIL_CLOSED",
      "SHARED_POOL_SINGLE_OBSERVATION_GLM_5_3_AND_FLASH",
    ],
  };
}

/** Runtime ingest pass: write the decision envelope into the untracked runtime lane. */
export async function runGlmIngestPass(options = {}) {
  const outDir = options.outDir;
  mkdirSync(outDir, { recursive: true });
  let snapshot;
  if (options.snapshotPath) {
    const p = resolve(options.snapshotPath);
    if (existsSync(p)) snapshot = JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
  }
  const decision = await ingestGlmQuota({ ...options, snapshot });
  const outFile = resolve(outDir, `glm-quota-decision.json`);
  writeFileSync(outFile, `${JSON.stringify(decision)}\n`);
  return decision;
}

function main() {
  const argv = process.argv.slice(2);
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i !== -1 ? argv[i + 1] : null;
  };
  const outDir = get("--out");
  const snapshotPath = get("--snapshot");
  const modeArg = get("--mode");
  const nowArg = get("--now");
  const nowMs = nowArg ? Date.parse(nowArg) : Date.now();
  if (!outDir || !Number.isFinite(nowMs)) {
    process.stdout.write(`${JSON.stringify({ schema_version: INGEST_SCHEMA, ok: false, classification: "USAGE_ERROR" })}\n`);
    process.exit(1);
  }
  runGlmIngestPass({
    outDir: resolve(outDir),
    snapshotPath,
    mode: modeArg === "manual" ? "manual" : "auto",
    nowMs,
  })
    .then((d) => process.stdout.write(`${JSON.stringify(d)}\n`))
    .catch((e) => {
      process.stdout.write(`${JSON.stringify({ schema_version: INGEST_SCHEMA, ok: false, classification: "INGEST_ERROR", reason_codes: [String(e && e.message ? e.message : e)] })}\n`);
      process.exit(0);
    });
}

const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
