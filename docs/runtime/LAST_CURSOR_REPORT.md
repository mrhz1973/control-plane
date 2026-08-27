# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_RUNTIME_PILOT
result_cursor: PASS_D0024_RUNTIME_PILOT_COMPLETE_GLM_PROVIDER_BAD_REQUEST_CODEX_PROVIDER_BAD_REQUEST
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_pilot_work_pc
report_persistence_commit: PENDING_SELF_REFERENCE
classification: D0024_RUNTIME_PILOT_COMPLETE_BOTH_BACKENDS_PROVIDER_400_NO_PACKET

repo_head_observed_at_task: a8cf1c5fddce0523edcfb908ed5d60394503a947
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN

PROXY_READINESS:
  bind: 127.0.0.1:4000
  tcp_listen: true
  health_http_status: 200
  models_http_status: 200
  aliases_present: [planner-qwen-pilot, planner-glm-pilot, planner-codex-pilot]
  proxy_started_by_cursor: false
  shared_runtime_alive_after_glm: true

HOST_TOOLING:
  ajv: HOST_TOOLING_AJV_UNAVAILABLE
  envelope_build: canonical_equivalent_without_ajv
  note: Node Ajv schema validators not run; structural response-gate/policy N/A because provider returned errors before function_call

CONSUMER_TASK:
  fixture_base: tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json
  mutation: planner_requested only
  glm_planner_requested: glm
  codex_planner_requested: codex
  endpoint: POST /v1/responses
  stream: false
  tool: emit_execution_packet
  tool_choice: emit_execution_packet
  provider_override: false
  credentials_in_body: false

COUNTERS:
  glm_attempt_count: 1
  codex_attempt_count: 1
  total_provider_attempts: 2
  qwen_attempt_count: 0
  retry: 0
  planner_fallback: 0
  gateway_fallback: 0
  litellm_available_model_group_fallbacks: None

GLM:
  gateway_kind: litellm
  litellm_version: "1.98.0"
  alias: planner-glm-pilot
  backend_model: zai/glm-5.3
  endpoint_class: zai_coding_paas_v4
  api_base: https://api.z.ai/api/coding/paas/v4
  http_status: 400
  provider_attempt_count: 1
  elapsed_ms: 382
  response_object_status: null
  function_call_count: null
  function_call_name: null
  response_gate: API_ERROR_NO_FUNCTION_CALL
  packet_schema: NOT_APPLICABLE_PROVIDER_ERROR
  packet_schema_note: SCHEMA_VALIDATION_HOST_TOOLING_UNAVAILABLE
  policy: NOT_APPLICABLE_NO_PACKET
  failure_classification: PROVIDER_BAD_REQUEST_ZAI_MESSAGES_PARAMETER_ILLEGAL
  failure_message_sanitized: "ZaiException - The messages parameter is illegal. Please check the documentation. Available Model Group Fallbacks=None"
  secret_exposure: false

CODEX:
  gateway_kind: litellm
  litellm_version: "1.98.0"
  alias: planner-codex-pilot
  backend_model: chatgpt/gpt-5.6-sol
  endpoint_class: chatgpt_codex_oauth
  http_status: 400
  provider_attempt_count: 1
  elapsed_ms: 635
  response_object_status: null
  function_call_count: null
  function_call_name: null
  response_gate: API_ERROR_NO_FUNCTION_CALL
  packet_schema: NOT_APPLICABLE_PROVIDER_ERROR
  packet_schema_note: SCHEMA_VALIDATION_HOST_TOOLING_UNAVAILABLE
  policy: NOT_APPLICABLE_NO_PACKET
  failure_classification: PROVIDER_BAD_REQUEST_CHATGPT_INPUT_MUST_BE_LIST
  failure_message_sanitized: "ChatgptException - {\"detail\":\"Input must be a list\"}. Available Model Group Fallbacks=None"
  secret_exposure: false

BUDGET:
  glm_inference: 1/1
  codex_inference: 1/1
  total_inference: 2/2
  qwen_inference: 0
  retry: 0
  fallback: 0

PACKET_EXECUTION_BY_CURSOR: false
oauth_restarted: false
token_value_read: false
token_value_displayed: false
SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
