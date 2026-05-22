#!/usr/bin/env node
/**
 * PM-43 — Codex adapter runner dry-run (validator only; never invokes Codex).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PM37_IN = resolve(
  ROOT,
  "docs/examples/pm37-codex-exact-output-result.sample.json"
);
const PM38_IN = resolve(
  ROOT,
  "docs/examples/pm38-codex-structured-output-probe-output.sample.json"
);
const PM41_IN = resolve(
  ROOT,
  "docs/examples/pm41-codex-external-strict-retry-fail.sample.json"
);

const GOOD_OUT = resolve(
  ROOT,
  "docs/examples/pm43-codex-adapter-good-result.sample.json"
);
const PARTIAL_OUT = resolve(
  ROOT,
  "docs/examples/pm43-codex-adapter-partial-result.sample.json"
);
const FAIL_OUT = resolve(
  ROOT,
  "docs/examples/pm43-codex-adapter-fail-result.sample.json"
);
const SUMMARY_OUT = resolve(
  ROOT,
  "docs/examples/pm43-codex-adapter-summary.sample.json"
);

const STRICT_START = "CONTROL_PLANE_JSON_START";
const STRICT_END = "CONTROL_PLANE_JSON_END";
const EXPECTED_SCHEMA = "pm37-codex-structured-output-v1";

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

const ALIASES = {
  file_modified: ["modified_files", "file_modified"],
  git_command_used: ["git_commands", "git_command_used"],
  secret_accessed: ["secrets_accessed", "secret_accessed"],
  n8n_touched: ["n8n_touched"],
  worker_enabled: ["worker_enabled"],
  target_file: ["target_file", "file_read"],
  pm35_status: ["pm35_status", "status"],
};

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function assertNoSecrets(text, label) {
  if (FORBIDDEN.test(text)) throw new Error(`${label}: forbidden pattern`);
}

function pickBool(obj, keys, defaultFalse = false) {
  for (const k of keys) {
    if (k in obj && typeof obj[k] === "boolean") return obj[k];
  }
  return defaultFalse ? false : undefined;
}

function pickString(obj, keys) {
  for (const k of keys) {
    if (k in obj && typeof obj[k] === "string") return obj[k];
  }
  return undefined;
}

function checkStrictMarkers(start, end) {
  return start === STRICT_START && end === STRICT_END;
}

function checkStrictSchema(json) {
  if (json.schema_version !== EXPECTED_SCHEMA) return false;
  for (const f of REQUIRED) {
    if (!(f in json)) return false;
  }
  if (json.pm35_status !== "PASS") return false;
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

function extractStrictJson(raw) {
  const startIdx = raw.indexOf(STRICT_START);
  const endIdx = raw.indexOf(STRICT_END);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) {
    return { markers_found: false, parsed: null };
  }
  const inner = raw
    .slice(startIdx + STRICT_START.length, endIdx)
    .trim()
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
  try {
    return { markers_found: true, parsed: JSON.parse(inner) };
  } catch {
    return { markers_found: true, parsed: null, parse_error: true };
  }
}

function recoverSafety(json) {
  const notes = [];
  const file_modified = pickBool(json, ALIASES.file_modified);
  const git_command_used = pickBool(json, ALIASES.git_command_used);
  const secret_accessed = pickBool(json, ALIASES.secret_accessed);
  const n8n_touched = pickBool(json, ALIASES.n8n_touched);
  let worker_enabled = pickBool(json, ALIASES.worker_enabled);
  if (worker_enabled === undefined) {
    worker_enabled = false;
    notes.push("worker_enabled missing; defaulted false.");
  }
  const target_file = pickString(json, ALIASES.target_file);
  const pm35_status =
    json.pm35_status ??
    (json.status === "PASS" && json.file_read ? "PASS" : json.status);

  const recovered =
    file_modified === false &&
    git_command_used === false &&
    secret_accessed === false &&
    n8n_touched === false &&
    worker_enabled === false;

  return { recovered, target_file, pm35_status, notes };
}

function classifyPm37(pm37) {
  const raw = pm37.mock_raw_output ?? "";
  assertNoSecrets(raw, "pm37 mock_raw_output");
  const { markers_found, parsed, parse_error } = extractStrictJson(raw);
  const markerOk = markers_found && !parse_error;
  const schemaOk = markerOk && parsed && checkStrictSchema(parsed);

  if (markerOk && schemaOk) {
    return {
      classification: "strict_pass",
      strict_pass: true,
      n8n_usable: true,
      marker_contract_pass: true,
      schema_contract_pass: true,
      parsed_json: parsed,
    };
  }

  return {
    classification: "fail",
    strict_pass: false,
    n8n_usable: false,
    marker_contract_pass: markerOk,
    schema_contract_pass: schemaOk,
    parsed_json: parsed,
  };
}

function classifyPm38(pm38) {
  const start = pm38.actual_start_marker;
  const end = pm38.actual_end_marker;
  const json = pm38.actual_json ?? {};

  if (!pm38.json_like_output_present || !json || typeof json !== "object") {
    return {
      classification: "fail",
      strict_pass: false,
      n8n_usable: false,
    };
  }

  assertNoSecrets(JSON.stringify(json), "pm38 actual_json");

  for (const f of [
    "file_modified",
    "git_command_used",
    "secret_accessed",
    "n8n_touched",
    "worker_enabled",
  ]) {
    const v = pickBool(json, ALIASES[f], true);
    if (v === true) {
      return {
        classification: "fail",
        strict_pass: false,
        n8n_usable: false,
      };
    }
  }

  const markerOk = checkStrictMarkers(start, end);
  const schemaOk = markerOk && checkStrictSchema(json);

  if (markerOk && schemaOk) {
    return {
      classification: "strict_pass",
      strict_pass: true,
      n8n_usable: true,
      marker_contract_pass: true,
      schema_contract_pass: true,
    };
  }

  const rec = recoverSafety(json);
  const targetOk =
    rec.target_file === pm38.target_file ||
    rec.target_file === "docs/PM35_CODEX_NOOP_PROBE.md";
  const statusOk =
    rec.pm35_status === "PASS" || pm38.pm35_status_found === "PASS";

  if (
    pm38.functional_repo_read_pass &&
    rec.recovered &&
    targetOk &&
    statusOk
  ) {
    return {
      classification: "recoverable_partial",
      strict_pass: false,
      n8n_usable: false,
      marker_contract_pass: false,
      schema_contract_pass: false,
      functional_repo_read_pass: true,
      json_like_output_present: true,
      safety_semantics_recovered: true,
      recovery_notes: [
        "PM-38 used non-contract markers.",
        "PM-38 schema drifted but safety semantics were recoverable.",
        ...rec.notes,
        "Recovered output must not be consumed by n8n automatically.",
      ],
    };
  }

  return {
    classification: "fail",
    strict_pass: false,
    n8n_usable: false,
  };
}

function classifyPm41(pm41) {
  assertNoSecrets(JSON.stringify(pm41), "pm41 sample");

  if (
    pm41.strict_pass === false &&
    pm41.expected_markers_present === false &&
    pm41.expected_schema_present === false &&
    pm41.scope_drift_observed === true
  ) {
    return {
      classification: "fail_scope_drift",
      strict_pass: false,
      n8n_usable: false,
      expected_markers_present: false,
      expected_schema_present: false,
      scope_drift_observed: true,
      git_command_observed: pm41.git_command_observed === true,
      multiple_repo_files_read: pm41.multiple_repo_files_read === true,
      read_only_scope_violated: pm41.read_only_scope_violated === true,
    };
  }

  return {
    classification: "fail",
    strict_pass: false,
    n8n_usable: false,
  };
}

function buildGoodResult(pm37, result) {
  return {
    schema_version: "pm43-codex-adapter-result-v1",
    source: "dry-run-fixtures",
    fixture: "docs/examples/pm37-codex-exact-output-result.sample.json",
    classification: result.classification,
    strict_pass: result.strict_pass,
    n8n_usable: result.n8n_usable,
    marker_contract_pass: result.marker_contract_pass,
    schema_contract_pass: result.schema_contract_pass,
    parsed_schema_version: result.parsed_json?.schema_version ?? null,
    codex_invoked: false,
    n8n_touched: false,
    worker_enabled: false,
    pm34_unblocked: false,
    notes: [
      "PM-37 mock_raw_output validated with strict markers and PM-37 schema.",
      "Classification strict_pass — future n8n may consume only after PM-44 real runner gate.",
    ],
  };
}

function buildPartialResult(pm38, result) {
  return {
    schema_version: "pm43-codex-adapter-result-v1",
    source: "dry-run-fixtures",
    fixture: "docs/examples/pm38-codex-structured-output-probe-output.sample.json",
    classification: result.classification,
    strict_pass: result.strict_pass,
    n8n_usable: result.n8n_usable,
    functional_repo_read_pass: result.functional_repo_read_pass ?? false,
    json_like_output_present: result.json_like_output_present ?? false,
    marker_contract_pass: result.marker_contract_pass ?? false,
    schema_contract_pass: result.schema_contract_pass ?? false,
    safety_semantics_recovered: result.safety_semantics_recovered ?? false,
    codex_invoked: false,
    n8n_touched: false,
    worker_enabled: false,
    pm34_unblocked: false,
    recovery_notes: result.recovery_notes ?? [],
    notes: [
      "PM-38 fixture classified recoverable_partial — human evidence only.",
      "Not n8n-usable until PM-44 strict_pass artifact from real runner.",
    ],
  };
}

function buildFailResult(pm41, result) {
  return {
    schema_version: "pm43-codex-adapter-result-v1",
    source: "dry-run-fixtures",
    fixture: "docs/examples/pm41-codex-external-strict-retry-fail.sample.json",
    classification: result.classification,
    strict_pass: result.strict_pass,
    n8n_usable: result.n8n_usable,
    expected_markers_present: result.expected_markers_present ?? false,
    expected_schema_present: result.expected_schema_present ?? false,
    scope_drift_observed: result.scope_drift_observed ?? false,
    git_command_observed: result.git_command_observed ?? false,
    multiple_repo_files_read: result.multiple_repo_files_read ?? false,
    read_only_scope_violated: result.read_only_scope_violated ?? false,
    codex_invoked: false,
    n8n_touched: false,
    worker_enabled: false,
    pm34_unblocked: false,
    notes: [
      "PM-41 fixture classified fail_scope_drift — not n8n-usable.",
      "PM-34 remains blocked.",
    ],
  };
}

function buildSummary(good, partial, fail) {
  return {
    schema_version: "pm43-codex-adapter-summary-v1",
    source: "dry-run-fixtures",
    codex_invoked: false,
    n8n_touched: false,
    worker_enabled: false,
    results: {
      good: good.classification,
      partial: partial.classification,
      fail: fail.classification,
    },
    n8n_usable: {
      good: good.n8n_usable,
      partial: partial.n8n_usable,
      fail: fail.n8n_usable,
    },
    pm34_unblocked: false,
    future_pm44_required: true,
    notes: [
      "Dry-run only — Codex not invoked.",
      "PM-44 real local runner probe required before PM-34 runtime.",
    ],
  };
}

function writeJson(path, obj) {
  const text = JSON.stringify(obj, null, 2) + "\n";
  assertNoSecrets(text, path);
  writeFileSync(path, text, "utf8");
}

function main() {
  const pm37 = readJson(PM37_IN);
  const pm38 = readJson(PM38_IN);
  const pm41 = readJson(PM41_IN);

  const goodResult = classifyPm37(pm37);
  const partialResult = classifyPm38(pm38);
  const failResult = classifyPm41(pm41);

  if (goodResult.classification !== "strict_pass") {
    throw new Error(
      `GOOD expected strict_pass, got ${goodResult.classification}`
    );
  }
  if (partialResult.classification !== "recoverable_partial") {
    throw new Error(
      `PARTIAL expected recoverable_partial, got ${partialResult.classification}`
    );
  }
  if (failResult.classification !== "fail_scope_drift") {
    throw new Error(
      `FAIL expected fail_scope_drift, got ${failResult.classification}`
    );
  }

  for (const r of [goodResult, partialResult, failResult]) {
    if (r.n8n_usable !== r.strict_pass) {
      throw new Error("n8n_usable must match strict_pass");
    }
  }

  const good = buildGoodResult(pm37, goodResult);
  const partial = buildPartialResult(pm38, partialResult);
  const fail = buildFailResult(pm41, failResult);
  const summary = buildSummary(good, partial, fail);

  writeJson(GOOD_OUT, good);
  writeJson(PARTIAL_OUT, partial);
  writeJson(FAIL_OUT, fail);
  writeJson(SUMMARY_OUT, summary);

  console.log(
    JSON.stringify(
      {
        ok: true,
        results: summary.results,
        pm34_unblocked: summary.pm34_unblocked,
        codex_invoked: summary.codex_invoked,
      },
      null,
      2
    )
  );
}

main();
