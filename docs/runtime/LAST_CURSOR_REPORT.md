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
task_ref: gate-a-readiness-audit-pass
result_cursor: PASS
result_runtime: PASS_ATTESTATO_UTENTE
real_task_commit: 7fd7377c0573b0e56e3784d3c6063bbc955e26c1
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS = user-attested Gate A read-only readiness audit + docs evidence commit in origin/main + redaction check exit 0; no workflow execution by Cursor; no n8n; no new workflow; no activation; Option 4 not started; PM-34 BLOCKED; n8n_ready=false
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-06-07
```

- Registrato **Gate A readiness audit PASS** (read-only inventory + classifier healthz).
- Workflows **45/46/47/48/49** inventoried; test Data Tables present; `/healthz` HTTP 200 `status:ok` (no token).
- Nessun workflow eseguito da Cursor. Nessun nuovo workflow. **Option 4 non avviata.**
- **PM-34 BLOCKED.** **`n8n_ready=false`**. Pezzi collegati ≠ loop avviato.
- `rolling_report_commit` / `remote_hash_verbatim` = **PENDING_SELF_REFERENCE** finché questo LATEST resta il più recente; backfill in HISTORY al task successivo (`PROJECT_VISION.md` §8.1).

Snapshot task commit:

```text
7fd7377c0573b0e56e3784d3c6063bbc955e26c1	refs/heads/main
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
- task_ref: d0028a-automation-activation-plan
  real_task_commit: f42c06e2a1881141dfa1342746fc22e4651007c4
  rolling_report_commit: e36d91d02efdb2ceb6528f7d43069a347feeedff
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-07

- task_ref: wd45-d9999t-runtime-reverification-pass
  real_task_commit: 17594d66721b4a3aca815bfccb9ac1566d692c4e
  rolling_report_commit: 1e1db5ef667635ee1d8eedab48323dec014b584c
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-07

- task_ref: decision-packet-runtime-state-reconciliation
  real_task_commit: e3ccf6c4e87abb23143deb4b0338291676f534d7
  rolling_report_commit: 33c537499c6b7e15e7ec8ccb703f6fb8afe9ffa5
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-07

- task_ref: d0025l-live-preview-runtime-pass
  real_task_commit: d762f5ebae68bc18765b409485eba36aa7266cdb
  rolling_report_commit: 5bfc1111ade20546a059be7f01362d36318e68da
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-07

- task_ref: d0024m-mapping-preview-runtime-pass
  real_task_commit: f1f48fb8ab6c6215c0fc2122473a324d005220e4
  rolling_report_commit: b53811b0b652954322b2480d7b0d9e209d7776cb
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-05T23:16:05Z
```
