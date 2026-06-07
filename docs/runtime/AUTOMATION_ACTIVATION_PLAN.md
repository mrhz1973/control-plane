# D-0028-A Automation Activation Plan

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-07  
**Decision:** D-0028-A **Option 2** — docs-only progressive activation plan  
**Status:** Plan only. **No runtime.** **No n8n execution.** **Option 4 not started.**

**Purpose:** Prepare a concrete, gate-separated path toward future **D-0028-A Option 4** (controlled activation) without executing it. Parent rules: [`PROJECT_VISION.md`](../foundation/PROJECT_VISION.md), [`CURRENT_FRONTIER.md`](CURRENT_FRONTIER.md).

---

## Linea rossa

- **Pezzi collegati ≠ loop avviato.**
- **Nessuna attivazione** (schedule, webhook, Telegram Trigger, Funnel, permanent loop) **senza gate runtime separato** e evidenza user-attested.
- **`PM-34` = BLOCKED** and **`n8n_ready=false`** remain until explicit final gates say otherwise.
- **No new workflow** unless a separate explicit decision overrides this plan.

---

## Stato di partenza reale (2026-06-07)

| Asset | Stato |
|-------|--------|
| **45 / Wd** | PASS ATTESTATO UTENTE (2026-05-31) + riverifica PASS (2026-06-07): `D-9999-T`, `message_id=748`. **Non ricreare.** |
| **46 / We** | Package-prep completato; **live BLOCKED/PENDING**; We live PASS **non** registrato |
| **47 / Wf** | PASS multipli ATTESTATO UTENTE; **ora off** |
| **48 / Wg** | PASS; **callable**; **non schedulato** |
| **49 / Wh** | Rehearsal manuale finale PASS ATTESTATO UTENTE; **provato**; **ora inattivo** |
| **decision-store** | Gate 1 design · Gate 2 template · Gate 3 runtime end-to-end **PASS** (2026-06-02) |
| **40/42** | Production polling **ACTIVE** (unchanged) |
| **Classifier / mapping** | D-0021–D-0025-L PASS; D-0027-R Wd reverification PASS |
| **Telegram inbound operational automation** | **NOT ACTIVE / NOT RUN** |
| **Catena completa automatizzata** | **NOT RUN** |
| **PM-34** | **BLOCKED** |
| **`n8n_ready`** | **false** |

Evidence index: `docs/sessions/`, `docs/runtime/CURRENT_FRONTIER.md`, `docs/N8N_WORKFLOW_NAMING.md`.

---

## Sequenza di attivazione progressiva (gate separati)

Each gate is a **separate explicit decision**. PASS on one gate **does not** auto-start the next.

### Gate A — Readiness audit (docs/runtime preflight)

| | |
|---|---|
| **Precondizioni** | D-0028-A Option 2 plan committed; `CURRENT_FRONTIER` reflects known state |
| **Cosa si può fare** | Read-only audit: verify workflow IDs 45/46/47/48/49 exist in n8n UI; confirm inactive/off; confirm no orphan schedule/webhook/Telegram Trigger; cross-check decision-store table name `control_plane_decisions_test`; confirm classifier transport still matches D-0021/D-0022-W evidence |
| **Cosa NON si può fare** | Execute workflows; import/export; activate schedule; set `n8n_ready=true`; unlock PM-34; mutate wf40/41/42 |
| **Evidenza PASS** | Session or checklist doc: asset inventory matches Git docs; blockers listed (We HTTPS, inbound off); no secrets in Git |
| **Rollback / kill switch** | N/A — no runtime change |
| **Stop conditions** | Missing workflow; unexpected active schedule; credential/URL drift requiring Git commit of secrets |

### Gate B — Limited manual runtime re-verification (existing assets)

| | |
|---|---|
| **Precondizioni** | Gate A PASS; operator confirms classifier HTTPS/Tailscale path configured in n8n UI only |
| **Cosa si può fare** | Manual single runs on **existing** workflows: e.g. **45/Wd** reverification (pattern D-0027-R); **56** mapping preview if needed; **47→48** handoff one-shot with test fixtures; all workflows remain **inactive** after run |
| **Cosa NON si può fare** | New workflows; permanent activation; inbound loop; Telegram Trigger; Funnel; public webhook; wf40/41/42 mutation; PM-34 unlock |
| **Evidenza PASS** | User-attested session per run: sanitized Inspect output, `test_only=true`, no secrets; `telegram_send_ok` or equivalent checks documented |
| **Rollback / kill switch** | Leave all test workflows **inactive/off**; disable any temporary schedule immediately; document `handoff ora` per PROJECT_VISION kill switch |
| **Stop conditions** | Classifier unreachable; duplicate_open_attempt without new test id; any send outside test-only scope; unexpected wf40 side effect |

### Gate C — We/46 live unblock plan (HTTPS webhook only)

| | |
|---|---|
| **Precondizioni** | Gate B PASS for outbound path; **safe public HTTPS webhook** available for n8n/Telegram (see `docs/sessions/2026-05-31-control-plane-we-telegram-interactive-buttons-live-blocked.md`) |
| **Cosa si può fare** | Document webhook URL placement in n8n UI only; plan single manual We live test; define rollback (delete webhook, deactivate workflow) before any run |
| **Cosa NON si può fare** | We live PASS without HTTPS; localhost/tunnel-only webhook; PM-34; inbound 47/48 schedule; secrets in Git |
| **Evidenza PASS** | User-attested We live session: Telegram interactive buttons test; sanitized receipt; workflow returned inactive |
| **Rollback / kill switch** | Remove Telegram webhook; set **46/We inactive**; record BLOCKED/PENDING if HTTPS not ready — **do not force** |
| **Stop conditions** | `bad webhook: HTTPS URL must be provided`; auth errors; unexpected production chat side effects |

### Gate D — Inbound 47→48→decision-store bounded rehearsal

| | |
|---|---|
| **Precondizioni** | Gate B PASS; decision-store Gate 3 evidence current; **47/Wf** and **48/Wg** callable; **49/Wh** optional for combined fixture path |
| **Cosa si può fare** | Manual bounded rehearsal: open via **45/Wd** or fixture → **47/Wf** accept → **48/Wg** close on `control_plane_decisions_test`; limited-schedule **only** if explicit sub-gate approves timed window, then **must return off** |
| **Cosa NON si può fare** | Permanent schedule on 47/48/49; production Data Table; `control_plane_state`; operational inbound automation declared active; PM-34 |
| **Evidenza PASS** | User-attested chain session: `inspect_status` accepted/closed; `update_id` handling; duplicate guard; workflows off after test |
| **Rollback / kill switch** | Stop schedule; set 47/48/49 **inactive**; clear test rows only if operator policy allows — never production tables |
| **Stop conditions** | Stale webhook blocking getUpdates; handoff failure 47→48; open_without_send observed without documented acceptance |

### Gate E — Phase 1 controlled start (kill switch mandatory)

| | |
|---|---|
| **Precondizioni** | Gates B–D PASS as applicable; explicit Decision Packet authorizing **bounded** phase-1 scope; kill switch documented |
| **Cosa si può fare** | **Limited** operational window: e.g. manual-triggered or tightly bounded schedule with documented start/end; monitor Telegram + decision-store; **still no PM-34** |
| **Cosa NON si può fare** | Full autonomous loop; `n8n_ready=true`; wf40/41/42 promotion; provider API keys in workflow; undeclared public webhook |
| **Evidenza PASS** | Session log: window start/end; zero undeclared sends; kill switch exercised or ready; PM-34 still BLOCKED |
| **Rollback / kill switch** | **Immediate:** deactivate all phase-1 schedules; set inbound workflows off; `handoff ora`; restore wf40-only production if any candidate touched |
| **Stop conditions** | Duplicate packets; classifier fail-open; inbound reply without guard; any secret leakage |

### Gate F — PM-34 unlock (Decision Packet required)

| | |
|---|---|
| **Precondizioni** | Gates A–E PASS; separate **Decision Packet** with explicit PM-34 criteria; OpenClaw / worker scope defined in dedicated docs |
| **Cosa si può fare** | Register PM-34 unblock **only** per attested evidence; may set `pm34_unblocked` / integration flags **only** in docs session after human decision |
| **Cosa NON si può fare** | Auto-unblock from prior gate PASS; `n8n_ready=true` without its own gate; undeclared worker loop |
| **Evidenza PASS** | Decision Packet reference + session; strict_pass or equivalent evidence per PROJECT_VISION |
| **Rollback / kill switch** | Re-block PM-34 in docs + disable worker integration; revert flags |
| **Stop conditions** | Missing Decision Packet; strict_pass not met; worker touches undeclared scope |

---

## Criteri minimi prima della futura Option 4

Future **D-0028-A Option 4** may start **only** when all apply:

1. **No new workflow** unless explicit separate decision.
2. **Reuse existing assets:** 45, 46, 47, 48, 49, decision-store templates, classifier transport.
3. **`PM-34` remains BLOCKED** until Gate F Decision Packet.
4. **`n8n_ready=false`** until final readiness gate explicitly passed.
5. **No provider API key** in Git or undeclared in n8n.
6. **No public webhook** except Gate C We/46 with HTTPS and rollback plan.
7. **No secrets in Git** — placeholders only in exports.
8. **No Telegram Trigger / Funnel** without dedicated gate.
9. **Pezzi collegati ≠ loop avviato** — each activation step remains attestable and reversible.

Option 4 **does not** begin when this plan is committed. It requires choosing which gate (A–F) to run next as a **separate runtime task**.

---

## What this plan does not do

- Does not open n8n, import, export, or execute workflows
- Does not activate schedule, webhook, Telegram Trigger, or Funnel
- Does not set `n8n_ready=true` or unblock PM-34
- Does not modify `workflows/exports/**` or production wf40/41/42

---

## Related documents

- [`CURRENT_FRONTIER.md`](CURRENT_FRONTIER.md) — authoritative compact state
- [`N8N_WORKFLOW_NAMING.md`](../N8N_WORKFLOW_NAMING.md) — workflow registry
- [`decision-store-shared-open-close-design.md`](../decision-store-shared-open-close-design.md)
- Session: `docs/sessions/2026-06-07-control-plane-d0028a-automation-activation-plan.md`
