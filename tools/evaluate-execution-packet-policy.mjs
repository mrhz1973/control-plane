#!/usr/bin/env node
/**
 * D-0021-W — Deterministic Execution Packet policy gate evaluator.
 *
 * Applies docs/contracts/execution-packet-policy-gate-v1.md verbatim.
 * Validates against execution-packet-v1.schema.json first. No Cursor
 * dispatch, Telegram, OpenClaw, network, or provider access.
 *
 * Usage:
 *   node tools/evaluate-execution-packet-policy.mjs <packet.json>
 *
 * Exit:
 *   PROCEED / GATE -> 0
 *   BLOCKED / tooling error -> non-zero
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validatePacketObject } from "./validate-execution-packet-v1.mjs";

export const POLICY_RESULT_SCHEMA = "execution-packet-policy-result-v1";

/** Canonical GATE reason accumulation order (contract §3.B). */
export const GATE_REASON_ORDER = [
  "PACKET_ALREADY_GATED",
  "RISK_HIGH",
  "SCOPE_EXPANSION",
  "DESTRUCTIVE",
  "PRODUCTION_SENSITIVE",
  "CREDENTIALS_OR_BILLING",
  "PLANNER_RECOMMENDED_GATE",
  "PLANNER_FALLBACK_REQUIRES_EQUIVALENCE_GATE",
];

function emit(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

function baseResult(extra = {}) {
  return {
    schema: POLICY_RESULT_SCHEMA,
    task_id: null,
    packet_id: null,
    decision: "BLOCKED",
    cursor_dispatch_allowed: false,
    human_gate_required: false,
    reason_codes: [],
    ...extra,
  };
}

function exitCodeFor(decision) {
  if (decision === "PROCEED" || decision === "GATE") return 0;
  return 1;
}

/**
 * Evaluate a packet object against the GPT-Web policy contract.
 * Does not write stdout or exit.
 */
export async function evaluatePacketPolicy(packet) {
  const taskId =
    packet && typeof packet === "object" && typeof packet.task_id === "string"
      ? packet.task_id
      : null;
  const packetId =
    packet && typeof packet === "object" && typeof packet.packet_id === "string"
      ? packet.packet_id
      : null;

  const schemaResult = await validatePacketObject(packet);
  if (!schemaResult.ok) {
    return baseResult({
      task_id: taskId,
      packet_id: packetId,
      decision: "BLOCKED",
      cursor_dispatch_allowed: false,
      human_gate_required: false,
      reason_codes: ["PACKET_SCHEMA_INVALID"],
      schema_validation: {
        classification: schemaResult.classification,
        reason: schemaResult.reason,
      },
    });
  }

  if (packet.status === "SUPERSEDED") {
    return baseResult({
      task_id: taskId,
      packet_id: packetId,
      decision: "BLOCKED",
      cursor_dispatch_allowed: false,
      human_gate_required: false,
      reason_codes: ["PACKET_SUPERSEDED"],
    });
  }

  const reason_codes = [];
  const risk = packet.risk_assessment || {};
  const gateRec = packet.gate_recommendation || {};
  const planner = packet.planner || {};

  if (packet.status === "GATED") {
    reason_codes.push("PACKET_ALREADY_GATED");
  }
  if (risk.level === "high") {
    reason_codes.push("RISK_HIGH");
  }
  if (risk.scope_expansion === true) {
    reason_codes.push("SCOPE_EXPANSION");
  }
  if (risk.destructive === true) {
    reason_codes.push("DESTRUCTIVE");
  }
  if (risk.production_sensitive === true) {
    reason_codes.push("PRODUCTION_SENSITIVE");
  }
  if (risk.credentials_or_billing === true) {
    reason_codes.push("CREDENTIALS_OR_BILLING");
  }
  if (gateRec.required === true) {
    reason_codes.push("PLANNER_RECOMMENDED_GATE");
  }
  if (planner.fallback_used === true) {
    reason_codes.push("PLANNER_FALLBACK_REQUIRES_EQUIVALENCE_GATE");
  }

  // Enforce canonical order even if accumulation order drifts.
  const ordered = GATE_REASON_ORDER.filter((code) =>
    reason_codes.includes(code),
  );

  if (ordered.length > 0) {
    return baseResult({
      task_id: taskId,
      packet_id: packetId,
      decision: "GATE",
      cursor_dispatch_allowed: false,
      human_gate_required: true,
      reason_codes: ordered,
    });
  }

  return baseResult({
    task_id: taskId,
    packet_id: packetId,
    decision: "PROCEED",
    cursor_dispatch_allowed: true,
    human_gate_required: false,
    reason_codes: [],
  });
}

async function main() {
  const packetPath = process.argv[2];
  if (!packetPath) {
    emit(
      baseResult({
        decision: "BLOCKED",
        reason_codes: ["USAGE_ERROR"],
        reason:
          "Usage: node tools/evaluate-execution-packet-policy.mjs <packet.json>",
      }),
      1,
    );
  }

  const abs = resolve(process.cwd(), packetPath);
  if (!existsSync(abs)) {
    emit(
      baseResult({
        decision: "BLOCKED",
        reason_codes: ["PACKET_NOT_FOUND"],
        reason: `File not found: ${abs}`,
        packet_path: abs,
      }),
      1,
    );
  }

  let packet;
  try {
    packet = JSON.parse(readFileSync(abs, "utf8").replace(/^\uFEFF/, ""));
  } catch (err) {
    emit(
      baseResult({
        decision: "BLOCKED",
        reason_codes: ["PACKET_SCHEMA_INVALID"],
        reason: `Packet JSON parse failed: ${String(err.message || err)}`,
        packet_path: abs,
      }),
      1,
    );
  }

  const result = await evaluatePacketPolicy(packet);
  emit(
    {
      ...result,
      packet_path: abs,
    },
    exitCodeFor(result.decision),
  );
}

const isDirectRun =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((err) => {
    emit(
      baseResult({
        decision: "BLOCKED",
        reason_codes: ["POLICY_INTERNAL_ERROR"],
        reason: String(err && err.stack ? err.stack : err),
      }),
      1,
    );
  });
}
