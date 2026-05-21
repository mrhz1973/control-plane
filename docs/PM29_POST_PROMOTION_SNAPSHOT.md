# PM-29 — Post-promotion snapshot

**Date:** 2026-05-22  
**Status:** **PENDING**

**Related:** [PM-28 decision](decision-packets/pm-28-next-track-decision.md) · [session](sessions/2026-05-22-control-plane-pm29-snapshot-decision-b-then-c.md) · [PM-22/23 PASS](sessions/2026-05-22-control-plane-pm22-pm23-promotion-smoke-pass.md)

---

## Target artifact

| Field | Value |
|-------|--------|
| **Path** | `workflows/exports/2026-05-22_40-classifier-bridge-post-promotion.redacted.json` |
| **Workflow name** | `40 - CP v4 multirepo + classifier bridge - ACTIVE` |

---

## Why PENDING

| Source tried | Result |
|--------------|--------|
| **Downloads** | No matching n8n export |
| **n8n API** | Local n8n up; **`N8N_API_KEY` not available** in environment — export not fetched |

**Did not:** invent JSON · copy `READY_IMPORT_40` · copy `READY_IMPORT_42`

---

## Current production (valid without snapshot)

| Item | State |
|------|--------|
| **Production** | `40 - CP v4 multirepo + classifier bridge - ACTIVE` |
| **Evidence** | PM-22 PASS · PM-23 smoke `bfa4710` |
| **Backup `41`** | BACKUP OFF — retained |
| **Snapshot** | Useful but **non-blocking** |

---

## When export is available

1. Export from n8n UI or API (unredacted local only).
2. Redact per repo rules (no tokens, Bearer, bot URLs, runData, etc.).
3. Validate name + PM-21 nodes + credential names.
4. Commit redacted file; set PM-29 to **PASS**.

---

## Next

**PM-30** Codex CLI setup — can proceed per user choice; snapshot remains optional.

**No** runtime smoke · **no** Codex · **no** provider API in this gate.
