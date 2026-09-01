#!/usr/bin/env node
/**
 * Monitor Windows authorization state for WF40 PG live 005 proof.
 * Read-only; no mutations.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RUN = process.env.RUN_NONCE || 'WF40_PG_FIRST_LIVE_005_20260901_01';
const BASE = join(process.env.LOCALAPPDATA || '', 'control-plane');
const PENDING = join(BASE, 'v4-runtime-authorization-pending-v1.json');
const REGISTRY = join(BASE, 'v4-runtime-authorization-registry-v1.json');
const LEDGER = join(BASE, 'v4-runtime-authorization-spend-ledger-v1.json');
const TASK_ID = 'TASK-V4-WF40-PG-LIVE-005';
const SCOPE = 'ca501cb41602028c4e575a08bcdfc491a793b7cb462790a6f3a4fc67efdb85aa';

function load(p) {
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}

const baselinePending = load(PENDING)?.decisions?.length ?? 0;
const baselineSpends = load(LEDGER)?.spends?.length ?? 0;
const baselineRegistry = load(REGISTRY)?.entries?.length ?? 0;

console.log(JSON.stringify({ phase: 'baseline', baselinePending, baselineSpends, baselineRegistry, RUN }));

const seen = new Set();
const deadline = Date.now() + 30 * 60 * 1000;

while (Date.now() < deadline) {
  const pending = load(PENDING);
  const registry = load(REGISTRY);
  const ledger = load(LEDGER);
  const newDecisions = (pending?.decisions || []).slice(baselinePending);
  const target = newDecisions.find((d) => d.task_id === TASK_ID) || newDecisions.at(-1);
  if (target && !seen.has('pending')) {
    seen.add('pending');
    const keys = Object.keys(target.register_body || target).sort();
    console.log(JSON.stringify({
      phase: 'register_observed',
      pending_decision_id: target.pending_decision_id,
      authorization_id: target.authorization_id,
      execution_id: target.execution_id,
      task_id: target.task_id,
      route_id: target.route_id,
      scope_digest: target.scope_digest,
      state: target.state,
      scope_match: target.scope_digest === SCOPE,
    }));
  }
  if (target?.state === 'ISSUED' && !seen.has('issued')) {
    seen.add('issued');
    console.log(JSON.stringify({ phase: 'telegram_issued', pending_decision_id: target.pending_decision_id, decision_at: target.decision_at, selected_option: target.selected_option }));
  }
  const newSpends = (ledger?.spends || []).slice(baselineSpends);
  if (newSpends.length && !seen.has('ledger')) {
    seen.add('ledger');
    console.log(JSON.stringify({ phase: 'ledger_admission', spends: newSpends }));
  }
  const active = (registry?.entries || []).filter((e) => e.state === 'ACTIVE');
  const spentNew = (registry?.entries || []).slice(baselineRegistry).filter((e) => e.state === 'SPENT');
  if (spentNew.length && !seen.has('spent')) {
    seen.add('spent');
    console.log(JSON.stringify({ phase: 'auth_spent', entries: spentNew }));
  }
  if (target?.state === 'ISSUED' && newSpends.length && spentNew.length) {
    console.log(JSON.stringify({ phase: 'complete', active_remaining: active.length }));
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 2000));
}
console.log(JSON.stringify({ phase: 'timeout' }));
process.exit(2);
