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
task_ref: d0025l-live-preview-runtime-pass
result_cursor: PASS
result_runtime: PASS_ATTESTATO_UTENTE
real_task_commit: d762f5ebae68bc18765b409485eba36aa7266cdb
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS = user-attested manual n8n live classifier mapping preview run + docs evidence commit in origin/main + redaction check exit 0; live classifier called by user in n8n only; no HTTP/Telegram/webhook/schedule/Funnel by Cursor; no workflow 40/41/42 mutation; no workflow 49; no PM-34 unlock; no n8n_ready=true; no permanent automation declared
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-06-07
```

- D-0025-L live classifier mapping preview runtime **PASS ATTESTATO UTENTE**.
- Workflow **56** manual single run; `fail_closed_synthesized=false`.
- Classifier output: `high` / `human_gate` / confidence `high` / reason `guard:secrets_touched` (keyword-guard on `"secrets"` in test summary).
- `no_send_performed=true`. No Telegram/webhook/schedule/Funnel.
- **PM-34 BLOCKED**. **`n8n_ready=false`** unchanged.
- `rolling_report_commit` / `remote_hash_verbatim` = **PENDING_SELF_REFERENCE** finché questo LATEST resta il più recente; backfill in HISTORY al task successivo (`PROJECT_VISION.md` §8.1).

Snapshot task commit:

```text
d762f5ebae68bc18765b409485eba36aa7266cdb	refs/heads/main
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
- task_ref: d0025l-live-mapping-preview-workflow-template
  real_task_commit: cff4e8aabf8e481e9943509256029c9c049d4b32
  rolling_report_commit: 4dd1c76d7b197f5c4e32b5c1ce5763f080c241fd
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-06T00:08:33Z

- task_ref: d0024m-mapping-preview-runtime-pass
  real_task_commit: f1f48fb8ab6c6215c0fc2122473a324d005220e4
  rolling_report_commit: b53811b0b652954322b2480d7b0d9e209d7776cb
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-05T23:16:05Z

- task_ref: d0024m-mapping-preview-workflow-template
  real_task_commit: faa758ea59dff3c8e13668bd71ec8571137f83b7
  rolling_report_commit: a3694119bae795b45f1fec2715ff08e5d2b25508
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-05T23:06:03Z

- task_ref: d0023n-decision-packet-mapping-design
  real_task_commit: 207aaec645de2f0aa90a28345f88eef3296a0c05
  rolling_report_commit: a933375d85306aeaf6220ee992eb2355e5657d16
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-05T22:43:07Z

- task_ref: redact-tailnet-identifiers-and-check
  real_task_commit: c77cfae63140b013db460eaddc9edce5b2bdb458
  rolling_report_commit: cec31921e2daa78ec76bd481466d8312024afb06
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-05T22:22:44Z
```
