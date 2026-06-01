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
task_ref: wf47-limited-schedule-runtime-pass
result_cursor: PASS
result_runtime: PASS_ATTESTATO_UTENTE
real_task_commit: 563f1ba7c1232f1af7de79531023fd24c0eb4761
rolling_report_commit: 3efc7038ece7bcf614dbc7e27b3781f2580c76ba
branch: main
verification_rule: PASS is based on deterministic user-attested runtime output plus commit evidence in origin/main
remote_hash_verbatim: 3efc7038ece7bcf614dbc7e27b3781f2580c76ba
timestamp_utc: 2026-06-01T16:00:00Z
```

- `real_task_commit` = commit `docs: record Wf47 limited schedule pass` (session + frontier + runbooks).
- `result_runtime` = **PASS_ATTESTATO_UTENTE** — Phase 2 limited schedule test on 47 - Wf only; Cursor did not run n8n.
- `update_id` accepted once: **986228565**; second cycle did not re-accept.
- Verifica: `git ls-remote origin main` dopo push.

Snapshot task commit:

```text
563f1ba7c1232f1af7de79531023fd24c0eb4761	refs/heads/main
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
- task_ref: wf47-schedule-trigger-id-fix
  real_task_commit: 9d56f144c6f4152156d17d46504e584e24a6ed9b
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-01T15:30:00Z

- task_ref: wf47-disabled-schedule-trigger-template
  real_task_commit: c51e8a6e38fa5bfedeac5a7f41319cb648d7e83b
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-01T13:45:00Z

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

- task_ref: wf47-wg-wh-final-manual-runtime-rehearsal-pass
  real_task_commit: 98a3b4ff89d2341a45b01fd9ff2b74c279433946
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-05-31T18:45:00Z
```
