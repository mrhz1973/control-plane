# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_PREFLIGHT_GLM_CODEX
result_cursor: STOP_OAUTH_STARTED_INVOLUNTARILY
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_preflight_work_pc
report_persistence_commit: PENDING_SELF_REFERENCE
classification: STOP
stop_finding: get_llm_provider('chatgpt/…') triggered ChatGPT device-code OAuth without operator gate; process killed; device code must be ignored / not completed

repo_head_observed_at_task: 3ad4334031cd2e3d41dc63a2c0742e7a880699b7
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN

HOST:
  surface: work_pc_office
  python_exact: "3.13.3"
  python_launcher: py -3.13
  litellm_exact: "1.98.0"
  isolated_runtime_path_sanitized: "%LOCALAPPDATA%\\ControlPlane\\litellm-spike\\venv"
  global_install: false
  windows_service: false
  scheduled_task: false
  public_bind: false

INSTALL:
  package: litellm[proxy]==1.98.0
  import_litellm: true
  cli_litellm: true
  cli_litellm_proxy: true

GLM_PROVIDER_DISCOVERY:
  preferred_route_checked: zai/glm-5.3
  get_llm_provider_result: RESOLVES
  resolved_provider: zai
  resolved_model: glm-5.3
  package_default_api_base: https://api.z.ai/api/paas/v4
  required_coding_endpoint: https://api.z.ai/api/coding/paas/v4
  coding_endpoint_is_package_default: false
  note: Coding Plan endpoint must be forced via litellm_params.api_base; native ZAI default is General API /api/paas/v4
  model_cost_has_zai_glm_5_3: false
  model_cost_nearest_zai: ["zai/glm-5", "zai/glm-5.1", "zai/glm-5-code"]
  template_current_route: openai/glm-5.3
  template_reconciliation: NOT_APPLIED_DUE_TO_STOP
  zai_http_call: false
  glm_inference: 0

CODEX_PROVIDER_DISCOVERY:
  chatgpt_provider_enum: LlmProviders.CHATGPT
  source_modules_present:
    - litellm/llms/chatgpt/authenticator.py
    - litellm/llms/chatgpt/responses/transformation.py
    - litellm/llms/chatgpt/chat/transformation.py
  device_oauth_symbols_present: true
  responses_api_support_in_source: true
  model_cost_chatgpt_prefix_examples:
    - chatgpt/gpt-5.3-codex
    - chatgpt/gpt-5.2-codex
    - chatgpt/gpt-5.1-codex-mini
  exact_codex_model_for_pilot: UNRESOLVED_PENDING_OPERATOR_OAUTH
  openai_platform_api_key_fallback: not_used
  involuntary_oauth_trigger: true
  trigger_context: "local get_llm_provider resolution of chatgpt/<model> started device-code flow"
  oauth_process_killed: true
  oauth_completed: false
  operator_must_ignore_any_device_code_from_this_pass: true
  litellm_chatgpt_auth_artifact_present: true
  litellm_chatgpt_auth_path_sanitized: "%USERPROFILE%\\.config\\litellm\\chatgpt\\auth.json"
  auth_artifact_bytes: 48
  auth_artifact_contents_read: false
  auth_secret_persisted_to_git: false

PROXY:
  started: false
  reason: skipped after involuntary OAuth STOP

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

REGRESSION:
  tests_llm_gateway_portability: FAIL
  passed: 3
  failed: 15
  total: 18
  failure_class: BUILD_FAILED
  failure_reason: ajv draft-2020-12 JSON Schema engine not resolvable on this WORK PC (no package.json/node_modules in repo)
  network_access_by_tests: false
  note: D-0023 offline PASS remains historically recorded elsewhere; this host lacks local ajv resolution path

NEXT_REAL_GATES_NOT_ENTERED:
  - LOCAL_ZAI_CODING_CREDENTIAL_ENTRY
  - CHATGPT_SUBSCRIPTION_OAUTH_DEVICE_FLOW_OPERATOR_PRESENT

HUMAN_NOTE: Do not complete any ChatGPT device code printed during this preflight introspection. Treat it as aborted/phishing-risk noise. Future Codex discovery must use source/registry inspection only, never get_llm_provider/chat completion paths that auto-start OAuth.
```
