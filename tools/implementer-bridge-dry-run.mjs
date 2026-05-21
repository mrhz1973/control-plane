#!/usr/bin/env node
/**
 * PM-19 — Implementer bridge dry-run (mock worker, no Codex, no n8n, no repo writes).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLASSIFIER_PATH = resolve(
  ROOT,
  "docs/examples/pm17-classifier-output.sample.json"
);
const PLAN_PATH = resolve(
  ROOT,
  "docs/plans/2026-05-21_2330_pm15-new-40-smoke.plan.md"
);
const REQUEST_OUT = resolve(
  ROOT,
  "docs/examples/pm19-implementer-bridge-request.sample.json"
);
const RESULT_OUT = resolve(
  ROOT,
  "docs/examples/pm19-implementer-bridge-result.sample.json"
);

const FORBIDDEN = /Bearer\s|sk-[A-Za-z0-9]|oauth_token|refresh_token|access_token|api[_-]?key/i;

function codexInPath() {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    execFileSync(cmd, ["codex"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

function promptPreview(planText, max = 240) {
  const lines = planText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const summary = lines.slice(0, 4).join(" ").replace(/\s+/g, " ");
  return summary.length > max ? summary.slice(0, max - 3) + "..." : summary;
}

function buildRequest(classifier, planPath, planText) {
  const planRel =
    classifier.input?.plan_path ||
    "docs/plans/2026-05-21_2330_pm15-new-40-smoke.plan.md";
  const codexAvailable = codexInPath();
  return {
    schema_version: "pm19-implementer-bridge-request-v1",
    source: "control-plane",
    classifier_schema: classifier.schema_version || "pm17-classifier-v1",
    route: classifier.route,
    risk: classifier.risk,
    approval_required: classifier.approval_required,
    target_worker: codexAvailable
      ? "codex-oauth-worker-future"
      : "mock-worker",
    repo: classifier.input?.repo || "mrhz1973/control-plane",
    plan_path: planRel,
    allowed_mode: classifier.task_type || "docs-only",
    forbidden: [
      "n8n runtime",
      "workflow 40",
      "GIS",
      "DEV",
      "Alina",
      "provider API",
      "secrets",
    ],
    prompt_preview: promptPreview(planText),
    notes: [
      "PM-19 dry-run only — no repo mutation, no Codex prompt execution",
      codexAvailable
        ? "Codex CLI in PATH but bridge still uses mock for this dry-run"
        : "Codex CLI not in PATH (PM-18 PENDING)",
    ],
  };
}

function buildResult(classifier, request) {
  const gate =
    classifier.approval_required === true ||
    classifier.risk === "high" ||
    classifier.risk === "medium" ||
    classifier.route !== "cursor-control-plane";

  if (gate) {
    return {
      schema_version: "pm19-implementer-bridge-result-v1",
      source: "control-plane",
      status: "gate_required",
      worker: request.target_worker,
      would_send_to_worker: false,
      would_require_telegram_gate: true,
      blocked_reason:
        classifier.blocked_reason ||
        "classifier requires approval or non-control-plane route",
      classifier_route: classifier.route,
      classifier_risk: classifier.risk,
      notes: ["dry-run: worker not invoked", "Telegram gate would run in future n8n"],
    };
  }

  return {
    schema_version: "pm19-implementer-bridge-result-v1",
    source: "control-plane",
    status: "dry_run_pass",
    worker: "mock-worker",
    would_send_to_worker: true,
    would_require_telegram_gate: false,
    blocked_reason: null,
    classifier_route: classifier.route,
    classifier_risk: classifier.risk,
    mock_worker_action: "validate handoff contract only — no file writes, no git ops",
    notes: [
      "PM-19 dry-run PASS for PM-17 sample (low risk, cursor-control-plane)",
      "Real Codex worker deferred until CLI/OAuth gate (PM-18)",
    ],
  };
}

function readJson(path) {
  let text = readFileSync(path, "utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return JSON.parse(text);
}

function main() {
  const classifier = readJson(CLASSIFIER_PATH);
  const planText = readFileSync(PLAN_PATH, "utf8");
  const request = buildRequest(classifier, PLAN_PATH, planText);
  const result = buildResult(classifier, request);

  for (const obj of [request, result]) {
    const t = JSON.stringify(obj);
    if (FORBIDDEN.test(t)) {
      process.stderr.write("refusing output with secret-like patterns\n");
      process.exit(1);
    }
  }

  writeFileSync(REQUEST_OUT, JSON.stringify(request, null, 2) + "\n", "utf8");
  writeFileSync(RESULT_OUT, JSON.stringify(result, null, 2) + "\n", "utf8");
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main();
