# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_ADAPTER
result_cursor: PASS
reported_via: cursor_direct_persistence
starting_head: 0f2f7a524970c4733319d8f5f849cbf71685321d
final_head: f8dcac8e13e3972632e66835724bd8e0d6727737
targeted_tests: PASS 9/9 (tests/qwen-local-adapter/run.mjs)
classifier_regression: PASS 9/9 (tests/classifier-wrapper/run-offline-tests.mjs)
provider_calls: 0
litellm_calls: 0
ollama_generate_calls: 0
workflow_mutations: 0
n8n_mutations: 0
d0025_mutations: 0
secret_exposure: false

files_created_or_updated:
  - tools/ollama-json-client-v1.mjs
  - tools/classifier-wrapper-v1.mjs
  - tools/qwen-local-adapter-v1.mjs
  - docs/contracts/qwen-local-adapter-v1.md
  - docs/contracts/qwen-local-adapter-v1.schema.json
  - tests/qwen-local-adapter/run.mjs
  - reports/architecture/v4_qwen_local_adapter.md

architecture_report: reports/architecture/v4_qwen_local_adapter.md
current_frontier_d0025_untouched: true
qwen_enabled: false
qwen_local_registered: true
ollama_transport_duplicated: false
shared_ollama_client: tools/ollama-json-client-v1.mjs

NEXT: D-0025-W remains gated on ZAI reset; optional later bounded Qwen generation proof is a separate block
```
