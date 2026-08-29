# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_EXECUTION_ROUTER
result_cursor: PASS
reported_via: cursor_direct_persistence
starting_head: 2c4c188d1471d04864f94451db873c562912b8d5
final_head: 75d5fe4e2ebcfb2565021893a096a2ce28ffc6bf
execution_packet_v1_unchanged: true
arbiter_mocked_only: true
live_qwen_calls: 0
execution_router_tests: PASS 12/12
resource_registry_tests: PASS 7/7
resource_status_tests: PASS 6/6
qwen_local_adapter_tests: PASS 9/9
provider_calls: 0
litellm_calls: 0
glm_calls: 0
codex_calls: 0
qwen_live_calls: 0
n8n_mutations: 0
workflow_mutations: 0
d0025_mutations: 0
secret_exposure: false
current_frontier_d0025_untouched: true
status_fail_closed_untouched: true

architecture_report: reports/architecture/v4_execution_router.md

NEXT: V4 OpenCode dispatch / n8n integration deferred; D-0025-W remains ZAI-gated
```
