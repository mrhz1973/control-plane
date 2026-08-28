# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001_RETRY_3
result_cursor: STOP_D0025_GLM_LIVE_001_RETRY3_WF61_ITEM_MODE_RETURN_ARRAY_INVALID
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_execution_rundata_plus_litellm_logs
report_persistence_commit: PENDING_SELF_REFERENCE
classification: GLM_LIVE_CYCLE_WF61_ABORTED_BEFORE_LITELLM_RETURN_SHAPE

repo_head_at_start: 4fc160a81cd633348915131b4a767fda7055a647
trigger_commit_sha: fdbbd487f343fdc1c83fa233c7e1b74864282bc7
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md

backlog_path: docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md
task_id: D-0025-W-GLM-LIVE-001
yaml_unchanged: true

adapter_offline: REMOTE_DISPATCH_READY
adapter_live: REMOTE_DISPATCH_READY
selected_planner: glm

WF40_execution_id: 284783
WF61_execution_id: 284784
wf61_new_execution_count_this_pass: 1
wf61_total_execution_count: 2
litellm_request_count: 0
provider_attempt_count: 0

response_gate_result: NOT_REACHED
schema_gate_result: NOT_REACHED
packet_policy_result: NOT_REACHED
packet_path: null

runtime_gate_before: {enabled: false, provider_calls_authorized_per_event: 0}
runtime_gate_during: {enabled: true, provider_calls_authorized_per_event: 1, allowed_planners: [glm]}
runtime_gate_after: {enabled: false, provider_calls_authorized_per_event: 0}
final_gate_closed: true

WF61_state_before: inactive
WF61_state_during: active_temporarily
WF61_state_after: inactive

blocker: WF61 node Parse prepare result fail-closed rejects GPT-Web jsCode return of array [{json:...}] in runOnceForEachItem mode (requires single item {json:...}) — error A 'json' property isn't an object; failure before LiteLLM HTTP node
retry: 0
fallback: 0
qwen: 0
codex: 0
cursor_dispatch: 0
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false
glm_budget: 0/10

NEXT_GATE: D-0025-W_WF61_TEMPLATE_ITEM_RETURN_SHAPE_FIX

REPORT: reports/architecture/d0025_primary_remote_glm_live_001.md
```
