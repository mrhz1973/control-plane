# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF40_GIS_HANDOFF_NONBLOCKING
result_cursor: PASS_D0025_GIS_HANDOFF_NONBLOCKING_GATE_CLOSED
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_export_post_apply
report_persistence_commit: c3b7797fd69e049977cddedd00af937c694c5aa3
classification: GIS_HANDOFF_EXECUTE_NONBLOCKING_APPLIED

repo_head_observed_at_task: 68a117c156f9d7ed02b93757c623ac4d36d0738c
workspace_at_start: clean
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md
issue_31_state: OPEN
patch_artifact: workflows/patches/d0025-w-wf40-gis-handoff-nonblocking.gpt-web.json

apply_mode: live_mutation_required
already_applied_skip: false

target_node_id: f40c332a-ac76-4f1a-861e-ae5581d327ab
target_node_name: Execute Command - handoff dry-run
continueOnFail_before: false_or_absent
continueOnFail_after: true

WF40_PRE:
  id: 9ZMj2ACTKyDVhCue
  active: true
  versionId: b05501c1-8df7-4853-9674-2e35ca393a07
  node_count: 44

WF40_POST:
  id: 9ZMj2ACTKyDVhCue
  active: true
  versionId: 29184a4e-cea0-4483-8c8e-47688fb6e3d0
  node_count: 44

graph_equivalence_excluding_single_property: PASS
WF60_state: inactive
WF61_state: inactive
WF61_execution_count: 0

runtime_gate: {enabled: false, provider_calls_authorized_per_event: 0}
provider_calls: 0
inference: 0
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false
separate_smoke_validation: NOT_RUN_BY_SCOPE

NEXT_GATE: D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE_RETRY

REPORT: reports/architecture/d0025_wf40_gis_handoff_nonblocking_apply.md
```
