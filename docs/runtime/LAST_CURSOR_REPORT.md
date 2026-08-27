# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_CODEX_AUTH_PATH_RECOVERY
result_cursor: PASS_CODEX_AUTH_STORE_VERIFIED_CHATGPT_GPT56_SOL_BOUND_PROXY_START_READY
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_work_pc
report_persistence_commit: cb406a00dafa880791d5194f754218a2e9c7c11c
classification: D0024_CODEX_MODEL_BOUND_RUNTIME_PROXY_START_READY

repo_head_observed_at_task: 9f81949d871453b9e7110cd9d6edc9ef91e1ea55
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN

CUSTOM_AUTH_STORE:
  path_sanitized: "%LOCALAPPDATA%\\ControlPlane\\litellm-spike\\chatgpt-auth\\auth.json"
  custom_auth_file_exists: true
  byte_size: 3721
  json_valid: true
  auth_keys: ["access_token", "account_id", "expires_at", "id_token", "refresh_token"]
  has_access_token: true
  has_refresh_token: true
  has_account_id: true
  token_value_read: false
  token_value_displayed: false
  token_value_persisted: false

AUTH_BIND:
  CHATGPT_TOKEN_DIR: "%LOCALAPPDATA%\\ControlPlane\\litellm-spike\\chatgpt-auth"
  CHATGPT_AUTH_FILE: auth.json
  authenticator_auth_file_match: true
  oauth_restarted: false

AUTHENTICATED_CATALOG:
  method: GET https://chatgpt.com/backend-api/codex/models?client_version=0.148.0
  authenticated_catalog_http_status: 200
  authenticated_model_ids:
    - codex-auto-review
    - gpt-5.4
    - gpt-5.4-mini
    - gpt-5.5
    - gpt-5.6-luna
    - gpt-5.6-sol
    - gpt-5.6-terra
    - gpt-reserve
  preferred_model_present: true
  preferred_model: gpt-5.6-sol

LITELLM_RESOLUTION:
  input: chatgpt/gpt-5.6-sol
  litellm_provider_resolution:
    model: gpt-5.6-sol
    provider: chatgpt
    api_base: https://chatgpt.com/backend-api/codex
    dynamic_key_set: true
  device_flow_attempted: false
  chatgpt_exact_model: chatgpt/gpt-5.6-sol

CONFIG:
  template: configs/litellm/control-plane-spike.template.yaml
  reconciled: true
  planner-codex-pilot: chatgpt/gpt-5.6-sol
  planner-glm-pilot: zai/glm-5.3
  glm_api_base: https://api.z.ai/api/coding/paas/v4
  yaml_local_validate: PASS
  secrets_in_template: false

PROXY_START:
  executed_by_cursor: false
  operator_proxy_start_command: |
    # Run ONLY in the operator PowerShell session that already has ZAI_CODING_API_KEY set.
    $env:CHATGPT_TOKEN_DIR = "$env:LOCALAPPDATA\ControlPlane\litellm-spike\chatgpt-auth"
    $env:CHATGPT_AUTH_FILE = "auth.json"
    & "$env:LOCALAPPDATA\ControlPlane\litellm-spike\venv\Scripts\litellm.exe" `
      --host 127.0.0.1 `
      --port 4000 `
      --config "C:\Users\mrhz\Documents\AI\GitHub\control-plane\configs\litellm\control-plane-spike.template.yaml"

BUDGET:
  glm_inference: 0/1
  codex_inference: 0/1
  total_inference: 0/2
  retry: 0
  planner_fallback: 0
  gateway_fallback: 0
  qwen_inference: 0
  inference_used: false
  glm_call: false
  codex_call: false
  provider_model_request_count: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
