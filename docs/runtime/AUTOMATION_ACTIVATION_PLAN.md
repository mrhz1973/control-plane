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

## Micro-step propedeutico — Automatic post-push verifier (before permanent loop)

**Status:** Design **PASS** (docs-only, 2026-06-07). **Not implemented.** **No runtime.**

| | |
|---|---|
| **Purpose** | Replace manual copy-paste of git verify-only output after Cursor tasks; deterministic hash check without LLM |
| **Design doc** | [`AUTOMATIC_POST_PUSH_VERIFIER.md`](AUTOMATIC_POST_PUSH_VERIFIER.md) |
| **Precondition for** | Any future permanent automation loop (Gate E/F); complements `LAST_HANDOFF_VERIFY.md` |
| **Next implementation gate** | Test-safe Manual Trigger workflow + worker script — **separate** explicit decision; **not** Gate C/D/E/F PASS |
| **Unchanged** | PM-34 **BLOCKED** · `n8n_ready=false` · no new production workflow in this design step |

Gates C–F: **not PASS** unless separately attested.

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

#### Gate A evidence — PASS ATTESTATO UTENTE (2026-06-07)

- **Session:** `docs/sessions/2026-06-07-control-plane-gate-a-readiness-audit-pass.md`
- **Method:** Read-only n8n UI inventory + classifier `/healthz` (no token); **no workflow execution**
- **Workflows:** 45/Wd inactive; 46/We present, Telegram Trigger not published-active, live BLOCKED/PENDING; 47/Wf Manual + Schedule TEST ONLY **disabled**; 48/Wg callable/published, not scheduled; 49/Wh Manual only, inactive
- **Data Tables (test):** `control_plane_decisions_test`, `wf47_polling_state_test`, `wg_decision_state_test` — present
- **Classifier:** `/healthz` HTTP 200, `{"status":"ok"}`
- **Unchanged:** inbound/loop NOT ACTIVE; PM-34 BLOCKED; `n8n_ready=false`; Option 4 not started

Gates C–F: **not PASS** unless separately attested.

### Gate B — Limited manual runtime re-verification (existing assets)

| | |
|---|---|
| **Precondizioni** | Gate A PASS; operator confirms classifier HTTPS/Tailscale path configured in n8n UI only |
| **Cosa si può fare** | Manual single runs on **existing** workflows: e.g. **45/Wd** reverification (pattern D-0027-R); **56** mapping preview if needed; **47→48** handoff one-shot with test fixtures; all workflows remain **inactive** after run |
| **Cosa NON si può fare** | New workflows; permanent activation; inbound loop; Telegram Trigger; Funnel; public webhook; wf40/41/42 mutation; PM-34 unlock |
| **Evidenza PASS** | User-attested session per run: sanitized Inspect output, `test_only=true`, no secrets; `telegram_send_ok` or equivalent checks documented |
| **Rollback / kill switch** | Leave all test workflows **inactive/off**; disable any temporary schedule immediately; document `handoff ora` per PROJECT_VISION kill switch |
| **Stop conditions** | Classifier unreachable; duplicate_open_attempt without new test id; any send outside test-only scope; unexpected wf40 side effect |

#### Gate B evidence — PASS ATTESTATO UTENTE (2026-06-07)

- **Session:** `docs/sessions/2026-06-07-control-plane-gate-b-inbound-one-shot-pass.md`
- **Scope:** Limited inbound one-shot — **45/Wd** `D-1000-T` send → Telegram reply → **47/Wf** polling close on `control_plane_decisions_test`
- **45/Wd:** `D-1000-T`, `telegram_send_ok=true`, `message_id=753`/`754` (duplicate diagnostic), `open_action=insert`
- **47/Wf final:** `inspect_status=closed`, `decision_id=D-1000-T`, `selected_option=1`, `update_id=986228573`, `test_only=true`
- **Store:** `D-1000-T` closed; `D-9998-T` closed (historical); **`D-9999-T` open** residue — not deleted
- **Manual fix:** `open_decision_ids_test_only` retargeted `D-9998-T` → `D-1000-T` in n8n UI (no secrets in Git)
- **Not done:** 48/Wg/49/Wh auto-promotion; permanent loop; PM-34 unlock; `n8n_ready=true`

Gates C–F: **not PASS** unless separately attested.

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

#### Gate D evidence — PASS ATTESTATO UTENTE (2026-07-02)

- **Session:** `docs/sessions/2026-07-02-control-plane-gate-d-rehearsal-pass.md`
- **Decision:** D-0033 / Gate D bounded rehearsal
- **Pre-step hygiene:** `D-9999-T` closed (`selected_option=2`, `update_id=986228574`) — Gate B residue cleanup
- **Fase 1 — D-1001-T:** manual rehearsal; UI bug fix on **45** (`event.event_id` vs hardcoded `D-1000-T`) and **47** (`open_decision_ids_test_only` → `D-1001-T`); closed `update_id=986228576`
- **Fase 2 — D-1002-T:** time-boxed scheduled pickup within declared window (2026-07-02 00:51–01:06 Europe/Rome); closed `update_id=986228577`; schedule deactivated post-pickup
- **Addendum A — D-1003-T:** full chain 45→Telegram→47→48; handoff **`state_persisted=true`**; closed `update_id=986228578`
- **Final workflow inventory:** aligned with Gate A — 45/47/49 inactive; 47 Schedule Trigger deactivated; 48 callable/not scheduled; **`enable_wg48_handoff=false`**
- **Unchanged:** PM-34 BLOCKED; `n8n_ready=false`; wf40/41/42 untouched; no permanent schedule; no public webhook

Gates E–F: **not PASS** unless separately attested.

### Gate E — Phase 1 controlled start (kill switch mandatory)

**Status (2026-07-03):** PREP docs-only aggiornato in questo file. **Non** è Gate E PASS. **Non** esegue runtime. **Non** auto-avvia Gate E.

#### Scope boundary — cosa è cosa

| Layer | Gate E Phase 1 | Fuori scope / gate separato |
|-------|----------------|----------------------------|
| **Docs-only / GitHub-only** | Aggiornare session log, checklist, evidenza; commit selettivo su `main` | — |
| **Runtime n8n manuale** | **Un solo** run manuale bounded per rehearsal Phase 1, su asset esistenti 45/47/48, **inactive/off** dopo run | Import/export massivo; nuovi workflow |
| **Telegram reale** | Solo messaggi attesi dal Decision Packet di autorizzazione; conteggio fan-out verificabile | Broadcast non dichiarato; chat fuori scope |
| **Webhook / schedule** | **Vietato** schedule permanente; eventuale finestra time-boxed **solo** se esplicitamente autorizzata nel Decision Packet, **deactivated** entro fine finestra | Telegram Trigger; Funnel; public webhook; schedule 47/48/49 left on |
| **OpenClaw gateway** | **Non** coinvolto — transport/backlog opzionale, non model path target (`PROJECT_VISION.md` §2) | Qualsiasi attivazione OpenClaw come orchestratore |
| **Worker / PM-34** | **BLOCKED** — nessun worker loop, nessun `pm34_unblocked=true` | Gate F |
| **Gate F** | **Non** iniziato da Gate E PASS | PM-34 unlock, `n8n_ready=true` |

#### Precondizioni (tutte richieste prima di qualsiasi run Gate E)

1. **Gate D PASS** attestato (`docs/sessions/2026-07-02-control-plane-gate-d-rehearsal-pass.md`).
2. **Decision Packet dedicato** che autorizza esplicitamente Gate E Phase 1 bounded scope (kind `runtime`, opzioni numerate, kill switch nominato).
3. **Re-export 45/47 post-fix UI** — finding **chiuso** (vedi sotto); rebuild da export committati deve bastare.
4. Asset **45/47/48** callable/inactive come Gate D inventory finale; **40/41/42 untouched**.
5. **`PM-34` BLOCKED**, **`n8n_ready=false`**, **`enable_wg48_handoff=false`** in n8n UI (default fuori test).
6. Classifier transport configurato **solo** in n8n UI; nessun segreto nuovo introdotto per questo gate.
7. Operatore ha letto questo PREP e accetta fail-closed + kill switch prima del run.

#### Finding pre-Gate E — stato e criteri operativi

##### 1. Fan-out 45/47 (operazionalizzato)

Gate E **non** deve generare fan-out incontrollato di messaggi Telegram o item di output.

| Asset | Evidenza attesa (PASS) | Stop condition (NO-GO immediato) |
|-------|------------------------|----------------------------------|
| **45 / Wd** | **Esattamente 1** messaggio Telegram Decision Packet per `decision_id` del run; session log riporta `message_id` singolo (o duplicate diagnostic documentato come stesso invio) | **>1** messaggio distinto per lo stesso `decision_id` senza autorizzazione nel Decision Packet; fan-out 3–5 messaggi non dichiarato |
| **47 / Wf** | **1 item** Inspect/output per decisione chiusa nel run; se multi-item, **≤5 item** totali e ogni item mappato a `decision_id`/`update_id` distinto nel session log | **>5 item** in output 47; item senza `decision_id`/`update_id`; fan-out che supera il previsto nel Decision Packet |

**Regola:** una semplice menzione del rischio fan-out **non** basta — il session log Gate E deve contenere conteggio esplicito messaggi (45) e item (47) con confronto ai limiti sopra.

##### 2. Derivation 47 da decision-store (operazionalizzato)

| | |
|---|---|
| **Comportamento richiesto** | **47** deriva l'elenco decisioni **open** da `control_plane_decisions_test` (query/load store), **non** da lista manuale hardcoded |
| **Vietato come fonte operativa** | Campo/lista `open_decision_ids_test_only` popolata manualmente in n8n UI come sostituto dello store |
| **Uso test-only ammesso** | Override fixture **solo** se nominato nel Decision Packet, confinato al run, e session log dichiara `store_derivation_bypassed=true` + motivo — **non** equivalente a comportamento operativo Gate E PASS |
| **Evidenza PASS** | Inspect/output 47 mostra `decision_id`(s) coerenti con righe `status=open` nello store al momento del pickup; nessun retarget manuale post-Gate-D pattern |
| **Stop condition** | Pickup su `decision_id` assente dallo store; chiusura su decisione già closed; lista manuale usata senza bypass documentato |

##### 3. Re-export 45/47 post-fix UI — **CHIUSO**

| | |
|---|---|
| **Commit** | `f6f5579` — `workflows: re-export redacted 45 and 47 post gate d ui fixes` |
| **Export** | `workflows/exports/2026-07-02_wd-45-operational-decision-packet-integration-post-gate-d.redacted.json`, `workflows/exports/2026-07-02_wf-47-telegram-inbound-polling-getupdates-post-gate-d.redacted.json` |
| **Finding** | UI fix Gate D (`event.event_id` su 45; path inbound su 47) allineati agli export committati — rebuild/import da repo deve bastare |
| **Gate E** | **Non** richiede nuovo re-export salvo divergenza UI post-PREP attestata |

##### 4. `enable_wg48_handoff` (operazionalizzato)

| | |
|---|---|
| **Default fuori test** | **`false`** — IF su 47 short-circuita prima di Execute Workflow verso 48 |
| **Gate E ammesso** | Test **manuale/confinato** con `enable_wg48_handoff=true` **solo** se esplicitamente autorizzato nel Decision Packet; **una** catena 47→48 per run; **deactivated/off** entro fine run |
| **Vietato** | Handoff permanente verso 48; schedule su 48; lasciare `enable_wg48_handoff=true` dopo il run |
| **Evidenza PASS** | Session log: flag `false` in inventory finale; se testato `true`, log con `state_persisted` + timestamp finestra + conferma ripristino `false` |
| **Stop condition** | Handoff 47→48 con flag `true` non autorizzato; 48 invocato con schedule; flag left on post-run |

#### Procedura one-step manuale (Gate E Phase 1 — solo dopo Decision Packet)

**Un solo run bounded.** Nessun loop. Nessun schedule permanente.

1. **Preflight (read-only):** inventory n8n UI — 45/47/49 **inactive**; 47 Schedule Trigger **deactivated**; 48 **callable/not scheduled**; 40/41/42 **unchanged**; `enable_wg48_handoff=false`.
2. **Hygiene store (se richiesto dal Decision Packet):** chiudere righe test residue; **non** toccare `control_plane_state`.
3. **Open (45):** Manual Trigger **45/Wd** una volta con `event_id` = `decision_id` del test Gate E; verificare **1** Telegram send; registrare `message_id`.
4. **Pickup (47):** Manual Trigger **47/Wf** — derivation da store (non lista manuale); verificare conteggio item ≤5; registrare `update_id`, `selected_option`, `inspect_status`.
5. **Handoff (48, opzionale):** solo se autorizzato nel Decision Packet e flag test temporaneo; altrimenti skip.
6. **Teardown obbligatorio:** 45/47/49 **inactive**; 47 Schedule **deactivated**; `enable_wg48_handoff=false`; nessuno schedule lasciato attivo.
7. **Session log:** `docs/sessions/YYYY-MM-DD-control-plane-gate-e-phase1-*.md` con conteggi fan-out, derivation source, flag finale.

#### Evidenze minime (Gate E PASS — user-attested)

- Decision Packet reference (ID/kind).
- Sanitized Inspect/output per 45, 47, (48 se usato).
- Conteggio esplicito: messaggi 45 = 1; item 47 ≤5.
- Store rows: `decision_id`, `status`, `closed_at` coerenti.
- Final inventory: 45/47/49 inactive; schedule off; `enable_wg48_handoff=false`.
- **`test_only=true`** dove applicabile.
- **Non** secrets dump non previsto.

#### Criteri GO / NO-GO

| GO (proseguire / attestare PASS) | NO-GO (fail-closed, stop immediato) |
|----------------------------------|--------------------------------------|
| Tutte le precondizioni soddisfatte | Decision Packet mancante o scope non autorizzato |
| Fan-out entro limiti tabella sopra | Fan-out oltre limiti; messaggi/item non mappati |
| 47 derivation da store (o bypass documentato) | Lista manuale `open_decision_ids_test_only` come fonte operativa |
| Teardown completato; inventory Gate-D-like | Schedule/webhook lasciato attivo |
| `enable_wg48_handoff=false` in inventory finale | Flag `true` non autorizzato o left on |
| wf40/41/42 untouched | Qualsiasi side effect su 40/41/42 |
| PM-34 BLOCKED; `n8n_ready=false` | Tentativo unlock PM-34 o `n8n_ready=true` |

#### Rollback / fail-closed / kill switch

- **Immediate kill switch:** `handoff ora` (`PROJECT_VISION.md` §11.1); deactivate tutti schedule 47/48/49; set inbound workflows **inactive/off**; `enable_wg48_handoff=false`.
- **Fail-closed default:** al primo NO-GO, **stop** — non “fix forward” silenzioso; documentare BLOCKED con motivo concreto.
- **Rollback:** ripristinare inventory Gate D (45/47/49 inactive; 47 schedule deactivated; 48 callable/not scheduled); **non** cancellare righe store senza policy operatore.
- **wf40/41/42:** qualunque side effect = **stop** + session incident; **no** promotion silent.

#### Stop conditions (riepilogo)

- Fan-out 45 >1 messaggio o 47 >5 item non autorizzato.
- 47 usa lista manuale invece dello store senza bypass documentato.
- Schedule permanente o webhook/Telegram Trigger attivato.
- `enable_wg48_handoff=true` fuori test autorizzato o left on.
- Classifier unreachable; duplicate_open_attempt non gestito.
- Secret leakage non previsto; wf40/41/42 mutation.
- PM-34 unlock o `n8n_ready=true` tentato.

#### Cosa NON fa questo PREP (2026-07-03)

- **Non** esegue n8n, **non** import/export workflow, **non** attiva schedule/webhook.
- **Non** dichiara Gate E PASS.
- **Non** aggiorna `LAST_CURSOR_REPORT.md` / `LAST_HANDOFF_VERIFY.md` — il commit docs-only PREP entra nel modello `PENDING_SELF_REFERENCE`; backfill al task successivo, **non** finalize-hash dedicato.
- **Non** crea `GATE_E_DECISION_REHEARSAL_PLAN.md` — piano operativo resta in questa sezione.

| | |
|---|---|
| **Precondizioni** | Gates B–D PASS; Decision Packet Gate E; finding re-export chiuso (`f6f5579`); fan-out/derivation/handoff criteri sopra compresi |
| **Cosa si può fare** | **Limited** operational window Phase 1: manual-triggered bounded run; monitor Telegram + decision-store; **still no PM-34** |
| **Cosa NON si può fare** | Full autonomous loop; permanent schedule; `n8n_ready=true`; wf40/41/42 promotion; OpenClaw activation; worker/PM-34; Gate F |
| **Evidenza PASS** | User-attested session con tabelle GO/NO-GO soddisfatte; kill switch ready/exercised; PM-34 still BLOCKED |
| **Rollback / kill switch** | **Immediate:** deactivate phase-1 schedules; inbound off; `enable_wg48_handoff=false`; `handoff ora` |
| **Stop conditions** | Vedi tabella NO-GO sopra |

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
- [`AUTOMATIC_POST_PUSH_VERIFIER.md`](AUTOMATIC_POST_PUSH_VERIFIER.md) — post-push verify design (docs-only)
- Session: `docs/sessions/2026-06-07-control-plane-d0028a-automation-activation-plan.md`
