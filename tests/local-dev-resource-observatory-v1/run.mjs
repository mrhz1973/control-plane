#!/usr/bin/env node
/**
 * Focused read-only observatory integration checks for the Codex pool
 * authority law (PHASE_0_5): the app-server observation is the SOLE authority
 * for chatgpt_codex_subscription; OpenClaw codex data is diagnostic-only and
 * can never override. The app-server response is an injected fixture; no RPC
 * occurs.
 */
import assert from "node:assert/strict";
import { collectQuotaObservatory } from "../../tools/local-dev-resource-observatory-v1.mjs";

const NOW = Date.parse("2026-09-09T16:00:00.000Z");

const appServerResponse = {
  result: {
    rateLimits: {
      primary: { usedPercent: 0, windowDurationMins: 300, resetsAt: Math.floor(NOW / 1000) + 3_600 },
      secondary: { usedPercent: 16, windowDurationMins: 10_080, resetsAt: Math.floor(NOW / 1000) + 86_400 },
    },
  },
  observed_at: new Date(NOW - 1_000).toISOString(),
};

const openclaw = {
  schema_version: "openclaw-quota-observation-v1",
  ok: true,
  freshness: "fresh",
  observed_at: new Date(NOW - 1_000).toISOString(),
  emit_contributions: false,
  pools: {
    chatgpt_codex_subscription: {
      state: "unknown", // PHASE_0_5: collector no longer computes codex capacity
      freshness: "stale",
      reason_code: "OPENCLAW_CODEX_AUTHORITY_RETIRED",
      effective_remaining_percent: null,
      primary: null,
      windows: [],
    },
  },
  contributions: [],
};

const result = await collectQuotaObservatory({
  nowMs: NOW,
  collectOpenClaw: async () => openclaw,
  codexAppServerResponse: appServerResponse,
  contributions: [],
  composeCanonicalQuotaState: async () => ({
    ok: true,
    schema_version: "v4-rt25-canonical-quota-state-v1",
    joined: {
      pools: {
        chatgpt_codex_subscription: {
          state: "available",
          freshness: "fresh",
          remaining_percent: 84,
          windows: [],
        },
      },
    },
  }),
});

assert.equal(Object.keys(result.pools).filter((id) => id === "chatgpt_codex_subscription").length, 1);
assert.equal(result.pools.chatgpt_codex_subscription.quota_pool_id, "chatgpt_codex_subscription");
assert.equal(result.codex_appserver_secondary.quota_pool_id, "chatgpt_codex_subscription");
assert.equal(result.codex_reconciliation.classification, "UNKNOWN"); // OpenClaw side stale/unknown → not comparable
// PHASE_0_5: app-server is the authority (was OPENCLAW_PRIMARY).
assert.equal(result.codex_reconciliation.primary_source, "CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ");
assert.equal(result.codex_reconciliation.routing_authority, "CODEX_APPSERVER_PRIMARY");
assert.equal(result.codex_reconciliation.openclaw_codex_role, "DIAGNOSTIC_ONLY");
assert.equal(result.codex_reconciliation.effective_remaining_percent, 84); // still sourced from authority
assert.equal(result.codex_reconciliation.observations_are_additive, false);
assert.equal(result.codex_quota_authority, "CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ");
assert.equal(result.glm_quota_authority, "OPENCLAW_STATUS_USAGE_JSON");
// Authority card rebuilt from app-server: 5h 0% used => 100, week 16% => 84, MIN = 84.
assert.equal(result.pools.chatgpt_codex_subscription.state, "AVAILABLE");
assert.equal(result.pools.chatgpt_codex_subscription.authority_source, "CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ");
assert.equal(result.pools.chatgpt_codex_subscription.remaining_percent, 84);
assert.equal(result.pools.chatgpt_codex_subscription.reconciliation.classification, "UNKNOWN");
assert.doesNotMatch(JSON.stringify(result), /rateLimitResetCredit\/consume|accessToken|cookie|authorization/i);

console.log("PASS local resource observatory Codex authority integration (PHASE_0_5)");
