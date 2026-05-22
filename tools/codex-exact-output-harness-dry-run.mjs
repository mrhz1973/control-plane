#!/usr/bin/env node
/**
 * PM-37 — Exact-output harness dry-run (mock validator only; never invokes Codex).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REQUEST_OUT = resolve(ROOT, "docs/examples/pm37-codex-exact-output-request.sample.json");
const RESULT_OUT = resolve(ROOT, "docs/examples/pm37-codex-exact-output-result.sample.json");

const START = "CONTROL_PLANE_JSON_START";
const END = "CONTROL_PLANE_JSON_END";

const FORBIDDEN =
  /session id|id_token|access_token|refresh_token|Authorization|Bearer|api\.telegram\.org\/bot|sk-|oauth\/authorize|localhost:1455/i;

const REQUIRED_FIELDS = [
  "schema_version",
  "status",
  "target_file",
  "pm35_status",
  "file_modified",
  "git_command_used",
  "secret_accessed",
  "n8n_touched",
  "worker_enabled",
];

function assertNoSecrets(text, label) {
  if (FORBIDDEN.test(text)) {
    throw new Error(`${label}: forbidden secret-like pattern`);
  }
}

function buildRequest() {
  return {
    schema_version: "pm37-codex-exact-output-request-v1",
    source: "control-plane",
    mode: "mock-contract-only",
    target_worker: "codex-cli-future",
    purpose: "force structured output before any n8n integration",
    target_file: "docs/PM35_CODEX_NOOP_PROBE.md",
    expected_status: "PASS",
    output_contract: {
      format: "single_json_object_between_markers",
      start_marker: START,
      end_marker: END,
      required_fields: REQUIRED_FIELDS,
    },
    future_prompt_preview:
      "Read only docs/PM35_CODEX_NOOP_PROBE.md. Return only CONTROL_PLANE_JSON_START, one JSON object, CONTROL_PLANE_JSON_END. No prose.",
    worker_enabled: false,
    n8n_touched: false,
  };
}

function buildMockParsed() {
  return {
    schema_version: "pm37-codex-structured-output-v1",
    status: "pass",
    target_file: "docs/PM35_CODEX_NOOP_PROBE.md",
    pm35_status: "PASS",
    file_modified: false,
    git_command_used: false,
    secret_accessed: false,
    n8n_touched: false,
    worker_enabled: false,
  };
}

function buildMockRawOutput(parsed) {
  return `${START}\n${JSON.stringify(parsed)}\n${END}`;
}

function extractJsonBetweenMarkers(raw) {
  const startIdx = raw.indexOf(START);
  const endIdx = raw.indexOf(END);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
    throw new Error("markers not found or invalid order");
  }
  const between = raw.slice(startIdx + START.length, endIdx).trim();
  const objects = between.split(/\n+/).filter((l) => l.trim().startsWith("{"));
  if (objects.length !== 1) {
    throw new Error("expected single JSON object between markers");
  }
  return JSON.parse(objects[0]);
}

function validateParsed(parsed) {
  for (const f of REQUIRED_FIELDS) {
    if (!(f in parsed)) throw new Error(`missing field: ${f}`);
  }
  if (parsed.file_modified !== false) throw new Error("file_modified must be false");
  if (parsed.git_command_used !== false) throw new Error("git_command_used must be false");
  if (parsed.secret_accessed !== false) throw new Error("secret_accessed must be false");
  if (parsed.n8n_touched !== false) throw new Error("n8n_touched must be false");
  if (parsed.worker_enabled !== false) throw new Error("worker_enabled must be false");
}

function buildResult(mockRaw, parsed) {
  return {
    schema_version: "pm37-codex-exact-output-result-v1",
    source: "mock-validator",
    status: "contract_dry_run_pass",
    mock_raw_output: mockRaw,
    parsed_json: parsed,
    validation: {
      markers_found: true,
      single_json_object: true,
      required_fields_present: true,
      safe_negatives_true: true,
    },
    codex_invoked: false,
    oauth_login_performed: false,
    provider_api_key_used: false,
    worker_enabled: false,
    n8n_touched: false,
  };
}

function main() {
  const request = buildRequest();
  const parsed = buildMockParsed();
  const mockRaw = buildMockRawOutput(parsed);

  assertNoSecrets(JSON.stringify(request), "request");
  assertNoSecrets(mockRaw, "mock_raw");
  assertNoSecrets(JSON.stringify(parsed), "parsed");

  const extracted = extractJsonBetweenMarkers(mockRaw);
  validateParsed(extracted);
  if (JSON.stringify(extracted) !== JSON.stringify(parsed)) {
    throw new Error("extracted JSON does not match mock parsed");
  }

  const result = buildResult(mockRaw, parsed);
  assertNoSecrets(JSON.stringify(result), "result");

  writeFileSync(REQUEST_OUT, JSON.stringify(request, null, 2) + "\n", "utf8");
  writeFileSync(RESULT_OUT, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ ok: true, status: result.status }, null, 2));
}

main();
