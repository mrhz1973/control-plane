# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_LLAMA_CPP_BOUNDED_LIVE_PROOF
result_cursor: STOP
reported_via: cursor_direct_persistence
starting_head: 6a71fd4bc0475a955730da7726dfc61f5ee3295a
final_head: PENDING_COMMIT
blocker: MODEL_ERROR
backend: llama_cpp
endpoint: http://127.0.0.1:8080
profile: fast_8k
model_id: qwen38-original-dflash2-8k
context_tokens: 8192
dflash_required: true
models_probe: HTTP_200_FAST_8K_PRESENT
generation_attempts: 1
adapter_classification: MODEL_ERROR
role: routing_arbiter
elapsed_ms: 5487
old_ollama_proof_superseded: true
qwen_local_llama_cpp_live_proof: STOP
adapter_offline_tests: PASS 9/9
transport_offline_tests: PASS 8/8
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

architecture_report: reports/architecture/v4_qwen_local_llama_cpp_bounded_live_proof.md

NEXT: diagnose llama.cpp chat failure for qwen38-original-dflash2-8k without retrying in this block; D-0025-W remains ZAI-gated
```
