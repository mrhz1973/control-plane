#!/usr/bin/env node
/**
 * PM-60 — OpenClaw lifecycle metadata validator (dry-run; local JSON only).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const METADATA_SCHEMA = "pm59.openclaw.lifecycle.metadata.v1";
const BRIDGE_SCHEMA_VERSION = "pm52.openclaw.bridge.v1";
const ADAPTER_SCHEMA = "pm54.openclaw.adapter.v1";
const SOURCE = "openclaw";
const MACHINE_SCOPE = "home-local-loopback";

const LIFECYCLE_STATES = new Set([
  "proposed",
  "captured_redacted",
  "schema_validated",
  "adapter_validated",
  "operator_reviewed",
  "rejected",
  "archived",
  "expired",
]);

const CLASSIFICATIONS = new Set([
  "pass",
  "fail",
  "partial",
  "auth_required",
  "invalid",
]);

const REDACTION_REQUIRED_STATES = new Set([
  "captured_redacted",
  "schema_validated",
  "adapter_validated",
  "operator_reviewed",
  "archived",
]);

const SECRET_REQUIRED_STATES = new Set([
  "captured_redacted",
  "schema_validated",
  "adapter_validated",
  "operator_reviewed",
  "archived",
]);

const ADAPTER_NULL_REQUIRED_STATES = new Set([
  "proposed",
  "captured_redacted",
  "schema_validated",
]);

const ADAPTER_REQUIRED_STATES = new Set([
  "adapter_validated",
  "operator_reviewed",
]);

const NEXT_GATE_ALLOWLIST = new Set([
  "pm-59-lifecycle-metadata-schema",
  "pm-60-lifecycle-metadata-validator",
  "pm-61-lifecycle-fixture-review",
  "pm-62-integration-readiness-checklist",
  "pm-63-governance-checkpoint",
  "stop",
]);

const RETENTION_POLICIES = new Set(["keep", "expire", "archive"]);

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
  /\braw_transcript\b/i,
  /\b"raw"\s*:/i,
  /\btranscript"\s*:/i,
  /^OpenClaw status$/m,
  /\bDashboard:\s*http/i,
  /\bws:\/\/127\.0\.0\.1/i,
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

export function validateLifecycleMetadata(obj) {
  const errors = [];
  const warnings = [];
  let artifactId = null;
  let lifecycleState = null;

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return {
      valid: false,
      schema: METADATA_SCHEMA,
      artifact_id: null,
      lifecycle_state: null,
      errors: ["root must be a JSON object"],
      warnings,
    };
  }

  const serialized = JSON.stringify(obj);
  errors.push(...scanSecrets(serialized));

  artifactId = typeof obj.artifact_id === "string" ? obj.artifact_id : null;
  if (!artifactId || !artifactId.trim()) {
    errors.push("artifact_id must be a non-empty string");
  }

  if (obj.schema_version !== BRIDGE_SCHEMA_VERSION) {
    errors.push(
      `schema_version must be ${BRIDGE_SCHEMA_VERSION}, got ${obj.schema_version ?? "missing"}`
    );
  }

  const adapterSchema = obj.adapter_schema;
  if (adapterSchema !== null && adapterSchema !== ADAPTER_SCHEMA) {
    errors.push(
      `adapter_schema must be ${ADAPTER_SCHEMA} or null, got ${adapterSchema ?? "missing"}`
    );
  }

  lifecycleState =
    typeof obj.lifecycle_state === "string" ? obj.lifecycle_state : null;
  if (!lifecycleState || !LIFECYCLE_STATES.has(lifecycleState)) {
    errors.push(
      `lifecycle_state must be one of: ${[...LIFECYCLE_STATES].join(", ")}`
    );
  }

  if (typeof obj.created_at !== "string" || !obj.created_at.trim()) {
    errors.push("created_at must be a non-empty string");
  }

  if (obj.source !== SOURCE) {
    errors.push(`source must be ${SOURCE}`);
  }

  if (obj.machine_scope !== MACHINE_SCOPE) {
    errors.push(`machine_scope must be ${MACHINE_SCOPE}`);
  }

  const classification =
    typeof obj.classification === "string" ? obj.classification : null;
  if (!classification || !CLASSIFICATIONS.has(classification)) {
    errors.push(
      `classification must be one of: ${[...CLASSIFICATIONS].join(", ")}`
    );
  }

  if (obj.n8n_ready !== false) {
    errors.push("n8n_ready must be false");
  }

  if (obj.pm34_unblock !== false) {
    errors.push("pm34_unblock must be false");
  }

  const redactionStatus = obj.redaction_status;
  if (redactionStatus !== "pass" && redactionStatus !== "fail") {
    errors.push("redaction_status must be pass or fail");
  }

  const secretScan = obj.secret_scan;
  if (secretScan !== "pass" && secretScan !== "fail") {
    errors.push("secret_scan must be pass or fail");
  }

  const retention = obj.retention;
  if (!retention || typeof retention !== "object" || Array.isArray(retention)) {
    errors.push("retention must be an object");
  } else {
    if (!RETENTION_POLICIES.has(retention.policy)) {
      errors.push(
        `retention.policy must be one of: ${[...RETENTION_POLICIES].join(", ")}`
      );
    }
    const expiresAt = retention.expires_at;
    if (expiresAt !== null && (typeof expiresAt !== "string" || !expiresAt.trim())) {
      errors.push("retention.expires_at must be a non-empty string or null");
    }
  }

  if (typeof obj.next_gate !== "string" || !obj.next_gate.trim()) {
    errors.push("next_gate must be a non-empty string");
  } else if (!NEXT_GATE_ALLOWLIST.has(obj.next_gate.trim())) {
    errors.push(
      `next_gate must be one of: ${[...NEXT_GATE_ALLOWLIST].join(", ")}`
    );
  }

  if (lifecycleState && REDACTION_REQUIRED_STATES.has(lifecycleState)) {
    if (redactionStatus !== "pass") {
      errors.push(
        `redaction_status must be pass for lifecycle_state ${lifecycleState}`
      );
    }
  }

  if (lifecycleState && SECRET_REQUIRED_STATES.has(lifecycleState)) {
    if (secretScan !== "pass") {
      errors.push(
        `secret_scan must be pass for lifecycle_state ${lifecycleState}`
      );
    }
  }

  if (lifecycleState && ADAPTER_NULL_REQUIRED_STATES.has(lifecycleState)) {
    if (adapterSchema !== null) {
      errors.push(
        `adapter_schema must be null for lifecycle_state ${lifecycleState}`
      );
    }
  }

  if (lifecycleState && ADAPTER_REQUIRED_STATES.has(lifecycleState)) {
    if (adapterSchema !== ADAPTER_SCHEMA) {
      errors.push(
        `adapter_schema must be ${ADAPTER_SCHEMA} for lifecycle_state ${lifecycleState}`
      );
    }
  }

  if (lifecycleState === "archived") {
    if (retention?.policy !== "archive") {
      errors.push(
        "retention.policy must be archive for lifecycle_state archived"
      );
    }
  }

  if (lifecycleState === "expired") {
    const policy = retention?.policy;
    if (policy !== "expire" && policy !== "archive") {
      errors.push(
        "retention.policy must be expire or archive for lifecycle_state expired"
      );
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    schema: METADATA_SCHEMA,
    artifact_id: valid ? artifactId : artifactId,
    lifecycle_state: valid ? lifecycleState : lifecycleState,
    errors: [...new Set(errors)],
    warnings,
  };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.log(
      JSON.stringify({
        valid: false,
        schema: METADATA_SCHEMA,
        artifact_id: null,
        lifecycle_state: null,
        errors: ["missing file path argument"],
        warnings: [],
      })
    );
    process.exit(1);
  }

  let obj;
  try {
    obj = readJson(resolve(process.cwd(), inputPath));
  } catch (err) {
    console.log(
      JSON.stringify({
        valid: false,
        schema: METADATA_SCHEMA,
        artifact_id: null,
        lifecycle_state: null,
        errors: [`failed to read or parse JSON: ${err.message}`],
        warnings: [],
      })
    );
    process.exit(1);
  }

  const result = validateLifecycleMetadata(obj);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}

main();
