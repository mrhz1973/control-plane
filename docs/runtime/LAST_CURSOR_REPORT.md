# LAST CURSOR REPORT — control-plane (rolling)

## Purpose

Registro su GitHub dell'evidenza post-push di Cursor, in formato leggibile e parsabile
(Markdown + blocco YAML-like). Il verificatore del PASS legge l'hash remoto da qui sul
remoto, oppure direttamente da `git ls-remote origin main` — **non** dalla chat Cursor.
Fonte primaria del PASS resta `PROJECT_VISION.md` §7.1 (hash remoto su `main`). Questo
file è l'artefatto persistente di quell'hash, non una sua sostituzione.

---

## LATEST

```yaml
task_ref: wg48-correlate-safe-branch-input
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: 177f973f65947cbb6f65d7e988a08520a1f5b21c
rolling_report_commit: PENDING_HYGIENE_CLOSE
branch: main
verification_rule: PASS requires fixed template commit in origin/main chain; controlled 47->48 runtime gate remains manual/user-attested later
remote_hash_verbatim: PENDING_HYGIENE_CLOSE
timestamp_utc: 2026-06-01T17:30:00Z
```

- `real_task_commit` = `workflow: fix Wg48 safe branch input` (`177f973`). **Non** è `771d030` (handoff template) né rolling-only docs.
- `result_runtime` = **NOT_RUN_BY_CURSOR** — Phase 2 controlled 47→48 handoff runtime remains user-attested.
- Verifica: `git merge-base --is-ancestor 177f973 origin/main` → exit 0; template su `main` ha try/catch su entrambi i branch source.

Snapshot task commit (safe branch fix):

```text
177f973f65947cbb6f65d7e988a08520a1f5b21c	refs/heads/main
```

Snapshot `origin/main` HEAD (post Phase 1c hygiene close):

```text
PENDING_HYGIENE_CLOSE	refs/heads/main
```

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Nessun segreto**: token, chat_id, webhook, PAT, API key, OAuth, URL con token.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: wf47-wg-controlled-handoff-template
  real_task_commit: 771d03087d46ec5e3247ad7f97922b2cd8b03aad
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-01T16:45:00Z

- task_ref: wf47-limited-schedule-runtime-pass
  real_task_commit: 563f1ba7c1232f1af7de79531023fd24c0eb4761
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-01T16:00:00Z

- task_ref: wf47-schedule-trigger-id-fix
  real_task_commit: 9d56f144c6f4152156d17d46504e584e24a6ed9b
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-01T15:30:00Z

- task_ref: wf47-wg-live-manual-handoff-pass
  real_task_commit: 580e2b5a153a34409243d2319aea2290d0d8b2bb
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-01T14:00:00Z

- task_ref: wg48-external-receipt-mode
  real_task_commit: 18c9dd0f9e0e922877a4d3dd567ff50f9af5f544
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-01T12:00:00Z
```
