# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_CODEX_COMPAT_OFFLINE_RECOVERY
result_cursor: PASS_D0024_CODEX_OFFLINE_COMPAT_RECOVERY_SSE_NORMALIZATION_PASS_HARD_CONSTRAINT_ENFORCEMENT_PASS
reported_via: cursor_direct_persistence
independent_verification: cursor_offline_work_pc
report_persistence_commit: 4fe8ab51167727b582bbd142793bf08201ae3484
classification: D0024_CODEX_OFFLINE_COMPAT_RECOVERY_COMPLETE

repo_head_observed_at_task: 41275327a61cb8bc5e6bdaa670ec1715434486a9
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN

SSE_ROOT_CAUSE:
  classification: LITELLM_CHATGPT_FORCES_STREAM_TRUE_PROXY_FORWARDS_SSE
  detail: |
    LiteLLM 1.98.0 ChatGPT Responses adapter sets request.stream=true regardless of
    client stream=false (litellm/llms/chatgpt/responses/transformation.py). ChatGPT
    provider returns text/event-stream SSE. LiteLLM has provider-side SSE aggregation
    helpers but the loopback proxy returned raw SSE to the non-streaming client/runner.
  litellm_source_paths:
    - litellm/llms/chatgpt/responses/transformation.py
    - litellm/responses/sse_output_recovery.py
  client_runner_fault: false

CAPTURED_ARTIFACT:
  sse_fixture: tests/llm-gateway-request-shape/fixtures/response-codex-repilot-sse.sse
  packet_fixture: tests/llm-gateway-request-shape/fixtures/packet-codex-repilot-hard-constraint-mismatch.json
  source: D-0024 runtime re-pilot sanitized local artifact (no network recreation)

NORMALIZER:
  path: tools/normalize-litellm-responses-body.mjs
  integration:
    - tools/validate-openclaw-planner-response-gate.mjs
    - tests/llm-gateway-request-shape/runtime-repilot-once.mjs
  behavior: JSON pass-through; SSE parsed by data lines; fail-closed on malformed/duplicate terminal events

HARD_CONSTRAINTS:
  expected_count: 2
  actual_count: 6
  delta_added_non_secret:
    - Operate entirely offline.
    - Do not modify files outside the allowed paths.
    - Do not weaken existing execution-packet or planner-response validation to make fixtures pass.
    - Do not self-authorize runtime execution.
  gate_enforcement: FAIL_CLOSED exact equality preserved via checkHardConstraintsExact
  silent_rewrite: false

STRICT_PLANNER_CONTRACT:
  updated:
    - tools/build-openclaw-responses-request.mjs (PLANNER_INSTRUCTIONS)
    - docs/contracts/openclaw-execution-packet-consumer-v1.md
  rule: hard_constraints MUST equal consumer_input.hard_constraints exactly (length/order/strings)

TESTS:
  suite: tests/llm-gateway-request-shape/codex-compat-run.mjs
  result: PASS (13/13)
  json_normalization: PASS
  captured_sse_normalization: PASS
  malformed_sse_fail_closed: PASS
  duplicate_terminal_fail_closed: PASS
  hard_constraint_regressions: PASS
  shape_regression_suite: PASS (4/4)

BUDGET:
  historical_original_pilot_attempts: 2
  runtime_repilot_attempts: 2
  provider_calls_this_pass: 0
  inference_this_pass: 0
  qwen_inference: 0
  oauth_restarted: false
  token_read: false
  network_access: false

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
