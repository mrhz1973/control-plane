# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0020-W
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 6c839e634308ebc18ee9bb63309ed871dddb7175
workspace_at_start: clean
issue: 26

harness: tests/openclaw-consumer-roundtrip/run.mjs
composition: D-0019 request builder → synthetic OpenResponses fixture → D-0018 response gate → D-0017 packet validator
fixture_kind: synthetic_openresponses_offline_fixture
not_claimed: [provider_success, model_success, openclaw_runtime_success, phase_c_pass]

d0020_roundtrip:
  ok: true
  classification: PASS
  request_builder: PASS
  response_gate: PASS
  packet_validator: PASS
  tamper_tests_passed: 6
  tamper_tests_total: 6
  network_access: false
  provider_model_request_count: 0
  credential_access: 0

tamper_classifications:
  - task_id_modified -> INPUT_MISMATCH
  - hard_constraints_reordered -> HARD_CONSTRAINT_MISMATCH
  - planner_requested_modified -> PLANNER_MISMATCH
  - function_name_changed -> FUNCTION_CALL_NAME
  - packet_schema_invalid -> PACKET_SCHEMA_INVALID
  - request_builder_secret_boundary -> PASS

d0017_regression:
  runner: tests/execution-packet-validator/run.mjs
  passed: 5
  failed: 0
  total: 5
  exit_code: 0

d0018_regression:
  runner: tests/openclaw-planner-response-gate/run.mjs
  passed: 15
  failed: 0
  total: 15
  exit_code: 0

d0019_regression:
  runner: tests/openclaw-request-builder/run.mjs
  passed: 15
  failed: 0
  total: 15
  exit_code: 0

openclaw_mutation: false
n8n_mutation: false
vps_mutation: false
dependency_manager_created: false
packages_installed: false
d0016_phase_b_executed: false

NEXT_GATE_CLASSIFICATION: D0020_W_COMPLETE
```

## Evidence boundary

Offline round-trip harness proves D-0019 → D-0018 → D-0017 composition with synthetic fixtures only. Tamper suite fail-closed with expected classifications. No network/provider/runtime/credential access. D-0016-W Phase B not executed. This is not Phase C inference evidence.

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
