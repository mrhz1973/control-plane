# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_LLAMA_CPP_BOUNDED_LIVE_PROOF_RETRY_1
result_cursor: STOP
reported_via: cursor_direct_persistence
starting_head: 08bcacb1671da40d967b74eb0fb3a1f4ecde41be
final_head: PENDING_COMMIT
blocker: FAST_8K_DFLASH2_PROFILE_NOT_AVAILABLE
operator_runtime_manually_loaded: true
backend: llama_cpp
endpoint: http://127.0.0.1:8080
profile: fast_8k
model_id: qwen38-original-dflash2-8k
context_tokens: 8192
dflash_required: true
models_probe: CONNECTION_ERROR
generation_attempts: 0
adapter_classification: N/A
transport_classification: CONNECTION_ERROR
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
secret_exposure: false
status_fail_closed_untouched: true
current_frontier_d0025_untouched: true

architecture_report: reports/architecture/v4_qwen_local_llama_cpp_bounded_live_proof_retry_1.md

NEXT: ensure llama-server multi-model router is listening on 127.0.0.1:8080 with qwen38-original-dflash2-8k exposed before another bounded retry; D-0025-W remains ZAI-gated
```
