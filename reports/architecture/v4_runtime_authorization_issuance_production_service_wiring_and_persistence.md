# V4 Runtime Authorization Issuance — Production Service Wiring and Persistence

**Block:** `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PRODUCTION_SERVICE_WIRING_AND_PERSISTENCE` (+ `_BUGBOT_CORRECTION`)
**Result:** PASS
**Category:** ROUTINE_CORRECTIVE_RUNTIME
**dispatch_base_head (STOP):** `41e24f278a694b87acc560987e0c359704d09651`
**Prior STOP artifact:** `reports/runtime/cursor-stops/2026-08-31T193000Z__V4_RUNTIME_AUTHORIZATION_ISSUANCE_PRODUCTION_SERVICE_WIRING_AND_PERSISTENCE.stop.json`

## Summary

Corrected the BugBot race (registerPendingAuthorization vs Telegram decision poller vs reconcileApprovedPending) with a per-process single-writer async mutation lane, then persisted the issuance service on `127.0.0.1:18792` with private Tailscale routes. Zero Telegram decision messages. Zero pending / ACTIVE / spends. Live execution remains CLOSED. Ready for first live approval (NEXT block).

## BugBot race finding (previous STOP)

`registerPendingAuthorization` loaded the pending store, awaited `sendDecisionMessage`, then persisted a stale PENDING snapshot. During the await, `handleTelegramDecisionUpdate` could reach ISSUED/REJECTED (and ACTIVE in the registry); the subsequent register write could overwrite that terminal state and erase the decision receipt / `telegram_update_id`.

## Single-writer fix

- Primitive: `createPendingStoreMutationMutex()` with FIFO `runExclusive(asyncFn)` — exception-safe unlock, no cross-process lock in v1.
- Shared by:
  - `registerPendingAuthorization` (holds lane across load → send Telegram → persist PENDING)
  - `handleTelegramDecisionUpdate` (acquires lane, reloads CURRENT store, then mutates)
  - `reconcileApprovedPending` (same lane; exact pre-bound reconciliation preserved)
- `getPendingAuthorizationStatus` remains read-only (no writer lock; no EXPIRED materialization on disk in this pass).
- Production service (`tools/serve-v4-runtime-authorization-issuance-v1.mjs`) creates **one** mutation lane per process and passes it to HTTP register + Telegram poller. Tests inject a deterministic mutex.

## Race regression tests

| # | Case | Result |
|---|---|---|
| 58 | register/APPROVE race: callback blocked until register releases; final ISSUED + ACTIVE; receipt + update_id present | PASS |
| 59 | register/REJECT race: final REJECTED; no PENDING clobber; registry empty | PASS |
| 60 | concurrent reconcile + register serialized; no lost update | PASS |

## Test totals (once each)

| Suite | Result |
|---|---|
| `tests/v4-runtime-authorization-issuance/run.mjs` | **60/60 PASS** (≥57 + race regressions) |
| `tests/v4-windows-local-execution-endpoint/run.mjs` | **61/61 PASS** |
| `tests/v4-runtime-authorization-durable-spend-ledger/run.mjs` | **13/13 PASS** |

## Regressions (once)

| Suite | Result |
|---|---|
| opencode-execution-adapter | 23/23 PASS |
| opencode-single-generation-guard | 16/16 PASS |
| v4-local-runtime-readonly-contribution | 29/29 PASS |
| v4-local-runtime-readonly-private-endpoint | 22/22 PASS |
| `git diff --check` | PASS |

## BugBot (once, no Autofix)

**PASS_NO_FINDINGS** — proceeded same-pass to production apply.

## Production apply (secret-safe)

| Step | Result |
|---|---|
| A. Issuance config validator | VALID (token/chat/user present; values not printed) |
| A. Pending store | schema valid · `decisions=[]` |
| A. Registry | `entries=[]` |
| A. Spend ledger | `spends=[]` |
| B. Port 18792 | free before start |
| C. Scheduled Task `ControlPlane-V4-RuntimeAuthorizationIssuance` | created · AtLogOn · InteractiveToken · node + serve script + `--issuance-config` absolute path · **no token on cmdline** |
| C. Listener | exactly one `127.0.0.1:18792` |
| C. Direct Telegram poller | active (service start path; process running) |
| D. Telegram health | getMe ok · getUpdates ok · **decision messages = 0** |
| E. Tailscale private routes | `/v4/authorization/register-pending` → `18792/...` · `/v4/authorization/status` → `18792/...` · preserved `/`→18789 · `/v4/resource-status/local-readonly`→18790 · `/v4/execution/opencode-local`→18791 · **tailnet only / no Funnel** |
| F. Local smoke POST status (nonexistent id) | HTTP 200 · `ISSUANCE_PENDING_NOT_FOUND` · no state mutation |
| G. VPS Tailscale smoke (nonexistent id) | HTTP 200 · `ISSUANCE_PENDING_NOT_FOUND` · path VPS → Tailscale private → Windows 18792 |

## Final invariants

| Invariant | Value |
|---|---|
| pending decisions | 0 |
| registry entries | 0 |
| ledger spends | 0 |
| Telegram decision messages | 0 |
| ACTIVE authorization | 0 |
| WF40 / WF61 executions | 0 |
| execution endpoint HTTP | 0 |
| OpenCode / Qwen / provider | 0 |
| Live execution | CLOSED |
| Issuance service | PERSISTED + READY |

## PASS STATE

```text
ISSUANCE_PRODUCTION_SERVICE_PERSISTED
PENDING_STORE_SINGLE_WRITER_PROTECTED
DIRECT_TELEGRAM_POLLER_ACTIVE
ISSUANCE_PRIVATE_ROUTE_ACTIVE
PENDING_STORE_EMPTY
PRODUCTION_REGISTRY_EMPTY
PRODUCTION_LEDGER_EMPTY
READY_FOR_FIRST_LIVE_APPROVAL
LIVE_EXECUTION_CLOSED
```

## NEXT

`V4_RUNTIME_AUTHORIZATION_FIRST_LIVE_APPROVAL_AND_EXECUTION_PROOF`
