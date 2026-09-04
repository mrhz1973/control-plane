# LAST CURSOR REPORT

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_WINDOWS_OPENCODE_SHIM_SPAWN_FIX_V1`
**Classification:** `WINDOWS_OPENCODE_SHIM_SPAWN_FIXED`
**Timestamp (local):** 2026-09-04

## Summary

Fixed the live-proof retry blocker `STOP:EINVAL` (router healthy, zero
turns): the OpenCode probe returns the Windows npm `.cmd` shim, which
`child_process.spawn(shell:false)` cannot execute.

Implemented the no-shell direct-process fix in
`tools/run-local-dev-executor-v1.mjs`:

- `resolveOpenCodeSpawnTarget` — resolves `.cmd` shims to the REAL package
  binary (`%APPDATA%\npm\node_modules\opencode-ai\bin\opencode.exe`, with
  shim-dir fallback); unresolvable shims fail closed
  (`OPENCODE_CMD_SHIM_UNRESOLVED`) — no shell fallback ever
- spawn target invoked with explicit `shell:false`; task message remains
  literal argv data; one process; OPENCODE_CONFIG/cwd/hard timeout/DEV
  guard/permission overlay all preserved

Wiring suite **29/29 PASS** (shim resolution, fail-closed rejection,
literal metacharacter argv, config/cwd survival, single process, REAL
no-shell `--version` smoke — no model); regressions executor **20/20**,
bridge **14/14**. Budget: run → one bounded correction → retest.

- Real Qwen generations: **0** · OpenCode model executions: **0** ·
  services started/stopped: **0**
- Production domain untouched; all pre-existing untracked files preserved

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY2` (NOT
executed in this pass)

Evidence report:
`reports/architecture/v4_local_dev_executor_windows_opencode_shim_spawn_fix_v1.md`
