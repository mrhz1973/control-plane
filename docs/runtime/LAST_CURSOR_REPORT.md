# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_HTTP200_BODY_SHAPE_INSPECT_AND_OFFLINE_REMEDIATE
result_cursor: STOP
reported_via: cursor_direct_persistence
starting_head: 5c3065bfb38f1d638656a966232a39a617632385
final_head: 3246f0b15464c6fd6af91ce82f2c1af8ae92420b
case: B
case_label: EXISTING_ATTEMPT11_BODY_UNAVAILABLE
attempt11_wf40: 285414
attempt11_wf61: 285415
wf61_execution_present: true
wf61_runData_empty: true
response_b64_available: false
raw_http_body_available: false
parent_sse_census_only: true
normalizer_mutated: false
provider_calls: 0
litellm_requests: 0
glm_calls: 0
codex_calls: 0
qwen_calls: 0
workflow_mutations: 0
remote_runtime_gate: CLOSED
raw_body_persisted: false
model_content_persisted: false
secrets_exposed: false

architecture_report: reports/architecture/d0025_http200_body_shape_offline_remediation.md

NEXT: capture body framing+key shapes (no model text) before next live resume; no invented CASE A
```
