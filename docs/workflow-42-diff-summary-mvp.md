# Workflow 42 — Diff-summary Telegram MVP (template-only)

**Repository:** `mrhz1973/control-plane`  
**Artifact:** `workflows/42-diff-summary-mvp.template.json`  
**Date:** 2026-05-26  
**Status:** template-only · `active=false` · not imported · not active

---

## 1. Scopo

Eliminare l’apertura manuale di GitHub per capire **cosa è cambiato** dopo un commit sul repo prodotto `mrhz1973/cursor-coordinate-converter`.

Il workflow 42 invia su Telegram un riepilogo meccanico breve (2–3 righe operative + URL) con SHA, messaggio, elenco file (fino a 5 nomi) e link al commit — senza AI, senza provider API, senza mutare workflow 40/41.

---

## 2. Collegamento a `PROJECT_VISION.md`

| Sezione | Riferimento |
|---------|-------------|
| **§1 Principio di valore** | Riduce micro-interazioni meccaniche ripetute |
| **§1.1 Diff summary Telegram** | Riga futura: «Apertura GitHub per leggere cosa è cambiato» — ancora **NON ATTIVO** fino a gate valore post-activation |
| **§7.4 n8n template-first** | Template JSON + doc companion; `active: false`; import/activation gate separati |
| **§7.5 no provider API by default** | Nessuna chiamata a provider AI/API a pagamento |
| **§10 Invarianti** | GitHub fonte di verità; no segreti in Git; wf 40/41 intatti; PM-34 gated; `n8n_ready=false` |

---

## 3. Artefatto prodotto

| File | Ruolo |
|------|--------|
| `workflows/42-diff-summary-mvp.template.json` | Template n8n importabile, inattivo |
| `docs/workflow-42-diff-summary-mvp.md` | Companion (questo documento) |

**Nome workflow consigliato:** `42 - CP diff summary Telegram MVP - cursor-coordinate-converter - TEMPLATE`

---

## 4. Configurazione MVP

| Parametro | Valore |
|-----------|--------|
| Repo target | `mrhz1973/cursor-coordinate-converter` |
| Polling | **120 secondi** (Schedule Trigger dedicato wf42) |
| GitHub auth | **Unauthenticated** — nessun PAT nel template |
| Telegram | Riuso **stessa** credential/chat del workflow 40 — configurazione manuale in n8n UI dopo import |
| Stato | **template-only** — not imported, not active |
| Indipendenza | Polling proprio su GitHub API; **non** ascolta trigger interni wf40; **nessun** nodo emitter su wf40 |

**Chiave dedupe wf42 (Data Table):** `github:mrhz1973/cursor-coordinate-converter:wf42_diff_summary_last_sha` — separata dalle chiavi wf40.

---

## 5. Nota rate limit

- Il **workflow 40** usa credenziale autenticata `githubApi`, quindi quota GitHub **autenticata** circa **5000 req/h**.
- Il **workflow 42** usa GitHub API **unauthenticated**, quindi usa contatore **separato** circa **60 req/h**.
- I due contatori **non si sommano**.
- Polling **120 s** equivale a circa **30 req/h** (1 list + 1 detail ogni 120 s su commit nuovo; meno se dedupe salta la seconda chiamata), quindi resta sotto il limite del proprio contatore anonymous.
- **Nessun rischio** di rate-limit reciproco con workflow 40.
- **PAT read-only** resta opzione futura **gated** perché è credenziale.

---

## 6. Gates ancora chiusi

| Gate | Stato |
|------|--------|
| Import in n8n UI | **Gated** |
| Activation schedule | **Gated** |
| Modifica workflow 40 | **Forbidden** |
| Modifica workflow 41 | **Forbidden** |
| PAT GitHub | **Gated** (credenziale) |
| Nuovo bot / chat Telegram | **Forbidden** |
| PM-34 unlock | **Gated** |
| Runtime worker automatico | **Gated** |
| Provider API (OpenAI, ecc.) | **Forbidden** by default |
| Deploy / tag / rollback | **Forbidden** |

---

## 7. Procedura manuale futura (NON eseguita da Cursor)

1. Utente verifica JSON template in repo (no segreti, `active=false`).
2. Utente importa manualmente in **n8n UI**.
3. Utente mappa **stessa** credential Telegram `CONTROL PLANE - Telegram Bot` e **stesso** `chatId` del workflow 40 (sostituire placeholder `CONFIGURE_*`).
4. Utente esegue **test manuale** (Manual Trigger).
5. Solo dopo ulteriore gate esplicito: **activation** schedule 120 s.

---

## 8. Tracciamento valore

**Tracciamento valore (gate futuro, NON in questo task):** dopo activation e primo diff-summary verificato su Telegram, aggiornare `docs/foundation/PROJECT_VISION.md` sezione 1.1 spostando la riga `Diff summary Telegram (futuro)` da NON ATTIVO ad ATTIVO con un commit minimal di una riga.

---

## 9. Fallback graceful

| Scenario | Comportamento |
|----------|----------------|
| GitHub API non risponde / errore | Nodo prepara `skipTelegram`; nessun messaggio; nessuna modifica al repo target |
| Telegram fallisce | Stato esterno critico invariato; upsert SHA solo dopo invio riuscito (ordine nodi: Telegram → upsert) |
| Rate limit anonymous | Aumentare intervallo schedule o valutare PAT read-only solo con **gate credenziali** |
| Dettaglio commit senza `files` | Messaggio con `File: dettaglio commit non disponibile` o `nessun file elencato` |

---

## 10. Dichiarazioni esplicite

- **Workflow 40** resta **bit-identico** (questo task non lo modifica).
- **Workflow 41** resta **bit-identico**.
- Questo task **non importa** e **non attiva** workflow 42 in n8n.
- Questo task **non autorizza** runtime VPS/n8n oltre la produzione di template in Git.
- Questo task **non sblocca** PM-34.
- Questo task **non imposta** `n8n_ready=true`.
- Placeholder Telegram: `CONFIGURE_SAME_CHAT_ID_AS_WORKFLOW_40`, `CONFIGURE_TELEGRAM_CREDENTIAL_ID` — **nessun** token/chat_id reale in Git.

---

## Flusso nodi (sintesi)

```text
Manual / Schedule 120s
  → Data Table load state
  → Set repo (cursor-coordinate-converter only)
  → GET /commits?per_page=1 (unauthenticated)
  → Dedupe wf42 state key
  → IF new → GET /commits/{sha} → format IT message → Telegram → upsert SHA
  → ELSE skip
```

**Riferimento statico (non modificato):** `workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json`
