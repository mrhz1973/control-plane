# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_GLM_LIVE_RESUME_AFTER_PACKET_HARDENING
result_cursor: STOP_PACKET_SCHEMA_INVALID_ALLOWED_PATHS
reported_via: cursor_direct_persistence
starting_head: 085254af5ee7803f170aa4a256cea56b751a2637
trigger_sha: c3ea49249e6988a777fce4817407524bb9b38f22
final_head: 26ffcd40d81e2bcd0b52e4370794b1406d300ff2

precheck: PASS
provider_calls_precheck: 0
live_resume: STOP
wf40_execution_id: 286045
wf61_execution_id: 286046
http_status: 200
classification: PACKET_SCHEMA_INVALID
first_remaining_required_field: allowed_paths
reason: Missing required field: allowed_paths
litellm_request_delta: 1
glm_provider_attempt_delta: 1
litellm_total: 8
glm_budget: 8/10
has_packet: false
retry: 0
fallback: 0
qwen_calls: 0
codex_calls: 0
cursor_dispatch: 0
gate_closed_final: true
WF61_final: inactive
normalizer_mutated: false
schema_mutated: false
unwrap_retained: true
raw_model_content_persisted: false
secrets_exposed: false

architecture_report: reports/architecture/d0025_glm_live_resume_after_packet_hardening.md

NEXT: offline remediate PACKET_SCHEMA_INVALID missing allowed_paths
```
