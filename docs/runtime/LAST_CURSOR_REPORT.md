# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_EXECUTION_ROUTE_SIDECAR_SOURCE_ADAPTER_OFFLINE
result_cursor: PASS_SIDECAR_SOURCE_ADAPTER_OFFLINE
starting_head: b296547f56cbc3afcd35fc56eef0325142b1d1ee
final_head: PENDING_COMMIT

source_contract: docs/contracts/v4-execution-route-sidecar-source-v1.md
source_schema: docs/contracts/v4-execution-route-sidecar-source-v1.schema.json
bundle_schema: docs/contracts/v4-execution-routing-sidecar-bundle-v1.schema.json
adapter_tool: tools/build-v4-execution-routing-sidecars-v1.mjs
adapter_tests: tests/v4-execution-route-sidecar-source/run.mjs

same_commit_required: true
task_binding_required: true
backlog_path_binding_required: true
risk_binding_required: true
technical_requirements_synthesized: false

status_max_age_seconds: 300
status_explicit_fresh_supported: true
status_fail_closed_fallback: true
status_collector_invoked: false

target_tests: PASS_24_24
regression_tests: PASS_resource_status_6_execution_router_12_n8n_bridge_23

workflow_mutations: 0
workflow_execution_calls: 0
provider_calls: 0
qwen_generation_calls: 0
qwen_session_manager_calls: 0
opencode_execution_count: 0
adapter_run_calls: 0
network_calls: 0
network_mutations: 0
secret_exposure: false

architecture_report: reports/architecture/v4_execution_route_sidecar_source_adapter_offline.md
NEXT: V4_WF40_SIDECAR_SOURCE_PATCH_AUTHORING
```
