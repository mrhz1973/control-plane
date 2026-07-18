# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/runtime/LAST_HANDOFF_VERIFY.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-07-18 — D-0059-W wf48 parser 1–5 repository canonization; Gate E OPERATOR_DECISION_PENDING.

---

## Stato operativo attuale

- Foundation: completa. Workflow **40/42**: **ATTIVO** (unchanged). Workflow **41**: off.
- **D-0059-W wf48 parser 1–5 repository canonization** = **direct operator Opzione 1** (2026-07-18) — `decision_provenance=direct_operator_message`; `task_kind=repository_only_wf48_parser_canonization`:
  - Template `workflows/wg-telegram-inbound-decision-state-correlation.template.json` updated in **3** locations (callable normalization, external_receipt normalization, state correlation) to allow options **1–5**.
  - Validations: JSON parse PASS · fixture 4/5 accept · 6/0 reject · `active=false` · **no export created** · **`result_runtime=NOT_RUN_REPOSITORY_ONLY_CANONIZATION`**.
  - **`wf48_parser_1_5_repository_canonized=true`** · repository contract complete.
  - **`official_wf48_option_4_runtime_pass=false`** · **`official_wf48_option_5_runtime_pass=false`** — live official wf48 not run.
  - **NOT** L5 · **NOT** Gate E · callable 47→48 **not** validated · **`enable_wg48_handoff=false`** · **`l5_activation_authorized=false`** · **`n8n_ready=false`** · **PM-34 BLOCKED** · Cursor runtime = 0.
  - Evidenza: `docs/sessions/2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md`.
- **D-0055-W … D-0058-W wf47 official plain option 4 + fixture close** = **direct operator Opzione 1** each (2026-07-18):
  - D-0055/D-0056: `BLOCKED_CONFIGURATION_AUTH` (401); D-0057: official wf47 plain option **4** PASS; D-0058: close via **temporary** wf48 1–5 (`official_wf48_option_4_pass=false` at that time).
  - **Repository pendenza wf48 parser 1–5:** **risolta** by D-0059-W (template); live official 4/5 still **not run**.
  - Evidenza: `docs/sessions/2026-07-18-control-plane-d-0055-w-d-0058-w-wf47-option4-pass-and-wf48-manual-close.md`.
- **D-0054-W wf47 official inventory restore** = **direct operator Opzione 1** (2026-07-17) — `task_kind=wf47_official_inventory_restore`; `result_runtime=NOT_RUN_CONFIGURATION_ONLY`; inventory `PRESENT_IN_FINAL_N8N_LIST`; **not** a runtime PASS. Evidenza: `docs/sessions/2026-07-17-control-plane-d-0054-w-wf47-official-restore-configuration-only.md`.
- **D-0052-W L4 callback PASS** = **direct operator Opzione 1** (2026-07-17) — `result_runtime=PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L4_CALLBACK`:
  - Dedicated harnesses: `D-0052-T` option **5** accepted (`update_id=986228604`); `callback_ack_ok=true` (API call only); receipt one-item live PASS; wf48 `external_receipt` closed `state_persisted=true`.
  - **Parser (historical at D-0052):** option **5** live PASS; option **4** was **NOT_TESTED** then — **now superseded for option 4 by D-0057-W**.
  - **Spinner UX:** `NOT_DIRECTLY_OBSERVED` / `NOT_CLAIMED` (unchanged).
  - **Historical inventory finding (D-0052):** official wf47 was **`ABSENT_FROM_FINAL_N8N_LIST`** at teardown; later restored by D-0054-W.
  - Evidenza: `docs/sessions/2026-07-17-control-plane-d-0052-w-l4-callback-pass-d0053g-option2.md`.
- **D-0053-G export governance** = **direct operator Opzione 2** (2026-07-17) — `decision_provenance=direct_operator_message`:
  - Original n8n exports remain **outside Git** (private local storage); GitHub records **SHA-256 only**.
  - **No** original/redacted/derived workflow JSON committed; **no** `workflows/**` change; **no** PROJECT_VISION §10 exception.
  - Hashes (orchestrator-verified): 45=`2d5fbffe…ede3c0` · 47=`af5b2627…04870e` · 48=`8477aa2f…245181`.
  - Evidenza: stessa session combinata D-0052/D-0053.
- **D-0050-W wf47 L3 repository implementation** = **direct operator Opzione 1** (2026-07-12) — parent **D-0049-W Opzione 1**:
  - **L3 repository:** template wf47 hardened; fixtures A–J PASS repo-side.
  - L4 runtime attestato via D-0052-W (harness); inventory restore via D-0054-W (configuration-only); L5 **still unauthorized**.
  - Evidenza: `docs/sessions/2026-07-12-control-plane-d-0050-w-wf47-callback-query-l3-implementation.md`.
- **D-0049-W polling-first architecture** = **direct operator Opzione 1** (2026-07-12) — `decision_provenance=direct_operator_message`; parent **D-0048-S Opzione 2**:
  - **L0/L1/L2:** completati **docs-only** — architettura inbound primaria = **wf47 polling-first** (`WF47_POLLING_FIRST`).
  - **We/46:** **DEPRECATED_AS_PRIMARY_PATH** — template/history **RETAINED_INACTIVE_WEBHOOK_FALLBACK**; **We live PASS=false**; blocker HTTPS **rimosso dal critical path**, resta debito se fallback riaperto.
  - **Superseded later:** L3 repository = D-0050-W; L4 harness callback = D-0052-W; official inventory restore = D-0054-W; L5 still unauthorized.
  - **`enable_wg48_handoff=false`**; **PM-34 BLOCKED**; **`n8n_ready=false`**; Gate E full PASS **false**.
  - Evidenza: `docs/sessions/2026-07-12-control-plane-d-0049-w-we-polling-first-architecture-decision.md`.
- **D-0047-G governance correction** = **direct operator Opzione 2** (2026-07-12) — `decision_provenance=direct_operator_message`:
  - **Decisione:** non ratificare D-0046-E Option 3; correggere record repository.
  - **D-0046-E Option 3:** `VOIDED_MISATTRIBUTED_OPERATOR_CHOICE` — raccomandazione GLM erroneamente registrata come scelta operatore.
  - **Gate E:** `OPERATOR_DECISION_PENDING` — nessuna scelta operatore valida corrente; runtime **non autorizzato** e **non eseguito**.
  - **D-0046-T:** **non creata**; nessun Telegram/workflow/store activity.
  - **`enable_wg48_handoff=false`**; **PM-34 BLOCKED**; **`n8n_ready=false`**; Gate E full PASS **false**.
  - Commits `4273bde`/`375f495` restano audit Git — superseded, **non** revertiti.
  - Evidenza: `docs/sessions/2026-07-12-control-plane-d-0047-g-governance-correction.md`.
- **D-0045-E wf48 external receipt close** = **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (2026-07-12, latest scope-limited runtime PASS) — **NOT Gate E full PASS** · **NOT runtime end-to-end automatico**:
  - **Decisione:** D-0045-E Opzione 1 — wf48 manual `external_receipt`; `enable_wg48_handoff=false`; **callable 47→48 non usato**.
  - **Input:** receipt wf47 già accettato riutilizzato (`D-0044-T`, `selected_option=1`, `update_id=986228602`); **wf47 non rieseguito**; **nessun nuovo Telegram**.
  - **48/Wg output:** `inspect_status=closed`; `prior_status=open`; `state_persisted=true`; `test_only=true`.
  - **Store finale:** `D-0044-T` **closed** — `selected_option=1`; `closed_at=2026-07-11T23:02:56.427Z`; `update_id=986228602`; `note_preview` vuoto.
  - **Teardown:** wf45/47/48 **inactive** (user-attested); no Active / Publish / Schedule.
  - Evidenza: `docs/sessions/2026-07-12-control-plane-d-0045-e-wf48-external-receipt-close-pass.md`.
- **wf45 → wf47 official bounded receipt** = **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (2026-07-12, arco precedente) — **NOT Gate E full PASS** · **NOT runtime end-to-end PASS**:
  - **Pre-hygiene:** `D-0041-T` closed manually (`note_preview=manual_hygiene_before_D-0044-T`); no other open rows.
  - **45 ufficiale (manual, inactive):** `D-0044-T` open-on-send — `telegram_send_ok=true`; `message_id=1205`; `http_status=200`; `open_action=insert`; `fan_out_items_in=1`; `test_only=true`; `pass_claimed=false`.
  - **47 ufficiale — blocker history (sintesi):** (1) `allowed_chat_not_configured`; (2) `no_parseable_decision_response` — root cause HTTP 404 su getUpdates (endpoint runtime non valido; risposta sanitizzata `statusCode=404`, `body.ok=false`); derivation OK in entrambi (`open_decision_ids_count=1`).
  - **Correzione operatore:** endpoint getUpdates corretto in n8n UI (nessun segreto registrato).
  - **47 verification run — receipt accepted:** `decision_id=D-0044-T`; `selected_option=1`; `update_id=986228602`; `offset_after_placeholder=986228603`; `last_handled_update_id` pre=986228601.
  - **Polling state persisted:** `wf47_polling_state_test` — `last_update_id=986228603`; `last_handled_update_id=986228602`; `handled_keys_json` aggiornato (chiave D-0044-T/1/986228602).
  - **D-0044-T in store (prima del close):** `status=open` intenzionalmente — close delegato a **48/Wg** (ora eseguito via D-0045-E).
  - **wf48 non chiamato in questo arco**; `enable_wg48_handoff=false`; no Active / no Publish / no Schedule.
  - Evidenza: `docs/sessions/2026-07-12-control-plane-wf45-wf47-official-bounded-receipt-pass.md`.
- **wf47 bounded runtime validation (derivation-only)** = **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (2026-07-11) — superseded per receipt ufficiale sopra; storico: `allowed_chat_not_configured`; receipt non testato. Evidenza: `docs/sessions/2026-07-11-control-plane-wf47-bounded-runtime-validation.md`.
- **Gate E wf47 ufficiale consolidation** = **bounded consolidation ready** + **bounded repo-side validation pass** (2026-07-11, repo-only, PR #7 merged `3c40070`) — superseded per runtime derivation da attestazione scope-limited sopra:
  - Template ufficiale `workflows/wf-telegram-inbound-polling-getupdates.template.json`: rimossa lista hardcoded `open_decision_ids_test_only`; derivation da `control_plane_decisions_test` (`status=open`, dedupe Set); `Collapse shared decisions load fan-out` + `Build getUpdates` `runOnceForAllItems`; inspect espone `open_decision_ids_source`, `store_derivation_bypassed=false`, `open_decision_ids_count`.
  - Validazione repo-side: JSON parse OK; dedupe simulation fixture → `["D-0041-T"]` count=1; invariant grep (`active=false`, `enable_wg48_handoff=false`).
  - **Runtime n8n non eseguito** da Cursor — bounded validation = repo-side only.
  - `enable_wg48_handoff=false` invariato; **wf48 non chiamato**; no Active / no Publish / no Schedule.
  - Export storico `workflows/exports/2026-07-02_wf-47-*` **non patchato** (snapshot post-Gate-D; template è artefatto canonico).
- **D-0041-E / D-0042-E** = **bounded PARTIAL PASS** (2026-07-09, user-attested) — **NOT Gate E full PASS** · **NOT global PASS runtime**:
  - **D-0041-E Opzione 1** approvata: fixture pulita **wf45** → store **open** → **47** derivation da store.
  - **wf45 evidence:** `telegram_send_ok=true`; `message_id=1203`; `http_status=200`; `decision_id=D-0041-T`; `open_action=insert`; `block_reason=null`; `fan_out_items_in=1`; `test_only=true`; `pass_claimed=false`.
  - **Store:** `D-0041-T` in `control_plane_decisions_test`, `status=open`; `selected_option`/`update_id`/`closed_at`/`note_preview` vuoti; righe reali = **1**.
  - **Stop pre-47 (D-0041-E):** **47 ufficiale/live** aveva ancora lista manuale hardcoded `open_decision_ids_test_only: ['D-1003-T']` → **47 ufficiale NON eseguito** per Gate E derivation.
  - **D-0042-E Opzione 1** approvata: import bounded separato workflow **47 test** con derivation da `control_plane_decisions_test`; **non** sostituisce 47 ufficiale; no Active / no Publish / no Schedule; `enable_wg48_handoff=false`; **wf48 non chiamato**.
  - **47 importato evidence:** `inspect_status=accepted`; `decision_id=D-0041-T`; `selected_option=1`; `update_id=986228601`; `duplicate_or_stale=false`; `block_reason=null`; `allowed_chat_configured=true`; `offset_after_placeholder=986228602`; `last_handled_update_id=986228600`; `open_decision_ids_source=control_plane_decisions_test`; `store_derivation_bypassed=false`; `test_only=true`. Post-run `wf47_polling_state_test`: `last_update_id=986228602`; `last_handled_update_id=986228601`; `handled_keys_json` aggiornato.
  - **PARTIAL PASS scope:** wf45 open-on-send fixture creation · accepted polling response da store derivation nel **47 importato test** · update polling state · wf48 non chiamato.
  - **NON Gate E full PASS perché:** derivation provata su workflow importato separato (non 47 ufficiale); `open_decision_ids_count=3` con `D-0041-T` ripetuto 3× mentre store aveva 1 riga reale; 47 ufficiale richiede consolidamento/export con store derivation e dedupe.
- **D-0040-E Gate E Phase 1** = **NO-GO preflight** (2026-07-09); no open rows pre-test; superseded da D-0041-E fixture path.
- **wf47→wf48 bounded automatic handoff** = **PASS_ATTESTATO_UTENTE** (2026-07-09); fixture **D-3045-T** consumata (closed); hygiene `control_plane_decisions_test` (4 righe `-T`, tutte closed); debito noto: parsing opzioni testato solo **1/2/3** vs §7.7 (**2–5**).
- Classifier / mapping preview: **D-0021**–**D-0025-L** PASS; **D-0027-R** Wd45 reverification PASS.
- **D-0028-A Option 2:** activation plan committed. **Gate A** PASS · **Gate B** inbound one-shot **PASS ATTESTATO UTENTE** (2026-06-07). **Gate D** bounded rehearsal **PASS ATTESTATO UTENTE / Claude-attested** (2026-07-02). **Option 4 not permanent loop.**
- **`n8n_ready=false`** unchanged. **No permanent automation declared**. Pezzi collegati ≠ loop avviato.
- **D-0032-W:** **completato e field-validated** — **PASS ATTESTATO UTENTE / Claude-attested** (2026-06-11). Trasporto **manuale one-shot operativo**: `tools/push-post-push-verifier-result.ps1` → verifier locale → SFTP alias `ionos-cpinbox` → `/srv/cp-verifier-inbox/latest.json` → workflow 57 reader `/files/control-plane-verifier-inbox/latest.json`. Invocazione canonica: `powershell -NoProfile -ExecutionPolicy Bypass -File tools\push-post-push-verifier-result.ps1` (`-ExecutionPolicy Bypass` = **solo process-level**; nessuna modifica policy persistente del nodo). **No schedule** · **no loop** · **no push-hook** · **no wrapper HTTP** · **no callable-from-n8n worker**.
- **Workflow 57 / Post-push verifier file reader TEST ONLY:** versionato (`9804765`); **Manual Trigger only**, **active=false**; field-validation **PASS ATTESTATO UTENTE** (2026-06-11); **non loop**, **non schedule**. wf40/42 untouched · wf41 off · no Telegram Trigger/Funnel/public webhook · **PM-34 BLOCKED**.
- **Runtime post-push verifier:** `tools/runtime-post-push-verifier.ps1` **implementato e hardened** — auto-source scoped LATEST. Trasporto remoto: **`docs/runtime/REMOTE_INVOCATION_TRANSPORT_DESIGN.md`** — **APPROVED** Opzione 2 (B) variante **manuale one-shot**; **field-validated end-to-end**.

## Latest verified PASS

- **Gate D — Bounded rehearsal (D-0033)**: **PASS ATTESTATO UTENTE / Claude-attested** — pre-step `D-9999-T` hygiene; Fase 1 `D-1001-T` manual + UI fix 45/47; Fase 2 `D-1002-T` time-boxed scheduled pickup within window; Addendum A `D-1003-T` handoff 47→48 with `state_persisted=true`; final inventory aligned with Gate A; **`enable_wg48_handoff=false`**. Evidenza: `docs/sessions/2026-07-02-control-plane-gate-d-rehearsal-pass.md`.
- **D-0032-W — Field-validation end-to-end (manual one-shot)**: **PASS ATTESTATO UTENTE / Claude-attested** — uploader + SFTP + wf57 manual read (`read_ok=true`, `hash_match=true`); cleanup `LATEST_JSON_CLEAN`. Evidenza: `docs/sessions/2026-06-12-control-plane-d-0032-w-field-validation-pass.md`.
- **Gate B — Inbound one-shot (D-0028-A)**: **PASS ATTESTATO UTENTE** — `D-1000-T` closed via **47/Wf** manual polling; `selected_option=1`, `update_id=986228573`. **Not** permanent loop. Evidenza: `docs/sessions/2026-06-07-control-plane-gate-b-inbound-one-shot-pass.md`.
- **Gate A — Readiness audit (D-0028-A)**: **PASS ATTESTATO UTENTE** — read-only inventory + classifier `/healthz`. Evidenza: `docs/sessions/2026-06-07-control-plane-gate-a-readiness-audit-pass.md`.
- **D-0027-R — Wd45 runtime reverification**: **PASS ATTESTATO UTENTE** — existing workflow **45/Wd**; test-only `D-9999-T`; `telegram_send_ok`, `message_id=748`. Evidenza: `docs/sessions/2026-06-07-control-plane-wd45-d9999t-runtime-reverification-pass.md`.
- **D-0025-L — Live classifier mapping preview**: **PASS ATTESTATO UTENTE** — workflow `56`. Evidenza: `docs/sessions/2026-06-07-control-plane-d0025l-live-mapping-preview-runtime-pass.md`.
- **D-0024-M — Decision Packet mapping preview (fixture-only)**: **PASS ATTESTATO UTENTE** — workflow `55`. Evidenza: `docs/sessions/2026-06-06-control-plane-d0024m-mapping-preview-runtime-pass.md`.
- **D-0023-N — Decision Packet mapping design**: **PASS** (docs-only). Evidenza: `docs/contracts/decision-packet-mapping-v1.md`, `docs/sessions/2026-06-05-control-plane-d0023n-decision-packet-mapping-design.md`.
- **D-0022-W / D-0021**: **PASS ATTESTATO UTENTE**.

## Decision Packet / Telegram / inbound / decision-store (known state)

Costruito e in gran parte **test-PASSato**; **NON attivo** come loop operativo.

| Asset | Stato | Note |
|-------|--------|------|
| **45 / Wd** | **PASS ATTESTATO UTENTE** + Gate D + **D-0041-E** + **official 2026-07-12** | `D-0044-T` open-on-send (`message_id=1205`); fan-out guard `fan_out_items_in=1`. **Inactive** post-test. |
| **46 / We** | **DEPRECATED_AS_PRIMARY_PATH** (D-0049-W); **RETAINED_INACTIVE_WEBHOOK_FALLBACK** | Package-prep completato; **We live PASS=false**; HTTPS blocker rilevante solo se fallback riaperto. |
| **47 / Wf** | **L3 PASS** + **L4 harness option 5** (D-0052) + **D-0054 inventory** + **D-0057 official plain option 4** | Official present, inactive/unpublished; `parser_option_4_live_pass=true`; Schedule disabled; `enable_wg48_handoff=false`. |
| **48 / Wg** | **PASS** + Gate D + closes + **D-0059 template 1–5** | Repository parser **1–5** canonized; **live** official option 4/5 **not run**; inactive/unpublished. |
| **49 / Wh** | Rehearsal **PASS**; **inattivo** | Not auto-promoted by Gate D. |
| **decision-store** | Gates **1–3 PASS** + Gate B/D + **official** + **D-0058** | `D-0055-T` **closed** (option 4, `update_id=986228607`); prior `-T` hygiene preserved. |

- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- **We/46 live**: **DEPRECATED_AS_PRIMARY_PATH** — **We live PASS=false**; retained inactive webhook fallback; HTTPS blocker bypassed on critical path.
- **Attivazione operativa inbound/loop**: **gate separato** — non deciso; eventuale prossimo runtime = **riuso/riverifica asset esistenti**, non nuovo workflow.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook fallback): **BLOCKED_PENDING_IF_FALLBACK_REOPENED** — non sul critical path (D-0049-W).
- **L5 activation:** inventory absence blocker **resolved** by D-0054-W (`l5_inventory_blocker_resolved=true`); **`l5_activation_authorized=false`** — next live test requires a separate direct-operator Decision Packet (**not** auto-started).

## Next gate

**Not auto-started.** **Gate D closed** (2026-07-02). Latest scope-limited runtime = **D-0057-W** (official wf47 plain option 4) + **D-0058-W** (temp wf48 close). Gate E = **OPERATOR_DECISION_PENDING**.

**Next frontier (non auto-started):**
1. **L5** still **unauthorized** — **`l5_activation_authorized=false`**.
2. **Live official wf48** validation of options 4/5 = **not run** (template contract 1–5 complete via D-0059-W).
3. Gate E **non** riparte automaticamente; richiede Decision Packet + risposta diretta operatore.
4. Callable 47→48 fresca **non attestata**; **`enable_wg48_handoff=false`**; **PM-34 BLOCKED**; **`n8n_ready=false`**.

**Gate E** — disposizione corrente: **OPERATOR_DECISION_PENDING** (D-0046-E Option 3 voided). PREP storico in [`AUTOMATION_ACTIVATION_PLAN.md`](AUTOMATION_ACTIVATION_PLAN.md) § Gate E. **Non** è Gate E full PASS.

Precondizioni Gate E — stato finding (storico, non aggiornato da D-0046-E):

1. **Fan-out 45/47** — attestazioni parziali 2026-07-12; Gate E full fan-out resta da attestare in run dedicato con decisione fresca.
2. **47 derivation + receipt + polling** — **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (2026-07-12 official).
3. **48 manual external_receipt close** — **PASS_ATTESTATO_UTENTE_SCOPE_LIMITED** (D-0045-E 2026-07-12).
4. **Callable 47→48 in stesso run** — **non testato** negli archi ufficiali 2026-07-12.
5. **Re-export 45/47 post-fix UI** — **chiuso** da `f6f5579`.
6. **`enable_wg48_handoff`** — default **`false`**.

Gates C / E / F: **not PASS** unless separately attested. Boundaries unchanged: **PM-34 BLOCKED** · **`n8n_ready=false`** · NO permanent schedule · wf40/42 untouched · pezzi collegati ≠ loop avviato.

## Redaction hygiene

- Policy aggiornata 2026-07-02 sera: il repo è trattato come non confidenziale; il precedente controllo locale `tools/redaction-check.sh` è stato rimosso; nessun redaction-check locale residuo; controllo compensativo = rotazione totale credenziali a fine progetto secondo `docs/ROTATION_CHECKLIST.md` (vedi PROJECT_VISION §10 v2.15). Invarianti confermati: **PM-34 BLOCKED** · **`n8n_ready=false`** · wf40/41/42 untouched · no permanent schedule · no public webhook · **Gate E solo via Decision Packet dedicato**.

## Handoff / post-push verification

- **Invariante §8.1 PROJECT_VISION:** report Cursor post-push deve includere output git verbatim (incluso `git ls-remote origin main`). Orchestratore **non** chiede shell utente se output già presente; verify-only Cursor se manca; shell utente = fallback finale.
- **`LAST_HANDOFF_VERIFY.md`:** artefatto persistente per `aggio control`; snapshot D-0032-W field-validation through `966f508`; `artifact_commit: PENDING_SELF_REFERENCE`. **PM-34 BLOCKED** · **`n8n_ready=false`**.
- **`AUTOMATIC_POST_PUSH_VERIFIER.md`:** design docs-only — future n8n/worker replaces manual verify paste; LLM not needed for hash equality.
- **`tools/runtime-post-push-verifier.ps1`:** **runtime verifier implementato e hardened** (structured JSON, PASS→exit 0 / FAIL→exit 1). **Auto-source scoped al blocco LATEST** di `LAST_CURSOR_REPORT.md` (mai da HISTORY); override manuale opzionale; fail-closed `expected_commit_unreadable`. Verifica indipendente contro il remoto. **No wrapper HTTP** · **no n8n runtime** · wf40/42 untouched · **PM-34 BLOCKED** · **`n8n_ready=false`**.
- **`tools/push-post-push-verifier-result.ps1`:** **uploader manuale one-shot operativo** — invocazione canonica `powershell -NoProfile -ExecutionPolicy Bypass -File tools\push-post-push-verifier-result.ps1`; child verifier + deposito SFTP alias `ionos-cpinbox`; field-validation **PASS ATTESTATO UTENTE** (2026-06-11). **No schedule** · **no loop** · wf57 inactive/manual.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook / PM-34 unlock / wf40/41/42 mutation.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO declaring prior test-PASS assets as permanent operational loop automation.
- NO declaring L5 PASS or Gate E full PASS without a dedicated Decision Packet + attestation.

## Audit

- Inbound/decision-store: sessions under `docs/sessions/2026-05-31-*`, `docs/sessions/2026-06-01-*`, `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`.
- Mapping preview / Wd reverification: `docs/sessions/2026-06-06-control-plane-d0024m-*`, `docs/sessions/2026-06-07-control-plane-d0025l-*`, `docs/sessions/2026-06-07-control-plane-wd45-d9999t-runtime-reverification-pass.md`.
- D-0028-A / Gates: `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md`, Gate A/B sessions `docs/sessions/2026-06-07-control-plane-gate-*`.
- D-0032-W field-validation: `docs/sessions/2026-06-12-control-plane-d-0032-w-field-validation-pass.md`.
- Gate D bounded rehearsal: `docs/sessions/2026-07-02-control-plane-gate-d-rehearsal-pass.md`.
- D-0059-W wf48 parser 1–5 repository canonization: `docs/sessions/2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md`.
- D-0055…D-0058 wf47 official plain option 4 + wf48 manual close: `docs/sessions/2026-07-18-control-plane-d-0055-w-d-0058-w-wf47-option4-pass-and-wf48-manual-close.md`.
- D-0054-W wf47 official inventory restore (configuration-only): `docs/sessions/2026-07-17-control-plane-d-0054-w-wf47-official-restore-configuration-only.md`.
- D-0052-W L4 callback PASS + D-0053-G Option 2: `docs/sessions/2026-07-17-control-plane-d-0052-w-l4-callback-pass-d0053g-option2.md`.
- D-0050-W wf47 L3 repository implementation: `docs/sessions/2026-07-12-control-plane-d-0050-w-wf47-callback-query-l3-implementation.md`.
- D-0049-W polling-first architecture: `docs/sessions/2026-07-12-control-plane-d-0049-w-we-polling-first-architecture-decision.md`.
- D-0047-G governance correction: `docs/sessions/2026-07-12-control-plane-d-0047-g-governance-correction.md`.
- D-0046-E Gate E stop (voided): `docs/sessions/2026-07-12-control-plane-d-0046-e-gate-e-stop-decision.md`.
- D-0045-E wf48 external receipt close: `docs/sessions/2026-07-12-control-plane-d-0045-e-wf48-external-receipt-close-pass.md`.
- wf45→wf47 official bounded receipt: `docs/sessions/2026-07-12-control-plane-wf45-wf47-official-bounded-receipt-pass.md`.
- wf47 bounded runtime validation (derivation-only): `docs/sessions/2026-07-11-control-plane-wf47-bounded-runtime-validation.md`.
- Hash / verify: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/runtime/LAST_HANDOFF_VERIFY.md`, `docs/runtime/AUTOMATIC_POST_PUSH_VERIFIER.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.
