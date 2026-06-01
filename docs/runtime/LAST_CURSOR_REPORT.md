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
task_ref: decision-store-shared-design
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: f127696b10f1125499f892becdfa323e47151de7
rolling_report_commit: 324858d77392fcc7acd3798b4312a86307b84b98
branch: main
verification_rule: PASS = design docs commit in origin/main; no runtime; no workflow/data-table modified
remote_hash_verbatim: 324858d77392fcc7acd3798b4312a86307b84b98
timestamp_utc: 2026-06-01T22:02:00Z
```

- `real_task_commit` = `docs: design shared decision store open/close contract` (`f127696`).
- `result_runtime` = **NOT_RUN_BY_CURSOR** — Gate 1 design only; Gate 2/3 not started.

Snapshot task commit:

```text
f127696b10f1125499f892becdfa323e47151de7	refs/heads/main
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
- task_ref: wf47-wg-controlled-handoff-runtime-pass
  real_task_commit: 52ce5281402e2d3ed0519d806b05f8cba3714958
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-01T18:48:00Z

- task_ref: wg48-correlate-safe-branch-input
  real_task_commit: 177f973f65947cbb6f65d7e988a08520a1f5b21c
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-01T17:30:00Z

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
```
