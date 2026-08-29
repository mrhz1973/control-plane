# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_WF61_SSE_STRUCTURAL_CAPTURE_AND_RESUME
result_cursor: STOP
reported_via: cursor_direct_persistence
starting_head: 5ccfd724f0787b1e7ca052e0d5c6d5f09bb98acb
apply_commit: 489431086b2524378b69d554852d20a0af362e17
final_head: PENDING_COMMIT

apply_phase: PASS
apply_provider_calls: 0
nodes_changed: [6107, 6110]
wf61_inactive_after_apply: true
gate_closed_during_apply: true

live_resume: STOP
wf40_execution_id: 285395
wf61_execution_id: 285396
classification: LITELLM_HTTP_FAILURE
http_status: 0
litellm_request_delta: 0
glm_provider_attempt_delta: 0
sse_census: null
capture_jscode_retained: true
retry: 0
fallback: 0
qwen_calls: 0
codex_calls: 0
cursor_dispatch: 0
gate_closed_final: true
WF61_final: inactive
raw_model_content_persisted: false
secrets_exposed: false
normalizer_mutated: false

architecture_report: reports/architecture/d0025_wf61_sse_structural_capture.md

NEXT: one capture resume after status-0/transport healthy; no normalizer change without census
```
