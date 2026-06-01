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
task_ref: wg48-external-receipt-mode
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: 18c9dd0f9e0e922877a4d3dd567ff50f9af5f544
branch: main
verification_rule: PASS requires commit in origin/main; runtime gate remains manual/user-attested later
remote_hash_verbatim: 18c9dd0f9e0e922877a4d3dd567ff50f9af5f544
timestamp_utc: 2026-06-01T12:00:00Z
```

- `real_task_commit` = commit reale del task (`workflow: add Wg external receipt mode`). È l'hash da verificare.
- `result_runtime` = **NOT_RUN_BY_CURSOR** — live 47→48 handoff resta gate manuale utente dopo reimport 48 - Wg.
- `rolling_report_commit` = commit leggero che aggiorna solo questo report (non è il task commit).

Snapshot al push del task commit:

```text
18c9dd0f9e0e922877a4d3dd567ff50f9af5f544	refs/heads/main
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

- task_ref: wf47-wg-operationalization-plan-prep
  real_task_commit: 811c69e025222652a7cfd94e287e948cb0fe5dde
  result_cursor: PASS
  timestamp_utc: 2026-05-31T16:05:00Z

- task_ref: wh-manual-validation-pass
  real_task_commit: 341b847081f8e5e03d86631865b91a94f155c81b
  result_cursor: PASS
  timestamp_utc: 2026-05-31T15:57:34Z
```
