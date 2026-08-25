# n8n workflow naming method

**Role:** durable **naming METHOD** for CONTROL PLANE n8n workflows.
**Runtime authority:** **NONE**.
**Inventory authority:** **NONE**.

Live active / published / schedule state → `docs/runtime/CURRENT_FRONTIER.md` only.
Export / import / asset policy → `workflows/README.md`.

---

## 1. Citation rule

When citing an n8n workflow, always use:

```text
numeric ID + display name
```

Example shape: `40` + the UI display name. Do not cite by nickname alone.

## 2. Durable naming conventions

| Rule | Detail |
|---|---|
| **Numeric prefix** | Prefer numeric ID prefixes in UI names. Avoid letter-only suffixes such as `02F` in **new** runtime names. |
| **Unique numeric ID** | Do not create multiple visible workflows that share the same numeric ID. |
| **Display status suffix** | Optional suffixes in the **display name** only (`- ACTIVE`, `- OFF`, `- LEGACY OFF`, `- CANDIDATE`, `- TEST ONLY`, `- TEST SAFE`) — these are naming aids, **not** LIVE STATE. |
| **Test / candidate ranges** | Keep test-only / candidate / preview paths clearly labeled in the display name; they stay inactive or callable-not-scheduled unless a separate gate says otherwise. |
| **Backup / retained-off labels** | If a workflow is retained off as rollback/legacy, say so in the display name; deletion of retained-off assets still needs an explicit gate. |
| **Credentials in candidates** | New candidate JSON may reference existing n8n credential **names** where safe; bind real secrets only in n8n UI. |
| **Private values** | Do not commit private runtime values; use clear placeholders when structure requires a field. |
| **Export filenames** | Historical `*.redacted.json` (or dated) names may remain; filename ≠ live inventory. |

## 3. What this file must not do

- No live workflow inventory list.
- No Active/Published status table as authority.
- No dated production snapshot as authority.
- No PM-34 / `n8n_ready` / gate claims (those live in the frontier).

## 4. History

Pre-L3A.5 registry snapshots and dated inventories: Git history.
Pre-cleanup baseline: `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`.
