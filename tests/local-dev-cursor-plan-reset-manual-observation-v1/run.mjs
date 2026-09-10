#!/usr/bin/env node
/** Focused contract for manual Cursor plan-reset evidence and date-only UI. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { resolve } from "node:path";
import { collectQuotaObservatory, normalizeCursorManualObservation } from "../../tools/local-dev-resource-observatory-v1.mjs";
import { normalizeCodexAppServerQuota } from "../../tools/collect-codex-appserver-quota-v1.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const NOW = Date.parse("2026-09-10T22:00:00.000Z");
const manualPath = resolve(ROOT, "configs/runtime/quota-observatory/cursor-manual-observation.json");
const manual = JSON.parse(readFileSync(manualPath, "utf8"));

assert.equal(manual.source, "operator_manual_observation");
assert.equal(manual.plan, "Pro+");
assert.equal(manual.plan_reset_date, "2026-09-19");
assert.equal(manual.plan_reset_precision, "date");
assert.equal(manual.plan_reset_at, null);
assert.equal(manual.labels.cursor_models, 0); // 100% used -> 0% remaining
assert.equal(manual.labels.other_models, 1); // 99% used -> 1% remaining
assert.equal(manual.source_usage.cursor_models_used_percent, 100);
assert.equal(manual.source_usage.other_models_used_percent, 99);

const composedCursor = await collectQuotaObservatory({
  nowMs: NOW,
  collectOpenClaw: null,
  composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: {} }, reason_codes: [] }),
});
assert.equal(composedCursor.cursor.plan_reset_date, "2026-09-19");
assert.equal(composedCursor.cursor.plan_reset_precision, "date");
assert.equal(composedCursor.cursor.plan_reset_at, null);
assert.equal(composedCursor.cursor.labels.cursor_models, 0);
assert.equal(composedCursor.cursor.labels.other_models, 1);
assert.equal(composedCursor.cursor.source_usage.cursor_models_used_percent, 100);
assert.equal(composedCursor.cursor.source_usage.other_models_used_percent, 99);
assert.equal(composedCursor.cursor.usage_semantics, "labels_are_remaining_percent");
assert.equal(composedCursor.cursor.freshness, "fresh");

const staleCursor = await collectQuotaObservatory({
  nowMs: Date.parse("2026-09-11T12:00:00.000Z"),
  collectOpenClaw: null,
  cursorObservation: {
    ...manual,
    observed_at: "2026-09-10T00:00:00.000Z",
  },
  composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: {} }, reason_codes: [] }),
});
assert.equal(staleCursor.cursor.freshness, "stale");
assert.equal(staleCursor.cursor.plan_reset_date, "2026-09-19");
assert.equal(staleCursor.cursor.plan_reset_at, null);
assert.equal(staleCursor.cursor.labels.cursor_models, 0);
assert.equal(staleCursor.cursor.labels.other_models, 1);

const invalidCursor = normalizeCursorManualObservation({
  observed_at: "2026-09-10T00:00:00.000Z",
  plan_reset_date: "2026-02-30",
  plan_reset_at: "not-a-timestamp",
  source_usage: { cursor_models_used_percent: 100, other_models_used_percent: 99 },
});
assert.equal(invalidCursor.plan_reset_date, null);
assert.equal(invalidCursor.plan_reset_at, null);
assert.equal(invalidCursor.plan_reset_precision, null);
assert.equal(invalidCursor.labels.cursor_models, 0);
assert.equal(invalidCursor.labels.other_models, 1);

const observedAt = "2026-09-10T21:59:00.000Z";
const openclawFixture = {
  emit_contributions: true,
  observed_at: observedAt,
  pools: {
    glm_coding_plan: {
      state: "available", freshness: "fresh", effective_remaining_percent: 40,
      windows: [
        { window_type: "rolling", label: "Tokens (5h)", remaining_percent: 40, reset_at: null },
        { window_type: "weekly", label: "Tokens (Limit)", remaining_percent: 30, reset_at: "2026-09-16T08:00:00.000Z" },
      ],
      auxiliary_windows: [{ kind: "mcp", label: "MCP", remaining_percent: 100, reset_at: "2026-10-01T00:00:00.000Z" }],
      primary: { window_type: "weekly", remaining_percent: 30, reset_at: "2026-09-16T08:00:00.000Z" },
      source_label: "fixture",
    },
    chatgpt_codex_subscription: {
      state: "available", freshness: "fresh", effective_remaining_percent: 61,
      windows: [
        { window_type: "rolling", label: "5h", remaining_percent: 75, reset_at: "2026-09-12T21:16:00.000Z" },
        { window_type: "weekly", label: "Week", remaining_percent: 61, reset_at: "2026-09-16T08:09:00.000Z" },
      ],
      auxiliary_windows: [],
      primary: { window_type: "weekly", remaining_percent: 61, reset_at: "2026-09-16T08:09:00.000Z" },
      source_label: "fixture",
    },
  },
  contributions: [],
};
const canonicalPools = {
  glm_coding_plan: { state: "available", freshness: "fresh", remaining_percent: 30, windows: [] },
  chatgpt_codex_subscription: { state: "available", freshness: "fresh", remaining_percent: 61, windows: [] },
};
const qualified = await collectQuotaObservatory({
  nowMs: NOW,
  collectOpenClaw: async () => openclawFixture,
  composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: structuredClone(canonicalPools) }, reason_codes: [] }),
});
assert.deepEqual(Object.keys(qualified.pools).sort(), ["chatgpt_codex_subscription", "glm_coding_plan"]);
assert.equal(qualified.pools.chatgpt_codex_subscription.windows.length, 2);
assert.equal(qualified.pools.chatgpt_codex_subscription.windows.find((w) => w.window_type === "rolling").reset_at, "2026-09-12T21:16:00.000Z");
assert.equal(qualified.pools.chatgpt_codex_subscription.windows.find((w) => w.window_type === "weekly").reset_at, "2026-09-16T08:09:00.000Z");
assert.equal(qualified.pools.glm_coding_plan.windows.find((w) => w.window_type === "rolling").reset_at, null);
assert.equal(qualified.pools.glm_coding_plan.windows.find((w) => w.window_type === "weekly").reset_at, "2026-09-16T08:00:00.000Z");
assert.equal(qualified.pools.glm_coding_plan.auxiliary_windows[0].kind, "mcp");
assert.equal(qualified.pools.glm_coding_plan.auxiliary_windows[0].reset_at, "2026-10-01T00:00:00.000Z");

const appserver = normalizeCodexAppServerQuota({
  result: { rateLimits: {
    primary: { usedPercent: 25, windowDurationMins: 300, resetsAt: Date.parse("2026-09-12T21:16:00.000Z") },
    secondary: { usedPercent: 39, windowDurationMins: 10_080, resetsAt: Date.parse("2026-09-16T08:09:00.000Z") },
  } },
  observed_at: observedAt,
}, { nowMs: NOW });
assert.equal(appserver.ok, true);
assert.equal(appserver.windows.find((w) => w.window_type === "rolling").reset_at, "2026-09-12T21:16:00.000Z");
assert.equal(appserver.windows.find((w) => w.window_type === "weekly").reset_at, "2026-09-16T08:09:00.000Z");

const dashboardPath = resolve(ROOT, "tools/local-dev-dispatcher-dashboard-v1.html");
const dashboardHtml = readFileSync(dashboardPath, "utf8");
const script = dashboardHtml.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script);

function dashboardHarness() {
  const elements = new Map();
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const classes = new Set();
    const node = {
      id, value: "", checked: true, disabled: false, hidden: false, open: false,
      dataset: {}, style: { setProperty() {} }, className: "",
      get textContent() { return node._text || ""; },
      set textContent(value) { node._text = String(value ?? ""); node._html = ""; },
      get innerHTML() { return node._html || ""; },
      set innerHTML(value) { node._html = String(value ?? ""); node._text = ""; },
      classList: { add: (...values) => values.forEach((value) => classes.add(value)), remove: (...values) => values.forEach((value) => classes.delete(value)), toggle: () => false, contains: (value) => classes.has(value) },
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
  runInContext(script, context, { timeout: 3000, filename: dashboardPath });
  return { context, elements };
}

const fixtureResources = {
  schema_version: "local-dev-resource-observatory-v1",
  workstation: { state: "AVAILABLE", freshness: "fresh" },
  vps_new: { state: "UNAVAILABLE", freshness: "stale" },
  qwen: { reachable: true, models: [], loaded_models: [] },
  quotas: {
    pools: {
      glm_coding_plan: { state: "UNKNOWN", freshness: "stale", remaining_percent: null, windows: [], auxiliary_windows: [] },
      chatgpt_codex_subscription: { state: "UNKNOWN", freshness: "stale", remaining_percent: null, windows: [], auxiliary_windows: [] },
    },
    cursor: { accounting_mapping: "UNVERIFIED", state: "UNKNOWN", freshness: "stale", labels: { cursor_models: 0, other_models: 1 }, plan_reset_date: "2026-09-19", plan_reset_at: null, collector_label: "Cursor manual observation" },
  },
  chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false },
};
const harness = dashboardHarness();
assert.equal(harness.context.cursorPlanResetLabel(fixtureResources.quotas.cursor), "19 set 2026");
assert.equal(harness.context.cursorPlanResetLabel({ plan_reset_date: "2026-02-30", plan_reset_at: null }), "Non osservato");
assert.match(harness.context.quotaResetLabel("2026-09-19T10:30:00.000Z", Date.parse("2026-09-10T10:00:00.000Z")), /19 set · 12:30/);
harness.context.render({ active: false, phase: "IDLE", classification: "IDLE_CLEAN" }, { queue: { eligible_count: 0, claim_present_count: 0 }, qwen: {} }, fixtureResources);
const markup = harness.elements.get("resources-cards").innerHTML;
assert.match(markup, /Cursor Models[\s\S]{0,220}0%/);
assert.match(markup, /Other Models[\s\S]{0,220}1%/);
assert.match(markup, /Reset piano: 19 set 2026/);
assert.doesNotMatch(markup, /00:00/);
assert.doesNotMatch(dashboardHtml, /Effettivo/);
assert.doesNotMatch(JSON.stringify(composedCursor), /token|cookie|session|authorization|password|\$60\/mo/i);

console.log("FOCUSED_TESTS=PASS");
