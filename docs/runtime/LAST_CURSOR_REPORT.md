# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_DISPATCH
result_cursor: STOP_OPENCODE_NOT_INSTALLED
starting_head: b23e72bbc87f335752d92ed703400d66ede52fa9
final_head: 4c18ce88f0ecd5b8a88bb69758e4aea39d98b47a

opencode_available: false
opencode_version: null
opencode_dispatch_interface_resolved: false

resource_status_opencode_overlay: not_implemented
qwen_session_manager_reused: not_applicable
qwen_profile: fast_8k
dflash_required: true

dispatch_contract_path: null
dispatch_tool_path: null
dispatch_test_path: null

tests_result: not_run
execution_router_tests: not_run
qwen_session_tests: not_run
qwen_status_overlay_tests: not_run

generation_calls: 0
provider_calls: 0
litellm_calls: 0
glm_calls: 0
codex_calls: 0
qwen_generation_calls: 0

execution_performed: false
n8n_mutations: 0
workflow_mutations: 0
d0025_mutations: 0
secret_exposure: false

bugbot_review: not_applicable
architecture_report: reports/architecture/v4_opencode_dispatch.md

NEXT: V4_OPENCODE_DISPATCH
```
