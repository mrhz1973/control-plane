#!/usr/bin/env node
/**
 * D-0025-W — offline tests for run-litellm-primary-cycle.mjs + WF61 structural validation.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  prepareCycle,
  finalizeCycle,
  PREPARED_SCHEMA,
  FINAL_SCHEMA,
} from "../../tools/run-litellm-primary-cycle.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const TOOL = join(ROOT, "tools/run-litellm-primary-cycle.mjs");
const FIX = join(HERE, "fixtures");
const PROFILE = join(
  ROOT,
  "configs/litellm/control-plane-primary-remote.gateway-profile.json",
);
const WF61 = join(
  ROOT,
  "workflows/61-litellm-primary-remote-planner.template.json",
);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function b64Json(obj) {
  return Buffer.from(JSON.stringify(obj), "utf8").toString("base64");
}

function b64Text(text) {
  return Buffer.from(String(text), "utf8").toString("base64");
}

function runCli(args) {
  const proc = spawnSync(process.execPath, [TOOL, ...args], {
    encoding: "utf8",
    cwd: ROOT,
    env: process.env,
  });
  const stdout = (proc.stdout || "").trim();
  let result = null;
  try {
    result = JSON.parse(stdout.split(/\r?\n/).filter(Boolean).pop());
  } catch {
    result = null;
  }
  return { proc, result, stdout };
}

function hasSecretLeak(blob) {
  return (
    /bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(blob) ||
    /"authorization"\s*:\s*"/i.test(blob) ||
    /sk-[A-Za-z0-9]{10,}/.test(blob)
  );
}

function validateWf61() {
  if (!existsSync(WF61)) return "WF61 template missing";
  let wf;
  try {
    wf = readJson(WF61);
  } catch (err) {
    return `WF61 JSON invalid: ${String(err.message || err)}`;
  }
  if (wf.active !== false) return "WF61 must remain active=false";
  const nodes = wf.nodes || [];
  const names = nodes.map((n) => n.name);
  const types = nodes.map((n) => `${n.type}@${n.typeVersion}`);
  if (!names.includes("When Executed by Another Workflow")) {
    return "missing Execute Workflow Trigger";
  }
  if (names.some((n) => /Manual Trigger/i.test(n))) {
    return "Manual Trigger must be absent";
  }
  // Canonical post-00f0132 transport is Execute Command (not httpRequest).
  const httpRequestNodes = nodes.filter((n) => n.type === "n8n-nodes-base.httpRequest");
  if (httpRequestNodes.length !== 0) {
    return `canonical WF61 must have zero httpRequest nodes, found ${httpRequestNodes.length}`;
  }
  const transportNodes = nodes.filter((n) => n.name === "HTTP Request - LiteLLM primary one-shot");
  if (transportNodes.length !== 1) {
    return `expected exactly 1 transport node "HTTP Request - LiteLLM primary one-shot", found ${transportNodes.length}`;
  }
  const transport = transportNodes[0];
  if (transport.type !== "n8n-nodes-base.executeCommand") {
    return `transport type must be n8n-nodes-base.executeCommand, got ${transport.type}`;
  }
  if (transport.typeVersion !== 1) {
    return `transport typeVersion must be 1, got ${transport.typeVersion}`;
  }
  const transportCmd = String(transport.parameters?.command || "");
  if (!transportCmd.includes("post-litellm-primary-one-shot.mjs")) {
    return "transport command must invoke post-litellm-primary-one-shot.mjs";
  }
  if (!transportCmd.includes("aHR0cDovL2xpdGVsbG0tcHJpbWFyeTo0MDAwL3YxL3Jlc3BvbnNlcw==")) {
    return "transport must target canonical LiteLLM URL via url-b64";
  }
  if (!transportCmd.includes("request_body_b64")) {
    return "transport must pass request_body_b64 from prepare";
  }
  if (!transportCmd.includes("--wall-timeout-ms 115000")) {
    return "transport must set --wall-timeout-ms 115000";
  }
  if (!transportCmd.includes("--body-idle-timeout-ms 15000")) {
    return "transport must set --body-idle-timeout-ms 15000";
  }
  if (!transportCmd.includes("--max-body-bytes 8388608")) {
    return "transport must set --max-body-bytes 8388608";
  }
  if (!transportCmd.includes("2>&1 || true")) {
    return "transport must use hang-proof shell form 2>&1 || true";
  }
  if (transport.parameters?.authentication || transport.parameters?.genericAuthType || transport.credentials) {
    return "transport Execute Command must be credentialless";
  }
  if (/https?:\/\/(?!json-schema)/i.test(transportCmd)) {
    return "public HTTP/HTTPS provider target forbidden on transport command";
  }

  const prepareCmd = nodes.filter((n) => n.name === "Execute Command - canonical prepare");
  const finalizeCmd = nodes.filter((n) => n.name === "Execute Command - canonical finalize");
  if (prepareCmd.length !== 1 || finalizeCmd.length !== 1) {
    return "prepare and finalize Execute Command nodes must exist exactly once";
  }
  if (prepareCmd[0].typeVersion !== 1 || finalizeCmd[0].typeVersion !== 1) {
    return "Execute Command typeVersion must be 1";
  }
  if (!String(prepareCmd[0].parameters?.command || "").includes("run-litellm-primary-cycle.mjs prepare")) {
    return "prepare command must invoke run-litellm-primary-cycle.mjs prepare";
  }
  if (!String(finalizeCmd[0].parameters?.command || "").includes("run-litellm-primary-cycle.mjs finalize")) {
    return "finalize command must invoke run-litellm-primary-cycle.mjs finalize";
  }
  if (names.some((n) => /telegram/i.test(n))) return "Telegram nodes forbidden";
  const execWf = nodes.filter((n) => n.type === "n8n-nodes-base.executeWorkflow");
  if (execWf.length > 0) return "WF40/WF60 executeWorkflow references forbidden";
  const execNodes = nodes.filter((n) => n.type !== "n8n-nodes-base.stickyNote");
  const execSerialized = JSON.stringify(execNodes);
  if (/planner-qwen-pilot|planner-qwen-test/i.test(execSerialized)) {
    return "Qwen model alias must not appear in WF61 executable nodes";
  }
  if (!execSerialized.includes("QWEN_DEFERRED")) {
    return "WF61 ingress must fail-closed on Qwen";
  }
  if (/Bearer [A-Za-z0-9]{8,}/.test(JSON.stringify(wf))) return "secret literal in WF61";
  if (/sk-[A-Za-z0-9]{10,}/.test(JSON.stringify(wf))) return "api-key secret literal in WF61";
  if (!names.includes("Return HTTP failure no retry")) return "missing HTTP failure no-retry branch";
  if (!names.includes("Return prepare failure without HTTP")) {
    return "missing prepare failure branch";
  }
  if (/retry/i.test(names.join("|")) && !/no retry/i.test(JSON.stringify(wf))) {
    return "retry branch semantics unclear";
  }
  // Canonical 13-node WF61 shape (post-00f0132): no httpRequest.
  const allowedTypeVersions = new Set([
    "n8n-nodes-base.executeWorkflowTrigger@1.2",
    "n8n-nodes-base.code@2",
    "n8n-nodes-base.executeCommand@1",
    "n8n-nodes-base.if@2",
    "n8n-nodes-base.stickyNote@1",
  ]);
  for (const t of types) {
    if (!allowedTypeVersions.has(t)) return `unsupported node type/version for n8n 2.19.5: ${t}`;
  }
  return null;
}

const consumerGlm = readJson(join(FIX, "consumer-glm.json"));
const consumerCodex = readJson(join(FIX, "consumer-codex.json"));
const routingGlm = readJson(join(FIX, "routing-glm-gate-only.json"));
const routingCodex = readJson(join(FIX, "routing-codex-gate-only.json"));
const profile = readJson(PROFILE);

const CASES = [
  {
    name: "glm-prepare-pass",
    async run() {
      const result = await prepareCycle({
        consumerInput: consumerGlm,
        routingInput: routingGlm,
        gatewayProfile: profile,
      });
      if (!result.ok || result.schema !== PREPARED_SCHEMA) return JSON.stringify(result);
      if (result.selected_planner !== "glm") return "expected glm";
      if (!result.request_envelope?.body) return "missing body";
      const tools = result.request_envelope.body.tools || [];
      const forced = result.request_envelope.body.tool_choice;
      if (tools.length !== 1 || tools[0].name !== "emit_execution_packet") {
        return "expected one emit_execution_packet tool";
      }
      if (forced?.name !== "emit_execution_packet") return "forced tool_choice missing";
      if (result.request_envelope.body.stream !== false) return "stream must be false";
      if (result.request_envelope.path !== "/v1/responses") return "path must be /v1/responses";
      return null;
    },
  },
  {
    name: "codex-prepare-pass",
    async run() {
      const result = await prepareCycle({
        consumerInput: consumerCodex,
        routingInput: routingCodex,
        gatewayProfile: profile,
      });
      if (!result.ok || result.selected_planner !== "codex") return JSON.stringify(result);
      return null;
    },
  },
  {
    name: "qwen-preferred-fail",
    async run() {
      const routing = {
        ...routingGlm,
        preferred: "qwen",
      };
      const consumer = { ...consumerGlm, planner_requested: "qwen" };
      const result = await prepareCycle({
        consumerInput: consumer,
        routingInput: routing,
        gatewayProfile: profile,
      });
      if (result.ok) return "expected FAIL";
      if (result.classification !== "REMOTE_PLANNER_ONLY") {
        return `expected REMOTE_PLANNER_ONLY got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "nonempty-fallback-fail",
    async run() {
      const routing = { ...routingGlm, fallback: ["codex"] };
      const result = await prepareCycle({
        consumerInput: consumerGlm,
        routingInput: routing,
        gatewayProfile: profile,
      });
      if (result.ok) return "expected FAIL";
      if (result.classification !== "PLANNER_FALLBACK_FORBIDDEN") {
        return `expected PLANNER_FALLBACK_FORBIDDEN got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "fallback-policy-not-gate-only-fail",
    async run() {
      const routing = { ...routingGlm, fallback_policy: "normal" };
      const result = await prepareCycle({
        consumerInput: consumerGlm,
        routingInput: routing,
        gatewayProfile: profile,
      });
      if (result.ok) return "expected FAIL";
      if (result.classification !== "FALLBACK_POLICY_MUST_BE_GATE_ONLY") {
        return `expected FALLBACK_POLICY_MUST_BE_GATE_ONLY got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "task-id-mismatch-fail",
    async run() {
      const routing = { ...routingGlm, task_id: "OTHER" };
      const result = await prepareCycle({
        consumerInput: consumerGlm,
        routingInput: routing,
        gatewayProfile: profile,
      });
      if (result.ok) return "expected FAIL";
      if (result.classification !== "TASK_ID_MISMATCH") {
        return `expected TASK_ID_MISMATCH got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "planner-requested-mismatch-fail",
    async run() {
      const consumer = { ...consumerGlm, planner_requested: "codex" };
      const result = await prepareCycle({
        consumerInput: consumer,
        routingInput: routingGlm,
        gatewayProfile: profile,
      });
      if (result.ok) return "expected FAIL";
      if (result.classification !== "PLANNER_REQUEST_MISMATCH") {
        return `expected PLANNER_REQUEST_MISMATCH got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "prepare-cli-glm-pass",
    run() {
      const { proc, result } = runCli([
        "prepare",
        "--consumer-b64",
        b64Json(consumerGlm),
        "--routing-b64",
        b64Json(routingGlm),
        "--profile",
        PROFILE,
      ]);
      if (proc.status !== 0 || !result?.ok) return JSON.stringify(result);
      return null;
    },
  },
  {
    name: "finalize-json-pass",
    async run() {
      const consumer = readJson(
        join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json"),
      );
      const response = readJson(
        join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/synthetic-response-valid.json"),
      );
      const result = await finalizeCycle({
        consumerInput: consumer,
        rawResponseText: JSON.stringify(response),
        responseSourceFormat: "json",
      });
      if (!result.ok || result.schema !== FINAL_SCHEMA) return JSON.stringify(result);
      if (result.response_gate !== "PASS") return "response gate not PASS";
      if (result.policy?.cursor_dispatch_allowed !== false) {
        return "cursor_dispatch_allowed must be false";
      }
      return null;
    },
  },
  {
    name: "finalize-codex-sse-pass",
    async run() {
      const consumer = readJson(
        join(ROOT, "tests/llm-gateway-request-shape/artifacts/consumer-input-codex.json"),
      );
      const sse = readFileSync(
        join(ROOT, "tests/llm-gateway-request-shape/artifacts/response-codex-raw.txt"),
        "utf8",
      );
      const result = await finalizeCycle({
        consumerInput: consumer,
        rawResponseText: sse,
      });
      if (!result.ok) return JSON.stringify(result);
      if (result.response_source_format !== "sse") {
        return `expected sse source format got ${result.response_source_format}`;
      }
      if (result.policy?.cursor_dispatch_allowed !== false) {
        return "cursor_dispatch_allowed must be false";
      }
      return null;
    },
  },
  {
    name: "finalize-sse-output-item-done-without-completed-pass",
    async run() {
      const consumer = readJson(
        join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json"),
      );
      const synthetic = readJson(
        join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/synthetic-response-valid.json"),
      );
      const item = (synthetic.output || [])[0];
      if (!item) return "synthetic fixture missing first output item";
      const sse = `data: ${JSON.stringify({ type: "response.output_item.done", output_index: 0, item })}\n\n`;
      const result = await finalizeCycle({
        consumerInput: consumer,
        rawResponseText: sse,
      });
      if (!result.ok) return JSON.stringify(result);
      if (result.response_source_format !== "sse") {
        return `expected sse source format got ${result.response_source_format}`;
      }
      if (result.response_gate !== "PASS") return "response gate not PASS";
      if (result.policy?.cursor_dispatch_allowed !== false) {
        return "cursor_dispatch_allowed must be false";
      }
      return null;
    },
  },
  {
    name: "finalize-sse-no-completed-no-output-fail-closed",
    async run() {
      const consumer = readJson(
        join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json"),
      );
      const sse = 'data: {"type":"response.created","response":{"id":"resp_no_terminal"}}\n\n';
      const result = await finalizeCycle({
        consumerInput: consumer,
        rawResponseText: sse,
      });
      if (result.ok) return "expected FAIL";
      if (result.classification !== "SSE_NO_COMPLETED_RESPONSE") {
        return `expected SSE_NO_COMPLETED_RESPONSE got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "finalize-malformed-sse-fail",
    async run() {
      const consumer = readJson(join(FIX, "consumer-codex.json"));
      const result = await finalizeCycle({
        consumerInput: consumer,
        rawResponseText: "data: {not-json}\n\n",
      });
      if (result.ok) return "expected FAIL";
      return null;
    },
  },
  {
    name: "finalize-hard-constraints-mismatch-fail",
    async run() {
      const consumer = readJson(
        join(ROOT, "tests/openclaw-planner-response-gate/fixtures/consumer-input-valid.json"),
      );
      const response = readJson(
        join(
          ROOT,
          "tests/openclaw-planner-response-gate/fixtures/response-hard-constraints-modified.json",
        ),
      );
      const result = await finalizeCycle({
        consumerInput: consumer,
        rawResponseText: JSON.stringify(response),
        responseSourceFormat: "json",
      });
      if (result.ok) return "expected FAIL";
      if (result.classification !== "PACKET_SOURCE_FIELD_MISMATCH") {
        return `expected PACKET_SOURCE_FIELD_MISMATCH got ${result.classification}`;
      }
      return null;
    },
  },
  {
    name: "finalize-policy-gate-preserved",
    async run() {
      const consumer = readJson(join(FIX, "consumer-policy-gate.json"));
      const response = readJson(join(FIX, "response-policy-gate.json"));
      const result = await finalizeCycle({
        consumerInput: consumer,
        rawResponseText: JSON.stringify(response),
        responseSourceFormat: "json",
      });
      if (!result.ok) return JSON.stringify(result);
      if (result.policy?.decision !== "GATE") {
        return `expected policy GATE got ${result.policy?.decision}`;
      }
      if (result.policy?.cursor_dispatch_allowed !== false) {
        return "cursor_dispatch_allowed must remain false";
      }
      if (!(result.policy?.reason_codes || []).includes("PLANNER_RECOMMENDED_GATE")) {
        return "expected PLANNER_RECOMMENDED_GATE reason";
      }
      return null;
    },
  },
  {
    name: "finalize-cli-cursor-dispatch-false",
    run() {
      const consumer = readJson(
        join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json"),
      );
      const response = readJson(
        join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/synthetic-response-valid.json"),
      );
      const { proc, result } = runCli([
        "finalize",
        "--consumer-b64",
        b64Json(consumer),
        "--response-b64",
        b64Text(JSON.stringify(response)),
      ]);
      if (proc.status !== 0 || !result?.ok) return JSON.stringify(result);
      if (result.policy?.cursor_dispatch_allowed !== false) {
        return "cursor_dispatch_allowed must be false in CLI output";
      }
      return null;
    },
  },
  {
    name: "output-no-secret-shaped-values",
    async run() {
      const prep = await prepareCycle({
        consumerInput: consumerGlm,
        routingInput: routingGlm,
        gatewayProfile: profile,
      });
      if (hasSecretLeak(JSON.stringify(prep))) return "prepare output secret leak";
      const consumer = readJson(
        join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json"),
      );
      const response = readJson(
        join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/synthetic-response-valid.json"),
      );
      const fin = await finalizeCycle({
        consumerInput: consumer,
        rawResponseText: JSON.stringify(response),
        responseSourceFormat: "json",
      });
      if (hasSecretLeak(JSON.stringify(fin))) return "finalize output secret leak";
      return null;
    },
  },
  {
    name: "wf61-structural-pass",
    run() {
      const detail = validateWf61();
      return detail;
    },
  },
];

async function main() {
  const results = [];
  for (const c of CASES) {
    let detail;
    try {
      detail = await c.run();
    } catch (err) {
      detail = String(err && err.stack ? err.stack : err);
    }
    const pass = detail === null;
    results.push({ name: c.name, pass, detail: pass ? "ok" : detail });
    console.log(`${pass ? "PASS" : "FAIL"} ${c.name} — ${pass ? "ok" : detail}`);
  }
  const failed = results.filter((r) => !r.pass);
  const summary = {
    ok: failed.length === 0,
    classification: failed.length === 0 ? "PASS" : "FAIL",
    passed: results.filter((r) => r.pass).length,
    failed: failed.length,
    total: results.length,
    network_access: false,
    provider_model_request_count: 0,
    credential_access: 0,
  };
  console.log(JSON.stringify(summary));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
