#!/usr/bin/env node
/**
 * V4_RT25_T02 — Codex runtime quota INGEST (real runtime path).
 *
 * Campaign #41 task 02. Codex quota source law (#40): MANUAL_DASHBOARD_ONLY.
 * This is the REAL runtime ingest for `chatgpt_codex_subscription`:
 *   1. reads the operator-provided dashboard snapshot from the runtime ingest
 *      directory (queue-style, one JSON per snapshot file), or an explicit
 *      single-snapshot path;
 *   2. normalizes it through the phase-1 deterministic translator
 *      (translate-quota-pool-snapshot-v1.mjs, kind "codex") — no invention;
 *   3. emits a REAL v4-resource-status-contribution-v1 envelope so the live
 *      composer (compose-v4-resource-status-control-plane-v1.mjs) can ingest
 *      quota state for the projection resources bound to the pool
 *      (codex_subscription_models, codex) through the standard contributions lane;
 *   4. never writes into Git-tracked paths; never invents values; never touches
 *      Codex, ChatGPT, OpenAI API/BYOK, or any credential.
 *
 * CLI:
 *   node tools/rt25-quota-ingest-codex-v1.mjs --snapshot <path> --out <dir> [--now <iso>]
 *   node tools/rt25-quota-ingest-codex-v1.mjs --watch-dir <dir> --out <dir> [--now <iso>]   (single pass, non-daemon)
 *
 * Exit 0 = an ingest decision was produced (PASS or fail-closed UNKNOWN), 1 = usage error.
 */
import { readFileSync, existsSync, statSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  translateQuotaPoolSnapshot,
  POOL_IDS,
} from "./translate-quota-pool-snapshot-v1.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const INGEST_SCHEMA = "v4-rt25-quota-ingest-result-v1";

/** Registry (v1 projection) resources whose runtime quota state is GOVERNED by the codex pool. */
export const GOVERNED_RESOURCES = Object.freeze(["codex"]);

function iso(ms) {
  return new Date(ms).toISOString();
}

function findSnapshotFiles(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .map((f) => resolve(dir, f))
    .sort();
}

/**
 * Ingest ONE Codex dashboard snapshot into a runtime ingest decision:
 * { decision, contribution?, projection_status? }.
 * Deterministic; options.nowMs injectable.
 */
export function ingestCodexQuotaSnapshot(snapshot, options = {}) {
  const nowMs =
    typeof options.nowMs === "number" && Number.isFinite(options.nowMs)
      ? options.nowMs
      : Date.now();
  const base = {
    schema_version: INGEST_SCHEMA,
    quota_pool_id: POOL_IDS.codex,
    governed_resources: GOVERNED_RESOURCES,
    source_law: "MANUAL_DASHBOARD_ONLY",
    classification: null,
    ok: false,
    contribution: null,
    projection_status: null,
    reason_codes: [],
  };

  const t = translateQuotaPoolSnapshot(snapshot, { kind: "codex", nowMs });

  // STALE input: still persist the decision as a fail-closed ingest outcome.
  if (!t.ok) {
    const isStale = t.classification === "SNAPSHOT_STALE";
    const preciseCode = t.reason_codes[0] || t.classification;
    return {
      ...base,
      ok: isStale, // stale ingests are valid fail-closed outcomes, not usage errors
      classification: isStale ? "INGEST_FAIL_CLOSED_STALE" : `INGEST_REJECTED_${preciseCode}`,
      reason_codes: [...t.reason_codes],
    };
  }

  const status = t.quota_pool_status;
  const snapshotSource = status.source;
  const remainingWindow = [...status.windows]
    .filter((w) => w.freshness === "fresh" && typeof w.remaining?.value === "number")
    .sort((a, b) => b.remaining.value - a.remaining.value)[0] || null;

  const state = status.state;
  const projectedAvailable = state === "available" && remainingWindow && remainingWindow.remaining.value > 0;
  const quotaValue = remainingWindow
    ? remainingWindow.remaining.unit === "normalized"
      ? Math.round(remainingWindow.remaining.value * 1000) / 10
      : remainingWindow.remaining.value
    : null;

  // Runtime projection: one entry per governed resource (same pool evidence, no
  // double counting — all entries derive from the SAME single pool observation).
  // Pool identity is encoded in contribution_id (contribution schema has
  // additionalProperties:false; evidence kinds are fixed by contract).
  const contributionId = `rt25-codex-quota-${POOL_IDS.codex}-${status.observed_at}`;
  const evidenceClassification = `QUOTA_POOL_INGEST_${state.toUpperCase()}_FRESH_${status.freshness.toUpperCase()}`;
  const projection_status = {};
  for (const rid of GOVERNED_RESOURCES) {
    projection_status[rid] = {
      available: projectedAvailable === true,
      quota_remaining: { value: projectedAvailable ? quotaValue : quotaValue ?? 0, unit: quotaValue === null ? "unknown" : "percent" },
      reset_at:
        remainingWindow?.reset_at ||
        remainingWindow?.window_ends_at ||
        null,
      cost_mode: "included",
      location: "cloud",
      updated_at: iso(nowMs),
      evidence: {
        kind: "source_snapshot",
        classification: evidenceClassification,
      },
    };
  }

  const contribution = {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: contributionId,
    producer_id: "rt25-quota-ingest-codex-v1",
    source: "dashboard_snapshot",
    produced_at: iso(nowMs),
    resources: projection_status,
  };

  return {
    ...base,
    ok: true,
    classification:
      projectedAvailable === true
        ? "INGEST_PASS_QUOTA_PROJECTED"
        : state === "exhausted"
          ? "INGEST_PASS_POOL_EXHAUSTED_PROJECTED_UNAVAILABLE"
          : "INGEST_PASS_UNKNOWN_PROJECTED_UNAVAILABLE",
    contribution,
    projection_status,
    reason_codes: [
      projectedAvailable ? "QUOTA_REMAINING_OBSERVED" : "QUOTA_UNKNOWN_FAIL_CLOSED",
      "SHARED_POOL_SINGLE_OBSERVATION",
    ],
  };
}

/**
 * Runtime ingest pass: process snapshot files from a directory (or one explicit
 * snapshot), write ingest decision JSON files into outDir (untracked runtime lane).
 */
export function runIngestPass({ snapshotPath, watchDir, outDir, nowMs }) {
  mkdirSync(outDir, { recursive: true });
  const files = snapshotPath
    ? [resolve(snapshotPath)]
    : findSnapshotFiles(resolve(watchDir || "."));
  const results = [];
  for (const f of files) {
    if (!existsSync(f)) continue;
    let snapshot;
    try {
      snapshot = JSON.parse(readFileSync(f, "utf8").replace(/^\uFEFF/, ""));
    } catch {
      results.push({ file: basename(f), decision: { schema_version: INGEST_SCHEMA, ok: false, classification: "INGEST_REJECTED_SNAPSHOT_INVALID", reason_codes: ["SNAPSHOT_INVALID"] } });
      continue;
    }
    const decision = ingestCodexQuotaSnapshot(snapshot, { nowMs });
    const outFile = resolve(outDir, `codex-quota-${basename(f)}`);
    writeFileSync(outFile, `${JSON.stringify(decision)}\n`);
    results.push({ file: basename(f), decision });
  }
  return results;
}

function main() {
  const argv = process.argv.slice(2);
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i !== -1 ? argv[i + 1] : null;
  };
  const snapshotPath = get("--snapshot");
  const watchDir = get("--watch-dir");
  const outDir = get("--out");
  const nowArg = get("--now");
  const nowMs = nowArg ? Date.parse(nowArg) : Date.now();
  if (!outDir || !Number.isFinite(nowMs) || (!snapshotPath && !watchDir)) {
    process.stdout.write(`${JSON.stringify({ schema_version: INGEST_SCHEMA, ok: false, classification: "USAGE_ERROR" })}\n`);
    process.exit(1);
  }
  const results = runIngestPass({ snapshotPath, watchDir, outDir, nowMs });
  process.stdout.write(`${JSON.stringify({ schema_version: INGEST_SCHEMA, ok: true, classification: "INGEST_PASS_COMPLETE", files: results.length, results })}\n`);
}

const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
