# Workflow 42 — Diff-summary Telegram MVP (template-only)

**Repository:** `mrhz1973/control-plane`  
**Artifact:** `workflows/42-diff-summary-mvp.template.json`  
**Date:** 2026-05-27 (final new-commit automatic PASS — Diff-summary ATTIVO)  
**Status:** **final PASS** · `PROJECT_VISION.md` §1.1 **ATTIVO** · operator n8n active (schedule 120s)

---

## Stato attuale (2026-05-27)

| Area | Status |
|------|--------|
| MVP value (GitHub + files + Telegram) | **Proven** |
| Manual dedupe | **PASS** |
| Activation duplicate-skip | **PASS** |
| First new-commit automatic diff-summary | **PASS** — SHA `727db3e`, 1 Telegram, no duplicate in 3–5 min |
| `PROJECT_VISION.md` §1.1 Diff summary | **ATTIVO** |

Sessions:

- [2026-05-27 final new-commit automatic PASS](sessions/2026-05-27-control-plane-workflow-42-final-new-commit-automatic-pass.md)
- [2026-05-27 activation duplicate-skip PASS](sessions/2026-05-27-control-plane-workflow-42-activation-duplicate-skip-pass.md)
- [2026-05-27 manual dedupe PASS](sessions/2026-05-27-control-plane-workflow-42-manual-dedupe-pass.md)
- [2026-05-27 duplicate blocked (storico)](sessions/2026-05-27-control-plane-workflow-42-manual-runtime-partial-pass-duplicate-blocked.md)

---

## Runtime observation 2026-05-27

### Duplicate blocked (storico — prima del fix template)

Operator imported wf42 in n8n UI, configured Telegram (same bot/chat as wf40), published and tested.

**PASS (prima iterazione):**

- GitHub API list + commit detail/files for `mrhz1973/cursor-coordinate-converter`
- Telegram message with commit `58c5c46`, file `docs/control-plane-watch-test.md`, commit URL

**FAIL / BLOCKED:**

- Duplicate Telegram messages for the same commit (e.g. 00:19, 00:20) while schedule was active
- Dedupe key `github:mrhz1973/cursor-coordinate-converter:wf42_diff_summary_last_sha` did not prevent repeats under concurrent/scheduled runs

**Containment:** workflow 42 turned off by operator; template fix in Git (`7b486f9`).

### Manual dedupe PASS (post-fix re-import)

After re-import of fixed template (`schedule-disconnected`, `activation-blocked` tags):

| Test | Result |
|------|--------|
| First Manual Trigger (~00:30) | **1** Telegram on commit `58c5c46` (correct content) |
| Second Manual Trigger (same SHA, immediate) | **0** Telegram — duplicate skip **PASS** |

Schedule was **disabled / disconnected** in Git template at manual test time; operator later activated in n8n UI (see below).

### Activation duplicate-skip PASS

After manual dedupe PASS, operator activated workflow 42 with schedule 120s in n8n UI.

| Execution (local) | Status | Telegram |
|-------------------|--------|----------|
| 2026-05-27 01:10 | Succeeded | **0** (duplicate skip) |
| 2026-05-27 01:11 | Succeeded | **0** (duplicate skip) |

**Known SHA:** `58c5c46` (already notified manually). Schedule is **active** and does **not** re-send for known SHA.

Vedi [session activation duplicate-skip PASS](sessions/2026-05-27-control-plane-workflow-42-activation-duplicate-skip-pass.md).

### Final new-commit automatic PASS

New real commit on `mrhz1973/cursor-coordinate-converter`:

| Field | Value |
|-------|--------|
| SHA | `727db3e` |
| Message | `test: trigger workflow 42 automatic diff summary` |
| File | `docs/workflow-42-auto-diff-summary-validation-2026-05-27.md` |

| Check | Result |
|-------|--------|
| Automatic `CONTROL PLANE diff-summary` Telegram | **1** message received |
| Duplicate within 3–5 minutes | **0** — PASS |
| `PROJECT_VISION.md` §1.1 | Updated to **ATTIVO** |

Vedi [session final PASS](sessions/2026-05-27-control-plane-workflow-42-final-new-commit-automatic-pass.md).

---

## 1. Scopo

Eliminare l’apertura manuale di GitHub per capire **cosa è cambiato** dopo un commit sul repo prodotto `mrhz1973/cursor-coordinate-converter`.

Il workflow 42 invia su Telegram un riepilogo meccanico breve (2–3 righe operative + URL) con SHA, messaggio, elenco file (fino a 5 nomi) e link al commit — senza AI, senza provider API, senza mutare workflow 40/41.

---

## 2. Collegamento a `PROJECT_VISION.md`

| Sezione | Riferimento |
|---------|-------------|
| **§1 Principio di valore** | Riduce micro-interazioni meccaniche ripetute |
| **§1.1 Diff summary Telegram** | **ATTIVO** — workflow 42 su `cursor-coordinate-converter` (2026-05-27) |
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
| Activation duplicate-skip (schedule 120s) | **PASS** |
| First new-commit automatic diff-summary | **PASS** (SHA `727db3e`) |
| `PROJECT_VISION.md` §1.1 | **ATTIVO** |
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

### A. Manual dedupe test — **PASS** (2026-05-27)

Completato post-fix: 1 Telegram su `58c5c46`, secondo Manual Trigger → 0 Telegram. Vedi [session PASS](sessions/2026-05-27-control-plane-workflow-42-manual-dedupe-pass.md).

### B. Activation schedule — duplicate-skip **PASS** (2026-05-27)

Operator activated workflow + schedule 120s. Runs 01:10 and 01:11 succeeded with **0** duplicate Telegram for SHA `58c5c46`. Vedi [session](sessions/2026-05-27-control-plane-workflow-42-activation-duplicate-skip-pass.md).

### C. First new-commit automatic diff-summary — **PASS** (2026-05-27)

Commit `727db3e` → exactly **1** automatic Telegram; no duplicate in 3–5 min. `PROJECT_VISION.md` §1.1 → **ATTIVO**. Vedi [session](sessions/2026-05-27-control-plane-workflow-42-final-new-commit-automatic-pass.md).

---

## 8. Tracciamento valore

**Tracciamento valore:** **COMPLETATO** 2026-05-27 — `PROJECT_VISION.md` §1.1 `Diff summary Telegram (workflow 42)` → **ATTIVO** dopo workflow 42 PASS su nuovo commit automatico senza duplicati.

**Scope:** MVP attivo su repo target `cursor-coordinate-converter` only; estensione ad altri repo resta gate separato.

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
- Diff-summary Telegram MVP **ATTIVO** in `PROJECT_VISION.md` §1.1 (workflow 42, target repo).
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
