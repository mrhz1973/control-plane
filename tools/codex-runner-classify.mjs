/**
 * Shared Codex runner classification (PM-44/45/46).
 * Pure logic — no shell, no Codex invocation.
 */

export const STRICT_START = "CONTROL_PLANE_JSON_START";
export const STRICT_END = "CONTROL_PLANE_JSON_END";
export const EXPECTED_SCHEMA = "pm37-codex-structured-output-v1";
export const TARGET_FILE = "docs/PM35_CODEX_NOOP_PROBE.md";

export const REQUIRED = [
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

export const FORBIDDEN =
  /session id|id_token|access_token|refresh_token|Authorization|Bearer|api\.telegram\.org\/bot|sk-|oauth\/authorize|localhost:1455|tokens used/i;

export const POLICY_BLOCK =
  /BLOCKED_BY_TOOL_POLICY|tool policy|policy block|cannot run.*codex|nested.*codex/i;

export const SCOPE_DRIFT =
  /\bgit\s+status\b|\bgit\s+diff\b|\brg\b|\bripgrep\b|workflows\/exports|PM-4[01]|multiple files|inspected the repo/i;

/** PM-44 observed: exit 2 with no markers — CLI/nonzero exit, not scope drift. */
export const FAILURE_MODES = {
  RUNNER_SPAWN_FAIL: "runner_spawn_fail",
  POLICY_BLOCK: "policy_block",
  CLI_EXIT_NONZERO: "cli_exit_nonzero",
  NO_STRICT_MARKERS: "no_strict_markers",
  MALFORMED_JSON: "malformed_json",
  SCOPE_DRIFT: "scope_drift",
  OUTPUT_NONCONFORMANT: "output_nonconformant",
  STRICT_PASS: "strict_pass",
};

export function hasForbidden(text) {
  return FORBIDDEN.test(text);
}

export function extractStrictJson(raw) {
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

export function exactStrictSchema(json) {
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
    parsed.target_file === TARGET_FILE || parsed.file_read === TARGET_FILE;
  const pm35 = parsed.pm35_status === "PASS" || parsed.status === "PASS";
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

function inferFailureMode({
  classification,
  markers_found,
  json_valid,
  exitCode,
  policyBlock,
  scopeSignals,
}) {
  if (classification === "strict_pass") return FAILURE_MODES.STRICT_PASS;
  if (classification === "blocked") {
    return policyBlock ? FAILURE_MODES.POLICY_BLOCK : FAILURE_MODES.RUNNER_SPAWN_FAIL;
  }
  if (classification === "fail_scope_drift") return FAILURE_MODES.SCOPE_DRIFT;
  if (markers_found && !json_valid) return FAILURE_MODES.MALFORMED_JSON;
  if (!markers_found && exitCode != null && exitCode !== 0) {
    return FAILURE_MODES.CLI_EXIT_NONZERO;
  }
  if (!markers_found) return FAILURE_MODES.NO_STRICT_MARKERS;
  return FAILURE_MODES.OUTPUT_NONCONFORMANT;
}

/**
 * Classify captured stdout/stderr (never persist raw in git).
 */
export function classifyRun({
  codex_invoked,
  runtime_executed,
  stdout = "",
  stderr = "",
  exitCode = null,
  spawnError = null,
}) {
  const combined = `${stdout}\n${stderr}`;
  const policyBlock = POLICY_BLOCK.test(combined);
  const scopeSignals = SCOPE_DRIFT.test(combined);

  if (spawnError || !codex_invoked) {
    const base = {
      classification: "blocked",
      strict_pass: false,
      markers_found: false,
      json_valid: false,
      schema_contract_pass: false,
      pm35_status: null,
      notes: ["codex.cmd did not start or spawn failed."],
    };
    return {
      ...base,
      failure_mode: inferFailureMode({ ...base, policyBlock, scopeSignals, exitCode }),
    };
  }

  if (!runtime_executed || policyBlock) {
    const base = {
      classification: "blocked",
      strict_pass: false,
      markers_found: false,
      json_valid: false,
      schema_contract_pass: false,
      pm35_status: null,
      notes: ["Codex blocked or did not complete runtime."],
    };
    return {
      ...base,
      failure_mode: inferFailureMode({ ...base, policyBlock: true, scopeSignals, exitCode }),
    };
  }

  const { markers_found, parsed, json_valid } = extractStrictJson(combined);
  const schema_contract_pass =
    markers_found && json_valid && exactStrictSchema(parsed);

  if (schema_contract_pass) {
    const base = {
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
    return {
      ...base,
      failure_mode: FAILURE_MODES.STRICT_PASS,
      scope_warning: scopeSignals,
    };
  }

  if (markers_found && json_valid && recoverableFromParsed(parsed)) {
    const base = {
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
    return {
      ...base,
      failure_mode: FAILURE_MODES.OUTPUT_NONCONFORMANT,
    };
  }

  if (scopeSignals) {
    const base = {
      classification: "fail_scope_drift",
      strict_pass: false,
      markers_found,
      json_valid,
      schema_contract_pass: false,
      pm35_status: parsed?.pm35_status ?? null,
      notes: [
        "Scope drift observed in runtime transcript.",
        "PM-34 remains blocked.",
      ],
    };
    return { ...base, failure_mode: FAILURE_MODES.SCOPE_DRIFT };
  }

  if (markers_found && !json_valid) {
    const base = {
      classification: "fail",
      strict_pass: false,
      markers_found: true,
      json_valid: false,
      schema_contract_pass: false,
      pm35_status: null,
      notes: ["Markers present but JSON invalid.", "PM-34 remains blocked."],
    };
    return { ...base, failure_mode: FAILURE_MODES.MALFORMED_JSON };
  }

  if (!markers_found && exitCode != null && exitCode !== 0) {
    const base = {
      classification: "fail",
      strict_pass: false,
      markers_found: false,
      json_valid: false,
      schema_contract_pass: false,
      pm35_status: null,
      notes: [
        `CLI exit code ${exitCode} without strict marker block (PM-44 pattern).`,
        "Likely CLI/argument error or nonconformant output — not scope drift.",
        "PM-34 remains blocked.",
      ],
    };
    return { ...base, failure_mode: FAILURE_MODES.CLI_EXIT_NONZERO };
  }

  if (!markers_found && (combined.length > 200 || /read|inspect|search/i.test(combined))) {
    const base = {
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
    return { ...base, failure_mode: FAILURE_MODES.SCOPE_DRIFT };
  }

  const base = {
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
  return {
    ...base,
    failure_mode: inferFailureMode({
      ...base,
      exitCode,
      policyBlock,
      scopeSignals,
    }),
  };
}

export function buildSanitizedArtifact(classification, meta, schemaVersion) {
  const strict_pass = classification.strict_pass === true;
  const artifact = {
    schema_version: schemaVersion,
    source: meta.source ?? "local-runner",
    command_family: meta.command_family ?? "codex.cmd exec",
    sandbox: meta.sandbox ?? "read-only",
    codex_invoked: meta.codex_invoked ?? false,
    runtime_executed: meta.runtime_executed ?? false,
    exit_code: meta.exitCode ?? null,
    failure_mode: classification.failure_mode ?? null,
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
    raw_runtime_metadata_redacted: meta.raw_runtime_metadata_redacted ?? false,
    raw_stdout_committed: false,
    raw_stderr_committed: false,
    notes: [
      "Raw stdout/stderr were not committed.",
      "PM-34 remains blocked pending separate gate.",
      ...(classification.notes ?? []),
    ],
  };
  if (meta.fixture) artifact.fixture = meta.fixture;
  const text = JSON.stringify(artifact);
  if (hasForbidden(text)) {
    throw new Error("artifact contains forbidden pattern");
  }
  return artifact;
}
