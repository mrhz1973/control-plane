# n8n CONTROL PLANE workflow naming (numeric)

**Docs-only registry.** Records operational naming in n8n UI. **Not** a runtime change by itself.

**Related:** [MVP_STATUS.md](MVP_STATUS.md), [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [RUNTIME_GATES.md](RUNTIME_GATES.md).

**Last updated:** 2026-05-21 — user manual rename in n8n UI (recorded in docs only).

---

## Rule

| Rule | Detail |
|------|--------|
| **Numeric prefix** | Use `01`, `20`, `30`, `40`, `55` — avoid letter suffixes like `02F` in **new** runtime names |
| **Status suffix** | `- ACTIVE`, `- OFF`, or `- LEGACY OFF` in workflow **display name** where helpful |
| **Exports** | Committed `.redacted.json` may keep **historical** names until a deliberate export refresh (PM-08 pattern) |
| **JSON / raw URL** | When orchestrator delivers import JSON, prefer **current runtime name** (`40`, `55`, …) in `name` field when possible |

---

## Current CONTROL PLANE list (runtime)

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **01** | `01 - CP v4 single-repo polling - LEGACY OFF` | **Off** |
| **20** | `20 - CP v5 push webhook - OFF` | **Off** |
| **30** | `30 - CP handoff manual Telegram v1 - OFF` | **Off** (formerly `03 - CP handoff manual Telegram v1`) |
| **40** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` | **Active/published** — sole CP poll+handoff (formerly **`02F`**) |
| **55** | *(reserved — PM-09 plan watcher)* | **Not created** |

---

## Rename map (2026-05-21)

| Former (docs/export history) | Current (runtime) |
|-------------------------------|-------------------|
| `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` |
| `03 - CP handoff manual Telegram v1` | `30 - CP handoff manual Telegram v1 - OFF` |
| `01 - CP v4 single-repo polling - LEGACY OFF` | unchanged |
| `20` v5 webhook | `20 - CP v5 push webhook - OFF` (unchanged pattern) |

---

## Reserved: 55 (PM-09)

| Item | Detail |
|------|--------|
| **Purpose** | Future PM-09 Gate C plan watcher branch or dedicated workflow |
| **Status** | **Reserved** — **not** created in rename session |
| **Target** | Extend **`40`** (architecture A) unless explicit fallback to separate workflow |

---

## Export hygiene (pending)

Committed exports under `workflows/exports/` may still show **`02F`** in JSON `name` / metadata. That is **historical** until:

1. Material runtime change warrants re-export (PM-08), and  
2. New export uses naming **`40`** (and later **`55`** if applicable).

See [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md).

---

## Explicit non-actions (this doc)

- Does not open n8n, import, export, Execute, or Telegram
- Does not modify `workflows/exports/**`
