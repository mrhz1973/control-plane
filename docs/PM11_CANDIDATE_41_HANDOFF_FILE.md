# PM-11 — Candidate `41` full handoff/prompt file generation (design only)

**Docs-only design package.** **Does not** authorize n8n UI, import, execute, activation, workflow switch, or implementer auto-send.

**Related:** [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md) · [PM-10 plan](plans/2026-05-21_1700_control-plane_pm10-automation-next-step.plan.md) · [PLAN_WATCHER_GATE_C.md](PLAN_WATCHER_GATE_C.md) · [N8N_WORKFLOW_NAMING.md](N8N_WORKFLOW_NAMING.md) · [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) · [RUNTIME_GATES.md](RUNTIME_GATES.md)

---

## Purpose

After PM-09 (**plan_detected** + plan `.md` on Telegram) and PM-10 (automation direction committed), define how **candidate workflow `41`** will produce a **full implementer handoff/prompt file** from a new `docs/plans/*.plan.md` commit — saved on the n8n safe filesystem and delivered as a Telegram **document attachment**, with a **short** Telegram body (no long prompt inline).

**Not in this commit:** runtime changes, JSON export edits, switching production off **`40`**, or sending work to an implementer automatically.

---

## Starting state (2026-05-21)

| Item | State |
|------|--------|
| **MVP** | Operationally accepted; C1 **PARTIAL** (D-C1-A); C2–C5 **PASS** |
| **PM-09** | Gate C + D + FILE **PASS** in production **`40`** |
| **PM-10** | Plan committed — [pm10-automation-next-step](plans/2026-05-21_1700_control-plane_pm10-automation-next-step.plan.md) |
| **Production workflow** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` (1 min v4 poll) |
| **CONTROL PLANE n8n list** | **4 workflows** — `40` ACTIVE · `30` / `20` / `01` OFF |
| **Removed from UI** | Backup `40`; `55` Gate D test-safe (deleted after PASS) |
| **v5 / webhook** | Off / not configured |
| **GIS pattern (reference only)** | `latest-gis-handoff.md` at `/home/node/.n8n-files/` + safe-text Telegram + file attach — [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) |
| **Scope** | **CONTROL PLANE** only — ALINA / GIS / dev-method **not** modified by this design |

---

## Why candidate `41` (not edit production `40` in place)

| Reason | Detail |
|--------|--------|
| **Naming policy** | [N8N_WORKFLOW_NAMING.md](N8N_WORKFLOW_NAMING.md) — do **not** stack multiple `40 - … CANDIDATE` rows in n8n UI |
| **Blast radius** | **`40`** is sole published poll+handoff + PM-09; GIS commit notify + plan Gate D already live |
| **Test isolation** | Import/test **`41 - … CANDIDATE`** inactive + Manual Trigger before any promotion |
| **Promotion path** | After PASS: rename backup/off old `40` → promote winner to `40 - … - ACTIVE` (one explicit gate) |

---

## Why not `55`

| Item | Detail |
|------|--------|
| **Historical** | `55` was PM-09 Gate D **test-safe** only — **deleted** from n8n after PASS |
| **Current UI** | Prefix **`55`** is **not** in the final 4-workflow list |
| **Future** | Recreate an isolated test workflow only under an **explicit** runtime gate; production path stays **`40`** → promote to **`40`** |
| **PM-11 direction** | Use **`41`** for the next **production candidate**, not another test-only `55` clone |

---

## Input / output

### Input

| Source | Content |
|--------|---------|
| **Trigger** | New/changed commit on `mrhz1973/control-plane` with `docs/plans/*.plan.md` (Gate B filename + front matter) |
| **Upstream** | Existing **`40`** path already emits `plan_detected` (Gate C) and sends plan summary + raw plan `.md` (Gate D) |
| **Candidate `41` input** | `plan_detected` payload: `plan_path`, `commit_sha`, front-matter fields, public `github_file_url` |
| **File fetch** | Raw plan markdown at commit SHA (GitHub API — same pattern as Gate D file branch) |

### Output (target behavior after runtime gate)

| Artifact | Description |
|----------|-------------|
| **Full handoff file** | Single markdown file on n8n disk, e.g. `/home/node/.n8n-files/latest-control-plane-handoff.md` (name TBD at implementation) |
| **Telegram short message** | Brief status: repo, task, `Prompt ready: yes/no` (if generator used later), path hint, commit SHA — **no** full prompt in body |
| **Telegram document** | Attach the **generated full handoff file** (not only the source plan `.md`) |
| **Implementer** | **No auto-send** — human/orchestrator decides next window |

---

## Planned flow (candidate `41`)

```text
GitHub commit with docs/plans/*.plan.md
    → workflow 40 (production, unchanged in design phase)
         detects plan_detected
         → Telegram: plan_detected text + source plan .md attachment

    → workflow 41 CANDIDATE (future runtime gate only)
         triggered from plan_detected branch OR parallel branch on same poll
         → HTTP/GitHub: fetch plan file at commit SHA
         → Code: parse YAML front matter + body sections
         → Code: build full implementer prompt (structured markdown)
         → Read/Write Files: write full prompt to safe path
              e.g. /home/node/.n8n-files/latest-control-plane-handoff.md
         → Telegram: short notice (safe text, length-capped)
         → Telegram: Send Document (full handoff file)
         → STOP — no implementer API, no Cursor agent invoke

Human / orchestrator
    → reads Telegram + file
    → opens CONTROL PLANE or target repo window
    → decides whether/when to run implementer (explicit gate)
```

**Integration options (pick one at runtime gate):**

1. **A — Extend candidate `41` as copy of `40` + new branch** after `plan_detected` IF (preferred for PM-11).
2. **B — Sub-workflow** called from `40` (higher coupling — avoid unless A fails).

Design default: **A** on inactive **`41 - CP v4 multirepo + plan handoff file - CANDIDATE`**.

---

## Generated handoff file structure (target)

Mirror GIS discipline: one canonical file per latest event, overwritten on success.

```markdown
---
generated_at: <ISO8601>
source_plan: docs/plans/YYYY-MM-DD_HHMM_control-plane_<slug>.plan.md
commit_sha: <public SHA>
repo: mrhz1973/control-plane
task: <from plan front matter>
mode: <from plan>
risk: <from plan>
requires_runtime: <from plan>
requires_human_gate: <from plan>
prompt_ready: yes|no
---

# Implementer handoff — <task>

## Context
- Target window: control-plane
- Plan summary: <from front matter summary>
- Next step (plan): <from front matter next_step>

## Instructions
<derived from plan body: Summary, Proposed next step, Gates, Notes for orchestrator>

## Constraints
- No secrets in this file
- No automatic implementer invocation
- C1 remains PARTIAL (v4 polling SLA)

## Gates checklist
- [ ] Human confirmed target repo/window
- [ ] Runtime gate opened if n8n changes required
```

**Builder rules:**

- Prefer **deterministic template** from front matter + fixed body headings (no LLM inside n8n in v1).
- Optional later gate: invoke `handoff-generate.mjs` for dev-method/GIS repos — **out of scope** for PM-11 (CONTROL PLANE plans only).
- Max file size: cap or truncate with clear `TRUNCATED` footer if over safe Telegram/n8n limits.

---

## Security rules

| Rule | Detail |
|------|--------|
| **No secrets in git** | No tokens, chat_id, credential IDs, webhook URLs in docs or committed exports |
| **Candidate JSON** | Pre-bind credential **names** (`CONTROL PLANE - Telegram Bot`, GitHub API); `__CONFIGURE_CHAT_ID_IN_N8N_UI__` for chat_id |
| **Telegram body** | Safe-text only — mirror GIS handoff short message pattern |
| **Logs / sessions** | SHAs and paths only — no full Telegram payloads in repo |
| **Provider API** | No Cursor/LLM provider calls from n8n in PM-11 |
| **ALINA / GIS / dev-method** | Not touched |

---

## Limits (this design commit)

| Forbidden | Notes |
|-----------|--------|
| n8n import / export / execute | Separate **runtime gate** |
| Activate schedule on `41` | Manual Trigger first |
| Switch production `40` → `41` | Promotion gate only after PASS |
| Edit `workflows/exports/*.json` | Future redacted export after runtime PASS |
| Auto-send to implementer | Requires future explicit backlog + gate |
| v5 / webhook | Remains off |
| Edit production **`40`** | Use candidate **`41`** for development |

---

## Future runtime gate (separate session)

Execute **one step at a time** per [RUNTIME_GATES.md](RUNTIME_GATES.md):

1. Build/import **`41 - CP v4 multirepo + plan handoff file - CANDIDATE`** (inactive).
2. Pre-bind credentials in UI; verify placeholders.
3. Manual Trigger with a **non-sample** plan commit — expect handoff file write + Telegram doc.
4. Confirm **`40`** GIS + commit notify + plan Gate D still PASS (regression smoke).
5. Record PASS in session note; optional redacted export commit (PM-08 pattern).
6. **Promotion** to `40 - … - ACTIVE` only in a **later** explicit gate.

---

## Future PASS criteria

Record PASS when **all** are true:

1. New real plan under `docs/plans/` (Gate B) triggers candidate **`41`** (manual or test schedule).
2. Full handoff file written under `/home/node/.n8n-files/` with expected front matter + sections.
3. Telegram **short** message received — no full prompt in body.
4. Telegram **document** attachment is the **generated handoff file** (distinct from source plan `.md` only).
5. **`prompt_ready`** field set consistently (`yes` if template complete, `no` if validation failed).
6. **No** implementer invoked automatically.
7. Production **`40`** unchanged or promotion documented — no silent drift.
8. No secrets in committed evidence.
9. Dedupe: same plan SHA does not spam duplicate handoff files.

---

## This commit status

| Item | State |
|------|--------|
| **PM-11 design package** | **Committed** (this file) |
| **Candidate `41` runtime** | **Not authorized** |
| **Next real gate** | Candidate `41` import / Manual Trigger / PASS evidence |
