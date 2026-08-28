# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF40_GIS_READWRITE_NONBLOCKING
result_cursor: PASS_D0025_GIS_READWRITE_NONBLOCKING
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_export_post_apply
report_persistence_commit: 5d1268bca8cf51d01c982e9bd6b1d72eeed8011e
classification: WF40_GIS_READWRITE_NONBLOCKING_APPLIED

repo_head_at_start: 87708a2ad2a70d6dc435096efa599d0b4cb96803
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md
patch_artifact: workflows/patches/d0025-w-wf40-gis-readwrite-nonblocking.gpt-web.json

wf40_id: 9ZMj2ACTKyDVhCue
wf40_version_before: 29184a4e-cea0-4483-8c8e-47688fb6e3d0
wf40_version_after: b198b317-f004-465d-82ed-3fbb3d79f9f6
wf40_node_count: 44
wf40_active: true

target_node_id: d255df3e-0d76-4418-afb3-d5fca11df5ba
target_node_name: Read/Write Files from Disk
target_continueOnFail_before: null
target_continueOnFail_after: true
mutation_already_applied: false

wf60_inactive: true
wf61_inactive: true
wf61_execution_count: 0
runtime_gate_closed: true
provider_calls: 0
inference: 0
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false
litellm_container_unchanged: true

NEXT_GATE: D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001

REPORT: reports/architecture/d0025_wf40_gis_readwrite_nonblocking_apply.md
```
