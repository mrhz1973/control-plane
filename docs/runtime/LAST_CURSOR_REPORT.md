# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0021-W
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: af56b57104b7182cbc56580a8df2074cc1436d78
workspace_at_start: clean
issue: 27

policy_contract: docs/contracts/execution-packet-policy-gate-v1.md
evaluator: tools/evaluate-execution-packet-policy.mjs
schema_parity_fix:
  - loop.max_rounds maximum 10
  - review.max_review_rounds maximum 10

d0021_tests:
  runner: tests/execution-packet-policy-gate/run.mjs
  passed: 15
  failed: 0
  total: 15
  exit_code: 0

decisions_covered:
  - PROCEED (clean low-risk)
  - GATE (RISK_HIGH, SCOPE_EXPANSION, DESTRUCTIVE, PRODUCTION_SENSITIVE, CREDENTIALS_OR_BILLING, PLANNER_RECOMMENDED_GATE, PLANNER_FALLBACK_REQUIRES_EQUIVALENCE_GATE, PACKET_ALREADY_GATED, multi-reason order, READY_FOR_EXECUTION+destructive)
  - BLOCKED (PACKET_SUPERSEDED, PACKET_SCHEMA_INVALID, max_rounds=11, max_review_rounds=11)

cursor_dispatch_executed: false
telegram_used: false
network_access: false
provider_model_request_count: 0
credential_access: 0
openclaw_mutation: false
n8n_mutation: false
vps_mutation: false
dependency_manager_created: false
packages_installed: false
d0016_phase_b_executed: false

d0017_regression: {passed: 5, failed: 0, total: 5, exit_code: 0}
d0018_regression: {passed: 15, failed: 0, total: 15, exit_code: 0}
d0019_regression: {passed: 15, failed: 0, total: 15, exit_code: 0}
d0020_regression: {ok: true, classification: PASS, exit_code: 0}

NEXT_GATE_CLASSIFICATION: D0021_W_COMPLETE
```

## Evidence boundary

Implemented GPT-Web policy gate verbatim with schema boundedness parity for loop/review max rounds. Local policy tests 15/15 PASS; regressions D-0017–D-0020 PASS. No Cursor dispatch, Telegram, OpenClaw, network, or provider access. D-0016-W Phase B not executed.

## Completion persistence invariant

Per i task Cursor successivi, il report finale non deve restare soltanto nella chat Cursor.

Prima di dichiarare il task completamente chiuso, Cursor deve persistere in GitHub un aggiornamento docs-only di questo file con almeno:

- `task_ref` esatto;
- risultato `PASS|BLOCKED|FAILED`;
- evidence deterministica necessaria al gate/NEXT;
- HEAD/workspace osservati quando pertinenti;
- eventuali mutazioni runtime effettuate;
- `NEXT_GATE_CLASSIFICATION` o blocker esatto;
- nessun secret/token.

La persistenza del report è evidence bookkeeping recuperabile e non amplia lo scope runtime del task.

Se `agg` trova un `LAST_CURSOR_REPORT` che non corrisponde al pass Cursor atteso, deve classificare **`EVIDENCE_NOT_PERSISTED`**, non concludere che il task non sia stato eseguito.

## History

La cronologia precedente del rolling report resta recuperabile nella Git history. Il file corrente privilegia il LATEST necessario a `agg` e al resume lean.
