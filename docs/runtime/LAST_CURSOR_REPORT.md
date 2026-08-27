# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0018-W
result_cursor: BLOCKED
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 7a02462a0f7f9f8ed2a72ac717c6759b070a8bb4
workspace_at_start: clean
issue: 24

blocker: HARD_CONSTRAINT_MAPPING_UNDEFINED
blocker_detail: >
  openclaw-execution-packet-consumer-v1.md requires hard_constraints to be
  preserved, but neither that contract nor execution-packet-v1 defines a
  deterministic unique packet field mapping for those strings. Gate refuses
  to invent semantics; non-empty hard_constraints fail closed with
  HARD_CONSTRAINT_MAPPING_UNDEFINED.

gate_entrypoint: tools/validate-openclaw-planner-response-gate.mjs
reuses: tools/validate-execution-packet-v1.mjs (validatePacketObject export)
schema_source: docs/contracts/execution-packet-v1.schema.json
dependency_manager_created: false
packages_installed: false

implemented_deterministic_checks:
  - response JSON parse
  - top-level API error reject
  - exactly one function_call
  - name == emit_execution_packet
  - arguments JSON object parse
  - canonical execution-packet-v1 schema validation
  - task_id/source_backlog_ref/repository/branch_target identity
  - executor == cursor
  - planner.requested == consumer_input.planner_requested
  - fallback metadata consistency
  - hard_constraints non-empty -> HARD_CONSTRAINT_MAPPING_UNDEFINED (no invented mapping)

d0018_tests:
  runner: tests/openclaw-planner-response-gate/run.mjs
  passed: 10
  failed: 0
  total: 10
  exit_code: 0

d0017_regression:
  runner: tests/execution-packet-validator/run.mjs
  passed: 5
  failed: 0
  total: 5
  exit_code: 0

network_access: false
provider_model_request_count: 0
openclaw_mutation: false
n8n_mutation: false
vps_mutation: false
contract_schema_mutated: false
d0016_phase_b_executed: false

NEXT_GATE_CLASSIFICATION: HARD_CONSTRAINT_PACKET_FIELD_MAPPING_CONTRACT_GATE_REQUIRED
```

## Evidence boundary

Implemented repo-only OpenClaw planner-response gate that validates saved non-streaming `/v1/responses` JSON + `consumer_input` without HTTP. Reuses D-0017 schema validation programmatically. Local gate fixtures 10/10 PASS including explicit `HARD_CONSTRAINT_MAPPING_UNDEFINED` when `hard_constraints` is non-empty. D-0017 regression 5/5 PASS. Task acceptance cannot be declared complete because the consumer contract does not define a deterministic packet-field mapping for hard-constraints preservation; no mapping was invented and contracts were not changed.

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
