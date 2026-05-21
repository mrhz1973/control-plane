# n8n CONTROL PLANE workflow naming (numeric)

**Docs-only registry.** Records operational naming in n8n UI. **Not** a runtime change by itself.

**Related:** [MVP_STATUS.md](MVP_STATUS.md), [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [RUNTIME_GATES.md](RUNTIME_GATES.md), [final n8n cleanup](sessions/2026-05-21-control-plane-final-n8n-cleanup.md).

**Last updated:** 2026-05-21 — final CONTROL PLANE list = **4 workflows**; PM-09 in **`40`**; **`41`/`42`/`43`** future candidates.

---

## Rule

| Rule | Detail |
|------|--------|
| **Numeric prefix** | Use numeric prefixes only; avoid letter suffixes like `02F` in **new** runtime names |
| **Production (`40`)** | **`40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE`** — sole published CP poll+handoff (PM-09 Gate C+D+FILE). Do **not** create multiple visible workflows all named `40` |
| **Candidates (`41`–`43`)** | Next import/test/replacement candidates only — e.g. `41 - … CANDIDATE`, then `42`, `43` |
| **Retained off (`01`/`20`/`30`)** | Legacy / v5 / manual handoff — stay **OFF**, not deleted |
| **Backup / test-safe** | Delete from n8n UI after PASS when no longer needed — do not leave duplicate `40` or stale test workflows in the list |
| **Status suffix** | `- ACTIVE`, `- OFF`, `- LEGACY OFF`, `- CANDIDATE`, or `- TEST SAFE` in workflow **display name** where helpful |
| **Pre-bound credentials** | New candidate JSON should include existing n8n credential bindings by credential name where safe |
| **Private values** | Do not commit private runtime values; use clear placeholders when needed |
| **Exports** | Committed `.redacted.json` may keep **historical** names; new exports use readable target names (`41`+, not another `40` candidate) |
| **JSON / raw URL** | Prefer `41 - … CANDIDATE`, not another `40 - … CANDIDATE` |

---

## Credential policy for future JSON candidates

Goal: reduce manual n8n setup friction.

Future candidate exports should arrive as close as possible to ready-to-run:

| Node type | Required default in candidate JSON |
|----------|-------------------------------------|
| GitHub HTTP/API nodes | Include known credential binding name where applicable |
| Telegram nodes | Include known credential binding name where applicable |
| Telegram Chat ID | Prefer a safe placeholder or n8n-side expression when the value should not be stored in GitHub |
| Data Table nodes | Preserve table reference by name, e.g. `control_plane_state` |
| File nodes | Preserve safe container paths under `/home/node/.n8n-files/` |

Operational rule:

- For known GitHub/Telegram credentials, candidates should not arrive with empty credential selectors.
- If a field cannot be safely committed, use a clear placeholder such as `__CONFIGURE_CHAT_ID_IN_N8N_UI__`.
- Prefer a future one-time n8n-side lookup so common Telegram destination data does not need to be retyped in every imported workflow.

---

## Current CONTROL PLANE list (runtime — final 2026-05-21)

**Exactly 4 workflows** in the n8n CONTROL PLANE folder:

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **40** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` | **Active/published** — sole CP poll+handoff + PM-09 (formerly **`02F`**) |
| **30** | `30 - CP handoff manual Telegram v1 - OFF` | **Off** (formerly `03`) |
| **20** | `20 - CP v5 push webhook - OFF` | **Off** |
| **01** | `01 - CP v4 single-repo polling - LEGACY OFF` | **Off** |

**Deleted from n8n UI** after PM-09 Gate C+D+FILE PASS ([session](sessions/2026-05-21-control-plane-final-n8n-cleanup.md)):

| Was | Reason |
|-----|--------|
| `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP BEFORE GATE D FILE - OFF` | Promotion complete — backup no longer needed |
| `55 - CP plan detected Telegram Gate D TEST SAFE` | Test-safe validation complete — not production |

**Not in current list:** reserved IDs **`41`**, **`42`**, **`43`** (future candidates only).

---

## Candidate numbering policy

Readable n8n UI matters. Avoid many entries starting with identical `40 - ...` names.

| Use case | Prefix |
|----------|--------|
| Current production polling workflow | `40` |
| First candidate replacing/extending `40` | `41` |
| Second candidate | `42` |
| Third candidate | `43` |

When a candidate becomes production:

1. Rename or delete old production backup copies in n8n UI.
2. Rename the selected candidate to `40 - ... - ACTIVE`.
3. Delete obsolete test-safe workflows after PASS.

---

## Historical — prefix `55` (deleted 2026-05-21)

| Item | Detail |
|------|--------|
| **Was** | `55 - CP plan detected Telegram Gate D TEST SAFE` — isolated PM-09 Gate D test |
| **Now** | **Deleted** from n8n after PASS; Gate D lives in production **`40`** |
| **Future** | Use **`41`–`43`** for new candidates; only recreate a separate test-safe workflow if an explicit runtime gate requires it |

---

## Rename map (2026-05-21)

| Former (docs/export history) | Current (runtime) |
|-------------------------------|-------------------|
| `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` |
| `03 - CP handoff manual Telegram v1` | `30 - CP handoff manual Telegram v1 - OFF` |
| `01 - CP v4 single-repo polling - LEGACY OFF` | unchanged |
| `20` v5 webhook | `20 - CP v5 push webhook - OFF` |

---

## Export hygiene

Committed exports under `workflows/exports/` may still show **`02F`**, **`55`**, backup `40`, or `40 ... CANDIDATE` names in JSON — **historical import-safe artifacts**. Deleting runtime workflows does **not** remove committed export history.

New candidate JSON should use **`41`**, **`42`**, **`43`**, … in the workflow `name` field.

See [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md).

---

## Explicit non-actions (this doc)

- Does not open n8n, import, export, Execute, or Telegram
- Does not modify `workflows/exports/**`
- Does not rename or delete workflows by itself
