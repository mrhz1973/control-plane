# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_WF61_LIVE_CANONICAL_RESYNC_AFTER_6106_TYPE_DRIFT
result_cursor: PASS_WF61_LIVE_CANONICAL_RESYNC_AFTER_6106_TYPE_DRIFT
reported_via: cursor_direct_persistence
starting_head: e2a2320ee8f62353b443c1c9628775bf58a36c07
final_head: PENDING_COMMIT

mutation: live_and_template_6104_6106_6107_6109_6110_from_gpt_web_sources
template_live_equiv: true
wf61_live_versionId: 8690b057-bfc6-4ee9-a968-936046ff497f
helper_terminal_json_preserved: true
http_wall_timeout_preserved: true
http_body_idle_timeout_preserved: true
http_body_too_large_preserved: true
http_request_error_preserved: true
http_response_aborted_preserved: true
http_completed_preserved: true
live_6106_type: n8n-nodes-base.executeCommand
live_6106_exit_normalization: "2>&1 || true"
provider_calls: 0
tranche_02_glm_used: 0/10
tranche_02_litellm_used: 0/10
gate_closed_final: true
WF61_final: inactive
schema_mutated: false
normalizer_mutated: false
helper_mutated: false
case_b_helper_mutated: false
node_6112_mutated: false

architecture_report: reports/architecture/d0025_wf61_live_canonical_resync_after_6106_type_drift.md

NEXT: one bounded D-0025-W tranche02 live event (max GLM Δ=1, LiteLLM Δ=1, retry=0, fallback=0, Codex=0, Qwen=0, Cursor auto-dispatch=0) — NOT executed in this pass
```
