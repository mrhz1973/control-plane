# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_WF40_EXECUTION_ADAPTER_ROUTER_PATCH_APPLY_OFFLINE
result_cursor: PASS
starting_head: 44a0c6baee4adfa745b4103678db16a95948002d
final_head: ab3e105f4b5da0a757736cc0b8936d45dcf48aaf

wf40_id: 9ZMj2ACTKyDVhCue
wf40_pre_version_id: 1257ed3f-12ad-4fa1-b6ce-ae3e62149b7c
wf40_post_version_id: 60f9b75e-39b8-410a-bcd1-364073992df0
wf40_pre_node_count: 61
wf40_post_node_count: 66

patch_artifact: workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json
patch_blob_sha: 81c704a77c58ea0fbf320a429d734dccc83668c9
patch_applied_verbatim: true

legacy_nodes_preserved: true
new_adapter_router_nodes:
  - v4f40-7401-4001-8401-000000000401
  - v4f40-7402-4002-8402-000000000402
  - v4f40-7403-4003-8403-000000000403
  - v4f40-7404-4004-8404-000000000404
  - v4f40-7405-4005-8405-000000000405

topology_proof: PASS
dispatch_result_synthesized: false
runtime_authorization_synthesized: false
execution_performed: false

wf40_execution_calls: 0
wf61_execution_calls: 0
bridge_execution_calls: 0
provider_calls: 0
qwen_generation_calls: 0
opencode_execution_count: 0
credential_mutations: 0
network_mutations: 0
litellm_mutations: 0
openclaw_mutations: 0
n8n_restart: false
secret_exposure: false

wf61_active_final: false
d0025_gate_closed_final: true
provider_calls_authorized_per_event: 0

architecture_report: reports/architecture/v4_wf40_execution_adapter_router_patch_apply_offline.md
NEXT: SEPARATE_WINDOWS_LOCAL_RUNTIME_RUNNER_OR_OCCUPANCY_TRANSPORT_BLOCK
```
