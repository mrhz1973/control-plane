# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_CODEX_RUNTIME_VERIFY
result_cursor: PASS_D0024_CODEX_RUNTIME_VERIFY_HTTP200_SSE_NORMALIZER_PASS_STRUCTURAL_HARD_CONSTRAINTS_EXACT
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_verify_work_pc
report_persistence_commit: PENDING_SELF_REFERENCE
classification: D0024_CODEX_RUNTIME_VERIFY_SSE_NORMALIZED_HARD_CONSTRAINTS_EXACT

repo_head_observed_at_task: eb6048f0b83b9e72f01f6ecd7953903eb62edf1c
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN

PRECHECK:
  request_shape_regression: PASS (4/4)
  codex_compat_offline: PASS (13/13)
  teamviewer_network_mutations: 0

LITELLM:
  temporary_process_started_by_cursor: true
  temporary_process_pid: 21752
  temporary_process_stopped_by_cursor: true
  bind: 127.0.0.1:4000
  config: "%LOCALAPPDATA%\\Temp\\d0024-codex-verify\\litellm-codex-only.yaml"
  aliases: [planner-codex-pilot]
  litellm_version: "1.98.0"
  CHATGPT_TOKEN_DIR_set: true
  token_read: false

CODEX:
  alias: planner-codex-pilot
  backend_model: chatgpt/gpt-5.6-sol
  endpoint: POST http://127.0.0.1:4000/v1/responses
  stream: false
  codex_attempt_count_this_pass: 1
  glm_attempt_count_this_pass: 0
  qwen_attempt_count_this_pass: 0
  http_status: 200
  elapsed_ms: 38434
  body_source_format: sse
  normalizer_ok: true
  normalizer_classification: PASS
  response_object_status: completed
  function_call_count: 1
  function_call_name: emit_execution_packet
  hard_constraints_expected_count: 2
  hard_constraints_actual_count: 2
  hard_constraints_exact_match: true
  planner_requested: codex
  planner_used: codex
  fallback_used: false
  response_gate: PASS_STRUCTURAL
  response_gate_note: full evaluate returned PACKET_SCHEMA_INVALID due HOST_TOOLING_AJV_UNAVAILABLE; structural invariants and exact hard_constraints PASS
  packet_schema: SCHEMA_VALIDATION_HOST_TOOLING_UNAVAILABLE
  policy: BLOCKED
  policy_note: canonical policy tool blocked on schema engine unavailable; packet gate_recommendation.required=true would classify GATE structurally

BUDGET:
  codex_budget_used: 1
  codex_budget_remaining: 9
  codex_budget_max: 10
  glm_budget_used_this_pass: 0
  qwen_budget_used_this_pass: 0
  retry: 0
  planner_fallback: 0
  gateway_fallback: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
