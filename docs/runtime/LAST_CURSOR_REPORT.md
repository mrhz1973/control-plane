# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001
result_cursor: STOP_D0025_GLM_LIVE_001_WF40_GIS_READWRITE_BLOCKS_BACKLOG_LANE
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_execution_rundata
report_persistence_commit: PENDING_SELF_REFERENCE
classification: GLM_LIVE_CYCLE_NOT_EXECUTED

repo_head_observed_at_start: 4e963619bc0d1fca4d87ef4ff7ef955c380a875d
repo_head_after_trigger_push: 87653627b4aa31e4d5d855812e99d4a9361e9416
operator_gate_ref: github:issue/31#5456859595
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md

backlog_commit_sha: 87653627b4aa31e4d5d855812e99d4a9361e9416
backlog_path: docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md
task_id: D-0025-W-GLM-LIVE-001

adapter_offline: REMOTE_DISPATCH_READY
selected_planner: glm

WF40_execution_id_sample: 284605
WF61_execution_id: null
WF61_execution_count: 0
provider_attempt_count: 0

runtime_gate_before: {enabled: false, provider_calls_authorized_per_event: 0}
runtime_gate_during: {enabled: true, provider_calls_authorized_per_event: 1, allowed_planners: [glm]}
runtime_gate_after: {enabled: false, provider_calls_authorized_per_event: 0}
final_gate_closed: true

WF61_state_before: inactive
WF61_state_during: active_temporarily
WF61_state_after: inactive

blocker: GIS Read/Write Files from Disk hard-fail No file(s) found before plan-watcher/backlog lane
retry: 0
fallback: 0
qwen: 0
codex: 0
cursor_dispatch: 0
credential_mutations: 0
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false
glm_budget: 0/10

adapter_parser_fix_included_in_trigger_commit: true

NEXT_GATE: D-0025-W_WF40_GIS_READWRITE_NONBLOCKING_OR_BACKLOG_LANE_REACHABILITY

REPORT: reports/architecture/d0025_primary_remote_glm_live_001.md
```
