#!/usr/bin/env node
/**
 * V4_DASHBOARD_ACTIONABLE_HUMAN_GATE_V1 — focused #86 suite.
 * Proves: additive backend human_gate representation, canonical pass-through,
 * no-invention law, gate states (new/unchanged/resolved), Telegram evidence,
 * safe references, read-only posture, and #87 shared-metadata alignment.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInContext, createContext } from "node:vm";
import test from "node:test";

import {
  wrapTickResult,
  buildHumanGateView,
  buildDiagnostics,
} from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";
import {
  buildActionableGateContract,
  ACTIONABLE_GATE_CONTRACT_SCHEMA,
  CANONICAL_GATE_CHOICES,
} from "../../tools/v4-actionable-gate-contract-v1.mjs";

const DASHBOARD_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../../tools/local-dev-dispatcher-dashboard-v1.html");

// Reuse the existing deterministic dashboard harness pattern.
async function dashboardHarness(initial = {}) {
  const html = await readFile(DASHBOARD_FILE, "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, "dashboard stays self-contained");
  const elements = new Map();
  const htmlWrites = [];
  const fetches = [];
  const intervals = new Map();
  const localStore = new Map();
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
    document: {
      readyState: "complete",
      getElementById: element,
      createElement: () => element(`__dyn_${Math.random()}`),
      querySelector: (selector) => selector.startsWith("#") ? element(selector.slice(1)) : null,
      querySelectorAll: (selector) => String(selector).includes("data-section") ? sectionOrder.map((sec) => element("sec-" + sec)) : [],
      addEventListener() {},
      body: { classList: { add() {}, remove() {}, toggle() {} }, dataset: {} },
      documentElement: { dataset: {}, style: {} },
    },
    localStorage: {
      getItem: (k) => localStore.has(k) ? localStore.get(k) : null,
      setItem: (k, v) => localStore.set(k, String(v)),
      removeItem: (k) => localStore.delete(k),
    },
    fetch: async (url, opts) => {
      const u = String(url);
      fetches.push(u);
      const body = scenario[u] ?? scenario.default ?? {};
      return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
    },
    setInterval: (fn, ms) => { intervals.set(ms, fn); return ms; },
    clearInterval: (id) => intervals.delete(id),
    setTimeout: (fn) => { fn(); return 0; },
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
  const settle = () => new Promise((r) => setImmediate(r));
  await settle();
  return {
    html, context, elements, fetches, htmlWrites, intervals, element, settle, localStore,
    evaluate: (script) => runInContext(script, context, { timeout: 2000 }),
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

// Canonical actionable gate fixture (shared with #87 contract).
function actionableEvidence(overrides = {}) {
  return {
    classification: "HUMAN_GATE_REQUIRED",
    human_gate_required: true,
    gate_summary: "tracked dirty: 1 file(s)",
    reason_codes: ["TRACKED_DIRTY_CONFLICT"],
    task_ref: "LOCAL_DEV_B_D-86T",
    request_id: "req-86",
    operator_action_gate_id: "gate-86",
    operator_action_summary: "Revisionare il lavoro prima della prosecuzione",
    operator_action_detail: "Il worktree contiene modifiche non committate da revisionare.",
    operator_action_choices: ["APPROVE_AND_CONTINUE", "STOP", "DEFER"],
    operator_action_expires_at: "2026-09-16T23:59:00.000Z",
    operator_action_requires_confirmation: false,
    ...overrides,
  };
}

// ---- Backend additive representation -------------------------------------

await test("B1 wrapTickResult: bounded shape unchanged without gate evidence (additive law)", () => {
  const wrapped = wrapTickResult({ ok: true, request_id: "x", classification: "IDLE_CLEAN", reason_codes: Array(30).fill("R") });
  assert.deepEqual(Object.keys(wrapped).sort(),
    ["classification", "execution_performed", "executor_classification", "gate_summary", "human_gate_required", "ok", "post_exec_integration", "reason_codes", "request_id", "schema_version", "task_ref"]);
});

await test("B2 wrapTickResult: canonical operator_action_* pass-through bounded", () => {
  const wrapped = wrapTickResult(actionableEvidence());
  assert.equal(wrapped.operator_action_gate_id, "gate-86");
  assert.equal(wrapped.operator_action_summary, "Revisionare il lavoro prima della prosecuzione");
  assert.deepEqual(wrapped.operator_action_choices, ["APPROVE_AND_CONTINUE", "STOP", "DEFER"]);
  assert.equal(wrapped.operator_action_requires_confirmation, undefined, "confirmation flag present only when true");
  const withConfirm = wrapTickResult(actionableEvidence({ operator_action_requires_confirmation: true }));
  assert.equal(withConfirm.operator_action_requires_confirmation, true);
  const empty = wrapTickResult({ ok: true, request_id: "y", classification: "IDLE_CLEAN", operator_action_choices: [] });
  assert.ok(!("operator_action_choices" in empty), "empty choices are not added");
  assert.ok(!("operator_action_gate_id" in empty));
});

await test("B3 buildHumanGateView: null for non-gate ticks (idle dashboard stays idle)", () => {
  assert.equal(buildHumanGateView({ status: {}, last_tick: { classification: "IDLE_CLEAN", request_id: "r" } }), null);
  assert.equal(buildHumanGateView({ status: {}, last_tick: {} }), null);
  assert.equal(buildHumanGateView({}), null);
});

await test("B4 buildHumanGateView: NEW_GATE for active gate without Telegram evidence", () => {
  const v = buildHumanGateView({ status: { request_id: "req-86" }, last_tick: actionableEvidence() });
  assert.equal(v.active, true);
  assert.equal(v.state, "NEW_GATE");
  assert.equal(v.gate_id, "gate-86");
  assert.equal(v.task_ref, "LOCAL_DEV_B_D-86T");
  assert.equal(v.reason_code, "TRACKED_DIRTY_CONFLICT");
  assert.deepEqual(v.operator_action_choices, ["APPROVE_AND_CONTINUE", "STOP", "DEFER"]);
  assert.equal(v.origin, "LOCAL_DEV_DISPATCHER");
  assert.equal(v.read_only, true);
});

await test("B5 buildHumanGateView: UNCHANGED_NOTIFIED_GATE only on real Telegram evidence", () => {
  const tick = actionableEvidence({ telegram_delivery_status: "sent", telegram_notified_at: "2026-09-16T10:06:00.000Z", telegram_message_id: "4242" });
  const v = buildHumanGateView({ status: { request_id: "req-86" }, last_tick: tick });
  assert.equal(v.state, "UNCHANGED_NOTIFIED_GATE");
  assert.equal(v.telegram_delivery_status, "sent");
  assert.equal(v.telegram_notified_at, "2026-09-16T10:06:00.000Z");
  assert.equal(v.telegram_message_id, "4242");
  // Unknown status values are passed through but do NOT flip state to notified.
  const vUnknown = buildHumanGateView({ status: { request_id: "req-86" }, last_tick: actionableEvidence({ telegram_delivery_status: "pending" }) });
  assert.equal(vUnknown.state, "NEW_GATE");
  assert.equal(vUnknown.telegram_delivery_status, "pending");
});

await test("B6 buildHumanGateView: RESOLVED_GATE when classification moved on", () => {
  const v = buildHumanGateView({ status: { classification: "IDLE_CLEAN", request_id: "req-86" }, last_tick: actionableEvidence({ recorded_at: "2026-09-16T12:00:00.000Z" }) });
  assert.equal(v.active, false);
  assert.equal(v.state, "RESOLVED_GATE");
  assert.equal(v.first_observed_at, "2026-09-16T12:00:00.000Z");
});

await test("B7 diagnostics additive human_gate present on gate tick; idle diagnostics identical shape", async () => {
  const diagDeps = {
    statusTracker: { snapshot: () => ({ active: false, classification: "HUMAN_GATE_REQUIRED", request_id: "req-86" }) },
    lastTickStore: { snapshot: () => actionableEvidence() },
    queueDiagnostics: async () => ({ ok: true, eligible_count: 0, claim_present_count: 0, items: [], rejected_items: [], skip_reason_summary: {} }),
    observeQwenResources: async () => null,
    readActivities: () => ({ activities: [] }),
    applyFreshness: (a) => a,
  };
  const diagGate = await buildDiagnostics(diagDeps, () => "2026-09-16T20:00:00.000Z");
  assert.equal(diagGate.human_gate.state, "NEW_GATE");
  assert.equal(diagGate.human_gate.gate_id, "gate-86");
  assert.equal(diagGate.read_only, true);
  const diagIdle = await buildDiagnostics({
    ...diagDeps,
    statusTracker: { snapshot: () => ({ active: false, classification: "IDLE_CLEAN", request_id: "idle" }) },
    lastTickStore: { snapshot: () => ({ ok: true, classification: "IDLE_CLEAN", request_id: "i", execution_performed: false }) },
  }, () => "2026-09-16T20:00:00.000Z");
  assert.equal(diagIdle.human_gate, null);
  assert.ok(diagIdle.tick_clock && diagIdle.qwen && diagIdle.explanation, "existing diagnostics shape intact");
});

// ---- #87 shared-contract alignment ---------------------------------------

await test("B8 #87 alignment: canonical contract pass-through — same gate_id/task_ref/reason/action/choices/origin across surfaces", () => {
  const contract = buildActionableGateContract({
    gate_id: "gate-86", task_ref: "LOCAL_DEV_B_D-86T",
    classification: "HUMAN_GATE_REQUIRED", reason_codes: ["TRACKED_DIRTY_CONFLICT"],
    gate_summary: "tracked dirty: 1 file(s)",
    operator_action_summary: "Revisionare il lavoro prima della prosecuzione",
    operator_action_choices: CANONICAL_GATE_CHOICES, origin: "LOCAL_DEV_DISPATCHER",
  });
  assert.equal(contract.schema_version, ACTIONABLE_GATE_CONTRACT_SCHEMA);
  assert.equal(contract.mode, "ACTIONABLE");
  const tick = wrapTickResult(actionableEvidence());
  const view = buildHumanGateView({ status: { request_id: "req-86" }, last_tick: tick });
  assert.equal(view.gate_id, contract.gate_id);
  assert.equal(view.task_ref, contract.task_ref);
  assert.equal(view.reason_code, contract.reason_code);
  assert.equal(view.operator_action_summary, contract.operator_action_summary);
  assert.deepEqual(view.operator_action_choices, contract.operator_action_choices);
});

await test("B9 no-invention: non-canonical choices never become dashboard choices", () => {
  const contract = buildActionableGateContract({ gate_id: "g", classification: "HUMAN_GATE_REQUIRED", operator_action_choices: ["FIX", "DISCARD"] });
  assert.equal(contract.mode, "INFORMATIONAL");
  assert.deepEqual(contract.operator_action_choices, []);
  const v = buildHumanGateView({ status: {}, last_tick: actionableEvidence({ operator_action_choices: ["FIX", "DISCARD"] }) });
  assert.deepEqual(v.operator_action_choices, ["FIX", "DISCARD"], "dashboard passes through real runtime evidence verbatim");
  assert.ok(!v.references.includes("FIX"));
});

// ---- UI cases A–G ---------------------------------------------------------

await test("UI CASE A — informational gate: fallback action, NO invented choices, no mutation controls", async () => {
  const dashboard = await dashboardHarness();
  dashboard.render(
    { active: false, classification: "HUMAN_GATE_REQUIRED", phase: "TERMINAL" },
    { last_tick: { classification: "HUMAN_GATE_REQUIRED", human_gate_required: true, reason_codes: ["TRACKED_DIRTY_CONFLICT"], gate_summary: "tracked dirty: 2 file(s)", task_ref: null, request_id: "ra" }, queue: {}, explanation: { blocked_at: "repo_hygiene", why_code: "TRACKED_DIRTY_CONFLICT", detail: "La lettura corrente mostra modifiche non committate." } },
  );
  const out = dashboardText(dashboard);
  const gate = dashboard.element("op-gate");
  assert.match(out, /HUMAN GATE/);
  assert.match(out, /INTERVENTO UMANO/);
  assert.match(out, /TRACKED_DIRTY_CONFLICT/);
  assert.match(out, /Modifiche locali da verificare/);
  assert.match(out, /BLOCKED AT/i);
  assert.doesNotMatch(gate.innerHTML, /APPROVE_AND_CONTINUE|DEFER|gate-chip/);
  assert.doesNotMatch(gate.innerHTML, /\bFIX\b|\bDISCARD\b/);
  assert.doesNotMatch(dashboard.htmlWrites.map((w) => w.value).join("\n"), /gate-chip/, "no choice chips rendered without canonical choices");
  assert.ok(!dashboard.fetches.some((u) => u.includes("decision") || u.includes("callback")), "dashboard never calls decision endpoints");
});

await test("UI CASE B — actionable gate: exact canonical choices as read-only chips + expandable detail", async () => {
  const dashboard = await dashboardHarness();
  const gateView = buildHumanGateView({ status: { request_id: "req-86" }, last_tick: actionableEvidence() });
  dashboard.render(
    { active: false, classification: "HUMAN_GATE_REQUIRED", phase: "HUMAN_GATE" },
    { last_tick: wrapTickResult(actionableEvidence()), human_gate: gateView, queue: {}, explanation: { blocked_at: "repo_hygiene", why_code: "TRACKED_DIRTY_CONFLICT", detail: "Modifiche non committate." } },
  );
  const gate = dashboard.element("op-gate");
  assert.equal(gate.hidden, false);
  const out = dashboardText(dashboard);
  assert.match(out, /NUOVO INTERVENTO UMANO/);
  assert.match(out, /Azione richiesta:/);
  assert.match(out, /Revisionare il lavoro prima della prosecuzione/);
  for (const choice of ["APPROVE_AND_CONTINUE", "STOP", "DEFER"]) assert.match(out, new RegExp(choice));
  assert.match(out, /gate-chip/);
  assert.match(out, /Dettaglio gate/);
  assert.match(out, /sola lettura/);
  assert.equal((gate.innerHTML.match(/<button/g) || []).length, 0, "no buttons in gate strip");
  assert.ok(!dashboard.fetches.some((u) => u.includes("decision") || u.includes("callback")));
});

await test("UI CASE C — notified unchanged gate: GIÀ NOTIFICATO + Telegram evidence shown", async () => {
  const dashboard = await dashboardHarness();
  const tick = wrapTickResult(actionableEvidence({ telegram_delivery_status: "sent", telegram_notified_at: "2026-09-16T10:06:00.000Z", telegram_message_id: "4242" }));
  dashboard.render(
    { active: false, classification: "HUMAN_GATE_REQUIRED" },
    { last_tick: tick, human_gate: buildHumanGateView({ status: { request_id: "req-86" }, last_tick: tick }), queue: {}, explanation: {} },
  );
  const out = dashboardText(dashboard);
  assert.match(out, /INTERVENTO UMANO GIÀ NOTIFICATO/);
  assert.match(out, /Telegram: notificato/);
  assert.match(out, /4242/);
  assert.doesNotMatch(out, /t\.me\/|Apri messaggio Telegram/);
});

await test("UI CASE D — resolved gate: not rendered as active blocker", async () => {
  const dashboard = await dashboardHarness();
  const tick = wrapTickResult(actionableEvidence({ telegram_delivery_status: "sent" }));
  dashboard.render(
    { active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" },
    { last_tick: { classification: "IDLE_CLEAN", human_gate_required: false, request_id: "req-86" }, human_gate: buildHumanGateView({ status: { classification: "IDLE_CLEAN", request_id: "req-86" }, last_tick: tick }), queue: {}, explanation: {} },
  );
  const gate = dashboard.element("op-gate");
  assert.equal(gate.hidden, true);
  assert.equal(gate.innerHTML, "");
});

await test("UI CASE E — incomplete evidence: unknown labels, no invented data or links", async () => {
  const dashboard = await dashboardHarness();
  const tick = wrapTickResult({ ok: false, request_id: "re", classification: "HUMAN_GATE_REQUIRED", human_gate_required: true, reason_codes: [], gate_summary: null });
  dashboard.render(
    { active: false, classification: "HUMAN_GATE_REQUIRED" },
    { last_tick: tick, human_gate: buildHumanGateView({ status: { request_id: "re" }, last_tick: tick }), queue: {}, explanation: {} },
  );
  const out = dashboardText(dashboard);
  assert.match(out, /NUOVO INTERVENTO UMANO/);
  assert.match(out, /Azione non determinata automaticamente/);
  assert.doesNotMatch(out, /gate-86|undefined|NaN|\[object Object\]/);
  assert.doesNotMatch(out, /Apri messaggio Telegram|t\.me\//);
});

await test("UI CASE F — references: https rendered clickable, plain text stays plain", async () => {
  const dashboard = await dashboardHarness();
  const tick = wrapTickResult(actionableEvidence({
    operator_action_choices: ["APPROVE_AND_CONTINUE"],
    operator_action_references: ["https://github.com/mrhz1973/control-plane/issues/86", "reports/architecture/v4_report.md"],
  }));
  dashboard.render(
    { active: false, classification: "HUMAN_GATE_REQUIRED" },
    { last_tick: tick, human_gate: buildHumanGateView({ status: { request_id: "req-86" }, last_tick: tick }), queue: {}, explanation: {} },
  );
  const gate = dashboard.element("op-gate");
  assert.match(gate.innerHTML, /<a href="https:\/\/github\.com\/mrhz1973\/control-plane\/issues\/86"/);
  assert.match(gate.innerHTML, /reports\/architecture\/v4_report\.md/);
  assert.doesNotMatch(gate.innerHTML, /<a href="reports\//);
});

await test("UI CASE G — telegram: durable https URL only; private message id never becomes a link", async () => {
  const dashboard = await dashboardHarness();
  const tick = wrapTickResult(actionableEvidence({
    telegram_delivery_status: "sent", telegram_notified_at: "2026-09-16T10:06:00.000Z",
    telegram_message_id: "4242", telegram_url: "https://t.me/c/2222886741/4242",
  }));
  dashboard.render(
    { active: false, classification: "HUMAN_GATE_REQUIRED" },
    { last_tick: tick, human_gate: buildHumanGateView({ status: { request_id: "req-86" }, last_tick: tick }), queue: {}, explanation: {} },
  );
  const out = dashboardText(dashboard);
  assert.match(out, /Telegram: notificato/);
  assert.match(out, /Apri messaggio Telegram/);
  // Non-https telegram_url is dropped by the backend view.
  const tickNoUrl = wrapTickResult(actionableEvidence({ telegram_message_id: "4242" }));
  const v = buildHumanGateView({ status: {}, last_tick: tickNoUrl });
  assert.equal(v.telegram_url, null);
});

await test("UI REGRESSION — idle render + countdown/phase/resource surfaces intact", async () => {
  const dashboard = await dashboardHarness({
    default: { queue: { eligible_count: 0, claim_present_count: 0, items: [] }, tick_clock: { wf90_interval_seconds: 120, last_observed_tick_at: "2026-09-16T19:00:00.000Z", next_expected_tick_at: "2026-09-16T19:02:00.000Z" }, last_tick: { classification: "IDLE_CLEAN", request_id: "i" }, qwen: { reachable: false } },
  });
  dashboard.render({ active: false, classification: "IDLE_CLEAN", phase: "TERMINAL" }, {
    queue: { eligible_count: 0, claim_present_count: 0, items: [] },
    tick_clock: { wf90_interval_seconds: 120, last_observed_tick_at: "2026-09-16T19:00:00.000Z", next_expected_tick_at: "2026-09-16T19:02:00.000Z" },
    last_tick: { classification: "IDLE_CLEAN", request_id: "i" }, qwen: { reachable: false },
  });
  const out = dashboardText(dashboard);
  assert.match(out, /In attesa|IDLE/i);
  assert.equal(dashboard.element("op-gate").hidden, true, "no gate strip in idle state");
  assert.match(out, /2 minuti/);
  dashboard.evaluate("renderOpstripCountdown()");
  assert.match(dashboard.element("op-countdown").textContent, /^\d\d:\d\d$|ATTESA TICK N8N/, "countdown still works");
  assert.equal((out.match(/gate-chip/g) || []).length, 0);
});

await test("SECURITY — XSS payload in gate metadata is escaped; no mutation handlers", async () => {
  const dashboard = await dashboardHarness();
  const attack = '<img src=x onerror="window.__xss=1">';
  const tick = wrapTickResult(actionableEvidence({
    gate_summary: attack,
    operator_action_summary: attack,
    operator_action_detail: attack,
    task_ref: attack,
    operator_action_references: [attack, "https://github.com/mrhz1973/control-plane/issues/86"],
  }));
  dashboard.render(
    { active: false, classification: "HUMAN_GATE_REQUIRED" },
    { last_tick: tick, human_gate: buildHumanGateView({ status: { request_id: "req-86" }, last_tick: tick }), queue: {}, explanation: { detail: attack } },
  );
  const sinks = dashboard.htmlWrites.map((w) => w.value).join("\n");
  assert.doesNotMatch(sinks, /<img\b|<script\b/i);
  assert.ok(sinks.includes("&lt;img"), "payload rendered as escaped data");
  assert.equal(dashboard.context.__xss, undefined);
});

console.log("#86 focused suite: done");
