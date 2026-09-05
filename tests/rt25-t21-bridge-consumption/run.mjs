#!/usr/bin/env node
/** Focused runtime tests — V4_RT25_T21 n8n bridge quota-aware decision consumption. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runN8nExecutionRoutingBridge } from "../../tools/n8n-v4-execution-routing-bridge-v1.mjs";
import { createDefaultExecutionAdapterRegistry } from "../../tools/v4-execution-adapter-registry-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 220) });
}

function cycleResult(overrides = {}) {
  return {
    schema: "n8n-litellm-primary-cycle-result-v1",
    ok: true,
    classification: "PASS",
    task_id: "T-RT25-21",
    packet: { packet_id: "PK-RT25-21", goal: "g" },
    policy: { decision: "PROCEED" },
    cursor_dispatch_allowed: true,
    ...overrides,
  };
}
function routeRequest(overrides = {}) {
  return {
    schema_version: "execution-route-request-v1",
    request_id: "RR-RT25-21",
    technical_requirements: ["filesystem", "code_edit"],
    risk_level: "low",
    ...overrides,
  };
}
function statusSnapshot() {
  const mk = (available, cost_mode = "free", location = "local") => ({
    available,
    quota_remaining: { value: available ? 1000 : null, unit: "requests" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode,
    location,
    source: "test-fixture",
    updated_at: "2026-08-30T00:00:00.000Z",
  });
  return {
    schema_version: "resource-status-v1",
    generated_at: "2026-08-30T00:00:00.000Z",
    resources: {
      cursor: mk(false, "unknown", "cloud"),
      grok_bot: mk(false, "unknown", "cloud"),
      opencode: mk(true, "free", "local"),
      qwen_local: mk(true, "free", "local"),
      glm: mk(false, "unknown", "cloud"),
      codex: mk(false, "unknown", "cloud"),
      composer: mk(false, "unknown", "cloud"),
    },
  };
}
const DEF = { adapterRegistry: createDefaultExecutionAdapterRegistry() };

// 1. baseline bridge unchanged without quota_decision (existing law preserved)
{
  const r = await runN8nExecutionRoutingBridge(
    { cycle_result: cycleResult(), route_request: routeRequest(), status: statusSnapshot() },
    DEF,
  );
  check(
    "baseline-unchanged",
    r.ok === true && r.classification === "ROUTING_READY_FOR_DISPATCH" && r.quota_decision_consumed === false && r.quota_decision_provenance === null,
    JSON.stringify({ c: r.classification, q: r.quota_decision_consumed }),
  );
}

// 2. valid RT25 decision envelope consumed into provenance
{
  const decision = {
    schema_version: "v4-rt25-planner-quota-aware-decision-v1",
    decision_id: "planner-q-1",
    decision_role: "planner",
    status: "ROUTE_SELECTED",
    selected: { route_id: "qwen-local-route", model: "qwen-local", quota_pool_id: null },
    pool_evaluations: { glm_coding_plan: { evaluation: "POOL_HEALTHY", freshness: "fresh" } },
    reason_codes: ["QUOTA_AWARE_SELECTION"],
  };
  const r = await runN8nExecutionRoutingBridge(
    { cycle_result: cycleResult(), route_request: routeRequest(), status: statusSnapshot(), quota_decision: decision },
    DEF,
  );
  check(
    "valid-decision-consumed",
    r.ok === true && r.quota_decision_consumed === true &&
      r.quota_decision_provenance.selected_route === "qwen-local-route" &&
      r.quota_decision_provenance.selected_quota_pool_id === null &&
      r.reason_codes.includes("QUOTA_DECISION_CONSUMED") &&
      r.quota_decision_provenance.authorization_note.includes("no authorization gate"),
    JSON.stringify({ c: r.classification, q: r.quota_decision_provenance }),
  );
}

// 3. invalid decision envelope → bridge FAILS CLOSED (no silent drop)
{
  const r = await runN8nExecutionRoutingBridge(
    { cycle_result: cycleResult(), route_request: routeRequest(), status: statusSnapshot(), quota_decision: { schema_version: "bogus", status: "ROUTE_SELECTED" } },
    DEF,
  );
  check("invalid-decision-fails-closed", r.ok === false && r.classification === "QUOTA_DECISION_INVALID", JSON.stringify({ c: r.classification }));
}

// 4. non-selected (blocked) RT25 envelope still consumable — metadata only
{
  const decision = {
    schema_version: "v4-rt25-execution-quota-aware-decision-v1",
    decision_id: "exec-q-1",
    decision_role: "execution",
    status: "NO_ROUTE_SELECTED",
    selected: null,
    pool_evaluations: {},
    reason_codes: ["ALL_CANDIDATES_REJECTED"],
  };
  const r = await runN8nExecutionRoutingBridge(
    { cycle_result: cycleResult(), route_request: routeRequest(), status: statusSnapshot(), quota_decision: decision },
    DEF,
  );
  check(
    "blocked-envelope-metadata-only",
    r.ok === true && r.quota_decision_consumed === true && r.quota_decision_provenance.selected_route === null && r.quota_decision_provenance.status === "NO_ROUTE_SELECTED",
    JSON.stringify(r.quota_decision_provenance),
  );
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);
