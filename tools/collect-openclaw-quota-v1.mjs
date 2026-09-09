#!/usr/bin/env node
/**
 * collect-openclaw-quota-v1 — LIVE read-only OpenClaw quota collector (#73).
 *
 * Bounded adapter that executes the PROVEN Windows OpenClaw read-only surface
 *
 *   openclaw status --usage --json
 *
 * (reports/architecture/v4_quota_source_capability_probe_v1.md:
 * PRIMARY_QUOTA_COLLECTOR) and normalizes ONLY provider usage data into the
 * EXISTING canonical quota-state law:
 *
 *   collect-openclaw-quota-v1 (this module, in-memory only)
 *     → v4-resource-status-contribution-v1 envelopes (source=provider_api)
 *     → composeCanonicalQuotaState(...) (existing composer + join freshness law)
 *     → collectQuotaObservatory → GET /v1/resources → dispatcher dashboard
 *
 * LAWS (issue #73 task):
 *   - FIXED arguments only (status --usage --json); execFile semantics, NEVER a
 *     shell string; never starts the OpenClaw gateway; never logs in/out;
 *     never mutates OpenClaw config; never calls Hermes/OpenCode/providers.
 *   - NO second quota authority: freshness reuses the composer's own
 *     STATUS_MAX_AGE_MS; pool projection reuses the RT25 ingest semantics
 *     (primary = fresh mapped window with MAX remaining; shared pool observed
 *     once; contribution per pool with one registry resource entry).
 *   - usedPercent means USED: remaining_percent = clamp(100 - usedPercent,0,100)
 *     — direction is fixed by law and asserted in tests.
 *   - resetAt is epoch milliseconds → ISO-8601 reset_at. Observation time is
 *     usage.updatedAt when valid; dashboard fetch time is NEVER used as the
 *     provider observation time when a real source timestamp exists.
 *   - SECRETS: only quota-necessary fields are copied (provider id, usage
 *     updatedAt, window label/usedPercent/resetAt, plan label). Token/cookie/
 *     authorization/api-key/credential material is never read, returned,
 *     logged, or persisted; a defensive secret scan fails the observation
 *     closed rather than exposing suspicious material.
 *   - GET-side mutation FORBIDDEN: this module performs ZERO writes (no
 *     receipts, envelopes, configs, ingest files). In-memory only.
 *   - FAILURE LAW: any absence/timeout/command failure/invalid JSON/missing
 *     provider/invalid percent/invalid timestamp/stale source degrades the
 *     affected pool to UNKNOWN (or STALE for a previously observed value),
 *     with a bounded reason code. No fallback numbers are ever invented.
 *   - Auth-profile caveat: unrelated OAuth profile metadata (e.g. "expired" in
 *     a models-status view) is IGNORED — a fresh usage observation is the
 *     evidence; if usage itself stops returning fresh data, fail closed.
 *
 * Cache law: bounded in-memory single-flight cache (default TTL 60s) so the
 * CLI is NOT executed on every browser refresh. A failed refresh never keeps
 * a previous value FRESH: after a failure the previous observation may be
 * exposed only as STALE (degraded) until a refresh succeeds again.
 */
import { execFile as execFileCb } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { STATUS_MAX_AGE_MS } from "./compose-v4-resource-status-control-plane-v1.mjs";

const execFileAsync = promisify(execFileCb);

export const OPENCLAW_QUOTA_SCHEMA = "openclaw-quota-observation-v1";
export const OPENCLAW_ARGS = Object.freeze(["status", "--usage", "--json"]);
export const OPENCLAW_CACHE_TTL_MS = 60_000;
/** Observed live runtime ≈ 150s per invocation; bound stays above it. */
export const OPENCLAW_TIMEOUT_MS = 210_000;
export const MAX_STDOUT_BYTES = 262_144;
export const MAX_STDERR_BYTES = 4_096;
const MAX_PROVIDERS = 16;
const MAX_WINDOWS = 8;
const MAX_LABEL = 60;
const MAX_PLAN = 40;
const MAX_REASON = 60;
const FUTURE_TOLERANCE_MS = 60_000;

/** Exact provider → pool bindings (never fuzzy model-name matching). */
export const POOL_PROVIDER_BINDINGS = Object.freeze({
  glm_coding_plan: Object.freeze({
    provider_id: "zai",
    resource_id: "glm",
    /** Exact semantic label (trimmed, lower-cased) → canonical window type. */
    window_labels: Object.freeze({ "tokens (5h)": "rolling", monthly: "monthly" }),
    /**
     * "Tokens (Limit)" identity is NOT proven weekly by the capability probe +
     * existing canonical source law → kept as UNMAPPED diagnostic metadata.
     * Window identity is NEVER inferred from reset duration.
     */
    unmapped_labels: Object.freeze(["tokens (limit)"]),
    source_label: "OpenClaw / Z.AI usage",
  }),
  chatgpt_codex_subscription: Object.freeze({
    provider_id: "openai-codex",
    resource_id: "codex",
    window_labels: Object.freeze({ "5h": "rolling", week: "weekly" }),
    unmapped_labels: Object.freeze([]),
    source_label: "OpenClaw / OpenAI Codex usage",
  }),
});

const SECRET_SCAN_RE =
  /sk-[A-Za-z0-9]{10,}|Bearer\s+[A-Za-z0-9._\-+=/]{8,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

function boundStr(value, max) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length <= max ? s : s.slice(0, max);
}

function boundReason(value) {
  return boundStr(value, MAX_REASON) || "OPENCLAW_USAGE_FAILED";
}

function isoFromMs(ms) {
  return new Date(ms).toISOString();
}

/** remaining_percent = clamp(100 - usedPercent, 0, 100) — FIXED direction. */
export function usedToRemainingPercent(usedPercent) {
  const used = Number(usedPercent);
  if (!Number.isFinite(used) || used < 0 || used > 100) return null;
  return Math.round(Math.min(100, Math.max(0, 100 - used)) * 10) / 10;
}

function validEpochMs(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Fixed executable resolution (no arbitrary command input):
 *  1. Windows npm-global layout %APPDATA%\npm\node_modules\openclaw\openclaw.mjs
 *     executed via the current node binary (execFile, no shell) — this is what
 *     the installed openclaw.ps1/.cmd shims invoke internally;
 *  2. fallback: the `openclaw` command on PATH (execFile, no shell).
 */
let resolvedLaunchCache = null;
export function resolveOpenClawLaunch(exists = existsSync, env = process.env) {
  if (resolvedLaunchCache) return resolvedLaunchCache;
  const appdata = env && env.APPDATA ? String(env.APPDATA) : null;
  if (appdata) {
    const mjs = join(appdata, "npm", "node_modules", "openclaw", "openclaw.mjs");
    if (exists(mjs)) {
      resolvedLaunchCache = Object.freeze({
        kind: "node_module_entry",
        file: process.execPath,
        args: Object.freeze([mjs, ...OPENCLAW_ARGS]),
      });
      return resolvedLaunchCache;
    }
  }
  resolvedLaunchCache = Object.freeze({
    kind: "path_command",
    file: "openclaw",
    args: Object.freeze([...OPENCLAW_ARGS]),
  });
  return resolvedLaunchCache;
}

function classifyExecError(err) {
  if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) {
    return { reason_code: "OPENCLAW_NOT_FOUND", detail: boundReason(err.code) };
  }
  if (err && (err.killed === true || err.signal === "SIGTERM" || err.code === "ETIMEDOUT")) {
    return { reason_code: "OPENCLAW_USAGE_TIMEOUT", detail: "timeout" };
  }
  return {
    reason_code: "OPENCLAW_USAGE_COMMAND_FAILED",
    detail: boundStr(err && err.code ? err.code : err && err.message ? err.message : "exec_failed", MAX_REASON),
  };
}

/** Normalize ONE provider entry into a bounded pool observation. */
function normalizeProviderPool(binding, provider, observedAtMs, nowMs, reasonCodes) {
  const poolIdForReason = binding.provider_id;
  const rawWindows = Array.isArray(provider && provider.windows) ? provider.windows.slice(0, MAX_WINDOWS) : [];
  if (!rawWindows.length) {
    return {
      ok: false,
      pool: {
        provider: binding.provider_id,
        state: "unknown",
        freshness: "stale",
        reason_code: "OPENCLAW_USAGE_WINDOWS_MISSING",
        windows: [],
        unmapped_windows: [],
        primary: null,
        source_label: binding.source_label,
      },
    };
  }

  const windows = [];
  const unmapped = [];
  for (const raw of rawWindows) {
    const label = boundStr(raw && raw.label, MAX_LABEL);
    if (!label) continue;
    const key = label.toLowerCase();
    const mappedType = Object.prototype.hasOwnProperty.call(binding.window_labels, key)
      ? binding.window_labels[key]
      : null;
    if (mappedType) {
      const remaining = usedToRemainingPercent(raw.usedPercent);
      const resetMs = validEpochMs(raw.resetAt);
      if (remaining === null || resetMs === null) {
        reasonCodes.push(`OPENCLAW_USAGE_WINDOW_INVALID_${poolIdForReason}`);
        return {
          ok: false,
          pool: {
            provider: binding.provider_id,
            state: "unknown",
            freshness: "stale",
            reason_code: "OPENCLAW_USAGE_WINDOW_INVALID",
            windows: [],
            unmapped_windows: [],
            primary: null,
            source_label: binding.source_label,
          },
        };
      }
      windows.push({
        window_type: mappedType,
        label,
        used_percent: Math.round(Number(raw.usedPercent) * 10) / 10,
        remaining_percent: remaining,
        reset_at: isoFromMs(resetMs),
        reset_at_ms: resetMs,
      });
    } else {
      // Unknown / not-proven window: bounded non-sensitive diagnostic only —
      // never classified into routing-capacity semantics.
      const remaining = usedToRemainingPercent(raw.usedPercent);
      const resetMs = validEpochMs(raw.resetAt);
      unmapped.push({
        label,
        recognized_limit_window: binding.unmapped_labels.includes(key) || null,
        ...(remaining !== null ? { used_percent: Math.round(Number(raw.usedPercent) * 10) / 10 } : {}),
        ...(remaining !== null ? { remaining_percent: remaining } : {}),
        ...(resetMs !== null ? { reset_at: isoFromMs(resetMs) } : {}),
      });
    }
  }

  if (!windows.length) {
    return {
      ok: false,
      pool: {
        provider: binding.provider_id,
        state: "unknown",
        freshness: "stale",
        reason_code: "OPENCLAW_USAGE_WINDOWS_MISSING",
        windows: [],
        unmapped_windows: unmapped.slice(0, MAX_WINDOWS),
        primary: null,
        source_label: binding.source_label,
      },
    };
  }

  // Existing RT25 ingest law: primary = mapped window with MAX remaining.
  const primary = [...windows].sort((a, b) => b.remaining_percent - a.remaining_percent)[0];
  const state = primary.remaining_percent > 0 ? "available" : "exhausted";
  return {
    ok: true,
    pool: {
      provider: binding.provider_id,
      state,
      freshness: "fresh",
      reason_code: null,
      windows,
      unmapped_windows: unmapped.slice(0, MAX_WINDOWS),
      primary: {
        window_type: primary.window_type,
        remaining_percent: primary.remaining_percent,
        reset_at: primary.reset_at,
      },
      source_label: binding.source_label,
    },
  };
}

/** Bounded plan label: tier only — "$0.00"-style economics and secrets dropped. */
function normalizePlanLabel(plan) {
  const raw = boundStr(plan, MAX_PLAN);
  if (!raw) return null;
  const tier = boundStr(String(raw).split("(")[0].trim(), MAX_PLAN);
  if (!tier || SECRET_SCAN_RE.test(tier)) return null;
  return tier;
}

/**
 * Core probe: execute the FIXED read-only OpenClaw usage command and normalize
 * provider usage into bounded pool observations + canonical contributions.
 * Never writes anywhere. Injectable execFn/nowMs for tests.
 */
export async function collectOpenClawQuotaObservation(options = {}) {
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const execFn = options.execFn || execFileAsync;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : OPENCLAW_TIMEOUT_MS;
  const collectedAtMs = nowMs;
  const reasonCodes = [];

  const base = {
    schema_version: OPENCLAW_QUOTA_SCHEMA,
    ok: false,
    observed_at: null,
    observed_at_ms: null,
    collected_at: isoFromMs(collectedAtMs),
    collected_at_ms: collectedAtMs,
    freshness: "stale",
    reason_codes: reasonCodes,
    exec: null,
    pools: {},
    contributions: [],
  };

  const launch = resolveOpenClawLaunch();
  let stdout;
  try {
    const executed = await execFn(launch.file, launch.args, {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: MAX_STDOUT_BYTES,
      encoding: "utf8",
    });
    stdout = executed && executed.stdout != null ? executed.stdout : "";
  } catch (err) {
    const cls = classifyExecError(err);
    reasonCodes.push(cls.reason_code);
    return unknownObservation(base, cls.reason_code, launch);
  }

  const text = (typeof stdout === "string" ? stdout : String(stdout)).replace(/^\uFEFF/, "");
  if (Buffer.byteLength(text, "utf8") > MAX_STDOUT_BYTES) {
    reasonCodes.push("OPENCLAW_USAGE_JSON_INVALID");
    return unknownObservation(base, "OPENCLAW_USAGE_JSON_INVALID", launch);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    reasonCodes.push("OPENCLAW_USAGE_JSON_INVALID");
    return unknownObservation(base, "OPENCLAW_USAGE_JSON_INVALID", launch);
  }

  const usage = parsed && typeof parsed === "object" && parsed.usage && typeof parsed.usage === "object"
    ? parsed.usage
    : null;
  const providers = usage && Array.isArray(usage.providers) ? usage.providers.slice(0, MAX_PROVIDERS) : null;
  if (!providers) {
    reasonCodes.push("OPENCLAW_USAGE_JSON_INVALID");
    return unknownObservation(base, "OPENCLAW_USAGE_JSON_INVALID", launch);
  }

  // Observation timestamp: prefer OpenClaw usage.updatedAt (epoch ms) when valid.
  let observedAtMs = validEpochMs(usage.updatedAt);
  if (observedAtMs !== null && observedAtMs > collectedAtMs + FUTURE_TOLERANCE_MS) {
    reasonCodes.push("OPENCLAW_USAGE_FUTURE_DATED");
    observedAtMs = null;
  }
  if (observedAtMs === null) {
    reasonCodes.push("OPENCLAW_USAGE_TIMESTAMP_MISSING");
    observedAtMs = collectedAtMs;
  }
  const docFresh = collectedAtMs - observedAtMs <= STATUS_MAX_AGE_MS;
  const docStaleReason = docFresh ? null : "OPENCLAW_USAGE_STALE";

  const byProvider = new Map();
  for (const p of providers) {
    if (p && typeof p === "object" && typeof p.provider === "string") {
      byProvider.set(p.provider, p);
    }
  }

  const pools = {};
  const contributions = [];
  for (const [poolId, binding] of Object.entries(POOL_PROVIDER_BINDINGS)) {
    const provider = byProvider.get(binding.provider_id) || null;
    if (!provider) {
      reasonCodes.push(`OPENCLAW_PROVIDER_MISSING_${binding.provider_id}`);
      pools[poolId] = {
        provider: binding.provider_id,
        state: "unknown",
        freshness: "stale",
        reason_code: "OPENCLAW_PROVIDER_MISSING",
        windows: [],
        unmapped_windows: [],
        primary: null,
        source_label: binding.source_label,
      };
      continue;
    }
    const normalized = normalizeProviderPool(binding, provider, observedAtMs, collectedAtMs, reasonCodes);
    const pool = normalized.pool;
    if (poolId === "chatgpt_codex_subscription") {
      // Plan label is bounded NON-SENSITIVE metadata only (tier, e.g. "plus");
      // economics like "$0.00" are dropped and never displayed.
      const plan = normalizePlanLabel(provider.plan);
      if (plan) pool.plan = plan;
    }
    if (normalized.ok && docFresh) {
      contributions.push(buildContribution(poolId, binding, pool, observedAtMs, collectedAtMs));
    } else {
      if (normalized.ok && !docFresh) {
        pool.state = "unknown";
        pool.freshness = "stale";
        pool.reason_code = docStaleReason;
      }
    }
    pools[poolId] = pool;
  }

  if (docStaleReason) reasonCodes.push(docStaleReason);

  const anyOk = Object.values(pools).some((p) => p.state !== "unknown");
  const observation = {
    ...base,
    ok: anyOk,
    observed_at: isoFromMs(observedAtMs),
    observed_at_ms: observedAtMs,
    freshness: docFresh ? "fresh" : "stale",
    reason_codes: [...new Set(reasonCodes)].slice(0, 8).map(boundReason),
    exec: { kind: launch.kind, args: [...launch.args] },
    pools,
    contributions,
  };

  if (SECRET_SCAN_RE.test(JSON.stringify(observation))) {
    // Defensive fail-closed: never expose credential-like material.
    return unknownObservation(base, "OPENCLAW_SECRET_LIKE_MATERIALIZED", launch);
  }
  return observation;
}

/** Build ONE v4-resource-status-contribution-v1 envelope for a pool (existing law). */
function buildContribution(poolId, binding, pool, observedAtMs, producedAtMs) {
  const primary = pool.primary;
  const projectedAvailable = pool.state === "available" && primary.remaining_percent > 0;
  return {
    schema_version: "v4-resource-status-contribution-v1",
    contribution_id: `openclaw-quota-${poolId}-${isoFromMs(observedAtMs)}`,
    producer_id: "collect-openclaw-quota-v1",
    source: "provider_api",
    produced_at: isoFromMs(producedAtMs),
    resources: {
      [binding.resource_id]: {
        available: projectedAvailable === true,
        quota_remaining: {
          value: projectedAvailable ? primary.remaining_percent : primary.remaining_percent,
          unit: "percent",
        },
        reset_at: primary.reset_at || null,
        cost_mode: "included",
        location: "cloud",
        updated_at: isoFromMs(observedAtMs),
        evidence: {
          kind: "source_snapshot",
          classification: `OPENCLAW_USAGE_LIVE_${binding.provider_id}`,
        },
      },
    },
  };
}

function unknownObservation(base, reasonCode, launch) {
  const pools = {};
  for (const [poolId, binding] of Object.entries(POOL_PROVIDER_BINDINGS)) {
    pools[poolId] = {
      provider: binding.provider_id,
      state: "unknown",
      freshness: "stale",
      reason_code: reasonCode,
      windows: [],
      unmapped_windows: [],
      primary: null,
      source_label: binding.source_label,
    };
  }
  return {
    ...base,
    ok: false,
    freshness: "stale",
    reason_codes: [...new Set([...base.reason_codes, reasonCode])].slice(0, 8).map(boundReason),
    exec: { kind: launch.kind, args: [...launch.args] },
    pools,
    contributions: [],
  };
}

/**
 * Bounded in-memory cache + single-flight wrapper (default TTL 60s).
 * - first call STARTS a probe and returns a bounded PENDING observation
 *   (UNKNOWN pools, reason OPENCLAW_USAGE_PENDING) — GET /v1/resources never
 *   blocks on the CLI (observed live runtime ≈150s);
 * - calls inside TTL reuse the cached normalized result (no CLI execution);
 * - after TTL a refresh runs ONCE (single-flight); while it runs the previous
 *   value is served and judged by the EXISTING canonical freshness law
 *   (STATUS_MAX_AGE_MS), never by fetch time alone;
 * - a FAILED refresh keeps the previous observation DEGRADED → exposed only as
 *   STALE (never FRESH) until a later refresh succeeds; a first-ever failed
 *   probe caches the UNKNOWN result (bounded, never fake data).
 */
let openclawCache = null; // { collected_at_ms, payload, degraded }
let openclawInflight = null;

async function probeAndStore(options) {
  const payload = await collectOpenClawQuotaObservation(options);
  if (payload.ok === true || !openclawCache) {
    openclawCache = { collected_at_ms: payload.collected_at_ms, payload, degraded: false };
  } else {
    // Failed refresh with a previous observation: keep the previous value,
    // degraded → STALE only. Never overwrite good data with UNKNOWN, never
    // keep it FRESH.
    openclawCache = { ...openclawCache, degraded: true };
  }
  return payload;
}

function startRefresh(options) {
  if (!openclawInflight) {
    openclawInflight = probeAndStore(options).finally(() => { openclawInflight = null; });
    openclawInflight.catch(() => {}); // failures are handled inside the payload
  }
  return openclawInflight;
}

export async function getOpenClawQuotaObservation(options = {}) {
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const ttlMs = Number.isFinite(options.cacheTtlMs) ? options.cacheTtlMs : OPENCLAW_CACHE_TTL_MS;

  if (options.bypassCache) {
    openclawInflight = null;
    await probeAndStore(options);
    return decorate(openclawCache, nowMs, false, false);
  }

  if (openclawCache && nowMs - openclawCache.collected_at_ms < ttlMs) {
    return decorate(openclawCache, nowMs, true, false);
  }

  startRefresh({ ...options, nowMs });

  if (options.awaitRefresh === true) {
    await openclawInflight;
    return decorate(openclawCache, nowMs, false, false);
  }

  // Non-blocking (production GET semantics): serve the previous value while a
  // refresh runs, or a bounded PENDING observation on the very first call.
  return openclawCache
    ? decorate(openclawCache, nowMs, false, true)
    : decoratePending(nowMs);
}

function decoratePending(nowMs) {
  const pools = {};
  for (const [poolId, binding] of Object.entries(POOL_PROVIDER_BINDINGS)) {
    pools[poolId] = {
      provider: binding.provider_id,
      state: "unknown",
      freshness: "stale",
      reason_code: "OPENCLAW_USAGE_PENDING",
      windows: [],
      unmapped_windows: [],
      primary: null,
      source_label: binding.source_label,
    };
  }
  return {
    schema_version: OPENCLAW_QUOTA_SCHEMA,
    ok: false,
    freshness: "stale",
    stale_reason: "OPENCLAW_USAGE_PENDING",
    cache_hit: false,
    refresh_in_progress: true,
    observed_at: null,
    collected_at: null,
    reason_codes: ["OPENCLAW_USAGE_PENDING"],
    pools,
    contributions: [],
    emit_contributions: false,
  };
}

function decorate(entry, nowMs, cacheHit, refreshInProgress) {
  const payload = entry.payload;
  const ageMs = nowMs - (payload.observed_at_ms ?? payload.collected_at_ms);
  // A failed/unknown observation is NEVER fresh; a previously good value that
  // failed to refresh is exposed only as STALE (degraded), never FRESH.
  const canonicalFresh =
    payload.ok === true &&
    !entry.degraded &&
    ageMs <= STATUS_MAX_AGE_MS &&
    ageMs >= -FUTURE_TOLERANCE_MS;
  const freshness = canonicalFresh ? "fresh" : "stale";
  const staleReason = entry.degraded
    ? "OPENCLAW_REFRESH_FAILED_STALE"
    : !canonicalFresh && ageMs > STATUS_MAX_AGE_MS
      ? "OPENCLAW_USAGE_STALE"
      : null;
  return {
    schema_version: OPENCLAW_QUOTA_SCHEMA,
    ok: payload.ok === true,
    freshness,
    stale_reason: staleReason,
    cache_hit: cacheHit,
    refresh_in_progress: refreshInProgress === true,
    observed_at: payload.observed_at,
    collected_at: payload.collected_at,
    reason_codes: payload.reason_codes,
    pools: payload.pools,
    contributions: payload.contributions,
    emit_contributions: freshness === "fresh" && Array.isArray(payload.contributions) && payload.contributions.length > 0,
  };
}

/** Test helper: clear the observation cache + executable resolution cache. */
export function resetOpenClawObservationCache() {
  openclawCache = null;
  openclawInflight = null;
  resolvedLaunchCache = null;
}

const isDirectRun =
  process.argv[1] &&
  process.argv[1].endsWith("collect-openclaw-quota-v1.mjs");

if (isDirectRun) {
  getOpenClawQuotaObservation({ bypassCache: true })
    .then((r) => {
      process.stdout.write(`${JSON.stringify(r)}\n`);
      process.exitCode = 0;
    })
    .catch((err) => {
      process.stdout.write(`${JSON.stringify({ ok: false, reason_codes: [boundReason(err && err.message)] })}\n`);
      process.exitCode = 1;
    });
}
