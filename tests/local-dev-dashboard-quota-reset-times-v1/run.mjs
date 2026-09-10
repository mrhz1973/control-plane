#!/usr/bin/env node
/** Focused UI contract tests for per-window quota resets and Cursor plan reset. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectQuotaObservatory } from "../../tools/local-dev-resource-observatory-v1.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const dashboardPath = resolve(root, "tools/local-dev-dispatcher-dashboard-v1.html");
const dashboardHtml = readFileSync(dashboardPath, "utf8");
const script = dashboardHtml.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script, "dashboard must contain one inline script");

const FIXED_NOW = Date.parse("2026-09-10T10:00:00.000Z");
const RealDate = Date;
class FixedDate extends RealDate {
  constructor(...args) { super(...(args.length ? args : [FIXED_NOW])); }
  static now() { return FIXED_NOW; }
}

async function dashboardHarness(resources) {
  const elements = new Map();
  const writes = [];
  const listeners = new Map();
  const localStore = new Map();
  let timerId = 0;
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const attrs = new Map();
    const classes = new Set();
    const node = {
      id, value: "", checked: true, disabled: false, hidden: false, open: false,
      dataset: {}, style: { setProperty() {} }, className: "",
      get textContent() { return node._text || ""; },
      set textContent(value) { node._text = String(value ?? ""); node._html = ""; },
      get innerHTML() { return node._html || ""; },
      set innerHTML(value) { node._html = String(value ?? ""); node._text = ""; writes.push({ id, value: node._html }); },
      classList: {
        add: (...values) => values.forEach((value) => classes.add(value)),
        remove: (...values) => values.forEach((value) => classes.delete(value)),
        toggle: (value, force) => { const on = force ?? !classes.has(value); if (on) classes.add(value); else classes.delete(value); return on; },
        contains: (value) => classes.has(value),
      },
      setAttribute: (name, value) => attrs.set(name, String(value)),
      getAttribute: (name) => attrs.get(name) ?? null,
      removeAttribute: (name) => attrs.delete(name),
      addEventListener: (name, listener) => { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(listener); },
      querySelectorAll: () => [],
      querySelector: () => null,
      contains: () => false,
      appendChild: () => {},
      focus: () => {},
    };
    elements.set(id, node);
    return node;
  }
  for (const match of dashboardHtml.matchAll(/\bid="([^"]+)"/g)) element(match[1]);
  const document = {
    hidden: false, visibilityState: "visible", readyState: "complete", activeElement: null,
    getElementById: (id) => element(id),
    querySelector: (selector) => selector.startsWith("#") ? element(selector.slice(1)) : null,
    querySelectorAll: () => [],
    addEventListener: (name, listener) => element("__document").addEventListener(name, listener),
    createElement: (tag) => element(`__created_${tag}_${elements.size}`),
    documentElement: element("__root"),
  };
  const sandbox = {
    Date: FixedDate,
    document,
    AbortController,
    AbortSignal,
    URL,
    Intl,
    console,
    fetch: async (url) => ({
      ok: true,
      status: 200,
      json: async () => String(url) === "/v1/resources" ? resources : (String(url) === "/v1/status" ? { active: false, phase: "IDLE" } : { queue: { eligible_count: 0 }, qwen: {} }),
    }),
    setInterval: () => ++timerId,
    clearInterval: () => {},
    setTimeout: () => ++timerId,
    clearTimeout: () => {},
    localStorage: {
      getItem: (key) => localStore.get(String(key)) ?? null,
      setItem: (key, value) => localStore.set(String(key), String(value)),
      removeItem: (key) => localStore.delete(String(key)),
    },
    navigator: { sendBeacon: () => false },
    addEventListener: () => {},
    __testResources: resources,
  };
  sandbox.window = sandbox;
  const context = createContext(sandbox);
  runInContext(script, context, { timeout: 3000, filename: dashboardPath });
  await new Promise((resolvePromise) => setImmediate(resolvePromise));
  runInContext("render({active:false,phase:'IDLE'},{queue:{eligible_count:0},qwen:{}},__testResources)", context, { timeout: 3000 });
  return { context, elements, writes };
}

function resourcesFixture({ codexWindows, glmWindows, cursorPlanReset = null, cursorLabels = { cursor_models: 42, other_models: 17 } }) {
  const pool = (id, state, windows) => ({
    quota_pool_id: id, state, freshness: "fresh", remaining_percent: Math.min(...windows.map((window) => window.remaining_percent)),
    windows, auxiliary_windows: [], unmapped_windows: [], collector_label: "fixture",
  });
  return {
    schema_version: "local-dev-resource-observatory-v1",
    workstation: { state: "AVAILABLE", freshness: "fresh" },
    vps_new: { state: "UNAVAILABLE", freshness: "stale" },
    qwen: { reachable: true, occupancy: "IDLE", models: [], loaded_models: [] },
    quotas: {
      pools: {
        glm_coding_plan: pool("glm_coding_plan", "AVAILABLE", glmWindows),
        chatgpt_codex_subscription: pool("chatgpt_codex_subscription", "AVAILABLE", codexWindows),
      },
      cursor: {
        accounting_mapping: "UNVERIFIED", state: "UNKNOWN", freshness: "fresh",
        labels: cursorLabels, plan_reset_at: cursorPlanReset, observed_at: "2026-09-10T09:00:00.000Z",
      },
    },
    chatgpt_web: { state: "UNKNOWN", unlimited: false, free: false },
  };
}

function resourcesMarkup(harness) {
  return [...harness.writes].filter((write) => write.id === "resources-cards").at(-1)?.value || "";
}

const codexA = "2026-09-12T21:16:00.000Z";
const codexB = "2026-09-16T08:09:00.000Z";
const codexInput = resourcesFixture({
  codexWindows: [
    { window_type: "rolling", remaining_percent: 75, reset_at: codexA },
    { window_type: "weekly", remaining_percent: 61, reset_at: codexB },
  ],
  glmWindows: [
    { window_type: "rolling", remaining_percent: 50, reset_at: null },
    { window_type: "weekly", remaining_percent: 40, reset_at: "2026-09-14T06:00:00.000Z" },
  ],
});
const codexBefore = JSON.parse(JSON.stringify(codexInput.quotas.pools.chatgpt_codex_subscription));
const codexHarness = await dashboardHarness(codexInput);
const codexOut = resourcesMarkup(codexHarness);
assert.match(codexOut, /data-resource="codex"/);
assert.match(codexOut, /5h[\s\S]{0,280}75%[\s\S]{0,180}Reset: 12 set · 23:16/);
assert.match(codexOut, /Settim\.[\s\S]{0,280}61%[\s\S]{0,180}Reset: 16 set · 10:09/);
assert.doesNotMatch(codexOut, /Effettivo/);
assert.deepEqual(codexInput.quotas.pools.chatgpt_codex_subscription, codexBefore);

const glmHarness = await dashboardHarness(resourcesFixture({
  codexWindows: [{ window_type: "rolling", remaining_percent: 75, reset_at: codexA }, { window_type: "weekly", remaining_percent: 61, reset_at: codexB }],
  glmWindows: [{ window_type: "rolling", remaining_percent: 50, reset_at: null }, { window_type: "weekly", remaining_percent: 40, reset_at: "2026-09-14T06:00:00.000Z" }],
}));
const glmOut = resourcesMarkup(glmHarness);
assert.match(glmOut, /5h[\s\S]{0,280}50%[\s\S]{0,180}Reset: Non osservato/);
assert.match(glmOut, /Settim\.[\s\S]{0,280}40%[\s\S]{0,180}Reset: 14 set · 08:00/);
const glmRollingObserved = await dashboardHarness(resourcesFixture({
  codexWindows: [{ window_type: "rolling", remaining_percent: 75, reset_at: codexA }, { window_type: "weekly", remaining_percent: 61, reset_at: codexB }],
  glmWindows: [{ window_type: "rolling", remaining_percent: 50, reset_at: "2026-09-13T06:00:00.000Z" }, { window_type: "weekly", remaining_percent: 40, reset_at: "2026-09-14T06:00:00.000Z" }],
}));
assert.match(resourcesMarkup(glmRollingObserved), /5h[\s\S]{0,280}Reset: 13 set · 08:00/);
assert.doesNotMatch(glmOut, /Effettivo/);

const cursorDate = "2026-09-18T22:00:00.000Z";
const cursorWithPlan = await dashboardHarness(resourcesFixture({
  codexWindows: [{ window_type: "rolling", remaining_percent: 75, reset_at: codexA }, { window_type: "weekly", remaining_percent: 61, reset_at: codexB }],
  glmWindows: [{ window_type: "rolling", remaining_percent: 50, reset_at: null }, { window_type: "weekly", remaining_percent: 40, reset_at: codexB }],
  cursorPlanReset: cursorDate,
}));
const cursorOut = resourcesMarkup(cursorWithPlan);
assert.match(cursorOut, /Cursor Models[\s\S]{0,160}42%/);
assert.match(cursorOut, /Other Models[\s\S]{0,160}17%/);
assert.match(cursorOut, /Reset piano: 19 set · 00:00/);
const cursorWithoutPlan = await dashboardHarness(resourcesFixture({
  codexWindows: [{ window_type: "rolling", remaining_percent: 75, reset_at: codexA }, { window_type: "weekly", remaining_percent: 61, reset_at: codexB }],
  glmWindows: [{ window_type: "rolling", remaining_percent: 50, reset_at: null }, { window_type: "weekly", remaining_percent: 40, reset_at: codexB }],
}));
assert.match(resourcesMarkup(cursorWithoutPlan), /Reset piano: Non osservato/);

assert.equal(await codexHarness.context.quotaResetLabel(codexA, FIXED_NOW), "12 set · 23:16");
assert.equal(await codexHarness.context.quotaResetLabel("2026-01-15T22:16:00.000Z", Date.parse("2026-01-15T12:00:00.000Z")), "oggi · 23:16");
assert.equal(await codexHarness.context.quotaResetLabel("2026-07-15T21:16:00.000Z", Date.parse("2026-07-15T10:00:00.000Z")), "oggi · 23:16");
assert.equal(await codexHarness.context.quotaResetLabel(null, FIXED_NOW), "Non osservato");
assert.equal(await codexHarness.context.quotaResetLabel("not-a-date", FIXED_NOW), "Non osservato");

const observedQuota = await collectQuotaObservatory({
  nowMs: FIXED_NOW,
  collectOpenClaw: null,
  cursorObservation: { state: "UNKNOWN", observed_at: "2026-09-10T09:00:00.000Z", labels: { cursor_models: 42, other_models: 17 }, plan_reset_at: cursorDate },
  composeCanonicalQuotaState: async () => ({ ok: true, joined: { pools: {} }, reason_codes: [] }),
});
assert.equal(observedQuota.cursor.accounting_mapping, "UNVERIFIED");
assert.equal(observedQuota.cursor.plan_reset_at, cursorDate);
assert.equal(observedQuota.cursor.labels.cursor_models, 42);
assert.equal(observedQuota.cursor.labels.other_models, 17);

const renderedOrder = [...codexOut.matchAll(/data-resource="(workstation|vps|qwen|glm|codex|cursor)"/g)].map((match) => match[1]);
assert.deepEqual(renderedOrder, ["workstation", "vps", "qwen", "glm", "codex", "cursor"]);
assert.match(dashboardHtml, /LOCAL_DEV_DASHBOARD_VISIBLE_LANGUAGE=ITALIAN|lang="it"/);

console.log("FOCUSED_TESTS=PASS");
