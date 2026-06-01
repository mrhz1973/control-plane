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
task_ref: wf47-wg-controlled-handoff-template
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: 771d03087d46ec5e3247ad7f97922b2cd8b03aad
rolling_report_commit: PENDING_POST_COMMIT_2
branch: main
verification_rule: PASS requires commit in origin/main; controlled 47->48 runtime gate remains manual/user-attested later
remote_hash_verbatim: PENDING_POST_PUSH
timestamp_utc: 2026-06-01T16:45:00Z
```

- `real_task_commit` = `workflow: add Wf47 Wg controlled handoff` (templates + docs + frontier + session).
- `result_runtime` = **NOT_RUN_BY_CURSOR** — Phase 2 handoff runtime remains user-attested.
- `enable_wg48_handoff=false` default; IF short-circuits before Execute Workflow when off.
- `CONFIGURE_48_WORKFLOW_REFERENCE_IN_N8N_UI` — no hardcoded 48 workflow id in Git.

Snapshot task commit:

```text
771d03087d46ec5e3247ad7f97922b2cd8b03aad	refs/heads/main
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

- task_ref: wf47-disabled-schedule-trigger-template
  real_task_commit: c51e8a6e38fa5bfedeac5a7f41319cb648d7e83b
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-01T13:45:00Z
```
