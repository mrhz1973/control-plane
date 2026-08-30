# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_SHARED_RUNTIME_OCCUPANCY_DIAGNOSIS_ZERO_GENERATION
result_cursor: PASS_QWEN_BUSY_SHARED_RUNTIME
starting_head: bef52ab6e881e098b43c268df97ec169e803acb3
final_head: 67ccc2293539168e2f9683f892fbc9bd3c2bcdca

classification: QWEN_BUSY_SHARED_RUNTIME

control_plane_8080_listener: true
control_plane_8080_pid: 7576
control_plane_model_exposed: true

ollama_31452_listener: true
ollama_31452_pid: 56168
ollama_model_loaded: qwen3.8:27b

blender_running: true
mcp_processes_seen: true
cursor_running: true
opencode_running: false

active_8080_clients: msedge_webui
active_31452_clients: ollama_serve

blender_qwen_correlation: true
mcp_qwen_correlation: true
cursor_qwen_correlation: false
opencode_qwen_correlation: false

active_inference_evidence: true
benchmark_evidence: false
occupancy_sampling_window: ~32s_4_snapshots

qwen_generation_calls: 0
opencode_execution_count: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false

architecture_report: reports/architecture/v4_qwen_shared_runtime_occupancy_diagnosis.md
NEXT: WAIT_QWEN_SHARED_RUNTIME_IDLE
```
