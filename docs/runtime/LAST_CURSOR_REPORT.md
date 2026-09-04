# LAST CURSOR REPORT

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_OPENCODE_FAILURE_EVIDENCE_V1`
**Classification:** `OPENCODE_FAILURE_EVIDENCE_PRESERVED`
**Timestamp (local):** 2026-09-04

## Summary

Preserved bounded, sanitized OpenCode CLI failure evidence on the unchanged
`STOP:OPENCODE_RUN_FAILED` path:

- `opencode_exit_code`
- capped/redacted `stdout_excerpt` and `stderr_excerpt` (≤2000 each)
- `spawn_error`, `spawn_error_code`, and `spawn_failure` when applicable

Clean non-zero exit and child spawn failure are structurally distinct.
PASS results carry no failure diagnostics.

Wiring suite **32/32 PASS**; regressions executor **20/20**, bridge
**14/14**. Budget: run → one bounded fixture correction → retest.

- Real Qwen generations: **0** · OpenCode model executions: **0** · services started/stopped: **0**
- Production domain untouched; all pre-existing untracked files preserved

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY3` (NOT
executed in this pass)

Evidence report:
`reports/architecture/v4_local_dev_executor_opencode_failure_evidence_v1.md`
