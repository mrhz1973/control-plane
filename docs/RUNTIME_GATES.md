# Runtime gates

Each runtime action below is a **one-step gate**. Never batch multiple actions in a single step.

## No-confirmation operating rule

Do **not** ask the user to say "vai" for docs-only, GitHub-only, export-template, redacted-file, or status-recording work that does not require secrets and does not execute runtime.

Proceed automatically through safe preparatory work until a real gate is reached.

Stop only when the next action requires one of these:

- local n8n UI action;
- token, credential, secret, or operational chat ID;
- workflow import into n8n;
- workflow execution;
- webhook activation;
- schedule activation;
- VPS/runtime command;
- user-visible confirmation that a Telegram message arrived.

When a real gate is reached, give exactly one concrete action and wait for the user's real output.

| # | Action | Owner | Gate | Rule |
|---|--------|-------|------|------|
| 1 | creare bot Telegram | user | yes | One runtime action per step |
| 2 | ottenere token | user | yes | One runtime action per step |
| 3 | testare token via curl/local command | user / Cursor | yes | One runtime action per step |
| 4 | configurare webhook GitHub | user / Cursor | yes | One runtime action per step |
| 5 | testare webhook | user / Cursor | yes | One runtime action per step |
| 6 | installare n8n su VPS | user / Cursor | yes | One runtime action per step |
| 7 | testare n8n raggiungibile | user / Cursor | yes | One runtime action per step |
| 8 | importare workflow JSON in n8n | user / Cursor | yes | One runtime action per step |
| 9 | testare workflow con dato reale | user / n8n | yes | One runtime action per step |
| 10 | attivare schedule trigger | user / n8n | yes | One runtime action per step |

**Rule:** Complete and verify one gate before starting the next. Do not combine gates (e.g. install n8n and import workflow in the same session step).

---

## Workflow freeze rule (MVP / post-MVP)

**Bootstrap (historical):** Until operational MVP acceptance, do **not** create new n8n workflows except [allowed exceptions](#allowed-exceptions) below.

**Post-MVP (2026-05-21, D-C1-A):** Operational MVP **accepted with C1 latency exception** — **not** strict **5/5 PASS**. **No mandatory next runtime gate.** Multirepo watcher **active**; legacy single-repo **off**; v5 **off**; webhook **not configured**. Further changes: **one explicit gate each** — never batched.

### Allowed exceptions (bootstrap)

| Exception | Examples |
|-----------|----------|
| **Bugfix on v4** | Fix dedupe, Telegram format, GitHub read URL for watched repos |
| **Cleanup** | Remove unused/duplicate CONTROL PLANE test workflows before commit |
| **Discardable test** | One-off test workflow deleted before any export/commit |
| **Criterion 2 handoff workflow** | Single manual workflow: container command + Telegram `Prompt ready: yes/no` — next gate for MVP §2 |

### Criterion 2 — gate progress

| Gate | Status |
|------|--------|
| Execute Command config fix (`NODES_EXCLUDE=[]`) | **Applied** 2026-05-20 |
| n8n manual workflow + Telegram | **PASS** 2026-05-20 — criterion 2 closed |

| Cycle 1 end-to-end (GIS T1.3) | **PASS** 2026-05-20 — commit `34d543d` (re-audit notifica vs v4 scope if needed) |
| Cycle 2 commit (dev-method) | **Done** — `5ce0a25` |
| Cycle 2 notifica (multirepo draft) | **PASS** 2026-05-20 — Telegram dev-method `5ce0a25`; Cycle 2 closed in [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) |
| Missing-notification diagnosis | **Done** 2026-05-20 — cause **B**: active v4 does not poll `dev-method` |
| v4 multirepo draft export | **Corrected** — item propagation, missing state rows, sequential state load (`ca8a5db`); active v4 **unchanged** |
| Draft manual tests (iterations 1–3) | **Resolved** — sequential `Trigger → Load all → Emit (3) → … → Decide` |
| Gate: re-import draft + sequential fix + Manual Trigger | **PASS** 2026-05-20 — workflow **inactive**; **no** schedule activation; active v4 **unchanged**; v5 **off** |

**Recorded in Cycle 2 gate (user-confirmed):** Telegram for `mrhz1973/dev-method` (`5ce0a25`, `Previous: none`) and retro GIS `mrhz1973/cursor-coordinate-converter` (`34d543d`, `Previous: none` — key absent). No Telegram for control-plane in that run (key already present — expected dedupe). Data Table keys written for dev-method and GIS.

| Cycle 3 gate (multirepo draft, inactive) | **PASS** 2026-05-20 |
| Cycle 3 commit (dev-method) | **Done** — `0be529d` (`docs: add control-plane cycle 3 marker`) |
| Cycle 3 Telegram | **received** — `Previous: 5ce0a25`; timestamp 2026-05-20 23:51 |
| Cycle 3 workflow dedupe | **1** IF true (new) + **2** duplicate-skip (expected for control-plane + GIS) |
| Cycle 3 schedule / active v4 / v5 | **No** schedule activation; active v4 **unchanged**; v5 **off** |

**Criterion 3:** **closed** (3/3 PASS) — see [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md).

| Criterion 5 — DRY prep (checklist in runbook) | **Done** (docs-only) |
| Criterion 5 — FIELD validation | **PASS** 2026-05-20 — **recovery drill** (non-destructive); clean VPS rebuild **not** done |
| Criterion 5 — v4 duplicate-skip smoke | **PASS** — active v4 Manual Trigger; IF false → duplicate skip; **no** new Telegram |
| Criterion 5 — scope limits | No v5, webhook, volume wipe, new import, schedule activation, or persistent runtime change in this gate |

**Criterion 5:** **closed** — see [N8N_REBUILD.md § FIELD result](N8N_REBUILD.md#field-validation-checklist-criterion-5).

| Criterion 1 — closure decision | **DECIDED** 2026-05-21 — **D-C1-A** ([Decision Packet](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md)) |
| Operational MVP | **Accepted** with C1 latency exception; C1 remains **PARTIAL**; **not** strict 5/5 PASS |

**No runtime authorized by D-C1-A.** Webhook / v5 / public HTTPS = **post-MVP optional** only — not the next automatic gate. Reopen strict C1 only via explicit new decision (former D-C1-B path).

| PM-02 multirepo watcher promotion | **PASS** — historical; target now **02F** |
| Automatic GIS handoff (`02` / `02F`) | **PASS** — `2a2ff31` then **02F** `58c5c46` safe text + file ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)) |
| 02F safe text + file handoff | **PASS** — safe text Telegram; `latest-gis-handoff.md` document; commit notify; n8n executions succeeded |
| n8n superseded workflow cleanup (PM-07) | **PASS** — `02F` only active CP poll; `01`/`03`/`20` retained; `02`/`02B`–`02E`/`90`–`93` removed |

**Future runtime still requires explicit gate each:** enable v5 / webhook+HTTPS; delete or change `01`; modify `02F`; import/export production workflows; touch ALINA workflows.

**Post-MVP optional:** [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) → v5 → webhook.

| PM-08 redacted 02F export | **PASS** — committed `2026-05-21_…-02f-handoff-safe-text.redacted.json`; **no** runtime import; [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md#02f-redacted-export-status) |

| PM-09 Gate C runtime (extend **02F** plan watcher) | **Prepared** — architecture **A** selected; [runtime packet](runtime-packets/pm-09-gate-c-extend-02f-plan-watcher.md); **not executed** — separate n8n session |

### Not exceptions (post-MVP — workflow freeze relaxed for new scope)

| Blocked | Why |
|---------|-----|
| Automatic branch cleanup workflow | New scope — measure friction after MVP |
| Ollama integration | Day 5+ rule — stabilize first |
| Second generic Telegram workflow | Duplicates v4 path |
| Data Table backup workflow | Ops extras — not MVP |
| CI/CD workflow in n8n | Not MVP closure |

**Post-MVP:** Add **one** new capability at a time with an explicit friction/cost note in docs (webhook/v5/multirepo each = separate gate).
