# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_GLM_SSE_TERMINAL_EVENT_REMEDIATION
result_cursor: STOP
reported_via: cursor_direct_persistence
starting_head: d1a2077e82e177bb205bcdb166b7b696d8656dd3
final_head: PENDING_COMMIT
case: B
case_label: EXISTING_EVIDENCE_NOT_AVAILABLE
attempt9_wf40: 285346
attempt9_wf61: 285347
wf61_execution_present: false
raw_sse_body_available: false
sanitized_event_type_census: unavailable
normalizer_mutated: false
tests_run_for_new_shape: false
provider_calls: 0
litellm_requests: 0
glm_calls: 0
codex_calls: 0
qwen_calls: 0
workflow_mutations: 0
remote_runtime_gate: CLOSED
raw_model_content_persisted: false
secrets_exposed: false

architecture_report: reports/architecture/d0025_glm_sse_terminal_event_remediation.md

NEXT: capture sanitized SSE structural census on next authorized live resume; no invented normalizer semantics
```
