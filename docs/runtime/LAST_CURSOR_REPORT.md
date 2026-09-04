# LAST CURSOR REPORT

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_TIMEOUT_ARBITRATION_AND_OPENCODE_PREGEN_BOUNDARY_DIAGNOSTIC_V1`
**Classification:** `TIMEOUT_ARBITRATION_FIXED — OPENCODE_PREGEN_BOUNDARY=OPENCODE_PRE_PROVIDER_INIT_STALL`
**Timestamp (local):** 2026-09-05

## Summary

RETRY5 already executed (NOT re-run): reported
`STOP:OPENCODE_RUN_FAILED` at ~92 s, exit 1, empty excerpts, zero guard
traffic. Code inspection proved a deterministic arbitration race: the
    10|timeout callback awaited `terminate()` before rejecting, so the
kill-induced child resolution (status 1) could win `Promise.race` and
reclassify the timeout as `OPENCODE_RUN_FAILED`.

Fixed (regression-proven, ms-scale deterministic tests):

1. **Arbitration** — `timedOut` flag flips synchronously at timer fire; the
   child outcome is gated (suspended) once the timeout fires, so
   `BOUNDS_TIMEBOX_EXPIRED` always wins and carries full termination
   diagnostics + sanitized output excerpts. Timer cleared on every path.
   20|2. **Output capture** — `defaultSpawn` stdout/stderr hoisted to the
   handle scope; `getOutput()` valid across the whole lifecycle (the old
   executor-scope closure was a latent `ReferenceError` on every timeout).
3. **Probe no-shell** — the Windows probe resolves the real `opencode.exe`
   via the shared helper `tools/opencode-binary-resolution-v1.mjs`
   (single source of truth, re-exported by the live runner); shell never
   enabled; DEP0190 eliminated from probe AND test harness paths.

RETRY5 log reconciliation (read-only, sanitized): OpenCode was ALIVE at
+60 s (own cleanup timer fired) and stalled **post-`init`,
    30|pre-session-creation** — before model/provider/HTTP stages; zero guard
traffic consistent. Healthy production run (Aug 31, same CLI/workstation)
reached `stream providerID=qwen_local` using `stdio: ["ignore","pipe","pipe"]`
+ full `OPENCODE_DISABLE_*` suite. Fourth authorized correction: the DEV
runner now mirrors that ratified invocation shape (stdin ignored, network
plugin fetches/autoupdate disabled during the bounded run).

`OPENCODE_PREGEN_BOUNDARY=OPENCODE_PRE_PROVIDER_INIT_STALL`.
Fake OpenCode runs = 0 (logs conclusive). REAL_QWEN_GENERATIONS = 0.

Tests: process/wiring **38/38**, executor **20/20**, bridge **14/14**.

## NEXT

 40|
`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY6_DIAGNOSTIC`

Evidence report:
`reports/architecture/v4_local_dev_executor_timeout_arbitration_and_opencode_pregeneration_boundary_diagnostic_v1.md`
