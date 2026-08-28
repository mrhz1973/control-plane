# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001_RETRY_4
result_cursor: STOP_D0025_GLM_LIVE_001_RETRY4_FINALIZE_FAILED_AFTER_HTTP_200
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_wf40_rundata_plus_litellm_logs
report_persistence_commit: PENDING_SELF_REFERENCE
classification: GLM_LIVE_CYCLE_FINALIZE_FAILED_AFTER_LITELLM_200

repo_head_at_start: 706ac21969aeb662a59df4dd8f37dd29a2b0b184
trigger_commit_sha: 617f63391852a1f4dd0122cf025eaf33f544e2ea
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md
auto_via_release: github:issue/31#issuecomment-5457964584

backlog_path: docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md
task_id: D-0025-W-GLM-LIVE-001
yaml_unchanged: true

adapter_offline: REMOTE_DISPATCH_READY
adapter_live: REMOTE_DISPATCH_READY
selected_planner: glm

WF40_execution_id: 284816
WF61_execution_id: 284817
wf61_new_execution_count_this_pass: 1
wf61_total_execution_count_retained: 2
litellm_request_count: 1
provider_attempt_count: 1
http_status: 200

response_gate_result: NOT_CLAIMED_FINALIZE_FAILED
schema_gate_result: NOT_CLAIMED_FINALIZE_FAILED
packet_policy_result: NOT_CLAIMED_FINALIZE_FAILED
packet_path: null
cycle_classification: FINALIZE_FAILED
cycle_reason: canonical finalize failed

runtime_gate_before: {enabled: false, provider_calls_authorized_per_event: 0}
runtime_gate_during: {enabled: true, provider_calls_authorized_per_event: 1, allowed_planners: [glm]}
runtime_gate_after: {enabled: false, provider_calls_authorized_per_event: 0}
final_gate_closed: true

WF61_state_before: inactive
WF61_state_during: active_temporarily
WF61_state_after: inactive

blocker: WF61 returned FINALIZE_FAILED after LiteLLM POST /v1/responses HTTP 200; no Execution Packet; sole GLM attempt consumed
retry: 0
fallback: 0
qwen: 0
codex: 0
cursor_dispatch: 0
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false
glm_budget: 1/10

NEXT_GATE: diagnose/fix WF61 canonical finalize after GLM HTTP 200; then one bounded resume of D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001

REPORT: reports/architecture/d0025_primary_remote_glm_live_001.md
```
