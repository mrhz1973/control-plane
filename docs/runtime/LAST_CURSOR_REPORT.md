# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_RESOURCE_STATUS_OVERLAY
result_cursor: PASS
reported_via: cursor_direct_persistence
starting_head: f7f534cf33ccfda4d06f962b4842edbb1c96c6a4
final_head: 70a1046d7cf71afde87b04a23f3b6aac26129c38
baseline_unchanged: true
session_manager_reused: true
execution_router_policy_unchanged: true
overlay_tests: PASS 14/14
resource_status_tests: PASS 6/6
session_manager_tests: PASS 14/14
execution_router_tests: PASS 12/12
live_collector_probe: READY
qwen_local_available: true
launch_performed: false
generation_calls: 0
provider_calls: 0
litellm_calls: 0
glm_calls: 0
codex_calls: 0
qwen_generation_calls: 0
n8n_mutations: 0
workflow_mutations: 0
d0025_mutations: 0
secret_exposure: false
status_fail_closed_untouched: true
current_frontier_d0025_untouched: true

architecture_report: reports/architecture/v4_qwen_local_resource_status_overlay.md

NEXT: future dispatch may call collector then EXECUTION_ROUTER; D-0025-W remains ZAI-gated
```
