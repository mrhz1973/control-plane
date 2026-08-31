# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_LOCAL_RUNTIME_READONLY_TEST_PORT_ISOLATION_CORRECTION_ONE_PASS
result_cursor: PASS
starting_remote_head: 79d988af3d495e6e07226346c19d4f1f3f0cb84c
local_preserved_from_head: 043283d4f62f28c833d43c87d86e7f2ec2816e7f
final_head: TO_BE_VERIFIED_AFTER_PUSH
restored_stash: v4-private-endpoint-eaddrinuse-preserve

test_port_fixed_before: 18799
test_port_strategy_after: os_assigned_ephemeral_listen_0
production_port_unchanged: true
response_close_guard_fix_preserved: true
production_tool_modified: false
tests_modified: true

endpoint_tool: tools/serve-v4-local-runtime-readonly-contribution-v1.mjs
endpoint_tests: tests/v4-local-runtime-readonly-private-endpoint/run.mjs
endpoint_contract: docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md
endpoint_url: https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly
loopback_host: 127.0.0.1
loopback_port: 18790

target_tests: PASS_22_OF_22
regression_tests:
  v4-local-runtime-readonly-contribution: PASS_29_OF_29
  v4-resource-status-control-plane-source: PASS_34_OF_34
  resource-status-validator: PASS_6_OF_6

scheduled_task_name: ControlPlane-V4-LocalRuntimeStatus
scheduled_task_created: true
endpoint_listener_ready: true
tailscale_private_path_added: true
openclaw_root_route_preserved: true
public_exposure: false

vps_private_endpoint_proof: PASS
qwen_occupancy_classification: QWEN_OCCUPANCY_UNCERTAIN
qwen_available: false
opencode_static_classification: OPENCODE_STATIC_DISPATCH_READY
opencode_available: true

endpoint_requests: 1
producer_evaluations: 1
diagnostic_powershell_processes: 1
qwen_generation_calls: 0
qwen_http_calls: 0
qwen_launcher_calls: 0
qwen_session_manager_calls: 0
opencode_cli_calls: 0
opencode_execution_count: 0
process_kill_calls: 0
process_stop_calls: 0
process_restart_calls: 0
provider_calls: 0
workflow_execution_calls: 0
workflow_mutations: 0
secret_exposure: false

architecture_report: reports/architecture/v4_local_runtime_readonly_private_endpoint_implementation.md
NEXT: V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_APPLY_OFFLINE
```
