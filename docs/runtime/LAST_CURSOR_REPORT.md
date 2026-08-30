# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_LOCAL_READY_RESTORE_ZERO_GENERATION
result_cursor: PASS_QWEN_LOCAL_READY_RESTORED
starting_head: 7a0046ba596f3db9cbf5367cf08546e37089b8ba
final_head: PENDING_COMMIT
PENDING_COMMIT

initial_llama_process: ollama_llama_server_port_31452_only
initial_port_8080: not_listening
initial_models_http: UNREACHABLE
initial_fast_8k_exposed: false

previous_failure_classification: API_UNREACHABLE_AFTER_CANONICAL_LAUNCH

launcher_exists: true
llama_cpp_directory_exists: true
launcher_start_count: 1
launcher_exit_or_spawn_behavior: parent_powershell_waits_on_edge_ui_child_dflash2_server_stays_on_8080

final_llama_process: dflash2_llama_server_listening
final_port_8080: LISTEN
final_models_http: HTTP_200
final_fast_8k_exposed: true

qwen_backend: llama_cpp
qwen_profile: fast_8k
qwen_model_id: qwen38-original-dflash2-8k
dflash_required: true
session_manager_final_status: READY
qwen_resource_status_available: true

opencode_execution_count: 0
qwen_generation_calls: 0
glm_calls: 0
codex_calls: 0
litellm_calls: 0
n8n_calls: 0

launcher_mutations: 0
runtime_parameter_mutations: 0
network_mutations: 0
process_kill_calls: 0
secret_exposure: false

historical_live_auth_reused: false
gate_final: CLOSED_REAUTH_REQUIRED
architecture_report: reports/architecture/v4_qwen_local_ready_restore_zero_generation.md

NEXT: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH
```
