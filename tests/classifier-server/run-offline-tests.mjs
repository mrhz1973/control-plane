#!/usr/bin/env node
/**
 * Offline tests for classifier-server-v1 (Step Wa).
 * Node built-ins only. No external dependencies. No network calls.
 * Does NOT listen on a TCP port — uses pure classifyRequest / routeRequest imports.
 * Does not call the model: mock mode for T1, deterministic guard for T2.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyRequest,
  routeRequest,
  resolveBindAddr,
  DEFAULT_BIND_ADDR,
  FORBIDDEN_BIND_ADDR,
} from "../../tools/classifier-server-v1.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wrapperCasesPath = resolve(__dirname, "../classifier-wrapper/cases.json");
const wrapperCases = JSON.parse(readFileSync(wrapperCasesPath, "utf8")).cases;

function caseInput(id) {
  const c = wrapperCases.find((x) => x.id === id);
  if (!c) throw new Error(`wrapper case ${id} not found`);
  return JSON.parse(JSON.stringify(c.input));
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const tests = [];

// T1: docs-only low event, mock model low/auto_allowed/high.
tests.push(async function T1() {
  const input = caseInput("A");
  const { status, payload } = await classifyRequest(input, {
    mock: true,
    mockResponse: {
      risk: "low",
      route: "auto_allowed",
      reason: "docs-only under allowed paths; no runtime or workflow flags",
      confidence: "high",
      requires_human: false,
    },
  });
  assert(status === 200, `T1 status expected 200, got ${status}`);
  assert(payload.risk === "low", `T1 risk expected low, got ${payload.risk}`);
  assert(payload.route === "auto_allowed", `T1 route expected auto_allowed, got ${payload.route}`);
  assert(payload.requires_human === false, `T1 requires_human expected false, got ${payload.requires_human}`);
});

// T2: secrets_flags.touched=true → deterministic guard fires before model (no mock).
tests.push(async function T2() {
  const input = {
    event_id: "evt-server-t2",
    event_type: "config_change",
    summary: "Routine change with no secret words in prose",
    touched_paths: ["docs/runtime/CURRENT_FRONTIER.md"],
    runtime_flags: { touched: false, detail: "" },
    secrets_flags: { touched: true, detail: "credential file referenced" },
    deploy_flags: { touched: false, detail: "" },
    n8n_flags: { touched: false, workflow_40: false, workflow_41: false },
    automation_flags: { touched: false, autonomous_worker: false, commit_push_loop: false },
  };
  const { status, payload } = await classifyRequest(input, {});
  assert(status === 200, `T2 status expected 200, got ${status}`);
  assert(payload.risk === "high", `T2 risk expected high, got ${payload.risk}`);
  assert(payload.route === "human_gate", `T2 route expected human_gate, got ${payload.route}`);
  assert(payload.requires_human === true, `T2 requires_human expected true, got ${payload.requires_human}`);
  assert(
    String(payload.reason).includes("guard:secrets_touched"),
    `T2 reason expected to include guard:secrets_touched, got ${payload.reason}`,
  );
});

// T3: invalid body (missing required fields) → 400 with error.
tests.push(async function T3() {
  const { status, payload } = await classifyRequest({ event_id: "evt-server-t3" }, {});
  assert(status === 400, `T3 status expected 400, got ${status}`);
  assert(typeof payload.error === "string" && payload.error.length > 0, `T3 payload expected error string`);
});

// T4: GET /healthz via route helper → 200 {"status":"ok"}, no model call.
tests.push(async function T4() {
  const { status, payload } = await routeRequest("GET", "/healthz", undefined, {}, {});
  assert(status === 200, `T4 status expected 200, got ${status}`);
  assert(payload.status === "ok", `T4 payload expected {status:"ok"}, got ${JSON.stringify(payload)}`);
});

// T5: default bind address must be 127.0.0.1 and never 0.0.0.0.
tests.push(async function T5() {
  assert(DEFAULT_BIND_ADDR === "127.0.0.1", `T5 DEFAULT_BIND_ADDR expected 127.0.0.1, got ${DEFAULT_BIND_ADDR}`);
  assert(DEFAULT_BIND_ADDR !== FORBIDDEN_BIND_ADDR, `T5 default must not be 0.0.0.0`);
  const resolved = resolveBindAddr({});
  assert(resolved === "127.0.0.1", `T5 resolveBindAddr({}) expected 127.0.0.1, got ${resolved}`);
  assert(resolved !== "0.0.0.0", `T5 resolved bind must not be 0.0.0.0`);
});

async function main() {
  let passed = 0;
  for (const t of tests) {
    try {
      await t();
      console.log(`PASS ${t.name}`);
      passed += 1;
    } catch (err) {
      console.error(`FAIL ${t.name}: ${err.message}`);
      process.exitCode = 1;
      console.error(`server offline tests failed (${passed}/${tests.length})`);
      return;
    }
  }
  console.log(`server offline tests passed (${passed}/${tests.length})`);
}

main().catch((err) => {
  console.error(`server offline test runner error: ${err.message}`);
  process.exit(1);
});
