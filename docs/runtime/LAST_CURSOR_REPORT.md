# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_APPLY_OFFLINE
result_cursor: PASS
starting_head: 7f2f13a1cba9627f38c85aa0924cce89d1cea3a5
final_head: 0289cede5c523d68fa519605380c5b05f46b4c85

wf40_id: 9ZMj2ACTKyDVhCue
wf40_pre_version_id: ef80943e-535d-430f-958f-56c03baa1c62
wf40_post_version_id: 1257ed3f-12ad-4fa1-b6ce-ae3e62149b7c
wf40_pre_node_count: 56
wf40_post_node_count: 61

patch_artifact: workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json
patch_blob_sha: 7f7aefaa0df6afa4e9a74f55a27d70b9a2436849
patch_applied_verbatim: true

legacy_nodes_preserved: true
new_local_status_nodes:
  - v4f40-7301-4001-8301-000000000301
  - v4f40-7302-4002-8302-000000000302
  - v4f40-7303-4003-8303-000000000303
  - v4f40-7304-4004-8304-000000000304
  - v4f40-7305-4005-8305-000000000305
sidecar_encode_parameter_update_exact: true

private_endpoint_url: https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly
endpoint_reprobed: false

fail_closed_empty_contributions_preserved: true
technical_requirements_synthesized: false
route_source_same_commit_preserved: true

wf61_active_final: false
d0025_gate_closed_final: true
executor_dispatch_added: false

workflow_execution_calls: 0
wf40_execution_calls: 0
wf61_execution_calls: 0
endpoint_http_calls: 0
composer_runtime_calls: 0
sidecar_adapter_execution_calls: 0
bridge_execution_calls: 0
provider_calls: 0
qwen_generation_calls: 0
qwen_http_calls: 0
qwen_session_manager_calls: 0
qwen_launcher_calls: 0
opencode_cli_calls: 0
opencode_execution_count: 0
credential_mutations: 0
network_mutations: 0
litellm_mutations: 0
openclaw_mutations: 0
secret_exposure: false

architecture_report: reports/architecture/v4_resource_status_wf40_local_contribution_patch_apply_offline.md
NEXT: V4_WF40_EXECUTION_ADAPTER_ROUTER_PATCH_AUTHORING
```
