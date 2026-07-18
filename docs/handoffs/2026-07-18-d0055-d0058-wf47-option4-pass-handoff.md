# HANDOFF — control-plane — D-0055…D-0058 wf47 option 4 PASS + wf48 manual close

**Titolo:** D-0055–D-0058 official wf47 plain option 4 + temporary wf48 close
**Ruolo produttore:** Cursor
**Path canonico:** `docs/handoffs/2026-07-18-d0055-d0058-wf47-option4-pass-handoff.md`

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
`docs/sessions/2026-07-18-control-plane-d-0055-w-d-0058-w-wf47-option4-pass-and-wf48-manual-close.md`

---

## Contatore turni

**Contatore sessione corrente:** `1/20`
**Nuova chat:** riparte da `0`.

---

## HEAD osservato

**HEAD verificato (commit 1):** `48537b3e19ea60a120f29c263ace6fd9a773d258`
**Branch:** `main`

### Provenienza (obbligatoria)

**provenienza:** `report Cursor verbatim §8.1`

Verifica primaria successiva: shell/`git ls-remote` o connector indipendente — non trattare questo handoff come auto-certificazione del commit 2.

### Ultimo commit su main (commit 1 sostanziale)

`48537b3e19ea60a120f29c263ace6fd9a773d258` — `docs: record D-0055 wf47 option 4 pass and D-0058 close`

### Eventuale divergenza raw (nota secondaria)

nessuna al commit 1. Commit 2 (rolling reports + questo handoff) avanza HEAD oltre `48537b3`; `verified_through_commit` resta sul commit 1; `artifact_commit: PENDING_SELF_REFERENCE`.

---

## Stato reale workflow/runtime

- wf40/42 attivi; wf41 off; invariati.
- Official wf47: present, inactive, unpublished, Schedule disabled; `enable_wg48_handoff=false`.
- Official wf48: inactive, unpublished; parser canonico ancora **1–3**.
- `D-0055-T` **closed** (option 4, `update_id=986228607`).
- Temporary 45/47/48 copies deleted.
- `l5_activation_authorized=false`; Gate E `OPERATOR_DECISION_PENDING`; `n8n_ready=false`; PM-34 BLOCKED.

---

## Ultimo risultato utile

**D-0057-W** scope-limited PASS (official wf47 plain option 4) + **D-0058-W** manual close via temporary wf48 1–5.

- D-0055-W / D-0056-W: `BLOCKED_CONFIGURATION_AUTH` (401) — conservati.
- `parser_option_4_live_pass=true`; option 5 preserved from D-0052.
- `official_wf48_option_4_pass=false`.
- Commit 1: `48537b3e19ea60a120f29c263ace6fd9a773d258`.

---

## Decisioni non consolidate

- Canonizzazione official/template wf48 parser **1–5** = arco repository separato (non avviato).
- L5 / Gate E non autorizzati automaticamente.

---

## Gate aperti reali

1. Gate E: `OPERATOR_DECISION_PENDING` — richiede nuovo Decision Packet + risposta diretta operatore.
2. L5: `l5_activation_authorized=false`.
3. Official wf48 option 4 / parser 1–5: pendenza repository.
4. Callable 47→48: non attestato; `enable_wg48_handoff=false`.
5. PM-34 BLOCKED; `n8n_ready=false`.

---

## Prossimo passo tattico

Non auto-avviare L5 o Gate E. Eventuale prossimo arco: Decision Packet dedicato (es. canonizzazione wf48 1–5 in repo, oppure Gate E Phase 1) con scelta diretta operatore.

---

## Riferimenti artefatti runtime

| Artefatto | Campo | Valore |
|-----------|-------|--------|
| `LAST_CURSOR_REPORT.md` | `LATEST.real_task_commit` | `48537b3e19ea60a120f29c263ace6fd9a773d258` |
| `LAST_HANDOFF_VERIFY.md` | `verified_through_commit` | `48537b3e19ea60a120f29c263ace6fd9a773d258` |

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
- Official wf48 option 4 PASS = NO

---

**Fine handoff.**
