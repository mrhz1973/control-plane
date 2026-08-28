#!/usr/bin/env node
/**
 * D-0019-W — Deterministic OpenClaw `/v1/responses` request builder.
 *
 * Validates consumer_input against openclaw-consumer-input-v1.schema.json,
 * then emits a non-secret request envelope. No HTTP. No OpenClaw config.
 * No secrets/tokens.
 *
 * Canonical serialization (byte-stable for identical input + contract files):
 * - envelope object keys are always inserted in a fixed order;
 * - body.input is a structured clone of the validated consumer_input with
 *   original key/array order preserved (no key sorting, no value mutation);
 * - tools[0].parameters is JSON.parse of execution-packet-v1.schema.json
 *   (deep clone via parse; not hand-authored);
 * - stdout is JSON.stringify(result) with no pretty-print, no timestamps,
 *   no random IDs.
 *
 * Usage:
 *   node tools/build-openclaw-responses-request.mjs <consumer_input.json>
 *
 * Exit: 0 PASS, non-zero FAIL.
 * Stdout: one machine-readable JSON result object.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveAjvModules, ROOT } from "./validate-execution-packet-v1.mjs";

export const CONSUMER_INPUT_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/openclaw-consumer-input-v1.schema.json",
);
export const EXECUTION_PACKET_SCHEMA_PATH = resolve(
  ROOT,
  "docs/contracts/execution-packet-v1.schema.json",
);

/** Exact planner instructions from openclaw-execution-packet-consumer-v1.md §3 */
export const PLANNER_INSTRUCTIONS = [
  "You are the planner for mrhz1973/control-plane.",
  "Generate exactly one bounded Execution Packet conforming to execution-packet-v1.",
  "Preserve the supplied task objective, allowed/forbidden scope and hard constraints.",
  "hard_constraints MUST equal consumer_input.hard_constraints exactly: same length, same order, same strings; do not add, remove, rephrase, or infer additional hard constraints.",
  "Do not self-authorize runtime.",
  "Do not invent credentials, provider state, repository facts, hashes or acceptance evidence.",
  "If required information is absent, encode a gate/blocking condition rather than guessing.",
  "Return the packet only through the required emit_execution_packet function call.",
].join("\n");

export const TOOL_DESCRIPTION =
  "Emit one execution-packet-v1 object for deterministic validation and Cursor handoff.";

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

function readJsonFile(absPath, unavailableClassification) {
  if (!existsSync(absPath)) {
    return {
      ok: false,
      classification: unavailableClassification,
      reason: `Contract/schema source unavailable: ${absPath}`,
      path: absPath,
    };
  }
  let text;
  try {
    text = readFileSync(absPath, "utf8").replace(/^\uFEFF/, "");
  } catch (err) {
    return {
      ok: false,
      classification: unavailableClassification,
      reason: `Unable to read contract/schema source: ${absPath}`,
      path: absPath,
      detail: String(err.message || err),
    };
  }
  try {
    return { ok: true, value: JSON.parse(text), path: absPath, text };
  } catch (err) {
    return {
      ok: false,
      classification: unavailableClassification,
      reason: `Contract/schema JSON parse failed: ${absPath}`,
      path: absPath,
      detail: String(err.message || err),
    };
  }
}

let cachedConsumerValidate = null;

async function loadConsumerInputValidate() {
  if (cachedConsumerValidate) return cachedConsumerValidate;
  const schemaLoaded = readJsonFile(
    CONSUMER_INPUT_SCHEMA_PATH,
    "CONTRACT_SOURCE_UNAVAILABLE",
  );
  if (!schemaLoaded.ok) {
    const error = new Error(schemaLoaded.reason);
    error.classification = schemaLoaded.classification;
    error.extra = schemaLoaded;
    throw error;
  }
  let ajv2020Path;
  let formatsPath;
  try {
    ({ ajv2020Path, formatsPath } = resolveAjvModules());
  } catch (err) {
    const error = new Error(String(err.message || err));
    error.classification = "CONTRACT_SOURCE_UNAVAILABLE";
    error.extra = { detail: err.detail };
    throw error;
  }
  const [{ default: Ajv2020 }, formatsMod] = await Promise.all([
    import(pathToFileURL(ajv2020Path).href),
    import(pathToFileURL(formatsPath).href),
  ]);
  const addFormats = formatsMod.default || formatsMod;
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: true,
  });
  addFormats(ajv);
  cachedConsumerValidate = ajv.compile(schemaLoaded.value);
  return cachedConsumerValidate;
}

function structuredCloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoSecrets(envelope) {
  if (
    envelope.headers &&
    Object.keys(envelope.headers).some((k) => k.toLowerCase() === "authorization")
  ) {
    return {
      ok: false,
      classification: "BUILD_FAILED",
      reason: "Authorization header must not be present in the envelope",
    };
  }
  if (
    envelope.body &&
    (Object.prototype.hasOwnProperty.call(envelope.body, "provider") ||
      Object.prototype.hasOwnProperty.call(envelope.body, "provider_override"))
  ) {
    return {
      ok: false,
      classification: "BUILD_FAILED",
      reason: "provider override must be absent",
    };
  }
  if (
    !envelope.auth ||
    envelope.auth.authorization_value_included !== false ||
    envelope.auth.credential_required !== true ||
    envelope.auth.scheme !== "bearer" ||
    envelope.auth.source !== "existing_gateway_credential"
  ) {
    return {
      ok: false,
      classification: "BUILD_FAILED",
      reason: "auth marker must require existing Gateway bearer without including a value",
    };
  }
  const blob = JSON.stringify(envelope);
  if (/bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(blob)) {
    return {
      ok: false,
      classification: "BUILD_FAILED",
      reason: "Secret-boundary violation: bearer token material present in envelope",
    };
  }
  if (/"password"\s*:\s*"/i.test(blob) || /"api[_-]?key"\s*:\s*"/i.test(blob)) {
    return {
      ok: false,
      classification: "BUILD_FAILED",
      reason: "Secret-boundary violation: password/api key material present in envelope",
    };
  }
  return { ok: true };
}

/**
 * Build a deterministic request envelope from a consumer_input object.
 * Does not write stdout or exit.
 */
export async function buildRequestEnvelope(consumerInput) {
  let validate;
  try {
    validate = await loadConsumerInputValidate();
  } catch (err) {
    return {
      ok: false,
      classification: err.classification || "CONTRACT_SOURCE_UNAVAILABLE",
      reason: String(err.message || err),
      ...(err.extra || {}),
    };
  }

  if (consumerInput === null || typeof consumerInput !== "object" || Array.isArray(consumerInput)) {
    return {
      ok: false,
      classification: "INPUT_SCHEMA_INVALID",
      reason: "consumer_input root must be a JSON object",
      consumer_input_schema_path: CONSUMER_INPUT_SCHEMA_PATH,
    };
  }

  const valid = validate(consumerInput);
  if (!valid) {
    const errors = Array.isArray(validate.errors) ? validate.errors : [];
    const primary = errors[0] || { message: "validation failed" };
    return {
      ok: false,
      classification: "INPUT_SCHEMA_INVALID",
      reason: primary.message || "consumer_input failed schema validation",
      consumer_input_schema_path: CONSUMER_INPUT_SCHEMA_PATH,
      errors: errors.map((e) => ({
        keyword: e.keyword,
        instancePath: e.instancePath,
        message: e.message,
        params: e.params,
      })),
    };
  }

  const packetSchema = readJsonFile(
    EXECUTION_PACKET_SCHEMA_PATH,
    "CONTRACT_SOURCE_UNAVAILABLE",
  );
  if (!packetSchema.ok) {
    return packetSchema;
  }

  // Fixed key insertion order for byte-stable envelope construction.
  const envelope = {
    method: "POST",
    path: "/v1/responses",
    headers: {
      "x-openclaw-agent-id": "main",
    },
    auth: {
      credential_required: true,
      scheme: "bearer",
      source: "existing_gateway_credential",
      authorization_value_included: false,
    },
    body: {
      model: "openclaw/default",
      stream: false,
      instructions: PLANNER_INSTRUCTIONS,
      input: structuredCloneJson(consumerInput),
      tools: [
        {
          type: "function",
          name: "emit_execution_packet",
          description: TOOL_DESCRIPTION,
          parameters: structuredCloneJson(packetSchema.value),
        },
      ],
      tool_choice: {
        type: "function",
        name: "emit_execution_packet",
      },
    },
  };

  const secretCheck = assertNoSecrets(envelope);
  if (!secretCheck.ok) {
    return secretCheck;
  }

  return {
    ok: true,
    classification: "PASS",
    reason:
      "Deterministic OpenClaw /v1/responses request envelope built from validated consumer_input",
    consumer_input_schema_path: CONSUMER_INPUT_SCHEMA_PATH,
    execution_packet_schema_path: EXECUTION_PACKET_SCHEMA_PATH,
    envelope,
  };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    fail(
      "USAGE_ERROR",
      "Usage: node tools/build-openclaw-responses-request.mjs <consumer_input.json>",
    );
  }
  const abs = resolve(process.cwd(), inputPath);
  if (!existsSync(abs)) {
    fail("INPUT_SCHEMA_INVALID", `consumer_input file not found: ${abs}`, {
      path: abs,
    });
  }
  let consumerInput;
  try {
    consumerInput = JSON.parse(
      readFileSync(abs, "utf8").replace(/^\uFEFF/, ""),
    );
  } catch (err) {
    fail("INPUT_SCHEMA_INVALID", `consumer_input JSON parse failed: ${abs}`, {
      path: abs,
      detail: String(err.message || err),
    });
  }

  const result = await buildRequestEnvelope(consumerInput);
  emit(
    {
      ...result,
      consumer_input_path: abs,
    },
    result.ok ? 0 : 1,
  );
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((err) => {
    fail("BUILD_FAILED", String(err && err.stack ? err.stack : err));
  });
}
