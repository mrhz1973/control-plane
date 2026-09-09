#!/usr/bin/env node
/**
 * Offline contract tests for the Codex app-server secondary quota adapter.
 * No RPC, provider, model, browser, credential, or network operation.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CODEX_APPSERVER_METHOD,
  CODEX_QUOTA_POOL_ID,
  DEFAULT_RECONCILIATION_TOLERANCE_PERCENT,
  normalizeCodexAppServerQuota,
  reconcileCodexQuotaObservations,
  usedPercentToRemaining,
} from "../../tools/collect-codex-appserver-quota-v1.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const NOW = Date.parse("2026-09-09T16:00:00.000Z");
const OBSERVED_AT = new Date(NOW - 30_000).toISOString();

function response(overrides = {}) {
  return {
    result: {
      rateLimits: {
        primary: {
          usedPercent: 0,
          windowDurationMins: 300,
          resetsAt: Date.parse("2026-09-09T19:00:00.000Z"),
        },
        secondary: {
          usedPercent: 16,
          windowDurationMins: 10_080,
          resetsAt: Date.parse("2026-09-16T00:00:00.000Z"),
        },
        credits: {
          availableCount: 2,
          resetType: "weekly",
          status: "available",
          expiresAt: "2026-09-20T00:00:00.000Z",
        },
        ...overrides,
      },
    },
    observed_at: OBSERVED_AT,
  };
}

function primary(remaining = 84, freshness = "fresh") {
  return {
    quota_pool_id: CODEX_QUOTA_POOL_ID,
    effective_remaining_percent: remaining,
    state: remaining === 0 ? "exhausted" : "available",
    freshness,
  };
}

const normalized = normalizeCodexAppServerQuota(response(), { nowMs: NOW });
assert.equal(usedPercentToRemaining(0), 100, "used 0 leaves 100");
assert.equal(usedPercentToRemaining(16), 84, "used 16 leaves 84");
assert.equal(normalized.ok, true);
assert.equal(normalized.quota_pool_id, CODEX_QUOTA_POOL_ID);
assert.equal(normalized.method, CODEX_APPSERVER_METHOD);
assert.equal(normalized.effective_remaining_percent, 84, "MIN binding window is effective");
assert.equal(normalized.windows.find((w) => w.window_type === "rolling").remaining_percent, 100);
assert.equal(normalized.windows.find((w) => w.window_type === "weekly").remaining_percent, 84);
assert.equal(normalized.windows.find((w) => w.window_type === "rolling").resets_at,
  Date.parse("2026-09-09T19:00:00.000Z"));
assert.equal(normalized.windows.find((w) => w.window_type === "weekly").window_duration_mins, 10_080);
assert.equal(normalized.banked_resets[0].available_count, 2);
assert.equal(normalized.banked_resets[0].expires_at, "2026-09-20T00:00:00.000Z");
assert.equal(normalized.banked_resets_effect_on_capacity, "none");

const missingWindow = normalizeCodexAppServerQuota(response({ secondary: undefined }), { nowMs: NOW });
assert.equal(missingWindow.ok, false);
assert.ok(missingWindow.reason_codes.includes("BINDING_WINDOW_MISSING"));
assert.equal(missingWindow.state, "unknown");

const invalidPercent = normalizeCodexAppServerQuota(response({
  primary: {
    usedPercent: "not-a-percent",
    windowDurationMins: 300,
    resetsAt: Date.parse("2026-09-09T19:00:00.000Z"),
  },
}), { nowMs: NOW });
assert.equal(invalidPercent.ok, false);
assert.ok(invalidPercent.reason_codes.includes("USED_PERCENT_INVALID"));

const ambiguous = normalizeCodexAppServerQuota(response({
  primary: {
    usedPercent: 0,
    windowDurationMins: 300,
    label: "weekly",
    resetsAt: Date.parse("2026-09-09T19:00:00.000Z"),
  },
}), { nowMs: NOW });
assert.equal(ambiguous.ok, false);
assert.ok(ambiguous.reason_codes.includes("WINDOW_IDENTITY_AMBIGUOUS"));

const staleSecondary = normalizeCodexAppServerQuota(response(), {
  nowMs: NOW,
  observed_at: new Date(NOW - 301_000).toISOString(),
});
assert.equal(staleSecondary.ok, false);
assert.equal(staleSecondary.freshness, "stale");

assert.equal(
  reconcileCodexQuotaObservations(primary(84), normalized).classification,
  "MATCH",
);
assert.equal(
  reconcileCodexQuotaObservations(primary(84), normalizeCodexAppServerQuota(response({
    secondary: { usedPercent: 18, windowDurationMins: 10_080, resetsAt: Date.parse("2026-09-16T00:00:00.000Z") },
  }), { nowMs: NOW })).classification,
  "WITHIN_TOLERANCE",
);
const mismatch = reconcileCodexQuotaObservations(primary(84), normalizeCodexAppServerQuota(response({
  secondary: { usedPercent: 70, windowDurationMins: 10_080, resetsAt: Date.parse("2026-09-16T00:00:00.000Z") },
}), { nowMs: NOW }));
assert.equal(mismatch.classification, "MISMATCH");
assert.equal(mismatch.effective_remaining_percent, 84);
assert.equal(mismatch.routing_authority, "OPENCLAW_PRIMARY");
assert.equal(mismatch.secondary_mismatch_overwrites_primary, false);
assert.equal(mismatch.observations_are_additive, false);
assert.equal(
  reconcileCodexQuotaObservations(primary(84), staleSecondary).classification,
  "UNKNOWN",
);
assert.equal(
  reconcileCodexQuotaObservations(primary(84, "stale"), normalized).effective_remaining_percent,
  null,
);
assert.equal(
  reconcileCodexQuotaObservations(primary(84, "stale"), normalized).routing_authority,
  "OPENCLAW_PRIMARY",
);
assert.equal(DEFAULT_RECONCILIATION_TOLERANCE_PERCENT, 5);

const poisoned = normalizeCodexAppServerQuota({
  ...response(),
  accessToken: "eyJhbGciOi.VERYLONGSECRET123456",
}, { nowMs: NOW });
assert.equal(poisoned.ok, false);
assert.doesNotMatch(JSON.stringify(poisoned), /VERYLONGSECRET|accessToken/);

const source = readFileSync(resolve(ROOT, "tools/collect-codex-appserver-quota-v1.mjs"), "utf8");
assert.doesNotMatch(source, /rateLimitResetCredit\/consume/);
assert.doesNotMatch(source, /\bfetch\s*\(|\bfetchFn\b|https?:\/\//i);
assert.doesNotMatch(JSON.stringify(normalized), /token|cookie|session|secret|password|authorization|api[_-]?key/i);
assert.ok(JSON.stringify(normalized).length < 12_000, "normalized output remains bounded");

console.log("PASS codex app-server secondary quota adapter offline contract");
console.log(JSON.stringify({ ok: true, pool_id: CODEX_QUOTA_POOL_ID, tolerance_percent: DEFAULT_RECONCILIATION_TOLERANCE_PERCENT }));
