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
task_ref: wf47-store-derivation-dedupe-consolidation
result_cursor: PASS_DOCS_AND_TEMPLATE
result_runtime: NOT_RUN_BOUNDED_REPO_SIDE_VALIDATION_PASS
base_commit: b6695577716c10eba93fa6d8a1ea404a9ba8a690
real_task_commit: 2009a4c14b0777d394e09a9f8bc3b25017eeeec4
commit_subject: feat(wf47): consolidate store derivation and fan-in dedupe
rolling_report_commit: PENDING_SELF_REFERENCE
branch: cursor/wf47-store-derivation-dedupe-79b7
verification_rule: PASS commit 1 = wf47 template only; JSON parse; dedupe sim PASS; no open_decision_ids_test_only code path; active=false; enable_wg48_handoff=false; no runtime n8n; not Gate E full PASS; LAST_HANDOFF_VERIFY not touched. Commit 2 = CURRENT_FRONTIER + LAST_CURSOR_REPORT.
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-07-11
```

- **Commit 1 — wf47 consolidation:** `workflows/wf-telegram-inbound-polling-getupdates.template.json`; store derivation + Collapse fan-out + dedupe Set; **bounded consolidation ready** + **bounded repo-side validation pass** — **NOT Gate E full PASS**; **NOT runtime n8n**.
- **Commit 2 (questo report):** `CURRENT_FRONTIER.md` + `LAST_CURSOR_REPORT.md`; **non** certifica il proprio hash.
- **Explicit non-touched:** wf40/41/42/48, `data-tables/**`, `LAST_HANDOFF_VERIFY.md`, runtime n8n, import/export live, export storico 47.
- **NOT Gate E full PASS**; **PM-34 BLOCKED**; **`n8n_ready=false`**; **`enable_wg48_handoff=false`**; wf48 non chiamato; no Active / Publish / Schedule.
- Snapshot verifica attraverso `2009a4c`; `rolling_report_commit: PENDING_SELF_REFERENCE`.
- **Backfill PENDING_SELF_REFERENCE:** `handoff-compliance-d0041-d0042-template` → `rolling_report_commit: 71fad6c` (in HISTORY).
- **branch PR != main** — non è PASS remoto su `main` finché non mergiato.

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
- task_ref: handoff-compliance-d0041-d0042-template
  real_task_commit: 4f2baef567b4485ce1afae74392172196dc873b5
  rolling_report_commit: 71fad6cad67cdeafa8aa985d557bfe59a80724de
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-10

- task_ref: d-0041-e-d-0042-e-bounded-partial-pass
  real_task_commit: d4a1d173f59b4fb4a7140bdd07c117c0c0243b4b
  rolling_report_commit: a7b3bdba4761f03d1512d0cb225f4524407febb3
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE_PARTIAL
  timestamp_utc: 2026-07-09

- task_ref: d-0040-e-gate-e-preflight-no-go
  real_task_commit: 85a91dad1f8ae40e5e3552c336c399caf00336dc
  rolling_report_commit: 0411f3e46ecd0b37800979768ed9b05a849cb144
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_OPERATOR_PREFLIGHT_NOGO
  timestamp_utc: 2026-07-09

- task_ref: wf47-wg48-handoff-clarification
  real_task_commit: 06332d470303c0a25e177bb7b8ceec15a46ee5fc
  rolling_report_commit: 49c228f2433f71149136f3303777aa7d802b633f
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-09

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
