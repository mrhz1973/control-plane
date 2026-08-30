# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_WF40_SIDECAR_SOURCE_PATCH_APPLY_OFFLINE
result_cursor: PASS_WF40_50_TO_56_EXACT_GPT_WEB_DELTA
starting_head: 77a9311f214f4237aea256175e3f16c32ff31882
final_head: PENDING_COMMIT

wf40_id: 9ZMj2ACTKyDVhCue
wf40_pre_version_id: 067a6b82-70a0-44dd-88fc-c8e9973f13bc
wf40_post_version_id: ef80943e-535d-430f-958f-56c03baa1c62
wf40_pre_node_count: 50
wf40_post_node_count: 56

patch_artifact: workflows/patches/v4-wf40-sidecar-source.gpt-web.json
patch_applied_verbatim: true
legacy_nodes_preserved: true
new_sidecar_nodes: 6
existing_v4_bridge_nodes_preserved: true

route_source_same_commit: true
technical_requirements_synthesized: false
explicit_resource_status_supported: true
status_collector_invoked: false
fail_closed_status_fallback_preserved: true
route_source_failure_blocks_wf61: true

wf61_active_final: false
d0025_gate_closed_final: true

workflow_execution_calls: 0
wf40_execution_calls: 0
wf61_execution_calls: 0
sidecar_adapter_execution_calls: 0
bridge_execution_calls: 0
provider_calls: 0
qwen_generation_calls: 0
qwen_session_manager_calls: 0
opencode_execution_count: 0
adapter_run_calls: 0
status_collector_calls: 0
credential_mutations: 0
network_mutations: 0
litellm_mutations: 0
openclaw_mutations: 0
secret_exposure: false

architecture_report: reports/architecture/v4_wf40_sidecar_source_patch_apply_offline.md
NEXT: V4_RESOURCE_STATUS_CONTROL_PLANE_SOURCE_CONTRACT
```
