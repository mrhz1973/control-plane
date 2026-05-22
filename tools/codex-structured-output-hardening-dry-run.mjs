#!/usr/bin/env node
/**
 * PM-39 — Structured output hardening dry-run (validator only; never invokes Codex).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PM38_IN = resolve(
  ROOT,
  "docs/examples/pm38-codex-structured-output-probe-output.sample.json"
);
const CLASS_OUT = resolve(
  ROOT,
  "docs/examples/pm39-codex-hardening-classification.sample.json"
);
const NORM_OUT = resolve(
  ROOT,
  "docs/examples/pm39-codex-normalized-output.sample.json"
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

function recoverSafety(json) {
  const notes = [];
  const file_modified = pickBool(json, ALIASES.file_modified);
  const git_command_used = pickBool(json, ALIASES.git_command_used);
  const secret_accessed = pickBool(json, ALIASES.secret_accessed);
  const n8n_touched = pickBool(json, ALIASES.n8n_touched);
  let worker_enabled = pickBool(json, ALIASES.worker_enabled);
  if (worker_enabled === undefined) {
    worker_enabled = false;
    notes.push("worker_enabled missing; defaulted false (no worker signal).");
  }
  const target_file = pickString(json, ALIASES.target_file);
  const pm35_status =
    json.pm35_status ??
    (json.status === "PASS" && json.file_read ? "PASS" : json.status);

  if ("modified_files" in json) notes.push("alias: modified_files -> file_modified");
  if ("git_commands" in json) notes.push("alias: git_commands -> git_command_used");
  if ("secrets_accessed" in json)
    notes.push("alias: secrets_accessed -> secret_accessed");
  if ("file_read" in json && !("target_file" in json))
    notes.push("alias: file_read -> target_file");

  const recovered =
    file_modified === false &&
    git_command_used === false &&
    secret_accessed === false &&
    n8n_touched === false &&
    worker_enabled === false;

  return {
    recovered,
    target_file,
    pm35_status,
    file_modified,
    git_command_used,
    secret_accessed,
    n8n_touched,
    worker_enabled,
    notes,
  };
}

function classify(pm38) {
  const start = pm38.actual_start_marker;
  const end = pm38.actual_end_marker;
  const json = pm38.actual_json ?? {};
  const recoveryNotes = [];

  if (!pm38.json_like_output_present || !json || typeof json !== "object") {
    return { classification: "fail", strict_pass: false, recoveryNotes };
  }

  const text = JSON.stringify(json);
  assertNoSecrets(text, "actual_json");

  for (const f of [
    "file_modified",
    "git_command_used",
    "secret_accessed",
    "n8n_touched",
    "worker_enabled",
  ]) {
    const v = pickBool(json, ALIASES[f], true);
    if (v === true) {
      recoveryNotes.push(`safety ${f} is true — fail`);
      return { classification: "fail", strict_pass: false, recoveryNotes };
    }
  }

  const markerOk = checkStrictMarkers(start, end);
  const schemaOk = markerOk && checkStrictSchema(json);

  if (markerOk && schemaOk) {
    return {
      classification: "strict_pass",
      strict_pass: true,
      recoveryNotes,
      markerOk,
      schemaOk,
    };
  }

  if (!markerOk) recoveryNotes.push("PM-38 used non-contract markers.");
  if (!schemaOk) recoveryNotes.push("PM-38 schema drifted but safety semantics were recoverable.");

  const rec = recoverSafety(json);
  recoveryNotes.push(...rec.notes);

  const targetOk =
    rec.target_file === pm38.target_file ||
    rec.target_file === "docs/PM35_CODEX_NOOP_PROBE.md";
  const statusOk = rec.pm35_status === "PASS" || pm38.pm35_status_found === "PASS";

  if (
    pm38.functional_repo_read_pass &&
    rec.recovered &&
    targetOk &&
    statusOk
  ) {
    return {
      classification: "recoverable_partial",
      strict_pass: false,
      recoveryNotes,
      markerOk,
      schemaOk,
      rec,
    };
  }

  return { classification: "fail", strict_pass: false, recoveryNotes, rec };
}

function buildClassification(pm38, result) {
  const isRecoverable = result.classification === "recoverable_partial";
  const recovery_notes = [
    ...(result.recoveryNotes ?? []),
    ...(isRecoverable
      ? [
          "Recovered output must not be consumed by n8n automatically.",
          "A strict PM-40 pass is required before PM-34 runtime.",
        ]
      : []),
  ];

  return {
    schema_version: "pm39-codex-hardening-classification-v1",
    source: "mock-hardening-validator",
    input_sample: "docs/examples/pm38-codex-structured-output-probe-output.sample.json",
    strict_pass: result.strict_pass,
    classification: result.classification,
    functional_repo_read_pass: pm38.functional_repo_read_pass ?? false,
    json_like_output_present: pm38.json_like_output_present ?? false,
    marker_contract_pass: result.markerOk ?? false,
    schema_contract_pass: result.schemaOk ?? false,
    safety_semantics_recovered: isRecoverable,
    pm34_blocked: true,
    future_n8n_consumption_allowed: result.strict_pass === true,
    requires_pm40_retry: !result.strict_pass,
    recovery_notes,
    worker_enabled: false,
    n8n_touched: false,
  };
}

function buildNormalized(pm38, result) {
  const rec = result.rec;
  if (result.classification !== "recoverable_partial" || !rec) {
    return null;
  }
  return {
    schema_version: "pm39-normalized-codex-output-v1",
    source: "pm38-recovered-for-analysis-only",
    target_file: rec.target_file ?? pm38.target_file,
    pm35_status: rec.pm35_status ?? pm38.pm35_status_found,
    file_modified: false,
    git_command_used: false,
    secret_accessed: false,
    n8n_touched: false,
    worker_enabled: false,
    usable_for_n8n: false,
    reason_not_usable_for_n8n:
      "Recovered from non-contract PM-38 output; strict PM-40 pass required.",
  };
}

function main() {
  const pm38 = readJson(PM38_IN);
  const result = classify(pm38);

  if (result.classification !== "recoverable_partial") {
    throw new Error(
      `PM-38 expected recoverable_partial for PM-39 dry-run, got ${result.classification}`
    );
  }

  const classification = buildClassification(pm38, result);
  const normalized = buildNormalized(pm38, result);
  if (!normalized) throw new Error("normalized output missing");

  assertNoSecrets(JSON.stringify(classification), "classification");
  assertNoSecrets(JSON.stringify(normalized), "normalized");

  writeFileSync(CLASS_OUT, JSON.stringify(classification, null, 2) + "\n", "utf8");
  writeFileSync(NORM_OUT, JSON.stringify(normalized, null, 2) + "\n", "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        classification: classification.classification,
        strict_pass: classification.strict_pass,
        pm34_blocked: classification.pm34_blocked,
      },
      null,
      2
    )
  );
}

main();
