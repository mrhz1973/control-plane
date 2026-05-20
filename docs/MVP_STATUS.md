# MVP status (consolidated)

## Document role

| | |
|---|---|
| **Ruolo** | Stato **corrente** dei criteri MVP e runtime snapshot |
| **Cambia** | Ogni volta che un criterio passa di stato (es. PENDING → PASS) |
| **NON contiene** | Definizione canonica di cosa significa PASS |
| **Definizione canonica** | Vive in [MVP_CRITERIA.md](MVP_CRITERIA.md) |

Single-page snapshot of Automation MVP progress. Details live in linked docs; this file is the index.

**Last consolidated:** after local CLI handoff dry-run PASS (2026-05-20). Update this file when a criterion changes.

**Docs-only:** reading or editing this file does not run n8n, open tunnels, or configure webhooks.

---

## Closure overview

MVP is **closed** only when all five criteria in [MVP_CRITERIA.md](MVP_CRITERIA.md) are fully **PASS**.

**Day 5 rule:** If all 5 are not true by Day 5, do **not** add Ollama on Day 6. Stabilize first.

| # | Criterion | Status | Detail doc |
|---|-----------|--------|------------|
| 1 | Push → Telegram &lt;30s | **PARTIAL** — v4 polling provisional; sub-30s pending | [MVP_CRITERIA.md](MVP_CRITERIA.md) §1, [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) |
| 2 | handoff-generate.mjs via n8n → `Prompt ready: yes/no` | **LOCAL CLI PASS / PENDING N8N + TELEGRAM** | [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) |
| 3 | 3 real cycles handoff → implementer → commit → notifica | **DOCUMENTED** — **0 / 3 PASS** | [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) |
| 4 | Workflow JSON redacted in repo | **PASS** — runtime v4 visual match | [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) |
| 5 | Rebuild from zero if VPS dies | **PARTIAL / DOCUMENTED** — pending field validation | [N8N_REBUILD.md](N8N_REBUILD.md) |

---

## Runtime snapshot (current)

| Component | State |
|-----------|--------|
| **Provisional MVP path** | v4 one-minute polling — **active and stable** |
| **v4 workflow** | `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4` |
| **v4 flow** | GitHub public read → Data Table `control_plane_state` → dedupe → Telegram |
| **v5 webhook workflow** | Imported, manually tested (placeholder), **inactive / disabled** |
| **GitHub production webhook** | **Not configured** — localhost / tunnel not reachable by GitHub |
| **Public HTTPS gate** | Documented, not done — [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) |
| **Telegram bot** | `@mrhz_control_plane_mvp_bot` — credential in n8n (PASS history in [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)) |
| **Secrets in repo** | None — no token, chat_id, webhook URL, or webhook secret committed |

---

## Criterion summaries

### 1 — Push notification (partial)

- **Working:** Telegram, n8n credential, GitHub public read, Data Table dedupe, v4 controlled polling.
- **Provisional:** v4 satisfies “notify on new commit” but **not** strict sub-30-second delivery.
- **Pending:** sub-30s path needs webhook + public HTTPS, or measured latency per [V4_POLLING_LATENCY.md](V4_POLLING_LATENCY.md).

### 2 — Handoff via n8n (LOCAL CLI PASS / pending n8n + Telegram)

- **Local CLI (2026-05-20):** `handoff-generate.mjs` dry-run from dev-method → target GIS repo → **`Prompt ready: yes`** ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)).
- **Still open for criterion 2:** n8n must invoke the script and Telegram must deliver **`Prompt ready: yes/no`** on the user's phone.
- **Next gate:** n8n manual workflow test (workflow freeze applies — handoff workflow is criterion 2 exception when built).

### 3 — Three end-to-end cycles (0 / 3)

- Tracker template ready; no completed PASS cycles recorded.
- Notification may use v4 polling until webhook exists.

### 4 — Workflow export (PASS)

- **7** redacted exports in `workflows/exports/`.
- **Canonical:** `2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json`
- **Runtime match:** PASS — visual operational match recorded; see [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) for verified vs not-verified perimeter.
- **Still pending outside §4:** handoff workflow export after criterion 2 runtime.

### 5 — Rebuild runbook (partial)

- [N8N_REBUILD.md](N8N_REBUILD.md) is operational; not yet validated on a clean VPS.

---

## Recommended next runtime gate

Pick **one** gate per [RUNTIME_GATES.md](RUNTIME_GATES.md) session. Suggested priorities:

### Option A — Criterion 2 (handoff n8n + Telegram)

n8n manual test: invoke `handoff-generate.mjs` → Telegram `Prompt ready: yes/no`. Local CLI already PASS ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)). See [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md).

### Option B — Criterion 1 latency measurement

Three timed commits on a watched repo; record push vs Telegram timestamps. See [V4_POLLING_LATENCY.md](V4_POLLING_LATENCY.md). Expect **PARTIAL** if interval remains 1 minute.

Do **not** in the same session: enable v5, configure GitHub webhook, or create new n8n workflows ([workflow freeze rule](RUNTIME_GATES.md#workflow-freeze-rule-mvp)).

---

## After v4 match (suggested order)

| Order | Gate | Doc |
|-------|------|-----|
| A | ~~v4 runtime ↔ export match~~ | **Done** — criterion 4 PASS |
| B | Handoff script + n8n manual test | [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) |
| C | v4 latency measurement (3 commits) | [V4_POLLING_LATENCY.md](V4_POLLING_LATENCY.md) |
| D | End-to-end cycle 1 → 3 | [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) |
| E | Rebuild field validation | [N8N_REBUILD.md](N8N_REBUILD.md) |
| F | Public HTTPS → webhook → v5 (optional strict &lt;30s) | [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) |

---

## Do not do (docs-only / safety)

- Configure GitHub webhook to localhost or tunnel URL
- Enable or activate v5 production webhook path
- Modify **Alina** workflows or **alina-lavoro** repo
- Commit token, chat_id, webhook URL, or secrets
- Edit `workflows/exports/*.json` in docs-only tasks
- Open n8n UI or run runtime as part of a docs-only batch
- Touch GIS repo automation beyond normal watched scope

---

## Doc map

| Doc | Role |
|-----|------|
| [MVP_CRITERIA.md](MVP_CRITERIA.md) | Five closure criteria (authoritative text) |
| [MVP_STATUS.md](MVP_STATUS.md) | This consolidated index |
| [RUNTIME_GATES.md](RUNTIME_GATES.md) | One-step runtime gates |
| [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) | Telegram / n8n PASS history |
| [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) | HTTPS before webhook |
| [N8N_REBUILD.md](N8N_REBUILD.md) | VPS recovery runbook |
| [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) | Criterion 2 design |
| [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) | Criterion 3 tracker |
| [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) | Criterion 4 inventory + v4 match perimeter |
| [V4_POLLING_LATENCY.md](V4_POLLING_LATENCY.md) | Criterion 1 latency measurement plan |
