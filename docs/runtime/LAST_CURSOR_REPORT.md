# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0018-W
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 2e54ba7b82c79c8aa0cf23b5bedd8f16bf892c07
workspace_at_start: clean
issue: 24

mapping_source: docs/contracts/execution-packet-hard-constraints-mapping-v1.md
mapping_integrated: true

contract_updates:
  - docs/contracts/execution-packet-v1.md (required hard_constraints: []; planner exact-copy obligation)
  - docs/contracts/execution-packet-v1.schema.json (required array<string>)
  - docs/contracts/openclaw-execution-packet-consumer-v1.md (tool schema + HARD_CONSTRAINT_MISMATCH)

gate_entrypoint: tools/validate-openclaw-planner-response-gate.mjs
hard_constraint_check: exact deep-array equality (length/order/string identity; no trim/case-fold/normalize/dedup)
stable_mismatch_classification: HARD_CONSTRAINT_MISMATCH
HARD_CONSTRAINT_MAPPING_UNDEFINED_operational_blocker: removed

d0017_regression:
  runner: tests/execution-packet-validator/run.mjs
  passed: 5
  failed: 0
  total: 5
  exit_code: 0

d0018_tests:
  runner: tests/openclaw-planner-response-gate/run.mjs
  passed: 15
  failed: 0
  total: 15
  exit_code: 0
  added_cases:
    - hard-constraints-identical -> PASS
    - hard-constraints-missing -> HARD_CONSTRAINT_MISMATCH
    - hard-constraints-reordered -> HARD_CONSTRAINT_MISMATCH
    - hard-constraints-modified -> HARD_CONSTRAINT_MISMATCH
    - hard-constraints-empty-ok -> PASS
    - hard-constraints-empty-input-nonempty-packet -> HARD_CONSTRAINT_MISMATCH

network_access: false
provider_model_request_count: 0
openclaw_mutation: false
n8n_mutation: false
vps_mutation: false
dependency_manager_created: false
packages_installed: false
d0016_phase_b_executed: false

NEXT_GATE_CLASSIFICATION: D0018_W_COMPLETE
```

## Evidence boundary

Incorporated GPT-Web hard-constraints mapping verbatim into execution-packet contract, machine schema, OpenClaw consumer contract, D-0017 fixtures, and D-0018 response gate. Exact deep-array equality enforces `HARD_CONSTRAINT_MISMATCH`. D-0017 5/5 PASS; D-0018 15/15 PASS. No runtime/network/provider/credential access. D-0016-W Phase B not executed.

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
