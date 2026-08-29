# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_GLM_FINAL_LIVE_RESUME_AFTER_CASE_B
result_cursor: STOP_WF61_HUNG_AFTER_LITELLM_HTTP_200
reported_via: cursor_direct_persistence
starting_head: cf0da2514f666d370c76d31bc6b96dcd015626ff
trigger_head: 4c263bd1a59f3a74b311ad1f63fd51b0fb4e9c0b
final_head: PENDING_SELF_REFERENCE

wf40_execution_id: 286309
wf61_execution_id: 286310
http_status_gateway: 200
classification: WF61_HUNG_AFTER_LITELLM_HTTP_200
has_cycle_result: false
packet_census: null
deterministic_completion: null
schema_result: unavailable
policy_result: unavailable
provider_calls: 1
litellm_request_delta: 1
glm_delta: 1
glm_budget_final: 10/10
cursor_dispatch: 0
retry: 0
fallback: 0
qwen: 0
codex: 0
gate_closed_final: true
WF61_final: inactive
issue_31: OPEN
d0025w_closed: false
raw_model_content_persisted: false
secrets_exposed: false

architecture_report: reports/architecture/d0025_glm_final_live_resume_after_case_b.md

NEXT: new budget authorization required before any further GLM live call; diagnose WF61 hang after LiteLLM HTTP 200
```
