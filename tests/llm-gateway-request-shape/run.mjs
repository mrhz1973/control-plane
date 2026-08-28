#!/usr/bin/env node
/**
 * D-0024-W — offline request-shape recovery regression (no provider calls).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deepStrictEqual } from "node:assert";
import { buildResponsesInputFromConsumer } from "../../tools/build-llm-gateway-request.mjs";
import {
  PLANNER_INSTRUCTIONS,
  TOOL_DESCRIPTION,
  EXECUTION_PACKET_SCHEMA_PATH,
} from "../../tools/build-openclaw-responses-request.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const CONSUMER_FIXTURE = join(
  ROOT,
  "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json",
);
const PYTHON_SCRIPT = join(HERE, "validate_litellm_transform.py");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function deepEqual(a, b) {
  try {
    deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
}

function hasSecretLeak(blob) {
  return (
    /bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(blob) ||
    /"authorization"\s*:\s*"/i.test(blob) ||
    /"password"\s*:\s*"/i.test(blob) ||
    /"api[_-]?key"\s*:\s*"[^"$\{][^"]*"/i.test(blob) ||
    /"access_token"\s*:\s*"/i.test(blob) ||
    /"refresh_token"\s*:\s*"/i.test(blob) ||
    /sk-[A-Za-z0-9]{10,}/.test(blob)
  );
}

function buildBody(consumerInput, model) {
  const packetSchema = readJson(EXECUTION_PACKET_SCHEMA_PATH);
  return {
    model,
    stream: false,
    instructions: PLANNER_INSTRUCTIONS,
    input: buildResponsesInputFromConsumer(consumerInput),
    tools: [
      {
        type: "function",
        name: "emit_execution_packet",
        description: TOOL_DESCRIPTION,
        parameters: JSON.parse(JSON.stringify(packetSchema)),
      },
    ],
    tool_choice: {
      type: "function",
      name: "emit_execution_packet",
    },
  };
}

function assertInputShape(body, consumerInput, label) {
  const input = body.input;
  if (!Array.isArray(input)) return `${label}: body.input is not a list`;
  if (input.length !== 1) return `${label}: expected exactly one input item`;
  const item = input[0];
  if (!item || item.role !== "user") return `${label}: input item must be role=user`;
  if (!Array.isArray(item.content) || item.content.length !== 1) {
    return `${label}: content must be a single Responses block array`;
  }
  const block = item.content[0];
  if (!block || block.type !== "input_text" || typeof block.text !== "string") {
    return `${label}: content block must be input_text with string text`;
  }
  let parsed;
  try {
    parsed = JSON.parse(block.text);
  } catch {
    return `${label}: input_text is not valid JSON`;
  }
  if (!deepEqual(parsed, consumerInput)) {
    return `${label}: JSON.parse(input_text) not deep-equal consumer_input`;
  }
  if (body.stream !== false) return `${label}: stream must be false`;
  if (
    Object.prototype.hasOwnProperty.call(body, "provider") ||
    Object.prototype.hasOwnProperty.call(body, "provider_override")
  ) {
    return `${label}: provider override present`;
  }
  if (!Array.isArray(body.tools) || body.tools.length !== 1) {
    return `${label}: tools must contain exactly one function`;
  }
  if (body.tools[0].name !== "emit_execution_packet") {
    return `${label}: tool name must be emit_execution_packet`;
  }
  if (
    !body.tool_choice ||
    body.tool_choice.type !== "function" ||
    body.tool_choice.name !== "emit_execution_packet"
  ) {
    return `${label}: tool_choice must force emit_execution_packet`;
  }
  const blob = JSON.stringify(body);
  if (hasSecretLeak(blob)) return `${label}: secret material in body`;
  return null;
}

const baseConsumer = readJson(CONSUMER_FIXTURE);
const glmConsumer = { ...baseConsumer, planner_requested: "glm" };
const codexConsumer = { ...baseConsumer, planner_requested: "codex" };

const CASES = [
  {
    name: "glm-input-is-list",
    run() {
      return assertInputShape(
        buildBody(glmConsumer, "planner-glm-pilot"),
        glmConsumer,
        "glm",
      );
    },
  },
  {
    name: "codex-input-is-list",
    run() {
      return assertInputShape(
        buildBody(codexConsumer, "planner-codex-pilot"),
        codexConsumer,
        "codex",
      );
    },
  },
  {
    name: "buildResponsesInputFromConsumer-export",
    run() {
      const input = buildResponsesInputFromConsumer(glmConsumer);
      if (!Array.isArray(input) || input.length !== 1) {
        return "exported helper must return single-item list";
      }
      const parsed = JSON.parse(input[0].content[0].text);
      if (!deepEqual(parsed, glmConsumer)) {
        return "exported helper round-trip failed";
      }
      return null;
    },
  },
  {
    name: "litellm-transform-offline-python",
    run() {
      if (!existsSync(PYTHON_SCRIPT)) return `missing ${PYTHON_SCRIPT}`;
      const venvPy = join(
        process.env.LOCALAPPDATA || "",
        "ControlPlane/litellm-spike/venv/Scripts/python.exe",
      );
      const py = existsSync(venvPy) ? venvPy : "python";
      const proc = spawnSync(py, [PYTHON_SCRIPT], {
        encoding: "utf8",
        cwd: ROOT,
        env: { ...process.env, D0024_ROOT: ROOT },
      });
      const stdout = (proc.stdout || "").trim();
      const stderr = (proc.stderr || "").trim();
      if (proc.status !== 0) {
        return `python transform validation failed: ${stdout || stderr || proc.status}`;
      }
      const last = stdout.split(/\r?\n/).filter(Boolean).pop();
      try {
        const summary = JSON.parse(last);
        if (!summary.ok) return `python summary not ok: ${last}`;
      } catch {
        return `python output not JSON: ${last || stderr}`;
      }
      return null;
    },
  },
];

const results = CASES.map((c) => {
  let detail;
  try {
    detail = c.run();
  } catch (err) {
    detail = String(err && err.stack ? err.stack : err);
  }
  const pass = detail === null;
  return { name: c.name, pass, detail: pass ? "ok" : detail };
});

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
}

const summary = {
  ok: failed.length === 0,
  classification: failed.length === 0 ? "PASS" : "FAIL",
  passed: results.filter((r) => r.pass).length,
  failed: failed.length,
  total: results.length,
  host_tooling_ajv: "HOST_TOOLING_AJV_UNAVAILABLE",
  network_access: false,
  provider_attempts_this_pass: 0,
  inference_this_pass: 0,
};
console.log(JSON.stringify(summary));
process.exit(failed.length === 0 ? 0 : 1);
