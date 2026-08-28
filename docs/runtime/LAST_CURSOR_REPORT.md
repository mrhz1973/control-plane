# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_CONTROL_PLANE_MOUNT_READONLY_PREFLIGHT
result_cursor: STOP_CONTROL_PLANE_HOST_PATH_ABSENT
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_readonly_inspect_ionos_n8n
report_persistence_commit: pending
classification: MOUNT_PREFLIGHT_STOP_HOST_PATH_ABSENT

repo_head_observed_at_task: 8284e34b93fda2b8c14b61579aed715205312a35
workspace_at_start: clean
operator_gate_ref: github:issue/31
issue_31_state: OPEN

COMPOSE:
  managed: true
  project: root
  config_file: /root/docker-compose.yaml
  working_dir: /root
  service: n8n
  services_count: 1

N8N_CONTAINER:
  name: root-n8n-1
  id: 56e639b521e753b5ca097ad251c58c2d8382920aa0fc9014ebb25467422bdbc2
  image: docker.n8n.io/n8nio/n8n
  n8n_version: "2.19.5"
  started_at: 2026-08-21T21:38:26.189399585Z
  restart_count: 0
  network: root_default
  mounts:
    - /root/local-files:/files:rw
    - /srv/cp-verifier-inbox:/files/control-plane-verifier-inbox:rw
    - root_n8n_data:/home/node/.n8n:rw

CONTROL_PLANE_HOST_PATH: ABSENT
candidate_host_path: /root/local-files/handoff-runtime/control-plane
candidate_container_path: /files/handoff-runtime/control-plane
candidate_mode: ro
mount_collision: absent

RECREATE:
  can_add_bind_mount_without_recreate: false
  recreate_required: true
  affected_service: n8n only
  litellm_primary_impact: none

ROLLBACK: PROVEN

ACTIVE_EXECUTION_RISK:
  wf40_active: true
  running_execution_count: unknown
  sqlite3_available: false

BUDGET_THIS_PASS:
  runtime_mutations: 0
  provider_calls: 0
  inference: 0
  teamviewer_mutations: 0
  credential_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false

REPORT: reports/architecture/d0025_control_plane_mount_readonly_preflight.md
```
