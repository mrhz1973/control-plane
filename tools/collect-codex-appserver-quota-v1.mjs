#!/usr/bin/env node
/**
 * Offline-only adapter for the Codex app-server account/rateLimits/read
 * response.  This module never performs the RPC.  Callers provide a fixture
 * or an already-collected response and receive one bounded observation for
 * the shared Codex pool.
 *
 * OpenClaw remains the primary authority.  The app-server observation is a
 * secondary cross-check and is never additive.
 */

export const CODEX_APPSERVER_QUOTA_SCHEMA = "codex-appserver-quota-observation-v1";
export const CODEX_APPSERVER_METHOD = "account/rateLimits/read";
export const CODEX_QUOTA_POOL_ID = "chatgpt_codex_subscription";
export const CODEX_SECONDARY_SOURCE = "CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ";
export const DEFAULT_RECONCILIATION_TOLERANCE_PERCENT = 5;
export const QUOTA_OBSERVATION_MAX_AGE_MS = 300_000;

const MAX_WINDOWS = 4;
const MAX_REASON_CODES = 12;
const MAX_STRING = 120;
const MAX_BANKED_RESETS = 8;
const SECRET_KEY_RE = /(token|cookie|session|secret|password|authorization|api[_-]?key|credential)/i;
const SECRET_VALUE_RE = /(Bearer\s+\S+|sk-[A-Za-z0-9]{10,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/;

function boundedString(value, max = MAX_STRING) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function addReason(reasons, code) {
  if (!reasons.includes(code) && reasons.length < MAX_REASON_CODES) reasons.push(code);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function containsSecretLike(value, depth = 0) {
  if (depth > 6 || value === null || value === undefined) return false;
  if (typeof value === "string") return SECRET_VALUE_RE.test(value);
  if (Array.isArray(value)) return value.some((item) => containsSecretLike(item, depth + 1));
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, item]) =>
    SECRET_KEY_RE.test(key) || containsSecretLike(item, depth + 1)
  );
}

function finitePercent(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
    ? Math.round(value * 10) / 10
    : null;
}

/** App-server semantics are USED percent, never remaining percent. */
export function usedPercentToRemaining(usedPercent) {
  const used = finitePercent(usedPercent);
  return used === null ? null : Math.round((100 - used) * 10) / 10;
}

function finitePositiveInteger(value) {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function timestamp(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const ms = value < 1_000_000_000_000 ? value * 1000 : value;
    const iso = new Date(ms).toISOString();
    return Number.isNaN(Date.parse(iso)) ? null : { raw: value, ms, iso };
  }
  if (typeof value === "string" && value.trim()) {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? { raw: value.slice(0, MAX_STRING), ms, iso: new Date(ms).toISOString() } : null;
  }
  return null;
}

function sourceTimestamp(input, options, nowMs) {
  const raw = options.observed_at ?? options.observedAt ?? input?.observed_at ?? input?.observedAt;
  if (raw !== undefined && raw !== null) {
    const parsed = timestamp(raw);
    return parsed ? { ...parsed, source: "source_metadata" } : null;
  }
  return { raw: new Date(nowMs).toISOString(), ms: nowMs, iso: new Date(nowMs).toISOString(), source: "collector_clock" };
}

function unwrapRateLimits(response) {
  const candidates = [
    response?.result?.rateLimits,
    response?.result?.rate_limits,
    response?.rateLimits,
    response?.rate_limits,
    response?.result?.account?.rateLimits,
    response?.account?.rateLimits,
  ];
  return candidates.find(isRecord) || null;
}

function extractWindows(rateLimits) {
  const found = [];
  for (const [role, key] of [["primary", "primary"], ["secondary", "secondary"]]) {
    const value = rateLimits?.[key] ?? rateLimits?.[`${key}Window`] ?? rateLimits?.[`${key}_window`];
    if (isRecord(value)) found.push({ ...value, source_role: role });
  }
  const arrays = [rateLimits?.windows, rateLimits?.limits, rateLimits?.rateLimits];
  for (const list of arrays) {
    if (Array.isArray(list)) {
      for (const item of list.slice(0, MAX_WINDOWS)) if (isRecord(item)) found.push(item);
    }
  }
  return found.slice(0, MAX_WINDOWS);
}

function durationType(value) {
  const mins = finitePositiveInteger(value);
  if (mins === 300) return "rolling";
  if (mins === 10_080) return "weekly";
  return null;
}

function labelType(value) {
  const key = boundedString(value, 40)?.toLowerCase().replace(/[_-]+/g, " ");
  if (!key) return null;
  if (/^(5h|5 hours?|rolling|primary)$/.test(key)) return "rolling";
  if (/^(week|weekly|7 days?|secondary)$/.test(key)) return "weekly";
  return null;
}

function classifyWindow(raw) {
  const duration = raw.windowDurationMins ?? raw.window_duration_mins ?? raw.durationMins;
  const byDuration = durationType(duration);
  const byLabel = labelType(raw.windowType ?? raw.window_type ?? raw.label ?? raw.name);
  if (byDuration && byLabel && byDuration !== byLabel) return { type: null, ambiguous: true };
  return { type: byDuration || byLabel, ambiguous: false };
}

function windowOutput(raw, type, reset, used, remaining, nowMs, observedMs) {
  const duration = raw.windowDurationMins ?? raw.window_duration_mins ?? raw.durationMins;
  const freshness = observedMs > nowMs || nowMs - observedMs > QUOTA_OBSERVATION_MAX_AGE_MS ? "stale" : "fresh";
  return {
    window_type: type,
    role: "binding",
    used_percent: used,
    remaining_percent: remaining,
    window_duration_mins: finitePositiveInteger(duration),
    resets_at: reset.raw,
    resets_at_iso: reset.iso,
    reset_at: reset.iso,
    freshness,
  };
}

function normalizeBankedResets(rateLimits, reasons) {
  const inventory =
    rateLimits?.bankedResets ??
    rateLimits?.banked_resets ??
    rateLimits?.resetCredits ??
    rateLimits?.reset_credits ??
    rateLimits?.credits;
  if (inventory === undefined || inventory === null) return [];
  const list = Array.isArray(inventory) ? inventory : [inventory];
  return list.slice(0, MAX_BANKED_RESETS).map((entry) => {
    const item = isRecord(entry) ? entry : {};
    const expiresRaw = item.expiresAt ?? item.expires_at;
    const expires = expiresRaw === undefined || expiresRaw === null ? null : timestamp(expiresRaw);
    if (expiresRaw !== undefined && expiresRaw !== null && !expires) addReason(reasons, "BANKED_RESET_TIMESTAMP_INVALID");
    return {
      available_count: typeof item.availableCount === "number" && Number.isInteger(item.availableCount) && item.availableCount >= 0
        ? item.availableCount
        : null,
      reset_type: boundedString(item.resetType ?? item.reset_type, 40),
      status: boundedString(item.status, 40),
      expires_at: expires?.raw ?? null,
      expires_at_iso: expires?.iso ?? null,
      role: "advisory",
    };
  });
}

function unknownResult(reasons, observed, nowMs, bankedResets = []) {
  const unique = [...new Set(reasons)];
  return {
    schema_version: CODEX_APPSERVER_QUOTA_SCHEMA,
    ok: false,
    classification: "UNKNOWN_CODEX_APPSERVER_QUOTA",
    quota_pool_id: CODEX_QUOTA_POOL_ID,
    source: CODEX_SECONDARY_SOURCE,
    method: CODEX_APPSERVER_METHOD,
    state: "unknown",
    freshness: "stale",
    observed_at: observed?.iso ?? null,
    observed_at_raw: observed?.raw ?? null,
    windows: [],
    effective_remaining_percent: null,
    primary: null,
    banked_resets: bankedResets,
    banked_resets_effect_on_capacity: "none",
    reason_codes: unique.length ? unique.slice(0, MAX_REASON_CODES) : ["UNKNOWN"],
    source_metadata: { method: CODEX_APPSERVER_METHOD, observation_clock_ms: nowMs },
    read_only: true,
  };
}

/**
 * Normalize an already-collected/mock account/rateLimits/read response.
 * No network or provider operation is performed here.
 */
export function normalizeCodexAppServerQuota(response, options = {}) {
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const reasons = [];
  const observed = sourceTimestamp(response, options, nowMs);
  if (containsSecretLike(response)) addReason(reasons, "SECRET_LIKE_INPUT");
  if (!isRecord(response)) addReason(reasons, "RESPONSE_INVALID");
  if (!observed) addReason(reasons, "OBSERVED_AT_INVALID");
  const rateLimits = unwrapRateLimits(response);
  if (!rateLimits) addReason(reasons, "RATE_LIMITS_MISSING");
  if (reasons.length) return unknownResult(reasons, observed, nowMs);

  const rawWindows = extractWindows(rateLimits);
  const bankedResets = normalizeBankedResets(rateLimits, reasons);
  if (!rawWindows.length) addReason(reasons, "BINDING_WINDOWS_MISSING");
  const windows = [];
  const seen = new Set();
  for (const raw of rawWindows) {
    const classified = classifyWindow(raw);
    if (classified.ambiguous || !classified.type) {
      addReason(reasons, classified.ambiguous ? "WINDOW_IDENTITY_AMBIGUOUS" : "WINDOW_IDENTITY_UNKNOWN");
      continue;
    }
    if (seen.has(classified.type)) {
      addReason(reasons, "WINDOW_IDENTITY_AMBIGUOUS");
      continue;
    }
    const used = finitePercent(raw.usedPercent ?? raw.used_percent);
    const remaining = usedPercentToRemaining(raw.usedPercent ?? raw.used_percent);
    const resetRaw = raw.resetsAt ?? raw.resetAt ?? raw.resets_at ?? raw.reset_at;
    const reset = timestamp(resetRaw);
    if (used === null) addReason(reasons, "USED_PERCENT_INVALID");
    if (!reset) addReason(reasons, "RESET_TIMESTAMP_INVALID");
    if (used !== null && reset) {
      windows.push(windowOutput(raw, classified.type, reset, used, remaining, nowMs, observed.ms));
      seen.add(classified.type);
    }
  }
  if (!seen.has("rolling") || !seen.has("weekly")) addReason(reasons, "BINDING_WINDOW_MISSING");
  if (reasons.length) return unknownResult(reasons, observed, nowMs, bankedResets);

  const freshness = observed.ms > nowMs || nowMs - observed.ms > QUOTA_OBSERVATION_MAX_AGE_MS ? "stale" : "fresh";
  if (freshness !== "fresh") addReason(reasons, observed.ms > nowMs ? "OBSERVED_AT_FUTURE" : "OBSERVATION_STALE");
  if (reasons.length) {
    const result = unknownResult(reasons, observed, nowMs, bankedResets);
    result.windows = windows;
    result.source_metadata.observation_clock_ms = nowMs;
    return result;
  }
  const effective = Math.min(...windows.map((window) => window.remaining_percent));
  const limiting = windows.find((window) => window.remaining_percent === effective);
  return {
    schema_version: CODEX_APPSERVER_QUOTA_SCHEMA,
    ok: true,
    classification: "PASS_CODEX_APPSERVER_QUOTA_NORMALIZED",
    quota_pool_id: CODEX_QUOTA_POOL_ID,
    source: CODEX_SECONDARY_SOURCE,
    method: CODEX_APPSERVER_METHOD,
    state: effective === 0 ? "exhausted" : "available",
    freshness,
    observed_at: observed.iso,
    observed_at_raw: observed.raw,
    windows,
    effective_remaining_percent: effective,
    primary: { ...limiting },
    banked_resets: bankedResets,
    banked_resets_effect_on_capacity: "none",
    reason_codes: [],
    source_metadata: { method: CODEX_APPSERVER_METHOD, observation_clock_ms: nowMs },
    read_only: true,
  };
}

function primaryValue(primary) {
  if (!isRecord(primary)) return null;
  const candidates = [
    primary.effective_remaining_percent,
    primary.remaining_percent,
    primary.primary?.remaining_percent,
    primary.primary?.remainingPercent,
  ];
  return candidates.find((value) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100) ?? null;
}

function primaryFresh(primary) {
  return isRecord(primary) && primary.freshness === "fresh" && primaryValue(primary) !== null;
}

/**
 * Compare two observations of the one shared pool.  The returned effective
 * value is always sourced from OpenClaw; the secondary value is diagnostic.
 */
export function reconcileCodexQuotaObservations(primary, secondary, options = {}) {
  const tolerance = typeof options.tolerance_percent === "number" && Number.isFinite(options.tolerance_percent)
    && options.tolerance_percent >= 0 ? options.tolerance_percent : DEFAULT_RECONCILIATION_TOLERANCE_PERCENT;
  const primaryRemaining = primaryValue(primary);
  const secondaryRemaining = primaryValue(secondary);
  const comparable = primaryFresh(primary) && isRecord(secondary) && secondary.freshness === "fresh" && secondaryRemaining !== null;
  let classification = "UNKNOWN";
  let difference = null;
  if (comparable) {
    difference = Math.abs(primaryRemaining - secondaryRemaining);
    classification = difference === 0 ? "MATCH" : difference <= tolerance ? "WITHIN_TOLERANCE" : "MISMATCH";
  }
  return {
    schema_version: "codex-quota-reconciliation-v1",
    quota_pool_id: CODEX_QUOTA_POOL_ID,
    primary_source: "OPENCLAW_STATUS_USAGE_JSON",
    secondary_source: CODEX_SECONDARY_SOURCE,
    classification,
    tolerance_percent: tolerance,
    absolute_difference_percent: difference,
    primary_effective_remaining_percent: primaryRemaining,
    secondary_effective_remaining_percent: secondaryRemaining,
    effective_remaining_percent: primaryFresh(primary) ? primaryRemaining : null,
    routing_authority: "OPENCLAW_PRIMARY",
    secondary_mismatch_overwrites_primary: false,
    observations_are_additive: false,
    secondary_freshness: secondary?.freshness ?? "missing",
    primary_freshness: primary?.freshness ?? "missing",
    reason_codes: comparable ? [] : ["COMPARISON_NOT_FRESH_AND_COMPARABLE"],
  };
}

export function collectCodexAppServerQuota(response, options = {}) {
  return normalizeCodexAppServerQuota(response, options);
}

export const usedToRemainingPercent = usedPercentToRemaining;
export const normalizeCodexAppServerResponse = normalizeCodexAppServerQuota;
export const reconcileCodexQuota = reconcileCodexQuotaObservations;

const isDirectRun = process.argv[1]?.endsWith("collect-codex-appserver-quota-v1.mjs");
if (isDirectRun) {
  process.stdout.write(JSON.stringify({
    ok: false,
    classification: "OFFLINE_ADAPTER_ONLY",
    reason_codes: ["NO_LIVE_APPSERVER_RPC"],
    quota_pool_id: CODEX_QUOTA_POOL_ID,
  }) + "\n");
}
