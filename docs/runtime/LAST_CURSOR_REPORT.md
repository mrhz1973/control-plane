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
task_ref: d0038e-wf45-import-ui-only-pr2-merge-post-report
result_cursor: PASS_DOCS_ONLY
result_runtime: NOT_RUN_BY_CURSOR
base_commit: eb43cef571774a1b513328d8f4837c2c7224c4fc
substance_commit: 11747f91d707f71c76accab93489ab44627f009e
merge_commit: ea1dbef504c48c9edae547181d96268b1974e898
pr_head_commit: a75dfc476ba70318c85f6c2b62075cc68ea2a275
commit_subject: Merge PR #2: docs D-0038-E wf45 import-only result
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS docs-only post-merge = HEAD locale, origin/main e ls-remote refs/heads/main coincidono su ea1dbef (merge PR #2); workspace clean; diff limitato a LAST_CURSOR_REPORT.md e LAST_HANDOFF_VERIFY.md; nessun runtime n8n; import UI-only attestato; non Gate E PASS; non PASS runtime; GE-02 non autorizzato.
remote_hash_verbatim: "ea1dbef504c48c9edae547181d96268b1974e898\trefs/heads/main"
timestamp_utc: 2026-07-06
```

- **Post-merge — PR #2 D-0038-E import UI-only docs:** merge commit `ea1dbef`; PR head `a75dfc4`; substance `11747f9`; base pre-PR `eb43cef`.
- **PR #2 substance (merged):** sessione `docs/sessions/2026-07-06-control-plane-d0038e-wf45-import-ui-only-pass.md`; import target `workflows/exports/2026-07-04_wd-45-operational-decision-packet-integration-ge01-fixforward.proposed.redacted.json`; export storico 2026-07-02 **non** importato; risultato **PASS_IMPORT_UI_ONLY**; runtime **NOT_RUN**; Execute workflow **NOT_PRESSED**; Publish **NOT_PRESSED**; Telegram/classifier **NOT_RUN**; evidenza screenshot operatore (singola catena wf45 con nodo Collapse load fan-out presente).
- **Explicit non-touched:** `workflows/**`, wf40/41/42, runtime n8n, schedule/webhook/Telegram/classifier/tunnel, credenziali.
- **Gate E PASS = NO**; **PASS runtime = NO**; **GE-02 = not authorized**; **PM-34 BLOCKED**; **`n8n_ready=false`**; nessun runtime n8n eseguito o attivato.
- **Method note (GLM PR #2 review):** una deviazione metodo non bloccante — `git fetch` del ref PR usato senza autorizzazione one-off esplicita; severità **LOW** per merito PR, **MEDIUM** per metodo; non bloccante; metodo GLM **non** modificato in questo task.
- Snapshot verifica attraverso merge `ea1dbef`; il commit che aggiorna questo file **non** auto-certifica il proprio hash (`rolling_report_commit: PENDING_SELF_REFERENCE`).
- **Backfill PENDING_SELF_REFERENCE:** `d0038e-wf45-import-ui-only-pass` → `rolling_report_commit: ea1dbef` (in HISTORY).

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
- task_ref: d0038e-wf45-import-ui-only-pass
  real_task_commit: 11747f91d707f71c76accab93489ab44627f009e
  rolling_report_commit: ea1dbef504c48c9edae547181d96268b1974e898
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-06

- task_ref: glm-advisor-session-starter-docs-only
  real_task_commit: 63f37090137f78bc7165c625fee20e5f316a8468
  rolling_report_commit: eb43cef571774a1b513328d8f4837c2c7224c4fc
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-04

- task_ref: ge01-wf45-fanout-fixforward-pr1-merge-post-report
  real_task_commit: 6a6b9d8f9679a86423ad9914df9629d7df679b65
  rolling_report_commit: 389eaf3df6d0ba138b569eeadf858f13a557a7a9
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-04

- task_ref: readme-policy-alignment-docs-only
  real_task_commit: b2f66140902df5a92fcb70a294c59ab6ea0d4233
  rolling_report_commit: b62a30b24223a86396119c3d106f2bc2597a71af
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-03

- task_ref: glm-advisor-method-docs-only
  real_task_commit: 19bd24c06f5f0d83efb361c695dae467180e8d0f
  rolling_report_commit: 64dbd8bac29ece0f759c37c72e49baad8cfdf0da
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-03

- task_ref: gate-e-controlled-start-prep-docs-only
  real_task_commit: 34cea4684491ff729df7322418e558febff4257b
  rolling_report_commit: 6832b9b7e0da42b0fcce5fb0da07cc5548e0eb6c
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-03

- task_ref: post-gate-d-policy-frontier-verify-only
  real_task_commit: b462ee7eda6235797dab41ac822a331e30bbe7c5
  rolling_report_commit: 1a910b4eba30f6e6ff4f801b2cdbb1984a6d0a0d
  result_cursor: PASS_VERIFY_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-03
```
