# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0017-W
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: 2f89561e459becf8c7d505d84142c7df356987ad

repo_head_observed_at_task: 680b25b8be6a9082854e5f53554ab1a7764b5229
workspace_at_start: clean
issue: 23

validator_entrypoint: tools/validate-execution-packet-v1.mjs
schema_source: docs/contracts/execution-packet-v1.schema.json
schema_engine: "environment-provided ajv draft-2020-12 + ajv-formats (resolved via npm root -g / firebase-tools tree; no package.json added; no install/download performed)"
contract_duplication_in_code: false

test_runner: tests/execution-packet-validator/run.mjs
fixtures:
  - tests/execution-packet-validator/fixtures/valid-packet.json -> PASS
  - tests/execution-packet-validator/fixtures/invalid-missing-required.json -> MISSING_REQUIRED_FIELD
  - tests/execution-packet-validator/fixtures/invalid-enum.json -> INVALID_ENUM
  - tests/execution-packet-validator/fixtures/invalid-schema-version.json -> INVALID_SCHEMA_VERSION
  - tests/execution-packet-validator/fixtures/invalid-additional-property.json -> ADDITIONAL_PROPERTY

local_test_summary:
  passed: 5
  failed: 0
  total: 5
  exit_code: 0

network_access: false
provider_model_request_count: 0
openclaw_mutation: false
n8n_mutation: false
dependency_manager_created: false
packages_installed: false
execution_packet_md_mutated: false
execution_packet_schema_mutated: false
d0016_mutated: false

NEXT_GATE_CLASSIFICATION: D0017_W_COMPLETE_D0016_W_PHASE_B_REMAINS_HOME_HOST_GATED
```

## Evidence boundary

Implemented a deterministic Execution Packet validator that loads `docs/contracts/execution-packet-v1.schema.json` and validates packet JSON via environment-provided Ajv 2020-12 (no new dependency manager, no install/download). Local fixture suite: 1 valid PASS + 4 invalid FAIL with machine-readable classifications and correct exit codes. No OpenClaw/n8n/provider/network access. Contract markdown/schema left unchanged.

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
