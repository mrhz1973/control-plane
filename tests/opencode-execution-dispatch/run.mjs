#!/usr/bin/env node
/**
 * Offline tests for dispatch-opencode-execution-v1.
 * No OpenCode run. No Qwen generation.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  dispatchOpenCodeExecution,
  containsSecretMaterial,
  REQUEST_SCHEMA,
} from "../../tools/dispatch-opencode-execution-v1.mjs";
import { DISPATCH_CLI_CAPABILITIES } from "../../tools/probe-opencode-local-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const VALID_PACKET = JSON.parse(
  readFileSync(resolve(ROOT, "tests/opencode-execution-dispatch/fixtures/valid-packet.json"), "utf8"),
);

function parseSuiteSummary(stdout) {
  const lines = (stdout || "").trim().split(/\r?\n/).filter(Boolean);
  const last = lines[lines.length - 1] || "{}";
  return JSON.parse(last);
}

function routedOpencodeQwen() {
  return {
    schema_version: "execution-route-result-v1",
    request_id: "er-dispatch-test",
    status: "ROUTED",
    execution_route: {
      route_id: "opencode+qwen_local",
      implementer: "opencode",
      model: "qwen_local",
      confidence: "high",
      reason_codes: ["AVAILABLE_COMPATIBLE_ROUTE"],
    },
    arbitration: { required: false, used: false, arbiter: null },
    reason_codes: ["AVAILABLE_COMPATIBLE_ROUTE"],
    arbiter_call_count: 0,
  };
}

function sessionReady() {
  return {
    schema_version: "qwen-local-session-manager-result-v1",
    status: "READY",
    ready: true,
    profile: "qwen38-opus-q3-agent-24k",
    model_id: "qwen38-opus-q3-agent-24k",
    base_url: "http://127.0.0.1:8080",
    launch_performed: false,
    wait_elapsed_ms: 0,
    reason_code: "READY",
    launch_count: 0,
  };
}

function opencodeProbeReady() {
  return {
    schema_version: "opencode-local-probe-v1",
    available: true,
    version: "1.18.25",
    executable: "opencode",
    dispatch_interface_resolved: true,
    reason_code: "PASS",
    capabilities: { ...DISPATCH_CLI_CAPABILITIES },
  };
}

function baseRequest(overrides = {}) {
  return {
    schema_version: REQUEST_SCHEMA,
    dispatch_id: "dispatch-test-001",
    execution_route_result: routedOpencodeQwen(),
    execution_packet: VALID_PACKET,
    repository: ROOT.replace(/\\/g, "/"),
    branch: "main",
    ...overrides,
  };
}

const results = [];
function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

async function run() {
  // A0 selected OPUS24K executor: default FAST_AGENT is now qualified.
  {
    const out = await dispatchOpenCodeExecution(baseRequest(), {
      opencodeProbe: opencodeProbeReady(),
      ensureQwenReady: async () => sessionReady(),
    });
    check(
      "A0-selected-opus-fast-agent-qualified",
      out.classification === "DISPATCH_READY" &&
        out.dispatch_ready === true &&
        out.execution_performed === false &&
        out.dispatch_spec?.model_selector === "qwen_local/qwen38-opus-q3-agent-24k",
      JSON.stringify(out.classification),
    );
  }

  // A (mechanics: injected qualified role gate keeps DISPATCH_READY contract)
  {
    const out = await dispatchOpenCodeExecution(baseRequest(), {
      opencodeProbe: opencodeProbeReady(),
      ensureQwenReady: async () => sessionReady(),
      roleGate: () => ({ qualified: true }),
    });
    check(
      "A-dispatch-ready",
      out.classification === "DISPATCH_READY" &&
        out.dispatch_ready === true &&
        out.execution_performed === false &&
        out.dispatch_spec?.model_selector === "qwen_local/qwen38-opus-q3-agent-24k",
      JSON.stringify(out.classification),
    );
  }

  // B cursor+composer
  {
    const route = routedOpencodeQwen();
    route.execution_route = {
      route_id: "cursor+composer",
      implementer: "cursor",
      model: "composer",
      confidence: "high",
      reason_codes: [],
    };
    const out = await dispatchOpenCodeExecution(
      baseRequest({ execution_route_result: route }),
      { opencodeProbe: opencodeProbeReady(), ensureQwenReady: async () => sessionReady() },
    );
    check(
      "B-cursor-composer-rejected",
      out.classification === "ROUTE_NOT_OPENCODE_QWEN_LOCAL",
      out.classification,
    );
  }

  // C cursor+glm
  {
    const route = routedOpencodeQwen();
    route.execution_route = {
      route_id: "cursor+glm",
      implementer: "cursor",
      model: "glm",
      confidence: "high",
      reason_codes: [],
    };
    const out = await dispatchOpenCodeExecution(
      baseRequest({ execution_route_result: route }),
      { opencodeProbe: opencodeProbeReady(), ensureQwenReady: async () => sessionReady() },
    );
    check(
      "C-cursor-glm-rejected",
      out.classification === "ROUTE_NOT_OPENCODE_QWEN_LOCAL",
      out.classification,
    );
  }

  // D OpenCode unavailable
  {
    const out = await dispatchOpenCodeExecution(baseRequest(), {
      opencodeProbe: {
        available: false,
        dispatch_interface_resolved: false,
        reason_code: "OPENCODE_EXECUTABLE_NOT_FOUND",
      },
      ensureQwenReady: async () => sessionReady(),
    });
    check(
      "D-opencode-unavailable",
      out.classification === "OPENCODE_UNAVAILABLE",
      out.classification,
    );
  }

  // E Qwen unavailable
  {
    const out = await dispatchOpenCodeExecution(baseRequest(), {
      opencodeProbe: opencodeProbeReady(),
      ensureQwenReady: async () => ({
        ...sessionReady(),
        ready: false,
        status: "API_UNREACHABLE",
      }),
    });
    check(
      "E-qwen-unavailable",
      out.classification === "QWEN_LOCAL_UNAVAILABLE",
      out.classification,
    );
  }

  // F invalid packet
  {
    const out = await dispatchOpenCodeExecution(
      baseRequest({ execution_packet: { schema: "wrong" } }),
      {
        opencodeProbe: opencodeProbeReady(),
        ensureQwenReady: async () => sessionReady(),
        validatePacket: async () => ({
          ok: false,
          classification: "MISSING_REQUIRED_FIELD",
          reason: "missing fields",
        }),
      },
    );
    check("F-packet-invalid", out.classification === "PACKET_INVALID", out.classification);
  }

  // G NO_ROUTE
  {
    const noRoute = {
      schema_version: "execution-route-result-v1",
      request_id: "x",
      status: "NO_ROUTE",
      execution_route: null,
      arbitration: { required: false, used: false, arbiter: null },
      reason_codes: ["NO_AVAILABLE_ROUTE"],
      arbiter_call_count: 0,
    };
    const out = await dispatchOpenCodeExecution(
      baseRequest({ execution_route_result: noRoute }),
      { opencodeProbe: opencodeProbeReady(), ensureQwenReady: async () => sessionReady() },
    );
    check(
      "G-no-route-fail-closed",
      out.classification === "INVALID_INPUT" &&
        out.reason_codes.includes("NO_ROUTE"),
      JSON.stringify(out),
    );
  }

  // H no secrets in spec (qualified role gate injected to reach spec build)
  {
    const out = await dispatchOpenCodeExecution(baseRequest(), {
      opencodeProbe: opencodeProbeReady(),
      ensureQwenReady: async () => sessionReady(),
      roleGate: () => ({ qualified: true }),
    });
    const specText = JSON.stringify(out.dispatch_spec || {});
    check(
      "H-no-secrets-in-spec",
      out.classification === "DISPATCH_READY" && !containsSecretMaterial(specText),
      specText.slice(0, 200),
    );
  }

  // I never performs generation (execute flag forbidden + no spawn)
  {
    let spawnCalled = false;
    const out = await dispatchOpenCodeExecution(baseRequest(), {
      opencodeProbe: opencodeProbeReady(),
      ensureQwenReady: async () => sessionReady(),
      execute: true,
      onWouldExecute: () => {
        spawnCalled = true;
      },
    });
    check(
      "I-no-generation-mode",
      out.execution_performed === false &&
        out.classification === "DISPATCH_BUILD_FAILED",
      out.classification,
    );
    check("I-no-spawn-or-run", spawnCalled === false, "would-execute hook invoked");
  }

  // J existing execution-router suite
  {
    const r = spawnSync(process.execPath, ["tests/execution-router/run.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const parsed = parseSuiteSummary(r.stdout);
    check(
      "J-execution-router-suite",
      r.status === 0 && parsed.ok === true,
      r.stdout || r.stderr,
    );
  }

  // qwen session manager + overlay reruns
  for (const [name, rel] of [
    ["qwen-session-manager", "tests/qwen-local-session-manager/run.mjs"],
    ["qwen-status-overlay", "tests/qwen-local-resource-status-overlay/run.mjs"],
  ]) {
    const r = spawnSync(process.execPath, [rel], { cwd: ROOT, encoding: "utf8" });
    const parsed = parseSuiteSummary(r.stdout);
    check(`${name}-suite`, r.status === 0 && parsed.ok === true, r.stdout || r.stderr);
  }

  const failed = results.filter((r) => !r.pass);
  for (const r of results) {
    process.stdout.write(`${r.pass ? "PASS" : "FAIL"} ${r.name}\n`);
  }
  process.stdout.write(
    `${JSON.stringify({
      ok: failed.length === 0,
      classification: failed.length === 0 ? "ALL_PASS" : "FAIL",
      failed: failed.length,
    })}\n`,
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

run().catch((err) => {
  process.stderr.write(`${err.stack || err}\n`);
  process.exit(1);
});
