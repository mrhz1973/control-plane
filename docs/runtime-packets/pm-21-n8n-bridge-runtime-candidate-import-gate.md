# Runtime packet — PM-21: n8n bridge runtime candidate import

**Packet ID:** `pm-21-n8n-bridge-runtime-candidate-import-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM21 overview](../PM21_N8N_BRIDGE_RUNTIME_CANDIDATE.md) · [PM20](../PM20_N8N_BRIDGE_PACKET.md) · [READY_IMPORT_42](../../workflows/exports/READY_IMPORT_42-classifier-bridge-candidate.json)

---

## Candidate file

```text
workflows/exports/READY_IMPORT_42-classifier-bridge-candidate.json
```

**Import name:** `42 - CP v4 multirepo + classifier bridge - CANDIDATE OFF`

---

## Preconditions

| Gate | State |
|------|--------|
| **PM-15** | **PASS** |
| **PM-17 / PM-19 / PM-20** | **PASS / PREPARED** |
| **PM-18** | **PENDING** allowed (mock worker) |
| **Production `40`** | **Published** — must stay active |

---

## Future runtime steps (one gate)

| # | Step |
|---|------|
| 1 | n8n UI → Import `READY_IMPORT_42-classifier-bridge-candidate.json` |
| 2 | Verify **`42` inactive** |
| 3 | Verify **`40` still active** |
| 4 | **Manual Trigger** on `42` once **or** push test plan → poll |
| 5 | Telegram: **PM-21 bridge decision** message received |
| 6 | Confirm **no** Codex / provider API execution |
| 7 | Leave **`42` inactive** after test |

---

## STOP conditions

| Condition | Action |
|-----------|--------|
| **`40` modified** without explicit gate | Stop |
| **`42` activated** unintentionally | Deactivate |
| **Codex** invoked | Stop |
| **Provider API** used | Stop |
| **Credentials red** in UI | Re-bind; do not commit secrets |
| **Telegram spam** (duplicate PM21 per SHA) | Stop |
| **GIS / DEV / ALINA** touched | Stop |

---

## PASS criteria

| # | Criterion |
|---|-----------|
| 1 | **`42` imports** with green Telegram/GitHub credentials |
| 2 | **One** test produces PM-21 bridge summary Telegram |
| 3 | **No** real worker invoked |
| 4 | **`40` remains stable** (same behavior as before import) |

---

## Next gate after PASS

Promotion **`42` → `40`** or successor workflow — **separate explicit packet only**.
