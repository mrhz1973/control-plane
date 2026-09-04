# V4 LOCAL_DEV_EXECUTOR — live runner wiring V1

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_LIVE_RUNNER_WIRING_V1`
**Classification:** `LOCAL_DEV_EXECUTOR_LIVE_RUNNER_WIRED_OFFLINE_WIRING_TEST_PASS`
**Dispatch base head:** `d2dd9ba660521b561860fbd6bec05807ce6c4964`
**Date:** 2026-09-04
**Contract:** `docs/contracts/local-dev-executor-v1.md`

## Implemented

`tools/run-local-dev-executor-v1.mjs` — smallest concrete live composition
layer for the already-implemented executor. It adds NO execution logic:
validation and core flow stay in `tools/local-dev-executor-v1.mjs`.

Composed collaborators:

- **ensureQwenReady** — `makeEnsureQwenReady` wraps the canonical session
  manager `ensureQwenLocalReady` and adds `router_was_running`
  (`status === "READY"` → already running; `LAUNCH_STARTED_AND_READY` →
  this task started it).
- **guardStart** — `startLocalDevGenerationGuard` (DEV-domain proxy).
- **runOpenCodeTask** — exactly ONE OpenCode process per task. Rejects a
  target that is `:8080` or non-loopback
  (`GUARD_TARGET_IS_DIRECT_QWEN_ENDPOINT`); probes OpenCode via the existing
  read-only probe; writes the provider overlay (pointing at the guard URL)
  to a temp `OPENCODE_CONFIG` removed in `finally`; builds the bounded
  structural task message (`buildTaskMessage`, 4000-char cap, no secrets).
- **runTests** — bounded cycles; breaks on first success; hard stop at
  `max_test_cycles`.
- **persistGit** — selective staging of `changed_files` filtered by
  `allowed_paths`; never stages out-of-scope or untracked files; commit
  subject `executor-pass:`/`executor-stop:`; push `origin HEAD` only inside
  `target_repo_path`; fails closed per step with reason codes.
- **releaseRouterIfStarted** (opt-in flag `--release-started-router`) —
  only when this task exclusively started the router; rediscovers live
  process identity immediately before stop (never stale PIDs).

CLI: `node tools/run-local-dev-executor-v1.mjs --input-file <envelope.json>`
reads one `local-dev-task-envelope-v1`, delegates to the executor, prints
`local-dev-execution-result-v1`, exit 0 on PASS / 1 on STOP.

## Offline wiring tests

`tests/local-dev-executor-live-runner-v1/run.mjs` — **15/15 PASS**,
deterministic, no Qwen, no OpenCode, no service start/stop:

1. envelope reaches executor (invalid → `STOP:ENVELOPE_INVALID`; valid →
   preflight before any session start)
2. DEV profile preserved end-to-end (`qwen38-opus-q3-cline-64k` into
   ensureQwenReady and into the result; `router_was_running` mapping)
3. guard URL reaches OpenCode collaborator (loopback guard URL captured,
   never `:8080`; direct-target rejection; argv + `OPENCODE_CONFIG` wiring;
   provider overlay present)
4. production authorization never invoked (source-level absence of
   production auth/adapter/scope/ledger imports; selective staging
   excludes out-of-scope/untracked)
5. PASS/STOP result propagation (`executor-pass:`/`executor-stop:`
   subjects; STOP paths through composed wiring)

Test budget: run 1 (14/15, fake-git matcher defect in the test itself) →
one correction → final retest (15/15) + executor-suite regression (20/20).

## Invariants

- No real Qwen/OpenCode execution: **0** · services started/stopped: **0**
- WF40 / D-0025 / scope-v3 / production authorization / production adapter /
  eligible set / role mappings / Cline: unchanged
- All pre-existing untracked files preserved; only task files staged

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF` (not executed in
this pass)
