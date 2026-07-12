# LAST HANDOFF VERIFY — control-plane (persistent)

## Purpose

Artefatto persistente su GitHub per **handoff / `aggio control`**: consente all'orchestratore di leggere l'ultimo blocco di verifica post-push **senza** chiedere subito shell manuale all'utente.

- **`docs/runtime/LAST_CURSOR_REPORT.md`** — rolling report per task Cursor (LATEST/HISTORY, `real_task_commit`).
- **`docs/runtime/LAST_HANDOFF_VERIFY.md`** (questo file) — snapshot dell'**ultimo stato remoto verificato**, con output git verbatim e modello **`verified_through_commit`**.

Fonte canonica regole: `docs/foundation/PROJECT_VISION.md` §8.1 (Handoff / post-push verification invariant).

---

## Rules

- **Non auto-certificazione:** questo file **non** certifica il proprio commit di aggiornamento. Usa **`verified_through_commit`** = ultimo commit già verificato con output coerenti.
- **`artifact_commit`:** SHA del commit che ha scritto/aggiornato questo file. Resta **`PENDING_SELF_REFERENCE`** finché un task successivo non backfilla (stesso pattern di `LAST_CURSOR_REPORT.md`). Nessun commit "finalize hash" dedicato.
- **PASS remoto verificabile** fino a `verified_through_commit` quando:
  - `observed_head == observed_origin_main == observed_ls_remote_main`
  - `branch == main`
  - `workspace_status == clean`
- **HEAD GitHub corrente > `verified_through_commit`:** l'artefatto resta utile (contesto storico) ma **non** certifica l'HEAD corrente → orchestratore: prompt **Cursor verify-only** prima di shell utente.
- **Ordine fallback orchestratore (`aggio control`):**
  1. Report Cursor in chat (se output post-push completi)
  2. **`LAST_HANDOFF_VERIFY.md`** su GitHub (se aggiornato e coerente con HEAD remoto)
  3. **`LAST_CURSOR_REPORT.md`** su GitHub
  4. Prompt **Cursor verify-only** (git read-only, zero edit)
  5. Shell manuale utente = **fallback finale**
- **Policy materiali sensibili v2.15:** il repo è trattato come non-confidenziale secondo `PROJECT_VISION.md` §10; non stampare o introdurre token, API key, OAuth material, PAT, URL con token, credential material o runtime dump non previsto. Chat_id e identificatori tailnet seguono le eccezioni/tolleranze documentate in `PROJECT_VISION.md` §10. Controllo compensativo finale: rotazione credenziali secondo `docs/ROTATION_CHECKLIST.md`.

---

## Previous snapshot (backfilled)

```yaml
task_ref: d0047g-d0046e-governance-correction
verified_task_commit: 5fdf1dd3d8dbaca0b235188f67bb6c38389d607e
verified_base_commit: 375f495c1976153e0b68722fddc480c147bf8124
verified_rolling_report_commit: 417f136266978a4b6a64b85f9fa1574f87bed226
verified_through_commit: 5fdf1dd3d8dbaca0b235188f67bb6c38389d607e
observed_head: 5fdf1dd3d8dbaca0b235188f67bb6c38389d607e
observed_origin_main: 5fdf1dd3d8dbaca0b235188f67bb6c38389d607e
observed_ls_remote_main: 5fdf1dd3d8dbaca0b235188f67bb6c38389d607e
branch: main
workspace_status: clean
artifact_commit: 417f136266978a4b6a64b85f9fa1574f87bed226
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN_GOVERNANCE_CORRECTION
decision_id: D-0047-G
selected_option: 2
decision_provenance: direct_operator_message
d0046e_record_status: VOIDED_MISATTRIBUTED_OPERATOR_CHOICE
gate_e_status: OPERATOR_DECISION_PENDING
gate_e_runtime_authorized: false
gate_e_full_pass: false
runtime_executed: false
workflow_modified: false
enable_wg48_handoff: false
n8n_ready: false
pm34_unblocked: false
anti_proxy_rule_codified: true
timestamp_utc: 2026-07-12
```

**Nota:** snapshot D-0047-G governance correction — superseded da D-0049-W architecture decision (2026-07-12).

```yaml
task_ref: d0046e-gate-e-stop-decision
verified_task_commit: 4273bde2ef0bc61f4fe2d56fd658a2eb61a26377
verified_base_commit: 95b904504c7cbe7a94b18bfaa1f845d9459b999f
verified_rolling_report_commit: 375f495c1976153e0b68722fddc480c147bf8124
verified_through_commit: 4273bde2ef0bc61f4fe2d56fd658a2eb61a26377
observed_head: 4273bde2ef0bc61f4fe2d56fd658a2eb61a26377
observed_origin_main: 4273bde2ef0bc61f4fe2d56fd658a2eb61a26377
observed_ls_remote_main: 4273bde2ef0bc61f4fe2d56fd658a2eb61a26377
branch: main
workspace_status: clean
artifact_commit: 375f495c1976153e0b68722fddc480c147bf8124
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN_OPERATOR_DECISION_STOP
record_status: SUPERSEDED_GOVERNANCE_ERROR
superseded_by: D-0047-G
invalid_provenance: GLM_recommendation_misattributed_as_operator_choice
gate_e_full_pass: false
n8n_ready: false
pm34_unblocked: false
timestamp_utc: 2026-07-12
```

**Nota:** snapshot D-0046-E stop — invalid decision provenance; superseded da D-0047-G governance correction (2026-07-12). **Non** valid operator choice.

```yaml
task_ref: d0045e-wf48-external-receipt-close-record
verified_task_commit: 35cb338a2cfbfe7730515eb68300501f94cf01f2
verified_base_commit: f01ad73925b8a3c2ed7d50d7f44fbcd75eeafc18
verified_rolling_report_commit: 95b904504c7cbe7a94b18bfaa1f845d9459b999f
verified_through_commit: 35cb338a2cfbfe7730515eb68300501f94cf01f2
observed_head: 35cb338a2cfbfe7730515eb68300501f94cf01f2
observed_origin_main: 35cb338a2cfbfe7730515eb68300501f94cf01f2
observed_ls_remote_main: 35cb338a2cfbfe7730515eb68300501f94cf01f2
branch: main
workspace_status: clean
artifact_commit: 95b904504c7cbe7a94b18bfaa1f845d9459b999f
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED
gate_e_full_pass: false
n8n_ready: false
pm34_unblocked: false
wf48_called: true
wf48_mode: manual_external_receipt
enable_wg48_handoff: false
decision_close_persisted: true
timestamp_utc: 2026-07-12
```

**Nota:** snapshot D-0045-E wf48 external receipt close; superseded da D-0046-E record (voided by D-0047-G).

```yaml
task_ref: wf45-wf47-official-bounded-receipt-pass
verified_task_commit: cd2c2e4356b27fc044e9f54470c2264b32dede6e
verified_base_commit: 6fafa9b187d6886eefadc9cacfb7225563c5c90d
verified_rolling_report_commit: f01ad73925b8a3c2ed7d50d7f44fbcd75eeafc18
verified_through_commit: cd2c2e4356b27fc044e9f54470c2264b32dede6e
observed_head: cd2c2e4356b27fc044e9f54470c2264b32dede6e
observed_origin_main: cd2c2e4356b27fc044e9f54470c2264b32dede6e
observed_ls_remote_main: cd2c2e4356b27fc044e9f54470c2264b32dede6e
branch: main
workspace_status: clean
artifact_commit: f01ad73925b8a3c2ed7d50d7f44fbcd75eeafc18
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED
gate_e_full_pass: false
n8n_ready: false
pm34_unblocked: false
wf48_called: false
timestamp_utc: 2026-07-12
```

**Nota:** snapshot wf45→wf47 official bounded receipt; superseded da D-0045-E wf48 external receipt close (2026-07-12).

```yaml
task_ref: user-decision-orchestrator-execution-contract
verified_task_commit: 641d8b1687c65b86b27661b2bddcc8fe77e58941
verified_base_commit: 39b53e4495aa628c52890dc297226350d71dfc53
verified_rolling_report_commit: 6fafa9b187d6886eefadc9cacfb7225563c5c90d
verified_through_commit: 641d8b1687c65b86b27661b2bddcc8fe77e58941
observed_head: 641d8b1687c65b86b27661b2bddcc8fe77e58941
observed_origin_main: 641d8b1687c65b86b27661b2bddcc8fe77e58941
observed_ls_remote_main: 641d8b1687c65b86b27661b2bddcc8fe77e58941
branch: main
workspace_status: clean
artifact_commit: 6fafa9b187d6886eefadc9cacfb7225563c5c90d
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN_BY_CURSOR
gate_e_full_pass: false
n8n_ready: false
pm34_unblocked: false
wf48_called: false
timestamp_utc: 2026-07-11
```

**Nota:** snapshot orchestrator contract codification; superseded da wf45→wf47 official bounded receipt pass (2026-07-12).

```yaml
task_ref: wf47-bounded-runtime-validation-record
verified_task_commit: f55f009e2964c0f86eae5aef88b40d84cb8c4486
verified_base_commit: 3c40070c785b460b76120505dbbd9cf65bd0b26c
verified_rolling_report_commit: 39b53e4495aa628c52890dc297226350d71dfc53
verified_through_commit: f55f009e2964c0f86eae5aef88b40d84cb8c4486
observed_head: f55f009e2964c0f86eae5aef88b40d84cb8c4486
observed_origin_main: f55f009e2964c0f86eae5aef88b40d84cb8c4486
observed_ls_remote_main: f55f009e2964c0f86eae5aef88b40d84cb8c4486
branch: main
workspace_status: clean
artifact_commit: 39b53e4495aa628c52890dc297226350d71dfc53
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED
gate_e_full_pass: false
n8n_ready: false
pm34_unblocked: false
wf48_called: false
timestamp_utc: 2026-07-11
```

**Nota:** snapshot wf47 bounded runtime validation; superseded da orchestrator contract codification (2026-07-11).

```yaml
task_ref: d-0040-e-gate-e-preflight-no-go
verified_task_commit: 85a91dad1f8ae40e5e3552c336c399caf00336dc
verified_base_commit: 49c228f2433f71149136f3303777aa7d802b633f
verified_rolling_report_commit: 0411f3e46ecd0b37800979768ed9b05a849cb144
verified_through_commit: 85a91dad1f8ae40e5e3552c336c399caf00336dc
observed_head: 85a91dad1f8ae40e5e3552c336c399caf00336dc
observed_origin_main: 85a91dad1f8ae40e5e3552c336c399caf00336dc
observed_ls_remote_main: 85a91dad1f8ae40e5e3552c336c399caf00336dc
branch: main
workspace_status: clean
artifact_commit: 0411f3e46ecd0b37800979768ed9b05a849cb144
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN_OPERATOR_PREFLIGHT_NOGO
timestamp_utc: 2026-07-09
```

**Nota:** snapshot D-0040-E preflight NO-GO; superseded da wf47 bounded runtime validation record (2026-07-11).

```yaml
task_ref: wf47-wg48-bounded-handoff-pass
verified_task_commit: 823d025b27b2cf488422eedadff4c73437e0a391
verified_base_commit: 0b9fe468a0e1672d314c25e1276082b25a01da6f
verified_rolling_report_commit: 5884acd608113a9e50da8a7f00aebead0cabffd9
verified_through_commit: 823d025b27b2cf488422eedadff4c73437e0a391
observed_head: 823d025b27b2cf488422eedadff4c73437e0a391
observed_origin_main: 823d025b27b2cf488422eedadff4c73437e0a391
observed_ls_remote_main: 823d025b27b2cf488422eedadff4c73437e0a391
branch: main
workspace_status: clean
artifact_commit: 5884acd608113a9e50da8a7f00aebead0cabffd9
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: PASS_ATTESTATO_UTENTE
timestamp_utc: 2026-07-09
```

**Nota:** snapshot wf47→wf48 bounded handoff verificato attraverso `823d025`; `artifact_commit` e `verified_rolling_report_commit` backfilled a `5884acd`.

---

## Latest verified snapshot

```yaml
task_ref: d0049w-we-polling-first-architecture-decision
verified_task_commit: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
verified_base_commit: 417f136266978a4b6a64b85f9fa1574f87bed226
verified_rolling_report_commit: PENDING_SELF_REFERENCE
verified_through_commit: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
observed_head: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
observed_origin_main: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
observed_ls_remote_main: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
branch: main
workspace_status: clean
artifact_commit: PENDING_SELF_REFERENCE
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN_ARCHITECTURE_DECISION
decision_id: D-0049-W
selected_option: 1
decision_provenance: direct_operator_message
parent_decision_id: D-0048-S
parent_selected_option: 2
inbound_primary_architecture: WF47_POLLING_FIRST
we46_primary_path_status: DEPRECATED_AS_PRIMARY_PATH
we46_template_status: RETAINED_INACTIVE_WEBHOOK_FALLBACK
we46_live_pass: false
wf47_callback_query_target: SELECTED_PENDING_L3
answer_callback_query_status: PENDING_L3_DESIGN
l3_implementation_authorized: false
l4_runtime_test_authorized: false
l5_live_activation_authorized: false
runtime_executed: false
workflow_modified: false
telegram_sent: false
webhook_modified: false
gate_e_status: OPERATOR_DECISION_PENDING
gate_e_full_pass: false
enable_wg48_handoff: false
n8n_ready: false
pm34_unblocked: false
timestamp_utc: 2026-07-12
```

**Nota:** D-0049-W polling-first architecture verified through `9c328fe` — L0/L1/L2 docs-only; wf47 polling-first selected; We/46 deprecated as primary, retained inactive fallback; **answerCallbackQuery PENDING_L3**; **nessun runtime**; **D-0045-E** resta ultimo PASS scope-limited; **NOT Gate E full PASS**; **PM-34 BLOCKED**; **`n8n_ready=false`**. Commit 2 = artefatti verifica/report; `artifact_commit: PENDING_SELF_REFERENCE`.

**Backfill PENDING_SELF_REFERENCE:** D-0047-G snapshot → `417f136`; D-0046-E snapshot → `375f495`; D-0045-E snapshot → `95b9045`; wf45→wf47 snapshot → `f01ad73`; orchestrator contract snapshot → `6fafa9b`; wf47 bounded runtime validation snapshot → `39b53e4`; wf47→wf48 bounded handoff snapshot → `5884acd`; D-0040-E snapshot → `0411f3e`.

---

## Command outputs (verbatim, sanitized — D-0049-W polling-first architecture)

```text
git log --oneline -8
9c328fe docs: select polling-first inbound architecture for D-0049-W
417f136 docs: refresh runtime reports for D-0047-G correction
5fdf1dd docs: correct D-0046-E provenance and add anti-proxy rule
375f495 docs: refresh runtime reports for D-0046-E stop
4273bde docs: record D-0046-E Gate E stop decision
95b9045 docs: refresh runtime reports for D-0045-E wf48 close
35cb338 docs: record D-0045-E wf48 external receipt close pass
f01ad73 docs: refresh runtime reports for wf45-wf47 bounded receipt

git status --short

git rev-parse HEAD
9c328fe266a520f59e2f29bb44d30f0377aa6b70

git rev-parse origin/main
9c328fe266a520f59e2f29bb44d30f0377aa6b70

git branch --show-current
main

git show --stat HEAD
commit 9c328fe266a520f59e2f29bb44d30f0377aa6b70
 docs/runtime/AUTOMATION_ACTIVATION_PLAN.md         |  15 ++-
 docs/runtime/CURRENT_FRONTIER.md                   |  28 +++--
 ...049-w-we-polling-first-architecture-decision.md | 136 +++++++++++++++++++++
 ...low-we-telegram-interactive-decision-buttons.md |   4 +-
 ...kflow-wf-telegram-inbound-polling-getupdates.md |  29 ++++-
 5 files changed, 196 insertions(+), 16 deletions(-)

git ls-remote origin refs/heads/main
9c328fe266a520f59e2f29bb44d30f0377aa6b70	refs/heads/main

git diff --name-only 417f136266978a4b6a64b85f9fa1574f87bed226..HEAD
docs/runtime/AUTOMATION_ACTIVATION_PLAN.md
docs/runtime/CURRENT_FRONTIER.md
docs/sessions/2026-07-12-control-plane-d-0049-w-we-polling-first-architecture-decision.md
docs/workflow-we-telegram-interactive-decision-buttons.md
docs/workflow-wf-telegram-inbound-polling-getupdates.md
```

**BASE (record commit 1):** `417f136266978a4b6a64b85f9fa1574f87bed226`

---

## Required fields (per aggiornamento futuro)

| Campo | Descrizione |
|-------|-------------|
| `task_ref` | Riferimento task verificato |
| `verified_task_commit` | Commit 1 del task (sostanza) |
| `verified_rolling_report_commit` | Commit 2 rolling report, se applicabile |
| `verified_through_commit` | Ultimo commit remoto verificato con hash coerenti |
| `observed_head` / `observed_origin_main` / `observed_ls_remote_main` | Output osservati al momento della verifica |
| `branch` | Deve essere `main` |
| `workspace_status` | `clean` o descrizione dirty |
| `artifact_commit` | `PENDING_SELF_REFERENCE` fino a backfill al task successivo |
| `result` / `result_runtime` | Esito Cursor / runtime |
| `timestamp_utc` | Data verifica |

Sezione **Command outputs** = output testuale verbatim (non tabelle riassuntive).

---

## Fallback logic

```
aggio control
    │
    ├─ report Cursor in chat con output post-push completi? → PASS remoto
    │
    ├─ leggi LAST_HANDOFF_VERIFY.md su GitHub
    │       │
    │       ├─ HEAD remoto == verified_through_commit
    │       │   AND observed_head == observed_origin_main == observed_ls_remote_main
    │       │   AND branch main AND workspace clean
    │       │       → PASS remoto fino a verified_through_commit
    │       │
    │       └─ HEAD remoto > verified_through_commit (artefatto stale)
    │               → verify-only Cursor (non shell utente)
    │
    ├─ leggi LAST_CURSOR_REPORT.md (contesto task)
    │
    ├─ prompt Cursor verify-only
    │
    └─ shell utente (fallback finale)
```

**Nota:** il commit che aggiorna questo file è verificabile tramite output post-push del task corrente o backfill al task successivo — **non** tramite auto-riferimento nel medesimo snapshot.

**Futuro:** [`AUTOMATIC_POST_PUSH_VERIFIER.md`](AUTOMATIC_POST_PUSH_VERIFIER.md) — worker/n8n popolerà questo file automaticamente; fino ad allora aggiornamento manuale o via Cursor task.
