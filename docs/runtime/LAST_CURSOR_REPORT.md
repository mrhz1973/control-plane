# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_WF40_EXECUTION_ROUTING_PATCH_APPLY_OFFLINE
result_cursor: PASS_WF40_44_TO_50_EXACT_GPT_WEB_DELTA
starting_head: 4296e9c56f6d3c9763aa07e9c1c9847692014b12
final_head: <stamped post-commit>

wf40_id: 9ZMj2ACTKyDVhCue
wf40_pre_version_id: 07fbfca6-e2f9-4fff-bfd6-c59d31f124b7
wf40_post_version_id: 067a6b82-70a0-44dd-88fc-c8e9973f13bc
wf40_pre_node_count: 44
wf40_post_node_count: 50

patch_artifact: workflows/patches/v4-wf40-execution-routing-bridge.gpt-web.json
patch_applied_verbatim: true
legacy_nodes_preserved: true
new_v4_nodes: 6
wf61_target_preserved: d0025-6100-4001-8001-000000000061
wf61_active_final: false
d0025_gate_closed_final: true

explicit_route_request_required: true
explicit_resource_status_required: true
technical_requirements_synthesized: false
missing_sidecar_fail_closed: true
dispatch_node_added: false
execution_node_added: false
separate_v4_workflow_created: false

workflow_execution_calls: 0
provider_calls: 0
qwen_generation_calls: 0
opencode_execution_count: 0
adapter_run_calls: 0
secret_exposure: false

architecture_report: reports/architecture/v4_wf40_execution_routing_patch_apply_offline.md
NEXT: V4_EXECUTION_ROUTE_SIDECAR_SOURCE_CONTRACT
```
