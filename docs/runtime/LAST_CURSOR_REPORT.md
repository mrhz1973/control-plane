# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_WF61_POST_HTTP200_HANG_OFFLINE_DIAGNOSIS
result_cursor: PASS_WF61_HANG_HTTP_NODE_NOT_RETURNED
reported_via: cursor_direct_persistence
starting_head: c61952509c1e765a524ebdb7a203fbc8328c97c5
final_head: dcd6d11792f430611482364e1d20570f8c3bc301

primary_classification: WF61_HANG_HTTP_NODE_NOT_RETURNED
last_recoverable_stage: HTTP Request node d0025-6106 (never returned to Capture)
execution_286310_entity: purged
execution_286310_data: purged
parent_286309: success 09:58:02.013Z -> 09:59:10.583Z
litellm_http200_at: 2026-08-29T09:59:10.506Z
node_6106_timeout_ms: 120000
node_6109_timeout: none
case_b_offline_hang: false
case_b_large_finalize_ms: ~1677
workflow_mutated: false
tools_mutated: false
provider_calls: 0
litellm_request_delta: 0
glm_delta: 0
glm_budget_final: 10/10
gate_closed_final: true
WF61_final: inactive

architecture_report: reports/architecture/d0025_wf61_post_http200_hang_offline_diagnosis.md

NEXT: GPT-Web author node-6106 hang-proof HTTP completion/timeout artifact; new GLM budget required before any live retry
```
