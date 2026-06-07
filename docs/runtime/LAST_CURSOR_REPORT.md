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
task_ref: handoff-post-push-verification-rule
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: 94ed080996a6d5c77691aa4ed1b573439c51a2e2
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS = docs-only handoff post-push verification invariant in PROJECT_VISION §8.1 + CURSOR_PROMPT_TEMPLATE + session log + commit in origin/main + redaction check exit 0; no runtime; no n8n; no new workflow; PM-34 BLOCKED; n8n_ready=false
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-06-07
```

- Registrata regola anti-regressione **handoff/post-push verification**.
- Report Cursor deve includere sempre output git post-push verbatim, incluso `git ls-remote origin main`.
- Orchestratore **non** deve chiedere shell manuale all'utente se il report Cursor contiene già gli output.
- Prompt **verify-only** Cursor = fallback primario se output mancano.
- Nessun runtime n8n. Nessun nuovo workflow. **PM-34 BLOCKED.** **`n8n_ready=false`**.
- `rolling_report_commit` / `remote_hash_verbatim` = **PENDING_SELF_REFERENCE** finché questo LATEST resta il più recente; backfill in HISTORY al task successivo (`PROJECT_VISION.md` §8.1).

Snapshot task commit:

```text
94ed080996a6d5c77691aa4ed1b573439c51a2e2	refs/heads/main
```

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Orchestratore:** se il report Cursor include già l'output post-push verbatim completo (`PROJECT_VISION.md` §8.1), **non** chiedere shell manuale all'utente; verify-only Cursor se manca; shell utente = fallback finale.
- **Nessun segreto**: token, chat_id, webhook, PAT, API key, OAuth, URL con token.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: gate-b-inbound-one-shot-pass
  real_task_commit: 83105bdf185135c4cf8c99dc31f5ec93dd70daab
  rolling_report_commit: 46f6638c5c56ef953464fc541acb25fa68ccb474
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-07

- task_ref: gate-a-readiness-audit-pass
  real_task_commit: 7fd7377c0573b0e56e3784d3c6063bbc955e26c1
  rolling_report_commit: bd497bdece4b3ced4d112dc1a104ceb137c4fa33
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-07

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
```
