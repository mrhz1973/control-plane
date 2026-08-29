# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_LLAMA_CPP_BOUNDED_LIVE_PROOF_RETRY_2
result_cursor: STOP
reported_via: cursor_direct_persistence
starting_head: 4925bca170ff3ae65a30dd91294dca98b6da44a2
final_head: PENDING_COMMIT
blocker: LLAMA_SERVER_NOT_RUNNING
llama_server_process: ABSENT
port_8080_listener: NOT_LISTENING
listener_process: n/a
models_probe: CONNECTION_ERROR
fast_8k_dflash2_present: false
backend: llama_cpp
endpoint: http://127.0.0.1:8080
profile: fast_8k
model_id: qwen38-original-dflash2-8k
context_tokens: 8192
dflash_required: true
generation_attempts: 0
adapter_classification: N/A
adapter_tests: PASS 9/9
transport_tests: PASS 8/8
classifier_regression: PASS 9/9
provider_calls: 0
litellm_calls: 0
glm_calls: 0
codex_calls: 0
ollama_generate_calls: 0
n8n_mutations: 0
workflow_mutations: 0
d0025_mutations: 0
launcher_mutations: 0
model_downloads: 0
process_start_calls: 0
process_kill_calls: 0
secret_exposure: false
status_fail_closed_untouched: true
current_frontier_d0025_untouched: true

architecture_report: reports/architecture/v4_qwen_local_llama_cpp_bounded_live_proof_retry_2.md

NEXT: start operator launcher so llama-server listens on 127.0.0.1:8080 with qwen38-original-dflash2-8k exposed; then another bounded retry; D-0025-W remains ZAI-gated
```
