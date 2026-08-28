# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_VPS_SCHEMA_ENGINE
result_cursor: PASS_D0025_VPS_SCHEMA_ENGINE
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_isolated_ajv_install_ionos_n8n
report_persistence_commit: pending
classification: SCHEMA_ENGINE_LIVE_READY

repo_head_observed_at_task: 86ce74735c68ecfb4c2f01e4889ab96b040627ba
workspace_at_start: clean
operator_gate_ref: github:issue/31#5452941338
issue_31_state: OPEN

SCHEMA_ENGINE:
  install_classification: NEW
  host_path: /root/local-files/handoff-runtime/schema-engine
  container_node_modules: /files/handoff-runtime/schema-engine/node_modules
  npm_version: "11.12.1"
  ajv_version: "8.20.0"
  ajv_formats_version: "3.0.1"
  resolver_env_name: CONTROL_PLANE_AJV_NODE_MODULES
  valid_fixture: PASS
  invalid_fixture: FAIL_CLOSED
  primary_cycle_offline_finalize: PASS

N8N_SAFETY:
  id_before: ef3520640a8e7006a58655109b8da3c69af40a03da6b79de4865723b67077568
  id_after: ef3520640a8e7006a58655109b8da3c69af40a03da6b79de4865723b67077568
  restarted: false
  compose_mutation: 0

LITELLM:
  id_before: e9b3828c59922a00474d88a7f205b2fe35ce4d1dfc4bc65190636c76a8cb922a
  id_after: e9b3828c59922a00474d88a7f205b2fe35ce4d1dfc4bc65190636c76a8cb922a
  mutation: 0

REPO_DEPENDENCY_DELTA: 0

BUDGET_THIS_PASS:
  provider_calls: 0
  inference: 0
  credential_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false

REPORT: reports/architecture/d0025_vps_schema_engine.md
```
