# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_LITELLM_PROVIDER_CONFIG_WIRING_APPLY
result_cursor: PASS_D0025_LITELLM_PROVIDER_CONFIG_WIRING_LIVE_READY
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_runtime_apply
report_persistence_commit: PENDING_SELF_REFERENCE
classification: LITELLM_PROVIDER_CONFIG_WIRING_LIVE_READY

repo_head_observed_at_task: 3b7220fe0fd2456ad1c21daec3dc58cb440471e3
workspace_at_start: clean
operator_gate_ref: github:issue/31#5453409836
issue_31_state: OPEN

APPLY_RESULT: PASS

LITELLM_PRIMARY:
  container_id: edbb03981626234b1f75bd91dd5cf205fca9922a1cbe1d38a2d07f0b8163f635
  started_at: 2026-08-28T14:01:10.735053817Z
  image_digest: sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4
  network: root_default
  host_ports: 0
  restart: unless-stopped
  cmd: ["--config","/etc/litellm/config.yaml","--port","4000"]
  mounts: 2
  config_mount: /etc/litellm/config.yaml:ro
  auth_mount: /secrets/chatgpt-auth:ro
  env_names: [ZAI_CODING_API_KEY, CHATGPT_TOKEN_DIR, CHATGPT_AUTH_FILE]
  chatgpt_token_dir: /secrets/chatgpt-auth
  chatgpt_auth_file: auth.json
  litellm_master_key: absent
  proxy_credentialless: true
  models_loaded: [planner-glm-pilot, planner-codex-pilot]

READINESS:
  endpoint: /health/readiness
  http_status: 200
  body_status: healthy
  v1_responses_called: false

ROLLBACK:
  intermediate_rollback_performed: true
  reason: first verify readiness before config init complete (~10s)
  final_rollback_required: false

N8N_WF_PRESERVATION:
  n8n_id_unchanged: true
  wf40_ok: true
  wf60_ok: true
  wf61_unimported: true

BUDGET_THIS_PASS:
  runtime_mutations: 1
  provider_calls: 0
  inference: 0
  credential_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false

NEXT_GATE: D-0025-W_WF61_IMPORT_OR_STRUCTURAL_MODELS_VERIFY

REPORT: reports/architecture/d0025_litellm_provider_config_wiring_apply.md
```
