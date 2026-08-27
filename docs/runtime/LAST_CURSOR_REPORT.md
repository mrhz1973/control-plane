# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_PREFLIGHT_RECOVERY_GLM_CODEX
result_cursor: PASS_D0024_PREFLIGHT_RECOVERY_PASS_AUTH_GATES_READY
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_recovery_work_pc
report_persistence_commit: fe014d5849e1ea3aa2f0517e65a94b4bd3253fb3
classification: D0024_PREFLIGHT_RECOVERY_PASS_AUTH_GATES_READY

repo_head_observed_at_task: 56c611414fa7ea7a76dcf685037717c3eea9a601
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN
recovery_contract: docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md

HOST:
  surface: work_pc_office
  python_exact: "3.13.3"
  litellm_exact: "1.98.0"
  isolated_runtime_path_sanitized: "%LOCALAPPDATA%\\ControlPlane\\litellm-spike\\venv"
  runtime_preserved: true
  global_install: false
  windows_service: false
  scheduled_task: false
  public_bind: false
  proxy_started: false

GLM:
  template_model: zai/glm-5.3
  template_api_base: https://api.z.ai/api/coding/paas/v4
  template_api_key_ref: os.environ/ZAI_CODING_API_KEY
  general_api_used: false
  zai_http_call: false
  credential_access: false
  yaml_local_validate: PASS

CODEX:
  discovery_mode: source_registry_only
  get_llm_provider_chatgpt_called: false
  authenticator_login_called: false
  device_code_started: false
  chatgpt_provider_enum_present: true
  authenticator_py_present: true
  responses_transformation_present: true
  device_oauth_symbols_present: true
  chatgpt_prefix_registry_count: 10
  chatgpt_codex_family_examples:
    - chatgpt/gpt-5.1-codex-max
    - chatgpt/gpt-5.1-codex-mini
    - chatgpt/gpt-5.2-codex
    - chatgpt/gpt-5.3-codex
    - chatgpt/gpt-5.3-codex-spark
  exact_pilot_model: UNRESOLVED_PENDING_OPERATOR_OAUTH
  openai_platform_api_key_fallback: not_used
  template_model_placeholder: chatgpt/<EXACT_CODEX_MODEL_AFTER_OAUTH_DISCOVERY>

CONFIG:
  template: configs/litellm/control-plane-spike.template.yaml
  local_yaml_parse_validate: PASS
  shared_js_tooling_modified: false
  ajv_installed_in_repo: false
  host_tooling_ajv_unavailable: true
  host_tooling_note: previous WORK-PC D-0023 runner failure classified HOST_TOOLING_AJV_UNAVAILABLE; not reinterpreted as functional D-0023 regression

BUDGET:
  glm_inference: 0/1
  codex_inference: 0/1
  total_inference: 0/2
  retry: 0
  planner_fallback: 0
  gateway_fallback: 0
  qwen_inference: 0
  qwen_runtime: false
  provider_model_request_count: 0
  credential_value_read: false
  credential_value_displayed: false
  credential_value_persisted: false

HUMAN_AUTH_GATES_READY:
  glm_gate: LOCAL_ZAI_CODING_CREDENTIAL_ENTRY
  glm_operator_steps_sanitized:
    environment: "%LOCALAPPDATA%\\ControlPlane\\litellm-spike\\venv"
    action: "set process-local env ZAI_CODING_API_KEY to Coding Plan credential; do not paste into chat/GitHub"
    verification_after_auth: "later authorized pilot only; not this recovery"
  codex_gate: CHATGPT_SUBSCRIPTION_OAUTH_DEVICE_FLOW_OPERATOR_PRESENT
  codex_operator_steps_sanitized:
    environment: same isolated LiteLLM venv / local console with operator present
    action: "explicitly start ChatGPT subscription device OAuth only when operator is present; record discovered chatgpt/<model> after success; never commit tokens"
    forbidden_until_gate: "get_llm_provider(chatgpt/...), completion/responses, authenticator login helpers"
  gates_entered_in_this_pass: false

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
