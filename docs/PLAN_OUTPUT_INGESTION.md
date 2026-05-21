# Cursor Plan output ingestion (design)

**PM-09** — [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md). **Docs-only design.** No runtime, n8n workflow, Telegram API, or provider integration from this document.

**Related:** [MVP_STATUS.md](MVP_STATUS.md), [RUNTIME_GATES.md](RUNTIME_GATES.md), [OBSERVABILITY.md](OBSERVABILITY.md), [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md).

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
  → structured plan file committed in repo (control-plane or watched repo — TBD at gate B)
  → GitHub push / commit visible to existing multirepo watcher (02F or successor)
  → n8n detects new/changed plan file (path convention — gate C)
  → Telegram: brief summary + optional document or GitHub link (gate D)
  → orchestrator reads full plan from GitHub (no secrets in message body)
```

**Not in scope now:** new n8n workflow creation, v5 webhook, strict C1 &lt;30s reopen, ALINA LAVORO, dev-method or GIS repo changes, Cursor provider/API hooks.

---

## Desired saved Plan format

One file per plan event (exact path convention = **gate B**). Suggested fields:

| Field | Purpose |
|-------|---------|
| **repo** | Target or context repo slug (e.g. `mrhz1973/control-plane`) |
| **task** | Short task title or backlog ID |
| **mode** | Cursor mode (e.g. `plan`, `agent`, `ask`) |
| **model** | Model name used for the plan (no API keys) |
| **effort** | Effort setting if applicable (e.g. `fast`, `medium`) |
| **risk** | `low` / `medium` / `high` — orchestrator routing hint |
| **next_step** | One concrete next action sentence |
| **requires_runtime** | `yes` / `no` — whether next step needs n8n/VPS/SSH |
| **requires_human_gate** | `yes` / `no` — whether user confirmation is required before execution |
| **summary** | Plain-text plan summary (bounded length; no secrets) |

**Format preference:** Markdown with YAML front matter **or** JSON — choose one at gate B; do not commit both for the same event.

**Example shape (illustrative only — not a live path):**

```markdown
---
repo: mrhz1973/control-plane
task: PM-09 plan output ingestion
mode: plan
model: composer-2.5
effort: fast
risk: low
next_step: "Adopt file convention under docs/plans/ and document in POST_MVP_BACKLOG."
requires_runtime: no
requires_human_gate: yes
---

## Summary
Design-only backlog for structured Plan saves and future Telegram/GitHub orchestration.
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

## Future gates (one at a time)

| Gate | Scope | Runtime |
|------|--------|---------|
| **A — Docs / design** | This file + PM-09 backlog entry | **No** |
| **B — Local file convention** | Path, naming, front-matter schema, example under `docs/plans/` or agreed dir | **No** — docs + optional sample file only |
| **C — n8n watcher** | Extend **02F** or **new workflow** (PM-03) to match plan path on commit poll | **Yes** — explicit [RUNTIME_GATES.md](RUNTIME_GATES.md) session; **does not authorize** creation in gate A |
| **D — Telegram notification** | Send summary/file after gate C detects new plan file | **Yes** — separate gate after C |

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
