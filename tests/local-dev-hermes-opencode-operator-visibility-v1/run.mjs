#!/usr/bin/env node
/** Focused offline contract tests for the operator visibility surface. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDiagnostics, buildOperatorVisibility } from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";

const active = buildOperatorVisibility({
  status: {
    active: true, terminal: false, task_ref: "LOCAL_DEV_B_VIS-1", phase: "OPENCODE",
    elapsed_ms: 3210, qwen_profile: "qwen38-opus-q3-opencode-24k", last_event: "opencode_start",
  },
  last_tick: {}, nowIso: "2026-09-10T00:00:03.210Z",
});
assert.equal(active.read_only, true);
assert.equal(active.chain_of_thought_display, false);
assert.equal(active.raw_browser_cdp_exposed, false);
assert.deepEqual(active.hermes.role, "ORCHESTRATOR / BRIDGE");
assert.equal(active.hermes.current_task_ref, "LOCAL_DEV_B_VIS-1");
assert.equal(active.hermes.current_controller, null);
assert.equal(active.hermes.effective_model, null);
assert.equal(active.hermes.controller_visibility, "NOT_OBSERVED");
assert.equal(active.hermes.effective_model_visibility, "NOT_OBSERVED");
assert.equal(active.opencode.role, "HARNESS / LOCAL EXECUTOR");
assert.equal(active.opencode.state, "ACTIVE");
assert.equal(active.opencode.current_task_ref, "LOCAL_DEV_B_VIS-1");
assert.equal(active.opencode.configured_profile, "qwen38-opus-q3-opencode-24k");
assert.equal(active.opencode.effective_model, null);
assert.equal(active.opencode.executor, "OpenCode");
assert.equal(active.hermes.activity.length <= 10, true);
assert.deepEqual(active.hermes.activity, []);

const allowedActivity = buildOperatorVisibility({
  status: { active: true, phase: "WAITING", last_event: "WAITING" }, nowIso: "2026-09-10T00:00:04.000Z",
});
assert.deepEqual(allowedActivity.hermes.activity.map((event) => event.name), ["WAITING"]);
assert.equal(allowedActivity.opencode.state, "NOT_OBSERVED");

const loadedOnly = buildOperatorVisibility({
  status: { active: false, terminal: true, phase: "TERMINAL", qwen_profile: "loaded-only", last_event: "terminal:PASS" },
});
assert.equal(loadedOnly.opencode.state, "NOT_OBSERVED");
assert.equal(loadedOnly.opencode.configured_profile, null);
assert.deepEqual(loadedOnly.hermes.activity, []);

const diagnostics = await buildDiagnostics({
  nowIso: () => "2026-09-10T00:00:05.000Z",
  statusTracker: { snapshot: () => ({ active: true, terminal: false, task_ref: "LOCAL_DEV_B_VIS-2", phase: "OPENCODE", elapsed_ms: 1, qwen_profile: "qwen38-opus-q3-opencode-24k", last_event: "qwen_ready" }) },
  lastTickStore: { snapshot: () => ({}) }, scanQueue: () => [], loadReceipts: () => [],
  probeQwen: async () => ({ reachable: true, models: [{ id: "loaded-only", status: "loaded" }] }),
});
assert.equal(diagnostics.read_only, true);
assert.equal(diagnostics.operator_visibility.read_only, true);
assert.equal(diagnostics.operator_visibility.opencode.state, "ACTIVE");
assert.equal(diagnostics.operator_visibility.hermes.activity.length <= 10, true);
const serialized = JSON.stringify(diagnostics);
assert.equal(serialized.includes("chain_of_thought_display\":true"), false);
assert.equal(serialized.includes("raw_prompt"), false);

const here = dirname(fileURLToPath(import.meta.url));
const dashboard = readFileSync(resolve(here, "../../tools/local-dev-dispatcher-dashboard-v1.html"), "utf8");
assert.match(dashboard, /Chi sta facendo cosa/);
assert.match(dashboard, /operator-visibility-panel/);
assert.match(dashboard, /HERMES/);
assert.match(dashboard, /OPENCODE/);
assert.match(dashboard, /QWEN = MODELLO/);
assert.match(dashboard, /RAW_BROWSER_CDP_EXPOSED/);
assert.match(dashboard, /renderOperatorVisibility/);
assert.equal(dashboard.includes("browser_console"), false);
assert.equal(dashboard.includes("innerHTML = raw"), false);

console.log("FOCUSED_TESTS=PASS");
