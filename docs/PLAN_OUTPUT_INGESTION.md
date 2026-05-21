# Cursor Plan output ingestion (design)

**PM-09** — [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md). **Docs-only design.** No runtime, n8n workflow, Telegram API, or provider integration from this document.

**Related:** [MVP_STATUS.md](MVP_STATUS.md), [RUNTIME_GATES.md](RUNTIME_GATES.md), [OBSERVABILITY.md](OBSERVABILITY.md), [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [plans/README.md](plans/README.md), [PLAN_WATCHER_GATE_C.md](PLAN_WATCHER_GATE_C.md).

**Gate status:** **A** delivered · **B** delivered · **C** design delivered (runtime not authorized) · **D** not authorized

---

## Problem

After a Cursor **Plan** session, the orchestrator today relies on **manual copy-paste** of plan text into handoff channels or repo notes. That is error-prone, unstructured, and not reliably visible to the existing GitHub → n8n → Telegram path.

---

## Objective

Define a future automation where **Cursor Plan output** is saved as a **structured file in a watched repo**, then picked up by the existing CONTROL PLANE stack so the orchestrator can read it via **GitHub** and receive a **short Telegram summary** (and optional file/link) without pasting the full plan into chat.

**This document does not implement that path.** It records design, file shape, gates, and success criteria only.

---

## Minimum future flow

```text
Cursor Plan (user session)
  → structured plan file committed under docs/plans/ (gate B — convention defined)
  → GitHub push / commit visible to existing multirepo watcher (02F or successor)
  → n8n detects new/changed plan file (path convention — gate C)
  → Telegram: brief summary + optional document or GitHub link (gate D)
  → orchestrator reads full plan from GitHub (no secrets in message body)
```

**Not in scope now:** new n8n workflow creation, v5 webhook, strict C1 &lt;30s reopen, ALINA LAVORO, dev-method or GIS repo changes, Cursor provider/API hooks.

---

## Gate B — file convention (delivered)

**Format:** Markdown with **YAML front matter** only — no parallel JSON for the same plan event.

**Directory:** `docs/plans/` in the repo where the plan applies (default: `mrhz1973/control-plane`).

**Naming pattern:**

```text
docs/plans/YYYY-MM-DD_HHMM_<repo-short>_<task-slug>.plan.md
```

| Segment | Rule | Example |
|---------|------|---------|
| `YYYY-MM-DD` | UTC or local date of plan creation | `2026-05-21` |
| `HHMM` | 24h time of plan creation | `1230` |
| `<repo-short>` | Short repo slug, lowercase, hyphens | `control-plane`, `dev-method`, `gis` |
| `<task-slug>` | Lowercase kebab-case, max ~40 chars | `pm-09-gate-b` |

**Canonical example path:**

```text
docs/plans/2026-05-21_1230_control-plane_pm-09-gate-b.plan.md
```

**Non-operational sample:** [plans/example-control-plane-plan.plan.md](plans/example-control-plane-plan.plan.md) — clearly marked sample; not for Telegram or runtime.

---

## Required YAML front matter

All fields are **mandatory** unless noted. Values are plain strings unless specified.

| Field | Type / values | Purpose |
|-------|----------------|---------|
| **repo** | GitHub slug | Target or context repo (e.g. `mrhz1973/control-plane`) |
| **task** | string | Short task title or backlog ID |
| **mode** | `plan` / `agent` / `ask` | Cursor mode |
| **model** | string | Model name — **no API keys** |
| **effort** | `fast` / `medium` / `high` / `none` | Effort setting |
| **risk** | `low` / `medium` / `high` | Orchestrator routing hint |
| **next_step** | string (one sentence) | Concrete next action |
| **requires_runtime** | `yes` / `no` | Next step needs n8n/VPS/SSH |
| **requires_human_gate** | `yes` / `no` | User confirmation required before execution |
| **target_window** | `control-plane` / `dev-method` / `gis` / `other` | Which Cursor window owns follow-up work |
| **created_at** | ISO 8601 datetime | Plan file creation time (e.g. `2026-05-21T12:30:00+02:00`) |
| **source** | `cursor-plan` | Fixed value for v1 convention |
| **summary** | string (≤500 chars) | Plain-text plan summary — **no secrets** |

**Duplicate rule:** `summary` in front matter is the Telegram-safe one-liner; the body `## Summary` section may expand with more detail (still no secrets).

---

## Required Markdown sections

Every plan file **must** include these headings in order (content may be brief):

1. **`## Summary`** — expanded summary for orchestrator reading on GitHub
2. **`## Proposed next step`** — same intent as `next_step` front matter, may add bullets
3. **`## Gates`** — which runtime or human gates apply before execution
4. **`## Out of scope`** — explicit exclusions for this plan
5. **`## Notes for orchestrator`** — routing hints, window color, backlog IDs, dependencies

---

## Template (copy for new plans)

```markdown
---
repo: mrhz1973/control-plane
task: PM-09 example
mode: plan
model: composer-2.5
effort: fast
risk: low
next_step: "Review plan file on GitHub before opening any runtime gate."
requires_runtime: no
requires_human_gate: yes
target_window: control-plane
created_at: 2026-05-21T12:30:00+02:00
source: cursor-plan
summary: "One-line summary for future Telegram ingestion (max 500 chars, no secrets)."
---

## Summary

Expanded plan context for GitHub readers.

## Proposed next step

Single concrete action the orchestrator or implementer should take next.

## Gates

- Gate C (n8n watcher): not authorized until explicit runtime session
- Gate D (Telegram): not authorized until after Gate C

## Out of scope

Runtime, n8n, v5/webhook, ALINA LAVORO, other repos unless listed in repo field.

## Notes for orchestrator

Window: CONTROL PLANE (arancione). Backlog: PM-09.
```

---

## Desired Telegram payload (brief)

Minimum message body — **no full plan text**, no tokens, no chat_id:

```text
CONTROL PLANE plan ingested
Repo: <repo>
Task: <task>
Risk: <risk>
Next: <next_step one line>
GitHub: <public commit or file path link>
Runtime gate: <yes/no>
```

Optional: attach a small Markdown file (same pattern as **`latest-gis-handoff.md`** on 02F) if length exceeds Telegram safe-text limits.

**Gate B does not send Telegram.** Payload shape is design-only until gate D.

---

## Anti-secrets rules

| Never in committed plan files or Telegram | Belongs in |
|-------------------------------------------|------------|
| Bot token, API keys, webhook secrets | n8n credentials / local env |
| Operational `chat_id` | n8n Telegram node UI |
| n8n credential IDs | n8n UI only |
| Private URLs with auth query params | Not in git |
| Full Cursor session transcripts with PII | Local only unless redacted |

Follow [OBSERVABILITY.md](OBSERVABILITY.md) evidence conventions when recording future gate results.

---

## Gate C — plan watcher design (delivered)

**Full design:** [PLAN_WATCHER_GATE_C.md](PLAN_WATCHER_GATE_C.md). **This section does not authorize runtime.**

### Objective

Detect commits that add or change files under `docs/plans/*.plan.md`, validate Gate B front matter, dedupe, and emit a normalized **`plan_detected`** event for Gate D. **No Telegram in Gate C.**

### Watcher scope

| Item | Detail |
|------|--------|
| **Path filter** | `docs/plans/*.plan.md` (Gate B naming) |
| **Primary repo (v1)** | `mrhz1973/control-plane` |
| **Input** | Markdown + YAML front matter |
| **Output** | `plan_detected` event (repo, path, commit SHA, summary, next_step, dedupe_key, github_file_url) |
| **Sample skip** | Files with `sample: true` in front matter → no event |
| **Dedupe** | Data Table key `plan:<repo>:<path>:<blob_or_commit_sha>` — skip on repeat poll |

### Architecture choice (deferred to runtime session)

| Option | Summary |
|--------|---------|
| **A — Extend 02F** | **Recommended** — isolated branch on control-plane commits; reuses sole active poll workflow ([PLAN_WATCHER_GATE_C.md](PLAN_WATCHER_GATE_C.md)) |
| **B — New PM-03 workflow** | Fallback — separate inactive workflow for manual test; avoids **02F** touch but duplicates poll |

**Not authorized now:** **02F** modification, new workflow, import, execution.

### Risks (summary)

02F regression on GIS handoff/commit notify; duplicate events without dedupe; invalid plans causing workflow failure; sample files misfiring. Mitigations in [PLAN_WATCHER_GATE_C.md § Risks](PLAN_WATCHER_GATE_C.md#risks-and-mitigations).

### Gate C runtime PASS (future)

Non-sample plan committed → watcher emits `plan_detected` once → sample skipped → duplicate poll skipped → no Telegram → **02F** smoke PASS if option A. See [PLAN_WATCHER_GATE_C.md § PASS criteria](PLAN_WATCHER_GATE_C.md#gate-c-runtime-pass-criteria-future).

---

## Future gates (one at a time)

| Gate | Scope | Runtime | Status |
|------|--------|---------|--------|
| **A — Docs / design** | This file + PM-09 backlog entry | **No** | **Delivered** |
| **B — Local file convention** | Path, naming, schema, `docs/plans/` + sample | **No** | **Delivered** |
| **C — n8n watcher design** | [PLAN_WATCHER_GATE_C.md](PLAN_WATCHER_GATE_C.md) — algorithm, dedupe, `plan_detected` | **No** (design only) | **Delivered** |
| **C — n8n watcher runtime** | Implement A or B in n8n | **Yes** — explicit gate; **not authorized** by this task | Pending |
| **D — Telegram notification** | Send summary/file after `plan_detected` | **Yes** — separate gate after C runtime PASS | Pending |

**Default posture unchanged:** **`02F`** remains sole active CP poll+handoff; v5 **off**; webhook **not configured**; C1 stays **PARTIAL** (D-C1-A).

---

## Future success criterion

**PASS** when all are true in a recorded runtime gate (post gate D):

1. User completes a Cursor Plan and saves/commits structured file per gate B convention.
2. Within accepted C1 SLA (1–5 min polling), orchestrator receives Telegram summary matching the desired payload shape.
3. Full plan content is readable on GitHub at a known path (public repo, no secrets).
4. No manual copy-paste of plan body into Telegram was required for that event.
5. ALINA LAVORO, dev-method, and GIS repos were **not** modified unless explicitly in scope of a future decision.

---

## Out of scope (this design)

- Runtime implementation, n8n workflow JSON, import/export
- Cursor IDE provider API or webhook integration
- v5 / GitHub production webhook / public HTTPS (see [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md))
- Strict C1 &lt;30s reopen (PM-01)
- **ALINA LAVORO**, **dev-method**, **cursor-coordinate-converter** changes
- Replacing or modifying **`02F`** without a separate explicit gate
