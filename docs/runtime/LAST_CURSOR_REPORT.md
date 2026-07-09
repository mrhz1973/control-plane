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
task_ref: wf47-wg48-handoff-clarification
result_cursor: PASS_DOCS_ONLY
result_runtime: NOT_RUN_BY_CURSOR
base_commit: 5884acd608113a9e50da8a7f00aebead0cabffd9
real_task_commit: 06332d470303c0a25e177bb7b8ceec15a46ee5fc
commit_subject: docs: clarify wf47 wf48 handoff authorization
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS docs-only commit 1 = HEAD locale, origin/main e ls-remote refs/heads/main coincidono su 06332d4; workspace clean; diff commit 1 limitato a CURRENT_FRONTIER.md e workflow-wf47-wg-operationalization-plan.md; chiarimento post-PASS handoff; nessun workflow JSON toccato; nessun runtime n8n da Cursor; non Gate E PASS; non global PASS runtime; enable_wg48_handoff=false. Commit 2 = solo LAST_CURSOR_REPORT.md.
remote_hash_verbatim: "06332d470303c0a25e177bb7b8ceec15a46ee5fc\trefs/heads/main"
timestamp_utc: 2026-07-09
```

- **Commit 1 — chiarimento post-PASS wf47→wf48 bounded handoff:** `CURRENT_FRONTIER.md` + `workflow-wf47-wg-operationalization-plan.md` §4undecies; flip `enable_wg48_handoff` autorizzato da decisione utente esplicita in chat (Decision Packet non emesso); nessuna modifica wf48 in arco; fan-out GE-02 = instrumentazione fix wf45; wg48 safe branch input (`177f973`) già in repo; debito parsing opzioni 1/2/3 vs §7.7 (2–5).
- **Commit 2 (questo report):** solo `LAST_CURSOR_REPORT.md`; **non** modifica sostanza commit 1; **non** certifica il proprio hash.
- **Explicit non-touched:** `workflows/**`, `data-tables/**`, wf40/41/42, runtime n8n da Cursor, import/export, credenziali.
- **NOT Gate E PASS**; **NOT global PASS runtime**; **PM-34 BLOCKED**; **`n8n_ready=false`**; **`enable_wg48_handoff=false`**; nessun runtime n8n eseguito o attivato da Cursor.
- Snapshot verifica attraverso `06332d4`; `rolling_report_commit: PENDING_SELF_REFERENCE`.
- **Backfill PENDING_SELF_REFERENCE:** `wf47-wg48-bounded-handoff-pass` → `rolling_report_commit: 5884acd` (in HISTORY).

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
- task_ref: wf47-wg48-bounded-handoff-pass
  real_task_commit: 823d025b27b2cf488422eedadff4c73437e0a391
  rolling_report_commit: 5884acd608113a9e50da8a7f00aebead0cabffd9
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-07-09

- task_ref: ge02-bounded-runtime-pr4-merge-post-report
  real_task_commit: b6e293f8abd41db65064f24d283eb7aa9a8d96e6
  rolling_report_commit: 0b9fe468a0e1672d314c25e1276082b25a01da6f
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-07-06

- task_ref: ge02-bounded-runtime-pass
  real_task_commit: 84b264ef076e83c6fad40292acb9eb407307b218
  rolling_report_commit: b6e293f8abd41db65064f24d283eb7aa9a8d96e6
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-07-06

- task_ref: d0038e-wf45-import-ui-only-pr2-merge-post-report
  real_task_commit: ea1dbef504c48c9edae547181d96268b1974e898
  rolling_report_commit: e589b9e8384d2262864877fe5070d5ab60c8b98e
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-06

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
