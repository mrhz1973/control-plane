# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_GLM_LIVE_RESUME_AFTER_REQUIRED_FIELDS_HARDENING
result_cursor: STOP_PACKET_SCHEMA_INVALID_ALLOWED_PATHS_PERSISTENT
reported_via: cursor_direct_persistence
starting_head: 86aa18f32c8e066809386dec8db9998a0df806b0
trigger_sha: 6cd2d2310b6233ead2470159ef2e10d9b439822e
final_head: PENDING_COMMIT

precheck: PASS
provider_calls_precheck: 0
live_resume: STOP
wf40_execution_id: 286080
wf61_execution_id: 286081
http_status: 200
classification: PACKET_SCHEMA_INVALID
first_remaining_required_field: allowed_paths
reason: Missing required field: allowed_paths
litellm_request_delta: 1
glm_provider_attempt_delta: 1
litellm_total: 9
glm_budget: 9/10
has_packet: false
instruction_hardening_cleared_finding: false
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

architecture_report: reports/architecture/d0025_glm_live_resume_after_required_fields_hardening.md

NEXT: offline CASE A for persistent PACKET_SCHEMA_INVALID missing allowed_paths
```
