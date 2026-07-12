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
task_ref: d0050w-wf47-callback-query-l3-repository-implementation
result_cursor: PASS_REPOSITORY_ONLY_IMPLEMENTATION
result_runtime: NOT_RUN_L3_IMPLEMENTATION
base_commit: b0bfee43382b2de1a2fd5710fa3004c6c370af71
real_task_commit: 9cc21624d4441a6a0ca676d4ff0f29cc05341243
substantive_commit_range: b0bfee43382b2de1a2fd5710fa3004c6c370af71..9cc21624d4441a6a0ca676d4ff0f29cc05341243
intermediate_substantive_commit: 095933d9d0b9edb3edf42233225aa89d3e9f3f3d
original_report_commit: 7515fc9d922fb80f2003fbefde87957c18917a04
commit_convention_status: DEVIATION_RECORDED
correction_status: CORRECTED_BY_D0051G_PENDING_REPORT
commit_subject: feat: harden wf47 callback-query path for D-0050-W
rolling_report_commit: PENDING_SELF_REFERENCE
remote_hash_verbatim: PENDING_SELF_REFERENCE
branch: main
decision_id: D-0050-W
selected_option: 1
decision_provenance: direct_operator_message
parent_decision_id: D-0049-W
parent_selected_option: 1
inbound_primary_architecture: WF47_POLLING_FIRST
callback_query_source_guard: IMPLEMENTED_PENDING_L4
allowed_updates_status: EXPLICIT_PENDING_L4
parser_options_status: OPTIONS_1_TO_5_IMPLEMENTED_PENDING_L4
answer_callback_query_status: IMPLEMENTED_PENDING_L4
receipt_one_item_invariant: PASS_REPOSITORY_SIDE
fixture_matrix_result: PASS_REPOSITORY_SIDE_A_TO_J
workflow_template_modified: true
runtime_workflow_modified: false
runtime_executed: false
telegram_api_called: false
callback_query_live_pass: false
answer_callback_query_live_pass: false
l4_runtime_test_authorized: false
l5_live_activation_authorized: false
enable_wg48_handoff: false
gate_e_status: OPERATOR_DECISION_PENDING
gate_e_full_pass: false
we46_template_status: RETAINED_INACTIVE_WEBHOOK_FALLBACK
we46_live_pass: false
n8n_ready: false
pm34_unblocked: false
timestamp_utc: 2026-07-12
```

- **D-0050-W used two substantive commits:** `095933d` (template implementation) then `9cc2162` (completion + docs); substantive range `b0bfee4..9cc2162`.
- **`095933d` omitted** from original provenance model (`base_commit` had been `095933d`); **corrected** by D-0051-G.
- **`7515fc9` remains** in immutable Git history as original rolling-report commit; **no history rewrite**.
- **Implementation and runtime classifications unchanged** — `PASS_REPOSITORY_ONLY_IMPLEMENTATION` / `NOT_RUN_L3_IMPLEMENTATION`.
- **Commit 1 — D-0050-W L3 repository implementation (substantive):** `095933d` + `9cc2162`; fixtures A–J PASS repo-side; **NOT** runtime.
- **Commit 2 (original report):** `7515fc9` — `LAST_CURSOR_REPORT.md` + `LAST_HANDOFF_VERIFY.md`.
- **D-0045-E** resta ultimo PASS scope-limited runtime.
- Snapshot verifica attraverso `9cc2162`; `rolling_report_commit: PENDING_SELF_REFERENCE`.
- **Backfill PENDING_SELF_REFERENCE:** `d0049w-we-polling-first-architecture-decision` → `rolling_report_commit: b0bfee4` (in HISTORY).

**Post-push evidence (commit 1 — real task):**

```text
git log --oneline -8
9cc2162 feat: harden wf47 callback-query path for D-0050-W
095933d Update wf47 polling template for callback handling
b0bfee4 docs: refresh runtime reports for D-0049-W
9c328fe docs: select polling-first inbound architecture for D-0049-W
417f136 docs: refresh runtime reports for D-0047-G correction
5fdf1dd docs: correct D-0046-E provenance and add anti-proxy rule
375f495 docs: refresh runtime reports for D-0046-E stop
4273bde docs: record D-0046-E Gate E stop decision

git status --short

git rev-parse HEAD
9cc21624d4441a6a0ca676d4ff0f29cc05341243

git rev-parse origin/main
9cc21624d4441a6a0ca676d4ff0f29cc05341243

git branch --show-current
main

git show --stat HEAD
commit 9cc21624d4441a6a0ca676d4ff0f29cc05341243
 docs/runtime/AUTOMATION_ACTIVATION_PLAN.md         |  18 ++--
 docs/runtime/CURRENT_FRONTIER.md                   |  19 +++-
 ...0050-w-wf47-callback-query-l3-implementation.md | 109 +++++++++++++++++++++
 ...kflow-wf-telegram-inbound-polling-getupdates.md |  34 ++++++-
 ...legram-inbound-polling-getupdates.template.json |  14 +--
 5 files changed, 171 insertions(+), 23 deletions(-)

git ls-remote origin refs/heads/main
9cc21624d4441a6a0ca676d4ff0f29cc05341243	refs/heads/main
```

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
- task_ref: d0049w-we-polling-first-architecture-decision
  real_task_commit: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
  rolling_report_commit: b0bfee43382b2de1a2fd5710fa3004c6c370af71
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_ARCHITECTURE_DECISION
  timestamp_utc: 2026-07-12

- task_ref: d0047g-d0046e-governance-correction
  real_task_commit: 5fdf1dd3d8dbaca0b235188f67bb6c38389d607e
  rolling_report_commit: 417f136266978a4b6a64b85f9fa1574f87bed226
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_GOVERNANCE_CORRECTION
  timestamp_utc: 2026-07-12

- task_ref: d0046e-gate-e-stop-decision
  real_task_commit: 4273bde2ef0bc61f4fe2d56fd658a2eb61a26377
  rolling_report_commit: 375f495c1976153e0b68722fddc480c147bf8124
  result_cursor: PASS_DOCS_ONLY
  original_result_runtime: NOT_RUN_OPERATOR_DECISION_STOP
  record_status: SUPERSEDED_GOVERNANCE_ERROR
  superseded_by: D-0047-G
  timestamp_utc: 2026-07-12

- task_ref: d0045e-wf48-external-receipt-close-record
  real_task_commit: 35cb338a2cfbfe7730515eb68300501f94cf01f2
  rolling_report_commit: 95b904504c7cbe7a94b18bfaa1f845d9459b999f
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED
  timestamp_utc: 2026-07-12

- task_ref: wf45-wf47-official-bounded-receipt-pass
  real_task_commit: cd2c2e4356b27fc044e9f54470c2264b32dede6e
  rolling_report_commit: f01ad73925b8a3c2ed7d50d7f44fbcd75eeafc18
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED
  timestamp_utc: 2026-07-12

- task_ref: user-decision-orchestrator-execution-contract
  real_task_commit: 641d8b1687c65b86b27661b2bddcc8fe77e58941
  rolling_report_commit: 6fafa9b187d6886eefadc9cacfb7225563c5c90d
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-11

- task_ref: wf47-bounded-runtime-validation-record
  real_task_commit: f55f009e2964c0f86eae5aef88b40d84cb8c4486
  rolling_report_commit: 39b53e4495aa628c52890dc297226350d71dfc53
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED
  timestamp_utc: 2026-07-11

- task_ref: wf47-store-derivation-dedupe-consolidation
  real_task_commit: 2009a4c14b0777d394e09a9f8bc3b25017eeeec4
  rolling_report_commit: 75a1c5d1e87b324421aaa92199a5250adfa5d6c1
  result_cursor: PASS_DOCS_AND_TEMPLATE
  result_runtime: NOT_RUN_BOUNDED_REPO_SIDE_VALIDATION_PASS
  timestamp_utc: 2026-07-11

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
