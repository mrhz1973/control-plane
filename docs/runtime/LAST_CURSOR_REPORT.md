# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE_RETRY
result_cursor: STOP_D0025_GLM_SMOKE_RETRY_WF60_BLOCKS_BACKLOG_LANE
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_export_positions_and_execution_rundata
report_persistence_commit: f2271b4794905ebb3bf6c62aff619c88532c0a2c
classification: SMOKE_NOT_EXECUTED_WF60_BLOCKS_CANONICAL_LANE

repo_head_observed_at_task: 7d2567489fbc4954b56562876d21f0c95bae2427
workspace_at_start: clean
operator_gate_ref: github:issue/31#5454884137
issue_31_state: OPEN
selected_planner: glm

trigger_backlog_path: null
trigger_commit_sha: null
cleanup_commit_sha: null
adapter_classification: NOT_RUN

WF40_execution_id: null_for_smoke
WF61_execution_id: null
WF61_execution_count: 0
provider_attempt_count: 0
normalized_provider_result: NOT_ATTEMPTED
response_gate_result: NOT_RUN
schema_gate_result: NOT_RUN
packet_policy_result: NOT_RUN
task_id_result: NOT_RUN

retry: 0
fallback: 0
qwen: 0
codex: 0
cursor_dispatch: 0

runtime_gate_before: {enabled: false, provider_calls_authorized_per_event: 0}
runtime_gate_during: {enabled: false, provider_calls_authorized_per_event: 0}
runtime_gate_after: {enabled: false, provider_calls_authorized_per_event: 0}
final_gate_closed: true

blocker:
  type: WF60_LEGACY_INACTIVE_EXECUTE_ABORTS_SIBLINGS
  wf40_executionOrder: v1
  wf60_position: [-720, -160]
  backlog_stub_position: [-720, 752]
  observed_error: Workflow is not active and cannot be executed.
  backlog_lane_nodes_reached: false

WF40_preservation: true
WF61_preservation: true
WF60_OpenClaw_preservation: true
LiteLLM_preservation: true
GitHub_credential_preservation: true
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false

NEXT_GATE: D-0025-W_WF40_WF60_PARALLEL_NONBLOCKING_FOR_BACKLOG_LANE

REPORT: reports/architecture/d0025_primary_remote_glm_single_smoke_retry.md
```
