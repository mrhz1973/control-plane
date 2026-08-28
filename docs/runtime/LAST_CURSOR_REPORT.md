# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF40_PARENT_WIRING_APPLY
result_cursor: PASS_D0025_WF40_PRIMARY_REMOTE_PARENT_LANE_WIRED_GATE_CLOSED
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_export_compare
report_persistence_commit: PENDING_SELF_REFERENCE
classification: WF40_PRIMARY_REMOTE_PARENT_LANE_WIRED_GATE_CLOSED

repo_head_observed_at_task: 18b56bb38012c12a61e9306c5c41788905462212
workspace_at_start: clean
operator_gate_ref: github:issue/31#5454498686
issue_31_state: OPEN

WF40_PRE:
  id: 9ZMj2ACTKyDVhCue
  active: true
  versionId: 86ed5569-ce2b-49bb-9f3b-30f4e7fa918b
  node_count: 35

WF40_POST:
  id: 9ZMj2ACTKyDVhCue
  active: true
  versionId: 48c30f4a-124c-48a4-b240-c2f6eca4743e
  node_count: 44

ADDED_NODE_IDS:
  - d0025f40-6101-4001-8001-000000000101
  - d0025f40-6102-4002-8002-000000000102
  - d0025f40-6103-4003-8003-000000000103
  - d0025f40-6104-4004-8004-000000000104
  - d0025f40-6105-4005-8005-000000000105
  - d0025f40-6106-4006-8006-000000000106
  - d0025f40-6107-4007-8007-000000000107
  - d0025f40-6108-4008-8008-000000000108
  - d0025f40-6109-4009-8009-000000000109

CONNECTION_EQUIVALENCE: PASS
LEGACY_LANE_PRESERVATION: PASS
SOURCE_PARALLEL_TARGETS: [Code - Detect real docs/plans plan files, Code - Detect canonical backlog item]
WF61_EXECUTE_TARGET: d0025-6100-4001-8001-000000000061

WF60_PRESERVATION: unchanged_inactive
WF61_STATE: inactive_not_executed
LITELLM_UNCHANGED: true

RUNTIME_GATE:
  unchanged: true
  enabled: false
  provider_calls_authorized_per_event: 0

HELPER_TESTS_AT_APPLY: 18/18 PASS

BUDGET_THIS_PASS:
  workflow_mutations: 1
  wf40_executions: 0
  wf61_executions: 0
  provider_calls: 0
  inference: 0
  credential_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
GITHUB_CRED_METADATA_CLONED: {id: 7u1QOkEiYcdKncmd, name: GitHub account}

ROLLBACK_PERFORMED: false

NEXT_GATE: D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_OPERATOR_GATE

REPORT: reports/architecture/d0025_wf40_parent_wiring_apply.md
```
