# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF61_FINALIZE_FAILURE_OBSERVABILITY_FIX_AND_RESUME
result_cursor: STOP_D0025_RETRY5_LITELLM_HTTP_FAILURE_STATUS_0
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_wf40_rundata_plus_litellm_logs
report_persistence_commit: ab6c9df12718c7e761e760b043c02a2ee4f778f7
classification: PHASE_A_PASS_PHASE_B_LITELLM_HTTP_FAILURE_NO_PROXY_HIT

repo_head_at_start: 63d88ee926cce1fb1436b86babd825c295524c42
artifact_path: workflows/patches/d0025-w-wf61-finalize-failure-observability-fix.gpt-web.json
template_apply_commit: de8c3b92e21bccf496198c4caeb81e0dfdf93e24
wf61_pre_versionId: c9c97f71-d934-4efd-b423-7aaaec11f86c
wf61_post_apply_versionId: d0f88e31-4756-471a-9544-1bcfc40a52b2
graph_equivalence: PASS except node 6109 command
node_6109_command_apply: PASS
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md
auto_via_release: github:issue/31#issuecomment-5458229605

trigger_commit_sha: c06b8be967c9e7dbbd3bcc4c2727d01f5787c4c0
backlog_path: docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md
task_id: D-0025-W-GLM-LIVE-001
yaml_unchanged: true

adapter_offline: REMOTE_DISPATCH_READY
adapter_live: REMOTE_DISPATCH_READY
selected_planner: glm

WF40_execution_id: 284881
WF61_execution_id: 284882
wf61_new_execution_count_this_pass: 1
litellm_request_delta: 0
provider_attempt_delta: 0
http_status: 0

finalize_classification: LITELLM_HTTP_FAILURE
finalize_reason_sanitized: Single LiteLLM HTTP attempt did not return 2xx; retry is forbidden
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

NEXT_GATE: diagnose WF61 LiteLLM HTTP status-0 with zero proxy hits; then one bounded resume of D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001

APPLY_REPORT: reports/architecture/d0025_wf61_finalize_failure_observability_fix_apply.md
REPORT: reports/architecture/d0025_primary_remote_glm_live_001.md
```
