#!/usr/bin/env node
/**
 * V4_CURSOR_CLI_LIVE_QUOTA_SOURCE_QUALIFICATION_AND_WIRING_V1 — focused #81
 * suite (positive path: PARTIAL_LIVE_QUALIFIED plan-only wiring).
 *
 * Proves: real-shaped sanitized fixture parsing, fail-closed on
 * missing/timeout/malformed sources, secret fence, LIVE provenance only on
 * success, manual evidence never relabeled, no fabricated pools, schema
 * compatibility, manual evidence readability.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  collectCursorCliQuotaObservation,
  getCursorCliQuotaObservation,
  resetCursorCliObservationCache,
  CURSOR_ABOUT_ARGS,
  CURSOR_CLI_QUOTA_SCHEMA,
} from "../../tools/collect-cursor-cli-quota-v1.mjs";
import { collectQuotaObservatory } from "../../tools/local-dev-resource-observatory-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const NOW = Date.parse("2026-09-17T00:00:00.000Z");

/** Real-shaped SANITIZED fixture mirroring `about --format json` structure
 * WITHOUT personal material (userEmail/userId/lastRequestId omitted). */
const aboutFixture = (overrides = {}) =>
  JSON.stringify({
    cliVersion: "2026.09.10-fd3934a",
    latestStatus: "update_available",
    latestVersion: "2026.09.15-d2fe57e",
    model: "Composer 2.5 Fast",
    subscriptionTier: "Pro+",
    osPlatform: "win32",
    osArch: "x64",
    ...overrides,
  });

const execWith = (stdout, { code = 0 } = {}) =>
  async () => (code === 0 ? { stdout, stderr: "" } : Promise.reject(Object.assign(new Error("exit"), { code: `EXIT_${code}` })));

const secretSecretFixture = () =>
  JSON.stringify({ subscriptionTier: "sk-ABCDEFGHIJ12345", cliVersion: "x" });

// ---- T1 real-shaped sanitized fixture accepted --------------------------------

await test("T1 parser accepts real-shaped sanitized fixture (plan Pro+)", async () => {
  resetCursorCliObservationCache();
  const obs = await collectCursorCliQuotaObservation({ nowMs: NOW, execFn: execWith(aboutFixture()) });
  assert.equal(obs.ok, true);
  assert.equal(obs.schema_version, CURSOR_CLI_QUOTA_SCHEMA);
  assert.equal(obs.plan, "Pro+");
  assert.equal(obs.state, "OBSERVED");
  assert.equal(obs.freshness, "fresh");
  assert.equal(obs.source, "cursor_cli_about");
  assert.equal(obs.scope.plan, true, "qualified scope declares plan");
  assert.equal(obs.scope.usage_pools, false, "no usage pools fabricated");
  assert.equal(obs.scope.reset, false, "no reset data fabricated");
});

// ---- T2 missing source → UNKNOWN ----------------------------------------------

await test("T2 missing source -> UNKNOWN, not invented data", async () => {
  resetCursorCliObservationCache();
  const obs = await collectCursorCliQuotaObservation({
    nowMs: NOW,
    execFn: async () => Promise.reject(Object.assign(new Error("not found"), { code: "ENOENT" })),
  });
  assert.equal(obs.ok, false);
  assert.equal(obs.state, "UNKNOWN");
  assert.equal(obs.plan, null, "no invented plan");
  assert.equal(obs.reason_code, "CURSOR_CLI_NOT_FOUND");
});

// ---- T3 timeout → safe failure --------------------------------------------------

await test("T3 timeout -> safe failure", async () => {
  resetCursorCliObservationCache();
  const obs = await collectCursorCliQuotaObservation({
    nowMs: NOW,
    execFn: async () => Promise.reject(Object.assign(new Error("timed out"), { killed: true })),
  });
  assert.equal(obs.ok, false);
  assert.equal(obs.state, "UNKNOWN");
  assert.equal(obs.plan, null);
  assert.equal(obs.reason_code, "CURSOR_CLI_TIMEOUT");
});

// ---- T4 malformed output → safe failure -------------------------------------------

await test("T4 malformed output -> safe failure", async () => {
  resetCursorCliObservationCache();
  for (const bad of ["not json at all", JSON.stringify({}), JSON.stringify({ subscriptionTier: "" }), JSON.stringify([1, 2])]) {
    const obs = await collectCursorCliQuotaObservation({ nowMs: NOW, execFn: execWith(bad) });
    assert.equal(obs.ok, false, `malformed output must fail closed: ${bad.slice(0, 20)}`);
    assert.equal(obs.plan, null);
    assert.ok(["CURSOR_CLI_JSON_INVALID", "CURSOR_CLI_PLAN_MISSING"].includes(obs.reason_code));
  }
});

// ---- T5 secret fence ---------------------------------------------------------------

await test("T5 secret-looking fields are not persisted/exposed", async () => {
  resetCursorCliObservationCache();
  const obs = await collectCursorCliQuotaObservation({ nowMs: NOW, execFn: execWith(secretSecretFixture()) });
  assert.equal(obs.ok, false, "secret-like tier fails closed");
  assert.equal(obs.reason_code, "CURSOR_CLI_PLAN_MISSING");
  // Full-observation secret scan: even valid fixtures must survive the defensive scan.
  const good = await collectCursorCliQuotaObservation({ nowMs: NOW, execFn: execWith(aboutFixture({ extra: "Bearer abcdefghijklmnop" })) });
  const serialized = JSON.stringify(good);
  assert.doesNotMatch(serialized, /Bearer\s+[A-Za-z0-9._\-+=/]{8,}/, "bearer-like material never materializes");
  // Personal fields never copied even if present in source JSON.
  assert.doesNotMatch(serialized, /userEmail|userId|lastRequestId|userInfo/, "personal identifiers dropped");
  assert.equal(good.plan, "Pro+", "plan still parsed from fixture containing unknown extra fields");
});

// ---- T6 LIVE provenance only on success ----------------------------------------------

await test("T6 provenance is LIVE only on successful valid observation", async () => {
  resetCursorCliObservationCache();
  const failThenLive = await collectQuotaObservatory({
    nowMs: NOW,
    collectOpenClaw: null,
    collectCursorCli: async () => ({ ok: false, freshness: "stale", reason_code: "CURSOR_CLI_TIMEOUT", plan: null, observed_at: null, cli_version: null, scope: null, cache_hit: false }),
    composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: {} }, reason_codes: [] }),
  });
  assert.equal(failThenLive.cursor.plan, "Pro+", "manual plan still readable");
  assert.equal(failThenLive.cursor.plan_provenance, "MANUAL", "failed live -> plan stays MANUAL, never fake LIVE");
  assert.equal(failThenLive.cursor.cli_live.ok, false);
  assert.equal(failThenLive.cursor.cli_live.reason_code, "CURSOR_CLI_TIMEOUT");

  const liveNow = await collectQuotaObservatory({
    nowMs: NOW,
    collectOpenClaw: null,
    collectCursorCli: async () => ({
      ok: true, freshness: "fresh", plan: "Pro+", observed_at: new Date(NOW).toISOString(),
      cli_version: "2026.09.10-fd3934a", reason_code: null, scope: { plan: true, usage_pools: false, reset: false, on_demand: false }, cache_hit: false,
    }),
    composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: {} }, reason_codes: [] }),
  });
  assert.equal(liveNow.cursor.plan, "Pro+");
  assert.equal(liveNow.cursor.plan_provenance, "LIVE", "successful fresh observation -> LIVE");
  assert.equal(liveNow.cursor.plan_observed_at, new Date(NOW).toISOString());
  assert.equal(liveNow.cursor.cli_live.ok, true);
  assert.equal(liveNow.cursor.cli_live.freshness, "fresh");
});

// ---- T7 manual never silently relabeled ----------------------------------------------

await test("T7 manual evidence is never silently relabeled live", async () => {
  resetCursorCliObservationCache();
  const manualPath = resolve(ROOT, "configs/runtime/quota-observatory/cursor-manual-observation.json");
  const manual = JSON.parse(readFileSync(manualPath, "utf8"));
  assert.equal(manual.source, "operator_manual_observation", "manual file untouched authority");
  // No live collector wired (null) -> everything stays MANUAL provenance.
  const manualOnly = await collectQuotaObservatory({
    nowMs: NOW,
    collectOpenClaw: null,
    collectCursorCli: null,
    composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: {} }, reason_codes: [] }),
  });
  assert.equal(manualOnly.cursor.plan, manual.plan);
  assert.equal(manualOnly.cursor.plan_provenance, "MANUAL");
  assert.equal(manualOnly.cursor.labels_provenance, "MANUAL");
  assert.equal(manualOnly.cursor.plan_reset_provenance, "MANUAL");
  assert.equal(manualOnly.cursor.plan_reset_date, "2026-09-19");
  assert.equal(manualOnly.cursor.plan_reset_at, null, "date-only precision preserved");
  assert.equal(manualOnly.cursor.labels.cursor_models, 0);
  assert.equal(manualOnly.cursor.labels.other_models, 1);
  // Live plan + manual reset coexist with DIFFERENT provenance per field.
  const mixed = await collectQuotaObservatory({
    nowMs: NOW,
    collectOpenClaw: null,
    collectCursorCli: async () => ({
      ok: true, freshness: "fresh", plan: "Pro+", observed_at: new Date(NOW).toISOString(),
      cli_version: "v", reason_code: null, scope: { plan: true }, cache_hit: false,
    }),
    composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: {} }, reason_codes: [] }),
  });
  assert.equal(mixed.cursor.plan_provenance, "LIVE");
  assert.equal(mixed.cursor.plan_reset_provenance, "MANUAL", "reset stays MANUAL even when plan is LIVE");
  assert.equal(mixed.cursor.labels_provenance, "MANUAL", "labels stay MANUAL even when plan is LIVE");
});

// ---- T8 no fabricated pools --------------------------------------------------------

await test("T8 partial source does not fabricate absent quota pools", async () => {
  resetCursorCliObservationCache();
  const obs = await collectCursorCliQuotaObservation({ nowMs: NOW, execFn: execWith(aboutFixture()) });
  const serialized = JSON.stringify(obs);
  assert.doesNotMatch(serialized, /cursor_models_remaining|other_models_remaining|used_percent|remaining_percent|reset_at/i,
    "no usage pool numbers materialize from a plan-only source");
  assert.equal(obs.scope.usage_pools, false);
  const viaObservatory = await collectQuotaObservatory({
    nowMs: NOW,
    collectOpenClaw: null,
    collectCursorCli: async () => ({ ...obs, cache_hit: false }),
    composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: {} }, reason_codes: [] }),
  });
  // Live plan present; pools still exactly the manual labels (or null), never CLI-invented numbers.
  assert.equal(viaObservatory.cursor.source_usage.cursor_models_used_percent, 100, "manual used % preserved");
  assert.equal(viaObservatory.cursor.labels.cursor_models, 0, "manual remaining preserved");
  assert.ok(!("cursor_models_remaining_live" in viaObservatory.cursor));
});

// ---- T9 dashboard/resource schema compatible ---------------------------------------

await test("T9 dashboard/resource schema remains compatible (card renders with provenance)", async () => {
  const { createContext, runInContext } = await import("node:vm");
  const dashboardHtml = readFileSync(resolve(ROOT, "tools/local-dev-dispatcher-dashboard-v1.html"), "utf8");
  const script = dashboardHtml.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script);
  const elements = new Map();
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const node = {
      id, value: "", checked: true, disabled: false, hidden: false, open: false,
      dataset: {}, style: { setProperty() {} }, className: "",
      get textContent() { return node._text || ""; },
      set textContent(value) { node._text = String(value ?? ""); node._html = ""; },
      get innerHTML() { return node._html || ""; },
      set innerHTML(value) { node._html = String(value ?? ""); node._text = ""; },
      classList: { add() {}, remove() {}, toggle: () => false, contains: () => false },
      setAttribute() {}, getAttribute: () => null, removeAttribute() {},
      addEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
      contains: () => false, appendChild() {}, focus() {},
    };
    elements.set(id, node);
    return node;
  }
  for (const match of dashboardHtml.matchAll(/\bid="([^"]+)"/g)) element(match[1]);
  const document = {
    hidden: false, visibilityState: "visible", readyState: "complete", activeElement: null,
    getElementById: (id) => element(id), querySelector: () => null, querySelectorAll: () => [],
    addEventListener() {}, createElement: (tag) => element(`created-${tag}-${elements.size}`),
    documentElement: element("root"),
  };
  const sandbox = {
    Date, document, AbortController, AbortSignal, URL, Intl, console,
    fetch: async () => ({ ok: false, status: 503, json: async () => ({}) }),
    setInterval: () => 1, clearInterval() {}, setTimeout: () => 1, clearTimeout() {},
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { sendBeacon: () => false }, addEventListener() {},
  };
  sandbox.window = sandbox;
  const context = createContext(sandbox);
  runInContext(script, context, { timeout: 3000, filename: "dashboard" });
  const resources = {
    schema_version: "local-dev-resource-observatory-v1",
    workstation: { state: "AVAILABLE", freshness: "fresh" },
    vps_new: { state: "UNAVAILABLE", freshness: "stale" },
    qwen: { reachable: true, models: [], loaded_models: [] },
    quotas: {
      pools: {
        glm_coding_plan: { state: "UNKNOWN", freshness: "stale", remaining_percent: null, windows: [], auxiliary_windows: [] },
        chatgpt_codex_subscription: { state: "UNKNOWN", freshness: "stale", remaining_percent: null, windows: [], auxiliary_windows: [] },
      },
      cursor: {
        accounting_mapping: "UNVERIFIED", state: "UNKNOWN", freshness: "stale",
        labels: { cursor_models: 0, other_models: 1 },
        plan: "Pro+", plan_provenance: "LIVE",
        plan_reset_date: "2026-09-19", plan_reset_at: null, plan_reset_provenance: "MANUAL",
        labels_provenance: "MANUAL",
        collector_label: "cursor-agent about --format json (plan) + manual runtime observation",
      },
    },
    chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false },
  };
  context.render({ active: false, phase: "IDLE", classification: "IDLE_CLEAN" }, { queue: { eligible_count: 0 }, qwen: {} }, resources);
  const markup = elements.get("resources-cards").innerHTML;
  assert.match(markup, /Piano: Pro+/, "plan rendered");
  assert.match(markup, /LIVE/, "live provenance badge rendered");
  assert.match(markup, /Reset piano: 19 set 2026/, "manual reset preserved");
  assert.match(markup, /MANUAL/, "manual provenance badge rendered");
  assert.match(markup, /Cursor Models[\s\S]{0,220}0%/, "manual labels preserved");
  // Manual-only rendering (no live): plan shows MANUAL badge, no LIVE.
  const manualResources = structuredClone(resources);
  manualResources.quotas.cursor.plan_provenance = "MANUAL";
  context.render({ active: false }, { queue: {} }, manualResources);
  const manualMarkup = elements.get("resources-cards").innerHTML;
  assert.match(manualMarkup, /Piano: Pro+/, "plan still rendered");
  assert.doesNotMatch(manualMarkup, /LIVE/, "no LIVE badge without live observation");
});

// ---- T10 manual evidence files readable ----------------------------------------------

await test("T10 existing Cursor manual evidence remains readable (files unchanged)", async () => {
  const manualPath = resolve(ROOT, "configs/runtime/quota-observatory/cursor-manual-observation.json");
  const manual = JSON.parse(readFileSync(manualPath, "utf8"));
  assert.equal(manual.source, "operator_manual_observation");
  assert.equal(manual.observed_at, "2026-09-10T21:59:22.460Z");
  assert.equal(manual.plan, "Pro+");
  assert.equal(manual.plan_reset_date, "2026-09-19");
  assert.equal(manual.plan_reset_precision, "date");
  assert.equal(manual.plan_reset_at, null);
  const report = readFileSync(resolve(ROOT, "reports/architecture/v4_local_dev_cursor_plan_reset_manual_observation_v1.md"), "utf8");
  assert.match(report, /CURSOR_USAGE_SOURCE=OPERATOR_MANUAL_OBSERVATION/, "manual report intact");
});

// ---- cache semantics (bounded CLI execution) -----------------------------------------

await test("cache: repeated GETs within TTL do not re-execute the CLI (single-flight)", async () => {
  resetCursorCliObservationCache();
  let execCount = 0;
  const countingExec = async () => { execCount++; return { stdout: aboutFixture(), stderr: "" }; };
  const first = await getCursorCliQuotaObservation({ nowMs: NOW, execFn: countingExec, awaitRefresh: true });
  assert.equal(first.ok, true);
  assert.equal(execCount, 1);
  const cached = await getCursorCliQuotaObservation({ nowMs: NOW + 60_000, execFn: countingExec });
  assert.equal(cached.cache_hit, true, "second call within TTL is a cache hit");
  assert.equal(execCount, 1, "CLI executed exactly once");
  // Degraded semantics: failed refresh keeps previous value only as STALE.
  const failing = async () => { execCount++; throw Object.assign(new Error("down"), { code: "EXIT_1" }); };
  const afterTtl = await getCursorCliQuotaObservation({ nowMs: NOW + 400_000, execFn: failing, awaitRefresh: true });
  assert.equal(afterTtl.freshness, "stale", "degraded observation exposed only as STALE");
  assert.equal(afterTtl.stale_reason, "CURSOR_CLI_REFRESH_FAILED_STALE");
  assert.equal(afterTtl.plan, "Pro+", "previous value retained but never FRESH");
});

console.log("#81 focused suite: done");
