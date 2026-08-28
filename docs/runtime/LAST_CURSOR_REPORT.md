# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF40_WF60_PARALLEL_NONBLOCKING_FOR_BACKLOG_LANE
result_cursor: PASS_D0025_WF60_PARALLEL_NONBLOCKING_GATE_CLOSED
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_export_and_natural_poll_rundata
report_persistence_commit: a171bff0b3fc534e60279e22db72cdbd42ba9336
classification: WF60_EXECUTE_NONBLOCKING_APPLIED

repo_head_observed_at_task: 9fba3618067f57b82128c08811adedb31042852c
workspace_at_start: clean
operator_gate_ref: github:issue/31#5455016687
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md
issue_31_state: OPEN
patch_artifact: workflows/patches/d0025-w-wf40-wf60-nonblocking.gpt-web.json

WF40_PRE:
  id: 9ZMj2ACTKyDVhCue
  active: true
  versionId: 48c30f4a-124c-48a4-b240-c2f6eca4743e
  node_count: 44

WF40_POST:
  id: 9ZMj2ACTKyDVhCue
  active: true
  versionId: b05501c1-8df7-4853-9674-2e35ca393a07
  node_count: 44

target_node_id: d0015f40-0060-4001-8001-000000000060
continueOnFail_before: false_or_absent
continueOnFail_after: true
graph_equivalence_excluding_single_property: PASS

WF60_state: inactive
WF61_state: inactive
WF61_execution_count: 0

runtime_gate: {enabled: false, provider_calls_authorized_per_event: 0}
provider_calls: 0
inference: 0
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false
rollback_performed: false

natural_poll_validation:
  result: PASS_WF60_NO_LONGER_ABORTS_SIBLINGS
  sample_exec_ids: [284201, 284203, 284205]
  in_process_continueOnFail: true
  siblings_observed_after_wf60: true
  note: GIS_handoff_hard_fail_may_still_abort_lower_siblings_under_v1_out_of_scope

NEXT_GATE: D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE_RETRY

REPORT: reports/architecture/d0025_wf40_wf60_parallel_nonblocking_apply.md
```
