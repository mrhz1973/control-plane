# LAST CURSOR REPORT

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_TEST_HARNESS_HANDLE_SHAPE_FIX_V1`
**Classification:** `LOCAL_DEV_EXECUTOR_TEST_HARNESS_HANDLE_SHAPE_FIX_PASS`
**Timestamp (local):** 2026-09-05

## Summary

Proven RETRY9 root cause fixed: `makeRunTests()` read `status` off the
`defaultSpawn()` HANDLE (post-`9b65a67` shape) instead of the resolved
process result, producing `exit_code: undefined` → `STOP:TEST_FAILED`
regardless of the real command outcome. `makeRunTests()` now normalizes both
shapes via the existing `asSpawnHandle` path, awaits `handle.promise`, and
records the resolved `status` as `exit_code`; bounded-cycle semantics and the
HANDLE/termination contracts are unchanged.

RETRY9 remains STOP only because of this now-fixed evidence/test wiring
defect: the Qwen/OpenCode path itself was successful within bounds
(SUBAGENT_USED=NO, 7 upstream generations, clean exit, test phase reached,
real `git diff --check` exit 0).

Regression evidence: 4 new deterministic offline tests (handle-shape
success/one-cycle, fail→success/bounded, legacy fake compat, REAL
`defaultSpawn` path). Suites: **42/42**, **20/20**, **14/14**;
`git diff --check` PASS.

QWEN_RUNS_THIS_PASS=0. OPENCODE_RUNS_THIS_PASS=0. Production unchanged.
The RETRY9 dirty marker (exact 4-line append) remains uncommitted and
requires canonical reconciliation. All pre-existing untracked preserved (32).

## NEXT

`V4_LOCAL_DEV_EXECUTOR_RETRY9_DIRTY_MARKER_RECONCILIATION_V1`
