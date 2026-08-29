# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_WF61_HANGPROOF_HTTP_BRIDGE
result_cursor: PASS_WF61_HANGPROOF_HTTP_BRIDGE_APPLIED_OFFLINE
reported_via: cursor_direct_persistence
starting_head: b968a1417240112820d1a50e0c3ae6aaa8d7048b
final_head: PENDING_SELF_REFERENCE

helper_path: tools/post-litellm-primary-one-shot.mjs
mock_suite: tests/litellm-primary-one-shot/run.mjs
mock_passed: 7
nodes_changed: [d0025-6104, d0025-6106, d0025-6107]
wf61_live_versionId: 8776dda8-e8d1-4df9-86f9-530f23409277
authorized_template_live_equiv: true
live_6110_case_b_present: false
live_6110_drift_preexisting: true
provider_calls: 0
litellm_request_delta: 0
glm_delta: 0
glm_budget_final: 10/10
gate_closed_final: true
WF61_final: inactive
schema_mutated: false
normalizer_mutated: false
case_b_helper_mutated: false

architecture_report: reports/architecture/d0025_wf61_hangproof_http_bridge_apply.md

NEXT: re-sync live 6110 CASE B from template; then human gate for new bounded GLM budget before any live retry
```
