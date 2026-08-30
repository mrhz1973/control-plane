#!/usr/bin/env node
/**
 * reconcile-n8n-child-execution-v1.mjs
 *
 * Deterministic overlay reconciling logical child execution state vs n8n
 * accounting state for integrated sub-workflows. NEVER mutates n8n DB.
 *
 * Contract: docs/contracts/n8n-child-execution-reconciliation-v1.md
 *
 * Usage:
 *   node reconcile-n8n-child-execution-v1.mjs [--input-file evidence.json]
 *   cat evidence.json | node reconcile-n8n-child-execution-v1.mjs
 *
 * ZERO PROVIDER CALLS · ZERO DB ACCESS
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const SCHEMA = "n8n-child-execution-reconciliation-v1";

const TERMINAL_ACCOUNTING_STATUSES = new Set(["success", "error", "crashed", "canceled"]);

function normId(v) {
  if (v === null || v === undefined) return null;
  return String(v).trim();
}

function isTruthyFinished(v) {
  return v === true || v === 1 || v === "1";
}

function hasLiveLeak(runtime = {}) {
  return Boolean(
    runtime.live_process_seen || runtime.task_runner_leak_seen || runtime.helper_process_leak_seen,
  );
}

export function deriveAccountingState(childAccounting = {}) {
  const { row_exists, status, finished } = childAccounting;
  if (row_exists === false) return "PURGED";
  if (row_exists !== true) return "UNKNOWN";
  const st = status === null || status === undefined ? null : String(status).toLowerCase();
  if (st === "running") return "STALE_RUNNING";
  if (TERMINAL_ACCOUNTING_STATUSES.has(st) || isTruthyFinished(finished)) return "CONSISTENT_TERMINAL";
  return "UNKNOWN";
}

export function deriveLogicalState(evidence) {
  const parent = evidence.parent ?? {};
  const engine = evidence.child_engine_evidence ?? {};
  const runtime = evidence.runtime ?? {};
  const parentId = normId(evidence.parent_execution_id);
  const childId = normId(evidence.child_execution_id);
  const subId = normId(parent.subexecution_id);

  if (hasLiveLeak(runtime)) return "RUNNING_OR_UNKNOWN";

  const terminalSuccess =
    String(parent.status ?? "").toLowerCase() === "success" &&
    subId !== null &&
    childId !== null &&
    subId === childId &&
    parent.returned_result_seen === true &&
    engine.workflow_success_seen === true &&
    engine.terminal_return_seen === true;

  if (terminalSuccess) return "TERMINAL_SUCCESS";
  return "RUNNING_OR_UNKNOWN";
}

export function reconcileChildExecution(rawEvidence) {
  const evidence = rawEvidence ?? {};
  const reason_codes = [];
  const parent = evidence.parent ?? {};
  const runtime = evidence.runtime ?? {};
  const childId = normId(evidence.child_execution_id);
  const subId = normId(parent.subexecution_id);

  const accounting_state = deriveAccountingState(evidence.child_accounting ?? {});
  const logical_state = deriveLogicalState(evidence);

  let reconciliation_classification = "INSUFFICIENT_EVIDENCE";
  let operational_block = false;

  if (hasLiveLeak(runtime)) {
    if (runtime.live_process_seen) reason_codes.push("LIVE_PROCESS_SEEN");
    if (runtime.task_runner_leak_seen) reason_codes.push("TASK_RUNNER_LEAK_SEEN");
    if (runtime.helper_process_leak_seen) reason_codes.push("HELPER_PROCESS_LEAK_SEEN");
    reconciliation_classification = "POSSIBLE_LIVE_EXECUTION";
    operational_block = true;
  } else if (subId === null || childId === null || subId !== childId) {
    reason_codes.push("SUBEXECUTION_ID_MISMATCH");
    reconciliation_classification = "INSUFFICIENT_EVIDENCE";
  } else if (parent.returned_result_seen !== true) {
    reason_codes.push("PARENT_RETURNED_RESULT_MISSING");
    reconciliation_classification = "INSUFFICIENT_EVIDENCE";
  } else if (evidence.child_engine_evidence?.workflow_success_seen !== true) {
    reason_codes.push("WORKFLOW_SUCCESS_EVIDENCE_MISSING");
    reconciliation_classification = "INSUFFICIENT_EVIDENCE";
  } else if (evidence.child_engine_evidence?.terminal_return_seen !== true) {
    reason_codes.push("TERMINAL_RETURN_EVIDENCE_MISSING");
    reconciliation_classification = "INSUFFICIENT_EVIDENCE";
  } else if (String(parent.status ?? "").toLowerCase() !== "success") {
    reason_codes.push("PARENT_NOT_SUCCESS");
    reconciliation_classification = "INSUFFICIENT_EVIDENCE";
  } else if (logical_state === "TERMINAL_SUCCESS") {
    if (accounting_state === "CONSISTENT_TERMINAL") {
      reconciliation_classification = "CONSISTENT";
      reason_codes.push("LOGICAL_AND_ACCOUNTING_TERMINAL");
    } else if (accounting_state === "STALE_RUNNING") {
      reconciliation_classification = "LOGICALLY_TERMINAL_ACCOUNTING_STALE";
      reason_codes.push("ACCOUNTING_STALE_RUNNING");
    } else if (accounting_state === "PURGED") {
      reconciliation_classification = "LOGICALLY_TERMINAL_ACCOUNTING_PURGED";
      reason_codes.push("ACCOUNTING_ROW_PURGED");
    } else {
      reconciliation_classification = "INSUFFICIENT_EVIDENCE";
      reason_codes.push("ACCOUNTING_STATE_UNKNOWN");
    }
  } else {
    reason_codes.push("LOGICAL_TERMINAL_NOT_PROVEN");
    reconciliation_classification = "INSUFFICIENT_EVIDENCE";
  }

  return {
    schema: SCHEMA,
    parent_execution_id: normId(evidence.parent_execution_id),
    child_execution_id: childId,
    logical_state,
    accounting_state,
    reconciliation_classification,
    operational_block,
    historical_row_mutation_allowed: false,
    reason_codes,
  };
}

/** Sanitized canonical fixture for Event03 child 287888 (purged accounting). */
export function fixture287888Purged() {
  return {
    parent_execution_id: "287887",
    child_execution_id: "287888",
    child_workflow_id: "d0025-6100-4001-8001-000000000061",
    parent: {
      status: "success",
      subexecution_id: "287888",
      returned_result_seen: true,
    },
    child_accounting: {
      row_exists: false,
      status: null,
      stopped_at: null,
      finished: null,
    },
    child_engine_evidence: {
      workflow_success_seen: true,
      terminal_return_seen: true,
    },
    runtime: {
      live_process_seen: false,
      task_runner_leak_seen: false,
      helper_process_leak_seen: false,
    },
  };
}

/** Contemporaneous stale-running shape from Event03 live observation. */
export function fixture287888StaleRunning() {
  return {
    ...fixture287888Purged(),
    child_accounting: {
      row_exists: true,
      status: "running",
      stopped_at: null,
      finished: 0,
    },
  };
}

function readInput(argv) {
  const fileIdx = argv.indexOf("--input-file");
  if (fileIdx >= 0) {
    const path = argv[fileIdx + 1];
    if (!path) throw new Error("INPUT_INVALID: --input-file requires path");
    return JSON.parse(readFileSync(path, "utf8"));
  }
  if (!process.stdin.isTTY) {
    const buf = readFileSync(0, "utf8");
    if (buf.trim()) return JSON.parse(buf);
  }
  throw new Error("INPUT_INVALID: provide --input-file or stdin JSON");
}

function main(argv = process.argv.slice(2)) {
  let evidence;
  try {
    evidence = readInput(argv);
  } catch (e) {
    console.error(JSON.stringify({ ok: false, classification: "INPUT_INVALID", reason: String(e.message) }));
    process.exit(2);
  }
  const result = reconcileChildExecution(evidence);
  console.log(JSON.stringify(result));
}

const isDirect =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirect) {
  main();
}
