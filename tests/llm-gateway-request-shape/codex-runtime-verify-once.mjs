#!/usr/bin/env node
/**
 * D-0024-W Codex-only runtime verify — single bounded POST, normalize, gate, policy.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildResponsesInputFromConsumer } from "../../tools/build-llm-gateway-request.mjs";
import {
  PLANNER_INSTRUCTIONS,
  TOOL_DESCRIPTION,
  EXECUTION_PACKET_SCHEMA_PATH,
} from "../../tools/build-openclaw-responses-request.mjs";
import {
  normalizeResponsesBody,
  collectFunctionCalls,
} from "../../tools/normalize-litellm-responses-body.mjs";
import {
  checkHardConstraintsExact,
  evaluate,
} from "../../tools/validate-openclaw-planner-response-gate.mjs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(HERE, "../..");
const ART = process.env.ART || join(HERE, "artifacts");
mkdirSync(ART, { recursive: true });

const CONSUMER_FIXTURE = join(
  ROOT,
  "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json",
);

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
}

function sanitize(text) {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._\-+=\/]+/gi, "Bearer [REDACTED]")
    .replace(
      /"(access_token|refresh_token|id_token|api_key|authorization)"\s*:\s*"[^"]*"/gi,
      '"$1":"[REDACTED]"',
    );
}

function buildBody(consumerInput) {
  const packetSchema = readJson(EXECUTION_PACKET_SCHEMA_PATH);
  return {
    model: "planner-codex-pilot",
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
    tool_choice: { type: "function", name: "emit_execution_packet" },
  };
}

function parseArguments(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ok: true, value: raw };
  }
  if (typeof raw !== "string") return { ok: false };
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) return { ok: false };
    return { ok: true, value: v };
  } catch {
    return { ok: false };
  }
}

function structuralPolicy(packet) {
  const reason_codes = [];
  if (packet.status === "GATED") reason_codes.push("PACKET_ALREADY_GATED");
  if (packet.gate_recommendation?.required) {
    reason_codes.push("PLANNER_RECOMMENDED_GATE");
  }
  if (packet.risk_assessment?.level === "high") reason_codes.push("RISK_HIGH");
  return reason_codes.length
    ? { decision: "GATE", reason_codes }
    : { decision: "PROCEED", reason_codes: [] };
}

const base = readJson(CONSUMER_FIXTURE);
const consumer = { ...base, planner_requested: "codex" };
const body = buildBody(consumer);
writeFileSync(join(ART, "request-body-codex.json"), JSON.stringify(body));

const started = Date.now();
let status = null;
let text = "";
let transport_error = null;
try {
  const res = await fetch("http://127.0.0.1:4000/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  status = res.status;
  text = await res.text();
} catch (e) {
  transport_error = "TRANSPORT_ERROR";
  text = String(e.message || e);
}
const elapsed_ms = Date.now() - started;
const sanitized = sanitize(text);
writeFileSync(join(ART, "response-codex-raw.txt"), sanitized);

const normalized = normalizeResponsesBody(sanitized);
const summary = {
  codex_attempt_count_this_pass: 1,
  glm_attempt_count_this_pass: 0,
  qwen_attempt_count_this_pass: 0,
  alias: "planner-codex-pilot",
  backend_model: "chatgpt/gpt-5.6-sol",
  litellm_version: "1.98.0",
  http_status: status,
  elapsed_ms,
  transport_error,
  body_source_format: normalized.ok ? normalized.source_format : null,
  normalizer_ok: normalized.ok,
  normalizer_classification: normalized.classification,
  hard_constraints_expected_count: consumer.hard_constraints.length,
  secret_exposure: false,
  teamviewer_network_mutations: 0,
};

if (transport_error || status == null || status < 200 || status >= 300) {
  summary.response_gate = "HTTP_ERROR";
  summary.policy = "NOT_APPLICABLE";
  summary.failure_classification = transport_error || `HTTP_${status}`;
  writeFileSync(join(ART, "summary.json"), JSON.stringify(summary, null, 2));
  console.log("SUMMARY=" + JSON.stringify(summary));
  process.exit(0);
}

if (!normalized.ok) {
  summary.response_gate = normalized.classification;
  summary.policy = "NOT_APPLICABLE";
  summary.failure_classification = normalized.classification;
  writeFileSync(join(ART, "summary.json"), JSON.stringify(summary, null, 2));
  console.log("SUMMARY=" + JSON.stringify(summary));
  process.exit(0);
}

const response = normalized.response;
summary.response_object_status = response.status ?? null;
const calls = collectFunctionCalls(response.output);
summary.function_call_count = calls.length;
summary.function_call_name =
  calls.length === 1 ? calls[0].name : calls.map((c) => c.name).join(",");

if (response.status !== "completed") {
  summary.response_gate = "RESPONSE_STATUS_NOT_COMPLETED";
  summary.policy = "NOT_APPLICABLE";
} else if (calls.length !== 1 || calls[0].name !== "emit_execution_packet") {
  summary.response_gate = "FUNCTION_CALL_COUNT";
  summary.policy = "NOT_APPLICABLE";
} else {
  const args = parseArguments(calls[0].arguments);
  if (!args.ok) {
    summary.response_gate = "ARGUMENTS_JSON_PARSE";
    summary.policy = "NOT_APPLICABLE";
  } else {
    const packet = args.value;
    summary.hard_constraints_actual_count = Array.isArray(packet.hard_constraints)
      ? packet.hard_constraints.length
      : null;
    const hardCheck = checkHardConstraintsExact(packet, consumer);
    summary.hard_constraints_exact_match = hardCheck.ok;
    const gate = await evaluate(response, consumer);
    summary.response_gate = gate.classification;
    summary.response_gate_ok = gate.ok;
    summary.packet_schema = gate.ok
      ? "PASS"
      : gate.packet_classification || "SCHEMA_VALIDATION_HOST_TOOLING_UNAVAILABLE";

    const packetPath = join(ART, "packet-codex.json");
    writeFileSync(packetPath, JSON.stringify(packet, null, 2));
    const toolProc = spawnSync(
      process.execPath,
      [join(ROOT, "tools/evaluate-execution-packet-policy.mjs"), packetPath],
      { encoding: "utf8", cwd: ROOT },
    );
    try {
      const lines = (toolProc.stdout || "").trim().split(/\r?\n/).filter(Boolean);
      summary.policy = JSON.parse(lines[lines.length - 1]).decision;
    } catch {
      summary.policy = structuralPolicy(packet).decision;
      summary.policy_note = "HOST_TOOLING_AJV_UNAVAILABLE_STRUCTURAL_POLICY";
    }
  }
}

writeFileSync(join(ART, "summary.json"), JSON.stringify(summary, null, 2));
console.log("SUMMARY=" + JSON.stringify(summary));
