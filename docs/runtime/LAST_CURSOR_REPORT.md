# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_GLM_LIVE_RESUME_POST_QUOTA_RESET
result_cursor: STOP
reported_via: cursor_direct_persistence
starting_head_task_expected: f7f534cf33ccfda4d06f962b4842edbb1c96c6a4
starting_head_observed: a7525fb7ff35e97eeb452da5559c433b94d3c1a7
trigger_sha: 34ba537fe9e46906026ac1699debe8424fe70b18
final_head: fbb57335587cb7687902d6e7cb7ed60977b50280
operator_quota_release_reported: true

wf40_execution_id: 285346
wf61_execution_id: 285347
adapter: REMOTE_DISPATCH_READY
litellm_request_delta: 1
glm_provider_attempt_delta: 1
http_status: 200
terminal_classification: SSE_NO_COMPLETED_RESPONSE
sse_normalization: FAIL
response_gate: NOT_REACHED
schema_gate: NOT_REACHED
policy_gate: NOT_REACHED
execution_packet_generated: false
cursor_dispatch: 0
retry: 0
fallback: 0
qwen_calls: 0
codex_calls: 0
gate_closed_final: true
WF61_final: inactive
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
workflow_mutations: 0
secret_exposure: false

issue_31: OPEN
issue_31_comment: 5459670470

architecture_report: reports/architecture/d0025_primary_remote_glm_live_001.md

NEXT: bounded SSE terminal-event remediation (no completed / no output_item.done); gate stays CLOSED
```
