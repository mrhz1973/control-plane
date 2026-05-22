#!/usr/bin/env node
/**
 * PM-53 — OpenClaw bridge artifact validator (dry-run; local JSON only).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCHEMA_VERSION = "pm52.openclaw.bridge.v1";
const SOURCE = "openclaw";
const MACHINE_SCOPE = "home-local-loopback";

const CLASSIFICATIONS = new Set([
  "pass",
  "fail",
  "partial",
  "auth_required",
  "invalid",
]);

const FORBIDDEN_TOUCHED_KEYS = [
  "n8n",
  "workflow_40",
  "workflow_41",
  "worker",
  "telegram",
  "external_provider",
  "lan_exposure",
];

const SECRET_PATTERNS = [
  /\baccess_token\b/i,
  /\brefresh_token\b/i,
  /\bid_token\b/i,
  /\bAuthorization\b/i,
  /\bBearer\b/i,
  /\bapi_key\b/i,
  /\bAPI key\b/i,
  /\bOAuth code\b/i,
  /\bgithub_pat_(?!FAKE_FOR_VALIDATOR_TEST)/i,
  /\bghp_(?!FAKE)/i,
  /\bapi\.telegram\.org\/bot/i,
  /\bsk-[a-zA-Z0-9]{10,}/i,
  /\boauth\/authorize/i,
  /\blocalhost:1455/i,
];

const RAW_OUTPUT_HINTS = [
  /^OpenClaw status$/m,
  /\bGateway service:\b/,
  /\bDashboard:\s*http/,
  /\braw_transcript\b/i,
  /\b"raw"\s*:/i,
  /\btranscript"\s*:/i,
];

const REQUIRED_TOP = [
  "schema_version",
  "source",
  "run_id",
  "created_at",
  "machine_scope",
  "classification",
  "intent",
  "summary",
  "evidence",
  "forbidden_touched",
  "secret_scan",
  "next_gate",
];

function readJson(path) {
  const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(text);
}

function scanSecrets(text) {
  const hits = [];
  for (const re of SECRET_PATTERNS) {
    if (re.test(text)) hits.push(`forbidden pattern: ${re.source}`);
  }
  return hits;
}

function looksLikeRawOutput(obj, serialized) {
  const issues = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    issues.push("not a structured artifact object");
    return issues;
  }
  if (!("schema_version" in obj)) {
    issues.push("missing schema_version (raw/unstructured)");
  }
  if ("raw" in obj || "transcript" in obj || "raw_output" in obj) {
    issues.push("contains raw/transcript field");
  }
  for (const hint of RAW_OUTPUT_HINTS) {
    if (hint.test(serialized)) {
      issues.push("resembles raw OpenClaw output not bridge artifact");
      break;
    }
  }
  return issues;
}

export function validateArtifact(obj) {
  const errors = [];
  const warnings = [];
  let schemaVersion = null;
  let classification = null;

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return {
      valid: false,
      classification: null,
      schema_version: null,
      errors: ["root must be a JSON object"],
      warnings,
    };
  }

  const serialized = JSON.stringify(obj);
  errors.push(...looksLikeRawOutput(obj, serialized));
  errors.push(...scanSecrets(serialized));

  schemaVersion =
    typeof obj.schema_version === "string" ? obj.schema_version : null;

  if (schemaVersion !== SCHEMA_VERSION) {
    errors.push(
      `schema_version must be ${SCHEMA_VERSION}, got ${schemaVersion ?? "missing"}`
    );
  }

  if (obj.source !== SOURCE) {
    errors.push(`source must be ${SOURCE}`);
  }

  if (obj.machine_scope !== MACHINE_SCOPE) {
    errors.push(`machine_scope must be ${MACHINE_SCOPE}`);
  }

  classification =
    typeof obj.classification === "string" ? obj.classification : null;

  if (!classification || !CLASSIFICATIONS.has(classification)) {
    errors.push(
      `classification must be one of: ${[...CLASSIFICATIONS].join(", ")}`
    );
  }

  for (const key of REQUIRED_TOP) {
    if (!(key in obj)) errors.push(`missing required field: ${key}`);
  }

  if (!Array.isArray(obj.evidence)) {
    errors.push("evidence must be an array");
  }

  const ft = obj.forbidden_touched;
  if (!ft || typeof ft !== "object" || Array.isArray(ft)) {
    errors.push("forbidden_touched must be an object");
  } else {
    for (const key of FORBIDDEN_TOUCHED_KEYS) {
      if (!(key in ft)) {
        errors.push(`forbidden_touched missing key: ${key}`);
      } else if (ft[key] !== false) {
        errors.push(`forbidden_touched.${key} must be false`);
      }
    }
  }

  const ss = obj.secret_scan;
  if (!ss || typeof ss !== "object" || Array.isArray(ss)) {
    errors.push("secret_scan must be an object");
  } else {
    if (ss.status !== "pass" && ss.status !== "fail") {
      errors.push("secret_scan.status must be pass or fail");
    }
    if (ss.status === "fail") {
      errors.push("secret_scan.status is fail");
    }
    if (!Array.isArray(ss.redactions)) {
      errors.push("secret_scan.redactions must be an array");
    }
  }

  if (typeof obj.run_id !== "string" || !obj.run_id.trim()) {
    errors.push("run_id must be a non-empty string");
  }
  if (typeof obj.created_at !== "string" || !obj.created_at.trim()) {
    errors.push("created_at must be a non-empty string");
  }
  if (typeof obj.intent !== "string" || !obj.intent.trim()) {
    errors.push("intent must be a non-empty string");
  }
  if (typeof obj.summary !== "string" || !obj.summary.trim()) {
    errors.push("summary must be a non-empty string");
  }
  if (typeof obj.next_gate !== "string" || !obj.next_gate.trim()) {
    errors.push("next_gate must be a non-empty string");
  }

  const valid = errors.length === 0;

  return {
    valid,
    classification: valid ? classification : null,
    schema_version: valid ? SCHEMA_VERSION : schemaVersion,
    errors: [...new Set(errors)],
    warnings,
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error(JSON.stringify({ valid: false, errors: ["missing file path argument"] }));
    process.exit(1);
  }

  let obj;
  try {
    obj = readJson(resolve(process.cwd(), inputPath));
  } catch (err) {
    const out = {
      valid: false,
      classification: null,
      schema_version: null,
      errors: [`failed to read or parse JSON: ${err.message}`],
      warnings: [],
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const result = validateArtifact(obj);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}

main();
