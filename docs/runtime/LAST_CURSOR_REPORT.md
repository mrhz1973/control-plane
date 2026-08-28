# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0024-W_SCHEMA_ENGINE_CLOSURE
result_cursor: PASS_D0024_SCHEMA_ENGINE_CLOSURE_PACKET_SCHEMA_PASS_RESPONSE_GATE_PASS_POLICY_PROCEED
reported_via: cursor_direct_persistence
independent_verification: cursor_offline_schema_engine_closure_work_pc
report_persistence_commit: 5b3f0774c9007c3cd15c944bd8b474effa480f7c
classification: D0024_SCHEMA_ENGINE_CLOSURE_CANONICAL_GATES_PASS

repo_head_observed_at_task: 44c4abd265acc878ab67457185e195d252353d9c
workspace_at_start: clean
operator_gate_ref: github:issue/30
issue_30_state: OPEN

PRECHECK:
  fetch_ff_only: PASS
  core_boot: PASS
  teamviewer_network_mutations: 0

SCHEMA_ENGINE:
  install_class: user_local_isolated
  install_root: "%LOCALAPPDATA%\\ControlPlane\\schema-engine"
  resolver_env: CONTROL_PLANE_AJV_NODE_MODULES
  resolver_hook: tools/validate-execution-packet-v1.mjs resolveAjvModules()
  ajv_version: "8.20.0"
  ajv_formats_version: "3.0.1"
  repo_dependencies_added: false

VALIDATOR_REGRESSION:
  suite: tests/execution-packet-validator/run.mjs
  result: PASS
  passed: 5
  failed: 0
  valid_packet: PASS
  invalid_fixtures: FAIL_CLOSED

CAPTURED_ARTIFACTS:
  packet: tests/llm-gateway-request-shape/artifacts/packet-codex.json
  response_raw: tests/llm-gateway-request-shape/artifacts/response-codex-raw.txt
  consumer: tests/llm-gateway-request-shape/artifacts/consumer-input-codex.json
  source: d0024-codex-verify temp artifacts (sanitized copy)

PACKET_SCHEMA:
  tool: tools/validate-execution-packet-v1.mjs
  classification: PASS
  reason: Packet validates against execution-packet-v1.schema.json

RESPONSE_GATE:
  tool: tools/validate-openclaw-planner-response-gate.mjs
  classification: PASS
  emit_execution_packet_count: 1
  planner_requested: codex
  planner_used: codex
  fallback_used: false
  hard_constraints_exact: true
  execution_packet_schema: PASS

POLICY:
  tool: tools/evaluate-execution-packet-policy.mjs
  decision: PROCEED
  cursor_dispatch_allowed: true
  human_gate_required: false
  reason_codes: []

BUDGET_THIS_PASS:
  provider_calls: 0
  codex_inference: 0
  glm_inference: 0
  qwen_inference: 0
  oauth_restarted: false
  token_read: false
  network_config_mutations: 0
  teamviewer_mutations: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
```
