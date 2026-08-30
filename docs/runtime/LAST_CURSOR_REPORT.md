# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_DISPATCH_RESUME_AFTER_CANONICAL_INSTALL
result_cursor: PASS_OPENCODE_DISPATCH_READY
starting_head: dddb327cad2c9f09cbe8149392ead29a17708d72
final_head: PENDING_COMMIT

opencode_install_package: opencode-ai
opencode_available: true
opencode_version: 1.18.25
opencode_dispatch_interface_resolved: true

resource_status_opencode_overlay: true
qwen_session_manager_reused: true
qwen_profile: fast_8k
dflash_required: true

dispatch_contract_path: docs/contracts/opencode-execution-dispatch-v1.md
dispatch_tool_path: tools/dispatch-opencode-execution-v1.mjs
dispatch_test_path: tests/opencode-execution-dispatch/run.mjs
tests_result: ALL_PASS
execution_router_tests: PASS
qwen_session_tests: PASS
qwen_status_overlay_tests: PASS

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

bugbot_review: PASS_NO_FINDINGS
architecture_report: reports/architecture/v4_opencode_dispatch.md

NEXT: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF
```
