# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE
result_cursor: STOP_D0025_GLM_SMOKE_BLOCKED_WF40_GITHUB_401
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_sqlite_and_export
report_persistence_commit: PENDING_SELF_REFERENCE
classification: SMOKE_NOT_EXECUTED_GATE_REMAINS_CLOSED

repo_head_observed_at_task: 39fffdebeffd872b1015c5ed76f1c8acec3e7103
workspace_at_start: clean
operator_gate_ref: github:issue/31#5454611166
issue_31_state: OPEN
selected_planner: glm

GATE:
  enabled: false
  provider_calls_authorized_per_event: 0
  enabled_on_vps: false
  enabled_pushed: false

WF40:
  id: 9ZMj2ACTKyDVhCue
  active: true
  db_versionId: 48c30f4a-124c-48a4-b240-c2f6eca4743e
  db_node_count: 44
  in_process_execution_versionId: 86ed5569-ce2b-49bb-9f3b-30f4e7fa918b
  in_process_node_count: 35
  poll_error: HTTP_401_Bad_credentials
  failing_node: GitHub - Fetch latest commit (per repo)
  github_cred_metadata: {id: 7u1QOkEiYcdKncmd, name: GitHub account}

WF61:
  id: d0025-6100-4001-8001-000000000061
  active: false
  executions: 0

LITELLM:
  container: litellm-primary
  models_endpoint: ok
  inference_this_pass: 0

HELPER_TESTS: 18/18 PASS

BUDGET_THIS_PASS:
  wf61_executions: 0
  provider_calls: 0
  inference: 0
  retry: 0
  fallback: 0
  qwen: 0
  cursor_dispatch: 0
  credential_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false

BACKLOG_ARTIFACT_PERSISTED: docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_SMOKE_001.md

NEXT_GATE: D-0025-W_GITHUB_CREDENTIAL_REPAIR_THEN_N8N_RELOAD_THEN_REAUTH_GLM_SMOKE

REPORT: reports/architecture/d0025_remote_runtime_gate_enable_and_single_glm_smoke.md
```
