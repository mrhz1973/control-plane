# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_LOCAL_RUNTIME_READONLY_SINGLE_DIAGNOSTIC_BIND_CORRECTION_ONE_PASS
result_cursor: PASS_LOCAL_READONLY_SINGLE_DIAGNOSTIC_BIND
starting_remote_head: e0cedc4730792fa11da4dbe31a6be78d7b0c6d92
local_preserved_from_head: 1da67135a9bc72794e7c1d3383202996ab7ff581
final_head: 3ccbb2d53bd87e6b4cb5b0f3109d6caeea20be98

restored_stash: v4-local-readonly-adapter-double-diagnostic-preserve
older_backup_stash_not_restored: v4-local-readonly-adapter-28of29-preserve

single_diagnostic_bind_fix: true
gather_qwen_diagnostics_calls_per_cli_run: 1

adapter_contract: docs/contracts/v4-local-runtime-readonly-contribution-adapter-v1.md
adapter_tool: tools/produce-v4-local-runtime-readonly-contribution-v1.mjs
adapter_tests: tests/v4-local-runtime-readonly-contribution/run.mjs

target_tests: PASS_29_29
regression_tests: PASS_composer_34_registry_7_status_6_router_12
live_readonly_proof: PASS

qwen_occupancy_classification: QWEN_OCCUPANCY_UNCERTAIN
qwen_available: false
opencode_static_classification: OPENCODE_STATIC_DISPATCH_READY
opencode_available: true

live_producer_runs: 1
diagnostic_powershell_processes: 1

qwen_generation_calls: 0
qwen_http_calls: 0
qwen_session_manager_calls: 0
qwen_launcher_calls: 0
opencode_cli_calls: 0
opencode_execution_count: 0
process_kill_calls: 0
process_stop_calls: 0
process_restart_calls: 0
provider_calls: 0
workflow_mutations: 0
secret_exposure: false

architecture_report: reports/architecture/v4_resource_status_local_runtime_readonly_contribution_adapter.md
NEXT: V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_AUTHORING
```
