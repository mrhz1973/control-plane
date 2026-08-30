# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_EXECUTION_ADAPTER_V1
result_cursor: PASS_ADAPTER_IMPLEMENTED_TESTS_PASS_BUGBOT_NO_FINDINGS
starting_head: 819b24d559bbd3948a52b7cf4cc35ddd78b2de22
final_head: 4c1517f7dfb64f7d58be71be24be520e178ced68

adapter_contract_path: docs/contracts/opencode-execution-adapter-v1.md
adapter_schema_path: docs/contracts/opencode-execution-adapter-v1.schema.json
adapter_tool_path: tools/opencode-execution-adapter-v1.mjs
adapter_test_path: tests/opencode-execution-adapter/run.mjs

authorization_required: true
default_execution_performed: false
guard_mandatory: true
direct_qwen_endpoint_forbidden: true
occupancy_gate_required: true

dispatch_boundary_modified: false
execution_router_modified: false
guard_tool_modified: false
steps_or_maxsteps_ceiling_used: false

adapter_tests: PASS (23/23)
regression_tests: PASS
  - opencode-single-generation-guard: PASS (16/16)
  - opencode-execution-dispatch: ALL_PASS (13 suites)
  - qwen-local-session-manager: PASS (14/14)
  - qwen-local-resource-status-overlay: PASS (14/14)
bugbot_result: PASS_NO_FINDINGS

qwen_generation_calls: 0
opencode_execution_count: 0
provider_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false

architecture_report: reports/architecture/v4_opencode_execution_adapter_v1.md
NEXT: V4_OPENCODE_CONTROL_PLANE_ROUTING_INTEGRATION_OFFLINE — wire the adapter into V4 control-plane routing WITHOUT live execution
```

## NOTE

- Two prior-pass BugBot findings (runner-throw guard accounting discarded;
  schema_version fail-open) fixed in this pass and covered by new tests
  (23 total). No findings on the second and only review of this pass.
- All execution paths use injected mocks offline; default CLI invocation
  returns AUTHORIZATION_REJECTED with execution_performed=false.
