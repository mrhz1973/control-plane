# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER_IMPLEMENTATION
result_cursor: PASS
starting_head: 9635bf4cea0e4553624ec185fc06676d302365be
final_head: pending_commit

category: SECURITY_RUNTIME_INTEGRATION
runtime_mutations: 2
workflow_mutations: 0
network_mutations: 0
tailscale_mutations: 0
service_mutations: 1
http_execution_endpoint_requests: 0
wf40_executions: 0
wf61_executions: 0
opencode_cli_calls: 0
qwen_generation_calls: 0
provider_calls: 0
authorization_issuance: 0
authorization_spends_production: 0
secret_exposure: false
wf40_node_count_unchanged: 71
wf61_active: false
d0025_gate_closed: true
live_execution: 0
bugbot_invoked: true
bugbot_result: PASS_NO_FINDINGS

target_suites:
  - tests/v4-runtime-authorization-durable-spend-ledger/run.mjs: 13/13 PASS
  - tests/v4-windows-local-execution-endpoint/run.mjs: 61/61 PASS

regressions:
  - opencode-execution-adapter: 23/23 PASS
  - opencode-single-generation-guard: 16/16 PASS
  - v4-local-runtime-readonly-contribution: 29/29 PASS
  - v4-local-runtime-readonly-private-endpoint: 22/22 PASS

implementation:
  tool: tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs
  endpoint_integration: tools/serve-v4-windows-local-execution-endpoint-v1.mjs
  admission_order: replay -> ledger -> registry -> binding -> single-flight -> ledger persist -> registry SPENT -> adapter
  ledger_first_partial_failure: proven
  request_response_schemas_unchanged: true

runtime_apply:
  production_ledger: "%LOCALAPPDATA%\\control-plane\\v4-runtime-authorization-spend-ledger-v1.json"
  production_ledger_spends: 0
  production_registry_entries: 0
  scheduled_task: ControlPlane-V4-LocalExecutionEndpoint
  listener_127_0_0_1_18791: single
  command_line_has_registry_and_ledger: true
  tailscale_routes_preserved: true
  funnel_absent: true

artifacts:
  - reports/architecture/v4_runtime_authorization_durable_spend_ledger_implementation.md
  - tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs
  - tests/v4-runtime-authorization-durable-spend-ledger/run.mjs

architecture_report: reports/architecture/v4_runtime_authorization_durable_spend_ledger_implementation.md
NEXT: V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_DISCOVERY
```
