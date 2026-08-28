# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_RUNTIME_REPILOT
result_cursor: PASS_D0024_RUNTIME_REPILOT_COMPLETE_GLM_PASS_STRUCTURAL_CODEX_SSE_HARD_CONSTRAINT_MISMATCH
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_repilot_work_pc
report_persistence_commit: PENDING_SELF_REFERENCE
classification: D0024_RUNTIME_REPILOT_COMPLETE_REQUEST_SHAPE_FIX_VERIFIED

repo_head_observed_at_task: fe2598fb1d4e8dad1f057a964fe678d72e84ac0d
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN

PRECHECK:
  request_shape_regression: PASS (4/4)
  adapter_input_shape: list user item with input_text JSON.stringify(consumerInput)

PROXY_READINESS:
  bind: 127.0.0.1:4000
  tcp_listen: true
  health_http_status: 200
  aliases_present: [planner-glm-pilot, planner-codex-pilot]
  proxy_started_by_cursor: false

BUDGET:
  historical_original_pilot_attempts: 2
  glm_repilot_attempt_count: 1
  codex_repilot_attempt_count: 1
  new_total_provider_attempts: 2
  qwen_attempt_count: 0
  retry: 0
  planner_fallback: 0
  gateway_fallback: 0

GLM:
  gateway_kind: litellm
  litellm_version: "1.98.0"
  alias: planner-glm-pilot
  backend_model: zai/glm-5.3
  endpoint_class: zai_coding_paas_v4
  api_base: https://api.z.ai/api/coding/paas/v4
  http_status: 200
  elapsed_ms: 78278
  response_object_status: completed
  function_call_count: 1
  function_call_name: emit_execution_packet
  response_gate: PASS_STRUCTURAL
  packet_schema: SCHEMA_VALIDATION_HOST_TOOLING_UNAVAILABLE
  policy: GATE
  policy_reason_codes: [PLANNER_RECOMMENDED_GATE]
  policy_note: canonical Ajv tool returned BLOCKED/PACKET_SCHEMA_INVALID due HOST_TOOLING_AJV_UNAVAILABLE; structural policy GATE from packet.gate_recommendation.required
  failure_classification: null
  secret_exposure: false

CODEX:
  gateway_kind: litellm
  litellm_version: "1.98.0"
  alias: planner-codex-pilot
  backend_model: chatgpt/gpt-5.6-sol
  endpoint_class: chatgpt_codex_oauth
  http_status: 200
  elapsed_ms: 34763
  response_object_status: completed
  gateway_body_format: SSE_STREAM_NOT_JSON
  function_call_count: 1
  function_call_name: emit_execution_packet
  response_gate: HARD_CONSTRAINT_MISMATCH
  response_gate_note: planner packet hard_constraints expanded beyond consumer_input exact equality
  packet_schema: SCHEMA_VALIDATION_HOST_TOOLING_UNAVAILABLE
  policy: GATE
  policy_reason_codes: [PLANNER_RECOMMENDED_GATE]
  failure_classification: GATEWAY_SSE_BODY_NOT_AGGREGATED_JSON
  secret_exposure: false

HOST_TOOLING:
  ajv: HOST_TOOLING_AJV_UNAVAILABLE
  note: full schema validator and canonical policy tool blocked on host; structural gate/policy applied

PACKET_EXECUTION_BY_CURSOR: false
oauth_restarted: false
token_read: false
SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
