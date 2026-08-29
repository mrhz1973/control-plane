# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_WF61_6110_CASE_B_RESYNC_AFTER_HANGPROOF
result_cursor: PASS_WF61_6110_CASE_B_RESYNCED_AFTER_HANGPROOF
reported_via: cursor_direct_persistence
starting_head: 60b580a54e08fbd93a1e92973e1aa98bacdc30d2
final_head: PENDING_COMMIT

artifact: workflows/patches/d0025-w-wf61-6110-case-b-resync-after-hangproof.gpt-web.json
mutation: live_6110_parameters_jsCode_only
template_mutated: false
wf61_live_versionId: 142ef860-a124-40fe-a99c-b2d26182764c
live_6110_template_equiv: true
packet_census_propagation: true
deterministic_completion_propagation: true
cursor_dispatch_allowed: false
nodes_changed: [d0025-6110]
hangproof_6104_6106_6107_preserved: true
live_6109_unchanged: true
provider_calls: 0
litellm_request_delta: 0
glm_delta: 0
glm_budget_final: 10/10
gate_closed_final: true
WF61_final: inactive
schema_mutated: false
normalizer_mutated: false
case_b_helper_mutated: false

architecture_report: reports/architecture/d0025_wf61_6110_case_b_resync_after_hangproof.md

NEXT: REAL HUMAN GATE — explicit authorization of a NEW bounded GLM budget before any further D-0025-W live retry (not authorized/created/armed/consumed in this pass)
```
