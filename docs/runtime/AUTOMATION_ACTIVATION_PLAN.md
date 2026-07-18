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

**Status (2026-07-18):** **OPERATOR_DECISION_PENDING** — D-0057-W = official wf47 plain option **4** scope-limited PASS; D-0058-W = fixture close via temporary wf48 1–5. L5 **still unauthorized**. Gate E Phase 1 runtime **non autorizzato** come full PASS. **Non** auto-avvia Gate E.

**Disposition record:** Session `docs/sessions/2026-07-18-control-plane-d-0055-w-d-0058-w-wf47-option4-pass-and-wf48-manual-close.md`. **`enable_wg48_handoff=false`** · **PM-34 BLOCKED** · **`n8n_ready=false`**.

**Future reopening (consultative advisory only):** condizioni operative da review GLM restano **riferimento consultivo** — **non** piano approvato né scelta operatore. Nuovo Decision Packet + risposta diretta operatore richiesti.

#### D-0055-W … D-0058-W disposition — official plain option 4 + manual close (2026-07-18)

| | |
|---|---|
| **D-0055-W / D-0056-W** | Option 1 each — `BLOCKED_CONFIGURATION_AUTH` (HTTP 401); `D-0055-T` stayed open |
| **D-0057-W** | Option 1 — `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_WF47_OFFICIAL_PLAIN_OPTION_4` (`D-0055-T` / option **4** / `update_id=986228607`) |
| **D-0058-W** | Option 1 — temporary wf48 external_receipt close; `official_wf48_option_4_pass=false` |
| **Parser** | Option **4** live PASS (official wf47); option **5** preserved (D-0052); official wf48 still **1–3** |
| **Pending** | Canonize official/template wf48 parser **1–5** (separate repo arc) |
| **L5 / Gate E** | **`l5_activation_authorized=false`** · Gate E **OPERATOR_DECISION_PENDING** · not full PASS |
| **Unchanged** | **`enable_wg48_handoff=false`** · **PM-34 BLOCKED** · **`n8n_ready=false`** |

#### D-0054-W disposition — wf47 official inventory restore (2026-07-17)

| | |
|---|---|
| **D-0054-W** | Option 1 — `direct_operator_message`; `task_kind=wf47_official_inventory_restore` |
| **result_runtime** | `NOT_RUN_CONFIGURATION_ONLY` — **not** a runtime PASS |
| **result_ui** | `PASS_ATTESTATO_UTENTE_CONFIGURATION_ONLY` |
| **Source** | Live canonical template `workflows/wf-telegram-inbound-polling-getupdates.template.json` @ `eea0b4a`; historical export **not** used |
| **Inventory** | `PRESENT_IN_FINAL_N8N_LIST` · local id `XALAlPKvMQ5GzUva` · inactive · unpublished · Schedule disabled |
| **L5 inventory blocker** | `prior=WF47_OFFICIAL_INSTANCE_ABSENT` · `l5_inventory_blocker_resolved=true` · **`l5_activation_authorized=false`** |
| **wf48 callable ref** | `PLACEHOLDER_NOT_CONFIGURED` · validation `NOT_IN_SCOPE` |
| **Executions** | `workflow_execute_count=0` · `functional_test_executed=false` |
| **Unchanged** | **`enable_wg48_handoff=false`** · **PM-34 BLOCKED** · **`n8n_ready=false`** · Gate E **OPERATOR_DECISION_PENDING** |

#### D-0052-W / D-0053-G disposition (2026-07-17)

| | |
|---|---|
| **D-0052-W** | Option 1 — `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L4_CALLBACK` (`D-0052-T` option 5; ack API OK; spinner UX not claimed) |
| **D-0053-G** | Option 2 — originals outside Git; SHA-256 only in repo; **no** workflow JSON / template / redacted export committed |
| **L4** | **Completed** (harness-scoped, user-attested) |
| **L5 (historical D-0052)** | Official wf47 was **absent** at D-0052 teardown; **current** inventory = D-0054-W present; L5 still **unauthorized** |
| **Parser (at D-0052)** | Repository 1–5; live option **5** PASS; option **4** was `NOT_TESTED` — later PASS via D-0057-W |
| **Unchanged** | **`enable_wg48_handoff=false`** · **PM-34 BLOCKED** · **`n8n_ready=false`** · Gate E **OPERATOR_DECISION_PENDING** |

#### D-0050-W disposition — wf47 L3 repository implementation (2026-07-12)

| | |
|---|---|
| **Decision** | D-0050-W Opzione 1 — wf47 callback-query L3 repository; parent D-0049-W Opzione 1 |
| **L3 repository** | **Completed** — template hardened; fixtures A–J PASS repo-side |
| **L4** | Superseded as “pending” by D-0052-W harness PASS (2026-07-17) |
| **L5** | Inventory restore = D-0054-W (configuration-only); activation still unauthorized |
| **Unchanged** | **`enable_wg48_handoff=false`** · **PM-34 BLOCKED** · **`n8n_ready=false`** · Gate E **OPERATOR_DECISION_PENDING** |

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

##### 2. Derivation 47 da decision-store + receipt/polling (operazionalizzato)

| | |
|---|---|
| **Comportamento richiesto** | **47** deriva l'elenco decisioni **open** da `control_plane_decisions_test` (query/load store), **non** da lista manuale hardcoded |
| **Vietato come fonte operativa** | Campo/lista `open_decision_ids_test_only` popolata manualmente in n8n UI come sostituto dello store |
| **Uso test-only ammesso** | Override fixture **solo** se nominato nel Decision Packet, confinato al run, e session log dichiara `store_derivation_bypassed=true` + motivo — **non** equivalente a comportamento operativo Gate E PASS |
| **Evidenza PASS (derivation + receipt)** | **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (2026-07-12 official): derivation `open_decision_ids_count=1`; receipt `accepted` (`D-0044-T`, `selected_option=1`, `update_id=986228602`); `wf47_polling_state_test` persisted. Session: `docs/sessions/2026-07-12-control-plane-wf45-wf47-official-bounded-receipt-pass.md` |
| **Evidenza PASS (manual external_receipt close)** | **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (D-0045-E 2026-07-12): `D-0044-T` closed via **48/Wg** manual `external_receipt` (`prior_status=open`, `state_persisted=true`, `update_id=986228602`); **wf47 non rieseguito**; **callable 47→48 non usato**; `enable_wg48_handoff=false`. Session: `docs/sessions/2026-07-12-control-plane-d-0045-e-wf48-external-receipt-close-pass.md` |
| **Fuori scope attestato** | **Callable automatico 47→48 nello stesso run** — non testato in D-0045-E; Gate E full chain resta **non** attestata |
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

#### Gate E runtime manual-only prompt — prepared, not executed

**Status:** prompt operativo preparato in questo file (2026-07-03). **Non eseguito.** **Non** è Gate E PASS. **Non** è PASS runtime.

> **QUESTO PROMPT FUTURO ESEGUE RUNTIME SOLO SE INCOLLATO IN UNA SUCCESSIVA FASE AUTORIZZATA.**
> **IL TASK ATTUALE LO PREPARA SOLTANTO.**

Il blocco sotto è il prompt copiabile per un futuro task Gate E runtime manual-only, **solo** dopo Decision Packet dedicato che autorizza esplicitamente il run.

---

**Prompt copiabile — Gate E runtime manual-only (futuro, non eseguire ora)**

You are working in `mrhz1973/control-plane`, branch `main`. This is a **Gate E Phase 1 runtime rehearsal — manual-only**. One decision/test case. One bounded window. **Do not** declare Gate E PASS or runtime PASS autonomously.

##### 1. Ruoli e responsabilità

| Ruolo | Responsabilità |
|-------|----------------|
| **Cursor** | Guida, legge stato repo/docs, produce checklist, raccoglie e organizza evidenze. **Non** dichiara PASS runtime autonomamente. **Non** clicca n8n, **non** invia Telegram, **non** modifica credenziali. |
| **Operatore** | Agisce manualmente su UI n8n/Telegram **un passo alla volta** quando il prompt dice `WAIT`. |
| **Orchestratore** | Decide GO/NO-GO sulla base del report e delle evidenze. |
| **Reviewer esterno** (quando disponibile) | Consultivo / verifica indipendente. **Non** sostituisce l'operatore. **Non** è gatekeeper pre-Gate E. |

##### 2. Preflight (obbligatorio prima di qualsiasi click n8n)

```bash
git status --short
git pull --ff-only origin main
BASE=$(git rev-parse HEAD)
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git ls-remote origin refs/heads/main
```

HEAD di riferimento al momento della preparazione prompt: `6832b9b7e0da42b0fcce5fb0da07cc5548e0eb6c`. **Non** trattare questo hash hardcoded come prova sufficiente: la prova effettiva richiede sempre output **fresco** di `git ls-remote origin refs/heads/main` e coerenza con `HEAD` / `origin/main`. Fermarsi se workspace dirty, branch ≠ `main`, o hash non allineati.

##### 3. Confine runtime

- Gate E runtime è **manual-only** — nessun automatismo oltre la singola azione confermata.
- **Una sola** decisione / test case per run.
- **Una sola** finestra temporale dichiarata nel Decision Packet.
- **Nessuno** schedule permanente.
- **Nessun** webhook pubblico.
- **Nessun** Telegram Trigger.
- **Nessun** Funnel.
- **Nessun** OpenClaw gateway.
- **Nessun** worker PM-34.
- **Nessun** Gate F.
- **`n8n_ready=false`** resta falso — non modificare.
- **`pm34_unblocked=false`** resta falso — non modificare.
- **40/41/42** non si toccano.
- **Nessun** export/import workflow.
- **Nessuna** modifica credenziali.

##### 4. Primo run Gate E — senza handoff 48

`enable_wg48_handoff` deve restare **`false`** per tutto il primo run Gate E.

Il test handoff 47→48 con `enable_wg48_handoff=true` richiede **addendum / Decision Packet separato** — non incluso nel primo run.

##### 5. Evidence collection (template — compilare durante il run, non ora)

```text
Gate E Runtime Evidence

- decision_id:
- update_id:
- timestamp_start:
- timestamp_end:
- workflow manuale eseguito:
- workflow non toccati:
- 45 Telegram messages observed:
- 47 items observed:
- decision-store snapshot pre-run:
- decision-store snapshot post-run:
- 47 derivation source:
- open_decision_ids_test_only used? yes/no:
- store_derivation_bypassed: yes/no
- bypass_reason: (solo se bypass test-only autorizzato)
- enable_wg48_handoff initial:
- enable_wg48_handoff final:
- schedules changed? yes/no:
- webhooks opened? yes/no:
- teardown completed? yes/no:
- stop conditions triggered? yes/no:
- operator attestation:
```

##### 6. Criteri numerici e stop immediato

| Asset | Limite |
|-------|--------|
| **45 / Wd** | **Esattamente 1** messaggio Telegram atteso per decisione |
| **47 / Wf** | **Massimo 5** item osservati/elaborati |

**Stop immediato** se:

- 45 > 1 messaggio inatteso
- 47 > 5 item
- ripetizione non richiesta
- `decision_id` non derivato dallo store
- `open_decision_ids_test_only` usato come fonte operativa (senza bypass test-only autorizzato e documentato)
- `enable_wg48_handoff` diventa `true`
- qualsiasi schedule permanente viene aperto
- qualsiasi workflow 40/41/42 viene toccato
- `n8n_ready` cambia
- `pm34_unblocked` cambia

##### 7. Procedura one-step (operatore — un passo alla volta)

**Non** eseguire raffiche di comandi o click. Ogni step attende conferma operatore.

1. **Preflight Git** (sezione 2) — solo read-only finché non GO orchestratore.
2. `WAIT:` incolla screenshot/stato n8n pre-run (inventory: 45/47/49 inactive; 47 Schedule deactivated; 48 callable/not scheduled; 40/41/42 unchanged; `enable_wg48_handoff=false`).
3. `WAIT:` conferma Decision Packet Gate E autorizzato (ID, scope, finestra).
4. `WAIT:` conferma hygiene store completata (se richiesta).
5. `WAIT:` operatore esegue **Manual Trigger 45/Wd** una volta — incolla evidenza send (`message_id`, conteggio messaggi = 1).
6. `WAIT:` operatore risponde su Telegram (se previsto dal test case).
7. `WAIT:` operatore esegue **Manual Trigger 47/Wf** — derivation da store; incolla output/count (`update_id`, item count ≤5, `inspect_status`).
8. **Non** eseguire handoff 48 nel primo run (`enable_wg48_handoff` resta `false`).
9. `WAIT:` incolla stato decision-store post-run.
10. **Teardown** (sezione 8).
11. Compila template Evidence (sezione 5).
12. Report finale (sezione 9).

##### 8. Teardown e kill switch

**Teardown obbligatorio post-run:**

- Verificare schedule **non** attivati (47/48/49).
- Verificare `enable_wg48_handoff=false`.
- Verificare nessun workflow 40/41/42 modificato.
- Verificare nessun webhook pubblico aperto.
- Chiudere eventuale finestra manuale.
- Fermarsi se qualunque condizione non torna — documentare NO-GO.

**Kill switch — azioni operatore umano (non eseguibili da Cursor):**

```text
handoff ora
disable/leave inactive any phase-1 schedule
inbound off
enable_wg48_handoff=false
stop immediately
```

Cursor **non** esegue queste azioni. Cursor guida, registra e organizza evidenza. L'operatore esegue manualmente in UI n8n/Telegram. Ogni azione runtime richiede gate reale `WAIT`.

##### 9. Report finale (obbligatorio — non dichiarare PASS runtime da Cursor)

Il report deve includere:

- Output git verbatim (`git rev-parse HEAD`, `git rev-parse origin/main`, `git ls-remote origin refs/heads/main`, `git status --short`, `git log --oneline -8`).
- Evidenze runtime (template sezione 5 compilato).
- Conteggio messaggi 45 e item 47.
- Stato pre/post decision-store.
- Stop conditions (sì/no, dettaglio).
- Teardown completato (sì/no).
- Conferma nessun 40/41/42 toccato.
- Conferma `n8n_ready=false`.
- Conferma `pm34_unblocked=false`.
- Conferma nessun Gate F avviato.
- **Dichiarazione esplicita:** Cursor **non** dichiara PASS runtime né Gate E PASS — attestazione operatore/orchestratore su evidenza.

##### 10. Rolling report e artefatti verification

- Il task che **prepara** questo prompt **non** aggiorna `LAST_CURSOR_REPORT.md` / `LAST_HANDOFF_VERIFY.md`.
- Il commit docs-only che prepara il prompt entra nel modello `PENDING_SELF_REFERENCE`.
- Registrazione/backfill artefatti verification: task docs-only **separato**, secondo two-commit convention.
- **Non** esiste finalize-hash commit dedicato.
- Nessun PASS runtime può essere registrato senza evidenza runtime e Decision Packet dedicato.

---

**Fine prompt copiabile Gate E runtime manual-only.**

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
