# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF61_HTTP_STATUS0_DIAGNOSE_AND_CONDITIONAL_RESUME
result_cursor: STOP_D0025_RETRY6_SSE_NO_COMPLETED_RESPONSE
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_transport_diagnostics_plus_wf40_rundata_plus_litellm_logs
report_persistence_commit: PENDING_SELF_REFERENCE
classification: TRANSPORT_HEALTHY_NONPERSISTENT_TIMEOUT_THEN_SSE_NORMALIZATION_BLOCKED

repo_head_at_start: 0ce82f8afd535ef7b96472ac8d30a1cf119dccde
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md
auto_via_release: github:issue/31#issuecomment-5458375723

transport_diagnosis:
  n8n_execution_context_dns: litellm-primary -> 172.18.0.3 OK
  tcp_4000_from_n8n: connected
  readiness_from_n8n: 200 healthy
  docker_network_membership: both root_default (172.18.0.2 / 172.18.0.3)
  litellm_container: running, restarts=0, unchanged since 14:01Z
  wf61_http_node_template_equivalence: true
  retry5_transport_error_recoverable: none retained (child rundata pruned); parent node executionTime=120632ms ~= canonical 120s timeout; zero proxy hits => nonpersistent upstream-latency client timeout (CASE 1)
  workflow_template_equivalence: PASS (HTTP node identical; no mutation required)

phase_b_entered: true
trigger_commit_sha: 48c7c7c8b7a932ec53509a8cd77f715cdf5d2800
WF40_execution_id: 284952
WF61_execution_id: 284953
wf61_new_execution_count_this_pass: 1
litellm_request_delta: 1
provider_attempt_delta: 1
http_status: 200
selected_planner: glm
adapter_classification: REMOTE_DISPATCH_READY

terminal_classification: SSE_NO_COMPLETED_RESPONSE
terminal_reason_sanitized: No response.completed terminal event found
response_gate_result: FAIL_AT_SSE_NORMALIZATION
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
glm_budget: 2/10
litellm_total_v1_responses: 2

NEXT_GATE: GPT-Web bounded SSE normalization artifact (handle GLM /v1/responses streams closing without response.completed); then one bounded resume of D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001

DIAGNOSIS_REPORT: reports/architecture/d0025_wf61_http_status0_diagnosis.md
REPORT: reports/architecture/d0025_primary_remote_glm_live_001.md
```
