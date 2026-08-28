# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001_RETRY
result_cursor: STOP_D0025_GLM_LIVE_001_RETRY_WF40_GIS_TELEGRAM_FILE_NODE_BLOCKS_BACKLOG_LANE
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_execution_rundata
report_persistence_commit: 7f2006b2fb2e54e8d8a47ec7e6b1163a80236e57
classification: GLM_LIVE_CYCLE_NOT_EXECUTED

repo_head_at_start: 4461ff358b3729c326ae5e93a9209484def39ae8
retry_trigger_commit: 5ccb8c9db67ec303d11551216f849c829e7d951e
release_ref: github:issue/31#5457265822
standing_auth_ref: docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md

backlog_path: docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_LIVE_001.md
task_id: D-0025-W-GLM-LIVE-001
yaml_unchanged: true

adapter_offline: REMOTE_DISPATCH_READY
selected_planner: glm

WF40_execution_ids_sample: [284659, 284677, 284679]
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

blocker: Telegram - Send handoff file node 18078c6b-1181-42da-9f05-32138f45f0ab hard-fail (binary data missing after non-blocking Read/Write passthrough) before plan-watcher/backlog lane
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

NEXT_GATE: D-0025-W_WF40_GIS_TAIL_NONBLOCKING_TO_END

REPORT: reports/architecture/d0025_primary_remote_glm_live_001.md
```
