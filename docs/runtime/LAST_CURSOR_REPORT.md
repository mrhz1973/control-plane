# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_FIRST_LIVE_AUTHORIZED_EXECUTION_RETRY_004_EXACT_REGISTER_SCHEMA
run_nonce: FIRST_LIVE_004_20260901_01
result_cursor: PASS
starting_head: 90a284767415deb05b8dff8010e3fd4185fafb9e
dispatch_base_head: 90a284767415deb05b8dff8010e3fd4185fafb9e
final_head: PENDING_COMMIT

category: FIRST_LIVE_HUMAN_AUTHORIZED_EXECUTION
register_schema: exact_eight_keys
scope_digest: ca501cb41602028c4e575a08bcdfc491a793b7cb462790a6f3a4fc67efdb85aa
register_requests: 1
register_result: REGISTER_PENDING_ACCEPTED
real_telegram_decision_messages: 1
human_approve_decisions: 1
pending_004_final: ISSUED
auth_001: SPENT_PRESERVED
auth_002: SPENT_PRESERVED
auth_003: ABSENT_UNISSUED
auth_004_final: SPENT
active_authorizations_remaining: 0
ledger_004_records: 1 ADMISSION_CONSUMED

model_list_probes: 1
qwen_early_occupancy_samples: 2 QWEN_READY_IDLE
qwen_final_occupancy: QWEN_READY_IDLE
http_execution_endpoint_requests: 1
execution_performed: true
replayed: false
adapter_status: EXECUTED
guard_started: true
guard_upstream_generation_requests: 1
wf40_executions: 0
wf61_executions: 0
opencode_executions: 1
qwen_generation_calls: 1
retry_calls: 0
fallback_calls: 0
cloud_provider_calls: 0
response_validation: NOT_VALIDATED
live_gate: RECLOSED

pass_state:
  - REGISTER_SCHEMA_EXACT
  - QWEN_READY_IDLE_STABLE
  - HUMAN_APPROVAL_PASS
  - FIRST_LIVE_EXECUTION_PASS
  - OPENCODE_EXECUTIONS=1
  - QWEN_GENERATIONS=1
  - AUTH_004_SPENT
  - NO_ACTIVE_AUTHORIZATION
  - LIVE_GATE_RECLOSED

next: V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF

evidence:
  - reports/architecture/v4_first_live_authorized_execution_retry_004.md
  - docs/runtime/CURRENT_FRONTIER.md
  - docs/runtime/LAST_CURSOR_REPORT.md
```
