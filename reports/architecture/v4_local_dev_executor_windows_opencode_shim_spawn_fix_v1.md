# V4 LOCAL_DEV_EXECUTOR — Windows OpenCode shim spawn fix V1

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_WINDOWS_OPENCODE_SHIM_SPAWN_FIX_V1`
**Classification:** `WINDOWS_OPENCODE_SHIM_SPAWN_FIXED`
**Dispatch base head:** `83a76761e3edfd2c257c263c81721ebccae00782`
**Date:** 2026-09-04

## Live blocker fixed

First live-proof retry observed:

```text
router_was_running=true · launch_performed=false · turns_used=0 · STOP:EINVAL
```

Root cause (verified): the OpenCode probe resolves
`%APPDATA%\npm\opencode.cmd` on Windows (invoking it itself with shell
semantics), but `makeRunOpenCodeTask` passed that `.cmd` to
`child_process.spawn` with `shell:false` → `EINVAL` before any Qwen
generation. The DEV session bridge was healthy (router reused).

## Fix (no-shell, direct process — smallest safe shape)

`tools/run-local-dev-executor-v1.mjs` gains `resolveOpenCodeSpawnTarget`:

- Windows `.cmd`/`.bat` shim resolved to the REAL package binary, no shell:
  1. `%APPDATA%\npm\node_modules\opencode-ai\bin\opencode.exe`
  2. `<dir(opencode.cmd)>\node_modules\opencode-ai\bin\opencode.exe`
- Unresolvable shim → fail-closed `OPENCODE_CMD_SHIM_UNRESOLVED`; NO shell
  fallback is ever attempted (requirement 3).
- Direct executables pass through unchanged (non-Windows behavior intact).

`makeRunOpenCodeTask` now spawns the resolved target with
`shell: false` explicitly. Task message stays a literal argv element —
never shell syntax. Preserved invariants: exactly ONE OpenCode process per
task, `OPENCODE_CONFIG` propagation, `cwd=target_repo_path`, hard timeout,
DEV guard URL target, permission overlay unchanged.

## Tests

Wiring suite extended 23 → **29/29 PASS**
(`tests/local-dev-executor-live-runner-v1/run.mjs`):

- real `.cmd` shim resolves to the package binary (verified against the
  actual workstation install)
- unresolvable `.cmd` rejected fail-closed, no shell fallback, and the
  rejection is applied INSIDE `makeRunOpenCodeTask`
- direct executable passthrough unchanged
- spawn of the `.cmd`-resolved target: no EINVAL, argv with
  spaces/metacharacters (`' \` & | < > %PATH% ^ ;`) survives as ONE
  literal argv element, `OPENCODE_CONFIG` survives, `cwd` survives,
  exactly one task process
- REAL no-shell spawn smoke of the actual binary with `--version`:
  exit 0, version parses, no spawn error (no model, no Qwen)

Regressions: executor **20/20**, session bridge **14/14**.
Budget: run 1 (27/29 — two fixture defects: `tmpdir` function passed where
the `tmpdirRoot` import was intended) → one bounded correction → final
retest all green.

## Invariants

- Real Qwen generations: **0** · OpenCode model executions: **0**
  (`--version` binary smoke only) · services started/stopped: **0**
- Production domain untouched (WF40/D-0025/scope-v3/authorization/adapter/
  eligible set/role mappings)
- All pre-existing untracked files preserved

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY2` (NOT
executed in this pass)
