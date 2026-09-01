# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_QWEN_CANONICAL_MANAGER_WORKER_CLASSIFIER_FIX_AND_WF40_LIVE_RESUME
run_nonce: QWEN_MANAGER_WORKER_FIX_20260901_01
result_cursor: STOP
dispatch_base_head: 8689917fc53d81897be4cdb5650e57a3a449505d
finding: N8N_SCHEDULER_STALLED_NO_WF40_NATURAL_EVENT

classifier_fix: PASS
target_tests: 57/57
regressions: private=22 windows=65 opencode=23 guard=16 wf40_sidecar=27
bugbot: PASS_NO_FINDINGS

qwen_ready_idle: PASS
resource_status_qwen_available: true
resource_status_opencode_available: true
canonical_manager_worker: recognized

wf40_seam_live: 83 nodes active
wf40_pipeline_executions: 0
wf61_executions: 0
remote_planner_calls: 0
telegram_messages: 0
opencode_executions: 0
qwen_generation_calls: 0

d0025_gate: RESTORED_CLOSED
wf61_active: false

pass_state_partial:
  - QWEN_CANONICAL_MANAGER_WORKER_RECOGNIZED
  - QWEN_READY_IDLE
  - RESOURCE_STATUS_QWEN_AVAILABLE
  - WF40_POST_PLANNER_SEAM_PERSISTED

next: restore n8n WF40 scheduler then resume D-V4-WF40-LIVE-001 Phase E

evidence:
  - reports/architecture/v4_qwen_canonical_manager_worker_classifier_fix_and_wf40_live_proof.md
  - reports/runtime/cursor-stops/2026-09-01T002400Z__V4_QWEN_CANONICAL_MANAGER_WORKER_CLASSIFIER_FIX_AND_WF40_LIVE_RESUME.stop.json
```
