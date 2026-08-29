# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_RESOURCE_REGISTRY_CONTRACT
result_cursor: PASS
reported_via: cursor_direct_persistence
starting_head: 9496f471ad1ae97e022ea5e511cfec5d797016d1
final_head: 1ee35423cf2bea858fa10ff59364fdf3641b79a8
targeted_tests: PASS 7/7 (tests/resource-registry-validator/run.mjs)
provider_calls: 0
ollama_calls: 0
litellm_calls: 0
workflow_mutations: 0
n8n_mutations: 0
execution_packet_mutations: 0
planner_selection_mutations: 0
d0025_mutations: 0
secret_exposure: false

files_created:
  - docs/contracts/resource-registry-v1.schema.json
  - configs/resources/registry.json
  - tools/validate-resource-registry-v1.mjs
  - tests/resource-registry-validator/run.mjs
  - tests/resource-registry-validator/fixtures/*
  - reports/architecture/v4_resource_registry_contract.md

architecture_report: reports/architecture/v4_resource_registry_contract.md
current_frontier_d0025_untouched: true
resource_status_untouched: true
qwen_enabled: false
qwen_local_registered: true
qwen_local_hardcoded_ollama_model: false
ollama_transport_duplicated: false

NEXT: D-0025-W remains gated on ZAI reset; V4 next blocks deferred (adapters/routers)
```
