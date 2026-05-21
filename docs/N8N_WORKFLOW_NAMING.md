# n8n CONTROL PLANE workflow naming (numeric)

**Docs-only registry.** Records operational naming in n8n UI. **Not** a runtime change by itself.

**Related:** [MVP_STATUS.md](MVP_STATUS.md), [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [RUNTIME_GATES.md](RUNTIME_GATES.md).

**Last updated:** 2026-05-21 — candidate numbering clarified after user readability request.

---

## Rule

| Rule | Detail |
|------|--------|
| **Numeric prefix** | Use numeric prefixes only; avoid letter suffixes like `02F` in **new** runtime names |
| **Production ID** | `40` is the production CONTROL PLANE poll+handoff workflow name. Do **not** create multiple visible candidate workflows all named `40` |
| **Candidate IDs** | New candidate/import-test workflows should use the next readable number: `41`, `42`, `43`, … |
| **Backup IDs** | Backups may keep the production number plus a clear backup suffix only while needed, e.g. `40 - ... BACKUP BEFORE ... - OFF` |
| **Status suffix** | `- ACTIVE`, `- OFF`, `- LEGACY OFF`, `- CANDIDATE`, or `- TEST SAFE` in workflow **display name** where helpful |
| **Exports** | Committed `.redacted.json` may keep **historical** names until a deliberate export refresh; new exports should use the readable target name in the JSON `name` field |
| **JSON / raw URL** | When orchestrator delivers import JSON, prefer a unique readable runtime name, e.g. `41 - ... CANDIDATE`, not another `40 - ... CANDIDATE` |

---

## Current CONTROL PLANE list (runtime)

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **01** | `01 - CP v4 single-repo polling - LEGACY OFF` | **Off** |
| **20** | `20 - CP v5 push webhook - OFF` | **Off** |
| **30** | `30 - CP handoff manual Telegram v1 - OFF` | **Off** (formerly `03 - CP handoff manual Telegram v1`) |
| **40** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` | **Active/published** — sole CP poll+handoff (formerly **`02F`**) |
| **41** | Next production-candidate/import-test workflow | Reserved |
| **42** | Next production-candidate/import-test workflow | Reserved |
| **43** | Next production-candidate/import-test workflow | Reserved |
| **55** | PM-09 isolated/test-safe workflow family | Reserved/optional |

---

## Candidate numbering policy

Readable n8n UI matters. Avoid a workflow list with many entries starting with identical `40 - ...` names.

Use this pattern:

| Use case | Prefix |
|----------|--------|
| Current production polling workflow | `40` |
| First candidate replacing/extending `40` | `41` |
| Second candidate replacing/extending `40` | `42` |
| Third candidate replacing/extending `40` | `43` |
| Isolated PM-09 test-safe workflow | `55` |

When a candidate becomes production:

1. Rename old production `40` to a backup/off name.
2. Rename the selected candidate to `40 - ... - ACTIVE`.
3. Keep candidate/backups clearly off or delete/archive when no longer needed.

---

## Rename map (2026-05-21)

| Former (docs/export history) | Current (runtime) |
|-------------------------------|-------------------|
| `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` |
| `03 - CP handoff manual Telegram v1` | `30 - CP handoff manual Telegram v1 - OFF` |
| `01 - CP v4 single-repo polling - LEGACY OFF` | unchanged |
| `20` v5 webhook | `20 - CP v5 push webhook - OFF` (unchanged pattern) |

---

## Reserved: 55 (PM-09 isolated/test-safe)

| Item | Detail |
|------|--------|
| **Purpose** | PM-09 isolated/test-safe workflows only, not production replacement candidates |
| **Status** | Optional/test-safe family |
| **Target** | Production wiring still lands in `40` only after a candidate switch |

---

## Export hygiene

Committed exports under `workflows/exports/` may still show **`02F`** or older `40 ... CANDIDATE` names in JSON `name` / metadata. That is **historical** until the next export refresh.

Going forward, new candidate JSON exports should use `41`, `42`, `43`, … in the workflow `name` to reduce visual confusion in n8n.

See [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md).

---

## Explicit non-actions (this doc)

- Does not open n8n, import, export, Execute, or Telegram
- Does not modify `workflows/exports/**`
- Does not rename existing workflows by itself
