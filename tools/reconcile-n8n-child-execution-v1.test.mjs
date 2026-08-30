#!/usr/bin/env node
/**
 * Deterministic tests for reconcile-n8n-child-execution-v1.mjs
 * No network · no DB · no provider calls.
 */

import {
  reconcileChildExecution,
  fixture287888Purged,
  fixture287888StaleRunning,
} from "./reconcile-n8n-child-execution-v1.mjs";

let failed = 0;
function check(name, cond, detail = "") {
  if (cond) console.log(`PASS ${name}`);
  else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? " — " + detail : ""}`);
  }
}

function baseEvidence(overrides = {}) {
  const base = {
    parent_execution_id: "100",
    child_execution_id: "200",
    child_workflow_id: "wf-child",
    parent: {
      status: "success",
      subexecution_id: "200",
      returned_result_seen: true,
    },
    child_accounting: {
      row_exists: true,
      status: "success",
      stopped_at: "2026-08-29T23:08:41.193Z",
      finished: 1,
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
  return merge(base, overrides);
}

function merge(base, patch) {
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object") {
      out[k] = { ...out[k], ...v };
    } else {
      out[k] = v;
    }
  }
  return out;
}

// A — consistent
{
  const r = reconcileChildExecution(baseEvidence());
  check("A_consistent_classification", r.reconciliation_classification === "CONSISTENT");
  check("A_logical_terminal", r.logical_state === "TERMINAL_SUCCESS");
  check("A_accounting_consistent", r.accounting_state === "CONSISTENT_TERMINAL");
  check("A_operational_block_false", r.operational_block === false);
}

// B — stale running
{
  const ev = merge(baseEvidence(), {
    child_accounting: { row_exists: true, status: "running", stopped_at: null, finished: 0 },
  });
  const r = reconcileChildExecution(ev);
  check("B_stale_classification", r.reconciliation_classification === "LOGICALLY_TERMINAL_ACCOUNTING_STALE");
  check("B_stale_accounting", r.accounting_state === "STALE_RUNNING");
  check("B_stale_operational_block", r.operational_block === false);
}

// C — purged
{
  const ev = merge(baseEvidence(), {
    child_accounting: { row_exists: false, status: null, stopped_at: null, finished: null },
  });
  const r = reconcileChildExecution(ev);
  check("C_purged_classification", r.reconciliation_classification === "LOGICALLY_TERMINAL_ACCOUNTING_PURGED");
  check("C_purged_accounting", r.accounting_state === "PURGED");
  check("C_purged_operational_block", r.operational_block === false);
}

// D — workflow_success missing
{
  const ev = merge(baseEvidence(), {
    child_engine_evidence: { workflow_success_seen: false, terminal_return_seen: true },
  });
  const r = reconcileChildExecution(ev);
  check("D_insufficient", r.reconciliation_classification === "INSUFFICIENT_EVIDENCE");
}

// E — parent result absent
{
  const ev = merge(baseEvidence(), { parent: { returned_result_seen: false } });
  const r = reconcileChildExecution(ev);
  check("E_insufficient", r.reconciliation_classification === "INSUFFICIENT_EVIDENCE");
}

// F — live process
{
  const ev = merge(baseEvidence(), { runtime: { live_process_seen: true } });
  const r = reconcileChildExecution(ev);
  check("F_possible_live", r.reconciliation_classification === "POSSIBLE_LIVE_EXECUTION");
  check("F_block", r.operational_block === true);
}

// G — task runner leak
{
  const ev = merge(baseEvidence(), { runtime: { task_runner_leak_seen: true } });
  const r = reconcileChildExecution(ev);
  check("G_possible_live", r.reconciliation_classification === "POSSIBLE_LIVE_EXECUTION");
}

// H — helper leak
{
  const ev = merge(baseEvidence(), { runtime: { helper_process_leak_seen: true } });
  const r = reconcileChildExecution(ev);
  check("H_possible_live", r.reconciliation_classification === "POSSIBLE_LIVE_EXECUTION");
}

// I — subexecution mismatch
{
  const ev = merge(baseEvidence(), { parent: { subexecution_id: "999" } });
  const r = reconcileChildExecution(ev);
  check("I_insufficient", r.reconciliation_classification === "INSUFFICIENT_EVIDENCE");
}

// J — historical_row_mutation_allowed always false
{
  const cases = [
    baseEvidence(),
    merge(baseEvidence(), { child_accounting: { row_exists: false } }),
    merge(baseEvidence(), { runtime: { live_process_seen: true } }),
  ];
  for (const [i, ev] of cases.entries()) {
    const r = reconcileChildExecution(ev);
    check(`J_no_mutation_${i}`, r.historical_row_mutation_allowed === false);
  }
}

// Historical 287888 purged fixture
{
  const r = reconcileChildExecution(fixture287888Purged());
  check("287888_logical", r.logical_state === "TERMINAL_SUCCESS");
  check("287888_purged_class", r.reconciliation_classification === "LOGICALLY_TERMINAL_ACCOUNTING_PURGED");
  check("287888_no_block", r.operational_block === false);
  check("287888_no_mutation", r.historical_row_mutation_allowed === false);
}

// Historical 287888 stale-running contemporaneous fixture
{
  const r = reconcileChildExecution(fixture287888StaleRunning());
  check("287888_stale_class", r.reconciliation_classification === "LOGICALLY_TERMINAL_ACCOUNTING_STALE");
  check("287888_stale_logical", r.logical_state === "TERMINAL_SUCCESS");
}

if (failed > 0) {
  console.error(JSON.stringify({ ok: false, failed }));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, classification: "ALL_PASS" }));
