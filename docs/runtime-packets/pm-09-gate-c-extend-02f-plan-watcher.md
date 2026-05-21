# Runtime packet — PM-09 Gate C: extend 02F plan watcher

**Packet ID:** `pm-09-gate-c-extend-02f-plan-watcher`  
**Date:** 2026-05-21  
**Status:** **Prepared** — runtime **not authorized** by this packet alone.

**Related:** [PLAN_WATCHER_GATE_C.md](../PLAN_WATCHER_GATE_C.md), [PLAN_OUTPUT_INGESTION.md](../PLAN_OUTPUT_INGESTION.md), [RUNTIME_GATES.md](../RUNTIME_GATES.md), [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md).

**Architecture decision:** **A — extend 02F** (user-selected 2026-05-21). Architecture B (PM-03 separate workflow) is **fallback only** if A fails or regression risk is unacceptable.

**First edit plan:** [pm-09-gate-c-02f-first-edit-plan.md](pm-09-gate-c-02f-first-edit-plan.md) — read-only **02F** verification recorded; first runtime edit step defined (**not executed**).

**JSON draft (import candidate):** [pm-09-gate-c-02f-json-draft.md](pm-09-gate-c-02f-json-draft.md) — `workflows/exports/2026-05-21_02f-plan-watcher-first-if-draft.redacted.json` (**not imported**).

---

## Purpose

Execute a **controlled modification** of **`02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT`** to add an **isolated branch** that:

1. Activates only for repo `mrhz1973/control-plane`
2. Detects changed files under `docs/plans/*.plan.md`
3. Validates Gate B YAML front matter
4. Dedupes via Data Table key prefix `plan:`
5. Emits **`plan_detected`** in execution output — **no Telegram** in Gate C

Gate D (Telegram summary) is a **separate** future session.

---

## Prerequisites

| # | Prerequisite | Status |
|---|--------------|--------|
| 1 | PM-09 Gate A design PASS | Done |
| 2 | PM-09 Gate B file convention PASS — `docs/plans/` | Done |
| 3 | PM-09 Gate C design PASS — [PLAN_WATCHER_GATE_C.md](../PLAN_WATCHER_GATE_C.md) | Done |
| 4 | Architecture **A** decision recorded | Done (2026-05-21) |
| 5 | User opens explicit Gate C runtime session | **Pending** |
| 6 | n8n UI access to **02F** (read first, edit one step) | **Read-only done** (2026-05-21) — [first edit plan](pm-09-gate-c-02f-first-edit-plan.md); edit **pending** |
| 7 | Test plan file ready (non-sample) for commit before Manual Trigger | Required at runtime |
| 8 | Gate D Telegram branch **disconnected or disabled** during Gate C test | Required at runtime |

**This packet does not authorize opening n8n.**

---

## n8n target (exact)

| Field | Value |
|-------|--------|
| **Workflow name** | `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` |
| **Role** | Sole active CONTROL PLANE poll + handoff (PM-07) |
| **Schedule** | 1 min (unchanged unless explicitly gated) |
| **Watched repos** | `mrhz1973/control-plane`, `mrhz1973/dev-method`, `mrhz1973/cursor-coordinate-converter` |

---

## Constraints (mandatory)

| Constraint | Detail |
|------------|--------|
| **Do not touch** | `01` legacy off, `03` handoff manual, `20` v5 webhook off |
| **Do not activate** | v5 workflow |
| **Do not configure** | GitHub production webhook |
| **Do not send** | Real Telegram in Gate C — Gate D branch disabled/disconnected |
| **Do not touch** | ALINA LAVORO workflows; dev-method repo; GIS repo |
| **One gate per step** | [RUNTIME_GATES.md](../RUNTIME_GATES.md) — no batch import + test + publish |
| **C1 unchanged** | Stays **PARTIAL** (D-C1-A); not strict 5/5 PASS |

---

## Operational preference — n8n JSON delivery (user, 2026-05-21)

For **future** CONTROL PLANE n8n workflow changes (including Gate C **02F** extension and any PM-03 workflow):

| Preference | Detail |
|------------|--------|
| **Default delivery** | Orchestrator prepares **redacted, importable n8n workflow JSON** and provides it as **file / GitHub link / URL** when possible |
| **Avoid** | Manual node-by-node reconstruction in n8n UI as the primary path |
| **Redaction** | Same rules as [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md) — no token, chat_id, credential ID, webhook URL in git |
| **Runtime gate** | User imports or merges JSON in n8n UI **one step per gate** — import alone does not authorize Execute or Telegram |
| **Export refresh** | After material runtime change, commit updated `.redacted.json` under `workflows/exports/` (PM-08 pattern) |

**Gate C note:** [first edit plan](pm-09-gate-c-02f-first-edit-plan.md) step 1 (single IF in UI) was drafted before this preference. **Before Gate C runtime edit**, orchestrator should prefer delivering an **02F delta or full redacted JSON** with the plan branch; manual canvas edit is **fallback only** if JSON is unavailable or rejected on import review.

**This preference does not authorize runtime or export commit in a docs-only task.**

---

## Desired modification (future runtime)

Add an **isolated parallel branch** on **02F** (do not replace existing GIS handoff or commit-notify paths):

```text
Existing 02F poll path (unchanged for dev-method / GIS)
  └── IF repo == mrhz1973/control-plane
        └── List commit changed files
              └── Filter docs/plans/*.plan.md
                    └── For each file: fetch → parse front matter → validate → dedupe → plan_detected
```

**Early exit:** if repo ≠ `mrhz1973/control-plane` → skip entire plan branch (zero impact on GIS handoff).

**Gate D handoff node:** stub or disabled IF — must not call Telegram Send in Gate C session.

---

## Technical algorithm (synthetic)

1. After GitHub latest-commit read for `mrhz1973/control-plane`, branch on repo slug.
2. GitHub API: list files in commit (or compare parent..commit).
3. Filter: path matches `docs/plans/` + ends with `.plan.md`.
4. For each match:
   - Fetch raw content at commit SHA
   - Parse YAML front matter (between `---` delimiters)
   - If `sample: true` → log `plan_skip_sample`, continue
   - Validate mandatory fields: `repo`, `task`, `mode`, `model`, `effort`, `risk`, `next_step`, `requires_runtime`, `requires_human_gate`, `target_window`, `created_at`, `source`, `summary`
   - If invalid → log `plan_skip_invalid`, continue (non-fatal)
   - `dedupe_key = plan:<repo_slug>:<plan_path>:<blob_sha|commit_sha>`
   - Data Table get on `control_plane_state` → if key exists → log `plan_skip_duplicate`, continue
   - Upsert dedupe key
   - Set Code node output: `event: plan_detected` + fields per [PLAN_WATCHER_GATE_C.md](../PLAN_WATCHER_GATE_C.md)
5. **No** Telegram Send node execution on this branch in Gate C.

---

## Future runtime test plan

Execute **one step at a time**. Suggested order:

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open **02F** in n8n UI (read-only review) | Confirm current nodes; no edit yet |
| 2 | Add plan branch nodes (or edit copy **inactive** first if available) | Isolated IF for control-plane only |
| 3 | Disable Gate D / Telegram on plan branch | No Telegram path wired |
| 4 | Commit **non-sample** test plan under `docs/plans/` per Gate B | GitHub visible to poller |
| 5 | **Manual Trigger** once on **02F** (or inactive copy promoted after review) | Execution succeeds |
| 6 | Check execution output | **`plan_detected`** present with correct fields |
| 7 | Re-run Manual Trigger (same commit/plan) | **`plan_skip_duplicate`** — no second `plan_detected` |
| 8 | Confirm `example-control-plane-plan.plan.md` (`sample: true`) | **`plan_skip_sample`** — no event |
| 9 | Optional: invalid front matter file in test commit | **`plan_skip_invalid`** — workflow non-fatal |
| 10 | Smoke: GIS handoff path unchanged | No regression on existing branch structure |
| 11 | Smoke: commit notify for watched repos | Still works (no spurious Telegram from plan branch in Gate C) |
| 12 | Record PASS in docs; re-export redacted **02F** if material change (PM-08 pattern) | Separate docs commit |

**No real Telegram message** expected or allowed in steps 1–11.

---

## Rollback

| Method | When |
|--------|------|
| **Disable plan branch** | IF node forced false or branch disconnected — fastest |
| **Restore prior 02F** | Import last redacted export: `workflows/exports/2026-05-21_github-commit-datatable-dedupe-scheduled-v4-multirepo-02f-handoff-safe-text.redacted.json` (adjust credentials in UI) |
| **n8n version history** | If workflow versions enabled in UI |
| **Fallback to architecture B** | Only if user explicitly reopens decision — new PM-03 inactive workflow |

Do **not** delete `01`/`03`/`20` during rollback.

---

## Expected output (Gate C only)

| Output | Where |
|--------|--------|
| **`plan_detected`** JSON/object | n8n execution output / Code node — **not** Telegram |
| **`plan_skip_*` logs** | Execution log for sample, invalid, duplicate |
| **Data Table upsert** | Key `plan:mrhz1973/control-plane:docs/plans/...:<sha>` |
| **No Telegram** | Gate D not authorized |

---

## PASS criteria

Record **Gate C runtime PASS** when **all** true:

1. Architecture **A** implemented on **02F** (isolated control-plane branch only).
2. Non-sample plan file → exactly one **`plan_detected`** on first Manual Trigger / poll.
3. `sample: true` file → **no** `plan_detected`.
4. Invalid front matter → **no** `plan_detected`; workflow completes without fatal error.
5. Repeat trigger → duplicate skip (no second event for same content).
6. **No Telegram sent** during Gate C test.
7. GIS handoff + commit notify smoke **PASS** (no regression).
8. No secrets in committed session log or export.

---

## STOP criteria

**Stop immediately** and rollback if:

| Condition | Action |
|-----------|--------|
| GIS handoff branch breaks (Execute Command / Telegram errors) | Rollback **02F**; do not continue same session |
| Commit notify sends spurious messages from plan branch | Disconnect Telegram on plan branch; rollback |
| Unplanned Telegram message sent | STOP; document; rollback plan branch |
| User did not authorize runtime step | Do not proceed — docs-only boundary |
| Regression risk too high after partial edit | Rollback; consider architecture B only with **explicit** new decision |
| Accidental touch of `01`/`03`/`20`/ALINA | STOP; revert; record incident |

---

## Post-PASS (separate gates)

| Item | Gate |
|------|------|
| Redacted **02F** export commit | PM-08 pattern — separate docs session |
| Gate D Telegram wiring | Separate runtime session after Gate C PASS |
| Architecture B | Only if A rolled back + explicit user decision |

---

## Explicit non-actions (this packet)

- No n8n UI in packet preparation
- No **02F** modification in packet preparation
- No workflow JSON commit to `workflows/exports/` in decision task
- No Telegram API
- No SSH / Docker / VPS commands in decision task
