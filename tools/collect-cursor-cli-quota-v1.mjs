#!/usr/bin/env node
/**
 * collect-cursor-cli-quota-v1 — PARTIAL LIVE read-only Cursor CLI quota
 * collector (#81, V4_CURSOR_CLI_LIVE_QUOTA_SOURCE_QUALIFICATION_AND_WIRING_V1).
 *
 * Qualified surface (Phase A, 2026-09-17):
 *   cursor-agent about --format json
 *     → { cliVersion, subscriptionTier, model, os*, userEmail, lastRequestId }
 * The ONLY quota-meaningful, non-personal field is `subscriptionTier`
 * (plan identity). NO usage percentages, NO reset timestamps, NO pool
 * breakdowns are exposed by any documented first-party read-only command
 * (`status|whoami --format json` = auth booleans + userInfo only; `models`
 * = plain text list; no `usage` command exists in this CLI version
 * 2026.09.10-fd3934a).
 *
 * Scope law (#81):
 *   - PLAN ONLY wiring: plan=subscriptionTier (LIVE) when a fresh valid
 *     observation exists. All other Cursor quota fields (labels/pools,
 *     reset dates, on-demand state) remain the existing MANUAL evidence
 *     with their own provenance — NEVER silently relabeled live.
 *   - NO quota-pool contribution is emitted (no invented numbers): this
 *     collector reports identity metadata only.
 *
 * LAWS (mirrors collect-openclaw-quota-v1):
 *   - FIXED arguments only: about --format json; execFile/spawn semantics,
 *     NEVER a shell string; never login/logout; never `cursor-agent update`;
 *     never starts the IDE; never consumes model quota; never mutates
 *     Cursor state or config.
 *   - SECRET FENCE: only quota-necessary non-personal fields are copied
 *     (subscriptionTier, cliVersion). userEmail/userId/lastRequestId and any
 *     token-like material are NEVER read, returned, logged or persisted; a
 *     defensive secret scan fails the observation closed.
 *   - FAILURE LAW: any absence/timeout/command failure/invalid JSON/missing
 *     tier degrades to UNKNOWN with a bounded reason code. No fallback
 *     values are invented; failures never fake freshness.
 *   - GET-side mutation FORBIDDEN: zero writes; in-memory cache only.
 *
 * Cache law: bounded in-memory single-flight cache (default TTL 300s =
 * QUOTA_DISPLAY_FRESH_MS) so GET /v1/resources never executes the CLI on
 * every browser refresh. A failed refresh keeps the previous observation
 * only as STALE (degraded) until a refresh succeeds.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const CURSOR_CLI_QUOTA_SCHEMA = "cursor-cli-quota-observation-v1";
export const CURSOR_ABOUT_ARGS = Object.freeze(["about", "--format", "json"]);
export const CURSOR_CLI_CACHE_TTL_MS = 300_000;
/** Observed live runtime ≈1.2s per invocation; bound stays above it. */
export const CURSOR_CLI_TIMEOUT_MS = 15_000;
const MAX_STDOUT_BYTES = 65_536;
const MAX_STDERR_BYTES = 4_096;
const MAX_TIER = 40;
const MAX_REASON = 60;
const FUTURE_TOLERANCE_MS = 60_000;

/** Freshness display law: same horizon as the quota display convention. */
const FRESH_MS = 300_000;

const SECRET_SCAN_RE =
  /sk-[A-Za-z0-9]{10,}|Bearer\s+[A-Za-z0-9._\-+=/]{8,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;
/** Personal/identifier material never leaves this module. */
const PERSONAL_FIELDS = Object.freeze(["userEmail", "userInfo", "userId", "lastRequestId"]);

function boundStr(value, max) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length <= max ? s : s.slice(0, max);
}

function boundReason(value) {
  return boundStr(value, MAX_REASON) || "CURSOR_CLI_ABOUT_FAILED";
}

function isoFromMs(ms) {
  return new Date(ms).toISOString();
}

/**
 * Fixed executable resolution (no arbitrary command input):
 *  1. Windows cursor-agent versioned layout
 *     %LOCALAPPDATA%\cursor-agent\versions\<ver>\node.exe running index.js —
 *     this is what the installed cursor-agent.ps1/.cmd shims invoke internally;
 *  2. fallback: `cursor-agent` command on PATH (execFile, no shell).
 */
let resolvedLaunchCache = null;
export function resolveCursorCliLaunch(exists = existsSync, env = process.env) {
  if (resolvedLaunchCache) return resolvedLaunchCache;
  const localAppData = env && env.LOCALAPPDATA ? String(env.LOCALAPPDATA) : null;
  if (localAppData) {
    const versionsDir = join(localAppData, "cursor-agent", "versions");
    try {
      const dirs = exists(versionsDir) ? readdirSync(versionsDir) : [];
      const versionRe = /^\d{4}\.\d{1,2}\.\d{1,2}(-\d{2}-\d{2}-\d{2})?-[a-f0-9]+$/;
      const sorted = dirs
        .filter((name) => versionRe.test(name))
        .sort((a, b) => versionKey(b) - versionKey(a));
      for (const name of sorted) {
        const nodeExe = join(versionsDir, name, "node.exe");
        const indexJs = join(versionsDir, name, "index.js");
        if (exists(nodeExe) && exists(indexJs)) {
          resolvedLaunchCache = Object.freeze({
            kind: "versioned_node_entry",
            file: nodeExe,
            args: Object.freeze([indexJs, ...CURSOR_ABOUT_ARGS]),
          });
          return resolvedLaunchCache;
        }
      }
    } catch { /* fall through */ }
  }
  resolvedLaunchCache = Object.freeze({
    kind: "path_command",
    file: "cursor-agent",
    args: Object.freeze([...CURSOR_ABOUT_ARGS]),
  });
  return resolvedLaunchCache;
}

/** Version dir name → comparable numeric key (YYYYMMDD, build-time aware). */
function versionKey(name) {
  const m = name.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})(?:-(\d{2})-(\d{2})-(\d{2}))?-/);
  if (!m) return 0;
  const [, y, mo, d, hh, mm, ss] = m;
  const pad = (v, len) => String(v).padStart(len, "0");
  return Number(`${y}${pad(mo, 2)}${pad(d, 2)}${pad(hh || 0, 2)}${pad(mm || 0, 2)}${pad(ss || 0, 2)}`);
}

function classifyExecError(err) {
  if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) {
    return { reason_code: "CURSOR_CLI_NOT_FOUND", detail: boundReason(err.code) };
  }
  if (err && (err.killed === true || err.signal === "SIGTERM" || err.code === "ETIMEDOUT" || err.code === "CURSOR_CLI_BACKSTOP")) {
    return { reason_code: "CURSOR_CLI_TIMEOUT", detail: "timeout" };
  }
  return {
    reason_code: "CURSOR_CLI_COMMAND_FAILED",
    detail: boundStr(err && err.code ? err.code : err && err.message ? err.message : "exec_failed", MAX_REASON),
  };
}

/** Injected default runner: spawn semantics with a HARD backstop (Windows-safe). */
async function defaultCursorCliExec(file, args, opts) {
  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    let child = null;
    const backstop = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (child && typeof child.kill === "function") {
        try { child.kill(); } catch { /* best effort */ }
        if (process.platform === "win32" && child.pid) {
          try {
            spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
              windowsHide: true,
              stdio: "ignore",
            });
          } catch { /* best effort */ }
        }
      }
      const err = new Error("cursor-agent about command backstop timeout");
      err.code = "CURSOR_CLI_BACKSTOP";
      rejectPromise(err);
    }, (opts?.timeoutMs || CURSOR_CLI_TIMEOUT_MS) + 5_000);

    try {
      child = spawn(file, args, {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err) {
      settled = true;
      clearTimeout(backstop);
      rejectPromise(err);
      return;
    }

    let stdout = "";
    let stderr = "";
    try {
      child.stdout?.on("data", (chunk) => {
        if (Buffer.byteLength(stdout, "utf8") < MAX_STDOUT_BYTES) stdout += chunk;
      });
    } catch { /* pipe optional */ }
    try {
      child.stderr?.on("data", (chunk) => {
        stderr += String(chunk).slice(0, MAX_STDERR_BYTES);
      });
    } catch { /* pipe optional */ }

    const finish = (err, code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(backstop);
      if (err) rejectPromise(err);
      else if (code === 0) resolvePromise({ stdout, stderr });
      else {
        const e = new Error(`cursor-agent exited ${code ?? ""}${signal ? ` (${signal})` : ""}`);
        e.code = code === null && signal ? "CURSOR_CLI_BACKSTOP" : `EXIT_${code}`;
        e.killed = signal === "SIGTERM" || signal === "SIGKILL";
        rejectPromise(e);
      }
    };

    child.on("error", (err) => finish(err));
    child.on("close", (code, signal) => finish(null, code, signal));
  });
}

/** Normalize ONLY the qualified non-personal fields; everything else dropped. */
function normalizeAboutJson(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const tier = boundStr(parsed.subscriptionTier, MAX_TIER);
  if (!tier || SECRET_SCAN_RE.test(tier)) return null;
  const cliVersion = boundStr(parsed.cliVersion, MAX_TIER);
  return { plan: tier, cli_version: cliVersion || null };
}

function unknownObservation(collectedAtMs, reasonCode, launch) {
  return {
    schema_version: CURSOR_CLI_QUOTA_SCHEMA,
    ok: false,
    state: "UNKNOWN",
    freshness: "stale",
    reason_code: reasonCode,
    reason_codes: [reasonCode],
    observed_at: isoFromMs(collectedAtMs),
    observed_at_ms: collectedAtMs,
    plan: null,
    cli_version: null,
    source: "cursor_cli_about",
    exec: { kind: launch.kind, args: [...launch.args] },
  };
}

/**
 * Core probe: execute the FIXED read-only `about --format json` and normalize
 * the plan tier. Never writes anywhere. Injectable execFn/nowMs for tests.
 */
export async function collectCursorCliQuotaObservation(options = {}) {
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const execFn = options.execFn || defaultCursorCliExec;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : CURSOR_CLI_TIMEOUT_MS;
  const launch = resolveCursorCliLaunch();

  let stdout;
  try {
    const executed = await execFn(launch.file, launch.args, {
      timeoutMs,
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: MAX_STDOUT_BYTES,
      encoding: "utf8",
    });
    stdout = executed && executed.stdout != null ? executed.stdout : "";
  } catch (err) {
    const cls = classifyExecError(err);
    return unknownObservation(nowMs, cls.reason_code, launch);
  }

  const text = (typeof stdout === "string" ? stdout : String(stdout)).replace(/^\uFEFF/, "");
  if (Buffer.byteLength(text, "utf8") > MAX_STDOUT_BYTES) {
    return unknownObservation(nowMs, "CURSOR_CLI_JSON_INVALID", launch);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return unknownObservation(nowMs, "CURSOR_CLI_JSON_INVALID", launch);
  }
  const normalized = normalizeAboutJson(parsed);
  if (!normalized) {
    return unknownObservation(nowMs, "CURSOR_CLI_PLAN_MISSING", launch);
  }

  const observation = {
    schema_version: CURSOR_CLI_QUOTA_SCHEMA,
    ok: true,
    state: "OBSERVED",
    freshness: "fresh",
    reason_code: null,
    reason_codes: [],
    observed_at: isoFromMs(nowMs),
    observed_at_ms: nowMs,
    plan: normalized.plan,
    cli_version: normalized.cli_version,
    source: "cursor_cli_about",
    exec: { kind: launch.kind, args: [...launch.args] },
    // Qualified-scope declaration: this source exposes NO usage/pool/reset data.
    scope: { plan: true, usage_pools: false, reset: false, on_demand: false },
  };

  if (SECRET_SCAN_RE.test(JSON.stringify(observation))) {
    return unknownObservation(nowMs, "CURSOR_CLI_SECRET_LIKE_MATERIALIZED", launch);
  }
  return observation;
}

/**
 * Bounded in-memory cache + single-flight wrapper (default TTL 300s).
 * Same semantics as getOpenClawQuotaObservation: non-blocking on GET; a
 * failed refresh keeps the previous value only as STALE (degraded).
 */
let cursorCliCache = null; // { collected_at_ms, payload, degraded }
let cursorCliInflight = null;

async function probeAndStore(options) {
  const payload = await collectCursorCliQuotaObservation(options);
  const cachedAtMs =
    Number.isFinite(options.nowMs) && typeof options.execFn === "function"
      ? options.nowMs
      : Date.now();
  if (payload.ok === true || !cursorCliCache) {
    cursorCliCache = { collected_at_ms: cachedAtMs, payload, degraded: false };
  } else {
    cursorCliCache = { ...cursorCliCache, degraded: true };
  }
  return payload;
}

function startRefresh(options) {
  if (!cursorCliInflight) {
    cursorCliInflight = probeAndStore(options).finally(() => { cursorCliInflight = null; });
    cursorCliInflight.catch(() => {});
  }
  return cursorCliInflight;
}

export async function getCursorCliQuotaObservation(options = {}) {
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const ttlMs = Number.isFinite(options.cacheTtlMs) ? options.cacheTtlMs : CURSOR_CLI_CACHE_TTL_MS;

  if (options.bypassCache) {
    cursorCliInflight = null;
    await probeAndStore(options);
    return decorate(cursorCliCache, nowMs, false, false);
  }

  if (cursorCliCache && nowMs - cursorCliCache.collected_at_ms < ttlMs) {
    return decorate(cursorCliCache, nowMs, true, false);
  }

  startRefresh({ ...options, nowMs });

  if (options.awaitRefresh === true) {
    await cursorCliInflight;
    return decorate(cursorCliCache, nowMs, false, false);
  }

  return cursorCliCache
    ? decorate(cursorCliCache, nowMs, false, true)
    : decoratePending(nowMs);
}

function decoratePending(nowMs) {
  return {
    schema_version: CURSOR_CLI_QUOTA_SCHEMA,
    ok: false,
    state: "UNKNOWN",
    freshness: "stale",
    reason_code: "CURSOR_CLI_PENDING",
    reason_codes: ["CURSOR_CLI_PENDING"],
    cache_hit: false,
    refresh_in_progress: true,
    observed_at: null,
    observed_at_ms: null,
    plan: null,
    cli_version: null,
    source: "cursor_cli_about",
    scope: { plan: true, usage_pools: false, reset: false, on_demand: false },
  };
}

function decorate(entry, nowMs, cacheHit, refreshInProgress) {
  const payload = entry.payload;
  const ageMs = nowMs - (payload.observed_at_ms ?? entry.collected_at_ms);
  const canonicalFresh =
    payload.ok === true &&
    !entry.degraded &&
    ageMs <= FRESH_MS &&
    ageMs >= -FUTURE_TOLERANCE_MS;
  const freshness = canonicalFresh ? "fresh" : "stale";
  const staleReason = entry.degraded
    ? "CURSOR_CLI_REFRESH_FAILED_STALE"
    : !canonicalFresh && ageMs > FRESH_MS
      ? "CURSOR_CLI_OBSERVATION_STALE"
      : null;
  return {
    schema_version: CURSOR_CLI_QUOTA_SCHEMA,
    ok: payload.ok === true,
    state: payload.state,
    freshness,
    stale_reason: staleReason,
    reason_code: payload.reason_code,
    reason_codes: payload.reason_codes,
    cache_hit: cacheHit,
    refresh_in_progress: refreshInProgress === true,
    observed_at: payload.observed_at,
    observed_at_ms: payload.observed_at_ms,
    plan: payload.plan,
    cli_version: payload.cli_version,
    source: "cursor_cli_about",
    exec: payload.exec,
    scope: payload.scope,
  };
}

/** Test helper: clear the observation cache + executable resolution cache. */
export function resetCursorCliObservationCache() {
  cursorCliCache = null;
  cursorCliInflight = null;
  resolvedLaunchCache = null;
}

const isDirectRun =
  process.argv[1] &&
  process.argv[1].endsWith("collect-cursor-cli-quota-v1.mjs");

if (isDirectRun) {
  getCursorCliQuotaObservation({ bypassCache: true })
    .then((r) => {
      process.stdout.write(`${JSON.stringify(r)}\n`);
      process.exitCode = 0;
    })
    .catch((err) => {
      process.stderr.write(`${err && err.stack ? err.stack : err}\n`);
      process.exitCode = 1;
    });
}
