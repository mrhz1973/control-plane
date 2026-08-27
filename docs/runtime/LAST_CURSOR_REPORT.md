# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0015-W
result_cursor: PASS_WF40_WF60_PARENT_WIRING_APPLIED_VERBATIM
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_n8n_export_import_structural
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: bfba5f7b1f16c99aedc532222afe704ad23c3775
workspace_at_start: clean
artifact: workflows/patches/d0015-w-wf40-wf60-parent-wiring.gpt-web.json
override: PERSIST_APPLY_VERBATIM_GPT_B_SUPPLIED_WORKFLOW_ARTIFACT

preconditions_live: PASS
  live_id: 9ZMj2ACTKyDVhCue
  live_name: "40 - CP v4 multirepo + classifier bridge - ACTIVE"
  active_before: true
  versionId_before: 028cd44a-508d-4573-b9cd-70d6338110b3
  if_new_commit_true_before:
    - "IF - GIS repo for handoff?"
    - "Data Table - Upsert last seen commit"
    - "Code - Plan watcher repo gate stub"
  if_new_commit_false_before:
    - "Duplicate skip - no Telegram"
  execute_workflow_nodes_before: []

operations_applied_verbatim:
  - op: add_node
    node_id: d0015f40-0060-4001-8001-000000000060
    node_name: "Execute Workflow - Resolve OpenClaw broker (WF60)"
    type: n8n-nodes-base.executeWorkflow
    typeVersion: 1
    workflowId: d0015600-4001-8001-0001-0653506aabcd
    position: [-720, -160]
  - op: append_connection
    from: "IF - New commit?"
    output_type: main
    output_index: 0
    preserve_all_existing_connections: true
    to: "Execute Workflow - Resolve OpenClaw broker (WF60)"

post_apply_live:
  active_after: true
  listed_in_n8n_active_true: true
  versionId_after: 86ed5569-ce2b-49bb-9f3b-30f4e7fa918b
  node_count_after: 35
  execute_workflow_nodes_after_count: 1
  execute_workflow_nodes_after:
    - name: "Execute Workflow - Resolve OpenClaw broker (WF60)"
      id: d0015f40-0060-4001-8001-000000000060
      workflowId: d0015600-4001-8001-0001-0653506aabcd
  if_new_commit_true_after:
    - "IF - GIS repo for handoff?"
    - "Data Table - Upsert last seen commit"
    - "Code - Plan watcher repo gate stub"
    - "Execute Workflow - Resolve OpenClaw broker (WF60)"
  if_new_commit_false_after:
    - "Duplicate skip - no Telegram"

structural_reexport_redacted: workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json

wf40_executed_for_validation: false
wf42_mutation: false
wf41_mutation: false
wf60_mutation: false
endpoint_mutation: false
gateway_auth_mode_mutation: false
provider_model_request_count: 0
credential_values_read: false
SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUES_PERSISTED: false

NEXT_GATE_CLASSIFICATION: D0015_W_AUTHENTICATED_OPENCLAW_INVOCATION_DELTA_REQUIRES_GPT_WEB_AUTHORING
```

## Evidence boundary

Applied GPT-Web delta `workflows/patches/d0015-w-wf40-wf60-parent-wiring.gpt-web.json` verbatim to live WF40 `9ZMj2ACTKyDVhCue` after precondition PASS (name/active/versionId/TRUE three-way fork/FALSE duplicate-skip/no prior Execute Workflow node). Added exactly one Execute Workflow node targeting WF60 `d0015600-4001-8001-0001-0653506aabcd` and appended it as fourth TRUE target of `IF - New commit?` without altering existing TRUE/FALSE branches. WF40 remains active. Structural redacted re-export persisted. No WF40 execution for validation; no provider/model calls; no credential values read/persisted.

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
