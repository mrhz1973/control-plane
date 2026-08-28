# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_LITELLM_PRIVATE_CONTAINER_DEPLOY
result_cursor: PASS_D0025_LITELLM_PRIVATE_CONTAINER_DEPLOY
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_runtime_deploy_ionos_n8n
report_persistence_commit: pending
classification: PRIVATE_PROXY_READY_CREDENTIALLESS

repo_head_observed_at_task: d3943e8bf30367c281def0aa6e78fbc3a8d18f3c
workspace_at_start: clean
operator_gate_ref: github:issue/31#5451709148
issue_31_state: OPEN

LITELLM_CONTAINER:
  name: litellm-primary
  container_id: e9b3828c5992
  state: running
  image: ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4
  repo_digest: ghcr.io/berriai/litellm@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4
  architecture: amd64
  litellm_package_version: "1.98.0"
  network: root_default
  host_published_ports: 0
  network_host_mode: false
  private_dns_from_root_n8n_1: 172.18.0.3
  uvicorn_internal: "0.0.0.0:4000"
  credential_config_mount: none
  provider_calls: 0

N8N_SAFETY:
  root_n8n_1_before: running
  root_n8n_1_after: running
  started_at_unchanged: 2026-08-21T21:38:26.189399585Z
  restart_count_unchanged: 0
  wf40_wf60_mutations: 0
  n8n_workflow_mutations: 0

BUDGET_THIS_PASS:
  provider_calls: 0
  inference: 0
  network_mutations_work_pc: 0
  teamviewer_mutations: 0
  credential_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false

REPORT: reports/architecture/d0025_litellm_private_container_deploy.md
```
