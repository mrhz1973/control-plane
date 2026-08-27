# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_CODEX_EXACT_MODEL_DISCOVERY
result_cursor: STOP_CODEX_EXACT_MODEL_UNRESOLVED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_work_pc
report_persistence_commit: PENDING_SELF_REFERENCE
classification: CODEX_EXACT_MODEL_UNRESOLVED

repo_head_observed_at_task: 3f87ab0a2edb7d71c37cbae703ee2be05b7f25c4
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN

AUTH_STATUS_OBSERVED:
  frontier_claims:
    LOCAL_ZAI_CODING_CREDENTIAL_ENTRY: PASS
    CHATGPT_SUBSCRIPTION_OAUTH_DEVICE_FLOW_OPERATOR_PRESENT: PASS
  cursor_shell_ZAI_CODING_API_KEY: UNSET
  note: GLM credential expected only in operator PowerShell session; not inherited by Cursor shell
  litellm_chatgpt_auth_path_sanitized: "%USERPROFILE%\\.config\\litellm\\chatgpt\\auth.json"
  litellm_chatgpt_auth_bytes: 48
  litellm_chatgpt_auth_keys: ["device_code_requested_at"]
  litellm_chatgpt_has_access_token: false
  litellm_chatgpt_has_refresh_token: false
  litellm_chatgpt_has_account_id: false
  token_read: false
  token_value_displayed: false
  oauth_restarted: false

CODEX_DISCOVERY:
  discovery_method: post_auth_metadata_attempt_blocked_by_missing_litellm_chatgpt_tokens
  methods_used:
    - litellm_chatgpt_auth_metadata_keys_only
    - litellm_model_cost_registry_read_only
    - chatgpt_source_scan_for_list_models_helpers
    - codex_cli_models_cache_id_list_non_secret
  get_llm_provider_chatgpt_called: false
  authenticator_get_access_token_called: false
  completion_called: false
  acompletion_called: false
  responses_called: false
  chat_completion_called: false
  device_flow_started: false
  litellm_chatgpt_list_models_helper_present: false
  registry_chatgpt_models_present: true
  registry_alone_insufficient: true
  chatgpt_exact_model: UNRESOLVED
  stop_reason: >
    LiteLLM ChatGPT auth store has no access_token/refresh_token after claimed OAuth PASS;
    only remnant key device_code_requested_at from earlier aborted preflight.
    Authenticated metadata discovery would require Authenticator.get_access_token(),
    which starts a new device-code flow when tokens are absent — forbidden.
    Codex CLI models_cache lists ids (e.g. gpt-5.6-sol) under a different namespace and
    does not prove a LiteLLM chatgpt/<model> binding usable with LiteLLM's ChatGPT provider.

CODEX_CLI_SIDE_OBSERVATION_NON_BINDING:
  models_cache_ids_sample: ["gpt-5.6-sol","gpt-5.6-terra","gpt-5.6-luna","gpt-reserve","gpt-5.5","gpt-5.4","gpt-5.4-mini","codex-auto-review"]
  config_default_model: gpt-5.6-sol
  mapping_to_chatgpt_prefix: NOT_PROVEN
  used_as_pilot_model: false

GLM:
  glm_call: false
  zai_http_call: false
  credential_value_read: false

BUDGET:
  glm_inference: 0/1
  codex_inference: 0/1
  total_inference: 0/2
  retry: 0
  planner_fallback: 0
  gateway_fallback: 0
  qwen_inference: 0
  inference_used: false
  provider_model_request_count: 0
  codex_call: false

CONFIG:
  template_reconciled: false
  placeholder_retained: chatgpt/<EXACT_CODEX_MODEL_AFTER_OAUTH_DISCOVERY>
  proxy_start_command_prepared: false

NEXT_REAL_GATE: >
  Operator-present completion of LiteLLM ChatGPT subscription OAuth such that
  %USERPROFILE%\.config\litellm\chatgpt\auth.json contains access_token metadata
  (without exposing values), OR an explicit GPT-Web-authorized bridge from an already
  authenticated local store into LiteLLM's ChatGPT auth path. Then retry exact
  chatgpt/<model> discovery without inference.

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
