# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_LLAMA_CPP_BOUNDED_LIVE_PROOF_RETRY_3
result_cursor: PASS
reported_via: cursor_direct_persistence
starting_head: 327a2b6cee9c44649b5055d24d8c2982abca29c3
final_head: PENDING_COMMIT
runtime_manually_started_by_operator: true
llama_server_process: RUNNING
port_8080_listener: LISTENING
listener_process: llama-server
models_probe: HTTP_200
fast_8k_dflash2_present: true
backend: llama_cpp
endpoint: http://127.0.0.1:8080
profile: fast_8k
model_id: qwen38-original-dflash2-8k
context_tokens: 8192
dflash_required: true
generation_attempts: 1
adapter_ok: true
adapter_classification: LOCAL_MODEL_RESULT
role: routing_arbiter
validated_result:
  selection: opencode+qwen_local
  reason_code: LOCAL_ZERO_COST_SUFFICIENT
  confidence: high
elapsed_ms: 63898
qwen_local_llama_cpp_live_proof: PASS
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

architecture_report: reports/architecture/v4_qwen_local_llama_cpp_bounded_live_proof_retry_3.md

NEXT: V4 routers/collector deferred; fail-closed status baseline remains available=false; D-0025-W remains ZAI-gated
```
