# Runtime packet — PM-22: promote `42` → `40` (bridge)

**Packet ID:** `pm-22-promote-42-to-40-bridge-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-21C PASS](../sessions/2026-05-22-control-plane-pm21c-bridge-runtime-pass.md) · [pm-23 smoke](pm-23-post-promotion-smoke-gate.md) · [pm-24 rollback](pm-24-rollback-recovery-gate.md) · [pm-25 checklist](pm-25-fast-track-runtime-operator-checklist.md) · [N8N_WORKFLOW_NAMING.md](../N8N_WORKFLOW_NAMING.md)

---

## Goal

Promote tested candidate

```text
42 - CP v4 multirepo + classifier bridge - CANDIDATE OFF
```

to production role

```text
40 - CP v4 multirepo + classifier bridge - ACTIVE
```

while preserving rollback via renamed backup **`41`**.

**Not executed** in this packet — docs only.

---

## Preconditions

| Gate | State |
|------|--------|
| **PM-15** production smoke | **PASS** — `c0ea042`, exec `#6708` |
| **PM-21C** candidate smoke | **PASS** — `1f46c64`, PM-21 bridge Telegram |
| **Candidate `42`** | Imported; credentials **green**; **OFF** |
| **Production `40`** | **ON** — `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` |
| **`01` / `20` / `30`** | **OFF** |
| **PM-18** | **PENDING** allowed (mock worker only) |
| **v5 / webhook** | **Off** |

---

## Promotion sequence (n8n UI — one window)

| Step | Action |
|------|--------|
| 1 | Verify **`40` ON** and **`42` OFF** |
| 2 | Turn **`40` OFF** (schedule off) |
| 3 | Rename old **`40`** → `41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF` |
| 4 | Rename **`42`** → `40 - CP v4 multirepo + classifier bridge - ACTIVE` |
| 5 | Activate **only** new **`40`** |
| 6 | Verify **`41` OFF** |
| 7 | Verify **`01` / `20` / `30` OFF** |
| 8 | Verify **exactly one** active workflow in CONTROL PLANE list |

**No duplicate numeric IDs visible** after step 4 (one `40` ACTIVE, one `41` BACKUP OFF).

---

## STOP conditions

| Condition | Action |
|-----------|--------|
| Two workflows **active** | Stop; deactivate newer `40` |
| Duplicate **`40`** names before rename complete | Stop; finish rename sequence |
| **`42` activated** before step 4 | Deactivate `42`; restart |
| Old **`40` deleted** instead of renamed to **`41`** | Stop — backup required |
| Credentials **red** on new `40` | Stop; re-bind; rollback if needed |
| **Telegram spam** | Stop; rollback per PM-24 |
| **Codex** invoked | Stop |
| **Provider API** used | Stop |
| **GIS / DEV / ALINA** touched | Stop |

---

## PASS criteria (after PM-23)

Promotion accepted only when **PM-23** post-promotion smoke **PASS** — not on rename alone.

---

## Out of scope

- Executing promotion from Cursor
- Deleting **`41`** backup
- Relabeling **C1** strict PASS
- Codex / provider API runtime
