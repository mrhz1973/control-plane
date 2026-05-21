#!/usr/bin/env node
/**
 * PM-31 — Codex worker contract dry-run (mock only; never invokes codex CLI).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BRIDGE_REQ = resolve(ROOT, "docs/examples/pm19-implementer-bridge-request.sample.json");
const BRIDGE_RES = resolve(ROOT, "docs/examples/pm19-implementer-bridge-result.sample.json");
const REQUEST_OUT = resolve(ROOT, "docs/examples/pm31-codex-worker-request.sample.json");
const RESULT_OUT = resolve(ROOT, "docs/examples/pm31-codex-worker-result.sample.json");

const FORBIDDEN =
  /Bearer\s|sk-[A-Za-z0-9]{8,}|"oauth_token"|"refresh_token"|"access_token"|api\.telegram\.org\/bot/i;

function readJson(path) {
  const raw = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function assertNoSecrets(obj, label) {
  const text = JSON.stringify(obj);
  if (FORBIDDEN.test(text)) {
    throw new Error(`${label}: forbidden secret-like pattern in output`);
  }
}

function buildRequest(bridgeReq, bridgeRes) {
  const preview =
    bridgeReq.prompt_preview?.slice(0, 200) ||
    "Short future Codex worker instruction preview only. Do not execute.";
  return {
    schema_version: "pm31-codex-worker-request-v1",
    source: "control-plane",
    mode: "mock-contract-only",
    target_worker: "codex-cli-future",
    repo: bridgeReq.repo || "mrhz1973/control-plane",
    branch_policy: "main-only-unless-future-gate",
    task_type: "docs-only",
    risk: bridgeRes.classifier_risk || bridgeReq.risk || "low",
    approval_required: bridgeReq.approval_required ?? false,
    input_artifacts: {
      bridge_request: "docs/examples/pm19-implementer-bridge-request.sample.json",
      bridge_result: "docs/examples/pm19-implementer-bridge-result.sample.json",
    },
    allowed_paths: ["docs/**", "tools/**"],
    forbidden_paths: [
      "workflows/exports/**",
      ".github/workflows/**",
      "package.json",
      "n8n runtime",
      "workflow 40",
      "workflow 41",
      "GIS",
      "DEV",
      "Alina",
    ],
    forbidden_actions: [
      "codex login",
      "OAuth token dump",
      "provider API key",
      "n8n edit",
      "automatic worker enable",
      "deploy",
      "rollback",
      "delete backup 41",
    ],
    prompt_preview: `${preview} [PM-31 contract preview — not executed.]`,
    worker_enabled: false,
    bridge_route: bridgeRes.classifier_route || bridgeReq.route,
    bridge_status: bridgeRes.status,
  };
}

function buildResult() {
  return {
    schema_version: "pm31-codex-worker-result-v1",
    source: "mock-worker",
    status: "contract_dry_run_pass",
    codex_invoked: false,
    oauth_login_performed: false,
    provider_api_key_used: false,
    worker_enabled: false,
    n8n_touched: false,
    workflow_40_touched: false,
    workflow_41_touched: false,
    would_require_future_gate: true,
    next_gate: "PM-33 OAuth/manual login gate before any real Codex invocation",
    notes: [
      "Codex CLI is available from PM-30, but no real prompt executed.",
      "This validates only request/result contract shape.",
    ],
  };
}

function main() {
  const bridgeReq = readJson(BRIDGE_REQ);
  const bridgeRes = readJson(BRIDGE_RES);
  const request = buildRequest(bridgeReq, bridgeRes);
  const result = buildResult();
  assertNoSecrets(request, "request");
  assertNoSecrets(result, "result");
  writeFileSync(REQUEST_OUT, JSON.stringify(request, null, 2) + "\n", "utf8");
  writeFileSync(RESULT_OUT, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ ok: true, status: result.status }, null, 2));
}

main();
