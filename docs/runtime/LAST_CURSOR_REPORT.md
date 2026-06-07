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
task_ref: runtime-post-push-verifier-autosource
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: ae94a01d82f9ec64293cd48a585668e6c2f03bb4
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS = verifier auto-sources real_task_commit from LAST_CURSOR_REPORT.md when -ExpectedTaskCommit is omitted, keeps optional manual override, fail-closed expected_commit_unreadable on unreadable/unparsable report, verifies expected commit independently against origin/main chain and HEAD==origin==ls-remote; no http wrapper; no n8n runtime; no workflow mutation; no secrets; PM-34 BLOCKED; n8n_ready=false
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-06-08
```

- Auto-source di `real_task_commit` da `docs/runtime/LAST_CURSOR_REPORT.md` quando `-ExpectedTaskCommit` è omesso; override manuale ancora disponibile.
- **Fail-closed:** report mancante/illeggibile/non parsabile o SHA non valida → `expected_commit_unreadable`, JSON strutturato, exit 1.
- **Circolarità limitata:** il report fornisce solo il valore dichiarato; il PASS dipende dalla verifica indipendente contro il remoto (chain di `origin/main`, `HEAD==origin==ls-remote`, branch `main`, workspace clean).
- **No wrapper HTTP.** **No n8n runtime.** **No workflow mutation.** **No secrets.**
- **PM-34 BLOCKED.** **`n8n_ready=false`**.
- `rolling_report_commit` / `remote_hash_verbatim` = **PENDING_SELF_REFERENCE** finché questo LATEST resta il più recente; backfill in HISTORY al task successivo.

Snapshot task commit:

```text
ae94a01d82f9ec64293cd48a585668e6c2f03bb4	refs/heads/main
```

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Orchestratore:** se il report Cursor include già l'output post-push verbatim completo (`PROJECT_VISION.md` §8.1), **non** chiedere shell manuale all'utente; leggere anche `docs/runtime/LAST_HANDOFF_VERIFY.md` durante `aggio control`; verify-only Cursor se manca/stale; shell utente = fallback finale.
- **Nessun segreto**: token, chat_id, webhook, PAT, API key, OAuth, URL con token.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: runtime-post-push-verifier-script
  real_task_commit: 25586ea5cc10ea1f2d172b201f8201ee2300431c
  rolling_report_commit: 8df27d142a08dfcd8026c81ffde384aae19f36d9
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-08

- task_ref: automatic-post-push-verifier-design
  real_task_commit: 2fff6572d2252453536a86b1510b3772808c341f
  rolling_report_commit: e809e926489fbff81a8e5aba76c061cd47e3b67a
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-07

- task_ref: last-handoff-verify-artifact
  real_task_commit: 3cb075a4b7b6b2b1b611a80dc15089fdcf485ee6
  rolling_report_commit: 7fac1add9a7c515a5d55f21d87f61a63935815bd
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-07

- task_ref: handoff-post-push-verification-rule
  real_task_commit: 94ed080996a6d5c77691aa4ed1b573439c51a2e2
  rolling_report_commit: 890b104ea634bf35800015cbb5c4e031d7aab6bc
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-07

- task_ref: gate-b-inbound-one-shot-pass
  real_task_commit: 83105bdf185135c4cf8c99dc31f5ec93dd70daab
  rolling_report_commit: 46f6638c5c56ef953464fc541acb25fa68ccb474
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-07
```
