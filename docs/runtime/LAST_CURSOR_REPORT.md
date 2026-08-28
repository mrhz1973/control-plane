# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_REQUEST_SHAPE_RECOVERY
result_cursor: PASS_D0024_REQUEST_SHAPE_RECOVERY_OFFLINE_GLM_TRANSFORM_PASS_CODEX_TRANSFORM_PASS
reported_via: cursor_direct_persistence
independent_verification: cursor_offline_work_pc
report_persistence_commit: PENDING_SELF_REFERENCE
classification: D0024_REQUEST_SHAPE_RECOVERY_OFFLINE_COMPLETE

repo_head_observed_at_task: 2ea22af6d4b82f7219f86b87528e1264ac793571
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN

ROOT_CAUSE:
  root_cause_confirmed: true
  old_input_shape: "body.input = consumer_input object (raw JSON object)"
  new_input_shape: |
    input: [
      {
        role: "user",
        content: [{ type: "input_text", text: JSON.stringify(consumerInput) }]
      }
    ]
  pilot_evidence:
    glm: PROVIDER_BAD_REQUEST_ZAI_MESSAGES_PARAMETER_ILLEGAL
    codex: PROVIDER_BAD_REQUEST_CHATGPT_INPUT_MUST_BE_LIST

LITELLM_SOURCE_INSPECTION:
  litellm_version: "1.98.0"
  venv_path_sanitized: "%LOCALAPPDATA%\\ControlPlane\\litellm-spike\\venv"
  litellm_source_paths_inspected:
    - litellm/responses/litellm_completion_transformation/transformation.py
    - litellm/llms/openai/responses/transformation.py
    - litellm/llms/chatgpt/responses/transformation.py
    - litellm/llms/zai/chat/transformation.py
  finding: |
    LiteLLM transform_responses_api_input_to_messages accepts only str|list input.
    ChatGPT/Codex Responses rejects raw object input ("Input must be a list").
    ZAI routes via chat-completions bridge; list input with input_text content
    produces legal user messages instead of empty/illegal messages from raw object.

ADAPTER_FIX:
  file: tools/build-llm-gateway-request.mjs
  export: buildResponsesInputFromConsumer
  preserved:
    - stream=false
    - canonical instructions
    - emit_execution_packet tool + forced tool_choice
    - model alias binding
    - no provider override
    - no credentials in body
    - consumer_input semantic identity via JSON.parse(input_text)

TRANSFORM_VALIDATION_OFFLINE:
  codex_transform_validation: PASS
  zai_transform_validation: PASS
  method: pure LiteLLM 1.98.0 transformation functions only
  network_guard: socket.connect monkeypatched to forbid network
  oauth_restarted: false
  token_read: false
  get_access_token_called: false

TESTS:
  suite: tests/llm-gateway-request-shape/run.mjs
  result: PASS (4/4)
  cases:
    - glm-input-is-list
    - codex-input-is-list
    - buildResponsesInputFromConsumer-export
    - litellm-transform-offline-python
  portability_suite: tests/llm-gateway-portability/run.mjs
  portability_note: HOST_TOOLING_AJV_UNAVAILABLE — adapter Ajv-dependent cases not runnable on host; template/matrix checks PASS
  host_tooling_ajv: HOST_TOOLING_AJV_UNAVAILABLE

BUDGET:
  glm_provider_attempts_total: 1
  codex_provider_attempts_total: 1
  total_provider_attempts: 2
  new_provider_attempts_this_pass: 0
  new_inference_this_pass: 0
  qwen_inference: 0
  retry: 0
  fallback: 0
  network_access: false
  proxy_called: false
  litellm_restarted: false

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
