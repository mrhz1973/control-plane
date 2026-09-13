# Cursor Agent runtime resource recovery and wiring requalification V1

**TASK_REF:** `V4_CURSOR_AGENT_RUNTIME_RESOURCE_RECOVERY_AND_WIRING_REQUALIFICATION_V1`
**Classification:** `PASS — ACP MCP WIRING REQUALIFIED; NO TELEGRAM`
**Starting HEAD:** `4b3f798a2b7bcd015c4034e25b7e50b26fbf3246`
**Date:** 2026-09-13 (Europe/Rome)

## Sanitized resource evidence

| Metric | Observed |
| --- | ---: |
| Physical RAM total / available | 32,682 MB / 15,310 MB |
| Commit current / limit | 40,625 MB / 67,498 MB |
| Pagefile configured / in use | 34,816 MB / 6,014 MB |
| Process / handle count | 378 / 195,008 |
| Stale project ACP/MCP/gate processes | 0 / 0 reaped |

The prior `uv_os_get_passwd ... ENOMEM` condition no longer reproduced after
operator resource relief. No user process, system setting, pagefile setting,
or vendor binary was changed by this task.

## Real ACP qualification

- Official Cursor Agent CLI startup/version: **PASS**.
- First real canonical ACP exchange: initialize **PASS**; `session/new`
  returned a session id; project stdio MCP configuration accepted **PASS**.
- Three consecutive real wiring probes: **PASS**. Each preserved a single
  ACP process/stdin-stdout identity, recorded only the session-id SHA, and
  observed zero agent-side `session/new` calls.
- Full MCP gate suite: **32/32 PASS**.
- Final-proof guard regressions: **PASS** (cleanup/finally, one-send budget,
  exact option consumption, cross-run active-keyboard registry).
- Process leaks: **0**. Real Telegram sends: **0**. Production changed: **NO**.

`READY_FOR_FINAL_REAL_E2E=true` is justified only by the recovered ACP wiring
and the already-passing final-proof guards. This task does not claim a Telegram
E2E, callback, or live same-session post-gate continuation.

## Next

`ONE_FINAL_REAL_TELEGRAM_E2E_AFTER_OPERATOR_DECISION`.
