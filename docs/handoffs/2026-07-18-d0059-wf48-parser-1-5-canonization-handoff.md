# HANDOFF — control-plane — D-0059-W wf48 parser 1–5 repository canonization

**Titolo:** D-0059-W wf48 parser options 1–5 repository canonization
**Ruolo produttore:** Cursor
**Path canonico:** `docs/handoffs/2026-07-18-d0059-wf48-parser-1-5-canonization-handoff.md`

---

## Entry point / read-set (nuova chat)

Ordine operativo obbligatorio:

1. `docs/runtime/CURRENT_FRONTIER.md`
2. `docs/foundation/PROJECT_VISION.md`
3. `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
4. `docs/runtime/LAST_CURSOR_REPORT.md`
5. `docs/runtime/LAST_HANDOFF_VERIFY.md`
6. questo handoff

**Nota:** `PROJECT_VISION.md` resta entry point canonico §11.2; read-set operativo FRONTIER → PROJECT_VISION → CURSOR_PROMPT_TEMPLATE → LAST_CURSOR_REPORT → LAST_HANDOFF_VERIFY → handoff.

Tutti i file dal repo vivo a HEAD dichiarato — mai da copie in chat.

**Evidenza (non duplicare):**
`docs/sessions/2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md`

---

## Contatore turni

**Contatore sessione corrente:** `1/20`
**Nuova chat:** riparte da `0`.

---

## HEAD osservato

**HEAD verificato (commit 1):** `4c67225d1996c07616a5a2089add976d65b9b4a4`
**Branch:** `main`

### Provenienza (obbligatoria)

**provenienza:** `report Cursor verbatim §8.1`

Verifica primaria successiva: shell/`git ls-remote` o connector indipendente — non trattare questo handoff come auto-certificazione del commit 2.

### Ultimo commit su main (commit 1 sostanziale)

`4c67225d1996c07616a5a2089add976d65b9b4a4` — `feat: canonize wf48 parser options 1-5`

### Eventuale divergenza raw (nota secondaria)

nessuna al commit 1. Commit 2 (rolling reports + questo handoff) avanza HEAD oltre `4c67225`; `verified_through_commit` resta sul commit 1; `artifact_commit: PENDING_SELF_REFERENCE`.

---

## Stato reale workflow/runtime

- wf40/42 attivi; wf41 off; invariati.
- Official wf47: present, inactive, unpublished, Schedule disabled; `enable_wg48_handoff=false`.
- Official/template wf48: inactive, unpublished; **repository parser canonizzato 1–5** (tre punti); live official option 4/5 **non eseguito**.
- `D-0055-T` closed (option 4) da arco D-0058 (temporary copy); invariato da questo task.
- `l5_activation_authorized=false`; Gate E `OPERATOR_DECISION_PENDING`; `n8n_ready=false`; PM-34 BLOCKED.
- Nessun export creato; Cursor runtime actions = 0.

---

## Ultimo risultato utile

**D-0059-W** Opzione 1 — `PASS_REPOSITORY_ONLY_IMPLEMENTATION` / `NOT_RUN_REPOSITORY_ONLY_CANONIZATION`.

- Template `workflows/wg-telegram-inbound-decision-state-correlation.template.json` aggiornato in **3** punti: callable normalization, external_receipt normalization, state correlation → options **1–5**.
- Fixture repository-side PASS (4/5 accept; 6/0 reject).
- `wf48_parser_1_5_repository_canonized=true`.
- `official_wf48_option_4_runtime_pass=false` · `official_wf48_option_5_runtime_pass=false`.
- Callable 47→48 **non** validato; `enable_wg48_handoff=false`.
- Commit 1: `4c67225d1996c07616a5a2089add976d65b9b4a4`.

---

## Decisioni non consolidate

- Live official wf48 validation options 4/5 = non avviata.
- Callable 47→48 fresco = non attestato.
- L5 / Gate E non autorizzati automaticamente.

---

## Gate aperti reali

1. Gate E: `OPERATOR_DECISION_PENDING` — richiede nuovo Decision Packet + risposta diretta operatore.
2. L5: `l5_activation_authorized=false`.
3. Live official wf48 option 4/5 runtime: not run.
4. Callable 47→48: non attestato; `enable_wg48_handoff=false`.
5. PM-34 BLOCKED; `n8n_ready=false`.

---

## Prossimo passo tattico

Non auto-avviare L5 o Gate E. Eventuale prossimo arco: Decision Packet dedicato (live official wf48 option 4/5, oppure Gate E Phase 1) con scelta diretta operatore. Repository contract 1–5 è già completo.

---

## Riferimenti artefatti runtime

| Artefatto | Campo | Valore |
|-----------|-------|--------|
| `LAST_CURSOR_REPORT.md` | `LATEST.real_task_commit` | `4c67225d1996c07616a5a2089add976d65b9b4a4` |
| `LAST_HANDOFF_VERIFY.md` | `verified_through_commit` | `4c67225d1996c07616a5a2089add976d65b9b4a4` |

**Nota stale:** intenzionale — puntano al commit 1; commit 2 rolling/handoff = self-reference pending.

---

## Invariante §8.1 (richiamo obbligatorio)

- Mai usare report chat come verifica primaria del PASS.
- Se il report Cursor include output post-push verbatim completi (§8.1), l'orchestratore non chiede shell manuale all'utente.
- In assenza di output: prompt Cursor verify-only prima del fallback shell utente.

---

## Entry point canonico

La nuova chat tratta `docs/foundation/PROJECT_VISION.md` come entry point canonico, poi segue il read-set operativo sopra. Policy materiali sensibili: PROJECT_VISION v2.18 / v2.16 (redazione a cura operatore).

---

## Invarianti progetto (checklist)

- PM-34 BLOCKED
- `n8n_ready=false`
- `pm34_unblocked=false`
- `enable_wg48_handoff=false`
- `l5_activation_authorized=false`
- Gate E full PASS = NO
- wf40/41/42 untouched
- No schedule permanenti · no webhook pubblici · no Telegram Trigger
- Official wf48 option 4 runtime PASS = NO
- Official wf48 option 5 runtime PASS = NO
- Template modificato, nessun export creato

---

**Fine handoff.**
