# V4 LOCAL_DEV_EXECUTOR — live safety enforcement V1

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_LIVE_SAFETY_ENFORCEMENT_V1`
**Classification:** `LOCAL_DEV_EXECUTOR_LIVE_SAFETY_ENFORCED`
**Dispatch base head:** `8931b88b7e588547a2a241f0ec0cdc2c27ef76e8`
**Date:** 2026-09-04
**Contract:** `docs/contracts/local-dev-executor-v1.md`

## Enforcement discovery (installed CLI facts, no execution)

Installed CLI: OpenCode **1.18.25 (V1)** at
`%APPDATA%\npm\node_modules\opencode-ai`. Verified live, read-only, via
`opencode debug config` with `OPENCODE_CONFIG` pointing at a temp file:

- `OPENCODE_CONFIG` env var IS honored (config validated from env path).
- V2 `permissions` arrays are REJECTED by V1 ("V2 permissions are not
  supported by OpenCode V1").
- V1 `permission` object syntax IS accepted:
  `bash: {"*":"deny", "<cmd>":"allow"}` (ordered rules, deny-all-first),
  `edit: {"*":"deny", "<glob>":"allow"}`, `webfetch: "deny"`,
  `websearch: "deny"`.

This gives a TECHNICAL (not prompt-only) command/edit/network enforcement
mechanism → command and network enforcement are implementable fail-closed.
No approximation was needed; the STOP path was not required.

## Hardening implemented

1. **Hard wall-clock timebox** (`run-local-dev-executor-v1.mjs`): the
   OpenCode child is raced against `timebox_seconds`; on expiry the runner
   rejects with `code=BOUNDS_TIMEBOX_EXPIRED, terminated=true`, no
   unbounded child promise is awaited, executor classifies
   `STOP:BOUNDS_TIMEBOX_EXPIRED`.
2. **Post-execution path enforcement** (`local-dev-executor-v1.mjs`): after
   OpenCode returns and BEFORE tests/staging/push, tracked changed paths
   are re-inspected (`git status --porcelain=v1 --untracked-files=no`);
   any tracked change outside `allowed_paths` →
   `STOP:UNEXPECTED_FILE_CHANGES` with `PATH:<p>` reason codes; nothing is
   staged or pushed. Pre-existing untracked files remain tolerated.
3. **Command enforcement**: `buildPermissionOverlay` generates a V1
   deny-all-first `bash` map — only `allowed_commands` entries are
   `allow`; everything else is `deny` (last-match-wins, deny wildcard
   first). Delivered via the runtime config written to the temp
   `OPENCODE_CONFIG` (verified accepted by the installed CLI).
4. **Network policy enforcement**: `webfetch: "deny"` and
   `websearch: "deny"` are set unconditionally — fail-closed under both
   `offline` and `localhost_only`. The only network path available to the
   model is the DEV guard on `127.0.0.1` (model traffic), per contract.
   The overlay records the declared policy informationally.
5. **Edit scoping**: `edit` map denies `*` and allows exactly
   `allowed_paths` (both `dir/**` and `dir/*` forms).

## Offline tests

Wiring suite extended 15 → **23/23 PASS**
(`tests/local-dev-executor-live-runner-v1/run.mjs`), covering all required
proofs: hard timeout bounds the child; timeout →
`STOP:BOUNDS_TIMEBOX_EXPIRED`; out-of-scope tracked change →
`STOP:UNEXPECTED_FILE_CHANGES` with NO tests/staging/push after; disallowed
command denied / allowed command allowed (ordered deny-first); network
policy fail-closed under both modes; runtime config merge; real installed
CLI accepts the generated config (schema-acceptance probe, no run, no
model); production domain untouched (source-level). Executor suite
regression: **20/20 PASS**.

Test budget: run 1 (20/23 — two stale fake-git fixtures missing the new
status key; one Windows `.cmd` spawn needing `shell:true`) → one bounded
correction (+ explicit `process.exit` because the shell-spawned probe
child kept the event loop alive) → final retest 23/23 + 20/20.

## Invariants

- Real Qwen generations: **0** · OpenCode runs: **0** (debug/config probes
  only, no model) · services started/stopped: **0**
- WF40 / D-0025 / scope-v3 / production authorization / production adapter /
  eligible set / role mappings / Cline: unchanged
- All pre-existing untracked files preserved; only task files staged

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF` (NOT executed in
this pass)
