# V4 — LOCAL_DEV_EXECUTOR timeout arbitration + OpenCode pre-generation boundary diagnostic (v1)

Task: `V4_LOCAL_DEV_EXECUTOR_TIMEOUT_ARBITRATION_AND_OPENCODE_PREGEN_BOUNDARY_DIAGNOSTIC_V1`
Base: `d86a69269bae6d2273e91dcefbd955422e0170a5` (dispatch base `1b75b63` + remote handoff docs commit, ff-only)
Date: 2026-09-05
Scope: DEV domain only (LOCAL_DEV_EXECUTOR). No production surface touched.

## 1. Evidence layer defects (our code) — fixed and regression-proven

### 1.1 Phase A — hard-timeout arbitration race (the RETRY5 ambiguity)

`makeRunOpenCodeTask` raced `spawned.promise` against a timeout promise whose
callback `await spawned.terminate()` BEFORE rejecting. Termination resolves
the child promise with `status 1` first, so `Promise.race` surfaced
`OPENCODE_RUN_FAILED` instead of `BOUNDS_TIMEBOX_EXPIRED`. RETRY5's
`STOP:OPENCODE_RUN_FAILED` at ~92 s with empty excerpts is therefore NOT
evidence of an autonomous OpenCode exit.

Fix: an arbitration flag `timedOut` flips synchronously when the timer fires
(BEFORE any `await`); the child outcome is chained through a suspension gate
(`timedOut ? forever-pending : r`). Once the hard timeout fires, the child's
exit/close/promise-resolution can only become secondary diagnostics carried
by the `BOUNDS_TIMEBOX_EXPIRED` rejection (full termination record +
sanitized output excerpts). The timer is cleared on every path (PASS no longer
leaves a late unhandled rejection).

Regression (deterministic, ms-scale): `RETRY5-style race: timeout-triggered
child exit 1 stays BOUNDS_TIMEBOX_EXPIRED` — kill-induced `status 1`
resolution interleaved before the rejection still yields
`code=BOUNDS_TIMEBOX_EXPIRED` with `exit_code_after_termination=1` preserved
as secondary evidence.

### 1.2 Phase B — `defaultSpawn` output capture scope

`stdout`/`stderr` were declared INSIDE the promise executor while
`getOutput()` closed over them from the outer handle scope: every timeout-path
output capture was a latent `ReferenceError` (empty excerpts in RETRY5 are
consistent with capture failure, not necessarily empty child output).

Fix: buffers hoisted to the outer handle scope; `getOutput()` valid before,
during and after termination. Regression: `defaultSpawn captures stdout/stderr
across the whole termination lifecycle` (harmless local Node child).

### 1.3 Phase C — Windows OpenCode probe no-shell (DEP0190 elimination)

`tools/probe-opencode-local-v1.mjs` spawned `opencode.cmd` with
`shell: process.platform === "win32"` → Node `DEP0190` (observed live in
RETRY5). Fix: probe resolves the REAL `opencode.exe` via the shared
no-shell helper and always spawns with the shell option disabled. The
resolver now lives in `tools/opencode-binary-resolution-v1.mjs` (single
source of truth; node-builtins only, no circular imports), re-exported by the
live runner. Fail-closed semantics preserved (unresolvable `.cmd` →
`OPENCODE_CMD_SHIM_UNRESOLVED`, never a shell fallback).

Residual DEP0190 found in the TEST harness (`debug config` schema probe via
`execFile(..., shell: win32)`) and fixed the same way. Regressions: static
no-shell assertion on the probe source + live child-probe run asserting
`--version` / `run --help` PASS with NO `DEP0190` in stderr and a non-`.cmd`
executable.

## 2. Proven facts about the OpenCode process (RETRY5, from existing local logs)

Read-only source: `%USERPROFILE%\.local\share\opencode\log\opencode.log`.
Sanitized, structural lines only (no auth/tokens/bodies).

- RETRY5 run `b245326a` (2026-09-04T21:56:05Z, config `lde-oc-config-y521Ep`):
  `creating instance` → `fromDirectory` → `bootstrapping` → config loads
  (user config + our temp `OPENCODE_CONFIG`) → `all LSPs are disabled` →
  `all formatters are disabled` → `init` → **then nothing** until
  `cleanup prune=7.days` at +60.3 s.
- RETRY4 run `5fa9d426` (21:16Z): identical signature.
- Healthy reference `9ac572ff` (2026-08-31T22:48Z, production adapter overlay,
  same CLI 1.18.25, same workstation): `init` → session `created` (+214 ms) →
  `event connected` → `loop` → `tracking` → `stream providerID=qwen_local` →
  `llm runtime selected`.

Proven:
1. OpenCode was alive at +60 s (its own cleanup timer fired) — NOT an early
   autonomous exit; the 90 s hard timeout terminated it.
2. The stall boundary is **post-`init`, pre-session-creation** — before any
   model selector evaluation, provider package init, or HTTP dispatch.
3. Zero guard traffic (guard accounting all-zero) is consistent: nothing
   after `init` ever reached a generation path.
4. No error line was emitted by OpenCode at any point (silent stall).

## 3. Root-cause hypothesis → proven differential → fourth authorized fix

The healthy production invocation on this workstation differs from the DEV
runner in exactly two ratified aspects (`serve-v4-windows-local-execution-endpoint-v1.mjs`):

- `stdio: ["ignore", "pipe", "pipe"]` — stdin IGNORED. The DEV runner left
  stdin as an open, never-closed pipe.
- `OPENCODE_DISABLE_{TITLE,AUTOCOMPACT,MODELS_FETCH,DEFAULT_PLUGINS,CLAUDE_CODE,LSP_DOWNLOAD,AUTOUPDATE,PRUNE}=1`
  — "no network plugin fetches / autoupdate" during bootstrap. The DEV runner
  set none.

The Aug-31 log corroborates the fetch class: the healthy run itself logged
`downloading ripgrep` from github.com during startup. RETRY4/5 ran with none
of these bounded-run guards: the silent post-`init` stall is consistent with
a bootstrap path blocked on an open stdin and/or a network fetch that the
workstation cannot complete under the DEV network policy.

Fourth correction (authorized: precise cause, permitted files): the DEV
runner's `makeRunOpenCodeTask` now spawns with `stdio: ["ignore","pipe","pipe"]`
and the full ratified `OPENCODE_DISABLE_*` suite, mirroring the production
invocation shape that provably reaches the provider stream stage on this
workstation. No production file was modified.

## 4. Boundary classification

`OPENCODE_PREGEN_BOUNDARY = OPENCODE_PRE_PROVIDER_INIT_STALL`

Proven boundary: CLI bootstrap + config load + `init` complete; session
creation never starts. Still unproven (hypotheses, not causes): which of
stdin-block vs. network-fetch class the stall belonged to (the adopted
production shape addresses both; a bounded diagnostic retry will confirm).

## 5. Accounting for this pass

- REAL_QWEN_GENERATIONS = 0
- Qwen router requests = 0 (router untouched; `router_was_running` not consumed)
- Fake OpenCode runs = 0 (Phase F not needed: logs conclusive)
- OpenCode `run` executions = 0 (preflight probes `--version` / `run --help` /
  `debug config` only, same class already used by prior passes)
- No OpenCode global config/auth/version/install change
- Production domains (WF40/WF61/D0025/scope-v3/auth/adapter/eligible set/
  role mappings/Qwen routing/router config/llama.cpp/PostgreSQL/n8n/
  Blender): untouched
- Pre-existing untracked files: untouched

## 6. Tests

- `tests/local-dev-executor-live-runner-v1/run.mjs`: 38 tests (was 34),
  including the RETRY5-style arbitration race, output-capture lifecycle,
  probe no-shell static + live-child regressions, shared-resolver identity.
- `tests/local-dev-executor-v1/run.mjs`, `tests/local-dev-executor-workstation-session-bridge-v1/run.mjs`: unchanged, green.

## 7. NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY6_DIAGNOSTIC` —
one bounded live proof with the corrected arbitration (timebox ≤ 90 s): the
expected outcome is either a provider-boundary PASS path or a
`STOP:BOUNDS_TIMEBOX_EXPIRED` whose `timeout_diagnostics` now carries the
true sanitized stdout/stderr excerpts of the stalled child, definitively
sealing the pre-generation boundary. Not executed here (no blind RETRY6 in
this pass; RETRY5 remains the latest executed proof).

## First completed bounded live proof

LOCAL_DEV_EXECUTOR_FIRST_LIVE_PROOF_RETRY7 = QWEN_EXECUTED

## First completed bounded live proof after turn calibration

LOCAL_DEV_EXECUTOR_FIRST_LIVE_PROOF_RETRY8 = QWEN_EXECUTED

## First full bounded live proof after no-subagent calibration

LOCAL_DEV_EXECUTOR_FIRST_LIVE_PROOF_RETRY9 = QWEN_EXECUTED

## First complete LOCAL_DEV_EXECUTOR live proof on Cline24K

LOCAL_DEV_EXECUTOR_FIRST_COMPLETE_LIVE_PROOF_CLINE24K = QWEN_EXECUTED
