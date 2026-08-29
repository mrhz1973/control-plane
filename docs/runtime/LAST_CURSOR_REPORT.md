# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_SESSION_MANAGER
result_cursor: PASS
reported_via: cursor_direct_persistence
starting_head: f34ec3b46747b7eaa2cd0ee123bfe2b5023d70a6
final_head: PENDING_COMMIT
default_profile: fast_8k
dflash_required: true
idempotent_start: true
concurrent_start_dedup: true
session_manager_tests: PASS 14/14
transport_tests: PASS 8/8
adapter_tests: PASS 9/9
live_readiness_probe: READY
live_launch_performed: false
generation_calls: 0
process_kill_calls: 0
launcher_mutations: 0
model_downloads: 0
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

architecture_report: reports/architecture/v4_qwen_local_session_manager.md

NEXT: V4 dispatch may call ensureQwenLocalReady after routing selects qwen_local; D-0025-W remains ZAI-gated
```
