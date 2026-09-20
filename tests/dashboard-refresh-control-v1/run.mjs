#!/usr/bin/env node
/**
 * V4_DASHBOARD_CONFIGURABLE_REFRESH_NO_FLICKER_V1 — focused #85 suite.
 *
 * Proves: configurable refresh interval (3/5/10/30 s), auto ON/OFF,
 * localStorage preference persistence with safe fallback, manual refresh,
 * no full-page reload path, single-flight polling, per-source last-known-good
 * snapshots, independent source freshness, #86 read-only gate intact,
 * WF90 120 s countdown semantics unchanged, Qwen observability never starts Qwen.
 *
 * Uses the same deterministic vm harness conventions as the #86 focused suite
 * (AbortSignal/AbortController injected like the dispatcher-service harness).
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInContext, createContext } from "node:vm";
import test from "node:test";

const DASHBOARD_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../../tools/local-dev-dispatcher-dashboard-v1.html");
const REFRESH_PREF_KEY = "control-plane.dashboard.refresh.v1";
const READ_ONLY_ENDPOINTS = ["/v1/status", "/v1/diagnostics", "/v1/resources", "/v1/history", "/v1/live-activity"];
const REFRESH_SOURCE_COUNT = 5;

// Deterministic dashboard harness (same pattern as #86/#service suites).
// initial.prefillStore seeds localStorage BEFORE script evaluation (page reload).
async function dashboardHarness(initial = {}) {
  const html = await readFile(DASHBOARD_FILE, "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, "dashboard stays self-contained");

  const elements = new Map();
  const htmlWrites = [];
  const fetchCalls = []; // {url, method}
  const intervals = new Map(); // ms -> [{id, fn}]
  let timerSeq = 0;
  const localStore = new Map(Object.entries(initial.prefillStore ?? {}));
  let scenario = initial;

  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const listeners = new Map();
    let text = "";
    let markup = "";
    const classes = new Set();
    const node = {
      id, listeners, get textContent() { return text; }, set textContent(value) { text = String(value ?? ""); markup = ""; },
      get innerHTML() { return markup; }, set innerHTML(value) { markup = String(value ?? ""); text = ""; htmlWrites.push({ id, value: markup }); },
      classList: {
        add: (...v) => v.forEach((x) => classes.add(x)), remove: (...v) => v.forEach((x) => classes.delete(x)),
        toggle: (v, force) => { const on = force ?? !classes.has(v); if (on) classes.add(v); else classes.delete(v); return on; },
        contains: (v) => classes.has(v),
      },
      checked: true, disabled: false, hidden: false, open: false, dataset: {}, style: {}, className: "", value: "",
      setAttribute(n, v) { this.dataset[n] = String(v); }, getAttribute(n) { return this.dataset[n] ?? null; },
      removeAttribute(n) { delete this.dataset[n]; },
      addEventListener(name, fn) { listeners.set(name, fn); },
      removeEventListener(name) { listeners.delete(name); },
      dispatch(name) { const fn = listeners.get(name); if (fn) fn({ preventDefault() {}, target: node, key: name }); },
      focus() {}, appendChild() {}, closest() { return null; },
      querySelector: () => null,
      querySelectorAll: () => [],
      contains() { return false; },
    };
    elements.set(id, node);
    return node;
  }
  const sectionOrder = ["resources", "ops", "agentops", "queue"];
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    AbortController,
    AbortSignal,
    URL,
    document: {
      readyState: "complete",
      hidden: false,
      getElementById: element,
      createElement: () => element(`__dyn_${Math.random()}`),
      querySelector: (selector) => selector.startsWith("#") ? element(selector.slice(1)) : null,
      querySelectorAll: (selector) => String(selector).includes("data-section") ? sectionOrder.map((sec) => element("sec-" + sec)) : [],
      addEventListener() {},
      body: { classList: { add() {}, remove() {}, toggle() {} }, dataset: {} },
      documentElement: { dataset: {}, style: {} },
    },
    localStorage: {
      getItem: (k) => localStore.has(String(k)) ? localStore.get(String(k)) : null,
      setItem: (k, v) => localStore.set(String(k), String(v)),
      removeItem: (k) => localStore.delete(String(k)),
    },
    fetch: async (url, opts = {}) => {
      const u = String(url);
      fetchCalls.push({ url: u, method: String(opts.method || "GET").toUpperCase() });
      if (scenario.networkErrorPaths?.includes(u)) throw new Error("Errore rete simulato");
      if (scenario.httpErrorPaths?.includes(u)) return { ok: false, status: 503, json: async () => ({}) };
      if (scenario.badJsonPaths?.includes(u)) return { ok: true, status: 200, json: async () => { throw new SyntaxError("JSON non valido"); } };
      const body = scenario[u] ?? scenario.default ?? {};
      return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
    },
    setInterval: (fn, ms) => { const id = ++timerSeq; const list = intervals.get(ms) ?? []; list.push({ id, fn }); intervals.set(ms, list); return id; },
    clearInterval: (id) => { for (const [ms, list] of intervals) { const idx = list.findIndex((t) => t.id === id); if (idx >= 0) { list.splice(idx, 1); if (!list.length) intervals.delete(ms); } } },
    setTimeout: (fn) => { fn(); return ++timerSeq; },
    clearTimeout: () => {},
    navigator: { clipboard: { writeText: async () => {} } },
    location: { protocol: "http:", hostname: "127.0.0.1", port: "8811", pathname: "/dashboard", href: "http://127.0.0.1:8811/dashboard" },
    WebSocket: class { constructor() { throw new Error("Unexpected WebSocket"); } },
    EventSource: class { constructor() { throw new Error("Unexpected EventSource"); } },
    addEventListener: (name, listener) => element("__window").addEventListener(name, listener),
  };
  sandbox.window = sandbox;
  const context = createContext(sandbox);
  runInContext(scripts[0][1], context, { timeout: 2000, filename: DASHBOARD_FILE });
  const settle = async (rounds = 5) => { for (let i = 0; i < rounds; i++) await new Promise((r) => setImmediate(r)); };
  await settle();
  return {
    html, context, elements, fetchCalls, htmlWrites, intervals, element, settle, localStore,
    get fetches() { return fetchCalls.map((c) => c.url); },
    evaluate: (script) => runInContext(script, context, { timeout: 2000 }),
    setIntervalCallbacks: (ms) => intervals.get(ms) ?? [],
    refreshTimerMs: () => [...intervals.keys()].filter((ms) => ms !== 1000), // 1000 ms = countdown law timer
    fireRefreshTimers: async function () { for (const [ms, list] of [...intervals]) { if (ms === 1000) continue; for (const t of [...list]) t.fn(); } await settle(); },
    setScenario: (next) => { scenario = next; },
    render: (status, diag, resources) => {
      context.__testStatus = status;
      context.__testDiag = diag;
      context.__testResources = resources ?? null;
      return runInContext("render(__testStatus, __testDiag, __testResources)", context, { timeout: 2000 });
    },
  };
}

function dashboardText(dashboard) {
  const latestById = new Map();
  for (const write of dashboard.htmlWrites) latestById.set(write.id, write.value);
  return [...latestById.values(), ...[...dashboard.elements.values()].map((n) => n.innerHTML + n.textContent)].join("\n");
}

const goodStatus = { active: false, phase: "IDLE", classification: "IDLE_CLEAN", request_id: "r1", task_ref: null };
const goodDiag = { queue: { eligible_count: 0, items: [] }, qwen: {} };
const goodResources = () => ({
  schema_version: "v1", workstation: { state: "OK", cpu_percent: 11, ram_percent: 44, observed_at: "2026-09-16T22:00:00.000Z", freshness: "FRESH" },
  qwen: {}, vps_new: {}, quotas: { pools: {} }, chatgpt_web: {},
});
const defaultScenario = () => ({ "/v1/status": goodStatus, "/v1/diagnostics": goodDiag, "/v1/resources": goodResources() });

// ---- T1 default refresh config valid --------------------------------------

await test("T1 default refresh config valid (3 s, auto ON) when no preference stored", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  assert.equal(dashboard.element("refresh-interval").value, "3000");
  assert.equal(dashboard.element("auto-refresh").checked, true);
  assert.equal(dashboard.setIntervalCallbacks(3000).length, 1, "exactly one 3 s auto refresh timer");
  assert.deepEqual(dashboard.refreshTimerMs(), [3000], "no other auto-refresh cadence registered (countdown timer excluded)");
});

// ---- T2 interval options ---------------------------------------------------

await test("T2 interval options include exactly 3/5/10/30 seconds", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  const html = dashboard.html;
  const selectBlock = html.slice(html.indexOf('id="refresh-interval"'));
  const options = [...selectBlock.slice(0, selectBlock.indexOf("</select>")).matchAll(/<option value="(\d+)">/g)].map((m) => Number(m[1]));
  assert.deepEqual(options, [3000, 5000, 10000, 30000]);
});

// ---- T3/T4 preference persistence -------------------------------------------

await test("T3 interval preference persists to localStorage and survives reload", async () => {
  const first = await dashboardHarness(defaultScenario());
  first.element("refresh-interval").value = "10000";
  first.element("refresh-interval").dispatch("change");
  await first.settle();
  const stored = JSON.parse(first.localStore.get(REFRESH_PREF_KEY));
  assert.equal(stored.interval_ms, 10000);
  // Simulated browser reload: a fresh dashboard reading the same stored prefs.
  const reloaded = await dashboardHarness({ ...defaultScenario(), prefillStore: { [REFRESH_PREF_KEY]: first.localStore.get(REFRESH_PREF_KEY) } });
  assert.equal(reloaded.element("refresh-interval").value, "10000", "restored interval after reload");
  assert.equal(reloaded.setIntervalCallbacks(10000).length, 1, "polling resumes at restored interval");
  assert.equal(reloaded.setIntervalCallbacks(3000).length, 0, "no leftover default 3 s timer");
});

await test("T4 auto-refresh preference persists (OFF survives reload, zero timers)", async () => {
  const first = await dashboardHarness(defaultScenario());
  first.element("auto-refresh").checked = false;
  first.element("auto-refresh").dispatch("change");
  await first.settle();
  const stored = JSON.parse(first.localStore.get(REFRESH_PREF_KEY));
  assert.equal(stored.auto_refresh_enabled, false);
  const reloaded = await dashboardHarness({ ...defaultScenario(), prefillStore: { [REFRESH_PREF_KEY]: first.localStore.get(REFRESH_PREF_KEY) } });
  assert.equal(reloaded.element("auto-refresh").checked, false, "auto OFF restored after reload");
  assert.deepEqual(reloaded.refreshTimerMs(), [], "no auto polling timer scheduled when restored OFF");
});

// ---- T5 invalid stored preference falls back safely --------------------------

await test("T5 invalid localStorage value falls back safely to defaults", async () => {
  const corruptValues = ["{corrupted json", JSON.stringify({ interval_ms: 9999, auto_refresh_enabled: "yes" }), "null", "42", "{}"];
  for (const bad of corruptValues) {
    const dashboard = await dashboardHarness({ ...defaultScenario(), prefillStore: { [REFRESH_PREF_KEY]: bad } });
    assert.equal(dashboard.element("refresh-interval").value, "3000", `interval falls back to default for ${bad}`);
    assert.equal(dashboard.element("auto-refresh").checked, true, `auto falls back to default for ${bad}`);
    assert.equal(dashboard.setIntervalCallbacks(3000).length, 1, `dashboard initializes polling with default for ${bad}`);
    const state = JSON.parse(dashboard.evaluate("JSON.stringify({interval_ms: refreshState.interval_ms, auto: refreshState.auto})"));
    assert.deepEqual(state, { interval_ms: 3000, auto: true }, `refreshState defaults for ${bad}`);
  }
});

// ---- T6 auto OFF schedules zero future polling --------------------------------

await test("T6 auto OFF cancels the timer and schedules zero future polls", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  await dashboard.settle();
  const before = dashboard.fetches.length;
  assert.ok(before >= 3, "startup refresh fetched sources");
  dashboard.element("auto-refresh").checked = false;
  dashboard.element("auto-refresh").dispatch("change");
  await dashboard.settle();
  assert.deepEqual(dashboard.refreshTimerMs(), [], "no auto-refresh timer remains after OFF");
  dashboard.evaluate("renderOpstripCountdown()"); // countdown law timer still alive
  await dashboard.fireRefreshTimers();
  assert.equal(dashboard.fetches.length, before, "zero automatic polls while OFF (countdown excluded)");
  // Manual refresh still works right after turning OFF (also covers T9 partially).
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  assert.ok(dashboard.fetches.length > before, "manual refresh still fetches after OFF");
});

// ---- T7 changing interval replaces the previous timer --------------------------

await test("T7 changing interval cancels/replaces previous timer (no accumulation)", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  await dashboard.settle();
  assert.equal(dashboard.setIntervalCallbacks(3000).length, 1);
  dashboard.element("refresh-interval").value = "10000";
  dashboard.element("refresh-interval").dispatch("change");
  await dashboard.settle();
  assert.equal(dashboard.setIntervalCallbacks(3000).length, 0, "old 3 s timer cancelled");
  assert.equal(dashboard.setIntervalCallbacks(10000).length, 1, "exactly one new 10 s timer");
  assert.deepEqual(dashboard.refreshTimerMs(), [10000]);
  dashboard.element("refresh-interval").value = "30000";
  dashboard.element("refresh-interval").dispatch("change");
  await dashboard.settle();
  assert.equal(dashboard.setIntervalCallbacks(30000).length, 1);
  assert.deepEqual(dashboard.refreshTimerMs(), [30000], "timers never accumulate");
  // Firing the new timer executes refresh exactly once per tick.
  const before = dashboard.fetches.length;
  await dashboard.fireRefreshTimers();
  assert.equal(dashboard.fetches.length - before, REFRESH_SOURCE_COUNT, "one timer tick = one full refresh (all sources)");
});

// ---- T8 single-flight refresh ---------------------------------------------------

await test("T8 only one refresh cycle may be in flight (overlap coalesced)", async () => {
  let releaseFetch;
  const gate = new Promise((r) => { releaseFetch = r; });
  let gatedCalls = 0;
  const dashboard = await dashboardHarness(defaultScenario());
  await dashboard.settle();
  // Replace fetch with a gated one to hold a refresh in flight.
  dashboard.context.__gatedFetch = async (url) => { gatedCalls++; await gate; return { ok: true, status: 200, json: async () => ({}) }; };
  dashboard.evaluate("window.fetch = __gatedFetch");
  const p1 = dashboard.evaluate("refresh()");
  const p2 = dashboard.evaluate("refresh()");
  const p3 = dashboard.evaluate("refresh()");
  assert.ok(p1 && p2 && p3, "refresh calls returned promises");
  // Give p2/p3 a chance to (wrongly) start fetching.
  await dashboard.settle();
  assert.equal(gatedCalls, REFRESH_SOURCE_COUNT, "only the first in-flight refresh fetches (p2/p3 coalesced)");
  releaseFetch();
  await Promise.allSettled([p1, p2, p3]);
  await dashboard.settle();
  assert.equal(dashboard.evaluate("refreshing"), false, "single-flight guard released after completion");
});

// ---- T9 manual refresh works with auto OFF ---------------------------------------

await test("T9 manual refresh works with auto OFF", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  dashboard.element("auto-refresh").checked = false;
  dashboard.element("auto-refresh").dispatch("change");
  await dashboard.settle();
  const before = dashboard.fetches.length;
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  assert.ok(dashboard.fetches.length >= before + REFRESH_SOURCE_COUNT, "manual Aggiorna fetches all sources with auto OFF");
  assert.ok(dashboard.fetches.includes("/v1/status"));
  assert.match(dashboard.element("poll-age").textContent, /Aggiornato alle|Lettura parziale/, "manual refresh updates the freshness indicator");
  assert.equal(dashboard.evaluate("refreshState.auto"), false, "manual refresh did not re-enable auto");
});

// ---- T10 no full-page reload path -------------------------------------------------

await test("T10 no location.reload/full-page reload path exists", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  await dashboard.settle();
  await dashboard.fireRefreshTimers();
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  dashboard.element("refresh-interval").value = "5000";
  dashboard.element("refresh-interval").dispatch("change");
  dashboard.element("auto-refresh").checked = false;
  dashboard.element("auto-refresh").dispatch("change");
  await dashboard.settle();
  assert.doesNotMatch(dashboard.html, /location\s*\.\s*reload|document\s*\.\s*write\b|history\s*\.\s*(go|back|forward)\s*\(/, "no full-page reload construct in dashboard source");
  assert.equal(dashboard.evaluate("typeof refresh"), "function", "refresh stays an in-place async function");
});

// ---- T11-T15 per-source last-known-good + independent freshness --------------------

await test("T11 failed resources fetch preserves previous resource snapshot", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  await dashboard.settle();
  assert.match(dashboardText(dashboard), /Macchina locale/i, "resource cards rendered from first success");
  dashboard.setScenario({ "/v1/status": goodStatus, "/v1/diagnostics": goodDiag, networkErrorPaths: ["/v1/resources"] });
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /Macchina locale/i, "resource cards still mounted with last-known-good values");
  assert.doesNotMatch(out, /Osservatorio risorse non ancora disponibile/, "resources never blanked");
});

await test("T12 resources failure marks only resources stale", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  await dashboard.settle();
  dashboard.setScenario({ "/v1/status": goodStatus, "/v1/diagnostics": goodDiag, httpErrorPaths: ["/v1/resources"] });
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  const state = JSON.parse(dashboard.evaluate("JSON.stringify({s: refreshState.sourceState.get('status').freshness, d: refreshState.sourceState.get('diagnostics').freshness, r: refreshState.sourceState.get('resources').freshness})"));
  assert.deepEqual(state, { s: "FRESH", d: "FRESH", r: "STALE" });
  const healthDetail = dashboard.element("data-health-detail").innerHTML + dashboard.element("data-health-label").textContent;
  assert.match(healthDetail, /\/v1\/resources|Dati parziali/);
  assert.doesNotMatch(healthDetail, /\/v1\/status/, "healthy status not flagged in health detail as missing");
});

await test("T13 status remains fresh when resources fails", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  await dashboard.settle();
  const marker = { active: false, phase: "IDLE", classification: "IDLE_CLEAN", request_id: "r-after-failure" };
  dashboard.setScenario({ "/v1/status": marker, "/v1/diagnostics": goodDiag, networkErrorPaths: ["/v1/resources"] });
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  const out = dashboardText(dashboard);
  assert.match(out, /r-after-failure/, "status endpoint data continued updating");
  assert.equal(dashboard.evaluate("refreshState.sourceState.get('status').freshness"), "FRESH");
});

await test("T14 subsequent resources success clears stale state", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  await dashboard.settle();
  dashboard.setScenario({ "/v1/status": goodStatus, "/v1/diagnostics": goodDiag, httpErrorPaths: ["/v1/resources"] });
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  assert.equal(dashboard.evaluate("refreshState.sourceState.get('resources').freshness"), "STALE");
  dashboard.setScenario(defaultScenario());
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  assert.equal(dashboard.evaluate("refreshState.sourceState.get('resources').freshness"), "FRESH", "stale not permanently latched");
  assert.equal(dashboard.element("data-alert").hidden, true, "partial-data alert cleared after recovery");
});

await test("T15 no previous valid value -> unavailable state rather than invented data", async () => {
  const dashboard = await dashboardHarness({ "/v1/status": goodStatus, "/v1/diagnostics": goodDiag, networkErrorPaths: ["/v1/resources"] });
  await dashboard.settle();
  const state = dashboard.evaluate("refreshState.sourceState.get('resources').freshness");
  assert.equal(state, "UNAVAILABLE_NO_DATA", "first-ever failure is unavailable, not stale");
  const out = dashboardText(dashboard);
  assert.match(out, /non ancora disponibile/i, "no invented resource values");
  assert.equal(dashboard.evaluate("refreshState.lastGood && refreshState.lastGood.resources || null"), null, "no invented last-known-good snapshot");
});

// ---- T16 #86 human-gate UI remains present/read-only -------------------------------

await test("T16 #86 human-gate UI remains present and read-only during #85 refresh", async () => {
  const gateDiag = {
    queue: {}, qwen: {},
    last_tick: { classification: "HUMAN_GATE_REQUIRED", human_gate_required: true, reason_codes: ["TRACKED_DIRTY_CONFLICT"], gate_summary: "tracked dirty: 1 file(s)", request_id: "rg" },
    human_gate: { active: true, state: "NEW_GATE", gate_id: "g1", operator_action_summary: "Revisionare", operator_action_choices: ["APPROVE_AND_CONTINUE", "STOP", "DEFER"], references: [] },
  };
  const dashboard = await dashboardHarness({
    "/v1/status": { active: false, classification: "HUMAN_GATE_REQUIRED" },
    "/v1/diagnostics": gateDiag,
    "/v1/resources": goodResources(),
  });
  await dashboard.settle();
  const gate = dashboard.element("op-gate");
  assert.equal(gate.hidden, false, "gate strip visible");
  const gateHtml = gate.innerHTML;
  assert.match(gateHtml, /HUMAN GATE/);
  assert.match(gateHtml, /APPROVE_AND_CONTINUE/);
  assert.equal((gateHtml.match(/<button/g) || []).length, 0, "gate stays read-only (no buttons)");
  // Resources failure must not blank the gate strip.
  dashboard.setScenario({
    "/v1/status": { active: false, classification: "HUMAN_GATE_REQUIRED" },
    "/v1/diagnostics": gateDiag,
    networkErrorPaths: ["/v1/resources"],
  });
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  assert.match(dashboardText(dashboard), /HUMAN GATE/, "gate strip survives stale resources");
});

// ---- T17 countdown / WF90 120 s semantics unchanged ---------------------------------

await test("T17 countdown and WF90 120-second semantics unchanged", async () => {
  const nextTick = new Date(Date.now() + 60000).toISOString();
  const dashboard = await dashboardHarness({
    "/v1/status": goodStatus,
    "/v1/diagnostics": { queue: {}, qwen: {}, tick_clock: { wf90_interval_seconds: 120, last_observed_tick_at: "2026-09-16T22:00:00.000Z", next_expected_tick_at: nextTick } },
    "/v1/resources": goodResources(),
  });
  await dashboard.settle();
  dashboard.evaluate("renderOpstripCountdown()");
  assert.match(dashboard.element("op-countdown").textContent, /^\d\d:\d\d$/, "countdown renders mm:ss from real tick anchor");
  assert.match(dashboard.element("op-interval").textContent, /ogni 2 minuti/, "WF90 cadence shown as 2 minutes");
  assert.equal(dashboard.evaluate("opstripClock.intervalSeconds"), 120, "WF90 interval unchanged by refresh controls");
  // Changing the dashboard refresh interval must not touch the WF90 clock.
  dashboard.element("refresh-interval").value = "30000";
  dashboard.element("refresh-interval").dispatch("change");
  await dashboard.settle();
  assert.equal(dashboard.evaluate("opstripClock.intervalSeconds"), 120, "WF90 clock independent from dashboard polling");
  assert.equal(dashboard.setIntervalCallbacks(30000).length, 1);
});

// ---- T18 Qwen observability does not start Qwen ---------------------------------------

await test("T18 Qwen observability does not start Qwen (read-only GETs only)", async () => {
  const dashboard = await dashboardHarness(defaultScenario());
  await dashboard.settle();
  await dashboard.fireRefreshTimers();
  dashboard.element("refresh-button").dispatch("click");
  await dashboard.settle();
  assert.ok(dashboard.fetchCalls.length > 0);
  for (const call of dashboard.fetchCalls) {
    assert.equal(call.method, "GET", `only GET requests issued, got ${call.method} ${call.url}`);
    assert.ok(READ_ONLY_ENDPOINTS.includes(call.url), `only read-only dispatcher endpoints fetched, got ${call.url}`);
  }
});

console.log("#85 focused suite: done");
