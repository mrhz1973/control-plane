# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_WF61_FULLRESPONSE_DATA_UNWRAP_APPLY
result_cursor: PASS_N8N_FULLRESPONSE_DATA_UNWRAP_APPLIED_OFFLINE
reported_via: cursor_direct_persistence
starting_head: ed42a36b9533788f94d64a0eddc6c7e2c930a5c7
final_head: PENDING_COMMIT

apply_phase: PASS
provider_calls: 0
litellm_requests: 0
glm_calls: 0
nodes_changed: [6107]
topology_mutations: 0
live_versionId: e50fe07e-eda0-408f-a717-216852015e0d
template_live_6107_equivalent: true
offline_validation_cases_passed: 7
git_diff_check: PASS

live_resume: NOT_EXECUTED
gate_closed_final: true
WF61_final: inactive
normalizer_mutated: false
raw_model_content_persisted: false
secrets_exposed: false

architecture_report: reports/architecture/d0025_wf61_fullresponse_data_unwrap.md

NEXT: one bounded live resume of D-0025-W-GLM-LIVE-001 using corrected inner-body path
```
