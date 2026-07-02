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
task_ref: post-gate-d-policy-frontier-verify-only
result_cursor: PASS_VERIFY_ONLY
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: b462ee7eda6235797dab41ac822a331e30bbe7c5
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS verify-only = HEAD locale, origin/main e ls-remote refs/heads/main coincidono su b462ee7; workspace clean; branch main; nessun file modificato; nessun runtime n8n; nessun commit/push/branch/staging durante la verifica.
remote_hash_verbatim: "b462ee7eda6235797dab41ac822a331e30bbe7c5\trefs/heads/main"
timestamp_utc: 2026-07-03
```

- **Verify-only post Gate D / policy / frontier:** verifica Git read-only su `b462ee7` — HEAD locale = `origin/main` = ls-remote; workspace clean; branch `main`.
- **Non** è un PASS runtime; nessun runtime n8n eseguito o attivato da Cursor.
- Snapshot verifica attraverso `b462ee7`; il commit che aggiorna questo file **non** auto-certifica il proprio hash (`rolling_report_commit: PENDING_SELF_REFERENCE`).

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Orchestratore:** se il report Cursor include già l'output post-push verbatim completo (`PROJECT_VISION.md` §8.1), **non** chiedere shell manuale all'utente; leggere anche `docs/runtime/LAST_HANDOFF_VERIFY.md` durante `aggio control`; verify-only Cursor se manca/stale; shell utente = fallback finale.
- **Policy materiali sensibili v2.15:** il repo è trattato come non-confidenziale secondo `PROJECT_VISION.md` §10; non stampare o introdurre token, API key, OAuth material, PAT, URL con token, credential material o runtime dump non previsto. Chat_id e identificatori tailnet seguono le eccezioni/tolleranze documentate in `PROJECT_VISION.md` §10. Controllo compensativo finale: rotazione credenziali secondo `docs/ROTATION_CHECKLIST.md`.
- **Two-commit convention:** quando un task reale deve essere referenziato dal rolling report, Cursor crea prima il commit reale (commit 1), cattura l'hash con `git rev-parse HEAD`, e solo dopo crea il commit docs/report (commit 2). Cursor **non** deve mai predire o inventare il proprio hash futuro.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: d-0032-w-option1-passo2-verifier-result-uploader
  real_task_commit: cc6c52551a4fc7b820af984c9ea6e299b6b30ae9
  rolling_report_commit: 966f508d5b153a02421b5acecaac78a5c7c85535
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-11

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
```
