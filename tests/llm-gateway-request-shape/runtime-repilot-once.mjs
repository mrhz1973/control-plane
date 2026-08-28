#!/usr/bin/env node
/**
 * D-0024-W runtime re-pilot runner — bounded GLM+Codex POSTs only.
 * Not part of CI by default; invoked for authorized runtime re-pilots.
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
    tool_choice: { type: "function", name: "emit_execution_packet" },
  };
}

function collectFunctionCalls(output) {
  if (!Array.isArray(output)) return [];
  return output.filter((o) => o && o.type === "function_call");
}

function parseArguments(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ok: true, value: raw };
  }
  if (typeof raw !== "string") return { ok: false, reason: "arguments not string/object" };
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      return { ok: false, reason: "not object" };
    }
    return { ok: true, value: v };
  } catch (e) {
    return { ok: false, reason: String(e.message || e) };
  }
}

function structuralResponseGate(response, consumerInput) {
  if (response.error != null && response.error !== undefined) {
    return { classification: "API_ERROR", ok: false };
  }
  const calls = collectFunctionCalls(response.output);
  if (calls.length !== 1) {
    return {
      classification: "FUNCTION_CALL_COUNT",
      ok: false,
      function_call_count: calls.length,
    };
  }
  const call = calls[0];
  if (call.name !== "emit_execution_packet") {
    return {
      classification: "FUNCTION_CALL_NAME",
      ok: false,
      function_call_name: call.name,
    };
  }
  const args = parseArguments(call.arguments);
  if (!args.ok) {
    return { classification: "ARGUMENTS_JSON_PARSE", ok: false, reason: args.reason };
  }
  const packet = args.value;
  const identity = [
    ["task_id", packet.task_id, consumerInput.task_id],
    ["source_backlog_ref", packet.source_backlog_ref, consumerInput.source_backlog_ref],
    ["repository", packet.repository, consumerInput.repository],
    ["branch_target", packet.branch_target, consumerInput.branch_target],
  ];
  for (const [, actual, expected] of identity) {
    if (actual !== expected) return { classification: "INPUT_MISMATCH", ok: false };
  }
  if (packet.executor !== "cursor") return { classification: "INPUT_MISMATCH", ok: false };
  if (packet.planner?.requested !== consumerInput.planner_requested) {
    return { classification: "PLANNER_MISMATCH", ok: false };
  }
  if (packet.planner?.fallback_used !== false) {
    return { classification: "FALLBACK_METADATA_INVALID", ok: false };
  }
  if (
    packet.planner?.used !== packet.planner?.requested ||
    packet.planner?.fallback_reason !== null
  ) {
    return { classification: "FALLBACK_METADATA_INVALID", ok: false };
  }
  const expectedHard = consumerInput.hard_constraints || [];
  const actualHard = packet.hard_constraints || [];
  if (
    actualHard.length !== expectedHard.length ||
    !actualHard.every((v, i) => v === expectedHard[i])
  ) {
    return { classification: "HARD_CONSTRAINT_MISMATCH", ok: false };
  }
  if (packet.schema !== "execution-packet-v1") {
    return { classification: "PACKET_SCHEMA_STRUCTURAL", ok: false };
  }
  return {
    ok: true,
    classification: "PASS_STRUCTURAL",
    packet_schema: "SCHEMA_VALIDATION_HOST_TOOLING_UNAVAILABLE",
    function_call_count: 1,
    function_call_name: "emit_execution_packet",
    packet,
  };
}

function structuralPolicy(packet) {
  const reason_codes = [];
  if (packet.status === "SUPERSEDED") reason_codes.push("PACKET_SUPERSEDED");
  if (packet.status === "GATED") reason_codes.push("PACKET_ALREADY_GATED");
  const risk = packet.risk_assessment || {};
  if (risk.level === "high") reason_codes.push("RISK_HIGH");
  if (risk.scope_expansion === true) reason_codes.push("SCOPE_EXPANSION");
  if (risk.destructive === true) reason_codes.push("DESTRUCTIVE");
  if (risk.production_sensitive === true) reason_codes.push("PRODUCTION_SENSITIVE");
  if (risk.credentials_or_billing === true) reason_codes.push("CREDENTIALS_OR_BILLING");
  if (packet.gate_recommendation?.required === true) {
    reason_codes.push("PLANNER_RECOMMENDED_GATE");
  }
  if (packet.planner?.fallback_used === true) {
    reason_codes.push("PLANNER_FALLBACK_REQUIRES_EQUIVALENCE_GATE");
  }
  return reason_codes.length
    ? { decision: "GATE", reason_codes }
    : { decision: "PROCEED", reason_codes: [] };
}

async function postOnce(backend, model, consumerInput) {
  const body = buildBody(consumerInput, model);
  writeFileSync(join(ART, `request-body-${backend}.json`), JSON.stringify(body));
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
  writeFileSync(join(ART, `response-${backend}.json`), sanitized);
  let parsed = null;
  try {
    parsed = JSON.parse(sanitized);
  } catch {
    parsed = null;
  }
  const isHttpError = status == null || status < 200 || status >= 300;
  const hasTopError = parsed && parsed.error != null;
  let gate = null;
  let policy = null;
  let failure_classification = null;
  if (!transport_error && !isHttpError && !hasTopError && parsed) {
    gate = structuralResponseGate(parsed, consumerInput);
    if (gate.ok && gate.packet) {
      const packetPath = join(ART, `packet-${backend}.json`);
      writeFileSync(packetPath, JSON.stringify(gate.packet, null, 2));
      const toolProc = spawnSync(
        process.execPath,
        [join(ROOT, "tools/evaluate-execution-packet-policy.mjs"), packetPath],
        { encoding: "utf8", cwd: ROOT },
      );
      try {
        const lines = (toolProc.stdout || "").trim().split(/\r?\n/).filter(Boolean);
        policy = JSON.parse(lines[lines.length - 1]);
      } catch {
        policy = structuralPolicy(gate.packet);
        policy.note = "HOST_TOOLING_AJV_UNAVAILABLE_STRUCTURAL_POLICY";
      }
    }
  } else {
    if (transport_error) failure_classification = transport_error;
    else {
      const msg = parsed?.error?.message || text.slice(0, 300);
      failure_classification = `HTTP_${status}_PROVIDER_ERROR`;
      if (/messages parameter is illegal/i.test(msg)) {
        failure_classification = "PROVIDER_BAD_REQUEST_ZAI_MESSAGES_PARAMETER_ILLEGAL";
      }
      if (/Input must be a list/i.test(msg)) {
        failure_classification = "PROVIDER_BAD_REQUEST_CHATGPT_INPUT_MUST_BE_LIST";
      }
    }
    gate = { ok: false, classification: failure_classification || "API_ERROR" };
    policy = { decision: "NOT_APPLICABLE_NO_PACKET" };
  }
  return {
    backend,
    gateway_kind: "litellm",
    litellm_version: "1.98.0",
    alias: model,
    backend_model:
      backend === "glm"
        ? "zai/glm-5.3"
        : backend === "codex"
          ? "chatgpt/gpt-5.6-sol"
          : null,
    endpoint_class:
      backend === "glm" ? "zai_coding_paas_v4" : "chatgpt_codex_oauth",
    http_status: status,
    elapsed_ms,
    transport_error,
    response_object_status: parsed?.status ?? null,
    function_call_count:
      gate?.function_call_count ??
      (parsed ? collectFunctionCalls(parsed.output).length : null),
    function_call_name: gate?.function_call_name ?? null,
    response_gate: gate?.classification,
    response_gate_ok: gate?.ok ?? false,
    packet_schema:
      gate?.packet_schema ?? (gate?.ok ? null : "NOT_APPLICABLE_PROVIDER_ERROR"),
    policy: policy?.decision ?? policy,
    policy_detail: policy,
    failure_classification,
    error_message_sanitized: parsed?.error?.message
      ? String(parsed.error.message).slice(0, 400)
      : null,
    secret_exposure: false,
  };
}

const base = readJson(CONSUMER_FIXTURE);
const glm = await postOnce("glm", "planner-glm-pilot", {
  ...base,
  planner_requested: "glm",
});
console.log("GLM_RESULT=" + JSON.stringify(glm));

let proxyAlive = true;
try {
  const h = await fetch("http://127.0.0.1:4000/health", {
    signal: AbortSignal.timeout(5000),
  });
  proxyAlive = h.ok;
} catch {
  proxyAlive = false;
}

let codex;
if (proxyAlive) {
  codex = await postOnce("codex", "planner-codex-pilot", {
    ...base,
    planner_requested: "codex",
  });
} else {
  codex = { backend: "codex", skipped: true, codex_repilot_attempt_count: 0 };
}
console.log("CODEX_RESULT=" + JSON.stringify(codex));

const summary = {
  glm_repilot_attempt_count: 1,
  codex_repilot_attempt_count: codex.skipped ? 0 : 1,
  new_total_provider_attempts: codex.skipped ? 1 : 2,
  historical_original_pilot_attempts: 2,
  glm,
  codex,
};
writeFileSync(join(ART, "summary.json"), JSON.stringify(summary, null, 2));
console.log("SUMMARY=" + JSON.stringify(summary));
