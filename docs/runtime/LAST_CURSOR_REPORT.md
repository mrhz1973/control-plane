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
task_ref: wf47-wg-wh-final-manual-runtime-rehearsal-pass
result_cursor: PASS
result_runtime: PASS_ATTESTATO_UTENTE
real_task_commit: 98a3b4ff89d2341a45b01fd9ff2b74c279433946
rolling_report_commit: 7892716a3d10598d68fa3e084ef9bd6c93de0d15
branch: main
verification_rule: PASS is based on deterministic user-attested runtime output plus Git commit evidence
remote_hash_verbatim: 98a3b4ff89d2341a45b01fd9ff2b74c279433946
timestamp_utc: 2026-05-31T18:45:00Z
```

- `real_task_commit` = commit reale del task (`docs: record Wf47 Wg Wh final rehearsal pass`). È l'hash da verificare nella chain di `origin/main`.
- `rolling_report_commit` = commit leggero che aggiorna solo questo report. NON è il commit del task. Impostato nel commit di hygiene del report (vedi session log).
- `remote_hash_verbatim` = snapshot di `git ls-remote origin main` al push del task commit 1; `real_task_commit` deve restare nella chain anche se HEAD remoto avanza.
- `result_runtime` = evidenza runtime attestata dall'utente (output deterministico sanitizzato).

Snapshot al push del task commit:

```text
98a3b4ff89d2341a45b01fd9ff2b74c279433946	refs/heads/main
```

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task: è il commit 2 che aggiorna solo questo file.
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Nessun segreto**: token, chat_id, webhook, PAT, API key, OAuth, URL con token.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. La cronologia precedente è recuperabile da
**Git history** (`git log`) e dai **session log** in `docs/sessions/`.

```yaml
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

- task_ref: chat-id-policy-gate-csv-convention-wf49-ready
  real_task_commit: 12ed1b8e4fdfbca193d31e29ae05a58561bf45c7
  result_cursor: PASS
  timestamp_utc: 2026-05-31T15:31:10Z
```
