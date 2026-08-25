# Workflows — asset / export / import policy

**Role:** current owner for workflow template, export, and import policy.
**Runtime authority:** **NONE**. Live active/published/schedule state → `docs/runtime/CURRENT_FRONTIER.md`.

---

## 1. Where assets live

| Location | Use |
|---|---|
| `workflows/*.json` / `workflows/*.template.json` | templates / proposed wiring artifacts |
| `workflows/exports/` | committed export snapshots and candidates |
| this README | policy only — not an inventory of what is live |

Identify the concrete file from the authorizing task + frontier. Do not pick “current” solely by date or old status docs.

## 2. Naming (durable)

When citing n8n workflows, use **numeric ID + display name** (example: `40` + UI name).
Detailed historical registries may exist elsewhere; they are not LIVE STATE. Current IDs/states: frontier.

## 3. Security / commit posture

Canonical posture (source precedence: `PROJECT_VISION` §7.2 + `docs/ROTATION_CHECKLIST.md`):

- Repository is operated as **non-confidential** with **rotation** as compensating control (`ROTATION_CHECKLIST`).
- Do **not** treat docs or exports as a secret store of truth for live tokens.
- Prefer placeholders for secrets in committed JSON; bind real credentials in n8n UI.
- Do not commit gitignored raw dumps such as `*.unredacted.json`.
- Historical `*.redacted.json` filenames may remain; naming alone does not imply the file is the live workflow.

Older “mandatory full redaction before every commit” narratives yield to the current non-confidential + rotation policy above.

## 4. Categories

| Category | Meaning |
|---|---|
| **template** | structural starting point; import inactive |
| **proposed** | candidate for a future gated import; not live |
| **snapshot / export** | point-in-time evidence or recovery asset |
| **current live** | only what `CURRENT_FRONTIER` says is active/published |

## 5. Import rules

- Import starts **inactive** (and unpublished / schedule-off as applicable) unless an explicit authorization says otherwise.
- Relink credentials and environment-specific config in n8n UI after import.
- **n8n 2.x:** Execute Command may be disabled when `NODES_EXCLUDE` is unset or excludes it — fix host config before treating the workflow JSON as wrong (`docs/N8N_REBUILD.md`).
- GPT Web remains authoritative author of workflow artifacts; Cursor does not redesign topology silently (`PROJECT_VISION` §8).

## 6. Activation = separate gate

Publish, Schedule enable, trigger enable, production cut-over, or workflow delete each require a **separate** authorized gate (`PROJECT_VISION` §7.0).
Presence of an export in Git ≠ authorization to activate.

## 7. Recovery and history

- Recovery procedure: `docs/N8N_REBUILD.md`
- Telegram credential/setup method: `docs/TELEGRAM_SETUP.md`
- Export chronology and old inventories: Git history (baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`)
- Compatibility pointers (not current owners): `docs/WORKFLOW_EXPORT_STATUS.md`, `docs/HANDOFF_N8N_GATE.md`, `docs/RUNTIME_GATES.md`
