# PM-22 promotion + PM-23 post-promotion smoke PASS

**Date:** 2026-05-22  
**Status:** **PASS** — promotion executed manually in n8n; smoke verified on GitHub + Telegram

**Related:** [pm-22 packet](../runtime-packets/pm-22-promote-42-to-40-bridge-gate.md) · [pm-23 packet](../runtime-packets/pm-23-post-promotion-smoke-gate.md) · [pm-25 checklist](../runtime-packets/pm-25-fast-track-runtime-operator-checklist.md) · [readiness batch](2026-05-22-control-plane-pm22-pm25-promotion-readiness-batch.md)

---

## PM-22 promotion PASS

| Step | Result |
|------|--------|
| Old **`40`** renamed | `41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF` — **OFF** |
| Candidate **`42`** promoted | `40 - CP v4 multirepo + classifier bridge - ACTIVE` — **Published / ON** |
| **`42`** | No longer in use |
| **`01` / `20` / `30`** | **OFF** |
| Active workflows | **Exactly one** production **`40`** expected active |

---

## PM-23 smoke PASS

| Field | Value |
|-------|--------|
| **Trigger commit** | `bfa4710` — `test: trigger PM-23 post-promotion smoke` |
| **Plan** | `docs/plans/2026-05-22_pm23-post-promotion-smoke.plan.md` |
| **Observed** | 2026-05-22 **01:36** (Telegram) |

### Telegram evidence (four messages, no spam)

| # | Message | PASS |
|---|---------|------|
| 1 | Scheduled poll commit notification — `bfa4710` / prev `1729b0a` | ✓ |
| 2 | `plan_detected` — plan added +35/−0 | ✓ |
| 3 | Gate D plan file — same plan/commit | ✓ |
| 4 | PM-21 bridge decision | ✓ |

### Bridge fields

| Field | Value |
|-------|--------|
| **Risk** | `low` |
| **Route** | `cursor-control-plane` |
| **Approval required** | `no` |
| **Bridge result** | `dryrunpass` |
| **Worker** | `mock-worker` |
| **Action** | preview only — **no Codex execution** |

---

## Posture

| Item | State |
|------|--------|
| **PM-24 rollback** | **NOT NEEDED** |
| **Codex** | **Not** invoked |
| **Provider API** | **Not** used |
| **Real worker** | **Not** invoked |
| **GIS / DEV / Alina** | **Not** touched |
| **C1** | **PARTIAL** — unchanged |
| **PM-18** | **PENDING** |
| **`41` backup** | **OFF** — do not delete until explicit cleanup gate |

---

## Optional next

- Post-promotion runtime snapshot export (PM-16 style)
- PM-18 Codex CLI setup
- Stabilize / stop
