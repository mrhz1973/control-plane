# Runtime packet — PM-24: rollback / recovery gate

**Packet ID:** `pm-24-rollback-recovery-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [pm-22 promotion](pm-22-promote-42-to-40-bridge-gate.md) · [pm-23 smoke](pm-23-post-promotion-smoke-gate.md) · [pm-25 checklist](pm-25-fast-track-runtime-operator-checklist.md) · [READY_IMPORT_40](../../workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json)

---

## Purpose

Recover production if promoted new **`40`** fails PM-23 smoke.

---

## Rollback sequence (n8n UI)

| Step | Action |
|------|--------|
| 1 | Turn **new `40` OFF** |
| 2 | Rename failed new **`40`** → `42 - CP v4 multirepo + classifier bridge - FAILED OFF` |
| 3 | Rename **`41` backup** → `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` |
| 4 | Activate **restored `40`** only |
| 5 | Verify **exactly one** active workflow |
| 6 | Record failure session on GitHub |

---

## Recovery sources

| Priority | Source |
|----------|--------|
| 1 | **`41` backup** workflow in n8n (preferred) |
| 2 | `workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json` — **only if** backup `41` missing/broken |

**Do not** delete failed candidate before evidence is recorded.

---

## STOP conditions

| Condition | Action |
|-----------|--------|
| Deleting **`41`** backup | **Forbidden** |
| Deleting failed workflow before session log | **Forbidden** |
| Two workflows **active** after rollback | Fix immediately |
| Token/credential edits in git | **Forbidden** |
| Provider API / Codex / GIS / DEV / Alina | **Forbidden** |

---

## PASS criteria (rollback complete)

| # | Criterion |
|---|-----------|
| 1 | Original-style **`40`** **ACTIVE** and polling |
| 2 | Failed candidate renamed **`42 … FAILED OFF`** — inactive |
| 3 | **One** active CONTROL PLANE workflow |
| 4 | Failure session committed |

---

## Not executed

Rollback is **not** run in this packet.
