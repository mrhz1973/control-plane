#!/usr/bin/env node
/**
 * D-0018-W — Deterministic OpenClaw planner-response gate validator.
 *
 * Validates a saved non-streaming OpenResponses `/v1/responses` JSON file
 * together with the original consumer_input JSON. No HTTP.
 *
 * Usage:
 *   node tools/validate-openclaw-planner-response-gate.mjs <response.json> <consumer_input.json>
 *
 * Exit: 0 PASS, non-zero FAIL.
 * Stdout: one machine-readable JSON result object.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SCHEMA_PATH,
  validatePacketObject,
} from "./validate-execution-packet-v1.mjs";

const REQUIRED_FUNCTION = "emit_execution_packet";

function emit(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

function fail(classification, reason, extra = {}) {
  emit(
    {
      ok: false,
      classification,
      reason,
      ...extra,
    },
    1,
  );
}

function readJson(path, prefix) {
  const abs = resolve(process.cwd(), path);
  if (!existsSync(abs)) {
    fail(`${prefix}_NOT_FOUND`, `File not found: ${abs}`, { path: abs });
  }
  let text;
  try {
    text = readFileSync(abs, "utf8").replace(/^\uFEFF/, "");
  } catch (err) {
    fail(`${prefix}_READ_ERROR`, String(err.message || err), { path: abs });
  }
  try {
    return { abs, value: JSON.parse(text) };
  } catch (err) {
    fail(`${prefix}_JSON_PARSE_ERROR`, String(err.message || err), {
      path: abs,
    });
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function collectFunctionCalls(output) {
  if (!Array.isArray(output)) return [];
  return output.filter(
    (item) => item && typeof item === "object" && item.type === "function_call",
  );
}

function parseArguments(raw) {
  if (isPlainObject(raw)) {
    return { ok: true, value: raw };
  }
  if (typeof raw !== "string") {
    return {
      ok: false,
      reason: "function_call.arguments must be a JSON string or object",
    };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      return {
        ok: false,
        reason: "function_call.arguments JSON must decode to an object",
      };
    }
    return { ok: true, value: parsed };
  } catch (err) {
    return { ok: false, reason: String(err.message || err) };
  }
}

function nonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

async function evaluate(response, consumerInput) {
  // Top-level API error
  if (
    Object.prototype.hasOwnProperty.call(response, "error") &&
    response.error != null
  ) {
    return {
      ok: false,
      classification: "API_ERROR",
      reason: "Response contains a top-level API error",
    };
  }

  const calls = collectFunctionCalls(response.output);
  if (calls.length !== 1) {
    return {
      ok: false,
      classification: "FUNCTION_CALL_COUNT",
      reason: `Expected exactly one function_call in output, found ${calls.length}`,
      function_call_count: calls.length,
    };
  }

  const call = calls[0];
  if (call.name !== REQUIRED_FUNCTION) {
    return {
      ok: false,
      classification: "FUNCTION_CALL_NAME",
      reason: `Expected function name ${REQUIRED_FUNCTION}, found ${String(call.name)}`,
      function_name: call.name,
    };
  }

  const argsParsed = parseArguments(call.arguments);
  if (!argsParsed.ok) {
    return {
      ok: false,
      classification: "ARGUMENTS_JSON_PARSE",
      reason: argsParsed.reason,
    };
  }
  const packet = argsParsed.value;

  const schemaResult = await validatePacketObject(packet);
  if (!schemaResult.ok) {
    return {
      ok: false,
      classification: "PACKET_SCHEMA_INVALID",
      reason: schemaResult.reason,
      schema_path: SCHEMA_PATH,
      packet_classification: schemaResult.classification,
      packet_errors: schemaResult.errors,
    };
  }

  // Identity vs consumer_input
  const identityChecks = [
    ["task_id", packet.task_id, consumerInput.task_id],
    [
      "source_backlog_ref",
      packet.source_backlog_ref,
      consumerInput.source_backlog_ref,
    ],
    ["repository", packet.repository, consumerInput.repository],
    ["branch_target", packet.branch_target, consumerInput.branch_target],
  ];
  for (const [field, actual, expected] of identityChecks) {
    if (actual !== expected) {
      return {
        ok: false,
        classification: "INPUT_MISMATCH",
        reason: `Packet ${field} does not match consumer_input`,
        field,
      };
    }
  }

  if (packet.executor !== "cursor") {
    return {
      ok: false,
      classification: "INPUT_MISMATCH",
      reason: 'Packet executor must be "cursor"',
      field: "executor",
    };
  }

  if (packet.planner?.requested !== consumerInput.planner_requested) {
    return {
      ok: false,
      classification: "PLANNER_MISMATCH",
      reason:
        "packet.planner.requested does not match consumer_input.planner_requested",
    };
  }

  const fallbackUsed = packet.planner?.fallback_used;
  const used = packet.planner?.used;
  const requested = packet.planner?.requested;
  const fallbackReason = packet.planner?.fallback_reason;

  if (fallbackUsed === false) {
    if (used !== requested || fallbackReason !== null) {
      return {
        ok: false,
        classification: "FALLBACK_METADATA_INVALID",
        reason:
          "When fallback_used=false, planner.used must equal planner.requested and fallback_reason must be null",
      };
    }
  } else if (fallbackUsed === true) {
    if (used === requested || !nonEmptyString(fallbackReason)) {
      return {
        ok: false,
        classification: "FALLBACK_METADATA_INVALID",
        reason:
          "When fallback_used=true, planner.used must differ from planner.requested and fallback_reason must be a non-empty string",
      };
    }
  } else {
    return {
      ok: false,
      classification: "FALLBACK_METADATA_INVALID",
      reason: "planner.fallback_used must be boolean",
    };
  }

  // hard_constraints: exact deep-array equality vs consumer_input
  // Mapping: docs/contracts/execution-packet-hard-constraints-mapping-v1.md
  const expectedHard = Array.isArray(consumerInput.hard_constraints)
    ? consumerInput.hard_constraints
    : null;
  if (expectedHard === null) {
    return {
      ok: false,
      classification: "INPUT_MISMATCH",
      reason: "consumer_input.hard_constraints must be an array (use [] when empty)",
      field: "hard_constraints",
    };
  }
  const actualHard = packet.hard_constraints;
  if (!Array.isArray(actualHard)) {
    return {
      ok: false,
      classification: "HARD_CONSTRAINT_MISMATCH",
      reason: "packet.hard_constraints must be an array",
    };
  }
  let hardEqual =
    actualHard.length === expectedHard.length &&
    actualHard.every((v, i) => v === expectedHard[i]);
  if (!hardEqual) {
    return {
      ok: false,
      classification: "HARD_CONSTRAINT_MISMATCH",
      reason:
        "packet.hard_constraints does not exactly equal consumer_input.hard_constraints (length/order/string identity)",
    };
  }

  return {
    ok: true,
    classification: "PASS",
    reason:
      "Saved OpenResponses function_call packet passed schema and consumer-input invariants",
    schema_path: SCHEMA_PATH,
  };
}

async function main() {
  const responsePath = process.argv[2];
  const inputPath = process.argv[3];
  if (!responsePath || !inputPath) {
    fail(
      "USAGE_ERROR",
      "Usage: node tools/validate-openclaw-planner-response-gate.mjs <response.json> <consumer_input.json>",
    );
  }

  const response = readJson(responsePath, "RESPONSE");
  const consumer = readJson(inputPath, "CONSUMER_INPUT");
  if (!isPlainObject(response.value)) {
    fail("RESPONSE_JSON_PARSE_ERROR", "Response root must be a JSON object", {
      path: response.abs,
    });
  }
  if (!isPlainObject(consumer.value)) {
    fail(
      "CONSUMER_INPUT_JSON_PARSE_ERROR",
      "consumer_input root must be a JSON object",
      { path: consumer.abs },
    );
  }

  const result = await evaluate(response.value, consumer.value);
  emit(
    {
      ...result,
      response_path: response.abs,
      consumer_input_path: consumer.abs,
    },
    result.ok ? 0 : 1,
  );
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((err) => {
    fail(
      "GATE_INTERNAL_ERROR",
      String(err && err.stack ? err.stack : err),
    );
  });
}

export { evaluate };
