#!/usr/bin/env node
/**
 * qwen-local-adapter-v1 — reusable structured interface for logical qwen_local.
 *
 * Roles: planner | routing_arbiter | reviewer | classifier
 * Transport: shared ollama-json-client-v1 (no duplicate Ollama client).
 * Does not route, dispatch harnesses, or replace classifier-wrapper-v1.
 *
 * Usage:
 *   node tools/qwen-local-adapter-v1.mjs --request-file <path.json> --mock --mock-response '<json>'
 */
import { readFileSync } from "node:fs";
import {
  callOllamaGenerate,
  ollamaReachable,
  parseJsonModelResponse as parseOllamaJson,
  resolveOllamaConfig,
} from "./ollama-json-client-v1.mjs";
import {
  callLlamaCppChat,
  llamaCppReachable,
  parseJsonModelResponse as parseLlamaCppJson,
  resolveLlamaCppConfig,
} from "./llama-cpp-json-client-v1.mjs";
import {
  getProfile,
  loadQwenLocalRuntime,
  resolveQwenLocalBackend,
  validateBackend,
  validateRuntimeDocument,
} from "./qwen-local-runtime-v1.mjs";

export {
  resolveQwenLocalBackend,
  validateBackend,
} from "./qwen-local-runtime-v1.mjs";
export { resolveLlamaCppConfig } from "./llama-cpp-json-client-v1.mjs";
export { resolveOllamaConfig } from "./ollama-json-client-v1.mjs";

export const REQUEST_SCHEMA = "qwen-local-adapter-request-v1";
export const RESULT_SCHEMA = "qwen-local-adapter-result-v1";
export const LOGICAL_RESOURCE = "qwen_local";

export const ROLES = Object.freeze([
  "planner",
  "routing_arbiter",
  "reviewer",
  "classifier",
]);

const ROLE_SET = new Set(ROLES);
const CONFIDENCE_SET = new Set(["low", "medium", "high", "unknown"]);
const PROP_TYPES = new Set([
  "string",
  "number",
  "boolean",
  "object",
  "array",
  "null",
]);

function envelope({
  request_id = null,
  role = null,
  ok,
  classification,
  result = null,
  confidence = "unknown",
}) {
  return {
    schema_version: RESULT_SCHEMA,
    request_id,
    role,
    ok,
    classification,
    result,
    confidence,
  };
}

function fail(classification, partial = {}) {
  return envelope({
    ok: false,
    classification,
    result: null,
    confidence: "unknown",
    ...partial,
  });
}

export function validateAdapterRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, classification: "INVALID_INPUT", reason: "request must be a JSON object" };
  }
  if (input.schema_version !== REQUEST_SCHEMA) {
    return {
      ok: false,
      classification: "INVALID_INPUT",
      reason: "schema_version must be qwen-local-adapter-request-v1",
      request_id: typeof input.request_id === "string" ? input.request_id : null,
      role: ROLE_SET.has(input.role) ? input.role : null,
    };
  }
  if (typeof input.request_id !== "string" || !input.request_id.trim()) {
    return {
      ok: false,
      classification: "INVALID_INPUT",
      reason: "request_id required non-empty string",
      role: ROLE_SET.has(input.role) ? input.role : null,
    };
  }
  if (!ROLE_SET.has(input.role)) {
    return {
      ok: false,
      classification: "INVALID_INPUT",
      reason: "role must be planner|routing_arbiter|reviewer|classifier",
      request_id: input.request_id,
    };
  }
  if (typeof input.instruction !== "string" || !input.instruction.trim()) {
    return {
      ok: false,
      classification: "INVALID_INPUT",
      reason: "instruction required non-empty string",
      request_id: input.request_id,
      role: input.role,
    };
  }
  if (!input.context || typeof input.context !== "object" || Array.isArray(input.context)) {
    return {
      ok: false,
      classification: "INVALID_INPUT",
      reason: "context must be a JSON object",
      request_id: input.request_id,
      role: input.role,
    };
  }
  const oc = input.output_contract;
  if (!oc || typeof oc !== "object" || Array.isArray(oc)) {
    return {
      ok: false,
      classification: "INVALID_INPUT",
      reason: "output_contract must be a JSON object",
      request_id: input.request_id,
      role: input.role,
    };
  }
  if (!Array.isArray(oc.required) || !oc.properties || typeof oc.properties !== "object") {
    return {
      ok: false,
      classification: "INVALID_INPUT",
      reason: "output_contract requires required[] and properties{}",
      request_id: input.request_id,
      role: input.role,
    };
  }
  return { ok: true, value: input };
}

function jsType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/**
 * Minimal deterministic output_contract checker (not a general schema platform).
 */
export function validateAgainstOutputContract(resultObj, outputContract) {
  if (!resultObj || typeof resultObj !== "object" || Array.isArray(resultObj)) {
    return { ok: false, reason: "result must be a JSON object" };
  }

  const required = Array.isArray(outputContract.required) ? outputContract.required : [];
  const properties =
    outputContract.properties && typeof outputContract.properties === "object"
      ? outputContract.properties
      : {};
  const allowAdditional = outputContract.additionalProperties !== false;

  for (const key of required) {
    if (!(key in resultObj)) {
      return { ok: false, reason: `missing required field: ${key}` };
    }
  }

  if (!allowAdditional) {
    for (const key of Object.keys(resultObj)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        return { ok: false, reason: `unexpected additional property: ${key}` };
      }
    }
  }

  for (const [key, spec] of Object.entries(properties)) {
    if (!(key in resultObj)) continue;
    if (!spec || typeof spec !== "object") continue;
    const value = resultObj[key];
    if (Object.prototype.hasOwnProperty.call(spec, "type") && PROP_TYPES.has(spec.type)) {
      if (jsType(value) !== spec.type) {
        return { ok: false, reason: `field ${key} type mismatch` };
      }
    }
    if (Array.isArray(spec.enum) && spec.enum.length > 0) {
      if (!spec.enum.some((allowed) => Object.is(allowed, value))) {
        return { ok: false, reason: `field ${key} enum mismatch` };
      }
    }
  }

  return { ok: true };
}

function rolePreamble(role) {
  switch (role) {
    case "planner":
      return "You are a local planning model. Produce ONLY the structured planning JSON requested by the output contract. Do not choose implementers or invent resources.";
    case "routing_arbiter":
      return "You are a local routing arbiter. Evaluate ONLY the supplied candidate choices/context. Never invent unavailable resources. Do not execute routing side effects.";
    case "reviewer":
      return "You are a local reviewer. Return ONLY structured findings/verdict matching the output contract. No chain-of-thought.";
    case "classifier":
      return "You are a generic local classifier. Return ONLY structured classification JSON matching the output contract. You do not replace classifier-wrapper-v1.";
    default:
      return "Respond with ONLY valid JSON matching the output contract.";
  }
}

export function buildAdapterPrompt(request) {
  return [
    rolePreamble(request.role),
    "Respond with ONLY valid JSON. No markdown. No chain-of-thought. No secrets.",
    `Role: ${request.role}`,
    "Instruction:",
    request.instruction,
    "Context JSON:",
    JSON.stringify(request.context),
    "Output contract JSON:",
    JSON.stringify(request.output_contract),
  ].join("\n");
}

function normalizeConfidence(value) {
  if (CONFIDENCE_SET.has(value)) return value;
  return "unknown";
}

function stripConfidence(resultObj) {
  if (!resultObj || typeof resultObj !== "object") return { body: resultObj, confidence: "unknown" };
  if (!("confidence" in resultObj)) {
    return { body: resultObj, confidence: "unknown" };
  }
  const confidence = normalizeConfidence(resultObj.confidence);
  const body = { ...resultObj };
  // Keep confidence in result if contract requires/allows it; also surface envelope confidence.
  return { body, confidence };
}

async function obtainModelObject(request, options) {
  if (options.mock === true) {
    const raw = options.mockResponse;
    if (typeof raw === "string") {
      const parsed = parseOllamaJson(raw);
      if (!parsed.ok) {
        return { ok: false, classification: "INVALID_JSON" };
      }
      return { ok: true, value: parsed.value };
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return { ok: true, value: raw };
    }
    return { ok: false, classification: "MODEL_ERROR" };
  }

  const backendRaw = resolveQwenLocalBackend(options);
  const backendCheck = validateBackend(backendRaw);
  if (!backendCheck.ok) {
    return { ok: false, classification: "INVALID_INPUT" };
  }
  const backend = backendCheck.backend;

  const prompt = buildAdapterPrompt(request);

  if (backend === "ollama") {
    const { baseUrl, model, timeoutMs } = resolveOllamaConfig(options);
    if (!(await ollamaReachable(baseUrl))) {
      return { ok: false, classification: "MODEL_UNAVAILABLE" };
    }
    try {
      const raw = await callOllamaGenerate({ baseUrl, model, prompt, timeoutMs });
      const parsed = parseOllamaJson(raw);
      if (!parsed.ok) {
        return { ok: false, classification: "INVALID_JSON" };
      }
      if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
        return { ok: false, classification: "INVALID_JSON" };
      }
      return { ok: true, value: parsed.value };
    } catch {
      return { ok: false, classification: "MODEL_ERROR" };
    }
  }

  // Primary: llama_cpp (DFlash2 required at runtime profile / server preset level)
  let runtime;
  try {
    runtime = loadQwenLocalRuntime();
  } catch {
    return { ok: false, classification: "MODEL_UNAVAILABLE" };
  }
  const runtimeOk = validateRuntimeDocument(runtime);
  if (!runtimeOk.ok) {
    return { ok: false, classification: "MODEL_UNAVAILABLE" };
  }

  const profileId = options.profile || runtime.default_profile || "fast_8k";
  const profileCheck = getProfile(runtime, profileId);
  if (!profileCheck.ok) {
    return { ok: false, classification: "MODEL_UNAVAILABLE" };
  }

  const cfg = resolveLlamaCppConfig({
    ...options,
    model:
      options.model ||
      process.env.QWEN_LOCAL_MODEL ||
      profileCheck.profile.llama_cpp_model_id,
    baseUrl:
      options.baseUrl ||
      process.env.QWEN_LOCAL_BASE_URL ||
      runtime.launcher?.base_url,
  });

  if (!(await llamaCppReachable(cfg.baseUrl))) {
    return { ok: false, classification: "MODEL_UNAVAILABLE" };
  }

  try {
    const raw = await callLlamaCppChat({
      baseUrl: cfg.baseUrl,
      model: cfg.model,
      prompt,
      timeoutMs: cfg.timeoutMs,
    });
    const parsed = parseLlamaCppJson(raw);
    if (!parsed.ok) {
      return { ok: false, classification: "INVALID_JSON" };
    }
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
      return { ok: false, classification: "INVALID_JSON" };
    }
    return { ok: true, value: parsed.value };
  } catch {
    return { ok: false, classification: "MODEL_ERROR" };
  }
}

/**
 * Execute one adapter request. Default path never invents live status.
 * Prefer options.mock for offline tests (zero Ollama generate calls).
 */
export async function runQwenLocalAdapter(request, options = {}) {
  const validated = validateAdapterRequest(request);
  if (!validated.ok) {
    return fail(validated.classification, {
      request_id: validated.request_id ?? null,
      role: validated.role ?? null,
    });
  }

  const req = validated.value;
  const modelObj = await obtainModelObject(req, options);
  if (!modelObj.ok) {
    return fail(modelObj.classification, {
      request_id: req.request_id,
      role: req.role,
    });
  }

  const contractCheck = validateAgainstOutputContract(
    modelObj.value,
    req.output_contract,
  );
  if (!contractCheck.ok) {
    return fail("OUTPUT_CONTRACT_MISMATCH", {
      request_id: req.request_id,
      role: req.role,
    });
  }

  const { body, confidence } = stripConfidence(modelObj.value);
  return envelope({
    request_id: req.request_id,
    role: req.role,
    ok: true,
    classification: "LOCAL_MODEL_RESULT",
    result: body,
    confidence,
  });
}

function parseArgs(argv) {
  const opts = {
    requestFile: null,
    requestJson: null,
    mock: false,
    mockResponse: null,
    pretty: false,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--request-file" && argv[i + 1]) {
      opts.requestFile = argv[++i];
    } else if (arg === "--request-json" && argv[i + 1]) {
      opts.requestJson = argv[++i];
    } else if (arg === "--mock") {
      opts.mock = true;
    } else if (arg === "--mock-response" && argv[i + 1]) {
      opts.mockResponse = argv[++i];
      opts.mock = true;
    } else if (arg === "--pretty") {
      opts.pretty = true;
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return opts;
}

function printHelp() {
  process.stderr.write(`Usage:
  node tools/qwen-local-adapter-v1.mjs --request-file <path.json> [--mock] [--mock-response '<json>'] [--pretty]
  node tools/qwen-local-adapter-v1.mjs --request-json '<json>' [--mock] [--mock-response '<json>'] [--pretty]

Backends: llama_cpp (default/primary) | ollama (compatibility)
Env: QWEN_LOCAL_BACKEND, QWEN_LOCAL_BASE_URL, QWEN_LOCAL_MODEL, QWEN_LOCAL_TIMEOUT_MS
Ollama compatibility env: OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS
Logical resource: qwen_local
`);
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }
  if (!opts.requestFile && !opts.requestJson) {
    process.stderr.write("error: --request-file or --request-json required\n");
    printHelp();
    process.exit(1);
  }

  const raw = opts.requestFile
    ? readFileSync(opts.requestFile, "utf8")
    : opts.requestJson;
  let request;
  try {
    request = JSON.parse(raw);
  } catch {
    const out = fail("INVALID_INPUT");
    process.stdout.write(`${JSON.stringify(out)}\n`);
    process.exit(1);
  }

  let mockResponse = opts.mockResponse;
  if (typeof mockResponse === "string") {
    try {
      mockResponse = JSON.parse(mockResponse);
    } catch {
      // keep raw string for INVALID_JSON tests
    }
  }

  const out = await runQwenLocalAdapter(request, {
    mock: opts.mock,
    mockResponse,
  });
  const text = opts.pretty ? JSON.stringify(out, null, 2) : JSON.stringify(out);
  process.stdout.write(`${text}\n`);
  process.exit(out.ok ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("qwen-local-adapter-v1.mjs") ||
    process.argv[1].replace(/\\/g, "/").endsWith("tools/qwen-local-adapter-v1.mjs"));

if (isMain) {
  main().catch((err) => {
    process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}
