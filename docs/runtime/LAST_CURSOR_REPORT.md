# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_SHARED_RUNTIME_OCCUPANCY_RECHECK_AFTER_PAUSE
result_cursor: PASS_QWEN_READY_IDLE
starting_head: 80ac8eb778675d80a7ddd3fd185d6bd5bef5cfe0
final_head: 89b3e35d619cdf710dfe3d52ee39d8febaffc6b2

classification: QWEN_READY_IDLE

control_plane_8080_listener: false
control_plane_model_exposed: false

ollama_runtime_present: true
ollama_model_loaded: false

blender_running: true
mcp_processes_seen: true_orphaned_ollama_qwen_proxy_only
qwen_code_running: false
cursor_running: true
opencode_running: false

active_inference_evidence: false
active_8080_clients: none
active_ollama_clients: none
occupancy_sampling_window: ~32s_4_snapshots

qwen_generation_calls: 0
opencode_execution_count: 0
process_start_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false

architecture_report: reports/architecture/v4_qwen_shared_runtime_occupancy_recheck_after_pause.md
NEXT: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH
```
