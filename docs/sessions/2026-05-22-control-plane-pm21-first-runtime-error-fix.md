# PM-21 — Code node `.first()` runtime error fix

**Date:** 2026-05-22  
**Status:** Bundle **fixed** — runtime **PASS not claimed**

## Failure observed (n8n)

| Field | Value |
|-------|--------|
| **Workflow** | `42 - CP v4 multirepo + classifier bridge - CANDIDATE OFF` |
| **Node** | `Code - PM21 classifier decision` |
| **Error** | `Can't use .first() here [line 1, for item 0]` |

## Root cause

PM-21 Code nodes use `runOnceForEachItem` mode. In that mode n8n does **not** allow `$input.first()` — use **`$json`** for the current item.

Bridge/format nodes referenced `$('Code - PM21 classifier decision').first()` — invalid in the same pattern.

## Fix (git)

| Change | Detail |
|--------|--------|
| **Classifier** | `const j = $json` → single `return { json: { ... } }` |
| **Bridge** | `const c = $json` → propagate `classifier: c` on result |
| **Format** | `const bridge = $json; const c = bridge.classifier` |
| **Regenerated** | `workflows/exports/READY_IMPORT_42-classifier-bridge-candidate.json` |

## Posture

| Item | State |
|------|--------|
| **Production `40`** | **Not modified** (repo or n8n by Cursor) |
| **n8n** | **Not modified** by Cursor — reimport fixed bundle in UI |
| **PM-21 runtime PASS** | **Not claimed** |

## Next

1. Delete or overwrite candidate **`42`** in n8n UI.
2. Re-import `READY_IMPORT_42-classifier-bridge-candidate.json`.
3. Keep **`42` inactive** (or isolated test with **`40` OFF**).
4. One smoke — expect **CONTROL PLANE PM-21 bridge decision** Telegram.
