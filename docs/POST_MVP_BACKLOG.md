# Post-MVP backlog (control-plane)

**Docs-only index.** No runtime, webhook, v5, or workflow changes from this file.

**Related:** [MVP_STATUS.md](MVP_STATUS.md), [decision packet D-C1-A](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md), [RUNTIME_GATES.md](RUNTIME_GATES.md).

---

## Status header

| Item | State |
|------|--------|
| **MVP** | Operationally **accepted / closed** with **C1 latency exception** |
| **Decision** | **D-C1-A** (2026-05-21) — **not** strict **5/5 PASS** |
| **C1** | **PARTIAL** accepted — SLA best-effort **1–5 min** (v4 polling) |
| **C2–C5** | **PASS** |
| **v4 multirepo watcher** | **Active** — `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` (1 min; formerly **`02F`**) |
| **CONTROL PLANE n8n list** | **4 workflows** — **`40` ACTIVE** · **`30` / `20` / `01` OFF** — [N8N_WORKFLOW_NAMING.md](N8N_WORKFLOW_NAMING.md), [final n8n cleanup](sessions/2026-05-21-control-plane-final-n8n-cleanup.md) |
| **v4 single-repo legacy** | **Off** — `01 - CP v4 single-repo polling - LEGACY OFF` |
| **v5** | **Off** |
| **Webhook** | **Not configured** |
| **02F redacted export** | **PASS** — [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) PM-08 |
| **PM-09 plan ingestion** | Gate **C + D + FILE PASS** (closed) — [Gate C runtime](runtime-packets/pm-09-gate-c-runtime-pass.md), [Gate D live](sessions/2026-05-21-control-plane-40-gate-d-live-pass.md), [Gate D file](sessions/2026-05-21-control-plane-40-gate-d-file-attachment-pass.md), [docs close](sessions/2026-05-21-control-plane-pm09-final-docs-close.md) |
| **Next runtime** | **No new runtime required** for PM-09 closure |

---

## Backlog items

### PM-01 — Strict C1 &lt;30s (push → Telegram)

| Field | Value |
|-------|--------|
| **Status** | Optional — **reopen only** by explicit user decision (former **D-C1-B**) |
| **Why** | Canonical criterion text requires &lt;30s; D-C1-A accepted 1–5 min instead |
| **Blocked by** | **D-C1-B not selected**; operational MVP already closed on D-C1-A |
| **Docs** | [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md), [V4_POLLING_LATENCY.md](V4_POLLING_LATENCY.md), [decision packet](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md) |
| **Runtime** | **Yes** — future gate(s) only: public HTTPS → v5 → GitHub webhook |
| **Risk** | Public exposure, webhook debug surface, v5 complexity |
| **Next trigger** | User/orchestrator explicitly reopens strict C1 path |

---

### PM-02 — Multirepo watcher promotion

| Field | Value |
|-------|--------|
| **Status** | **PASS** — runtime promotion recorded (post-MVP) |
| **Active** | `02 - CP v4 multirepo polling - TARGET ON` — schedule **1 min**; GitHub node uses **authenticated API credential** in n8n UI (not anonymous HTTP) |
| **Legacy off** | `01 - CP v4 single-repo polling - LEGACY OFF` — **inactive** |
| **dev-method notify** | **PASS** — `7f4316e` — `docs: deduplicate core 07 indexing notes` |
| **GIS notify** | **PASS** — `66fe6b5` (`Previous: 34d543d`) — `docs: trigger control-plane multirepo watcher test` |
| **Dedupe** | **PASS** — no duplicate Telegram for `66fe6b5` on follow-up poll |
| **Limits** | v5 **off**; webhook **not configured**; **no** new workflows created |
| **Export** | Committed redacted JSON may **diverge** (rename, auth GitHub) — refresh only if material drift ([WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [OBSERVABILITY.md](OBSERVABILITY.md)) |
| **Next trigger** | Re-export redacted multirepo if audit requires match; otherwise stabilize |

---

### PM-06 — Automatic GIS handoff + safe text file (02F)

| Field | Value |
|-------|--------|
| **Status** | **PASS** — `02F` on GIS `58c5c46`: safe-text Telegram + **`latest-gis-handoff.md`** attachment + commit notify |
| **Prior** | `2a2ff31` via `02` — preview-only path ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)) |
| **Delivered** | Prompt ready **yes**; generated prompt available **yes** (length 2884); no parse error; no long prompt in Telegram body |
| **UX gap (non-blocking)** | Handoff/file before commit notify (parallel branches) |
| **Next improvement (optional)** | Order commit notification before handoff/file |
| **Runtime** | v5 **off**; webhook **not configured** |

---

### PM-07 — n8n superseded workflow cleanup

| Field | Value |
|-------|--------|
| **Status** | **PASS** — manual cleanup completed (post-02F) |
| **Active (published)** | **`40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE`** (formerly **`02F`**) — sole CONTROL PLANE polling+handoff |
| **Final list (2026-05-21)** | `40` **ACTIVE** · `30` / `20` / `01` **OFF** — backup `40` and `55` test-safe **deleted** from UI after PM-09 PASS |
| **Removed from CONTROL PLANE list** | `02`, `02B`, `02C`, `02D`, `02E`, `90`, `91`, `92`, `93` |
| **Out of scope** | **ALINA LAVORO** folder/workflows (9) — **not** touched |
| **Next (optional)** | UX: commit notify before handoff/file (PM-06) |

---

### PM-08 — Redacted 02F workflow export (hygiene)

| Field | Value |
|-------|--------|
| **Status** | **PASS** — redacted export committed 2026-05-21 |
| **Deliverable** | `workflows/exports/2026-05-21_github-commit-datatable-dedupe-scheduled-v4-multirepo-02f-handoff-safe-text.redacted.json` |
| **Runtime** | **No** import/export/execution in commit task — VPS **`02F` stays active** |
| **Unredacted** | `02F-unredacted-export-local-only.json` — **not** in git |
| **Not in scope** | v5/webhook; C1 &lt;30s reopen; ALINA LAVORO; deleting `01`/`03`/`20` |
| **Docs** | [WORKFLOW_EXPORT_STATUS.md § 02F](WORKFLOW_EXPORT_STATUS.md#02f-redacted-export-status), [OBSERVABILITY.md](OBSERVABILITY.md) |

---

### PM-09 — Cursor Plan output → Telegram / orchestrator ingestion

| Field | Value |
|-------|--------|
| **Status** | **CLOSED** — Gate **C + D + FILE PASS** (A/B design + C runtime + D Telegram text + D `.md` file) |
| **Why** | Avoid manual copy-paste of Cursor Plan text into handoff/Telegram; make plans readable by orchestrator via GitHub |
| **Desired flow** | Cursor Plan → `docs/plans/` → n8n watcher (gate C) → `plan_detected` → Telegram text + `.md` file (gate D) → orchestrator reads GitHub |
| **Design docs** | [PLAN_OUTPUT_INGESTION.md](PLAN_OUTPUT_INGESTION.md), [PLAN_WATCHER_GATE_C.md](PLAN_WATCHER_GATE_C.md) |
| **Gate B delivered** | Path, naming, schema — [plans/README.md](plans/README.md) |
| **Gate C design delivered** | Watcher scope, `plan_detected`, dedupe — [PLAN_WATCHER_GATE_C.md](PLAN_WATCHER_GATE_C.md) |
| **Gate C runtime direction** | **A selected and implemented** — extended **`40`** (formerly **02F**); B = fallback only |
| **Runtime target** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` |
| **Gate C runtime PASS** | [runtime-packets/pm-09-gate-c-runtime-pass.md](runtime-packets/pm-09-gate-c-runtime-pass.md) |
| **Runtime evidence** | Branch-hit PASS, logic test PASS, real GitHub API detect PASS, scheduled active runtime PASS |
| **Gate C active branch** | `Code - Plan watcher repo gate stub` → `GitHub - Fetch commit details (plan files)` → `Code - Detect real docs/plans plan files` |
| **Gate D Telegram** | **PASS** — `plan_detected` text ([live PASS](sessions/2026-05-21-control-plane-40-gate-d-live-pass.md)) + `.md` file attachment ([file PASS](sessions/2026-05-21-control-plane-40-gate-d-file-attachment-pass.md)) |
| **Runtime now** | **No new runtime required** — PM-09 closed; n8n list trimmed to 4 workflows ([final cleanup](sessions/2026-05-21-control-plane-final-n8n-cleanup.md)) |
| **v5 / webhook** | **Not reopened** |
| **C1** | Stays **PARTIAL** (D-C1-A) |
| **Out of scope** | ALINA LAVORO; dev-method; GIS; Cursor provider API |
| **Next trigger** | None for PM-09 closure; future plan-watcher changes use candidate IDs **41** / **42** / **43** per [N8N_WORKFLOW_NAMING.md](N8N_WORKFLOW_NAMING.md) |

---

### PM-10 — Implementer auto-handoff preparation

| Field | Value |
|-------|--------|
| **Status** | **Plan committed** — watcher **`40`** should emit `plan_detected` on push |
| **Plan file** | [docs/plans/2026-05-21_1700_control-plane_pm10-automation-next-step.plan.md](plans/2026-05-21_1700_control-plane_pm10-automation-next-step.plan.md) |
| **Why** | Reduce manual copy-paste after plan_detected; next step toward generated handoff/prompt **file**, not preview-only |
| **This task** | Docs-only plan commit — **no** n8n change, **no** implementer auto-send |
| **Next gate** | Confirm Telegram evidence; then design **candidate `41`** only if explicitly opened |
| **Runtime** | **No** in plan-commit task |
| **Out of scope** | GIS, dev-method, ALINA LAVORO; v5/webhook; production **`40`** edit |

---

### PM-11 — Candidate `41` full handoff/prompt file generation

| Field | Value |
|-------|--------|
| **Status** | **Design package committed** — [PM11_CANDIDATE_41_HANDOFF_FILE.md](PM11_CANDIDATE_41_HANDOFF_FILE.md) |
| **Why** | After PM-10 `plan_detected`, define **`41`** path: plan file → full handoff markdown on n8n disk → Telegram short text + document (GIS-style, CONTROL PLANE plans) |
| **Runtime** | **No** in this task — no import, execute, activation, or `40`→`41` switch |
| **Next gate** | Candidate **`41`** runtime packet / import gate — **one step only** ([RUNTIME_GATES.md](RUNTIME_GATES.md)) |
| **Depends on** | PM-09 PASS in **`40`**; PM-10 plan direction |
| **Out of scope** | GIS, dev-method, ALINA LAVORO; v5/webhook; implementer auto-send; provider API; secrets in git |

---

### PM-12 — Candidate `41` runtime / import gate

| Field | Value |
|-------|--------|
| **Status** | **Runtime/import packet committed** — [pm-12-candidate-41-handoff-file-import-gate.md](runtime-packets/pm-12-candidate-41-handoff-file-import-gate.md) |
| **Why** | Operational checklist for import/test of **`41`** — full handoff file from plan, GIS-style Telegram delivery |
| **Runtime** | **No** in this docs task; **yes** in next session — **one gate only** (start: import `41` inactive) |
| **Next gate** | **Gate A** — import `41 - CP v4 multirepo + plan handoff file - CANDIDATE` **inactive** in n8n UI |
| **Depends on** | PM-11 design; PM-09 **`40`** PASS |
| **Out of scope** | Production **`40`** switch; v5/webhook; implementer auto-send; provider API; GIS; DEV; ALINA LAVORO |

---

### PM-03 — New n8n workflows

| Field | Value |
|-------|--------|
| **Status** | Allowed **post-MVP only** — **one explicit gate per workflow** |
| **Why** | Bootstrap freeze lifted after operational acceptance; still no batching |
| **Examples** | Data Table backup export, reporting digest, health/monitoring workflow |
| **Forbidden default** | Batching runtime changes; enabling v5/webhook in same session |
| **Requirement** | Friction/cost note in docs before each new capability |
| **Runtime** | **Yes** — per workflow |
| **Next trigger** | Concrete ops need + written gate |

---

### PM-04 — Observability / audit (docs-first)

| Field | Value |
|-------|--------|
| **Status** | **Docs delivered** — [OBSERVABILITY.md](OBSERVABILITY.md); **no runtime by default** |
| **Why** | Improve traceability without expanding attack surface |
| **Delivered** | Runtime evidence rules; Data Table audit notes; export refresh policy; manual test template |
| **Risk** | Accidental secret commit if logs/exports mishandled — mitigated by forbidden-fields list in guide |
| **Runtime** | **No** unless a later backlog item explicitly gates it (e.g. real Data Table backup) |
| **Next trigger** | Use template after a gated manual test; refresh export only on material runtime drift |

---

### PM-05 — dev-method integration

| Field | Value |
|-------|--------|
| **Status** | Optional — **docs-only** until stable/pinned |
| **Why** | Align orchestrator handoff discipline with method repo conventions |
| **Context** | dev-method `core/07` referenced as **v0.2.0 pending** — no automatic adoption until stable/pinned |
| **Runtime** | **No** in first integration task |
| **Risk** | Premature coupling to unstable method format |
| **Next trigger** | dev-method release pinned + explicit integration decision |

---

## Rules (all items)

- **No automatic next step** — pick one backlog ID; one gate per session.
- **C1 stays PARTIAL** unless PM-01 completes strict path (would not relabel without evidence).
- **No secrets in git** — tokens, chat_id, webhook URLs, credential IDs stay in n8n UI only.
- **Default runtime posture:** v4 **on**, v5 **off**, webhook **unconfigured**.
