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
task_ref: d0024m-mapping-preview-runtime-pass
result_cursor: PASS
result_runtime: PASS_ATTESTATO_UTENTE
real_task_commit: f1f48fb8ab6c6215c0fc2122473a324d005220e4
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS = user-attested manual n8n fixture-only mapping preview run + docs evidence commit in origin/main + redaction check exit 0; no live classifier call; no HTTP/Telegram/webhook/schedule; no workflow 40/41/42 mutation; no workflow 49; no PM-34 unlock; no permanent automation declared
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-06-05T23:16:05Z
```

- `real_task_commit` = `docs: record D-0024-M mapping preview runtime PASS` (`f1f48fb`).
- `result_runtime` = **PASS_ATTESTATO_UTENTE** — user manually ran workflow 55 fixture-only mapping preview in n8n; no runtime by Cursor.
- `rolling_report_commit` / `remote_hash_verbatim` = **PENDING_SELF_REFERENCE** finché questo LATEST resta il più recente; backfill in HISTORY al task successivo (`PROJECT_VISION.md` §8.1).

Snapshot task commit:

```text
f1f48fb8ab6c6215c0fc2122473a324d005220e4	refs/heads/main
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

- task_ref: d0022w-n8n-classifier-manual-wiring-pass
  real_task_commit: eadd9287b154ba27235cbe8da876922e8dd6de17
  rolling_report_commit: 03c1e7b05313e87069e415abc78312c2dc94c0d9
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-05T19:14:04Z

- task_ref: classifier-tailscale-serve-auth-acl-pass
  real_task_commit: a8a198fa16fe10a709006c3d6f8ceb8f5d17d93f
  rolling_report_commit: 45231516831a9e6936c86e09ff1da1fb2d97d72c
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-04T01:03:27Z
```
