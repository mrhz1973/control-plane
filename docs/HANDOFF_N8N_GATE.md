# HANDOFF_N8N_GATE — historical evidence pointer

**Status:** `HISTORICAL_EVIDENCE_POINTER`
**Runtime authority:** **NONE**.
**Current handoff authority:** **NONE**.

## Current owners

| Need | Owner |
|---|---|
| Handoff protocol (seed/pointer) | `docs/foundation/HANDOFF_TEMPLATE.md` |
| Workflow asset / export / import policy | `workflows/README.md` |
| Recovery / import / n8n 2.x Execute Command prerequisite | `docs/N8N_REBUILD.md` |
| LIVE STATE / gates | `docs/runtime/CURRENT_FRONTIER.md` |

## What this file used to be

Historical MVP-era design and evidence for handoff generation via n8n (criterion/gate chronology, dated PASS narratives, UI diagnosis notes).

Useful technical rules that remain current were migrated during L3A:

- import starts **inactive** unless explicitly authorized → `workflows/README.md` + `docs/N8N_REBUILD.md`
- n8n 2.x Execute Command may be disabled when `NODES_EXCLUDE` is unset/misconfigured → `docs/N8N_REBUILD.md` + `workflows/README.md`

## Historical recovery

Full prior content and criterion/gate evidence: Git history / sessions.
Pre-cleanup baseline: `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`.

Do not use this path as LIVE STATE, bootstrap, or current handoff instructions.
