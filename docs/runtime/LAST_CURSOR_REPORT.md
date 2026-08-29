# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_GLM_LIVE_RESUME_AFTER_FULLRESPONSE_UNWRAP
result_cursor: STOP_PACKET_SCHEMA_INVALID
reported_via: cursor_direct_persistence
starting_head: f30cc6b91bed64f419feeb812b29b23da8d784aa
trigger_sha: bc94de8f119a4eaa4b8d021d49b78f30c8f28426
final_head: 12167dff4cc7952891c16b733a3d67a356165260

precheck: PASS
provider_calls_precheck: 0
live_resume: STOP
wf40_execution_id: 285530
wf61_execution_id: 285531
http_status: 200
classification: PACKET_SCHEMA_INVALID
reason: Missing required field: final_report_contract
litellm_request_delta: 1
glm_provider_attempt_delta: 1
litellm_total: 7
glm_budget: 7/10
unwrap_live_proven: true
body_shape_framing: JSON_OBJECT
body_shape_not_n8n_wrapper: true
sse_census_data_event_count: 0
retry: 0
fallback: 0
qwen_calls: 0
codex_calls: 0
cursor_dispatch: 0
gate_closed_final: true
WF61_final: inactive
normalizer_mutated: false
raw_model_content_persisted: false
secrets_exposed: false

architecture_report: reports/architecture/d0025_glm_live_resume_after_fullresponse_unwrap.md

NEXT: offline remediate PACKET_SCHEMA_INVALID missing final_report_contract
```
