#!/usr/bin/env node
/**
 * classifier-wrapper-v1 — event-shaped Ollama classifier (C1a local runtime).
 * Transport: Ollama HTTP /api/generate only. Never ollama run.
 * Not PM-17 shaped. Not n8n wired. Not an implementer.
 */
import { readFileSync } from "node:fs";

export const DEFAULT_MODEL = "qwen3:14b";
export const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
export const DEFAULT_TIMEOUT_MS = 20_000;

const ALLOWED_DOCS_PREFIXES = [
  "docs/",
  "docs/foundation/",
  "docs/sessions/",
  "docs/contracts/",
  "docs/plans/",
  "docs/handoffs/",
];

const REQUIRED_INPUT_FIELDS = [
  "event_id",
  "event_type",
  "summary",
  "touched_paths",
  "runtime_flags",
  "secrets_flags",
  "deploy_flags",
  "n8n_flags",
  "automation_flags",
];

const REQUIRED_OUTPUT_FIELDS = [
  "risk",
  "route",
  "reason",
  "confidence",
  "requires_human",
];

const RISK_VALUES = new Set(["low", "medium", "high"]);
const ROUTE_VALUES = new Set(["auto_allowed", "human_gate", "blocked"]);
const CONFIDENCE_VALUES = new Set(["low", "medium", "high"]);

const SECRET_PATTERNS = [
  /credential/i,
  /auth/i,
  /billing/i,
  /token/i,
  /secret/i,
  /password/i,
  /\.env/i,
  /api[_-]?key/i,
];

const DEPLOY_PATTERNS = [/deploy/i, /rollback/i, /production/i];

export function buildGeneratePayload({ model, prompt, baseUrl = DEFAULT_BASE_URL }) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/generate`;
  return {
    url,
    body: {
      model,
      prompt,
      stream: false,
      think: false,
      format: "json",
    },
  };
}

function flagTouched(flags) {
  return Boolean(flags && flags.touched);
}

function pathsUnderAllowedDocs(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return false;
  return paths.every((p) => {
    const norm = String(p).replace(/\\/g, "/");
    return ALLOWED_DOCS_PREFIXES.some(
      (prefix) => norm === prefix.slice(0, -1) || norm.startsWith(prefix),
    );
  });
}

function textMatchesPatterns(text, patterns) {
  return patterns.some((re) => re.test(text));
}

function guardOutput({ risk, route, reason, confidence = "high", requires_human = true }) {
  return { risk, route, reason, confidence, requires_human };
}

export function evaluateGuards(input) {
  const summary = String(input.summary || "");
  const paths = Array.isArray(input.touched_paths) ? input.touched_paths : [];
  const combined = `${summary} ${paths.join(" ")}`;

  if (
    flagTouched(input.secrets_flags) ||
    textMatchesPatterns(combined, SECRET_PATTERNS)
  ) {
    return {
      action: "return",
      guardLevel: "high",
      output: guardOutput({
        risk: "high",
        route: "human_gate",
        reason: "guard:secrets_touched",
        requires_human: true,
      }),
    };
  }

  if (
    flagTouched(input.deploy_flags) ||
    textMatchesPatterns(combined, DEPLOY_PATTERNS)
  ) {
    return {
      action: "return",
      guardLevel: "high",
      output: guardOutput({
        risk: "high",
        route: "human_gate",
        reason: "guard:deploy_or_rollback",
        requires_human: true,
      }),
    };
  }

  const n8n = input.n8n_flags || {};
  if (n8n.workflow_40 === true || n8n.workflow_41 === true) {
    return {
      action: "return",
      guardLevel: "high",
      output: guardOutput({
        risk: "high",
        route: "human_gate",
        reason: "guard:workflow_40_41",
        requires_human: true,
      }),
    };
  }

  const automation = input.automation_flags || {};
  if (automation.autonomous_worker === true || automation.commit_push_loop === true) {
    return {
      action: "return",
      guardLevel: "high",
      output: guardOutput({
        risk: "high",
        route: "human_gate",
        reason: "guard:autonomous_worker",
        requires_human: true,
      }),
    };
  }

  const anyRuntimeFlags =
    flagTouched(input.runtime_flags) ||
    flagTouched(input.deploy_flags) ||
    flagTouched(input.secrets_flags) ||
    flagTouched(input.n8n_flags) ||
    flagTouched(input.automation_flags);

  if (pathsUnderAllowedDocs(paths) && !anyRuntimeFlags) {
    return { action: "model", guardLevel: "low" };
  }

  if (
    n8n.touched === true &&
    n8n.import_disabled === true &&
    n8n.workflow_40 !== true &&
    n8n.workflow_41 !== true
  ) {
    return { action: "model", guardLevel: "medium" };
  }

  return { action: "model", guardLevel: null };
}

export function fallbackOutput(reason) {
  return {
    risk: "high",
    route: "human_gate",
    reason,
    confidence: "low",
    requires_human: true,
  };
}

function riskRank(risk) {
  if (risk === "high") return 3;
  if (risk === "medium") return 2;
  if (risk === "low") return 1;
  return 0;
}

export function validateAndNormalizeOutput(parsed, guardContext) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return fallbackOutput("fallback:invalid_json");
  }

  for (const key of REQUIRED_OUTPUT_FIELDS) {
    if (!(key in parsed)) {
      return fallbackOutput("fallback:missing_keys");
    }
  }

  const { risk, route, reason, confidence, requires_human } = parsed;

  if (!RISK_VALUES.has(risk)) {
    return fallbackOutput("fallback:risk_out_of_schema");
  }
  if (!ROUTE_VALUES.has(route)) {
    return fallbackOutput("fallback:route_out_of_schema");
  }
  if (!CONFIDENCE_VALUES.has(confidence)) {
    return fallbackOutput("fallback:confidence_out_of_schema");
  }
  if (typeof requires_human !== "boolean") {
    return fallbackOutput("fallback:missing_keys");
  }

  let out = {
    risk,
    route,
    reason: String(reason),
    confidence,
    requires_human,
  };

  if (confidence === "low") {
    out.route = "human_gate";
    out.requires_human = true;
    if (!out.reason.includes("confidence:low")) {
      out.reason = `${out.reason}; confidence:low forces human_gate`.trim();
    }
  }

  const guardLevel = guardContext?.guardLevel;
  if (guardLevel === "high") {
    if (out.route === "auto_allowed" || out.requires_human === false || riskRank(out.risk) < 3) {
      return fallbackOutput("fallback:guard_model_mismatch");
    }
  } else if (guardLevel === "medium") {
    if (out.route === "auto_allowed" && out.requires_human === false) {
      return {
        ...out,
        route: "human_gate",
        requires_human: true,
        reason: `${out.reason}; fallback:elevated_guard`.trim(),
      };
    }
    if (riskRank(out.risk) < 2) {
      return {
        ...out,
        risk: "medium",
        route: "human_gate",
        requires_human: true,
        reason: `${out.reason}; fallback:elevated_guard`.trim(),
      };
    }
  }

  return out;
}

export function parseModelResponse(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, error: "empty" };
  }
  try {
    return { ok: true, value: JSON.parse(raw.trim()) };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

function buildModelPrompt(input) {
  return [
    "You are a control-plane event classifier. Respond with ONLY valid JSON.",
    "Output schema fields: risk (low|medium|high), route (auto_allowed|human_gate|blocked), reason (string, no secrets), confidence (low|medium|high), requires_human (boolean).",
    "Do not include chain-of-thought or extra fields.",
    "Input event JSON:",
    JSON.stringify(input),
  ].join("\n");
}

export function validateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be a JSON object");
  }
  for (const field of REQUIRED_INPUT_FIELDS) {
    if (!(field in input)) {
      throw new Error(`missing required input field: ${field}`);
    }
  }
  if (!Array.isArray(input.touched_paths)) {
    throw new Error("touched_paths must be an array");
  }
  return input;
}

async function ollamaReachable(baseUrl, timeoutMs = 3000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: ctrl.signal,
    });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function callOllamaGenerate({ baseUrl, model, prompt, timeoutMs }) {
  const { url, body } = buildGeneratePayload({ model, prompt, baseUrl });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      throw new Error(`ollama http ${r.status}`);
    }
    const data = await r.json();
    return String(data.response || "").trim();
  } finally {
    clearTimeout(timer);
  }
}

export async function classifyEvent(input, options = {}) {
  const validated = validateInput(input);
  const guardResult = evaluateGuards(validated);

  if (guardResult.action === "return") {
    return guardResult.output;
  }

  const guardContext = { guardLevel: guardResult.guardLevel };

  if (options.mock === true) {
    const raw = options.mockResponse;
    if (typeof raw === "string") {
      const parsed = parseModelResponse(raw);
      if (!parsed.ok) {
        return fallbackOutput("fallback:invalid_json");
      }
      return validateAndNormalizeOutput(parsed.value, guardContext);
    }
    if (raw && typeof raw === "object") {
      return validateAndNormalizeOutput(raw, guardContext);
    }
    return fallbackOutput("fallback:model_error");
  }

  const baseUrl = options.baseUrl || process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL;
  const model = options.model || process.env.OLLAMA_MODEL || DEFAULT_MODEL;
  const timeoutMs = options.timeoutMs || Number(process.env.OLLAMA_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  if (!(await ollamaReachable(baseUrl))) {
    return fallbackOutput("fallback:model_error");
  }

  try {
    const prompt = buildModelPrompt(validated);
    const raw = await callOllamaGenerate({ baseUrl, model, prompt, timeoutMs });
    const parsed = parseModelResponse(raw);
    if (!parsed.ok) {
      return fallbackOutput("fallback:invalid_json");
    }
    return validateAndNormalizeOutput(parsed.value, guardContext);
  } catch {
    return fallbackOutput("fallback:model_error");
  }
}

function parseArgs(argv) {
  const opts = {
    inputFile: null,
    inputJson: null,
    mock: false,
    mockResponse: null,
    pretty: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--input-file" && argv[i + 1]) {
      opts.inputFile = argv[++i];
    } else if (arg === "--input-json" && argv[i + 1]) {
      opts.inputJson = argv[++i];
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
  node tools/classifier-wrapper-v1.mjs --input-file <path.json> [--mock] [--mock-response '<json>'] [--pretty]
  node tools/classifier-wrapper-v1.mjs --input-json '<json>' [--mock] [--mock-response '<json>'] [--pretty]

Environment overrides: OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS
`);
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.inputFile && !opts.inputJson) {
    process.stderr.write("error: --input-file or --input-json required\n");
    printHelp();
    process.exit(1);
  }

  let rawInput;
  if (opts.inputFile) {
    rawInput = readFileSync(opts.inputFile, "utf8");
  } else {
    rawInput = opts.inputJson;
  }

  let input;
  try {
    input = validateInput(JSON.parse(rawInput));
  } catch (err) {
    process.stderr.write(`error: invalid input JSON: ${err.message}\n`);
    process.exit(1);
  }

  let mockResponse = opts.mockResponse;
  if (typeof mockResponse === "string") {
    try {
      mockResponse = JSON.parse(mockResponse);
    } catch {
      // keep raw string for invalid-json tests
    }
  }

  const out = await classifyEvent(input, {
    mock: opts.mock,
    mockResponse,
  });

  const text = opts.pretty ? JSON.stringify(out, null, 2) : JSON.stringify(out);
  process.stdout.write(`${text}\n`);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("classifier-wrapper-v1.mjs") ||
    process.argv[1].replace(/\\/g, "/").endsWith("tools/classifier-wrapper-v1.mjs"));

if (isMain) {
  main().catch((err) => {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(1);
  });
}
