# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001_RETRY_2
result_cursor: STOP_D0025_GLM_LIVE_001_RETRY2_WF61_CODE_NODE_ITEM_MODE_DEFECT
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_execution_rundata_plus_litellm_logs
report_persistence_commit: PENDING_SELF_REFERENCE
classification: GLM_LIVE_CYCLE_DISPATCHED_BUT_WF61_ABORTED_BEFORE_LITELLM

repo_head_at_start: 8f82a4118a41bc67341628f31d22e439b5a6b71a
trigger_commit_sha: 7d195047d31e665c3885d58cb00dc886ea7cf766
release_ref: github:issue/31#5457565004
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md

backlog_path: docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md
task_id: D-0025-W-GLM-LIVE-001
yaml_unchanged: true

adapter_offline: REMOTE_DISPATCH_READY
adapter_live: REMOTE_DISPATCH_READY
selected_planner: glm

WF40_execution_id: 284722
WF61_execution_id: 284723
WF61_execution_count: 1
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

blocker: WF61 node Parse prepare result fail-closed aborts with Can't use .first() here — template Code nodes use mode runOnceForEachItem with $input.first() which is invalid per-item; failure before HTTP Request - LiteLLM node
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

NEXT_GATE: D-0025-W_WF61_TEMPLATE_CODE_NODE_ITEM_ACCESS_FIX

REPORT: reports/architecture/d0025_primary_remote_glm_live_001.md
```
