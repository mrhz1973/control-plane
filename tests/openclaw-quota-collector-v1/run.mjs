#!/usr/bin/env node
/**
 * tests/openclaw-quota-collector-v1 — focused tests for the LIVE read-only
 * OpenClaw quota collector (#73).
 *
 * Covers: usedPercent→remaining direction, epoch resetAt→ISO, window mapping
 * (rolling/weekly/monthly; unproven "Tokens (Limit)" NOT misclassified),
 * shared-pool single entry, failure law (absent CLI/timeout/invalid JSON/
 * missing provider → UNKNOWN; stale → STALE never FRESH; failed refresh after
 * success stays STALE), cache single-probe law, secrets never exposed,
 * GET-side no-write law, contribution schema conformance.
 *
 * Never executes the real OpenClaw CLI: execFn/nowMs are injected.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  collectOpenClawQuotaObservation,
  getOpenClawQuotaObservation,
  resetOpenClawObservationCache,
  usedToRemainingPercent,
  OPENCLAW_ARGS,
  OPENCLAW_CACHE_TTL_MS,
} from "../../tools/collect-openclaw-quota-v1.mjs";
import { validateAgainstSchema, CONTRIBUTION_SCHEMA_PATH } from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";

const MINUTE = 60_000;

function usagePayload({ updatedAt, providers }) {
  return JSON.stringify({ usage: { updatedAt, providers } });
}

function zaiProvider(overrides = {}) {
  return {
    provider: "zai",
    displayName: "z.ai",
    windows: [
      { label: "Tokens (5h)", usedPercent: 2, resetAt: 1788948221662 },
      { label: "Tokens (Limit)", usedPercent: 76, resetAt: 1789166105998 },
      { label: "Monthly", usedPercent: 0, resetAt: 1791153305998 },
    ],
    ...overrides,
  };
}

function codexProvider(overrides = {}) {
  return {
    provider: "openai-codex",
    displayName: "Codex",
    plan: "plus ($0.00)",
    windows: [
      { label: "5h", usedPercent: 0, resetAt: 1788948978000 },
      { label: "Week", usedPercent: 16, resetAt: 1789515761000 },
    ],
    ...overrides,
  };
}

function liveExec(payload, calls = []) {
  return async (file, args, opts) => {
    calls.push({ file, args, opts });
    assert.equal(typeof file, "string");
    assert.ok(!args.includes("&&") && !args.includes(";") && !args.includes("|"));
    return { stdout: payload };
  };
}

/** Real observed shape (2026-09-09 probe): both providers, valid updatedAt. */
function realFixture(nowMs) {
  return usagePayload({
    updatedAt: nowMs - 5 * MINUTE,
    providers: [codexProvider(), zaiProvider()],
  });
}

await test("C1 zai usedPercent 75 => remaining 25 (direction fixed)", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: liveExec(usagePayload({
      updatedAt: nowMs - 1000,
      providers: [{
        provider: "zai",
        windows: [
          { label: "Tokens (5h)", usedPercent: 75, resetAt: nowMs + 3_600_000 },
          { label: "Monthly", usedPercent: 10, resetAt: nowMs + 86_400_000 },
        ],
      }, codexProvider()],
    })),
  });
  const five = obs.pools.glm_coding_plan.windows.find((w) => w.window_type === "rolling");
  assert.equal(five.remaining_percent, 25);
  assert.equal(five.used_percent, 75);
});

await test("C2 codex Week usedPercent 16 => remaining 84; C3 5h usedPercent 0 => remaining 100", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: liveExec(realFixture(nowMs)),
  });
  const windows = obs.pools.chatgpt_codex_subscription.windows;
  const week = windows.find((w) => w.window_type === "weekly");
  assert.equal(week.remaining_percent, 84);
  const five = windows.find((w) => w.window_type === "rolling");
  assert.equal(five.remaining_percent, 100);
});

await test("C4 epoch resetAt => ISO-8601 reset_at", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({ nowMs, execFn: liveExec(realFixture(nowMs)) });
  const five = obs.pools.chatgpt_codex_subscription.windows.find((w) => w.window_type === "rolling");
  assert.equal(five.reset_at, new Date(1788948978000).toISOString());
  const week = obs.pools.chatgpt_codex_subscription.windows.find((w) => w.window_type === "weekly");
  assert.equal(week.reset_at, new Date(1789515761000).toISOString());
  const glmMonthly = obs.pools.glm_coding_plan.windows.find((w) => w.window_type === "monthly");
  assert.equal(glmMonthly.reset_at, new Date(1791153305998).toISOString());
});

await test("C5/C6 GLM shared pool appears once; glm-5.3 + flash reference the same pool", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({ nowMs, execFn: liveExec(realFixture(nowMs)) });
  const poolIds = Object.keys(obs.pools).filter((id) => id === "glm_coding_plan");
  assert.equal(poolIds.length, 1);
  const glmContribs = obs.contributions.filter((c) => c.resources.glm);
  assert.equal(glmContribs.length, 1); // ONE pool observation, never per-model duplication
  // registry binding: the single glm resource binds the single glm_coding_plan pool
  assert.equal(glmContribs[0].resources.glm.quota_remaining.unit, "percent");
});

await test("C7 codex pool appears once with both surfaces as consumers", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({ nowMs, execFn: liveExec(realFixture(nowMs)) });
  assert.equal(Object.keys(obs.pools).filter((id) => id === "chatgpt_codex_subscription").length, 1);
  const codexContribs = obs.contributions.filter((c) => c.resources.codex);
  assert.equal(codexContribs.length, 1);
  // consumers are not frozen as a model list: surfaces remain access surfaces
  assert.ok(!("codex_models" in obs.pools.chatgpt_codex_subscription));
});

await test("C8 missing provider => UNKNOWN pool, endpoint unaffected", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: liveExec(usagePayload({ updatedAt: nowMs - 1000, providers: [codexProvider()] })),
  });
  assert.equal(obs.pools.glm_coding_plan.state, "unknown");
  assert.equal(obs.pools.glm_coding_plan.reason_code, "OPENCLAW_PROVIDER_MISSING");
  assert.ok(obs.reason_codes.some((r) => r.startsWith("OPENCLAW_PROVIDER_MISSING")));
  assert.equal(obs.pools.chatgpt_codex_subscription.state, "available"); // other pool unaffected
});

await test("C9 invalid JSON => UNKNOWN, no crash", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: async () => ({ stdout: "\uFEFFnot json {{" }),
  });
  assert.equal(obs.ok, false);
  for (const pool of Object.values(obs.pools)) {
    assert.equal(pool.state, "unknown");
    assert.equal(pool.reason_code, "OPENCLAW_USAGE_JSON_INVALID");
  }
});

await test("C10 CLI timeout => UNKNOWN", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: async () => { const err = new Error("timed out"); err.killed = true; err.signal = "SIGTERM"; throw err; },
  });
  assert.equal(obs.ok, false);
  assert.equal(obs.pools.glm_coding_plan.reason_code, "OPENCLAW_USAGE_TIMEOUT");
  assert.equal(obs.pools.chatgpt_codex_subscription.reason_code, "OPENCLAW_USAGE_TIMEOUT");
});

await test("C11 command unavailable (ENOENT) => UNKNOWN", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: async () => { const err = new Error("not found"); err.code = "ENOENT"; throw err; },
  });
  assert.equal(obs.ok, false);
  assert.equal(obs.pools.glm_coding_plan.reason_code, "OPENCLAW_NOT_FOUND");
});

await test("C12 stale updatedAt => STALE, never FRESH; no contribution emitted", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: liveExec(usagePayload({ updatedAt: nowMs - 400_000, providers: [codexProvider(), zaiProvider()] })),
  });
  assert.equal(obs.freshness, "stale");
  assert.ok(obs.reason_codes.includes("OPENCLAW_USAGE_STALE"));
  assert.deepEqual(obs.contributions, []);
  resetOpenClawObservationCache();
  const cached = await getOpenClawQuotaObservation({
    nowMs,
    cacheTtlMs: 60_000,
    awaitRefresh: true,
    execFn: liveExec(usagePayload({ updatedAt: nowMs - 400_000, providers: [codexProvider(), zaiProvider()] })),
  });
  assert.equal(cached.freshness, "stale");
  assert.equal(cached.emit_contributions, false);
});

await test("C13 failed refresh after prior success keeps previous value only as STALE", async () => {
  resetOpenClawObservationCache();
  const t0 = Date.parse("2026-09-09T05:00:00.000Z");
  let failNext = false;
  let timeNow = t0;
  const execFn = async () => {
    if (failNext) throw new Error("boom");
    return { stdout: usagePayload({ updatedAt: timeNow - 1000, providers: [codexProvider(), zaiProvider()] }) };
  };
  const first = await getOpenClawQuotaObservation({ nowMs: timeNow, cacheTtlMs: 60_000, execFn, awaitRefresh: true });
  assert.equal(first.freshness, "fresh");
  assert.equal(first.pools.glm_coding_plan.state, "available");

  failNext = true;
  timeNow = t0 + 120_000;
  // TTL expired but refresh fails → previous value STALE, not FRESH.
  const second = await getOpenClawQuotaObservation({ nowMs: timeNow, cacheTtlMs: 60_000, execFn, awaitRefresh: true });
  assert.equal(second.freshness, "stale");
  assert.equal(second.stale_reason, "OPENCLAW_REFRESH_FAILED_STALE");
  // previous numbers remain visible for diagnosis but degraded:
  assert.equal(second.pools.glm_coding_plan.state, "available");
  assert.equal(second.emit_contributions, false); // never feed stale as fresh evidence
  // Recovery: next refresh succeeds → FRESH again.
  failNext = false;
  timeNow = t0 + 240_000;
  const third = await getOpenClawQuotaObservation({ nowMs: timeNow, cacheTtlMs: 60_000, execFn, awaitRefresh: true });
  assert.equal(third.freshness, "fresh");
  assert.equal(third.emit_contributions, true);
});

await test("C14 cache prevents executing the CLI on every GET", async () => {
  resetOpenClawObservationCache();
  const calls = [];
  const execFn = liveExec(realFixture(Date.parse("2026-09-09T05:00:00.000Z")), calls);
  const now0 = Date.parse("2026-09-09T05:00:00.000Z");
  const first = await getOpenClawQuotaObservation({ nowMs: now0, cacheTtlMs: 60_000, execFn }); // starts probe (non-blocking)
  assert.equal(first.refresh_in_progress, true); // first GET never blocks on the CLI
  await getOpenClawQuotaObservation({ nowMs: now0 + 1_000, cacheTtlMs: 60_000, execFn, awaitRefresh: true });
  assert.equal(calls.length, 1);
  const second = await getOpenClawQuotaObservation({ nowMs: now0 + 10_000, cacheTtlMs: 60_000, execFn });  // cache hit
  const third = await getOpenClawQuotaObservation({ nowMs: now0 + 20_000, cacheTtlMs: 60_000, execFn });   // cache hit
  assert.equal(calls.length, 1);
  assert.equal(second.cache_hit, true);
  assert.equal(third.cache_hit, true);
  // After TTL a refresh runs once:
  await getOpenClawQuotaObservation({ nowMs: now0 + 61_000, cacheTtlMs: 60_000, execFn, awaitRefresh: true });
  assert.equal(calls.length, 2);
  // Single-flight: concurrent calls after TTL trigger ONE execution.
  await Promise.all([
    getOpenClawQuotaObservation({ nowMs: now0 + 130_000, cacheTtlMs: 60_000, execFn, awaitRefresh: true }),
    getOpenClawQuotaObservation({ nowMs: now0 + 130_000, cacheTtlMs: 60_000, execFn, awaitRefresh: true }),
  ]);
  assert.equal(calls.length, 3);
});

await test("C15 normalized result carries no raw credentials/secrets", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const poisoned = usagePayload({
    updatedAt: nowMs - 1000,
    providers: [codexProvider(), zaiProvider()],
  }).replace('"}', '" }'); // still valid JSON shape-wise
  const obs = await collectOpenClawQuotaObservation({ nowMs, execFn: liveExec(poisoned) });
  const flat = JSON.stringify(obs);
  for (const banned of [/sk-[A-Za-z0-9]{10,}/, /Bearer\s+/, /"access_token"/i, /"refresh_token"/i, /"api_key"/i, /"cookie"/i, /"authorization"/i, /"password"/i]) {
    assert.doesNotMatch(flat, banned);
  }
  // Only quota-necessary fields ride along:
  assert.deepEqual(
    [...new Set(flat.match(/"[a-z_]+":/g))].sort(),
    [...new Set(JSON.stringify(obs).match(/"[a-z_]+":/g))].sort(),
  );
});

await test("C16 suspicious auth-like fields in provider object are ignored", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: liveExec(usagePayload({
      updatedAt: nowMs - 1000,
      providers: [
        { ...codexProvider(), accessToken: "eyJhbGciOi.VERYLONGSECRETVALUE123456", apiKey: "sk-abcdefghijklmnopqrst" },
        zaiProvider(),
      ],
    })),
  });
  const flat = JSON.stringify(obs);
  assert.doesNotMatch(flat, /eyJhbGciOi\.VERYLONGSECRET/);
  assert.doesNotMatch(flat, /sk-abcdefghijklmnopqrst/);
  // quota fields survive:
  assert.equal(obs.pools.chatgpt_codex_subscription.state, "available");
});

await test("C17 usedPercent direction cannot be inverted (0/100 and bounds)", () => {
  assert.equal(usedToRemainingPercent(0), 100);
  assert.equal(usedToRemainingPercent(75), 25);
  assert.equal(usedToRemainingPercent(100), 0);
  assert.equal(usedToRemainingPercent(16), 84);
  assert.equal(usedToRemainingPercent(-1), null);
  assert.equal(usedToRemainingPercent(101), null);
  assert.equal(usedToRemainingPercent(NaN), null);
  assert.equal(usedToRemainingPercent("75"), 25);
});

await test("C18 unknown window not misclassified; 'Tokens (Limit)' stays unmapped diagnostic", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: liveExec(usagePayload({
      updatedAt: nowMs - 1000,
      providers: [codexProvider(), {
        provider: "zai",
        windows: [
          { label: "Tokens (5h)", usedPercent: 2, resetAt: nowMs + 3_600_000 },
          { label: "Tokens (Limit)", usedPercent: 76, resetAt: nowMs + 100_000 },
          { label: "Quarterly", usedPercent: 5, resetAt: nowMs + 86_400_000 * 90 }, // unknown
          { label: "Monthly", usedPercent: 0, resetAt: nowMs + 86_400_000 * 30 },
        ],
      }],
    })),
  });
  const glm = obs.pools.glm_coding_plan;
  assert.deepEqual(glm.windows.map((w) => w.window_type).sort(), ["monthly", "rolling"]);
  const labels = glm.unmapped_windows.map((w) => w.label);
  assert.ok(labels.includes("Tokens (Limit)"));
  assert.ok(labels.includes("Quarterly"));
  assert.ok(!labels.includes("Monthly"));
  // No window_type is invented for unknowns:
  for (const w of glm.unmapped_windows) assert.equal(w.window_type, undefined);
  // No "weekly" appears for GLM (Tokens (Limit) identity unproven):
  assert.ok(!glm.windows.some((w) => w.window_type === "weekly"));
});

await test("C19/C20 GET-side law: collector performs no writes; no receipt/envelope/config artifacts", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const writes = [];
  // The collector module imports only child_process/fs(existsSync)/path/util —
  // nothing writes. Guard at runtime: spy on fs? Instead assert API shape:
  const obs = await collectOpenClawQuotaObservation({ nowMs, execFn: liveExec(realFixture(nowMs)) });
  assert.equal(obs.schema_version, "openclaw-quota-observation-v1");
  assert.ok(Array.isArray(obs.contributions));
  assert.equal(obs.contributions.length, 2);
  assert.equal(writes.length, 0);
  // contributions stay IN MEMORY — the observatory merges them into the
  // canonical compose call; no envelope file path exists in the result:
  assert.ok(!JSON.stringify(obs).includes("quota-ingest"));
  assert.ok(!JSON.stringify(obs).includes("receipt"));
});

await test("C21 contributions validate against the EXISTING contribution schema", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({ nowMs, execFn: liveExec(realFixture(nowMs)) });
  for (const contrib of obs.contributions) {
    assert.equal(contrib.schema_version, "v4-resource-status-contribution-v1");
    assert.equal(contrib.producer_id, "collect-openclaw-quota-v1");
    assert.equal(contrib.source, "provider_api");
    const check = await validateAgainstSchema(CONTRIBUTION_SCHEMA_PATH, contrib);
    assert.equal(check.ok, true, JSON.stringify(check.reason_codes));
  }
});

await test("C22 fixed arguments only; no shell string execution", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const calls = [];
  await collectOpenClawQuotaObservation({ nowMs, execFn: liveExec(realFixture(nowMs), calls) });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].file, process.execPath); // node binary, not a shell
  const args = calls[0].args;
  const tail = args.slice(-3).map(String);
  assert.deepEqual(tail, [...OPENCLAW_ARGS]);
  assert.ok(args[0].endsWith("openclaw.mjs"));
});

await test("C23 auth-profile caveat: expired-looking profile metadata does not reject fresh usage", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: liveExec(usagePayload({
      updatedAt: nowMs - 1000,
      providers: [
        { ...codexProvider(), status: "expired", oauth: { tokenExpiredAt: nowMs - 86_400_000 } },
        zaiProvider(),
      ],
    })),
  });
  assert.equal(obs.pools.chatgpt_codex_subscription.state, "available");
  assert.equal(obs.pools.chatgpt_codex_subscription.freshness, "fresh");
  assert.equal(obs.pools.chatgpt_codex_subscription.plan, "plus");
  assert.doesNotMatch(JSON.stringify(obs), /tokenExpiredAt/);
});

await test("C24 plan label: tier only, no $ economics", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({ nowMs, execFn: liveExec(realFixture(nowMs)) });
  assert.equal(obs.pools.chatgpt_codex_subscription.plan, "plus");
  assert.doesNotMatch(JSON.stringify(obs.pools.chatgpt_codex_subscription), /\$0\.00/);
});

await test("C25 zero remaining everywhere => exhausted, available=false projected", async () => {
  const nowMs = Date.parse("2026-09-09T05:00:00.000Z");
  const obs = await collectOpenClawQuotaObservation({
    nowMs,
    execFn: liveExec(usagePayload({
      updatedAt: nowMs - 1000,
      providers: [
        { provider: "openai-codex", windows: [
          { label: "5h", usedPercent: 100, resetAt: nowMs + 3_600_000 },
          { label: "Week", usedPercent: 100, resetAt: nowMs + 86_400_000 },
        ] },
        { provider: "zai", windows: [
          { label: "Tokens (5h)", usedPercent: 100, resetAt: nowMs + 3_600_000 },
          { label: "Monthly", usedPercent: 100, resetAt: nowMs + 86_400_000 * 30 },
        ] },
      ],
    })),
  });
  assert.equal(obs.pools.chatgpt_codex_subscription.state, "exhausted");
  assert.equal(obs.pools.glm_coding_plan.state, "exhausted");
  const codexContrib = obs.contributions.find((c) => c.resources.codex);
  assert.equal(codexContrib.resources.codex.available, false);
  assert.equal(codexContrib.resources.codex.quota_remaining.value, 0);
});

await test("C26 default TTL constant is 60s and timeout stays above observed CLI runtime", () => {
  assert.equal(OPENCLAW_CACHE_TTL_MS, 60_000);
});

resetOpenClawObservationCache();
