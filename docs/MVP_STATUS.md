# MVP status (consolidated)

## Document role

| | |
|---|---|
| **Ruolo** | Stato **corrente** dei criteri MVP e runtime snapshot |
| **Cambia** | Ogni volta che un criterio passa di stato (es. PENDING → PASS) |
| **NON contiene** | Definizione canonica di cosa significa PASS |
| **Definizione canonica** | Vive in [MVP_CRITERIA.md](MVP_CRITERIA.md) |

Single-page snapshot of Automation MVP progress. Details live in linked docs; this file is the index.

**Last consolidated:** after **PM-09** plan ingestion design (docs-only). MVP **accepted-with-exception** (D-C1-A). Update when criterion or runtime posture changes.

**Docs-only:** reading or editing this file does not run n8n, open tunnels, or configure webhooks.

---

## Closure overview

MVP is **strictly closed** only when all five criteria in [MVP_CRITERIA.md](MVP_CRITERIA.md) are **PASS**.

**Operational MVP (2026-05-21):** **Accepted / closed with C1 latency exception** — decision **D-C1-A**. **Not** strict **5/5 PASS**.

**Scorecard:** C1 **PARTIAL** (accepted final operational exception) · C2–C5 **PASS**

## Orchestrator handoff snapshot (post-MVP)

- **MVP:** operationally accepted / closed — C1 latency exception (**D-C1-A**); **not** strict 5/5 PASS
- **Criteria:** C1 PARTIAL (accepted SLA 1–5 min) · C2–C5 PASS
- **Runtime:** **`02F`** active/published (sole CP poll+handoff); cleanup **PASS**; `01`/`03`/`20` retained off · v5 **off** · webhook **not configured**
- **Post-MVP:** PM-02 + PM-06 + PM-07 + PM-08 **PASS**; PM-09 **proposed** (docs-only, no runtime) — [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md)
- **ALINA LAVORO:** out of scope / not touched

**Day 5 rule:** If all 5 are not true by Day 5, do **not** add Ollama on Day 6. Stabilize first.

| # | Criterion | Status | Detail doc |
|---|-----------|--------|------------|
| 1 | Push → Telegram &lt;30s | **PARTIAL** — **D-C1-A** accepted (SLA 1–5 min); not technical PASS | [MVP_CRITERIA.md](MVP_CRITERIA.md) §1, [decision packet](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md) |
| 2 | handoff-generate.mjs via n8n → `Prompt ready: yes/no` | **PASS** | [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) |
| 3 | 3 real cycles handoff → implementer → commit → notifica | **PASS** — **3 / 3** | [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) |
| 4 | Workflow JSON redacted in repo | **PASS** | [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) |
| 5 | Rebuild from zero if VPS dies | **PASS** — recovery drill 2026-05-20 ([N8N_REBUILD.md](N8N_REBUILD.md)) | [N8N_REBUILD.md](N8N_REBUILD.md) |

---

## Runtime snapshot (current)

| Component | State |
|-----------|--------|
| **Active path** | Multirepo v4 polling + handoff — **active** (`02F` **PASS**) |
| **Active workflow** | `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` — **published**, 1 min; sole CP polling target |
| **Cleanup** | **PASS** — removed `02`, `02B`–`02E`, `90`–`93` from CONTROL PLANE list ([POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md) PM-07) |
| **Retained (not active poll)** | `01` legacy **off**; `03` handoff manual fallback; `20` v5 webhook **off** |
| **GitHub read** | Authenticated GitHub API credential in n8n UI |
| **Flow** | GitHub → dedupe → Telegram; GIS commit → safe-text handoff preview + **`latest-gis-handoff.md`** document |
| **GIS handoff (02F)** | **PASS** — `58c5c46`; safe text + file attachment ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)) |
| **Handoff manual fallback** | `03` handoff manual workflow — inactive; manual test path |
| **v5 webhook workflow** | Imported, manually tested (placeholder), **inactive / disabled** |
| **GitHub production webhook** | **Not configured** — localhost / tunnel not reachable by GitHub |
| **Public HTTPS gate** | Documented, not done — [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) |
| **Telegram bot** | `@mrhz_control_plane_mvp_bot` — credential in n8n (PASS history in [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)) |
| **Secrets in repo** | None — no token, chat_id, webhook URL, or webhook secret committed |

---

## Criterion summaries

### 1 — Push notification (PARTIAL — operational exception)

- **D-C1-A (2026-05-21):** Accepted as **final operational exception** — SLA best-effort **1–5 min** via v4 polling. Criterion **not** relabeled PASS.
- **Working:** Telegram, n8n credential, GitHub public read, Data Table dedupe, v4 controlled polling.
- **Strict &lt;30s:** Deferred — post-MVP optional ([PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) / v5) only if explicitly reopened.

### 2 — Handoff via n8n (PASS)

- **2026-05-20:** Manual workflow — Manual Trigger → **`Prompt ready: yes`**, exit 0 ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)).
- **Post-MVP:** **02F** GIS handoff **PASS** — `58c5c46`; safe-text Telegram + **`latest-gis-handoff.md`** document; exit 0. Prior: `2a2ff31` via experimental `02` path ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)).

### 3 — Three end-to-end cycles (PASS — 3 / 3)

- **Cycle 1:** **PASS** (2026-05-20) — `cursor-coordinate-converter`, commit **`34d543d`**.
- **Cycle 2:** **PASS** (2026-05-20) — `dev-method`, commit **`5ce0a25`**; multirepo **draft** notifica (`Previous: none`).
- **Cycle 3:** **PASS** (2026-05-20) — `dev-method`, commit **`0be529d`**; multirepo **draft** notifica (`Previous: 5ce0a25`); dedupe **1** new + **2** duplicate-skip. File `docs/control-plane-cycle3-note.md`.
- **Criterion 3 closed** — all three cycles evidenced.

### 4 — Workflow export (PASS)

- **9** redacted exports in `workflows/exports/` (includes **02F**).
- **Canonical:** `2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json`
- **Runtime match:** PASS — visual operational match recorded; see [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) for verified vs not-verified perimeter.
- **02F export:** `2026-05-21_…-02f-handoff-safe-text.redacted.json` committed (PM-08); `active=false` in repo; runtime **not** imported ([WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md)). Criterion 4 **not** reopened; C1 **not** relabeled PASS.

### 5 — Rebuild runbook (PASS)

- **2026-05-20:** FIELD validation **PASS** — non-destructive **recovery drill** ([N8N_REBUILD.md § FIELD result](N8N_REBUILD.md#field-validation-checklist-criterion-5)): workflows + Data Table + credential evidenced; **active v4** duplicate-skip smoke **PASS** (no new Telegram).
- Clean VPS full rebuild **not** performed — documented and accepted for criterion 5.
- No v5, webhook, volume wipe, or new import in this gate.

---

## Post-MVP (no immediate runtime gate)

**D-C1-A recorded (2026-05-21):** Operational MVP **accepted** — [decision packet](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md) (**DECIDED**). No mandatory next gate. Ordered optional work: **[POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md)** (PM-01 … PM-05).

**Default:** Keep v4 active, v5 off, no webhook. Stabilize; do not batch runtime changes.

---

## After v4 match (suggested order)

| Order | Gate | Doc |
|-------|------|-----|
| A | ~~v4 runtime ↔ export match~~ | **Done** — criterion 4 PASS |
| B | ~~Handoff n8n manual + Telegram~~ | **Done** — criterion 2 PASS |
| C | ~~End-to-end cycle 1 → 3~~ | **Done** — criterion 3 **PASS** (3/3) |
| D | ~~C1 closure decision~~ | **Done** — **D-C1-A** operational acceptance 2026-05-21 |
| E | ~~Rebuild field validation~~ | **Done** — criterion 5 **PASS** (recovery drill 2026-05-20) |
| F | Public HTTPS → webhook → v5 | **Post-MVP optional** — not next automatic gate |

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
| [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md) | Post-MVP optional backlog (PM-01 … PM-09) |
| [PLAN_OUTPUT_INGESTION.md](PLAN_OUTPUT_INGESTION.md) | PM-09 design — Cursor Plan → GitHub/Telegram (docs-only) |
| [RUNTIME_GATES.md](RUNTIME_GATES.md) | One-step runtime gates |
| [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) | Telegram / n8n PASS history |
| [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) | HTTPS before webhook |
| [N8N_REBUILD.md](N8N_REBUILD.md) | VPS recovery runbook |
| [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) | Criterion 2 design |
| [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) | Criterion 3 tracker |
| [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) | Criterion 4 inventory + v4 match perimeter |
| [V4_POLLING_LATENCY.md](V4_POLLING_LATENCY.md) | Criterion 1 latency measurement plan |
