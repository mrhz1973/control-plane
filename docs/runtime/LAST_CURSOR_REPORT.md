# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2
result_cursor: PASS_LIVE_DISPATCH_OK
starting_head: 80a7aad187c816f14ee463b9fc0c5f98a6e7250e
final_head: 8d1cf2c619731e56b2a1276becabb3976605d97e

authorization_id: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2
packet_id: EP-V4-OPENCODE-LIVE-PROOF-REAUTH-002

occupancy_preflight_classification: QWEN_READY_IDLE
occupancy_recheck_before_generation: QWEN_READY_IDLE
competing_workload_detected: false

runtime_restore_required: false
launcher_start_count: 0
runtime_ready: true
qwen_model_exposed: true

guard_started: true
guard_bind_host: 127.0.0.1
guard_listen_port: 12670
guard_upstream_origin: http://127.0.0.1:8080
guard_generation_budget: 1
guard_generation_requests_seen: 1
guard_upstream_generation_requests: 1
guard_blocked_generation_requests: 0
guard_first_generation_terminal: true

opencode_version: 1.18.25
opencode_execution_count: 1
opencode_provider_target_is_guard: true
opencode_tools_disabled: true
opencode_steps_generation_ceiling_used: false

qwen_profile: fast_8k
qwen_model_id: qwen38-original-dflash2-8k
dflash_required: true
qwen_generation_calls: 1

live_transport_status: exit_0_json_events
live_elapsed_ms: 167644
response_validation: VALID

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
network_system_mutation: false
secret_exposure: false

gate_closed_final: true
architecture_report: reports/architecture/v4_opencode_bounded_live_dispatch_proof_reauth_2.md
checkpoint_path: docs/runtime/CHECKPOINT_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2.md
NEXT: V4_OPENCODE_EXECUTION_ADAPTER_V1
```
