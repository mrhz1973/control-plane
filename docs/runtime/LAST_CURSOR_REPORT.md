# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0019-W
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: b86f618988844110fd40fec36098160de934f4c8
workspace_at_start: clean
issue: 25

builder_entrypoint: tools/build-openclaw-responses-request.mjs
consumer_input_schema: docs/contracts/openclaw-consumer-input-v1.schema.json
parameters_source: docs/contracts/execution-packet-v1.schema.json (loaded; not hand-duplicated)
model: openclaw/default
stream: false
tool: emit_execution_packet (exactly one; tool_choice pinned)
provider_override: absent
secrets_in_output: false
authorization_header_value: not_included
openclaw_config_read: false

canonical_serialization: >
  fixed envelope key insertion order; body.input structured-clone of
  validated consumer_input preserving key/array order; parameters =
  JSON.parse of canonical packet schema; compact JSON.stringify stdout;
  no timestamps/random IDs.

d0019_tests:
  runner: tests/openclaw-request-builder/run.mjs
  passed: 15
  failed: 0
  total: 15
  exit_code: 0

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

network_access: false
provider_model_request_count: 0
credential_access: 0
openclaw_mutation: false
n8n_mutation: false
vps_mutation: false
dependency_manager_created: false
packages_installed: false
d0016_phase_b_executed: false

NEXT_GATE_CLASSIFICATION: D0019_W_COMPLETE
```

## Evidence boundary

Implemented repo-only deterministic OpenClaw `/v1/responses` request builder: validates `consumer_input` against GPT-Web schema, emits non-secret envelope with parameters sourced from `execution-packet-v1.schema.json`. D-0019 15/15 PASS; D-0017 5/5 PASS; D-0018 15/15 PASS. No runtime/network/provider/credential access. D-0016-W Phase B not executed.

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
