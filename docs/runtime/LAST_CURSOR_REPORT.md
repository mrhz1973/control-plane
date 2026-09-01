# LAST CURSOR REPORT - control-plane (rolling)

## LATEST

```yaml
task_ref: V4_N8N_SQLITE_WAL_ADMISSION_REPAIR_AND_WF40_LIVE_RESUME
run_nonce: N8N_SQLITE_WAL_ADMISSION_20260901_01
result_cursor: STOP
dispatch_base_head: 975c8379e83e88c1e01dd2b34515e72f3a4d043b
finding: SQLITE_WAL_ALREADY_ACTIVE_NOT_ROOT_CAUSE
next: V4_N8N_ADMISSION_INTERNAL_TRACE_OR_POSTGRES_CANARY

n8n_version: 2.33.3
journal_mode: wal
effective_sqlite_pool_size: 3
concurrency: PRODUCTION_CONCURRENCY_DISABLED
task_runner: TASK_RUNNER_NOT_CAUSAL_FOR_PRE_ADMISSION_STALL
quick_check: ok
mutations_performed: 0
gate: CLOSED

evidence:
  - reports/architecture/v4_n8n_sqlite_wal_admission_repair_and_wf40_live_proof.md
  - reports/runtime/cursor-stops/2026-09-01T012500Z__V4_N8N_SQLITE_WAL_ADMISSION_REPAIR_AND_WF40_LIVE_RESUME.stop.json
```
