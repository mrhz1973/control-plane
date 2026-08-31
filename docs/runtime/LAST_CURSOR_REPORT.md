# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_WF40_EXECUTION_TRANSPORT_PATCH_APPLY_OFFLINE
result_cursor: PASS
starting_head: 7e1907fac599f12cabc253381ee74f241f6b0f54
final_head: f42b7406676079516bb4e126461632da0d6e7660

category: DELICATO
runtime_mutations: 0
workflow_mutations: 1
network_mutations: 0
tailscale_mutations: 0
service_mutations: 0
http_execution_endpoint_requests: 0
opencode_cli_calls: 0
qwen_generation_calls: 0
provider_calls: 0
authorization_entries_created: 0
authorization_entries_spent: 0
registry_mutations: 0
secret_exposure: false
wf40_node_count: 71
wf40_executions: 0
wf61_active: false
wf61_executions: 0
d0025_gate_closed: true
live_execution: 0
bugbot_invoked: false

patch:
  artifact: workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json
  blob_sha: 91c1d98dad708b74a9031baa0784a685160820c6
  applied_verbatim: true
  artifact_git_unchanged: true

wf40:
  id: 9ZMj2ACTKyDVhCue
  name: 40 - CP v4 multirepo + classifier bridge - ACTIVE
  active: true
  pre_versionId: 60f9b75e-39b8-410a-bcd1-364073992df0
  post_versionId: e2d600d6-48d9-45fe-9527-3f3e0b47d358
  pre_nodes: 66
  post_nodes: 71
  new_ids:
    - v4f40-7501-4001-8501-000000000501
    - v4f40-7502-4002-8502-000000000502
    - v4f40-7503-4003-8503-000000000503
    - v4f40-7504-4004-8504-000000000504
    - v4f40-7505-4005-8505-000000000505
  topology: parse-adapter-router -> prepare-transport -> IF ready? TRUE=HTTP+parse / FALSE=gate-closed
  adapter_router_false_gate_terminal: true
  http_node_structural_only: true
  ready_gate_fail_closed: true
  production_registry_empty: true

artifacts:
  - reports/architecture/v4_wf40_execution_transport_patch_apply_offline.md

architecture_report: reports/architecture/v4_wf40_execution_transport_patch_apply_offline.md
NEXT: V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER
```
