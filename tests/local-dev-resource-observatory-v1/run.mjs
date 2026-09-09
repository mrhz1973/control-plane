#!/usr/bin/env node
/**
 * Focused read-only observatory integration checks for the Codex secondary
 * adapter.  The app-server response is an injected fixture; no RPC occurs.
 */
import assert from "node:assert/strict";
import { collectQuotaObservatory } from "../../tools/local-dev-resource-observatory-v1.mjs";

const NOW = Date.parse("2026-09-09T16:00:00.000Z");

const appServerResponse = {
  result: {
    rateLimits: {
      primary: { usedPercent: 0, windowDurationMins: 300, resetsAt: NOW + 3_600_000 },
      secondary: { usedPercent: 16, windowDurationMins: 10_080, resetsAt: NOW + 86_400_000 },
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
      state: "available",
      freshness: "fresh",
      effective_remaining_percent: 84,
      primary: { remaining_percent: 84, window_type: "weekly" },
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
assert.equal(result.codex_reconciliation.classification, "MATCH");
assert.equal(result.codex_reconciliation.routing_authority, "OPENCLAW_PRIMARY");
assert.equal(result.codex_reconciliation.effective_remaining_percent, 84);
assert.equal(result.codex_reconciliation.observations_are_additive, false);
assert.equal(result.pools.chatgpt_codex_subscription.reconciliation.classification, "MATCH");
assert.equal(result.pools.chatgpt_codex_subscription.remaining_percent, 84);
assert.doesNotMatch(JSON.stringify(result), /rateLimitResetCredit\/consume|accessToken|cookie|authorization/i);

console.log("PASS local resource observatory Codex secondary integration");
