# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_RESOURCE_STATUS_CONTROL_PLANE_COMPOSER_OFFLINE
result_cursor: PASS_RESOURCE_STATUS_COMPOSER_OFFLINE
starting_head: 57a1aa45afb8558ea6b72a3d0e0a65c3fd1a7508
final_head: c6dfdb467af4aae2efe44f960ef2d1f9721d0705

source_contract: docs/contracts/v4-resource-status-control-plane-source-v1.md
contribution_schema: docs/contracts/v4-resource-status-contribution-v1.schema.json
result_schema: docs/contracts/v4-resource-status-control-plane-source-result-v1.schema.json
composer_tool: tools/compose-v4-resource-status-control-plane-v1.mjs
composer_tests: tests/v4-resource-status-control-plane-source/run.mjs

registry_closure: true
baseline_missing_registry_resource_behavior: synthetic_unavailable_shell
reserve_floor_source: baseline_or_safe_default
status_max_age_seconds: 300
source_precedence: local_probe>provider_api>dashboard_snapshot>internal_ledger>manual
same_rank_conflict_behavior: fail_closed

qwen_ready_idle_required: true
qwen_launch_forbidden: true
qwen_generation_forbidden: true
qwen_collector_invoked: false

target_tests: PASS_34_34
regression_tests: PASS_registry_7_status_6_router_12_sidecar_24_bridge_23

workflow_mutations: 0
provider_calls: 0
dashboard_calls: 0
qwen_generation_calls: 0
qwen_session_manager_calls: 0
qwen_probe_calls: 0
opencode_execution_count: 0
collector_calls: 0
network_calls: 0
secret_exposure: false

architecture_report: reports/architecture/v4_resource_status_control_plane_composer_offline.md
NEXT: V4_RESOURCE_STATUS_LOCAL_RUNTIME_READONLY_CONTRIBUTION_ADAPTER
```
