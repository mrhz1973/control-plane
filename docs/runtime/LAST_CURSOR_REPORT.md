# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_WF40_STATUS_POLL_TRANSIENT_ERROR_FIX_AND_LIVE_PROOF_RESUME
run_nonce: WF40_STATUS_POLL_FIX_20260901_01
result_cursor: STOP
starting_head: 8689917fc53d81897be4cdb5650e57a3a449505d
finding: QWEN_READY_IDLE_PREFLIGHT_FAILED

category: WF40_STATUS_POLL_FIX_PLUS_LIVE_PROOF
status_poll_transient_fix: PASS
target_tests: 27/27
bugbot: PASS_NO_FINDINGS
wf40_seam: APPLIED_71_TO_83_LIVE
wf40_nodes: 83
wf40_versionId: a609ad90-7eb4-4495-9ec5-c4413165cea1
parse_status_transient_fix_live: true

phase_e_live_proof: NOT_STARTED
qwen_occupancy: QWEN_BUSY_SHARED_RUNTIME
qwen_reason: NONCANONICAL_INFERENCE_LISTENER_ACTIVE
non_canonical_listener: 127.0.0.1:58074 llama-server

wf40_executions: 0
wf61_executions: 0
remote_planner_calls: 0
telegram_messages: 0
opencode_executions: 0
qwen_generation_calls: 0
second_provider: 0
second_register: 0
second_execution: 0

d0025_gate: CLOSED
wf61_active: false
active_authorizations: 0

pass_state_partial:
  - WF40_STATUS_POLL_TRANSIENT_ERROR_FIXED
  - WF40_POST_PLANNER_SEAM_PERSISTED
  - BUGBOT_PASS_NO_FINDINGS

next: restore QWEN_READY_IDLE then resume V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF

evidence:
  - reports/architecture/v4_wf40_status_poll_transient_fix_and_live_proof_stop.md
  - reports/runtime/cursor-stops/2026-08-31T234027Z__V4_WF40_STATUS_POLL_TRANSIENT_ERROR_FIX_AND_LIVE_PROOF_RESUME.stop.json
```
