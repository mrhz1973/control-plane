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
task_ref: canonicalize-rolling-report-backfill-convention
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: c6051033aa3e80dd1ae682b0803369d517858c1a
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS = §8.1 chiarito + report allineato in origin/main; no runtime; no workflows/data-tables/foundation-altro modificati
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-06-03T22:17:00Z
```

- `real_task_commit` = `docs: canonicalize rolling report backfill convention (§8.1)` (`c605103`).
- `result_runtime` = **NOT_RUN_BY_CURSOR** — docs-only; nessun runtime n8n.
- `rolling_report_commit` / `remote_hash_verbatim` = **PENDING_SELF_REFERENCE** finché questo LATEST resta il più recente; backfill con lo SHA del rispettivo commit-report quando archiviato in HISTORY al task successivo (`PROJECT_VISION.md` §8.1). **Non** esiste un commit finalize-hash dedicato.

Snapshot task commit:

```text
c6051033aa3e80dd1ae682b0803369d517858c1a	refs/heads/main
```

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Nessun segreto**: token, chat_id, webhook, PAT, API key, OAuth, URL con token.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: decision-store-gate3-runtime-pass
  real_task_commit: 0f6605c7c0dd6fbd06f5a5480905ef91300a9dc6
  rolling_report_commit: 7f833e5af295ca59f79b49d46d237ec0ad706ba4
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-02T22:53:00Z

- task_ref: decision-store-gate2-template-no-runtime
  real_task_commit: fc1b398fa6d90e11d772e430b13681d101c1efd4
  rolling_report_commit: 29ebe2e10dba388122640be76e4e26fad96dbe42
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-01T23:55:00Z

- task_ref: decision-store-shared-design
  real_task_commit: f127696b10f1125499f892becdfa323e47151de7
  rolling_report_commit: 324858d77392fcc7acd3798b4312a86307b84b98
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-01T22:02:00Z

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
```
