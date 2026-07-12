# HANDOFF GPT-B — control-plane — D-0052-W L4 callback runtime decision pending

**Titolo:** D-0052-W wf47 callback-query L4 — review chiusa, scelta operatore pendente  
**Ruolo produttore:** GPT-B  
**Path canonico:** `docs/handoffs/2026-07-12-1235-d0052w-l4-decision-pending-handoff-gptb.md`

---

## Entry point / read-set (nuova chat)

Ordine operativo obbligatorio:

1. `docs/runtime/CURRENT_FRONTIER.md`
2. `docs/foundation/PROJECT_VISION.md`
3. `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
4. `docs/runtime/LAST_CURSOR_REPORT.md`
5. `docs/runtime/LAST_HANDOFF_VERIFY.md`
6. questo handoff

**Nota:** `PROJECT_VISION.md` resta entry point canonico §11.2; il read-set operativo segue FRONTIER → PROJECT_VISION → CURSOR_PROMPT_TEMPLATE → LAST_CURSOR_REPORT → LAST_HANDOFF_VERIFY → handoff.

Tutti i file vanno letti dal repo vivo, mai da copie incollate in chat.

---

## Contatore turni

**Contatore sessione corrente:** `40/40` secondo la soglia operativa diretta usata in questa chat.  
**Nuova chat:** riparte da `0`.

Nota di governance: `PROJECT_VISION.md` §11.2 conserva ancora il default storico `20`; la soglia `40` è stata una preferenza operativa di sessione e non è stata consolidata nel repository.

---

## HEAD osservato

**HEAD osservato pre-handoff:** `7a7eb9b5870995404c0a25870d6dec4e9f1830b8`  
**Branch:** `main`

### Provenienza

**provenienza:** GitHub connector live (`search_commits` + compare `7a7eb9b` ↔ `main` = identical); verifica primaria §8.1 del commit report demandata a output Cursor verify-only o shell `git ls-remote` nella nuova chat se necessaria.

### Ultimo commit su main osservato pre-handoff

`7a7eb9b5870995404c0a25870d6dec4e9f1830b8` — `docs: refresh runtime reports for D-0051-G`

### Eventuale divergenza raw

Nessuna divergenza rilevata dal connector. `LAST_HANDOFF_VERIFY.md` verifica intenzionalmente solo fino al commit sostanziale `a2d088912ee83603f5fd96b08921937c7d382914`; il report commit `7a7eb9b` resta self-reference pending secondo la convenzione rolling.

Nota: il commit che crea questo handoff avanza `main` oltre l’HEAD pre-handoff sopra; il nuovo contesto deve leggere il repo vivo e non trattare questo SHA come HEAD finale auto-referenziale.

---

## Stato reale workflow/runtime

- wf40 e wf42 attivi, invariati.
- wf41 off.
- wf47: template L3 hardened in repository; istanza runtime ufficiale invariata, inattiva/non pubblicata.
- Fixture A–J: PASS repository-side.
- Callback-query live PASS: `false`.
- `answerCallbackQuery` live PASS: `false`.
- wf45, wf47 e wf48: nessuna nuova esecuzione nell’arco D-0050-W/D-0051-G/D-0052-W review.
- `enable_wg48_handoff=false`.
- Nessuno Schedule permanente, webhook pubblico o Telegram Trigger.
- Gate E: `OPERATOR_DECISION_PENDING`.
- `n8n_ready=false`.
- `pm34_unblocked=false`; PM-34 BLOCKED.
- We/46: deprecato come path primario, conservato come fallback webhook inattivo; live PASS=false.

---

## Ultimo risultato utile

**D-0051-G chiuso — PASS_REPORT_ONLY_GOVERNANCE_CORRECTION.**

- Commit sostanziale correzione: `a2d088912ee83603f5fd96b08921937c7d382914` — `docs: correct D-0050-W commit provenance`.
- Rolling report: `7a7eb9b5870995404c0a25870d6dec4e9f1830b8` — `docs: refresh runtime reports for D-0051-G`.
- D-0050-W ora registra correttamente:
  - base pre-task `b0bfee43382b2de1a2fd5710fa3004c6c370af71`;
  - commit sostanziale intermedio `095933d9d0b9edb3edf42233225aa89d3e9f3f3d`;
  - tip sostanziale `9cc21624d4441a6a0ca676d4ff0f29cc05341243`;
  - report originale `7515fc9d922fb80f2003fbefde87957c18917a04` preservato;
  - `commit_convention_status=DEVIATION_RECORDED`.
- Nessun template, workflow runtime, frontier o Git history riscritto da D-0051-G.

---

## Decisioni non consolidate

- **D-0052-W** è un Decision Packet runtime L4 in stato `OPERATOR_DECISION_PENDING`.
- La review consultiva GLM finale ha dato **GO per Opzione 1**, ma questa è solo raccomandazione advisor e non vale come scelta operatore.
- La risposta utente che ha incollato la review GLM non contiene una scelta diretta `1/2/3`; anti-proxy rule invariata.
- Le condizioni GLM sono state incorporate nel packet finale:
  - import manuale di una copia test wf47 dal JSON canonico;
  - distinzione ACK `PASS` / `INCONCLUSIVE_EXPIRED_OR_INVALID_ID` / `BLOCKED_TECHNICAL_ERROR` basata sull’errore osservato, senza soglia temporale inventata;
  - nessun altro messaggio nella chat autorizzata tra click e Execute;
  - uso intenzionale della Data Table condivisa `wf47_polling_state_test`;
  - `D-0052-T` resta open se il run non è accepted, senza receipt sintetica;
  - istanza ufficiale wf47 non aggiornata intenzionalmente; eventuale import ufficiale appartiene a gate separato.

---

## Gate aperti reali

1. **D-0052-W scelta operatore:** scrivere direttamente `1`, `2` oppure `3`.
2. Se Opzione 1 viene scelta: L4 runtime reale su n8n/Telegram, un solo click e un solo run business, con teardown obbligatorio.
3. L5 live activation resta separato e non autorizzato.
4. Gate E resta separato e `OPERATOR_DECISION_PENDING`.
5. PM-34 resta BLOCKED.

---

## Prossimo passo tattico

La nuova chat deve presentare in forma compatta il Decision Packet finale D-0052-W e ottenere una scelta diretta dell’operatore:

- `1` = L4 completo con ACK reale come criterio principale;
- `2` = L4 business-only, ACK non richiesto per il PASS business;
- `3` = fermare L4.

Non preparare istruzioni runtime né avviare n8n prima della scelta diretta.

---

## Riferimenti artefatti runtime

| Artefatto | Campo | Valore |
|-----------|-------|--------|
| `LAST_CURSOR_REPORT.md` | `LATEST.real_task_commit` | `a2d088912ee83603f5fd96b08921937c7d382914` |
| `LAST_HANDOFF_VERIFY.md` | `verified_through_commit` | `a2d088912ee83603f5fd96b08921937c7d382914` |

**Nota stale:** non è un errore: entrambi verificano il commit sostanziale D-0051-G; il successivo report commit `7a7eb9b` resta self-reference pending per design.

---

## Invariante §8.1

- Mai usare report chat come verifica primaria del PASS.
- Se il report Cursor include output post-push verbatim completi, l’orchestratore non chiede shell manuale all’utente.
- In assenza di output: prompt Cursor verify-only prima del fallback shell utente.

---

## Entry point canonico

La nuova chat deve trattare `docs/foundation/PROJECT_VISION.md` come entry point canonico del progetto, poi seguire il read-set operativo sopra.

---

## Invarianti progetto

- PM-34 BLOCKED.
- `n8n_ready=false`.
- `pm34_unblocked=false`.
- `enable_wg48_handoff=false`.
- wf40/41/42 untouched salvo task esplicito.
- Nessuno schedule permanente, webhook pubblico o Telegram Trigger.
- Gate E full PASS = NO.
- L4/L5 separati; nessun shortcut.
- D-0045-E resta ultimo PASS runtime scope-limited.
- Catena fresca wf45→wf47→callable-wf48 non attestata.

---

**Fine handoff.**