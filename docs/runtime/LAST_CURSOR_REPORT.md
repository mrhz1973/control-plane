# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_N8N_EXECUTION_ADAPTER_ROUTER_BRIDGE_OFFLINE
result_cursor: PASS
starting_head: 8555ecf297de74281267df33afe4e35a30d2fff9
final_head: TO_BE_VERIFIED_AFTER_PUSH

bridge_tool: tools/n8n-v4-execution-adapter-router-bridge-v1.mjs
bridge_schema: docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.schema.json
bridge_contract: docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.md
bridge_tests: tests/n8n-v4-execution-adapter-router-bridge/run.mjs

target_tests: PASS_17_OF_17
regression_tests:
  v4-execution-adapter-router: PASS_15_OF_15
  v4-execution-adapter-registry: PASS_19_OF_19
  opencode-execution-adapter: PASS_23_OF_23

delegates_to_routeToExecutionAdapter: true
uses_canonical_registry: true
dispatch_synthesized: false
runtime_authorization_synthesized: false
getOccupancy_injected: false
guardStart_injected: false
runOpenCode_injected: false
live_runner_present: false

execution_performed: false
qwen_generation_calls: 0
opencode_cli_calls: 0
provider_calls: 0
network_calls: 0
workflow_mutations: 0
wf40_node_count_unchanged: 61
wf40_adapter_router_patch_applied: false
wf61_active: false
d0025_gate_closed: true
secret_exposure: false

architecture_report: reports/architecture/v4_n8n_execution_adapter_router_bridge_offline.md
NEXT: V4_WF40_EXECUTION_ADAPTER_ROUTER_PATCH_APPLY_OFFLINE
```
