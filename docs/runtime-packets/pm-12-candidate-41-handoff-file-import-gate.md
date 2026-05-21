# Runtime packet — PM-12: candidate `41` plan handoff file import gate

**Packet ID:** `pm-12-candidate-41-handoff-file-import-gate`  
**Date:** 2026-05-21  
**Status:** **Prepared** — runtime **not authorized** by this packet alone.

**Related:** [PM11_CANDIDATE_41_HANDOFF_FILE.md](../PM11_CANDIDATE_41_HANDOFF_FILE.md) · [PLAN_WATCHER_GATE_C.md](../PLAN_WATCHER_GATE_C.md) · [N8N_WORKFLOW_NAMING.md](../N8N_WORKFLOW_NAMING.md) · [RUNTIME_GATES.md](../RUNTIME_GATES.md) · [OBSERVABILITY.md](../OBSERVABILITY.md) · [HANDOFF_N8N_GATE.md](../HANDOFF_N8N_GATE.md)

**Design:** [PM11_CANDIDATE_41_HANDOFF_FILE.md](../PM11_CANDIDATE_41_HANDOFF_FILE.md) — architecture **A** (inactive candidate copy of `40` + new handoff-file branch).

**Redacted JSON:** **Not committed in PM-12** — build or derive at import gate from production `40` export + PM-11 nodes, or follow [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md) redaction rules after UI PASS.

---

## Purpose

Prepare a **controlled, one-step-at-a-time** runtime path to import and test:

```text
41 - CP v4 multirepo + plan handoff file - CANDIDATE
```

The candidate must, after `plan_detected` on a real `docs/plans/*.plan.md` commit:

1. Fetch and parse the plan file (front matter + body).
2. Build a **full implementer handoff/prompt** markdown file.
3. Write it to `/home/node/.n8n-files/latest-control-plane-handoff.md`.
4. Send Telegram **short text** (safe, capped) + **document** = generated handoff file (not only the source plan `.md`).

**Production `40` stays ACTIVE** until a **separate promotion gate** after PASS evidence.

---

## Starting state (2026-05-21)

| Item | State |
|------|--------|
| **MVP** | Accepted with C1 **PARTIAL** (D-C1-A); C2–C5 **PASS** |
| **PM-09** | Gate C + D + FILE **PASS** in **`40`** |
| **PM-10 / PM-11** | Plan + design committed |
| **Production** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` |
| **n8n list** | 4 workflows: `40` ACTIVE · `30` / `20` / `01` OFF |
| **Deleted from UI** | Backup `40`; `55` test-safe |
| **v5 / webhook** | Off / not configured |
| **Reference pattern** | GIS `latest-gis-handoff.md` — same container path family |

---

## n8n target (exact)

| Field | Value |
|-------|--------|
| **Workflow name** | `41 - CP v4 multirepo + plan handoff file - CANDIDATE` |
| **Initial state** | **Inactive** — no schedule publish |
| **Basis** | Copy from production **`40`** (export or duplicate in UI) + add handoff-file branch per PM-11 |
| **Safe output path** | `/home/node/.n8n-files/latest-control-plane-handoff.md` |

---

## Why `41` (not edit `40` in place)

| Reason | Detail |
|--------|--------|
| **Policy** | [N8N_WORKFLOW_NAMING.md](../N8N_WORKFLOW_NAMING.md) — candidates **`41`/`42`/`43`**, not another `40` row |
| **Risk** | **`40`** runs GIS handoff, commit notify, PM-09 Gate C+D live |
| **Test** | Manual Trigger on inactive **`41`** before any promotion |
| **Rollback** | Delete or ignore **`41`** without touching production |

---

## Why not `55`

| Item | Detail |
|------|--------|
| **`55`** | Historical Gate D test-safe — **deleted** from n8n UI |
| **PM-12** | Uses **`41`** as production **candidate**, not a new `55` test clone |

---

## Prerequisites

| # | Prerequisite | Status |
|---|--------------|--------|
| 1 | PM-11 design PASS | Done |
| 2 | PM-09 Gate D file PASS in **`40`** (reference nodes) | Done |
| 3 | User opens **explicit** PM-12 runtime session | **Pending** |
| 4 | Non-sample plan file on GitHub (Gate B) for Manual Trigger test | Required at runtime |
| 5 | Credentials exist in n8n UI (names only in docs) | Required at runtime |
| 6 | **`40` schedule stays published** — do not deactivate in this gate | Required |

**This packet does not authorize opening n8n.**

---

## Input / output

| | Detail |
|---|--------|
| **Input** | `docs/plans/*.plan.md` on `mrhz1973/control-plane` after commit (via existing poll + `plan_detected` chain in candidate) |
| **Output file** | `/home/node/.n8n-files/latest-control-plane-handoff.md` |
| **Telegram** | Short `plan_handoff_ready` (or equivalent) message + document attachment of **generated** file |
| **Not output** | Auto-invoke implementer; Cursor/provider API; webhook/v5 |

---

## Constraints (mandatory)

| Constraint | Detail |
|------------|--------|
| **No auto-send implementer** | Human/orchestrator only after Telegram review |
| **No provider API** | No LLM inside n8n for v1 — template from plan front matter + body |
| **No secrets in git** | chat_id, tokens, credential IDs in UI only |
| **No v5 / webhook** | Unchanged |
| **Do not touch** | ALINA LAVORO; GIS repo; dev-method repo |
| **Do not deactivate `40`** | Regression smoke required |
| **One gate per step** | [RUNTIME_GATES.md](../RUNTIME_GATES.md) |
| **C1** | Stays **PARTIAL** — not relabeled PASS |

---

## Gates (execute in order — stop on STOP)

### Gate A — Import candidate `41` (**inactive**)

| Step | Action |
|------|--------|
| A1 | In n8n: **Import** workflow as `41 - CP v4 multirepo + plan handoff file - CANDIDATE` (duplicate from `40` export or JSON when ready) |
| A2 | Confirm workflow is **inactive** / schedule **off** |
| A3 | Confirm production **`40`** still **active/published** |

**STOP if:** import overwrites **`40`**; schedule auto-enabled on **`41`**.

---

### Gate B — Credential / placeholder check

| Step | Action |
|------|--------|
| B1 | GitHub nodes: credential name `CONTROL PLANE` (or existing authenticated API name in UI) |
| B2 | Telegram nodes: credential `CONTROL PLANE - Telegram Bot` |
| B3 | Chat ID: placeholder or UI value — **never** commit real chat_id |
| B4 | Data Table: `control_plane_state` unchanged |

**STOP if:** empty credential selectors on new branch nodes.

---

### Gate C — Manual Trigger (single run)

| Step | Action |
|------|--------|
| C1 | Ensure latest control-plane commit includes a **non-sample** `docs/plans/*.plan.md` (or use pinned test commit SHA in Manual Trigger context) |
| C2 | Run **Manual Trigger once** on **`41` only** |
| C3 | Do **not** run production **`40`** Manual Trigger in same step unless regression gate F is next |

**STOP if:** execution errors before handoff branch; duplicate spam to Telegram (>1 unexpected message).

---

### Gate D — Verify file write

| Step | Action |
|------|--------|
| D1 | Execution succeeds through Read/Write Files node for handoff path |
| D2 | File exists at `/home/node/.n8n-files/latest-control-plane-handoff.md` (container path) |
| D3 | File contains YAML front matter block + implementer sections per PM-11 template |
| D4 | `prompt_ready: yes` or `no` consistent with validation outcome |

**STOP if:** file missing; file is identical copy of source plan only (no generated handoff structure).

---

### Gate E — Verify Telegram (short text + document)

| Step | Action |
|------|--------|
| E1 | **Short** Telegram message received — **no** full prompt in body |
| E2 | **Document** attachment is **generated handoff file**, distinguishable from raw plan `.md`-only path |
| E3 | Message references task/repo/commit SHA (public) only |

**STOP if:** no Telegram; long prompt in body; wrong file attached.

**Do not** paste full Telegram body into git — record PASS/FAIL + SHA only in session note.

---

### Gate F — Regression smoke production `40`

| Step | Action |
|------|--------|
| F1 | Confirm **`40`** still **active/published** (1 min) |
| F2 | Optional: **`40`** Manual Trigger or wait one poll — GIS/commit/plan Gate D paths still succeed or dedupe-skip as expected |
| F3 | No duplicate broken nodes on **`40`** |

**STOP if:** **`40`** deactivated, broken, or missing plan/GIS branches.

---

### Gate G — Session evidence (docs)

| Step | Action |
|------|--------|
| G1 | Create `docs/sessions/YYYY-MM-DD-control-plane-41-handoff-file-manual-pass.md` (or `-fail.md`) |
| G2 | Record: workflow name, public commit SHA, PASS/FAIL per gate, file path, **no secrets** |
| G3 | Link from [POST_MVP_BACKLOG.md](../POST_MVP_BACKLOG.md) PM-12 row |

---

### Gate H — Redacted export (after PASS only)

| Step | Action |
|------|--------|
| H1 | Export **`41`** from n8n UI |
| H2 | Redact per [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md) |
| H3 | Commit as `workflows/exports/YYYY-MM-DD_41-plan-handoff-file-candidate.redacted.json` — **separate** commit/gate |
| H4 | JSON `name` field = `41 - CP v4 multirepo + plan handoff file - CANDIDATE` |

**Not part of PM-12 docs packet commit.**

---

### Gate I — Promotion to `40` (**future separate packet**)

| Step | Action |
|------|--------|
| I1 | **Not authorized in PM-12** |
| I2 | Requires explicit promotion gate: backup/off old `40` → rename PASS candidate to `40 - … - ACTIVE` |
| I3 | One promotion step per [RUNTIME_GATES.md](../RUNTIME_GATES.md) |

---

## PASS criteria (all required)

1. **`41` imported** and remains **inactive** (no published schedule on candidate).
2. Manual Trigger on **`41`** completes successfully for a real plan commit.
3. `/home/node/.n8n-files/latest-control-plane-handoff.md` written with PM-11 structure.
4. Telegram short text + **generated** handoff document received.
5. **No** implementer auto-send.
6. Production **`40`** regression smoke **PASS**.
7. Session evidence committed (docs only, no secrets).
8. **No** secrets in committed docs.

---

## STOP criteria

| Condition | Action |
|-----------|--------|
| Import replaces or disables **`40`** | Roll back import; restore from export |
| Schedule enabled on **`41`** | Disable immediately |
| Telegram spam / duplicate handoff files | Fix dedupe; do not promote |
| GIS or commit notify broken on **`40`** | Revert **`41`** changes; STOP promotion |
| Cannot write n8n-files path | Fix permissions; do not promote |
| User has not opened runtime session | Do not proceed past docs |

---

## What NOT to do (this packet and first runtime session)

- Open n8n as part of **this docs-only** commit
- Import, execute, activate, or publish **`41`**
- Switch **`40` → `41`** in production
- Enable v5 or GitHub webhook
- Touch ALINA / GIS / dev-method repos or workflows
- Commit tokens, chat_id, credential IDs, webhook URLs
- Batch gates A–E in one UI session without recording each step
- Call Cursor/provider API or implementer from n8n
- Force-push or `git clean` / `reset --hard` on control-plane repo

---

## Suggested new nodes (implementation hint — UI only)

Add after existing `plan_detected` IF (true) on candidate **`41`**:

```text
Code - Build control-plane handoff from plan
Read/Write Files from Disk - Write latest-control-plane-handoff.md
Code - Format handoff ready Telegram (safe text)
Telegram - Send handoff ready short message
Read/Write Files from Disk - Read latest-control-plane-handoff.md
Telegram - Send handoff file document
```

Reuse Gate D file-fetch pattern from **`40`** where possible (HTTP + prepare + disk).

---

## Next step after this packet (docs committed)

**Single authorized runtime action:** **Gate A only** — import `41 - CP v4 multirepo + plan handoff file - CANDIDATE` as **inactive**, then stop and report before Gate B.
