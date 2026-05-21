# MVP status (consolidated)

## Document role

| | |
|---|---|
| **Ruolo** | Stato **corrente** dei criteri MVP e runtime snapshot |
| **Cambia** | Ogni volta che un criterio passa di stato (es. PENDING → PASS) |
| **NON contiene** | Definizione canonica di cosa significa PASS |
| **Definizione canonica** | Vive in [MVP_CRITERIA.md](MVP_CRITERIA.md) |

Single-page snapshot of Automation MVP progress. Details live in linked docs; this file is the index.

**Last consolidated:** after **PM-09 Gate C + D + FILE PASS** and **final CONTROL PLANE n8n list cleanup** (4 workflows). MVP **accepted-with-exception** (D-C1-A).

**Docs-only:** reading or editing this file does not run n8n, open tunnels, or configure webhooks.

---

## Closure overview

MVP is **strictly closed** only when all five criteria in [MVP_CRITERIA.md](MVP_CRITERIA.md) are **PASS**.

**Operational MVP (2026-05-21):** **Accepted / closed with C1 latency exception** — decision **D-C1-A**. **Not** strict **5/5 PASS**.

**Scorecard:** C1 **PARTIAL** (accepted final operational exception) · C2–C5 **PASS**

## Orchestrator handoff snapshot (post-MVP)

- **MVP:** operationally accepted / closed — C1 latency exception (**D-C1-A**); **not** strict 5/5 PASS
- **Criteria:** C1 PARTIAL (accepted SLA 1–5 min) · C2–C5 PASS
- **Runtime:** **`40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE`** — sole CP poll+handoff, **published**, 1 min; final n8n list = **4 workflows** (`40` ACTIVE · `30` / `20` / `01` OFF) — [final n8n cleanup](sessions/2026-05-21-control-plane-final-n8n-cleanup.md); backup `40` and **`55`** test-safe **deleted** from UI after PM-09 PASS · v5 **off** · webhook **not configured**
- **Post-MVP:** PM-09 Gate **C + D + FILE PASS** in active `40` — [runtime-packets/pm-09-gate-c-runtime-pass.md](runtime-packets/pm-09-gate-c-runtime-pass.md), [Gate D file attachment](sessions/2026-05-21-control-plane-40-gate-d-file-attachment-pass.md)
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
| **Active path** | Multirepo v4 polling + handoff + PM-09 Gate C detection + Gate D Telegram — **active** (**`40`**, formerly **`02F`**) |
| **Active workflow** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` — **published**, 1 min; sole CP production polling target |
| **PM-09 Gate C** | **Runtime PASS** — detects `docs/plans/*.plan.md` ([runtime PASS](runtime-packets/pm-09-gate-c-runtime-pass.md)) |
| **PM-09 Gate D** | **Runtime PASS** — `plan_detected` Telegram text ([Gate D live](sessions/2026-05-21-control-plane-40-gate-d-live-pass.md)) + `.md` file attachment ([Gate D file](sessions/2026-05-21-control-plane-40-gate-d-file-attachment-pass.md)) |
| **CONTROL PLANE n8n list** | **4 workflows** — `40` **ACTIVE** · `30` / `20` / `01` **OFF** ([N8N_WORKFLOW_NAMING.md](N8N_WORKFLOW_NAMING.md)) |
| **UI cleanup (2026-05-21)** | **Deleted** after PM-09 PASS: backup `40` (`BACKUP BEFORE GATE D FILE`); `55` test-safe (`plan detected Telegram Gate D TEST SAFE`) — [session](sessions/2026-05-21-control-plane-final-n8n-cleanup.md) |
| **Prior cleanup (PM-07)** | Removed `02`, `02B`–`02E`, `90`–`93` from list ([POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md)) |
| **GitHub read** | Authenticated GitHub API credential in n8n UI |
| **Flow** | GitHub → dedupe → Telegram; GIS commit → safe-text handoff + **`latest-gis-handoff.md`**; control-plane plan commit → Gate C detect → Gate D Telegram text + `.md` file |
| **GIS handoff (`40` / ex-02F)** | **PASS** — `58c5c46`; safe text + file attachment ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)) |
| **Handoff manual fallback** | `30 - CP handoff manual Telegram v1 - OFF` — inactive; manual test path |
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
- **Post-MVP:** **40** / historical **02F** GIS handoff **PASS** — `58c5c46`; safe-text Telegram + **`latest-gis-handoff.md`** document; exit 0. Prior: `2a2ff31` via experimental `02` path ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)).

### 3 — Three end-to-end cycles (PASS — 3 / 3)

- **Cycle 1:** **PASS** (2026-05-20) — `cursor-coordinate-converter`, commit **`34d543d`**.
- **Cycle 2:** **PASS** (2026-05-20) — `dev-method`, commit **`5ce0a25`**; multirepo **draft** notifica (`Previous: none`).
- **Cycle 3:** **PASS** (2026-05-20) — `dev-method`, commit **`0be529d`**; multirepo **draft** notifica (`Previous: 5ce0a25`); dedupe **1** new + **2** duplicate-skip. File `docs/control-plane-cycle3-note.md`.
- **Criterion 3 closed** — all three cycles evidenced.

### 4 — Workflow export (PASS)

- Redacted exports live in `workflows/exports/` and include historical `02F` plus `40` Gate C+D+FILE candidates.
- **Runtime match:** PASS for criterion 4 visual operational match; see [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) for verified vs not-verified perimeter.
- **Gate C+D+FILE candidate validated in active 40:** `workflows/exports/2026-05-21_40-plan-watcher-dropin-candidate-gate-c-gate-d-file.redacted.json` ([Gate D file PASS](sessions/2026-05-21-control-plane-40-gate-d-file-attachment-pass.md)); prior Gate C-only: `2026-05-21_40-plan-watcher-dropin-candidate-gate-c.redacted.json` ([runtime PASS](runtime-packets/pm-09-gate-c-runtime-pass.md)).
- Criterion 4 **not** reopened; C1 **not** relabeled PASS.

### 5 — Rebuild runbook (PASS)

- **2026-05-20:** FIELD validation **PASS** — non-destructive **recovery drill** ([N8N_REBUILD.md § FIELD result](N8N_REBUILD.md#field-validation-checklist-criterion-5)): workflows + Data Table + credential evidenced; **active v4** duplicate-skip smoke **PASS** (no new Telegram).
- Clean VPS full rebuild **not** performed — documented and accepted for criterion 5.
- No v5, webhook, volume wipe, or new import in this gate.

---

## PM-09 status

PM-09 Gate **A** + **B** + **C design** + **C runtime** + **D live text** + **D .md file attachment** are **PASS**.

Active production workflow **`40`** is **published** and scheduled (1 min). Final n8n list: **`40` ACTIVE** · **`30` / `20` / `01` OFF** (4 workflows). Backup `40` and **`55`** test-safe workflow **deleted** from n8n UI after Gate C+D+FILE PASS (reduce list confusion). v5 **off**; webhook **not configured**. **ALINA LAVORO**, **GIS**, and **dev-method** **not** touched.

Gate C + D branch in active `40`:

```text
Code - Plan watcher repo gate stub
→ GitHub - Fetch commit details (plan files)
→ Code - Detect real docs/plans plan files
→ IF - plan_detected?
→ Format Gate D Telegram plan_detected message
→ Telegram - Send Gate D plan_detected
→ (file path) HTTP fetch → disk write → Telegram - Send Gate D plan file
```

Evidence: [runtime-packets/pm-09-gate-c-runtime-pass.md](runtime-packets/pm-09-gate-c-runtime-pass.md) · [Gate D live](sessions/2026-05-21-control-plane-40-gate-d-live-pass.md) · [Gate D file attachment](sessions/2026-05-21-control-plane-40-gate-d-file-attachment-pass.md).

---

## Post-MVP (no immediate runtime gate)

**D-C1-A recorded (2026-05-21):** Operational MVP **accepted** — [decision packet](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md) (**DECIDED**). No mandatory next gate. Ordered optional work: **[POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md)** (PM-01 … PM-09).

**Default:** Keep v4 active, v5 off, no webhook. Stabilize; **do not batch runtime** changes ([RUNTIME_GATES.md](RUNTIME_GATES.md) — docs-only updates may be batched).

---

## After v4 match (suggested order)

| Order | Gate | Doc |
|-------|------|-----|
| A | ~~v4 runtime ↔ export match~~ | **Done** — criterion 4 PASS |
| B | ~~Handoff n8n manual + Telegram~~ | **Done** — criterion 2 PASS |
| C | ~~End-to-end cycle 1 → 3~~ | **Done** — criterion 3 **PASS** (3/3) |
| D | ~~C1 closure decision~~ | **Done** — **D-C1-A** operational acceptance 2026-05-21 |
| E | ~~Rebuild field validation~~ | **Done** — criterion 5 **PASS** (recovery drill 2026-05-20) |
| F | ~~PM-09 Gate C + D + FILE~~ | **Done** — active `40`: Gate C detect + Gate D Telegram text + `.md` file attachment |
| G | Public HTTPS → webhook → v5 | **Post-MVP optional** — not next automatic gate |

---

## Do not do (docs-only / safety)

- Configure GitHub webhook to localhost or tunnel URL
- Enable or activate v5 production webhook path
- Modify **Alina** workflows or **alina-lavoro** repo
- Commit token, chat_id, webhook URL, or secrets
- Edit `workflows/exports/*.json` in docs-only tasks
- Open n8n UI or run runtime as part of a docs-only batch
- Touch GIS repo automation beyond normal watched scope
- Reopen PM-09 Gate D without an explicit new runtime gate

---

## Doc map

| Doc | Role |
|-----|------|
| [MVP_CRITERIA.md](MVP_CRITERIA.md) | Five closure criteria (authoritative text) |
| [MVP_STATUS.md](MVP_STATUS.md) | This consolidated index |
| [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md) | Post-MVP optional backlog (PM-01 … PM-09) |
| [PLAN_OUTPUT_INGESTION.md](PLAN_OUTPUT_INGESTION.md) | PM-09 design — Cursor Plan → GitHub/Telegram |
| [PLAN_WATCHER_GATE_C.md](PLAN_WATCHER_GATE_C.md) | PM-09 Gate C + D status |
| [runtime-packets/pm-09-gate-c-runtime-pass.md](runtime-packets/pm-09-gate-c-runtime-pass.md) | PM-09 Gate C runtime PASS evidence |
| [runtime-packets/pm-09-gate-c-extend-02f-plan-watcher.md](runtime-packets/pm-09-gate-c-extend-02f-plan-watcher.md) | PM-09 Gate C runtime packet (historical filename) |
| [runtime-packets/pm-09-gate-c-02f-json-draft.md](runtime-packets/pm-09-gate-c-02f-json-draft.md) | PM-09 historical 02F JSON import draft |
| [plans/README.md](plans/README.md) | PM-09 plan file directory and schema |
| [RUNTIME_GATES.md](RUNTIME_GATES.md) | One-step runtime gates |
| [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) | Telegram / n8n PASS history |
| [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) | HTTPS before webhook |
| [N8N_REBUILD.md](N8N_REBUILD.md) | VPS recovery runbook |
| [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) | Criterion 2 design |
| [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) | Criterion 3 tracker |
| [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) | Criterion 4 inventory + v4 match perimeter |
| [N8N_WORKFLOW_NAMING.md](N8N_WORKFLOW_NAMING.md) | n8n numeric naming (`40` production; `41`–`43` candidates; final 4-workflow list) |
| [sessions/2026-05-21-control-plane-pm09-final-docs-close.md](sessions/2026-05-21-control-plane-pm09-final-docs-close.md) | PM-09 docs consolidation close (2026-05-21) |
| [sessions/2026-05-21-control-plane-final-n8n-cleanup.md](sessions/2026-05-21-control-plane-final-n8n-cleanup.md) | Final n8n UI list cleanup — backup `40` + `55` deleted (2026-05-21) |
| [V4_POLLING_LATENCY.md](V4_POLLING_LATENCY.md) | Criterion 1 latency measurement plan |
