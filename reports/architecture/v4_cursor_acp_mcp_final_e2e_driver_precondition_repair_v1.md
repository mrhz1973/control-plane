# Cursor ACP MCP final E2E driver precondition repair V1

**TASK_REF:** `V4_CURSOR_ACP_MCP_FINAL_E2E_DRIVER_PRECONDITION_REPAIR_V1`
**Classification:** `PASS — FINAL DRIVER PRECONDITIONS QUALIFIED; NO TELEGRAM`
**Starting HEAD:** `371d94be15f855a54701e9163542094b0b0e1c02`
**Date:** 2026-09-13 (Europe/Rome)

## Repairs

- The final E2E driver now uses the same shared official Windows ACP launch
  specification as the wiring probe: `agent.ps1`, `powershell.exe`,
  `-NoProfile`, `-ExecutionPolicy Bypass`, `shell:false`, and piped stdio.
  Startup errors, premature child exits, and RPC timeouts reject fail-closed.
- Terminal cleanup delegates only the current gate decision to the existing
  canonical `deactivateCurrentKeyboard` transport primitive. It runs before
  issuance restore in the driver's `finally`; no gate is idempotently skipped,
  and a real deactivation failure becomes STOP while issuance restore still
  runs and is verified.

## Deterministic qualification

- Final-driver focused guards: **PASS** — official wrapper/no generic shell,
  start/exit/RPC failure handling, PASS/STOP/exception/timeout cleanup,
  stale isolation, idempotent no-gate cleanup, deactivation failure fail-closed,
  one-send budget, exact option consumption, and cross-run registry guard.
- Canonical ACP wiring probe: **PASS**.
- MCP gate suite: **32/32 PASS**.
- `PROCESS_LEAKS=0`; `REAL_TELEGRAM_SENDS=0`; `PRODUCTION_CHANGED=NO`.

`READY_FOR_FINAL_REAL_E2E=true`. This is a precondition repair only: no active
gate, Telegram callback, or final E2E was run.

## Next

`ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION`.
