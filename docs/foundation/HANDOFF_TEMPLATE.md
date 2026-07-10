# HANDOFF TEMPLATE — control-plane

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/foundation/HANDOFF_TEMPLATE.md`  
**Versione:** 1.0 — 2026-07-10  
**Lingua:** Italiano  
**Ruolo:** scheletro obbligatorio riutilizzabile per handoff conformi a `PROJECT_VISION.md` §11.3.

---

## Giustificazione ROI (§7.8)

Il template previene handoff non conformi che costringono la nuova chat a ricostruire contesto da narrativa chat o da copie stale. **Caso concreto (2026-07-10):** handoff operativo D-0041/D-0042 con tre campi obbligatori §11.3 mancanti (path canonico committato, read-set ordinato, riga di provenienza esplicita).

---

## Come usare questo file

1. Copiare la struttura sotto in `docs/handoffs/YYYY-MM-DD-HHMM-<topic>-handoff-<ruolo>.md`.
2. Compilare **tutti** i placeholder; non omettere sezioni.
3. Committare nel path canonico prima di chiudere la chat (via **(a)** ratificata in §11.3).
4. La nuova chat legge dal **repo vivo** a HEAD dichiarato — mai da copie incollate in chat.

---

## Titolo / topic

**Titolo:** `<TOPIC_BREVE>`  
**Ruolo produttore:** `<Claude | GPT-B | altro>`  
**Path canonico:** `docs/handoffs/YYYY-MM-DD-HHMM-<topic>-handoff-<ruolo>.md`

---

## Entry point / read-set (nuova chat)

Ordine operativo obbligatorio:

1. `docs/runtime/CURRENT_FRONTIER.md`
2. `docs/foundation/PROJECT_VISION.md`
3. `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
4. `docs/runtime/LAST_CURSOR_REPORT.md`
5. `docs/runtime/LAST_HANDOFF_VERIFY.md`
6. handoff corrente (questo file o coppia Claude/GPT-B dello stesso arco)

**Nota:** `PROJECT_VISION.md` resta **entry point canonico** §11.2; il **read-set operativo** della nuova chat segue però l'ordine **FRONTIER → PROJECT_VISION → CURSOR_PROMPT_TEMPLATE → LAST_CURSOR_REPORT → LAST_HANDOFF_VERIFY → handoff**.

Tutti i file vanno letti dal **repo vivo** a HEAD dichiarato nell'handoff, **mai** da copie incollate in chat.

---

## Contatore turni

**Contatore sessione corrente:** `<N>/20` (soglia §11.2)  
**Nuova chat:** riparte da contatore **0**.

---

## HEAD osservato

**HEAD verificato:** `<sha_completo>`  
**Branch:** `main` (salvo eccezione documentata)

### Provenienza (obbligatoria)

**provenienza:** `shell ls-remote` | `report Cursor verbatim §8.1`

- **Consentito:** output `git ls-remote origin main` da shell Claude; oppure output post-push verbatim da report Cursor (come attestazione provenienza, non verifica primaria autonoma).
- **Vietato:** `web`, narrativa chat, report incollati senza provenienza dichiarata.

### Ultimo commit su main

`<sha>` — `<commit subject>`

### Eventuale divergenza raw (nota secondaria)

`<nota o "nessuna">` — **non** equivale a FAIL se `git ls-remote` conferma HEAD.

---

## Stato reale workflow/runtime

`<stato sintetico: workflow attivi/inattivi, n8n_ready, PM-34, handoff flags, ecc.>`

---

## Ultimo risultato utile

`<ultimo arco chiuso con evidenza verificabile>`

---

## Decisioni non consolidate

- `<decisione 1>`
- `<decisione 2>`

---

## Gate aperti reali

- `<gate 1>`
- `<gate 2>`

---

## Prossimo passo tattico

`<azione concreta successiva, un arco alla volta>`

---

## Riferimenti artefatti runtime

| Artefatto | Campo | Valore |
|-----------|-------|--------|
| `LAST_CURSOR_REPORT.md` | `LATEST.real_task_commit` | `<sha>` |
| `LAST_HANDOFF_VERIFY.md` | `verified_through_commit` | `<sha>` |

**Nota stale (se applicabile):** `<es. verified_through_commit stale rispetto a HEAD dichiarato>`

---

## Invariante §8.1 (richiamo obbligatorio)

- **Mai** usare report chat come verifica primaria del PASS.
- Se il report Cursor include già output post-push verbatim completi (`§8.1`), l'orchestratore **non** chiede shell manuale all'utente.
- In assenza di output: prompt **Cursor verify-only** prima del fallback shell utente.

---

## Entry point canonico

La nuova chat deve trattare `docs/foundation/PROJECT_VISION.md` come **entry point canonico** del progetto, poi seguire il read-set operativo sopra.

---

## Invarianti progetto (checklist)

- PM-34 BLOCKED (salvo aggiornamento esplicito)
- `n8n_ready=false` (salvo aggiornamento esplicito)
- `pm34_unblocked=false`
- `enable_wg48_handoff=false` (salvo test window autorizzato)
- wf40/41/42 untouched (salvo task esplicito)
- No schedule permanenti · no webhook pubblici · no Telegram Trigger (salvo gate)
- Gate E full PASS = NO (salvo attestazione separata)

---

**Fine template.**
