# Plan files (`docs/plans/`)

Structured **Cursor Plan** outputs saved for future orchestrator ingestion via GitHub (and eventually n8n → Telegram).

**PM-09 Gate B** — [PLAN_OUTPUT_INGESTION.md](../PLAN_OUTPUT_INGESTION.md). **Docs-only.** No runtime in this folder by itself.

---

## What this folder contains

- One Markdown file per plan event, with **YAML front matter** and required body sections.
- Input for **future** automation: n8n watcher (gate C) and Telegram summary (gate D).
- **Not yet read by n8n** — committing a plan file does **not** trigger Telegram or any workflow change today.

---

## Rules

| Rule | Detail |
|------|--------|
| **No secrets** | No tokens, chat_id, credential IDs, webhook URLs, passwords, or API keys |
| **One format** | Markdown + YAML front matter only — no JSON duplicate for the same event |
| **Sample files** | Clearly marked `sample` / `example` in front matter or filename; not for Telegram |
| **Real plans** | Commit when the orchestrator should read the plan on GitHub; human gate if `requires_human_gate: yes` |

---

## Naming convention

```text
docs/plans/YYYY-MM-DD_HHMM_<repo-short>_<task-slug>.plan.md
```

**Example:**

```text
docs/plans/2026-05-21_1230_control-plane_pm-09-gate-b.plan.md
```

- **repo-short:** `control-plane`, `dev-method`, `gis`, etc.
- **task-slug:** lowercase kebab-case (e.g. `pm-09-gate-b`)

---

## Required front matter

| Field | Values / notes |
|-------|----------------|
| `repo` | GitHub slug (e.g. `mrhz1973/control-plane`) |
| `task` | Short title or backlog ID |
| `mode` | `plan`, `agent`, or `ask` |
| `model` | Model name only |
| `effort` | `fast`, `medium`, `high`, or `none` |
| `risk` | `low`, `medium`, or `high` |
| `next_step` | One sentence |
| `requires_runtime` | `yes` or `no` |
| `requires_human_gate` | `yes` or `no` |
| `target_window` | `control-plane`, `dev-method`, `gis`, or `other` |
| `created_at` | ISO 8601 datetime |
| `source` | `cursor-plan` (fixed for v1) |
| `summary` | ≤500 chars, no secrets |

---

## Required body sections

1. `## Summary`
2. `## Proposed next step`
3. `## Gates`
4. `## Out of scope`
5. `## Notes for orchestrator`

Full schema: [PLAN_OUTPUT_INGESTION.md](../PLAN_OUTPUT_INGESTION.md#gate-b--file-convention-delivered).

---

## Example

Non-operational sample: [example-control-plane-plan.plan.md](example-control-plane-plan.plan.md).

**Do not** send the example file to Telegram. **Do not** treat it as a runtime trigger.
