#!/usr/bin/env node
/**
 * D-0025-W CASE B — targeted offline tests for source-field completion.
 * Zero network / provider / inference.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPacketCensus,
  completePrimaryRemotePacketSourceFields,
} from "../../tools/complete-primary-remote-packet-source-fields.mjs";
import { finalizeCycle } from "../../tools/run-litellm-primary-cycle.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function clone(v) {
  return structuredClone(v);
}

function parseArgs(response) {
  const call = (response.output || []).find(
    (o) => o && o.type === "function_call" && o.name === "emit_execution_packet",
  );
  return JSON.parse(call.arguments);
}

function withPacket(response, packetMutator) {
  const r = clone(response);
  const packet = parseArgs(r);
  const next = packetMutator(packet);
  for (let i = 0; i < r.output.length; i++) {
    if (r.output[i]?.type === "function_call" && r.output[i]?.name === "emit_execution_packet") {
      r.output[i] = { ...r.output[i], arguments: JSON.stringify(next) };
    }
  }
  return r;
}

function censusHasNoValues(census) {
  const blob = JSON.stringify(census);
  // Ensure we never embed model prose / path values from packet content as census "values".
  // Census may include key names like allowed_paths; that is OK.
  if (census.top_level_keys && !Array.isArray(census.top_level_keys)) return false;
  if (census.missing_top_level_required && !Array.isArray(census.missing_top_level_required)) {
    return false;
  }
  for (const nk of Object.keys(census.nested_objects || {})) {
    const n = census.nested_objects[nk];
    if (n.keys !== null && !Array.isArray(n.keys) && n.keys !== undefined) return false;
    if (
      n.missing_required !== "n/a_not_object" &&
      n.missing_required !== null &&
      !Array.isArray(n.missing_required)
    ) {
      return false;
    }
  }
  // No nested packet content blobs
  if (/"goal"\s*:\s*"Implement/.test(blob)) return false;
  if (/"packet_id"\s*:\s*"EP-/.test(blob)) return false;
  return true;
}

const consumer = readJson(
  join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json"),
);
const responseValid = readJson(
  join(ROOT, "tests/openclaw-consumer-roundtrip/fixtures/synthetic-response-valid.json"),
);

const cases = [];

function check(name, fn) {
  cases.push({ name, fn });
}

check("helper-missing-allowed_paths", () => {
  const packet = parseArgs(responseValid);
  delete packet.allowed_paths;
  const r = completePrimaryRemotePacketSourceFields(packet, consumer);
  if (!r.ok) return JSON.stringify(r);
  if (!Array.isArray(r.packet.allowed_paths)) return "allowed_paths not array";
  if (JSON.stringify(r.packet.allowed_paths) !== JSON.stringify(consumer.allowed_paths)) {
    return "allowed_paths not exact consumer copy";
  }
  if (!r.completed_fields.includes("allowed_paths")) return "completed_fields missing allowed_paths";
  return null;
});

check("helper-missing-forbidden_paths-and-hard_constraints", () => {
  const packet = parseArgs(responseValid);
  delete packet.forbidden_paths;
  delete packet.hard_constraints;
  const r = completePrimaryRemotePacketSourceFields(packet, consumer);
  if (!r.ok) return JSON.stringify(r);
  if (JSON.stringify(r.packet.forbidden_paths) !== JSON.stringify(consumer.forbidden_paths)) {
    return "forbidden_paths mismatch";
  }
  if (JSON.stringify(r.packet.hard_constraints) !== JSON.stringify(consumer.hard_constraints)) {
    return "hard_constraints mismatch";
  }
  return null;
});

check("helper-missing-consts", () => {
  const packet = parseArgs(responseValid);
  delete packet.schema;
  delete packet.executor;
  delete packet.final_report_contract;
  const r = completePrimaryRemotePacketSourceFields(packet, consumer);
  if (!r.ok) return JSON.stringify(r);
  if (r.packet.schema !== "execution-packet-v1") return "schema const";
  if (r.packet.executor !== "cursor") return "executor const";
  if (r.packet.final_report_contract !== "docs/foundation/CURSOR_PROMPT_TEMPLATE.md") {
    return "final_report_contract const";
  }
  return null;
});

check("helper-present-conflict-fail-closed", () => {
  const packet = parseArgs(responseValid);
  packet.allowed_paths = ["totally-wrong"];
  const before = structuredClone(packet.allowed_paths);
  const r = completePrimaryRemotePacketSourceFields(packet, consumer);
  if (r.ok) return "expected fail";
  if (r.classification !== "PACKET_SOURCE_FIELD_MISMATCH") {
    return `expected PACKET_SOURCE_FIELD_MISMATCH got ${r.classification}`;
  }
  if (JSON.stringify(packet.allowed_paths) !== JSON.stringify(before)) {
    return "packet was mutated on conflict";
  }
  return null;
});

check("helper-present-null-false-empty-not-overwritten", () => {
  const packet = parseArgs(responseValid);
  packet.goal = "";
  packet.allowed_paths = [];
  packet.hard_constraints = null;
  // branch_target false is weird but must be treated present
  packet.repository = false;
  const r = completePrimaryRemotePacketSourceFields(packet, consumer);
  // repository false conflicts with string canonical -> mismatch
  if (r.ok) return "expected conflict on repository=false";
  if (r.classification !== "PACKET_SOURCE_FIELD_MISMATCH") {
    return `expected PACKET_SOURCE_FIELD_MISMATCH got ${r.classification}`;
  }
  // Now test non-conflicting present empties that equal canonical when empty
  const packet2 = parseArgs(responseValid);
  const consumerEmpty = {
    ...consumer,
    allowed_paths: [],
    forbidden_paths: [],
    hard_constraints: [],
    goal: "",
  };
  packet2.allowed_paths = [];
  packet2.forbidden_paths = [];
  packet2.hard_constraints = [];
  packet2.goal = "";
  const r2 = completePrimaryRemotePacketSourceFields(packet2, consumerEmpty);
  if (!r2.ok) return JSON.stringify(r2);
  if (r2.completed_fields.length !== 0) return "should not complete present empties";
  if (!Array.isArray(packet2.allowed_paths) || packet2.allowed_paths.length !== 0) {
    return "allowed_paths overwritten";
  }
  return null;
});

check("helper-missing-steps-not-synthesized", () => {
  const packet = parseArgs(responseValid);
  delete packet.steps;
  const r = completePrimaryRemotePacketSourceFields(packet, consumer);
  if (!r.ok) return JSON.stringify(r);
  if (Object.prototype.hasOwnProperty.call(r.packet, "steps")) {
    return "steps must not be synthesized";
  }
  return null;
});

check("finalize-missing-allowed_paths-completed", async () => {
  const response = withPacket(responseValid, (p) => {
    delete p.allowed_paths;
    return p;
  });
  const result = await finalizeCycle({
    consumerInput: consumer,
    rawResponseText: JSON.stringify(response),
    responseSourceFormat: "json",
  });
  if (!result.ok) return JSON.stringify(result);
  if (JSON.stringify(result.packet.allowed_paths) !== JSON.stringify(consumer.allowed_paths)) {
    return "finalize allowed_paths not restored";
  }
  if (!result.deterministic_completion?.completed_fields?.includes("allowed_paths")) {
    return "completion metadata missing allowed_paths";
  }
  if (!result.packet_census_before_completion?.missing_top_level_required?.includes("allowed_paths")) {
    return "census did not record missing allowed_paths before completion";
  }
  if (!censusHasNoValues(result.packet_census_before_completion)) {
    return "census leaked values";
  }
  return null;
});

check("finalize-missing-steps-remains-schema-invalid", async () => {
  const response = withPacket(responseValid, (p) => {
    delete p.steps;
    return p;
  });
  const result = await finalizeCycle({
    consumerInput: consumer,
    rawResponseText: JSON.stringify(response),
    responseSourceFormat: "json",
  });
  if (result.ok) return "expected FAIL";
  if (result.classification !== "PACKET_SCHEMA_INVALID") {
    return `expected PACKET_SCHEMA_INVALID got ${result.classification}`;
  }
  if (result.deterministic_completion && result.deterministic_completion.completed_fields?.includes("steps")) {
    return "steps must not be completed";
  }
  return null;
});

check("finalize-missing-status-remains-schema-invalid", async () => {
  const response = withPacket(responseValid, (p) => {
    delete p.status;
    return p;
  });
  const result = await finalizeCycle({
    consumerInput: consumer,
    rawResponseText: JSON.stringify(response),
    responseSourceFormat: "json",
  });
  if (result.ok) return "expected FAIL";
  if (result.classification !== "PACKET_SCHEMA_INVALID") {
    return `expected PACKET_SCHEMA_INVALID got ${result.classification}`;
  }
  return null;
});

check("finalize-valid-packet-still-pass", async () => {
  const result = await finalizeCycle({
    consumerInput: consumer,
    rawResponseText: JSON.stringify(responseValid),
    responseSourceFormat: "json",
  });
  if (!result.ok) return JSON.stringify(result);
  if (result.response_gate !== "PASS") return "response gate";
  if (result.deterministic_completion?.applied !== false) {
    return "valid packet should not need completion";
  }
  if (!censusHasNoValues(result.packet_census_before_completion)) return "census values";
  return null;
});

check("census-keys-only", () => {
  const packet = parseArgs(responseValid);
  delete packet.allowed_paths;
  delete packet.planner;
  const census = buildPacketCensus(packet);
  if (!census.missing_top_level_required.includes("allowed_paths")) return "missing allowed_paths";
  if (!census.missing_top_level_required.includes("planner")) return "missing planner";
  if (census.nested_objects.planner.present !== false) return "planner present flag";
  if (!censusHasNoValues(census)) return "values leaked";
  return null;
});

async function main() {
  let failed = 0;
  for (const c of cases) {
    let detail;
    try {
      detail = await c.fn();
    } catch (err) {
      detail = String(err && err.stack ? err.stack : err);
    }
    const pass = detail === null;
    if (!pass) failed++;
    console.log(`${pass ? "PASS" : "FAIL"} ${c.name} — ${pass ? "ok" : detail}`);
  }
  const summary = {
    ok: failed === 0,
    passed: cases.length - failed,
    failed,
    total: cases.length,
    provider_calls: 0,
  };
  console.log(JSON.stringify(summary));
  process.exit(failed === 0 ? 0 : 1);
}

main();
