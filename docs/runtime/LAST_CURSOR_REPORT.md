# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_GITHUB_CREDENTIAL_REPAIR_AND_N8N_RELOAD
result_cursor: PASS_D0025_GITHUB_CRED_REPAIRED_N8N_RELOADED_WF40_44_LIVE_GATE_CLOSED
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_n8n_sqlite_export_and_standalone_github_rest
report_persistence_commit: 162ca5d94d2b2d4405c9f23422771666b010b09d
classification: GITHUB_CREDENTIAL_REPAIRED_N8N_RELOADED

repo_head_observed_at_task: 1f39d96d7eae79e77ac626776261ed934989d77e
workspace_at_start: clean
operator_gate_ref: github:issue/31#5454744549
issue_31_state: OPEN

credential_metadata:
  id: 7u1QOkEiYcdKncmd
  name: GitHub account
  type: githubApi

pre_repair_wf40_github_401: true
secure_repair_performed: true
secret_source_class: operator_surface_github_cli_keyring
github_auth_test:
  authentication: PASS
  http_status: 200
  endpoint_class: GET /repos/{owner}/{repo}/commits?per_page=1

n8n_reload_performed: true
n8n_reload_action: docker_restart_root-n8n-1

WF40_PUBLISHED:
  id: 9ZMj2ACTKyDVhCue
  active: true
  versionId: 48c30f4a-124c-48a4-b240-c2f6eca4743e
  node_count: 44

WF40_IN_PROCESS_AFTER_RELOAD:
  versionId: 48c30f4a-124c-48a4-b240-c2f6eca4743e
  node_count: 44

WF40_401_AFTER_REPAIR: false
WF40_POST_RELOAD_NOTE: natural_poll_errors_on_inactive_WF60_execute_not_github_401

WF61_executions: 0
provider_calls: 0
inference: 0
runtime_gate_closed: true

LITELLM_PRESERVATION: true
WF60_OPENCLAW_PRESERVATION: true
credential_mutations: 1
network_mutations: 0
teamviewer_mutations: 0
secret_exposure: false

BUDGET:
  glm: 0/10
  codex: 1/10_used

NEXT_GATE: D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE

REPORT: reports/architecture/d0025_github_credential_repair_and_n8n_reload.md
```
