# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_N8N_EXECUTION_ROUTING_BRIDGE_COMMIT_RESUME_ONE_PASS
result_cursor: PASS_BRIDGE_COMMITTED
starting_head: 27a68be499adc58c5c381b13159519164e71dd54
final_head: 4e4035b8d21353285fd5ba6e16a8452898a8c241

restored_stash: v4-n8n-routing-bridge-fixed-preserve
older_backup_stash_not_restored: v4-n8n-routing-bridge-correction-preserve

bridge_contract_path: docs/contracts/n8n-v4-execution-routing-bridge-v1.md
bridge_schema_path: docs/contracts/n8n-v4-execution-routing-bridge-v1.schema.json
bridge_tool_path: tools/n8n-v4-execution-routing-bridge-v1.mjs
bridge_test_path: tests/n8n-v4-execution-routing-bridge/run.mjs

top_level_ok_propagation_fixed: true
unsupported_route_fixture_isolated: true
explicit_route_request_required: true
technical_requirements_synthesized: false
execution_router_reused: true
adapter_registry_reused: true

target_tests: PASS_23_OF_23
regression_tests: PASS
  - v4-execution-adapter-registry: PASS_19_OF_19
  - v4-execution-adapter-router: PASS_15_OF_15
  - execution-router: PASS_12_OF_12
  - litellm-primary-cycle: PASS_18_OF_18

qwen_generation_calls: 0
qwen_session_manager_calls: 0
opencode_execution_count: 0
adapter_run_calls: 0
provider_calls: 0
n8n_execution_calls: 0
workflow_mutations: 0
network_mutations: 0
secret_exposure: false

architecture_report: reports/architecture/v4_n8n_execution_routing_bridge_integration_offline.md
NEXT: V4_WF40_EXECUTION_ROUTING_PATCH_AUTHORING
```
