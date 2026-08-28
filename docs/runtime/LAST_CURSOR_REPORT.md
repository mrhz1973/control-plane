# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_CONTROL_PLANE_MOUNT_APPLY
result_cursor: PASS_D0025_CONTROL_PLANE_MOUNT_APPLY
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_compose_mount_apply_ionos_n8n
report_persistence_commit: 7a8395cdd9242aa67c79ad50c207512f5f26fd73
classification: CONTROL_PLANE_MOUNT_RO_LIVE

repo_head_observed_at_task: c717c6a031662942cd51e3e864711e7d5f4dc868
workspace_at_start: clean
operator_gate_ref: github:issue/31#5452861879
issue_31_state: OPEN

COMPOSE:
  file: /root/docker-compose.yaml
  sha_before: 17cf022863e1c2d01d37f46956db5288b4e13eec2325968bf74e2b86df046950
  sha_after: 377af79372f7520c68d81864714d6e4864d5d0866e86a330c2394f9c9adf491c
  mount_added: /root/local-files/handoff-runtime/control-plane:/files/handoff-runtime/control-plane:ro
  mount_count: 1
  validation: PASS
  dry_run: n8n_only_recreate

RUNNING_EXECUTIONS: UNKNOWN_OPERATOR_ACCEPTED

N8N:
  id_before: 56e639b521e753b5ca097ad251c58c2d8382920aa0fc9014ebb25467422bdbc2
  id_after: ef3520640a8e7006a58655109b8da3c69af40a03da6b79de4865723b67077568
  image_id_before: sha256:b1b0c592735e24acd3cc64db83f94ef4efd8e331e47c6883249cc51cc1bea16b
  image_id_after: sha256:b1b0c592735e24acd3cc64db83f94ef4efd8e331e47c6883249cc51cc1bea16b
  version: "2.19.5"
  health: PASS
  ports: 127.0.0.1:5678->5678/tcp

MOUNT:
  source: /root/local-files/handoff-runtime/control-plane
  destination: /files/handoff-runtime/control-plane
  rw: false
  tools_live: all_six_present_readable_syntax_ok

PERSISTENCE:
  root_default_id: preserved
  root_n8n_data_created_at: preserved
  litellm_primary: unchanged

WF40: active preserved
WF60: inactive preserved
WF61: absent
rollback_used: false

BUDGET_THIS_PASS:
  provider_calls: 0
  inference: 0
  package_install: 0
  credential_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false

REPORT: reports/architecture/d0025_control_plane_mount_apply.md
```
