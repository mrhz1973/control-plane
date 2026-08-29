# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_STATUS0_PREFLIGHT_AND_SSE_CAPTURE_RESUME
result_cursor: PASS_CENSUS_CAPTURED
reported_via: cursor_direct_persistence
starting_head: b5ed90098d2d13c58f2eb97a78d87b90cf2bda1d
trigger_sha: f50622768fbfc0eb90c6d52bbc4e3c8d65a9571b
final_head: PENDING_COMMIT

preflight: PASS
preflight_provider_calls: 0
dns_tcp_readiness_network: PASS
pre_trigger_readiness: PASS

live_resume: CAPTURE_PASS
wf40_execution_id: 285414
wf61_execution_id: 285415
http_status: 200
classification: SSE_NO_COMPLETED_RESPONSE
litellm_request_delta: 1
glm_provider_attempt_delta: 1
sse_census_present: true
data_event_count: 0
done_marker_count: 0
parse_error_count: 0
event_types: []
retry: 0
fallback: 0
qwen_calls: 0
codex_calls: 0
cursor_dispatch: 0
gate_closed_final: true
WF61_final: inactive
capture_retained: true
raw_model_content_persisted: false
secrets_exposed: false
normalizer_mutated: false

architecture_report: reports/architecture/d0025_status0_preflight_and_sse_capture_resume.md

NEXT: offline remediation from empty-data-event census under HTTP 200
```
