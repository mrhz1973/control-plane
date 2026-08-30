# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF
result_cursor: STOP_QWEN_LOCAL_UNAVAILABLE
starting_head: afab31088e2ca8121b73001502227e3826037bff
final_head: 84819c68b208f861df53b70eace7f6bd127a59b6

authorization_id: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF
packet_id: EP-V4-OPENCODE-LIVE-PROOF-001

opencode_version: 1.18.25
opencode_execution_count: 0
opencode_single_turn: proven_config_not_executed
opencode_tools_disabled: true
opencode_auxiliary_generation_paths_disabled: true
opencode_retry_bound_proven: true_via_steps_1_and_continue_loop_on_deny_false

qwen_backend: llama_cpp
qwen_profile: fast_8k
qwen_model_id: qwen38-original-dflash2-8k
dflash_required: true
qwen_session_status: API_UNREACHABLE
qwen_generation_calls: 0

live_http_status_or_transport: not_started
live_elapsed_ms: 0

response_schema: null
response_task_id: null
response_route: null
response_profile: null
response_dflash_required: null
response_result: null
response_message: null
response_validation: NOT_REACHED

glm_calls: 0
codex_calls: 0
litellm_calls: 0
n8n_calls: 0
fallback_calls: 0
retry_calls: 0

repository_mutation_by_opencode: false
runtime_parameter_mutation: false
secret_exposure: false

gate_closed_final: true
architecture_report: reports/architecture/v4_opencode_bounded_live_dispatch_proof.md
checkpoint_path: docs/runtime/CHECKPOINT_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.md

NEXT: V4_QWEN_LOCAL_READY_RESTORE_ZERO_GENERATION
```
