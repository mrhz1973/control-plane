# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_BOUNDED_LIVE_PROOF
result_cursor: PASS
reported_via: cursor_direct_persistence
starting_head: edb25753cde3df8fd11896e47c14e08bbac45537
final_head: fd16efa1bbe9f086a7f41560a51503f64ff51095
qwen_local_live_proof: PASS
selected_model: qwen3.8:27b
ollama_tags_reachable: true
generate_attempts: 1
adapter_classification: LOCAL_MODEL_RESULT
role: routing_arbiter
validated_result:
  selection: opencode+qwen_local
  reason_code: LOCAL_ZERO_COST_SUFFICIENT
  confidence: high
elapsed_ms: 55118
targeted_offline_tests: PASS 9/9 (tests/qwen-local-adapter/run.mjs)
provider_calls: 0
litellm_calls: 0
glm_calls: 0
codex_calls: 0
n8n_mutations: 0
workflow_mutations: 0
d0025_mutations: 0
model_downloads: 0
secret_exposure: false
status_fail_closed_untouched: true
current_frontier_d0025_untouched: true

architecture_report: reports/architecture/v4_qwen_local_bounded_live_proof.md

NEXT: D-0025-W remains gated on ZAI reset; V4 routers/collector deferred; fail-closed status baseline remains available=false for qwen_local
```
