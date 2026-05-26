# Workflow 42 — Diff-summary Telegram MVP (template-only)

**Repository:** `mrhz1973/control-plane`  
**Artifact:** `workflows/42-diff-summary-mvp.template.json`  
**Date:** 2026-05-27 (updated after runtime observation)  
**Status:** **manual runtime partial PASS** · duplicate blocked · **activation blocked** · `active=false` in Git template

---

## Stato attuale (2026-05-27)

| Area | Status |
|------|--------|
| MVP value (GitHub + files + Telegram) | **Proven** in operator manual runtime |
| Dedupe / schedule safety | **BLOCKED** — duplicate messages observed for same SHA |
| Workflow activation | **NOT authorized** — operator deactivated wf42 |
| `PROJECT_VISION.md` §1.1 Diff summary | Resta **NON ATTIVO** — non aggiornare fino a gate valore |

Session: [2026-05-27 manual runtime partial PASS](sessions/2026-05-27-control-plane-workflow-42-manual-runtime-partial-pass-duplicate-blocked.md)

---

## Runtime observation 2026-05-27

Operator imported wf42 in n8n UI, configured Telegram (same bot/chat as wf40), published and tested.

**PASS:**

- GitHub API list + commit detail/files for `mrhz1973/cursor-coordinate-converter`
- Telegram message with commit `58c5c46`, file `docs/control-plane-watch-test.md`, commit URL

**FAIL / BLOCKED:**

- Duplicate Telegram messages for the same commit (e.g. 00:19, 00:20) while schedule was active
- Dedupe key `github:mrhz1973/cursor-coordinate-converter:wf42_diff_summary_last_sha` did not prevent repeats under concurrent/scheduled runs

**Containment:** workflow 42 turned off by operator; no further runs until template re-import and gated manual retest.

---

## Activation blocked

| Rule | Detail |
|------|--------|
| Do **not** activate workflow 42 in n8n | Until manual dedupe PASS |
| Do **not** enable Schedule Trigger | Node is `disabled: true` and **disconnected** in Git template |
| Import/publish must be safe | Only **Manual Trigger** is wired; schedule cannot fire until operator reconnects after gate |
| `active=false` in Git | Template default; activation is separate manual gate in n8n UI |

**Non attivare lo schedule** finché un test manuale singolo non produce **esattamente un** messaggio Telegram per commit SHA.

---

## 1. Scopo

Eliminare l’apertura manuale di GitHub per capire **cosa è cambiato** dopo un commit sul repo prodotto `mrhz1973/cursor-coordinate-converter`.

Il workflow 42 invia su Telegram un riepilogo meccanico breve (2–3 righe operative + URL) con SHA, messaggio, elenco file (fino a 5 nomi) e link al commit — senza AI, senza provider API, senza mutare workflow 40/41.

---

## 2. Collegamento a `PROJECT_VISION.md`

| Sezione | Riferimento |
|---------|-------------|
| **§1 Principio di valore** | Riduce micro-interazioni meccaniche ripetute |
| **§1.1 Diff summary Telegram** | Ancora **NON ATTIVO** — valore MVP provato ma dedupe/activation non passano |
| **§7.4 n8n template-first** | Template JSON + doc companion; `active: false`; import/activation gate separati |
| **§7.5 no provider API by default** | Nessuna chiamata a provider AI/API a pagamento |
| **§10 Invarianti** | GitHub fonte di verità; no segreti in Git; wf 40/41 intatti; PM-34 gated; `n8n_ready=false` |

---

## 3. Artefatto prodotto

| File | Ruolo |
|------|--------|
| `workflows/42-diff-summary-mvp.template.json` | Template n8n importabile, inattivo, schedule disconnected |
| `docs/workflow-42-diff-summary-mvp.md` | Companion (questo documento) |

**Nome workflow consigliato:** `42 - CP diff summary Telegram MVP - cursor-coordinate-converter - TEMPLATE`

---

## 4. Configurazione MVP

| Parametro | Valore |
|-----------|--------|
| Repo target | `mrhz1973/cursor-coordinate-converter` |
| Polling (when gated) | **120 secondi** — Schedule node disabled/disconnected until activation |
| GitHub auth | **Unauthenticated** — nessun PAT nel template |
| Telegram | Riuso **stessa** credential/chat del workflow 40 — configurazione manuale in n8n UI |
| Stato Git template | `active=false` · schedule **not connected** |
| Indipendenza | Polling proprio; **non** ascolta wf40; **nessun** emitter su wf40 |

**Chiave dedupe wf42:** `github:mrhz1973/cursor-coordinate-converter:wf42_diff_summary_last_sha`

**Dedupe (template v2):**

- Lookup **per chiave** (`Data Table - Get wf42 row by key`) subito prima del branch — non più `Load all` all’inizio
- Confronto SHA normalizzato (`trim`)
- Ramo duplicate → **Skip** senza Telegram
- **Upsert** solo dopo nodo `Confirm Telegram success` (dopo invio Telegram)

---

## 5. Nota rate limit

- Il **workflow 40** usa credenziale autenticata `githubApi`, quindi quota GitHub **autenticata** circa **5000 req/h**.
- Il **workflow 42** usa GitHub API **unauthenticated**, quindi usa contatore **separato** circa **60 req/h**.
- I due contatori **non si sommano**.
- Polling **120 s** equivale a circa **30 req/h**, sotto il limite anonymous.
- **Nessun rischio** di rate-limit reciproco con workflow 40.
- **PAT read-only** resta opzione futura **gated** perché è credenziale.

---

## 6. Gates ancora chiusi

| Gate | Stato |
|------|--------|
| Activation (workflow active + schedule) | **Blocked** until dedupe manual PASS |
| Import in n8n UI | Operator action only |
| Modifica workflow 40 | **Forbidden** |
| Modifica workflow 41 | **Forbidden** |
| PAT GitHub | **Gated** |
| Nuovo bot / chat Telegram | **Forbidden** |
| PM-34 unlock | **Gated** |
| Provider API | **Forbidden** |
| Deploy / tag / rollback | **Forbidden** |

---

## 7. Procedura manuale (operator)

### A. Dopo fix template su GitHub (required now)

1. Verificare commit GitHub con template aggiornato + session log.
2. **Re-import** workflow in n8n UI (sostituisce versione con schedule disconnected).
3. Configurare Telegram placeholder → stessa credential/chat del wf40.
4. **Non** attivare workflow.
5. **Non** abilitare Schedule Trigger.
6. Eseguire **un solo** test con **Manual Trigger**.
7. Verificare: **1** messaggio Telegram per SHA; riesecuzione immediata → **0** messaggi (duplicate skip).

### B. Activation (solo dopo A PASS + gate esplicito)

1. Confermare dedupe manuale PASS senza duplicati.
2. Abilitare nodo `Schedule Trigger - 120s (DISABLED until activation gate)`.
3. Collegare output Schedule → `Data Table - Get wf42 row by key` (stesso ingresso del flusso manuale dopo Set repo — operatore collega Schedule → **Set target repo** per parità con Manual).
4. Gate separato: **Activate** workflow in n8n UI.

**Nota collegamento schedule:** in n8n UI collegare Schedule → `Set target repo (wf42 only)` (parallelo a Manual Trigger).

---

## 8. Tracciamento valore

**Tracciamento valore (gate futuro, NON raggiunto):** dopo activation **e** primo diff-summary **senza duplicati** verificato su Telegram, aggiornare `docs/foundation/PROJECT_VISION.md` sezione 1.1 spostando `Diff summary Telegram (futuro)` da NON ATTIVO ad ATTIVO con commit minimal di una riga.

**Stato attuale:** valore parzialmente provato; tracciamento **non** ancora soddisfatto (dedupe + activation falliscono).

---

## 9. Fallback graceful

| Scenario | Comportamento |
|----------|----------------|
| GitHub API error | `skipTelegram`; no Telegram; no upsert |
| Duplicate SHA | Skip branch; no Telegram |
| Telegram fail | Workflow stops; **no** upsert (SHA not persisted) |
| Rate limit | Increase interval or gated PAT |

---

## 10. Dichiarazioni esplicite

- **Workflow 40** e **41** restano **bit-identici** in Git.
- Questo documento **non** autorizza activation.
- **`n8n_ready=true`** non impostato.
- **PM-34** non sbloccato.
- Nessun segreto in Git (placeholder Telegram only).

---

## Flusso nodi (template v2)

```text
Manual Trigger only (Schedule disabled + disconnected in Git)
  → Set repo
  → GET /commits?per_page=1
  → Prepare metadata
  → Data Table GET by wf42 key
  → Dedupe
  → IF new → GET commit detail → format → Telegram → confirm → upsert SHA
  → ELSE skip (no Telegram)
```

**Riferimento statico (non modificato):** `workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json`
