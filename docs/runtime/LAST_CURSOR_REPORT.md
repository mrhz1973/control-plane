# LAST CURSOR REPORT - control-plane (rolling)

## LATEST

```yaml
task_ref: V4_N8N_WF40_PUBLISH_STATE_REPAIR_AND_FIRST_LIVE_PROOF_RESUME
run_nonce: N8N_WF40_PUBLISH_REPAIR_20260901_01
result_cursor: STOP
dispatch_base_head: 5b4ea2e143ec369d5994ee04c9710c8006d6ece0
finding: N8N_SCHEDULER_STALLED_STUCK_EXECUTION_293850_DURING_LIVE_PROOF_WAIT

root_cause: ACTIVE_FLAG_TRUE_BUT_NO_PUBLISHED_VERSION
publish_repair: PASS
post_repair_scheduler_health: PASS
retry_trigger_5: a5fa29d
gate: RESTORED_CLOSED

wf40_full_pipeline: 0
wf61_executions: 0
remote_planner_calls: 0

evidence:
  - reports/architecture/v4_n8n_wf40_publish_state_repair_and_first_live_proof.md
  - reports/runtime/cursor-stops/2026-09-01T005200Z__V4_N8N_WF40_PUBLISH_STATE_REPAIR_AND_FIRST_LIVE_PROOF_RESUME.stop.json
```
