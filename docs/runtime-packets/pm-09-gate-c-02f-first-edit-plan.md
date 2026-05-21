# PM-09 Gate C — 02F first edit plan

**Status:** Docs-only first edit plan — **runtime not executed**.  
**Date:** 2026-05-21  
**Parent packet:** [pm-09-gate-c-extend-02f-plan-watcher.md](pm-09-gate-c-extend-02f-plan-watcher.md)

**This document does not authorize Save, Execute, or Telegram in n8n.**

---

## Workflow target (exact)

| Field | Value |
|-------|--------|
| **Name** | `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` |
| **State after read-only session** | **Active/published** — unchanged |
| **User action in read-only session** | Opened workflow in n8n UI; **no** Execute, **no** Save, **no** node edits |

---

## Read-only verification observed (2026-05-21)

User opened **02F** in n8n UI for visual inspection only. Screenshot / visual check confirms the following nodes are **present** (names as shown in UI):

| # | Node name (observed) |
|---|----------------------|
| 1 | Manual Trigger |
| 2 | Schedule Trigger - controlled polling |
| 3 | Data Table - Load all state rows |
| 4 | Emit watched repos (3) |
| 5 | GitHub - Fetch latest commit (per repo) |
| 6 | Prepare latest commit event |
| 7 | Decide Data Table dedupe |
| 8 | IF - New commit? |
| 9 | IF - GIS repo for handoff? |
| 10 | Execute Command - handoff dry-run |
| 11 | Parse handoff stdout |
| 12 | Telegram - Send handoff result |
| 13 | Read/Write Files from Disk |
| 14 | Telegram - Send handoff file |
| 15 | Data Table - Upsert last seen commit |
| 16 | Format Data Table Telegram message |
| 17 | Telegram - Send Data Table deduped message |
| 18 | Duplicate skip - no Telegram |

**Read-only session result:** Structure matches committed redacted export intent ([WORKFLOW_EXPORT_STATUS.md § 02F](../WORKFLOW_EXPORT_STATUS.md#02f-redacted-export-status)). **02F not modified** in this session.

---

## Constraints (mandatory for all future edits)

| Constraint | Detail |
|------------|--------|
| **No Execute** | Until first edit branch is saved intentionally and test plan is ready |
| **No Save** | Until full first-edit scope is understood (this plan) |
| **No real Telegram** | Gate C — Gate D not authorized |
| **No Gate D wiring** | Do not connect plan branch to Telegram Send |
| **No v5 / webhook** | Unchanged |
| **Do not touch** | `01`, `03`, `20`, ALINA LAVORO, dev-method, GIS repos |
| **One edit per gate** | [RUNTIME_GATES.md](../RUNTIME_GATES.md) |

---

## Recommended insertion point

Attach the plan watcher branch from the **`true`** output of **`IF - New commit?`**, **in parallel** with:

- existing **GIS handoff** branch (`IF - GIS repo for handoff?` → …), and  
- existing **commit notify** branch (`Data Table - Upsert` → `Format` → `Telegram - Send Data Table deduped message`).

```text
IF - New commit? (true)
  ├── [existing] IF - GIS repo for handoff? → handoff path (unchanged)
  ├── [existing] commit notify path (unchanged)
  └── [NEW] IF - Control-plane repo for plan watcher? → plan path (isolated)
```

**Early exit:** first node on plan branch checks `repo == mrhz1973/control-plane`; **false** → stop plan branch only (no impact on GIS or commit notify).

---

## First runtime edit (recommended — single session step)

Add **only one** isolated entry node — do **not** wire the full chain yet:

| Node | Type | Purpose |
|------|------|---------|
| **IF - Control-plane repo for plan watcher?** | IF (or Code + IF) | Condition: `$json.repo` or equivalent slug equals `mrhz1973/control-plane` |

- Connect from **`IF - New commit?`** true output (parallel fork).
- **True** output: leave **disconnected** or connect to a no-op **Code** stub that logs `plan_branch_entered` (optional, no Telegram).
- **False** output: dead end (plan branch skipped).
- **Do not** connect to any Telegram node.
- **Save** only after this single node is placed and reviewed — then stop for this gate step.

Equivalent naming acceptable if consistent in UI (e.g. `IF - CP repo for plan watcher?`).

---

## Future nodes (logical order — later gates, not first edit)

Implement **one node (or pair) per runtime gate** after first edit PASS:

| Order | Node | Role |
|-------|------|------|
| 1 | IF - Control-plane repo for plan watcher? | **First edit** — repo gate |
| 2 | GitHub - Get commit files / compare files | List files changed in commit |
| 3 | Code - Filter docs/plans/*.plan.md | Path filter Gate B |
| 4 | Code - Fetch/parse/validate plan front matter | YAML parse; skip `sample: true`; validate mandatory fields |
| 5 | Data Table - Plan dedupe lookup/upsert | Key prefix `plan:` on `control_plane_state` |
| 6 | Code - Emit plan_detected | Normalized event for Gate D (stub output only in Gate C) |

---

## Do NOT do in first edit

- Send Telegram (any node)
- Connect to Gate D
- Modify **GIS handoff** nodes (`IF - GIS repo`, Execute Command, handoff Telegram, file send)
- Modify **commit notify** path (Upsert, Format, deduped Telegram)
- Modify **Duplicate skip - no Telegram** branch
- Change **Schedule Trigger** interval or activation
- Delete or rewire existing connections on GIS/commit paths
- Enable v5 or configure webhook

---

## Test after first edit (future gate — not now)

Only after **intentional Save** of the first IF node:

1. **Manual Trigger** once (controlled).
2. Expect: plan branch IF evaluates; **no Telegram** on any path from new nodes.
3. For control-plane new commit item: optional log / stub output on true branch.
4. For dev-method / GIS items: plan IF **false** — existing paths behave as before.
5. If unexpected Telegram or GIS regression → **rollback immediately** (disconnect new node or revert workflow).

Full `plan_detected` test requires nodes 2–6 (separate gates).

---

## STOP criteria (before / during edit)

**Stop before editing if:**

- Workflow open is not **`02F`** exact name
- User cannot identify **`IF - New commit?`** true output
- Unsaved experimental changes already in canvas from another session
- Gate D or Telegram nodes are being wired to plan branch

**Stop during edit if:**

- Accidental connection to **Telegram - Send** any variant
- GIS handoff or commit notify connections broken
- Schedule trigger disabled or interval changed unintentionally
- Execute pressed before Save review complete
- Any real Telegram message received from test run

**Rollback:** disconnect new branch; or restore from [02F redacted export](../../workflows/exports/2026-05-21_github-commit-datatable-dedupe-scheduled-v4-multirepo-02f-handoff-safe-text.redacted.json) per parent packet.

---

## Explicit non-actions (this document)

- No n8n Save in docs task
- No Execute
- No Telegram API
- No SSH / Docker / VPS
- No `workflows/exports/**` change in docs task
- **02F** canvas unchanged by this document

---

## Next real gate

**Gate C runtime step 1:** In n8n UI, add **`IF - Control-plane repo for plan watcher?`** only → Save → Manual Trigger smoke (no Telegram) → record result in session log.
