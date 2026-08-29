# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_WF61_BODY_SHAPE_CAPTURE_AND_RESUME
result_cursor: PASS_BODY_SHAPE_CAPTURED
reported_via: cursor_direct_persistence
starting_head: 3a537b9d28603c56f03e140a41f0dccc3d29b6fb
apply_trigger_sha: 42aba26e1c04c4f4aad8db50462ec1eb2f64b99f
final_head: 84c0018d42a2e3481d7ad9e9b441f9f024dc6034

apply_phase: PASS
preflight: PASS
apply_provider_calls: 0
preflight_provider_calls: 0
nodes_changed: [6107, 6110]

live_resume: CAPTURE_PASS
wf40_execution_id: 285449
wf61_execution_id: 285450
http_status: 200
classification: SSE_NO_COMPLETED_RESPONSE
litellm_request_delta: 1
glm_provider_attempt_delta: 1
sse_census_present: true
data_event_count: 0
body_shape_present: true
body_shape_framing: JSON_OBJECT
body_shape_top_level_keys: [data, headers, statusCode, statusMessage]
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

architecture_report: reports/architecture/d0025_wf61_body_shape_capture.md

NEXT: offline remediate n8n fullResponse data unwrap before Responses/SSE normalization
```
