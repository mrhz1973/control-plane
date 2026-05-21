# PM-29 snapshot + PM-28 decision B then C

**Date:** 2026-05-22  
**Status:** Decision recorded · snapshot **PENDING** · PM-30 prepared only

## PM-28 decision

| Field | Value |
|-------|--------|
| **Chosen** | **B then C** |
| **Meaning** | First post-promotion snapshot (B); then Codex CLI setup (C) in a **separate** task |
| **Session** | This file |

## B — Post-promotion snapshot (PM-29)

| Attempt | Result |
|---------|--------|
| **Downloads** | No JSON with name `40 - CP v4 multirepo + classifier bridge - ACTIVE` |
| **n8n local** | `healthz` **200**; `/api/v1/workflows` not used — **`N8N_API_KEY` not set** |
| **PM-29 status** | **PENDING** — no invented snapshot; did not copy READY_IMPORT_40/42 |

Target when export available: `workflows/exports/2026-05-22_40-classifier-bridge-post-promotion.redacted.json`

## C — Codex CLI (PM-30)

| Item | State |
|------|--------|
| **Packet** | [pm-30-codex-cli-local-setup-gate.md](../runtime-packets/pm-30-codex-cli-local-setup-gate.md) |
| **Executed** | **No** — not installed, not run |

## Posture (unchanged)

| Item | State |
|------|--------|
| **Production `40`** | `40 - CP v4 multirepo + classifier bridge - ACTIVE` |
| **Backup `41`** | BACKUP OFF — **retained** |
| **n8n / workflows** | **Not touched** |
| **Extra smoke** | **None** |
| **Codex / provider API** | **Not used** |
| **C1** | **PARTIAL** |
| **PM-18** | **PENDING** |

## Next

**PM-30** Codex CLI local setup runtime gate (separate task).
