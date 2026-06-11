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
task_ref: d-0032-w-option1-passo2-verifier-result-uploader
result_cursor: PASS
result_runtime: PASS_ATTESTATO_UTENTE
real_task_commit: cc6c52551a4fc7b820af984c9ea6e299b6b30ae9
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS = manual SFTP uploader field-validated end-to-end (Passo 3); canonical invocation powershell -NoProfile -ExecutionPolicy Bypass -File tools\push-post-push-verifier-result.ps1; verifier PASS; SFTP upload succeeded; workflow 57 manual read read_ok=true result=PASS hash_match=true; cleanup LATEST_JSON_CLEAN; no schedule; no loop; wf57 inactive/manual; wf40/42 untouched; PM-34 BLOCKED; n8n_ready=false
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-06-11
```

- **D-0032-W Passo 3 field-validation:** **PASS ATTESTATO UTENTE / Claude-attested** (2026-06-11).
- Invocazione canonica: `powershell -NoProfile -ExecutionPolicy Bypass -File tools\push-post-push-verifier-result.ps1` (bypass solo process-level).
- Verifier PASS · SFTP upload succeeded · workflow 57 manual read: `read_ok=true`, `result=PASS`, `hash_match=true` · cleanup `LATEST_JSON_CLEAN`.
- **Non schedule.** **Non loop.** wf57 inactive/manual. wf40/42 untouched. **PM-34 BLOCKED.** **`n8n_ready=false`**.

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Orchestratore:** se il report Cursor include già l'output post-push verbatim completo (`PROJECT_VISION.md` §8.1), **non** chiedere shell manuale all'utente; leggere anche `docs/runtime/LAST_HANDOFF_VERIFY.md` durante `aggio control`; verify-only Cursor se manca/stale; shell utente = fallback finale.
- **Nessun segreto**: token, chat_id, webhook, PAT, API key, OAuth, URL con token.
- **Two-commit convention:** quando un task reale deve essere referenziato dal rolling report, Cursor crea prima il commit reale (commit 1), cattura l'hash con `git rev-parse HEAD`, e solo dopo crea il commit docs/report (commit 2). Cursor **non** deve mai predire o inventare il proprio hash futuro.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: workflow-57-post-push-verifier-file-reader
  real_task_commit: 9804765db6c1a77524007e5fc4ae8484a98caf63
  rolling_report_commit: 0d2567c176d87a04cf159c4c2cd5e0608c8811a9
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-08

- task_ref: remote-invocation-transport-design
  real_task_commit: 440015ba568f47d42fa2c9d3c77d0aebd2da7301
  rolling_report_commit: 9d48f37ddee49c2ad1b0993be8a9e21f69f5109a
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-08

- task_ref: runtime-post-push-verifier-latest-scoped-parser
  real_task_commit: 5d1514af500cdb31e344ecbb57759834dc1e783f
  rolling_report_commit: 636911332ce030b6b480fb1549d7ea5c4c96ba78
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-08

- task_ref: runtime-post-push-verifier-autosource
  real_task_commit: ae94a01d82f9ec64293cd48a585668e6c2f03bb4
  rolling_report_commit: 268e8837141272cb751c23083961e9355557a93f
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-08

- task_ref: runtime-post-push-verifier-script
  real_task_commit: 25586ea5cc10ea1f2d172b201f8201ee2300431c
  rolling_report_commit: 8df27d142a08dfcd8026c81ffde384aae19f36d9
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-08
```
