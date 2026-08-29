# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_LLAMA_CPP_TRANSPORT
result_cursor: PASS
reported_via: cursor_direct_persistence
prompt_expected_origin_main: edb25753cde3df8fd11896e47c14e08bbac45537
starting_head: 95598349b5780710fe54f57ebd1eb3c5875ef928
final_head: e7578321246549ffcfb2dbca36a543787a237c50
interrupted_cleanup: N/A_workspace_clean_live_proof_already_on_main
primary_backend: llama_cpp
ollama_compatibility: preserved
default_profile: fast_8k
dflash_required: true
ar_fallback_forbidden: true
base_url: http://127.0.0.1:8080
live_probe: RUNNING_v1_models_http_200
generation_calls: 0
transport_tests: PASS 8/8
adapter_tests: PASS 9/9
classifier_regression: PASS 9/9
provider_calls: 0
litellm_calls: 0
n8n_mutations: 0
workflow_mutations: 0
d0025_mutations: 0
launcher_mutations: 0
model_downloads: 0
secret_exposure: false
current_frontier_d0025_untouched: true
status_fail_closed_untouched: true

architecture_report: reports/architecture/v4_qwen_local_llama_cpp_transport.md

NEXT: D-0025-W remains gated on ZAI reset; V4 routers/collector/launcher-session mgmt deferred
```
