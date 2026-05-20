# Observability and audit (docs-first)

**PM-04** — [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md). **No runtime by default** from this guide.

**Related:** [MVP_STATUS.md](MVP_STATUS.md), [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [N8N_REBUILD.md](N8N_REBUILD.md), [RUNTIME_GATES.md](RUNTIME_GATES.md), [workflows/README.md](../workflows/README.md).

---

## Scope

| Rule | Detail |
|------|--------|
| **Mode** | Docs-only conventions — repeatable, safe future verification |
| **Runtime** | **Not** authorized by this file; each test needs an explicit [RUNTIME_GATES.md](RUNTIME_GATES.md) session |
| **Secrets** | **Never** in git — no tokens, chat_id, credential IDs, webhook URLs, webhook secrets |
| **Data Table** | **No** full dumps in git — key names and public SHAs only when needed |
| **MVP posture** | Operationally **accepted with C1 exception** (D-C1-A); C1 **PARTIAL** (SLA 1–5 min); v4 **active**; v5 **off**; webhook **not configured** |

**Purpose:** Make post-MVP checks auditable without expanding attack surface or bureaucracy.

---

## Runtime evidence convention

When recording a **future** manual or runtime gate in control-plane docs (e.g. gate tables, cycle log, TELEGRAM_SETUP note):

### Allowed in committed docs

| Field | Example |
|-------|---------|
| Workflow name | `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4` |
| Date/time | `2026-05-21` or `2026-05-21 ~23:51` (approximate OK) |
| Result | **PASS** / **FAIL** / **PARTIAL** |
| Main nodes traversed | `Manual Trigger → GitHub → Prepare → Data Table get → Decide → IF → duplicate skip` |
| Telegram outcome | **received** / **not sent** / **duplicate skip** (no message body required) |
| Public commit SHA | `0be529d` or full public GitHub SHA — watched repos only |
| Repo | `mrhz1973/dev-method` (public slug) |
| Data Table key name | `github:mrhz1973/dev-method:last_commit_sha` |
| Short value in key | Public commit SHA already on GitHub — not a secret |

### Forbidden in committed docs

| Forbidden | Why |
|-----------|-----|
| Bot token, API keys | Security |
| Operational `chat_id` | Security |
| n8n credential IDs | Security |
| Production webhook URL or secret | Security |
| Full Telegram message payloads with private content | Privacy / noise |
| Unredacted n8n execution JSON | May embed secrets |
| Full Data Table row dumps | Volume + accidental leakage |
| SSH passwords, tunnel tokens | Security |

**Rule:** If unsure, write **less** — outcome and node names, not raw UI exports.

---

## Data Table audit notes (`control_plane_state`)

| Do | Do not |
|----|--------|
| Record **key names** present or added (e.g. `github:mrhz1973/control-plane:last_commit_sha`) | Commit CSV/JSON export of the table |
| Record **public** last-seen SHA when tied to a known GitHub commit | Commit `note` field text if it contains operational secrets |
| Note **count** of keys or which repos have keys | Automate backup into this repo without redaction review |
| Say whether a manual run **updated** a key (yes/no) | Treat `last_push_head_sha` or other keys as mandatory for every test |

**Real backup** of Data Table contents (n8n export, DB copy) = **separate future backlog item** with its own explicit runtime gate — not part of PM-04 docs-first delivery.

---

## Workflow export refresh policy

Re-export and commit under `workflows/exports/` **only when**:

1. Active runtime workflow **diverges materially** from the committed redacted JSON (nodes, schedule interval, repo list, dedupe path, Telegram format).
2. You can describe the delta in the commit message or a short doc note (what changed, why).
3. Redaction pass is complete — [workflows/README.md](../workflows/README.md) rules; placeholders for chat_id and credential ID only.

**Do not** refresh exports for:

- Every micro manual test or duplicate-skip smoke
- UI-only credential linkage that already differs by design
- Experiments left **inactive** in n8n (e.g. multirepo **draft** — document in [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) instead)

After refresh: update [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) if canonical or draft status changed. Criterion 4 reopens until match is re-recorded.

---

## Manual test evidence template

Copy for a **docs-only** record after a future gated manual test (fill in; do not paste secrets).

```markdown
### Test: <short name>
| Field | Value |
|-------|--------|
| **Date** | YYYY-MM-DD (approx time optional) |
| **Workflow** | <exact n8n workflow name> |
| **Trigger** | Manual / Schedule (which was used for this test) |
| **Expected** | <one line> |
| **Actual** | PASS / FAIL — <one line> |
| **Telegram** | sent yes/no — duplicate skip yes/no |
| **Data Table** | changed yes/no — keys touched: <key names only> |
| **Runtime changed** | yes/no (import, schedule, webhook, v5) |
| **Follow-up** | none / doc commit / separate gate ID |
```

**Not a procedure:** This template does not authorize opening n8n, SSH, or Telegram sends — record **after** the user runs the gate.

---

## Post-MVP posture (unchanged by this doc)

- **No automatic next runtime gate** from observability work alone.
- Strict C1 &lt;30s, multirepo promotion, new workflows: [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md) — each **optional**, **gated**.
- Observability stays **docs-first** until a backlog item explicitly requires runtime.
