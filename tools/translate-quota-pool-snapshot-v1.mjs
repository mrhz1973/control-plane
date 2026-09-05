#!/usr/bin/env node
/**
 * V4 — Codex subscription shared quota-pool snapshot TRANSLATOR (phase 1 #39).
 *
 * Deterministic, OFFLINE translation of an ALREADY-COLLECTED normalized/manual
 * ChatGPT/Codex usage dashboard snapshot into ONE quota-pool-status-v1 entry bound
 * to registry-v2 quota_pool_id "chatgpt_codex_subscription".
 *
 * The translator NEVER: accesses ChatGPT/Codex UI, scrapes/browses, invokes Codex,
 * calls OpenAI APIs, reads credentials/cookies, or hardcodes live observed values.
 * Contract: docs/contracts/quota-pool-status-v1.md
 *
 * Usage:
 *   node tools/translate-quota-pool-snapshot-v1.mjs codex <snapshot.json> [--now <iso>]
 *   node tools/translate-quota-pool-snapshot-v1.mjs glm <snapshot.json> [--now <iso>]
 *
 * Exit: 0 on PASS, 1 on fail-closed classification (result always one JSON line).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const RESULT_SCHEMA = "quota-pool-status-translate-result-v1";
export const STATUS_SCHEMA = "quota-pool-status-v1";
export const QUOTA_POOL_STATUS_MAX_AGE_MS = 300_000;

/** Registry-v2 pool ids (binding law §1 of quota-pool-status-v1). */
export const POOL_IDS = Object.freeze({
  codex: "chatgpt_codex_subscription",
  glm: "glm_coding_plan",
});

const WINDOW_TYPES = new Set(["rolling", "weekly", "monthly"]);

function result(extra = {}, ok = false, classification = "SNAPSHOT_INVALID") {
  return {
    schema_version: RESULT_SCHEMA,
    ok,
    classification,
    quota_pool_status: null,
    reason_codes: [],
    ...extra,
  };
}

function isIsoDateString(v) {
  return (
    typeof v === "string" &&
    !Number.isNaN(Date.parse(v)) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)
  );
}

function looksSecretLike(text) {
  return /(sk-[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/.test(
    text,
  );
}

/**
 * Normalize ONE observed window entry from snapshot input.
 * Returns { ok, window?, reason? } — never invents values.
 */
function normalizeWindow(raw, observedAt, nowMs, reasonCodes) {
  if (!raw || typeof raw !== "object") {
    reasonCodes.push("SNAPSHOT_MISSING_DATA");
    return { ok: false };
  }
  const typeRaw = typeof raw.window_type === "string" ? raw.window_type.toLowerCase() : "unknown";
  const window_type = WINDOW_TYPES.has(typeRaw) ? typeRaw : "unknown";

  let remaining = { value: null, unit: "unknown" };
  const r = raw.remaining;
  if (r && typeof r === "object") {
    const unit = r.unit === "percent" ? "percent" : r.unit === "normalized" ? "normalized" : "unknown";
    const v = r.value;
    if (unit === "unknown") {
      // unknown unit requires null value; missing data stays unknown (not available)
      remaining = { value: null, unit: "unknown" };
    } else if (typeof v !== "number" || !Number.isFinite(v)) {
      reasonCodes.push("SNAPSHOT_INVALID_PERCENT");
      return { ok: false };
    } else if (unit === "percent" && (v < 0 || v > 100)) {
      reasonCodes.push("SNAPSHOT_INVALID_PERCENT");
      return { ok: false };
    } else if (unit === "normalized" && (v < 0 || v > 1)) {
      reasonCodes.push("SNAPSHOT_INVALID_PERCENT");
      return { ok: false };
    } else {
      remaining = { value: v, unit };
    }
  } else {
    reasonCodes.push("SNAPSHOT_MISSING_DATA");
  }

  let window_ends_at = null;
  let reset_at = null;
  for (const [key, out] of [
    ["window_ends_at", "window_ends_at"],
    ["reset_at", "reset_at"],
  ]) {
    const v = raw[key];
    if (v === undefined || v === null) continue;
    if (!isIsoDateString(v)) {
      reasonCodes.push("SNAPSHOT_INVALID_RESET_AT");
      return { ok: false };
    }
    if (Date.parse(v) > nowMs) {
      // future reset/window end is evidence about the future: allowed only when
      // the snapshot itself is not future-dated; a window ending in the future is
      // normal. We keep ISO validity, value passes through.
    }
    if (out === "window_ends_at") window_ends_at = v;
    else reset_at = v;
  }

  const observedMs = Date.parse(observedAt);
  const windowFreshness = observedMs <= nowMs && nowMs - observedMs <= QUOTA_POOL_STATUS_MAX_AGE_MS
    ? "fresh"
    : "stale";

  return { ok: true, window: { window_type, remaining, window_ends_at, reset_at, freshness: windowFreshness } };
}

/**
 * Translate a normalized Codex/GLM quota snapshot (already collected) into one
 * quota-pool-status-v1 pool entry.
 *
 * options.kind: "codex" | "glm"
 * options.nowMs: injectable evaluation clock (ms epoch). Default: real time.
 * Deterministic; no network; no subprocess.
 */
export function translateQuotaPoolSnapshot(snapshot, options = {}) {
  const kind = options.kind;
  const poolId = POOL_IDS[kind];
  const nowMs = typeof options.nowMs === "number" ? options.nowMs : Date.now();
  if (!poolId) {
    return result({ reason_codes: ["SNAPSHOT_INVALID"], reason: `unknown kind: ${kind}` });
  }

  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return result({ reason_codes: ["SNAPSHOT_INVALID"] });
  }

  const flat = JSON.stringify(snapshot);
  if (looksSecretLike(flat)) {
    return result({ reason_codes: ["SNAPSHOT_SECRET_LIKE"] });
  }

  const observedAt = snapshot.observed_at;
  if (!isIsoDateString(observedAt)) {
    return result({ reason_codes: ["SNAPSHOT_MISSING_DATA"], reason: "observed_at required ISO" });
  }
  const observedMs = Date.parse(observedAt);
  if (observedMs > nowMs) {
    return result({ reason_codes: ["SNAPSHOT_FUTURE_DATED"] });
  }
  if (nowMs - observedMs > QUOTA_POOL_STATUS_MAX_AGE_MS) {
    return result(
      {
        reason_codes: ["SNAPSHOT_STALE"],
        quota_pool_status: {
          quota_pool_id: poolId,
          state: "unknown",
          windows: [],
          source: "dashboard_snapshot",
          observed_at: observedAt,
          updated_at: new Date(nowMs).toISOString(),
          freshness: "stale",
          reserve_policy_ref: null,
          economics: null,
        },
      },
      false,
      "SNAPSHOT_STALE",
    );
  }

  const source = snapshot.source;
  if (source !== "dashboard_snapshot" && source !== "manual") {
    return result({ reason_codes: ["SNAPSHOT_MISSING_DATA"], reason: "source must be dashboard_snapshot|manual" });
  }

  const rawWindows = Array.isArray(snapshot.windows) ? snapshot.windows : null;
  if (!rawWindows || rawWindows.length === 0) {
    return result({ reason_codes: ["SNAPSHOT_MISSING_DATA"], reason: "windows[] required" });
  }

  const reasonCodes = [];
  const windows = [];
  for (const raw of rawWindows) {
    const w = normalizeWindow(raw, observedAt, nowMs, reasonCodes);
    if (!w.ok) {
      return result({ reason_codes: [...new Set(reasonCodes)] });
    }
    windows.push(w.window);
  }

  // state: observed remaining drives state; anything unknown/none observed stays unknown.
  const positiveObserved = windows.some(
    (w) => w.remaining.unit !== "unknown" && typeof w.remaining.value === "number" && w.remaining.value > 0,
  );
  const zeroObserved =
    windows.length > 0 &&
    windows.every(
      (w) =>
        w.remaining.unit !== "unknown" &&
        typeof w.remaining.value === "number" &&
        w.remaining.value === 0,
    );
  const state = positiveObserved ? "available" : zeroObserved ? "exhausted" : "unknown";

  // economics: ONLY when explicitly supplied and marked verified. Otherwise unknown.
  let economics = null;
  const e = snapshot.economics;
  if (e && typeof e === "object" && e.verified === true && e.payload && typeof e.payload === "object") {
    economics = { verified: true, payload: e.payload };
  }

  const freshness = "fresh"; // observed_at already proven within max age
  const status = {
    quota_pool_id: poolId,
    state,
    windows,
    source,
    observed_at: observedAt,
    updated_at: new Date(nowMs).toISOString(),
    freshness,
    reserve_policy_ref:
      typeof snapshot.reserve_policy_ref === "string" && snapshot.reserve_policy_ref.trim()
        ? snapshot.reserve_policy_ref
        : null,
    economics,
  };

  return result(
    {
      quota_pool_status: status,
      reason_codes: [...new Set(reasonCodes)],
    },
    true,
    "PASS_QUOTA_POOL_STATUS_TRANSLATED",
  );
}

/** Compose one full quota-pool-status-v1 document from a translated status. */
export function composeQuotaPoolStatusDoc(status, nowMs) {
  return {
    schema_version: STATUS_SCHEMA,
    generated_at: new Date(nowMs).toISOString(),
    quota_pools: { [status.quota_pool_id]: status },
  };
}

function emit(r, code) {
  process.stdout.write(`${JSON.stringify(r)}\n`);
  process.exit(code);
}

function main() {
  const [kind, snapPath] = process.argv.slice(2, 4);
  const nowIdx = process.argv.indexOf("--now");
  const nowMs = nowIdx !== -1 && process.argv[nowIdx + 1] ? Date.parse(process.argv[nowIdx + 1]) : Date.now();
  if (!kind || !snapPath || !POOL_IDS[kind] || !Number.isFinite(nowMs)) {
    emit(result({ reason_codes: ["USAGE_ERROR"] }), 1);
  }
  const abs = resolve(process.cwd(), snapPath);
  if (!existsSync(abs)) {
    emit(result({ reason_codes: ["SNAPSHOT_INVALID"], reason: `not found: ${abs}` }), 1);
  }
  let snapshot;
  try {
    snapshot = JSON.parse(readFileSync(abs, "utf8").replace(/^\uFEFF/, ""));
  } catch (err) {
    emit(result({ reason_codes: ["SNAPSHOT_INVALID"], reason: String(err.message || err) }), 1);
  }
  const out = translateQuotaPoolSnapshot(snapshot, { kind, nowMs });
  emit(out, out.ok ? 0 : 1);
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  try {
    main();
  } catch (err) {
    emit(result({ reason_codes: ["SNAPSHOT_INVALID"], reason: String(err && err.stack ? err.stack : err) }), 1);
  }
}
