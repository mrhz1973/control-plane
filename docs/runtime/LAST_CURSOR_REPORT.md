# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_PRIVATE_SERVICE_PERSISTENCE
result_cursor: PASS
starting_head: ca1be3089ada70e47a84d1273109e468ea59a6f2
final_head: PENDING_COMMIT

category: RUNTIME_INTEGRATION
runtime_mutations:
  - new scheduled task ControlPlane-V4-LocalExecutionEndpoint (loopback 127.0.0.1:18791, AtLogOn, InteractiveToken)
  - user env CONTROL_PLANE_AJV_NODE_MODULES -> stable schema engine path (user-local, no repo secrets)
  - tailscale serve additive private route /v4/execution/opencode-local -> 127.0.0.1:18791
workflow_mutations: 0
funnel_public_exposure: false
opencode_cli_calls: 0
qwen_generation_calls: 0
provider_calls: 0
http_execution_endpoint_requests: 0
process_kills: 0
secret_exposure: false
wf40_node_count_unchanged: 66
wf61_active: false
d0025_gate_closed: true
live_execution: 0
production_code_changes: 0
bugbot_invoked: false

key_evidence:
  listener_count_18791: 1
  listener_process: node.exe (tool+host+port+workspace verified in cmdline)
  tailscale_paths:
    - "/" -> http://127.0.0.1:18789 (OpenClaw preserved)
    - "/v4/resource-status/local-readonly" -> http://127.0.0.1:18790 (preserved)
    - "/v4/execution/opencode-local" -> http://127.0.0.1:18791 (new, private)
  funnel: absent (tailnet only)
  readonly_scheduled_task_untouched: ControlPlane-V4-LocalRuntimeStatus
  wf40_versionId: 60f9b75e-39b8-410a-bcd1-364073992df0

artifacts:
  - reports/architecture/v4_windows_local_execution_endpoint_private_service_persistence.md

architecture_report: reports/architecture/v4_windows_local_execution_endpoint_private_service_persistence.md
NEXT: V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF
```
