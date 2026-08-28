# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_PROVIDER_WIRING_EXACT_READONLY_PREFLIGHT
result_cursor: PASS_D0025_PROVIDER_WIRING_CANDIDATE_READY
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_readonly_provider_wiring_inspect
report_persistence_commit: f4a630b9225d68d864219e76807cc88d7639a896
classification: PROVIDER_WIRING_CANDIDATE_READY

repo_head_observed_at_task: 993be4e410a3fae3247056ac700928718396c58d
workspace_at_start: clean
operator_gate_ref: operator_relay_staged_provider_material
issue_31_state: OPEN

PROVIDER_MATERIAL_STAGED: true
WIRING_CANDIDATE_READY: true

STAGED_MATERIAL:
  zai_env_file: /root/local-files/handoff-runtime/secrets/litellm-primary.env
  zai_env_key_names: [ZAI_CODING_API_KEY]
  zai_env_size_bytes: 69
  zai_env_mode: "600"
  chatgpt_auth_json: /root/local-files/handoff-runtime/secrets/chatgpt-auth/auth.json
  chatgpt_auth_size_bytes: 3721
  chatgpt_auth_mode: "600"
  secret_values_read: false

LITELLM_BASELINE:
  container_id: e9b3828c59922a00474d88a7f205b2fe35ce4d1dfc4bc65190636c76a8cb922a
  image_digest: sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4
  network: root_default
  host_ports: 0
  mounts: 0
  cmd: ["--port","4000"]
  proxy_credentialless: true
  baseline_reconstructible: true

WIRING_PLAN:
  zai: --env-file /root/local-files/handoff-runtime/secrets/litellm-primary.env
  chatgpt_token_dir: /secrets/chatgpt-auth
  chatgpt_auth_file: auth.json
  chatgpt_internal_path: /secrets/chatgpt-auth/auth.json
  chatgpt_mount: /root/local-files/handoff-runtime/secrets/chatgpt-auth:/secrets/chatgpt-auth:ro
  config_host: /root/local-files/handoff-runtime/control-plane/configs/litellm/control-plane-primary-remote.template.yaml
  config_internal: /etc/litellm/config.yaml:ro
  config_arg: --config /etc/litellm/config.yaml
  litellm_master_key: absent

NEXT_RUNTIME_GATE: D-0025-W_LITELLM_PROVIDER_CONFIG_WIRING_APPLY

N8N_LITELLM_SAFETY:
  n8n_id_unchanged: true
  litellm_id_unchanged: true
  wf40_wf60_unchanged: true
  wf61_unimported: true

BUDGET_THIS_PASS:
  runtime_mutations: 0
  provider_calls: 0
  inference: 0
  credential_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false

REPORT: reports/architecture/d0025_provider_wiring_exact_readonly_preflight.md
```
