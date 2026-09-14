#!/usr/bin/env node
/**
 * PHASE_0_5 focused deterministic test â€” Codex authority migration.
 * Proves (injected inputs only, zero live calls, zero inference):
 *   T1 app-server ok+fresh  â†’ codex card REBUILT from app-server (authority),
 *      OpenClaw contribution for codex absent from the composer lane;
 *   T2 app-server ABSENT while OpenClaw codex data present â†’ codex pool stays
 *      UNKNOWN/STALE (CODEX_OPENCLAW_FALLBACK=NO), GLM untouched via OpenClaw;
 *   T3 app-server STALE (observed_at old) â†’ authority null â†’ codex UNKNOWN;
 *   T4 app-server MALFORMED â†’ authority null â†’ codex UNKNOWN;
 *   T5 app-server rate_limit_reached (5h 100% used) â†’ pool NOT healthy,
 *      exhausted semantics preserved (0 remaining, no OpenClaw override);
 *   T6 OpenClaw collector emits NO codex contribution (suppressed at source);
 *   T7 GLM flow unchanged: GLM contribution still emitted;
 *   T8 reconciliation labels app-server primary / OpenClaw demoted diagnostic.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { collectOpenClawQuotaObservation } from "../../tools/collect-openclaw-quota-v1.mjs";
import {
  reconcileCodexQuotaObservations,
  normalizeCodexAppServerQuota,
} from "../../tools/collect-codex-appserver-quota-v1.mjs";
import { CODEX_PRIMARY_SOURCE, codexAuthorityObservation } from "../../tools/v4-codex-pool-authority-v1.mjs";

const NOW = Date.parse("2026-09-14T00:40:00.000Z");
const RESET_5H = Math.floor(NOW / 1000) + 3600; // epoch s
const RESET_W = Math.floor(NOW / 1000) + 86400;

/** Exact shape proven live in the comparison task (app-server 3b). */
function appServerPayload({ used5h, usedWeek = 31 }) {
  return {
    rateLimits: {
      limitId: "codex",
      primary: { usedPercent: used5h, windowDurationMins: 300, resetsAt: RESET_5H },
      secondary: { usedPercent: usedWeek, windowDurationMins: 10080, resetsAt: RESET_W },
      planType: "plus",
      rateLimitReachedType: used5h >= 100 ? "rate_limit_reached" : null,
    },
  };
}

/** Minimal OpenClaw payload shape (proven live, run 2). */
function openclawPayload() {
  return {
    usage: {
      updatedAt: NOW - 60_000,
      providers: [
        {
          provider: "openai-codex",
          plan: "plus ($0.00)",
          windows: [
            { label: "5h", usedPercent: 0, resetAt: (NOW + 3600_000) },
            { label: "Week", usedPercent: 16, resetAt: (NOW + 5 * 86400_000) },
          ],
        },
        {
          provider: "zai",
          windows: [
            { label: "Tokens (5h)", usedPercent: 21, resetAt: NOW + 3600_000 },
            { label: "Tokens (Limit)", usedPercent: 40, resetAt: NOW + 4 * 86400_000 },
          ],
        },
      ],
    },
  };
}

/** Collect OpenClaw with the CLI fully mocked (execFn) â€” no live call. */
function collectOpenClawMocked() {
  return collectOpenClawQuotaObservation({
    nowMs: NOW,
    bypassCache: true,
    execFn: async () => ({ stdout: JSON.stringify(openclawPayload()) }),
  });
}

async function buildObs({ withAppServer, appServer = null }) {
  const openclaw = await collectOpenClawMocked();
  assert.equal(openclaw.ok, true, "openclaw fixture must normalize ok");
  const { collectQuotaObservatory } = await import("../../tools/local-dev-resource-observatory-v1.mjs");
  const { composeCanonicalQuotaState } = await import("../../tools/rt25-canonical-quota-state-v1.mjs");
  const registry = JSON.parse(readFileSync("configs/resources/registry.json", "utf8"));
  return collectQuotaObservatory({
    nowMs: NOW,
    collectOpenClaw: async () => ({
      emit_contributions: true,
      observed_at: new Date(NOW).toISOString(),
      freshness: "fresh",
      cache_hit: false,
      refresh_in_progress: false,
      pools: openclaw.pools,
      contributions: openclaw.contributions,
      reason_codes: [],
    }),
    composeCanonicalQuotaState: async (opts) =>
      composeCanonicalQuotaState({ ...opts, registry, nowMs: NOW }),
    ...(withAppServer ? { codexAppServerObservation: appServer } : {}),
  });
}

const results = [];
function check(name, fn) {
  results.push([name, fn]);
}

// ---- T6/T7 at the source (collector level, before observatory) ----
check("T6_openclaw_emits_no_codex_contribution", async () => {
  const obs = await collectOpenClawMocked();
  const codexContrib = obs.contributions.filter((c) => {
    const key = Object.keys(c.resources || {})[0];
    return key === "codex";
  });
  assert.equal(codexContrib.length, 0, "openclaw must not emit codex contributions anymore");
  assert.equal(obs.pools.chatgpt_codex_subscription.state, "unknown");
  assert.ok((obs.pools.chatgpt_codex_subscription.reason_code || "").includes("AUTHORITY_RETIRED"));
});

check("T7_glm_contribution_still_emitted", async () => {
  const obs = await collectOpenClawMocked();
  const glmContrib = obs.contributions.filter((c) => Object.keys(c.resources || {})[0] === "glm");
  assert.equal(glmContrib.length, 1, "GLM OpenClaw dependency must be KEPT");
  assert.equal(obs.pools.glm_coding_plan.state, "available");
});

// ---- T8 reconciliation flip ----
check("T8_reconciliation_appserver_primary", () => {
  const secondary = normalizeCodexAppServerQuota(appServerPayload({ used5h: 20 }), { nowMs: NOW });
  assert.equal(secondary.ok, true);
  const openclawCodexPool = {
    state: "available",
    freshness: "fresh",
    primary: { remaining_percent: 69, reset_at: new Date(NOW + 5 * 86400_000).toISOString() },
  };
  const rec = reconcileCodexQuotaObservations(openclawCodexPool, secondary);
  assert.equal(rec.primary_source, CODEX_PRIMARY_SOURCE);
  assert.equal(rec.routing_authority, "CODEX_APPSERVER_PRIMARY");
  assert.equal(rec.openclaw_codex_role, "DIAGNOSTIC_ONLY");
  assert.equal(rec.effective_remaining_percent, secondary.effective_remaining_percent, "effective value must come from app-server");
});

// ---- T1 authority applied ----
check("T1_appserver_authority_rebuilds_codex_card", async () => {
  const obs = await buildObs({ withAppServer: true, appServer: appServerPayload({ used5h: 20 }) });
  const codex = obs.pools.chatgpt_codex_subscription;
  assert.equal(obs.codex_quota_authority, CODEX_PRIMARY_SOURCE);
  assert.equal(codex.state, "AVAILABLE");
  assert.equal(codex.freshness, "fresh");
  assert.equal(codex.authority_source, CODEX_PRIMARY_SOURCE);
  // 5h 20% used â†’ 80 remaining; week 31 â†’ 69; limiting = 69 (MIN law preserved)
  assert.equal(codex.remaining_percent, 69);
  const rolling = codex.windows.find((w) => w.window_type === "rolling");
  const weekly = codex.windows.find((w) => w.window_type === "weekly");
  assert.equal(rolling.remaining_percent, 80);
  assert.equal(weekly.remaining_percent, 69);
  assert.ok(rolling.reset_at && weekly.reset_at, "canonical reset timestamps preserved");
  // GLM unaffected
  const glm = obs.pools.glm_coding_plan;
  assert.equal(glm.state, "AVAILABLE");
});

// ---- T2 THE mandatory fail-closed test ----
check("T2_no_appserver_openclaw_data_present_codex_stays_unknown", async () => {
  const obs = await buildObs({ withAppServer: false });
  const codex = obs.pools.chatgpt_codex_subscription;
  assert.equal(obs.codex_quota_authority, CODEX_PRIMARY_SOURCE);
  assert.equal(codex.authority_source, CODEX_PRIMARY_SOURCE);
  assert.equal(codex.state, "UNKNOWN", "codex must stay UNKNOWN without app-server");
  assert.equal(codex.freshness, "stale");
  assert.ok(
    ["CODEX_APPSERVER_UNAVAILABLE", "CODEX_APPSERVER_STALE", "CODEX_APPSERVER_MALFORMED"].includes(codex.reason_code),
    `unexpected reason ${codex.reason_code}`,
  );
  // No OpenClaw leaked numbers on the codex card:
  assert.equal(codex.remaining_percent ?? null, null);
  assert.equal(codex.reset_at ?? null, null);
  assert.equal((codex.windows || []).length, 0);
  // GLM continues via OpenClaw unchanged:
  const glm = obs.pools.glm_coding_plan;
  assert.equal(glm.state, "AVAILABLE", "GLM must keep working via OpenClaw");
  assert.equal(glm.collector_id, "openclaw_usage_live");
});

check("T3_appserver_stale_fails_closed", async () => {
  const stale = appServerPayload({ used5h: 20 });
  stale.observed_at = new Date(NOW - 6 * 60_000).toISOString(); // > 5 min max age
  const obs = await buildObs({ withAppServer: true, appServer: stale });
  const codex = obs.pools.chatgpt_codex_subscription;
  assert.equal(codex.state, "UNKNOWN");
  assert.equal(codex.reason_code, "CODEX_APPSERVER_STALE");
});

check("T4_appserver_malformed_fails_closed", async () => {
  const obs = await buildObs({ withAppServer: true, appServer: { garbage: true } });
  const codex = obs.pools.chatgpt_codex_subscription;
  assert.equal(codex.state, "UNKNOWN");
  assert.equal(codex.reason_code, "CODEX_APPSERVER_MALFORMED");
});

check("T5_rate_limit_reached_respected_no_openclaw_override", async () => {
  const obs = await buildObs({ withAppServer: true, appServer: appServerPayload({ used5h: 100 }) });
  const codex = obs.pools.chatgpt_codex_subscription;
  // OpenClaw fixture says 5h usedPercent=0 (fully available) â€” must NOT win.
  assert.notEqual(codex.remaining_percent, 100);
  assert.equal(codex.state, "EXHAUSTED");
  assert.equal(codex.remaining_percent, 0);
  const rolling = codex.windows.find((w) => w.window_type === "rolling");
  assert.equal(rolling.remaining_percent, 0);
});

let failed = 0;
for (const [name, fn] of results) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${name}: ${err.message}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} PASS`);
process.exit(failed ? 1 : 0);
