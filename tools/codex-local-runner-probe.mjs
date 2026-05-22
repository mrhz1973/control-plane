#!/usr/bin/env node
/**
 * PM-44 — Real local Codex runner probe (single codex.cmd invocation).
 * Raw stdout/stderr stay in memory only; never written to disk.
 */
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_OUT = resolve(
  ROOT,
  "docs/examples/pm44-codex-local-runner-probe-result.sample.json"
);

const STRICT_START = "CONTROL_PLANE_JSON_START";
const STRICT_END = "CONTROL_PLANE_JSON_END";
const EXPECTED_SCHEMA = "pm37-codex-structured-output-v1";
const TARGET_FILE = "docs/PM35_CODEX_NOOP_PROBE.md";

const REQUIRED = [
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

const FORBIDDEN =
  /session id|id_token|access_token|refresh_token|Authorization|Bearer|api\.telegram\.org\/bot|sk-|oauth\/authorize|localhost:1455|tokens used/i;

const PROMPT = `PM-44 REAL LOCAL RUNNER PROBE.

Read only this file:
docs/PM35_CODEX_NOOP_PROBE.md

Do not modify files.
Do not run git commands.
Do not access secrets.
Do not touch n8n.
Do not enable any worker.

Return a marker-delimited JSON block with exactly these markers and fields:
CONTROL_PLANE_JSON_START
{"schema_version":"pm37-codex-structured-output-v1","status":"pass","target_file":"docs/PM35_CODEX_NOOP_PROBE.md","pm35_status":"PASS","file_modified":false,"git_command_used":false,"secret_accessed":false,"n8n_touched":false,"worker_enabled":false}
CONTROL_PLANE_JSON_END

No alternative markers.
Do not rename fields.
Do not add fields.
Do not omit fields.`;

const POLICY_BLOCK =
  /BLOCKED_BY_TOOL_POLICY|tool policy|policy block|cannot run.*codex|nested.*codex/i;

const SCOPE_DRIFT =
  /\bgit\s+status\b|\bgit\s+diff\b|\brg\b|\bripgrep\b|workflows\/exports|PM-4[01]|multiple files|inspected the repo/i;

function hasForbidden(text) {
  return FORBIDDEN.test(text);
}

function extractStrictJson(raw) {
  const startIdx = raw.indexOf(STRICT_START);
  const endIdx = raw.indexOf(STRICT_END);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
    return { markers_found: false, parsed: null, json_valid: false };
  }
  const inner = raw
    .slice(startIdx + STRICT_START.length, endIdx)
    .trim()
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
  try {
    const parsed = JSON.parse(inner);
    return { markers_found: true, parsed, json_valid: true };
  } catch {
    return { markers_found: true, parsed: null, json_valid: false };
  }
}

function exactStrictSchema(json) {
  if (!json || typeof json !== "object") return false;
  const keys = Object.keys(json);
  if (keys.length !== REQUIRED.length) return false;
  for (const f of REQUIRED) {
    if (!(f in json)) return false;
  }
  if (json.schema_version !== EXPECTED_SCHEMA) return false;
  if (json.target_file !== TARGET_FILE) return false;
  if (json.pm35_status !== "PASS") return false;
  if (json.status !== "pass") return false;
  for (const f of [
    "file_modified",
    "git_command_used",
    "secret_accessed",
    "n8n_touched",
    "worker_enabled",
  ]) {
    if (json[f] !== false) return false;
  }
  return true;
}

function recoverableFromParsed(parsed) {
  if (!parsed || typeof parsed !== "object") return false;
  const mod = parsed.file_modified ?? parsed.modified_files;
  const git = parsed.git_command_used ?? parsed.git_commands;
  const sec = parsed.secret_accessed ?? parsed.secrets_accessed;
  const n8n = parsed.n8n_touched;
  const worker = parsed.worker_enabled ?? false;
  const target =
    parsed.target_file === TARGET_FILE ||
    parsed.file_read === TARGET_FILE;
  const pm35 =
    parsed.pm35_status === "PASS" ||
    parsed.status === "PASS";
  return (
    mod === false &&
    git === false &&
    sec === false &&
    n8n === false &&
    worker === false &&
    target &&
    pm35
  );
}

function classifyRun({ codex_invoked, runtime_executed, stdout, stderr, exitCode, spawnError }) {
  const combined = `${stdout}\n${stderr}`;
  const rawHasForbidden = hasForbidden(combined);
  const policyBlock = POLICY_BLOCK.test(combined);
  const scopeSignals = SCOPE_DRIFT.test(combined);

  if (spawnError || !codex_invoked) {
    return {
      classification: "blocked",
      strict_pass: false,
      markers_found: false,
      json_valid: false,
      schema_contract_pass: false,
      pm35_status: null,
      notes: ["codex.cmd did not start or spawn failed."],
    };
  }

  if (!runtime_executed || policyBlock) {
    return {
      classification: "blocked",
      strict_pass: false,
      markers_found: false,
      json_valid: false,
      schema_contract_pass: false,
      pm35_status: null,
      notes: ["Codex blocked or did not complete runtime."],
    };
  }

  const { markers_found, parsed, json_valid } = extractStrictJson(combined);
  const schema_contract_pass =
    markers_found && json_valid && exactStrictSchema(parsed);

  if (schema_contract_pass && !scopeSignals) {
    return {
      classification: "strict_pass",
      strict_pass: true,
      markers_found: true,
      json_valid: true,
      schema_contract_pass: true,
      pm35_status: "PASS",
      notes: [
        "Strict marker block present with PM-37 schema.",
        "PM-34 remains blocked pending separate gate.",
      ],
    };
  }

  if (schema_contract_pass && scopeSignals) {
    return {
      classification: "strict_pass",
      strict_pass: true,
      markers_found: true,
      json_valid: true,
      schema_contract_pass: true,
      pm35_status: "PASS",
      notes: [
        "Strict block validated; scope warning signals in transcript (not recorded).",
        "PM-34 remains blocked pending separate gate.",
      ],
    };
  }

  if (markers_found && json_valid && recoverableFromParsed(parsed)) {
    return {
      classification: "recoverable_partial",
      strict_pass: false,
      markers_found,
      json_valid,
      schema_contract_pass: false,
      pm35_status: parsed.pm35_status ?? parsed.status ?? null,
      notes: [
        "JSON recoverable but marker/schema contract drift.",
        "Not n8n-usable.",
      ],
    };
  }

  if (scopeSignals || (!markers_found && scopeSignals)) {
    return {
      classification: "fail_scope_drift",
      strict_pass: false,
      markers_found,
      json_valid,
      schema_contract_pass: false,
      pm35_status: parsed?.pm35_status ?? null,
      notes: [
        "Scope or format drift observed in runtime transcript.",
        "PM-34 remains blocked.",
      ],
    };
  }

  if (!markers_found && (combined.length > 200 || /read|inspect|search/i.test(combined))) {
    return {
      classification: "fail_scope_drift",
      strict_pass: false,
      markers_found: false,
      json_valid: false,
      schema_contract_pass: false,
      pm35_status: null,
      notes: [
        "No strict marker block; likely scope or format drift.",
        "PM-34 remains blocked.",
      ],
    };
  }

  return {
    classification: "fail",
    strict_pass: false,
    markers_found,
    json_valid,
    schema_contract_pass: false,
    pm35_status: parsed?.pm35_status ?? null,
    notes: [
      `Probe completed with exit code ${exitCode ?? "unknown"}.`,
      "PM-34 remains blocked.",
    ],
  };
}

function buildArtifact(classification, spawnMeta) {
  const strict_pass = classification.strict_pass === true;
  const artifact = {
    schema_version: "pm44-codex-local-runner-probe-result-v1",
    source: "local-runner",
    command_family: "codex.cmd exec",
    sandbox: "read-only",
    codex_invoked: spawnMeta.codex_invoked,
    runtime_executed: spawnMeta.runtime_executed,
    classification: classification.classification,
    strict_pass,
    pm34_unblocked: false,
    n8n_usable_future_artifact: strict_pass,
    target_file: TARGET_FILE,
    markers_found: classification.markers_found ?? false,
    json_valid: classification.json_valid ?? false,
    schema_contract_pass: classification.schema_contract_pass ?? false,
    pm35_status: classification.pm35_status ?? null,
    file_modified: false,
    git_command_used: false,
    secret_accessed: false,
    n8n_touched: false,
    worker_enabled: false,
    workflow_40_touched: false,
    workflow_41_touched: false,
    raw_runtime_metadata_redacted: spawnMeta.raw_runtime_metadata_redacted,
    raw_stdout_committed: false,
    raw_stderr_committed: false,
    notes: [
      "Raw stdout/stderr were not committed.",
      "PM-34 remains blocked pending separate gate.",
      ...(classification.notes ?? []),
    ],
  };

  const text = JSON.stringify(artifact, null, 2) + "\n";
  if (hasForbidden(text)) {
    throw new Error("artifact contains forbidden pattern — aborting write");
  }
  return artifact;
}

function runCodexOnce() {
  const args = ["exec", "--sandbox", "read-only", "--cd", ROOT, PROMPT];
  let spawnError = null;
  let result;

  try {
    result = spawnSync("codex.cmd", args, {
      cwd: ROOT,
      encoding: "utf8",
      shell: true,
      maxBuffer: 16 * 1024 * 1024,
      timeout: 600_000,
    });
  } catch (err) {
    spawnError = err;
    result = { status: null, stdout: "", stderr: String(err?.message ?? err) };
  }

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const combined = `${stdout}\n${stderr}`;
  const codex_invoked = !spawnError;
  const runtime_executed =
    codex_invoked && result.status !== null && !POLICY_BLOCK.test(combined);

  return {
    codex_invoked,
    runtime_executed,
    stdout,
    stderr,
    exitCode: result.status,
    spawnError,
    raw_runtime_metadata_redacted: hasForbidden(combined),
  };
}

function main() {
  console.log("PM-44: starting single codex.cmd exec probe...");
  const spawnMeta = runCodexOnce();
  const classification = classifyRun(spawnMeta);
  const artifact = buildArtifact(classification, spawnMeta);

  writeFileSync(ARTIFACT_OUT, JSON.stringify(artifact, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        classification: artifact.classification,
        strict_pass: artifact.strict_pass,
        codex_invoked: artifact.codex_invoked,
        pm34_unblocked: artifact.pm34_unblocked,
        artifact: "docs/examples/pm44-codex-local-runner-probe-result.sample.json",
      },
      null,
      2
    )
  );
}

main();
