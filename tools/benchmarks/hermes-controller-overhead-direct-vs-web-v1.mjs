#!/usr/bin/env node

/**
 * Explicit opt-in, non-production benchmark for the Codex subscription
 * controller.  It is deliberately not imported by the dispatcher and does
 * not expose a generic browser or MCP call surface.  It uses no OpenAI API,
 * API key, BYOK, GLM, or Qwen path.
 *
 * Run only with `node tools/benchmarks/hermes-controller-overhead-direct-vs-web-v1.mjs --run`.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import readline from "node:readline";
import {
  discoverLiveCatalog,
} from "../hermes-codex-dynamic-model-router-v1.mjs";

export const TASK_REF = "V4_HERMES_CONTROLLER_OVERHEAD_DIRECT_VS_WEB_BENCHMARK_V1";
export const MAX_CODEX_INFERENCE_TURNS = 6;
export const CASE_COUNT = 3;
export const ARMS = Object.freeze(["DIRECT", "HERMES_CONTROLLER"]);
export const CODEX_QUOTA_POOL = "chatgpt_codex_subscription";
export const HERMES_TOOL_SERVER = "hermes-tools";
export const HERMES_TOOL_NAME = "control_plane_chatgpt_composer_cdp";
export const GOVERNED_HERMES_OPERATIONS = Object.freeze([
  "DISCOVER_CHATGPT_TARGET",
  "GET_COMPOSER_STATE",
  "PREFILL_SINGLE_LINE",
  "CLEAR_COMPOSER",
]);
export const FIXTURE_PATH = "tests/fixtures/hermes-controller-overhead-v1.json";
export const REPORT_PATH = "reports/architecture/v4_hermes_controller_overhead_direct_vs_web_benchmark_v1.md";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const MAX_ERROR_LENGTH = 220;
const TURN_TIMEOUT_MS = 600_000;
const RPC_TIMEOUT_MS = 120_000;

function boundedError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[\r\n]+/g, " ").slice(0, MAX_ERROR_LENGTH);
}

function isFiniteNonNegativeInteger(value) {
  return Number.isInteger(value) && Number.isFinite(value) && value >= 0;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

export function loadFixture(fixturePath = path.join(ROOT, FIXTURE_PATH)) {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  validateFixture(fixture);
  return fixture;
}

export function validateFixture(fixture) {
  if (!fixture || typeof fixture !== "object" || Array.isArray(fixture)) {
    throw new Error("fixture must be an object");
  }
  if (fixture.schema_version !== "hermes-controller-overhead-fixture-v1") {
    throw new Error("fixture schema version mismatch");
  }
  if (!Array.isArray(fixture.cases) || fixture.cases.length !== CASE_COUNT) {
    throw new Error(`fixture must contain exactly ${CASE_COUNT} cases`);
  }
  const ids = new Set();
  for (const item of fixture.cases) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("fixture case must be an object");
    }
    if (typeof item.case_id !== "string" || !/^CASE_[ABC]$/.test(item.case_id)) {
      throw new Error("fixture case id is invalid");
    }
    if (ids.has(item.case_id)) throw new Error("fixture case ids must be unique");
    ids.add(item.case_id);
    if (typeof item.prompt !== "string" || !item.prompt || /[\r\n]/.test(item.prompt)) {
      throw new Error(`${item.case_id} must be non-empty single-line text`);
    }
    if (item.prompt.length > 4096) throw new Error(`${item.case_id} prompt is too long`);
  }
  if (ids.size !== CASE_COUNT) throw new Error("fixture must contain CASE_A, CASE_B, CASE_C");
  return true;
}

export function sanitizeUsage(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const fields = [
    ["input_tokens", "inputTokens"],
    ["cached_input_tokens", "cachedInputTokens"],
    ["output_tokens", "outputTokens"],
    ["reasoning_tokens", "reasoningOutputTokens"],
    ["total_tokens", "totalTokens"],
  ];
  const result = {};
  for (const [output, input] of fields) {
    if (isFiniteNonNegativeInteger(raw[input])) result[output] = raw[input];
  }
  return Object.keys(result).length ? result : null;
}

function extractUsageFromTokenUsage(value) {
  if (!value || typeof value !== "object") return null;
  return sanitizeUsage(value.last) ?? sanitizeUsage(value.total) ?? sanitizeUsage(value);
}

function extractUsageFromResponse(value) {
  if (!value || typeof value !== "object") return null;
  return (
    extractUsageFromTokenUsage(value.tokenUsage) ??
    extractUsageFromTokenUsage(value.usage) ??
    extractUsageFromTokenUsage(value.result?.tokenUsage) ??
    extractUsageFromTokenUsage(value.result?.usage) ??
    sanitizeUsage(value.result)
  );
}

export function computeTotal(usage) {
  if (!usage || !isFiniteNonNegativeInteger(usage.total_tokens)) return null;
  return usage.total_tokens;
}

export function computeRatioPct(hermesTotal, directTotal) {
  if (!isFiniteNonNegativeInteger(hermesTotal) || !isFiniteNonNegativeInteger(directTotal) || directTotal <= 0) {
    return null;
  }
  return Math.round((hermesTotal / directTotal) * 10000) / 100;
}

export function computeOutputRatioPct(hermesOutput, directOutput) {
  if (!isFiniteNonNegativeInteger(hermesOutput) || !isFiniteNonNegativeInteger(directOutput) || directOutput <= 0) {
    return null;
  }
  return Math.round((hermesOutput / directOutput) * 10000) / 100;
}

export function classifyRatio(ratio) {
  if (ratio === null) return "NOT_COMPUTABLE";
  if (ratio <= 30) return "STRONG_CANDIDATE";
  if (ratio <= 40) return "MIXED_NEEDS_MORE_EVIDENCE";
  if (ratio < 50) return "WEAK";
  return "POOR_FOR_QUOTA_SAVING_ONLY";
}

export function aggregateRatios(ratios) {
  if (!Array.isArray(ratios) || ratios.length !== CASE_COUNT || ratios.some((value) => value === null)) {
    return { mean: null, median: null, heuristic: "NOT_COMPUTABLE" };
  }
  const sorted = [...ratios].sort((a, b) => a - b);
  const mean = Math.round((sorted.reduce((sum, value) => sum + value, 0) / sorted.length) * 100) / 100;
  const median = sorted[1];
  return { mean, median, heuristic: classifyRatio(mean) };
}

export function sameModelInvariant(runs) {
  const ids = [...new Set((runs ?? []).map((run) => run.model_id).filter(Boolean))];
  return ids.length <= 1;
}

export function sanitizeEvidence(result) {
  return {
    case_id: result.case_id,
    arm: result.arm,
    model_id: result.model_id,
    usage: result.usage ?? null,
    elapsed_ms: isFiniteNonNegativeInteger(result.elapsed_ms) ? result.elapsed_ms : null,
    status: result.status,
    prompt_sha256: result.prompt_sha256,
    output_sha256: result.output_sha256 ?? null,
  };
}

function responseText(block) {
  if (!block || typeof block !== "object") return null;
  if (typeof block.text === "string") return block.text;
  return null;
}

function parseToolResult(item) {
  const result = item?.result;
  if (!result || typeof result !== "object") return null;
  const structured = result.structuredContent;
  if (structured && typeof structured === "object" && !Array.isArray(structured)) return structured;
  for (const content of Array.isArray(result.content) ? result.content : []) {
    const text = responseText(content);
    if (!text) continue;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      // Tool output is intentionally not persisted or echoed.
    }
  }
  return null;
}

export function validateHermesTrace(turn) {
  const items = Array.isArray(turn?.items) ? turn.items : [];
  const calls = items.filter((item) => item?.type === "mcpToolCall");
  const violations = [];
  const operations = [];
  const observations = [];
  for (const item of calls) {
    if (item.server !== HERMES_TOOL_SERVER || item.tool !== HERMES_TOOL_NAME) {
      violations.push("UNGOVERNED_HERMES_TOOL");
      continue;
    }
    const operation = item.arguments?.operation;
    if (!GOVERNED_HERMES_OPERATIONS.includes(operation)) {
      violations.push("UNGOVERNED_HERMES_OPERATION");
      continue;
    }
    operations.push(operation);
    const output = parseToolResult(item);
    if (output) observations.push({ operation, output });
    if (item.status !== "completed") violations.push("HERMES_TOOL_NOT_COMPLETED");
  }
  if (!calls.length) violations.push("NO_GOVERNED_HERMES_CALLS");
  if (!operations.includes("DISCOVER_CHATGPT_TARGET")) violations.push("TARGET_NOT_DISCOVERED");
  if (!operations.includes("GET_COMPOSER_STATE")) violations.push("COMPOSER_STATE_NOT_READ");
  if (!operations.includes("PREFILL_SINGLE_LINE")) violations.push("PREFILL_NOT_OBSERVED");
  if (!operations.includes("CLEAR_COMPOSER")) violations.push("COMPOSER_NOT_CLEARED");
  const prefills = observations.filter(({ operation }) => operation === "PREFILL_SINGLE_LINE");
  const clears = observations.filter(({ operation }) => operation === "CLEAR_COMPOSER");
  const states = observations.filter(({ operation }) => operation === "GET_COMPOSER_STATE");
  if (!prefills.some(({ output }) => output.ok === true)) violations.push("PREFILL_NOT_CONFIRMED");
  if (!clears.some(({ output }) => output.ok === true && output.empty === true && output.char_count === 0)) {
    violations.push("FINAL_CLEAR_NOT_CONFIRMED");
  }
  if (!states.some(({ output }) => output.ok === true && output.empty === true)) {
    violations.push("EMPTY_COMPOSER_NOT_OBSERVED");
  }
  return {
    ok: violations.length === 0,
    operations,
    violations: [...new Set(violations)].slice(0, 16),
    prefill_confirmed: prefills.some(({ output }) => output.ok === true),
    clear_confirmed: clears.some(({ output }) => output.ok === true && output.empty === true && output.char_count === 0),
    web_send_observed: false,
    web_turn_counts: "NOT_EXPOSED_BY_GOVERNED_ADAPTER",
  };
}

class AppServerRpc {
  constructor({ codexPath, cwd, timeoutMs = RPC_TIMEOUT_MS }) {
    this.codexPath = codexPath;
    this.cwd = cwd;
    this.timeoutMs = timeoutMs;
    this.pending = new Map();
    this.nextId = 1;
    this.bufferedNotifications = [];
    this.protocolViolation = null;
    this.child = null;
    this.rl = null;
  }

  async start() {
    const profile = process.env.USERPROFILE || os.homedir();
    const env = { ...process.env, CODEX_HOME: process.env.CODEX_HOME || path.join(profile, ".codex"), HOME: profile, USERPROFILE: profile };
    for (const key of [
      "CODEX_CI", "CODEX_INTERNAL_ORIGINATOR_OVERRIDE", "CODEX_PERMISSION_PROFILE",
      "CODEX_SANDBOX_NETWORK_DISABLED", "CODEX_SESSION_ID", "CODEX_THREAD_ID",
      "CODEX_APP_TOOLS_PIPE_PATH",
    ]) delete env[key];
    this.child = spawn(this.codexPath, ["app-server", "--stdio"], {
      cwd: this.cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    this.child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk.toString("utf8")}`.slice(-1000);
    });
    this.child.on("error", (error) => this.failPending(error));
    this.child.on("close", (code) => {
      if (code !== 0 && !this.protocolViolation) this.protocolViolation = `app-server exited with code ${code}`;
      this.failPending(new Error(this.protocolViolation || `app-server closed (${code})`));
    });
    this.rl = readline.createInterface({ input: this.child.stdout });
    this.rl.on("line", (line) => this.handleLine(line));
    await this.request("initialize", {
      clientInfo: { name: "control-plane-hermes-overhead-benchmark", version: "1.0.0" },
      capabilities: { experimentalApi: false },
    });
    this.notify("initialized");
    return { stderr_tail: stderr };
  }

  handleLine(line) {
    if (!line.trim()) return;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      this.protocolViolation = "app-server emitted non-JSON protocol data";
      return;
    }
    if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
      const pending = this.pending.get(String(message.id));
      if (!pending) return;
      this.pending.delete(String(message.id));
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(String(message.error.message || "app-server RPC error")));
      else pending.resolve(message.result);
      return;
    }
    if (message.method) {
      if (message.id !== undefined) {
        this.protocolViolation = `unexpected app-server server request: ${message.method}`;
        this.write({ id: message.id, error: { code: -32000, message: "benchmark client rejects server requests" } });
      } else {
        this.bufferedNotifications.push(message);
      }
    }
  }

  write(message) {
    if (!this.child?.stdin?.writable) throw new Error("app-server stdin is not writable");
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  notify(method, params) {
    const message = { method };
    if (params !== undefined) message.params = params;
    this.write(message);
  }

  request(method, params, timeoutMs = this.timeoutMs) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(String(id));
        reject(new Error(`app-server RPC timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(String(id), { resolve, reject, timer });
      try { this.write({ id, method, params }); } catch (error) {
        clearTimeout(timer);
        this.pending.delete(String(id));
        reject(error);
      }
    });
  }

  takeNotifications() {
    const current = this.bufferedNotifications;
    this.bufferedNotifications = [];
    return current;
  }

  async waitForTurn(threadId, turnId, timeoutMs = TURN_TIMEOUT_MS) {
    const deadline = Date.now() + timeoutMs;
    const notifications = [];
    while (Date.now() < deadline) {
      const current = this.takeNotifications();
      notifications.push(...current);
      const completed = current.find((message) =>
        message.method === "turn/completed" &&
        message.params?.threadId === threadId &&
        message.params?.turn?.id === turnId
      );
      if (completed) return { completed: completed.params.turn, notifications };
      if (this.protocolViolation) throw new Error(this.protocolViolation);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error("turn completion timeout");
  }

  failPending(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  async close() {
    if (!this.child) return;
    this.rl?.close();
    if (!this.child.killed) this.child.kill();
    this.child = null;
  }
}

function extractThread(result) {
  return result?.thread ?? result;
}

function extractTurn(result) {
  return result?.turn ?? result;
}

function makeDirectPrompt(item) {
  return `${item.prompt} Solve the synthetic task directly. Return only the bounded answer requested by the task; do not use tools, files, network, Hermes, or browser.`;
}

function makeHermesPrompt(item) {
  return `${item.prompt} Do not solve or answer this task. You are the HERMES_CONTROLLER benchmark arm. Use only the governed Hermes MCP tool ${HERMES_TOOL_NAME} on server ${HERMES_TOOL_SERVER}, and only these operations: DISCOVER_CHATGPT_TARGET, GET_COMPOSER_STATE, PREFILL_SINGLE_LINE, CLEAR_COMPOSER. Establish the bounded fresh-chat/composer precondition, prefill this exact single-line task, verify bounded evidence, then clear it and verify the composer is empty. Never send, submit, click send, press Enter, navigate, inspect cookies/storage, use raw CDP, use any other tool, or wait for a Web response. After the final clear, return only a short status marker.`;
}

function parseUsageFromNotifications(notifications) {
  let usage = null;
  for (const message of notifications) {
    if (message.method === "thread/tokenUsage/updated") {
      usage = extractUsageFromTokenUsage(message.params?.tokenUsage) ?? usage;
    }
  }
  return usage;
}

function parseMcpItems(turn) {
  return Array.isArray(turn?.items) ? turn.items.filter((item) => item?.type === "mcpToolCall") : [];
}

async function startThread(rpc, modelId) {
  const result = await rpc.request("thread/start", {
    model: modelId,
    cwd: ROOT,
    approvalPolicy: "never",
    sandbox: "read-only",
    ephemeral: true,
  });
  const thread = extractThread(result);
  if (!thread?.id || thread.model !== modelId) throw new Error("exact thread model invariant failed");
  return thread;
}

async function runProbe(rpc, { item, arm, modelId }) {
  const prompt = arm === "DIRECT" ? makeDirectPrompt(item) : makeHermesPrompt(item);
  const startedAt = Date.now();
  const thread = await startThread(rpc, modelId);
  const turnResult = await rpc.request("turn/start", {
    threadId: thread.id,
    input: [{ type: "text", text: prompt }],
    model: modelId,
    effort: "low",
    approvalPolicy: "never",
    sandboxPolicy: { type: "readOnly", networkAccess: false },
  });
  const turnStarted = extractTurn(turnResult);
  if (!turnStarted?.id) throw new Error("turn/start returned no turn id");
  const wait = await rpc.waitForTurn(thread.id, turnStarted.id);
  const completedTurn = wait.completed;
  const usage = parseUsageFromNotifications(wait.notifications);
  const duration = isFiniteNonNegativeInteger(completedTurn.durationMs)
    ? completedTurn.durationMs
    : Date.now() - startedAt;
  const base = {
    case_id: item.case_id,
    arm,
    model_id: modelId,
    usage,
    elapsed_ms: duration,
    status: completedTurn.status === "completed" ? "PASS" : "FAIL",
    prompt_sha256: sha256(item.prompt),
    output_sha256: null,
  };
  if (base.status !== "PASS") return { ...base, failure: "TURN_FAILED" };
  if (arm === "DIRECT") {
    const items = Array.isArray(completedTurn.items) ? completedTurn.items : [];
    if (items.some((entry) => ["mcpToolCall", "dynamicToolCall", "commandExecution", "webSearch"].includes(entry?.type))) {
      return { ...base, status: "FAIL", failure: "DIRECT_TOOL_USE_OBSERVED" };
    }
    return base;
  }
  const trace = validateHermesTrace(completedTurn);
  if (!trace.ok) return { ...base, status: "FAIL", failure: trace.violations.join(","), hermes_trace: trace };
  return { ...base, hermes_trace: trace };
}

function modelIsQualified(catalog) {
  // gpt-5.5 is the exact model ID with prior governed subscription
  // qualification; it is accepted only when the live model/list catalog
  // advertises it as selectable now.
  return catalog.models.find((model) => model.id === "gpt-5.5" && model.selectable) ?? null;
}

async function getHermesStatus(rpc, threadId) {
  const response = await rpc.request("mcpServerStatus/list", { detail: "full", limit: 100, threadId });
  const server = (response?.data ?? []).find((entry) => entry?.name === HERMES_TOOL_SERVER);
  const tools = Array.isArray(server?.tools) ? server.tools.map((tool) => tool?.name).filter(Boolean) : [];
  return {
    connected: server?.runtimeStatus === "connected",
    auth_status: typeof server?.authStatus === "string" ? server.authStatus : "UNKNOWN",
    tool_names: tools,
    // This app-server build reports the configured Hermes server but omits
    // its tool inventory.  The per-turn trace remains the authoritative
    // fail-closed check; a non-empty reported inventory must be exact.
    governed_only: tools.length === 0 ? null : tools.length === 1 && tools[0] === HERMES_TOOL_NAME,
    raw_tools_absent: !tools.some((name) => /^browser_|^Runtime\.|^Input\./.test(name)),
  };
}

export async function runBenchmark({
  codexPath = process.env.CODEX_BIN || "codex",
  fixturePath = path.join(ROOT, FIXTURE_PATH),
  reportPath = path.join(ROOT, REPORT_PATH),
} = {}) {
  const fixture = loadFixture(fixturePath);
  const rpc = new AppServerRpc({ codexPath, cwd: ROOT });
  const results = [];
  let modelId = null;
  let failure = null;
  let turnsStarted = 0;
  let hermesStatus = null;
  try {
    await rpc.start();
    const catalog = await discoverLiveCatalog(rpc);
    const model = modelIsQualified(catalog);
    if (!model) throw new Error("no currently selectable, previously qualified gpt-5.5 in live model/list catalog");
    modelId = model.id;
    for (const item of fixture.cases) {
      for (const arm of ARMS) {
        if (turnsStarted >= MAX_CODEX_INFERENCE_TURNS) throw new Error("MAX_CODEX_INFERENCE_TURNS exceeded");
        try {
          if (arm === "HERMES_CONTROLLER" && !hermesStatus) {
            const preflightThread = await startThread(rpc, modelId);
            hermesStatus = await getHermesStatus(rpc, preflightThread.id);
            if (!hermesStatus.connected || hermesStatus.governed_only === false || !hermesStatus.raw_tools_absent) {
              throw new Error("governed Hermes tool inventory is unavailable or not fail-closed");
            }
          }
          turnsStarted += 1;
          const result = await runProbe(rpc, { item, arm, modelId });
          results.push(result);
          if (result.status !== "PASS") throw new Error(result.failure || "probe failed");
        } catch (error) {
          const promptSha = sha256(item.prompt);
          results.push(sanitizeEvidence({
            case_id: item.case_id,
            arm,
            model_id: modelId,
            usage: null,
            elapsed_ms: null,
            status: "FAIL",
            prompt_sha256: promptSha,
            failure: boundedError(error),
          }));
          failure = `${item.case_id}/${arm}: ${boundedError(error)}`;
          break;
        }
      }
      if (failure) break;
    }
  } catch (error) {
    failure = boundedError(error);
  } finally {
    await rpc.close();
  }

  const direct = new Map(results.filter((run) => run.arm === "DIRECT").map((run) => [run.case_id, run]));
  const hermes = new Map(results.filter((run) => run.arm === "HERMES_CONTROLLER").map((run) => [run.case_id, run]));
  const ratios = fixture.cases.map((item) => computeRatioPct(computeTotal(hermes.get(item.case_id)?.usage), computeTotal(direct.get(item.case_id)?.usage)));
  const outputRatios = fixture.cases.map((item) => computeOutputRatioPct(
    hermes.get(item.case_id)?.usage?.output_tokens,
    direct.get(item.case_id)?.usage?.output_tokens,
  ));
  const aggregate = aggregateRatios(ratios);
  const report = {
    result: !failure && results.length === MAX_CODEX_INFERENCE_TURNS && results.every((run) => run.status === "PASS") ? "PASS" : "STOP",
    task_ref: TASK_REF,
    base_head: "93b28ff2c195333ae874ad293c8acf3717819775",
    model_id: modelId,
    cases: CASE_COUNT,
    codex_inference_turns: turnsStarted,
    direct_arm: results.filter((run) => run.arm === "DIRECT").length === CASE_COUNT && results.filter((run) => run.arm === "DIRECT").every((run) => run.status === "PASS") ? "PASS" : "STOP",
    hermes_controller_arm: results.filter((run) => run.arm === "HERMES_CONTROLLER").length === CASE_COUNT && results.filter((run) => run.arm === "HERMES_CONTROLLER").every((run) => run.status === "PASS") ? "PASS" : "STOP",
    hermes_prefill_only: true,
    chatgpt_web_sends: 0,
    vps_requests_sent: 0,
    glm_calls: 0,
    qwen_calls: 0,
    phase_d: "OPEN",
    production_routing_enabled: "NO",
    end_to_end_web_savings: "NOT_PROVEN",
    ratios,
    output_ratios: outputRatios,
    aggregate,
    hermes_status: hermesStatus,
    failure: failure ?? null,
    runs: results.map(sanitizeEvidence),
  };
  if (reportPath) writeReport(report, reportPath);
  return report;
}

function displayUsage(usage) {
  if (!usage) return "NOT_COMPUTABLE";
  return [usage.input_tokens, usage.output_tokens, usage.total_tokens].map((value) => value ?? "?").join("/");
}

export function writeReport(report, reportPath = path.join(ROOT, REPORT_PATH)) {
  const lines = [
    `# ${TASK_REF}`,
    "",
    `RESULT=${report.result}`,
    `TASK_REF=${report.task_ref}`,
    `BASE_HEAD=${report.base_head}`,
    `MODEL_ID=${report.model_id ?? "NOT_SELECTED"}`,
    `CASES=${report.cases}`,
    `CODEX_INFERENCE_TURNS=${report.codex_inference_turns}`,
    `DIRECT_ARM=${report.direct_arm}`,
    `HERMES_CONTROLLER_ARM=${report.hermes_controller_arm}`,
    "",
    "This is a non-production, explicit opt-in benchmark. It measures only the",
    "Codex controller arm and the governed Hermes PREFILL_ONLY controller arm.",
    "No ChatGPT Web answer was requested or generated.",
    "",
    "## Sanitized run evidence",
    "",
    "| CASE | DIRECT input/output/total | HERMES_CONTROLLER input/output/total | RATIO % | DIRECT elapsed | CONTROLLER elapsed | STATUS |",
    "|---|---:|---:|---:|---:|---:|---|",
  ];
  for (let index = 0; index < report.cases; index += 1) {
    const caseId = `CASE_${String.fromCharCode(65 + index)}`;
    const runs = report.runs.filter((run) => run.case_id === caseId);
    const direct = runs.find((run) => run.arm === "DIRECT");
    const hermes = runs.find((run) => run.arm === "HERMES_CONTROLLER");
    const ratio = report.ratios[index] === null || report.ratios[index] === undefined ? "NOT_COMPUTABLE" : report.ratios[index];
    lines.push(`| ${caseId} | ${displayUsage(direct?.usage)} | ${displayUsage(hermes?.usage)} | ${ratio} | ${direct?.elapsed_ms ?? "NOT_COMPUTABLE"} | ${hermes?.elapsed_ms ?? "NOT_COMPUTABLE"} | ${direct?.status ?? "NOT_RUN"}/${hermes?.status ?? "NOT_RUN"} |`);
  }
  lines.push(
    "",
    `MEAN_RATIO=${report.aggregate.mean ?? "NOT_COMPUTABLE"}`,
    `MEDIAN_RATIO=${report.aggregate.median ?? "NOT_COMPUTABLE"}`,
    `INTERPRETATION_HEURISTIC=${report.aggregate.heuristic}`,
    `END_TO_END_WEB_SAVINGS=${report.end_to_end_web_savings}`,
    "",
    `HERMES_PREFILL_ONLY=${report.hermes_prefill_only ? "YES" : "NO"}`,
    `CHATGPT_WEB_SENDS=${report.chatgpt_web_sends}`,
    `VPS_REQUESTS_SENT=${report.vps_requests_sent}`,
    `PRODUCTION_ROUTING_ENABLED=${report.production_routing_enabled}`,
    `PHASE_D=${report.phase_d}`,
    `GLM_CALLS=${report.glm_calls}`,
    `QWEN_CALLS=${report.qwen_calls}`,
    "",
    "The governed adapter exposes composer evidence only; user/assistant turn",
    "counts are not exposed by that capability. The no-send invariant therefore",
    "records CHATGPT_WEB_SENDS=0 and preserves PREFILL_ONLY without claiming a",
    "Phase D qualification or end-to-end Web savings.",
    "",
    "No prompt body, model output, chain-of-thought, cookie, token, credential,",
    "session material, browser storage, or raw tool output is persisted here.",
  );
  if (report.failure) lines.push("", `STOP_REASON=${report.failure}`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

if (process.argv.includes("--run")) {
  try {
    const report = await runBenchmark();
    console.log(JSON.stringify({
      RESULT: report.result,
      MODEL_ID: report.model_id,
      CASES: report.cases,
      CODEX_INFERENCE_TURNS: report.codex_inference_turns,
      DIRECT_ARM: report.direct_arm,
      HERMES_CONTROLLER_ARM: report.hermes_controller_arm,
      RATIOS: report.ratios,
      MEAN_RATIO: report.aggregate.mean,
      MEDIAN_RATIO: report.aggregate.median,
      HEURISTIC: report.aggregate.heuristic,
      STOP_REASON: report.failure,
    }));
    process.exitCode = report.result === "PASS" ? 0 : 2;
  } catch (error) {
    console.error(`STOP ${boundedError(error)}`);
    process.exitCode = 2;
  }
} else if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  console.log("OPT_IN_REQUIRED=USE --run");
}
