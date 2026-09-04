# V4 LOCAL_DEV_EXECUTOR — workstation session bridge V1

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_WORKSTATION_SESSION_BRIDGE_V1`
**Classification:** `LOCAL_DEV_WORKSTATION_SESSION_BRIDGE_WIRED`
**Dispatch base head:** `107dc337f3e778bf90c9cf54876209e2f62cba8a`
**Date:** 2026-09-04
**Contract:** `docs/contracts/local-dev-executor-v1.md`

## Live blocker fixed

First bounded live-proof attempt observed:

```text
STOP:QWEN_SESSION_NOT_READY · INVALID_RUNTIME_CONFIG · turns_used=0 · launch_performed=false
```

Root cause: the DEV executor routed its workstation-only profile through
the production session path, which validates the ENTIRE production runtime
document (`validateRuntimeDocument`) and resolves profiles through the
six-profile `getProfile`. The pre-existing production role-map drift
(config `role_to_profile_id.FAST_AGENT` → DCFR-24k vs module constant →
OPUS-24k) made that document-level validation fail — and correctly so for
the production domain, but it must never gate LOCAL_DEV.

## Bridge implemented (smallest additive shape)

`tools/qwen-local-session-manager-v1.mjs` gains two ADDITIVE exports; the
production path is byte-unchanged:

- `resolveWorkstationDevProfile(runtime, profileId)` — resolves ONLY
  `runtime.workstation_manual_profiles[profile_id]`; strict rules:
  `category === "workstation_dev_executor_profile"`,
  `control_plane_eligible !== true`, `auto_route !== true`, else
  `DEV_PROFILE_INVALID` (+reason codes `CATEGORY_MISMATCH` /
  `PRODUCTION_FLAGS_PRESENT` / `PROFILE_UNKNOWN`). Model id =
  explicit `llama_cpp_model_id` else exact `profile_id`.
- `ensureWorkstationDevQwenReady(options)` — reuses the SAME safe
  lifecycle primitives (readiness via `/v1/models`, reuse healthy router,
  operator launcher at most once, bounded poll, `launch_performed`
  semantics, no reconstructed flags, no kill/restart) but performs NO
  production document/role-map validation. Endpoint =
  `runtime.launcher.base_url` else `http://127.0.0.1:8080`. Dedicated
  in-process dedupe lock (`__resetDevSessionManagerLockForTests`).

`tools/run-local-dev-executor-v1.mjs`: `makeEnsureQwenReady` now defaults
to `ensureWorkstationDevQwenReady` (DEV bridge); the production
`ensureQwenLocalReady` import is removed from the runner.

## Offline tests

`tests/local-dev-executor-workstation-session-bridge-v1/run.mjs` —
**14/14 PASS** covering all required proofs: DEV profile resolves;
production profile rejected; wrong/missing category and production flags
rejected; healthy router reuse (launch_performed=false, zero launches);
absent router → launcher exactly once → `LAUNCH_STARTED_AND_READY`;
readiness timeout fail-closed; launcher failure fail-closed; the
production role-map drift does NOT block DEV resolution; production
session-manager behavior unchanged (drifted doc → INVALID_RUNTIME_CONFIG,
aligned doc → READY); `makeEnsureQwenReady` wired to the bridge; zero
Qwen generations / zero OpenCode runs / zero service start/stop in tests.

Regressions: executor suite **20/20** · wiring/enforcement suite **23/23**.
Budget: run 1 (11/14 — three test-fixture defects: closure-shared call
log, an assertion that wrongly expected the drifted real config to pass
production validation, and a meta-test self-match) → one bounded
correction → final retest all green.

## Production invariants

- `PROFILE_IDS`, `runtime.profiles`, `role_to_profile_id`, eligible set:
  unchanged; cline-64k stays only in `workstation_manual_profiles`
- `validateRuntimeDocument()` / `validateProfilePolicy()`: untouched
- WF40 / D-0025 / scope-v3 / production authorization / production
  adapter: untouched
- Pre-existing FAST_AGENT config/module drift intentionally NOT fixed in
  this pass (production-domain follow-up)
- Real Qwen generations: **0** · OpenCode runs: **0** · services
  started/stopped: **0**

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY1` (NOT
executed in this pass)
