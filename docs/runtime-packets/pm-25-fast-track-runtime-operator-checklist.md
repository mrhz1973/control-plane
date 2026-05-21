# PM-25 — Fast-track runtime operator checklist

**Status:** **PREPARED / NOT EXECUTED** — one-window operator runbook.

**Related:** [pm-22](pm-22-promote-42-to-40-bridge-gate.md) · [pm-23](pm-23-post-promotion-smoke-gate.md) · [pm-24](pm-24-rollback-recovery-gate.md) · [batch session](../sessions/2026-05-22-control-plane-pm22-pm25-promotion-readiness-batch.md)

---

## Rules

| Rule | Detail |
|------|--------|
| **One window** | PM-22 → PM-23 in same session; PM-24 only if PM-23 fails |
| **One smoke** | One plan commit + one poll/trigger — no repeat unless gathering failure evidence |
| **No Codex** | Real worker **off** |
| **No provider API** | **Off** |
| **C1** | Stays **PARTIAL** |
| **GIS / DEV / Alina** | **Out of scope** |

---

## A — Preflight

- [ ] `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` — **ON**
- [ ] `42 - CP v4 multirepo + classifier bridge - CANDIDATE OFF` — **OFF**
- [ ] `01` / `20` / `30` — **OFF**
- [ ] Telegram + GitHub credentials **green** on `42` (pre-promotion) and `40`
- [ ] Telegram channel **quiet** (no stuck spam)

---

## B — PM-22 promotion

- [ ] Turn old **`40` OFF**
- [ ] Rename old **`40`** → `41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF`
- [ ] Rename **`42`** → `40 - CP v4 multirepo + classifier bridge - ACTIVE`
- [ ] Activate **only** new **`40`**
- [ ] Verify **`41` OFF**, **`01`/`20`/`30` OFF**, **one** active workflow

Packet: [pm-22-promote-42-to-40-bridge-gate.md](pm-22-promote-42-to-40-bridge-gate.md)

---

## C — PM-23 smoke

- [ ] Push one new `docs/plans/*.plan.md` commit
- [ ] One poll or one Manual Trigger
- [ ] Telegram: commit notify + `plan_detected` + Gate D file + **PM-21 bridge decision**
- [ ] Bridge: low / cursor-control-plane / no approval / mock-worker / no Codex

Packet: [pm-23-post-promotion-smoke-gate.md](pm-23-post-promotion-smoke-gate.md)

---

## D — If PM-23 fails → PM-24 rollback

- [ ] New **`40` OFF**
- [ ] Rename failed **`40`** → `42 - CP v4 multirepo + classifier bridge - FAILED OFF`
- [ ] Rename **`41`** → restored `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE`
- [ ] Activate restored **`40`**
- [ ] Commit failure session on GitHub

Packet: [pm-24-rollback-recovery-gate.md](pm-24-rollback-recovery-gate.md)

---

## E — If PM-23 passes

- [ ] Record PASS session on GitHub (post-promotion smoke)
- [ ] Leave **`41` BACKUP OFF** for rollback option
- [ ] **Do not** claim promotion closure until docs updated
- [ ] Optional later: re-export runtime snapshot of new `40`

---

## Explicit non-goals

- No real Codex worker
- No provider API keys
- No C1 strict PASS relabel
- No GIS / DEV / Alina changes
