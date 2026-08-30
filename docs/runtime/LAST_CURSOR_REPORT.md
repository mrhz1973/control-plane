# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH
result_cursor: STOP_LIVE_PROOF_RESPONSE_INVALID
starting_head: d03930b544c29741aeffd42e844bd799073e5a39
final_head: ee1979ff2b5e7262bf23a311c4b8f3808bbc9a42

authorization_id: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH
packet_id: EP-V4-OPENCODE-LIVE-PROOF-REAUTH-001

occupancy_preflight_classification: QWEN_NOT_RUNNING_SAFE_TO_START
occupancy_recheck_before_generation: QWEN_READY_IDLE
competing_workload_detected: false

runtime_restore_required: true
launcher_start_count: 1
runtime_ready: true
models_http_status: 200
qwen_model_exposed: true

opencode_version: 1.18.25
opencode_execution_count: 1
opencode_single_turn: true
opencode_tools_disabled: true
opencode_auxiliary_generation_paths_disabled: true
opencode_retry_bound_proven: true

qwen_backend: llama_cpp
qwen_profile: fast_8k
qwen_model_id: qwen38-original-dflash2-8k
dflash_required: true
qwen_generation_calls: 1

live_transport_status: exit_0_json_events
live_elapsed_ms: 58748

response_schema: missing
response_task_id: missing
response_route: missing
response_profile: missing
response_dflash_required: missing
response_result: missing
response_message: missing
response_validation: FAIL_MAXIMUM_STEPS_TEXT_NOT_REQUIRED_JSON

retry_calls: 0
fallback_calls: 0
glm_calls: 0
codex_calls: 0
litellm_calls: 0
n8n_calls: 0

process_kill_calls: 0
process_stop_calls: 0
repository_mutation_by_opencode: false
runtime_parameter_mutation: false
network_mutation: false
secret_exposure: false

gate_closed_final: true
architecture_report: reports/architecture/v4_opencode_bounded_live_dispatch_proof_reauth.md
checkpoint_path: docs/runtime/CHECKPOINT_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH.md
NEXT: V4_OPENCODE_STEPS1_MAXIMUM_STEPS_DIAGNOSIS_ZERO_GENERATION
```
