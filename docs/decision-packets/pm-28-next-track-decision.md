# Decision packet — PM-28: next track after promotion PASS

**Packet ID:** `pm-28-next-track-decision`  
**Date:** 2026-05-22  
**Status:** **OPEN / DECISION NOT TAKEN**

**Related:** [PM-26 stabilization](../PM26_POST_PROMOTION_STABILIZATION.md) · [pm-27 backup gate](../runtime-packets/pm-27-backup-41-retention-cleanup-gate.md) · [PM-22/23 PASS](../sessions/2026-05-22-control-plane-pm22-pm23-promotion-smoke-pass.md)

---

## Decision

Choose the **next workstream** after PM-22 promotion PASS and PM-23 smoke PASS.

**No action** is taken by this document.

**Decision owner:** user.

---

## Options

### A — Stabilize / stop

- No new runtime gates
- Monitor Telegram for real anomalies only
- No new proof commits unless production fails

### B — Post-promotion snapshot

- Export **redacted** JSON of new production **`40`**
- Useful git record; **not** blocking (PM-16 style)
- Does not replace live n8n state

### C — Codex CLI setup

- Unblocks **PM-18** feasibility follow-up
- Requires local install/config; CLI was not in PATH
- Does **not** enable automatic Codex worker by itself

### D — n8n bridge hardening

- Improve dedupe / format / plan path handling
- Requires **separate** runtime gate; do not mix with promotion window

---

## Recommendation (default — not binding)

| Priority | Track |
|----------|--------|
| **Default** | **A** for some hours/days — let production **`40`** run quietly |
| **If freezing state now** | **B** — optional snapshot |
| **Avoid** | **C** and **D** in the **same** runtime window |

---

## Constraints (all options)

- **C1** stays **PARTIAL**
- **PM-18** stays **PENDING** until CLI proven
- Keep **`41` BACKUP OFF** until PM-27 cleanup gate
- No GIS / DEV / Alina

---

## Outcome field (fill when decided)

| Field | Value |
|-------|--------|
| **Chosen option** | _pending_ |
| **Date** | _pending_ |
| **Session** | _pending_ |
