# Runtime packet — PM-27: backup `41` retention / cleanup gate

**Packet ID:** `pm-27-backup-41-retention-cleanup-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-26 stabilization](../PM26_POST_PROMOTION_STABILIZATION.md) · [pm-28 decision](../decision-packets/pm-28-next-track-decision.md) · [PM-22/23 PASS](../sessions/2026-05-22-control-plane-pm22-pm23-promotion-smoke-pass.md) · [READY_IMPORT_40](../../workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json)

---

## Purpose

Define **when** to keep or delete n8n backup

```text
41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF
```

after PM-22/23 PASS.

---

## Policy

| Rule | Detail |
|------|--------|
| **Retain** | Keep **`41` OFF** at least until an **explicit** PM-27 cleanup gate is authorized |
| **Same window** | Do **not** delete `41` in the same session as promotion (PM-22) |
| **Delete only when** | Observed stability on new **`40`** **or** a trusted post-promotion snapshot exists |
| **Recovery fallback** | If `41` is deleted, keep `workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json` as recovery source |

---

## STOP conditions

| Condition | Action |
|-----------|--------|
| Delete `41` without GitHub session | **Forbidden** |
| Delete `41` before `40` stability confirmed | **Forbidden** |
| Two workflows **active** after cleanup | Fix immediately |
| Token/credential edits in git | **Forbidden** |
| Codex / provider API | **Forbidden** |
| GIS / DEV / Alina | **Forbidden** |

---

## Future PASS criteria (cleanup executed)

| # | Criterion |
|---|-----------|
| 1 | User explicitly authorized cleanup |
| 2 | Session recorded on GitHub |
| 3 | **Exactly one** active CONTROL PLANE workflow (`40`) |
| 4 | `41` removed **or** archived with evidence |

---

## Not executed

This packet does **not** delete `41` — prepare only.
