# Runtime packet — PM-23: post-promotion smoke gate

**Packet ID:** `pm-23-post-promotion-smoke-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [pm-22 promotion](pm-22-promote-42-to-40-bridge-gate.md) · [pm-24 rollback](pm-24-rollback-recovery-gate.md) · [PM-21C PASS](../sessions/2026-05-22-control-plane-pm21c-bridge-runtime-pass.md) · [PLAN_WATCHER_GATE_C.md](../PLAN_WATCHER_GATE_C.md)

---

## Purpose

Smoke test **after** PM-22 promotion — new production

```text
40 - CP v4 multirepo + classifier bridge - ACTIVE
```

---

## Test plan

| Step | Action |
|------|--------|
| 1 | Commit one new `docs/plans/*.plan.md` to `mrhz1973/control-plane` |
| 2 | Wait **one** scheduled poll (~1–5 min) **or** one Manual Trigger (operator choice — **one** only) |
| 3 | Observe Telegram |

### Expected Telegram (single commit, no spam)

| # | Message |
|---|---------|
| 1 | Scheduled poll commit notification |
| 2 | `plan_detected` |
| 3 | Gate D plan file attachment |
| 4 | **CONTROL PLANE PM-21 bridge decision** |

### Expected bridge fields

| Field | Value |
|-------|--------|
| **risk** | `low` |
| **route** | `cursor-control-plane` |
| **approval_required** | `no` |
| **bridge result** | `dry_run_pass` / `dryrunpass` |
| **worker** | `mock-worker` |
| **Codex** | **not** executed |
| **real worker** | **not** invoked |

---

## PASS criteria

| # | Criterion |
|---|-----------|
| 1 | New **`40`** sends all four message types **once** |
| 2 | **No** duplicate spam for same SHA |
| 3 | **`41` BACKUP OFF** remains inactive |
| 4 | **`01` / `20` / `30` OFF** |
| 5 | **No** `.first()` Code error on PM-21 nodes |
| 6 | **No** real worker / Codex / provider API |

---

## STOP criteria

| Condition | Action |
|-----------|--------|
| **No** PM-21 bridge decision | Stop → PM-24 rollback |
| **`.first()`** error returns | Stop → PM-24 rollback |
| Duplicate Telegram spam | Stop → PM-24 rollback |
| Credentials **red** | Stop → PM-24 rollback |
| **`40` not active** | Stop |
| **`41` active** | Stop |
| Provider API / **Codex** invoked | Stop |

---

## Not executed

This packet does **not** run smoke — prepare only.
