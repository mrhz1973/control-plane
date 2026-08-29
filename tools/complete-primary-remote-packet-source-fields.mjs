#!/usr/bin/env node
/**
 * D-0025-W CASE B — Deterministic missing-only source/const packet completion.
 *
 * Completes only allowlisted own-property-absent fields from consumer_input or
 * canonical consts. Never overwrites present fields (including null/false/[]/"").
 * Never synthesizes planner-owned fields.
 *
 * Zero HTTP/provider calls.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(HERE, "../docs/contracts/execution-packet-v1.schema.json");

export const SOURCE_FIELD_ALLOWLIST = Object.freeze({
  schema: { source: "const", value: "execution-packet-v1" },
  task_id: { source: "consumer_input.task_id" },
  source_backlog_ref: { source: "consumer_input.source_backlog_ref" },
  source_backlog_commit: { source: "consumer_input.source_backlog_commit" },
  repository: { source: "consumer_input.repository" },
  branch_target: { source: "consumer_input.branch_target" },
  goal: { source: "consumer_input.goal" },
  executor: { source: "const", value: "cursor" },
  allowed_paths: { source: "consumer_input.allowed_paths" },
  forbidden_paths: { source: "consumer_input.forbidden_paths" },
  hard_constraints: { source: "consumer_input.hard_constraints" },
  final_report_contract: {
    source: "const",
    value: "docs/foundation/CURSOR_PROMPT_TEMPLATE.md",
  },
});

export const PLANNER_OWNED_REQUIRED_FIELDS = Object.freeze([
  "packet_id",
  "packet_revision",
  "generated_at",
  "planner",
  "preflight",
  "steps",
  "validation",
  "acceptance",
  "loop",
  "risk_assessment",
  "gate_recommendation",
  "context",
  "review",
  "status",
]);

const NESTED_CENSUS_OBJECTS = Object.freeze([
  "planner",
  "loop",
  "risk_assessment",
  "gate_recommendation",
  "context",
  "review",
]);

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
  }
  return false;
}

function digConsumer(consumerInput, source) {
  if (source === "const") return undefined;
  if (!source.startsWith("consumer_input.")) {
    throw new Error(`Unsupported source path: ${source}`);
  }
  const key = source.slice("consumer_input.".length);
  if (!Object.prototype.hasOwnProperty.call(consumerInput, key)) {
    return { ok: false, reason: `consumer_input missing source key ${key}` };
  }
  return { ok: true, value: consumerInput[key] };
}

function canonicalValue(meta, consumerInput) {
  if (meta.source === "const") {
    return { ok: true, value: meta.value };
  }
  return digConsumer(consumerInput, meta.source);
}

function loadSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, "utf8").replace(/^\uFEFF/, ""));
}

function nestedRequired(schema, key) {
  const prop = schema.properties?.[key];
  if (!prop || typeof prop !== "object") return [];
  if (Array.isArray(prop.required)) return [...prop.required];
  return [];
}

/**
 * Sanitized census: key names and missing required key names only. No values.
 */
export function buildPacketCensus(packet, schema = loadSchema()) {
  const required = Array.isArray(schema.required) ? schema.required : [];
  const topKeys = packet && typeof packet === "object" && !Array.isArray(packet)
    ? Object.keys(packet).sort()
    : [];
  const missingTop = required.filter(
    (k) => !(packet && typeof packet === "object" && Object.prototype.hasOwnProperty.call(packet, k)),
  );

  const nested = {};
  for (const nk of NESTED_CENSUS_OBJECTS) {
    const req = nestedRequired(schema, nk);
    if (
      !packet ||
      typeof packet !== "object" ||
      !Object.prototype.hasOwnProperty.call(packet, nk)
    ) {
      nested[nk] = {
        present: false,
        keys: null,
        missing_required: req,
      };
      continue;
    }
    const val = packet[nk];
    if (!val || typeof val !== "object" || Array.isArray(val)) {
      nested[nk] = {
        present: true,
        keys: null,
        missing_required: "n/a_not_object",
      };
      continue;
    }
    const keys = Object.keys(val).sort();
    nested[nk] = {
      present: true,
      keys,
      missing_required: req.filter((r) => !Object.prototype.hasOwnProperty.call(val, r)),
    };
  }

  return {
    schema: "packet-structural-census-v1",
    top_level_keys: topKeys,
    missing_top_level_required: missingTop,
    nested_objects: nested,
  };
}

/**
 * @param {object} packet - parsed emit_execution_packet arguments
 * @param {object} consumerInput
 * @returns {{ok:true, packet:object, applied:boolean, completed_fields:string[]}|{ok:false, classification:string, reason:string}}
 */
export function completePrimaryRemotePacketSourceFields(packet, consumerInput) {
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
    return {
      ok: false,
      classification: "INPUT_INVALID",
      reason: "packet must be a plain object",
    };
  }
  if (!consumerInput || typeof consumerInput !== "object" || Array.isArray(consumerInput)) {
    return {
      ok: false,
      classification: "INPUT_INVALID",
      reason: "consumer_input must be a plain object",
    };
  }

  // Fail closed on present conflicting allowlisted fields before any completion.
  for (const [field, meta] of Object.entries(SOURCE_FIELD_ALLOWLIST)) {
    if (!Object.prototype.hasOwnProperty.call(packet, field)) continue;
    const canon = canonicalValue(meta, consumerInput);
    if (!canon.ok) {
      return {
        ok: false,
        classification: "PACKET_SOURCE_FIELD_MISMATCH",
        reason: `Cannot resolve canonical value for present field ${field}: ${canon.reason}`,
        field,
      };
    }
    if (!deepEqual(packet[field], canon.value)) {
      return {
        ok: false,
        classification: "PACKET_SOURCE_FIELD_MISMATCH",
        reason: `Present source-owned field ${field} conflicts with canonical source/const value`,
        field,
      };
    }
  }

  const out = { ...packet };
  const completed = [];
  for (const [field, meta] of Object.entries(SOURCE_FIELD_ALLOWLIST)) {
    if (Object.prototype.hasOwnProperty.call(out, field)) continue; // present incl null/false/[]/""
    const canon = canonicalValue(meta, consumerInput);
    if (!canon.ok) {
      return {
        ok: false,
        classification: "PACKET_SOURCE_FIELD_MISMATCH",
        reason: `Cannot resolve canonical value for missing field ${field}: ${canon.reason}`,
        field,
      };
    }
    // Clone arrays/objects so we never share mutable refs accidentally.
    out[field] = Array.isArray(canon.value)
      ? [...canon.value]
      : canon.value !== null && typeof canon.value === "object"
        ? { ...canon.value }
        : canon.value;
    completed.push(field);
  }

  return {
    ok: true,
    packet: out,
    applied: completed.length > 0,
    completed_fields: completed,
    deterministic_completion: {
      applied: completed.length > 0,
      completed_fields: completed,
    },
  };
}
