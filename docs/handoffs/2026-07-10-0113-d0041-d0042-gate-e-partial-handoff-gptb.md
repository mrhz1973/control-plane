# HANDOFF GPT-B — control-plane — D-0041-E / D-0042-E bounded PARTIAL PASS + sanatoria §11.3

**Path canonico:** `docs/handoffs/2026-07-10-0113-d0041-d0042-gate-e-partial-handoff-gptb.md`  
**Ruolo:** GPT-B orchestratore dev-method / control-plane  
**Lingua:** Italiano — ogni risposta termina con **NEXT:** / **WAIT:** / **DONE:**

---

## Entry point / read-set (nuova chat)

Ordine operativo obbligatorio:

1. `docs/runtime/CURRENT_FRONTIER.md`
2. `docs/foundation/PROJECT_VISION.md`
3. `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
4. `docs/runtime/LAST_CURSOR_REPORT.md`
5. `docs/runtime/LAST_HANDOFF_VERIFY.md`
6. questo handoff

**Nota:** `PROJECT_VISION.md` resta entry point canonico §11.2; la nuova chat deve però leggere il read-set operativo nell'ordine canonico sopra. Tutti i file dal **repo vivo** a HEAD dichiarato — mai da copie incollate.

---

## Contatore turni

- **Handoff prodotto a:** circa 25 prompt utente nella chat operativa.
- **Nuova chat:** riparte da contatore **0**.
- **Regola:** handoff automatico ogni **20** prompt utente secondo `PROJECT_VISION.md` §11.2.

---

## HEAD osservato

**HEAD noto:** `a7b3bdba4761f03d1512d0cb225f4524407febb3`

**Provenienza:** output verbatim §8.1 dal report Cursor; verifica primaria demandata a shell Claude in nuova chat.

**Nota:** il report Cursor **non** è verifica primaria autonoma; attesta la provenienza dell'evidenza. La nuova chat deve far valere verifica shell / `git ls-remote origin main` quando richiesto.

---

## Riferimenti artefatti runtime

### `LAST_CURSOR_REPORT.md`

- `LATEST.real_task_commit` = `d4a1d173f59b4fb4a7140bdd07c117c0c0243b4b`
- Commit 1: `d4a1d17` — `docs: record d-0041-e d-0042-e bounded partial pass`
- Commit 2: `a7b3bdb` — `docs: refresh cursor report for d-0041-e d-0042-e partial pass`

### `LAST_HANDOFF_VERIFY.md`

- `verified_through_commit` = `85a91dad1f8ae40e5e3552c336c399caf00336dc`
- **Stale** rispetto ad `a7b3bdb`.
- Backfill pendente ristretto (commit 2 arco handoff compliance): solo `verified_rolling_report_commit` e `artifact_commit` dello snapshot `85a91da` → `0411f3e46ecd0b37800979768ed9b05a849cb144`. Altre occorrenze `PENDING_SELF_REFERENCE` = testo definizionale — non toccare.

---

## Stato reale progetto

| Invariante | Valore |
|------------|--------|
| Gate E full PASS | **NO** |
| D-0041-E / D-0042-E | **bounded PARTIAL PASS** registrato |
| PM-34 | **BLOCKED** |
| `n8n_ready` | `false` |
| `pm34_unblocked` | `false` |
| `enable_wg48_handoff` | `false` |
| wf48 | **non chiamato** |
| Active / Publish / Schedule permanente | **nessuno** |
| Webhook pubblico / Telegram Trigger | **nessuno** |
| wf40/41/42 | **untouched** |
| Cursor runtime n8n | **non eseguito** |
| Cursor workflow import/export | **non eseguito** |
| `workflows/**` / `data-tables/**` | **non toccati** da Cursor negli archi D-0041/42 |

---

## D-0041-E

- **Decisione approvata:** Opzione 1.
- **Scope:** fixture pulita wf45 → store open → wf47 derivation da store.
- **Fixture:** `D-0041-T`.

**wf45 risultato attestato:**

- `telegram_send_ok=true`
- `message_id=1203`
- `http_status=200`
- `decision_id=D-0041-T`
- `open_action=insert`
- `block_reason=null`
- `fan_out_items_in=1`
- `test_only=true`
- `pass_claimed=false`

**Store:**

- `control_plane_decisions_test` contiene `D-0041-T`
- `status=open`
- `selected_option` / `update_id` / `closed_at` / `note_preview` vuoti
- righe reali `D-0041-T` = **1**

**Stop pre-47:**

Il 47 ufficiale/live aveva ancora lista manuale hardcoded:

`open_decision_ids_test_only: ['D-1003-T']`

Quindi il **47 ufficiale non è stato eseguito** per Gate E derivation.

---

## D-0042-E

- **Decisione approvata:** Opzione 1.
- **Scope:** workflow 47 importato separato, test-only, con derivation da `control_plane_decisions_test`.
- **Non** sostituisce il 47 ufficiale.
- No Active / Publish / Schedule.
- `enable_wg48_handoff=false`.
- wf48 **non chiamato**.

**Telegram prima del run:** `dp:D-0041-T:1`

**47 importato risultato:**

- `inspect_status=accepted`
- `decision_id=D-0041-T`
- `selected_option=1`
- `update_id=986228601`
- `duplicate_or_stale=false`
- `block_reason=null`
- `allowed_chat_configured=true`
- `offset_after_placeholder=986228602`
- `last_handled_update_id=986228600`
- `open_decision_ids_source=control_plane_decisions_test`
- `store_derivation_bypassed=false`
- `open_decision_ids_count=3`
- `open_decision_ids` = `D-0041-T` ripetuto tre volte
- `test_only=true`

**Post-run:**

- `control_plane_decisions_test`: `D-0041-T` righe reali = **1**
- `wf47_polling_state_test`: `last_update_id=986228602`; `last_handled_update_id=986228601`; `handled_keys_json` aggiornato

---

## Giudizio registrato

**D-0041-E / D-0042-E = bounded PARTIAL PASS** per:

- wf45 open-on-send fixture creation
- polling accepted da store derivation nel 47 importato test
- update polling state
- wf48 non chiamato

### NON Gate E full PASS perché

1. derivation provata su workflow importato separato, non sul 47 ufficiale
2. `open_decision_ids_count=3` con `D-0041-T` ripetuto tre volte, mentre store aveva una sola riga reale
3. 47 ufficiale richiede consolidamento/export con store derivation e dedupe

---

## Decisioni / pendenze non consolidate

- Destino **D-0039-E** da chiarire/chiudere (superato, mai consumato).
- Codifica stato **PARTIAL** da formalizzare in modo coerente nei record runtime.
- Lezione modello Cursor da codificare in `CURSOR_PROMPT_TEMPLATE.md` §B.
- Decisione §11.3 via **(a)**: ratifica utente di ritorno a handoff committati nel path canonico.
- Check versione n8n vs **CVE-2025-68668** al prossimo accesso UI.
- Backfill `LAST_HANDOFF_VERIFY.md` ristretto ai due campi dello snapshot `85a91da` — pendente fino al commit 2 arco handoff compliance.

---

## Lezione modello Cursor

Task con verifiche verbatim → **Opus 4.7 medium**; **Composer sconsigliato**.

Conoscenza di sessione valida; codifica in `CURSOR_PROMPT_TEMPLATE.md` §B **pendente**. Metadati modello restano **fuori** dal blocco prompt copiabile.

---

## Prossimo gate reale

Consolidare il fix nel **47 ufficiale**:

1. 47 ufficiale deve leggere `control_plane_decisions_test`
2. Deve derivare gli ID open da `status=open`
3. Deve eliminare fan-in duplication: una sola item downstream oppure dedupe Set su `openDecisionIds`
4. Mantenere `enable_wg48_handoff=false` salvo nuova decisione
5. Rerun bounded validation — no Active / Publish / Schedule
6. Non chiamare wf48 finché non autorizzato

---

## Nota Cursor prompt

Usare **delta-style** secondo `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`. Metadati routing/modello/repo restano **fuori** dal prompt copiabile.

---

## Invariante §8.1

Mai report chat come verifica primaria. Verify-only Cursor prima del fallback shell utente.

---

**DONE:** handoff GPT-B conforme a `HANDOFF_TEMPLATE.md` e §11.3 — nuova chat può partire da read-set canonico.
