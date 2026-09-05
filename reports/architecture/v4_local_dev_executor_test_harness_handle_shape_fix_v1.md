# V4 — LOCAL_DEV_EXECUTOR test-harness handle-shape fix (v1)

Task: `V4_LOCAL_DEV_EXECUTOR_TEST_HARNESS_HANDLE_SHAPE_FIX_V1`
Base: `b4908d4aa6528048f9f89aad45013f4aae1521ab`
Date: 2026-09-05
Scope: DEV domain only. QWEN_RUNS_THIS_PASS=0, OPENCODE_RUNS_THIS_PASS=0,
production unchanged, RETRY9 dirty marker untouched/uncommitted.

## Context (RETRY9 proven evidence)

RETRY9 reached the TEST phase for the first time: no-subagent shaping worked
(SUBAGENT_USED=NO), OpenCode exited cleanly within bounds (turns_used=7/10,
timebox 208s/600s, blocked=0), the task delta was materially completed and
exact, and the actual `git diff --check` command exits 0 — yet the executor
returned `STOP:TEST_FAILED`.

Root cause (proven): after the hard-process-control refactor (`9b65a67`),
`defaultSpawn()` returns a process HANDLE `{pid, promise, getOutput,
terminate}`. `makeRunTests()` still read `r.status` off that handle object
→ `exit_code: undefined` → classified failed regardless of the real command
exit code. Offline tests masked the defect because injected `spawnProc`
fakes returned promise/result-shaped objects directly.

## Fix

`makeRunTests()` now normalizes BOTH shapes through the existing single
normalization path (`asSpawnHandle`, the same used by the OpenCode task),
awaits `handle.promise`, and records the RESOLVED result's `status` as
`exit_code`; bounded-cycle semantics (break on 0, max cycles) unchanged.
`defaultSpawn()` HANDLE contract and termination semantics unchanged.

## Regression evidence (deterministic, offline)

1. HANDLE-shaped spawn resolving `{status:0}` → `exit_code:0` recorded,
   exactly 1 cycle (RETRY9 defect directly covered).
2. HANDLE-shaped fail→success respects cycles; persistent failure bounded at
   `max_test_cycles`; no `undefined` exit codes.
3. Legacy promise/result-shaped injected fake still supported.
4. REAL `defaultSpawn` (production path) runs a harmless `node -e 0` command
   through `makeRunTests()` and records resolved `exit_code:0`.

Suites: live-runner **42/42** (4 new), executor **20/20**, bridge **14/14**,
`git diff --check` PASS. Zero Qwen/OpenCode runs, zero service operations.

## NEXT

`V4_LOCAL_DEV_EXECUTOR_RETRY9_DIRTY_MARKER_RECONCILIATION_V1` (mechanic:
verify + persist the exact RETRY9 marker append), then RETRY10 expected to
be the first complete end-to-end PASS (edit → test → git persistence).
