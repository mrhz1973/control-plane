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
task_ref: wf47-disabled-schedule-trigger-template
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: c51e8a6e38fa5bfedeac5a7f41319cb648d7e83b
rolling_report_commit: 90494b80c39fa26e80e9ad4698c8ad9445da99fd
branch: main
verification_rule: PASS requires commit in origin/main; runtime schedule gate remains manual/user-attested later
remote_hash_verbatim: c51e8a6e38fa5bfedeac5a7f41319cb648d7e83b
timestamp_utc: 2026-06-01T13:45:00Z
```

- `real_task_commit` = commit reale del task (`workflow: add Wf47 disabled schedule trigger`). È l'hash da verificare.
- `result_runtime` = **NOT_RUN_BY_CURSOR** — Phase 2 limited schedule test on 47 - Wf remains user-attested.
- `rolling_report_commit` = commit leggero che aggiorna solo questo report (non è il task commit).

Snapshot al push del task commit:

```text
c51e8a6e38fa5bfedeac5a7f41319cb648d7e83b	refs/heads/main
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

- task_ref: anti-bureaucracy-momentum-correction
  real_task_commit: dc8fc7223c5a3e4c1303475504c65116afcf1f4c
  result_cursor: PASS
  timestamp_utc: 2026-05-31T18:35:00Z

- task_ref: wf47-wg-operationalization-checklist-prep
  real_task_commit: d410a8f1fb04db1b447574f55ba75ec4e3d8bdd3
  result_cursor: PASS
  timestamp_utc: 2026-05-31T16:10:00Z
```
