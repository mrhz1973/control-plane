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
- **Policy materiali sensibili v2.16:** repo non-confidenziale secondo `PROJECT_VISION.md` §10 v2.18. **Redazione a cura dell'operatore** (token, ID, credenziali, identificatori Telegram, ecc.) prima di incollare in chat o autorizzare commit. Nessuna clausola esplicita «no secrets» / «redazione obbligatoria» nei prompt Cursor o nei session log futuri. Controllo compensativo: rotazione credenziali a fine progetto (`docs/ROTATION_CHECKLIST.md`). Tolleranze chat_id e identificatori tailnet invariate (§10).

---

## Previous snapshot (backfilled)

```yaml
task_ref: d0052w-l4-callback-pass-d0053g-option2
verified_task_commit: 861d41ed0845a7f70e64d17a804e047af560e77f
verified_base_commit: 97d420c0231e678edc9b440d61923fe3346cb93c
verified_rolling_report_commit: eea0b4a5ee2adc66c24dd5bd76d4be4d38bdbce1
verified_through_commit: 861d41ed0845a7f70e64d17a804e047af560e77f
observed_head: 861d41ed0845a7f70e64d17a804e047af560e77f
observed_origin_main: 861d41ed0845a7f70e64d17a804e047af560e77f
observed_ls_remote_main: 861d41ed0845a7f70e64d17a804e047af560e77f
branch: main
workspace_status: clean
artifact_commit: eea0b4a5ee2adc66c24dd5bd76d4be4d38bdbce1
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L4_CALLBACK
decision_id: D-0052-W
selected_option: 1
decision_provenance: direct_operator_message
export_governance_decision_id: D-0053-G
export_governance_selected_option: 2
export_governance_provenance: direct_operator_message
original_exports_committed: false
redacted_exports_committed: false
derived_templates_committed: false
workflow_files_modified: false
callback_query_live_pass: true
answer_callback_query_api_call_ok: true
spinner_removed_observation: NOT_DIRECTLY_OBSERVED
parser_option_5_live_pass: true
parser_option_4_live_pass: NOT_TESTED
receipt_one_item_live_pass: true
wf47_official_inventory_status: ABSENT_FROM_FINAL_N8N_LIST
l5_activation_blocker: WF47_OFFICIAL_INSTANCE_ABSENT
l5_activation_authorized: false
enable_wg48_handoff: false
gate_e_full_pass: false
n8n_ready: false
pm34_unblocked: false
timestamp_utc: 2026-07-17
```

**Nota:** snapshot D-0052-W / D-0053-G — rolling report / artifact `eea0b4a` backfilled; superseded da D-0054-W inventory restore (2026-07-17).

```yaml
task_ref: d0051g-d0050w-commit-provenance-correction
verified_task_commit: a2d088912ee83603f5fd96b08921937c7d382914
verified_base_commit: 7515fc9d922fb80f2003fbefde87957c18917a04
verified_rolling_report_commit: 7a7eb9b5870995404c0a25870d6dec4e9f1830b8
verified_through_commit: a2d088912ee83603f5fd96b08921937c7d382914
observed_head: a2d088912ee83603f5fd96b08921937c7d382914
observed_origin_main: a2d088912ee83603f5fd96b08921937c7d382914
observed_ls_remote_main: a2d088912ee83603f5fd96b08921937c7d382914
branch: main
workspace_status: clean
artifact_commit: 7a7eb9b5870995404c0a25870d6dec4e9f1830b8
result: PASS_REMOTE_DOCUMENTAL_REPORT_ONLY_GOVERNANCE_CORRECTION
result_runtime: NOT_RUN_AUDIT_CORRECTION
decision_id: D-0051-G
selected_option: 1
decision_provenance: direct_operator_message
corrected_task_ref: d0050w-wf47-callback-query-l3-repository-implementation
corrected_base_commit: b0bfee43382b2de1a2fd5710fa3004c6c370af71
corrected_real_task_commit: 9cc21624d4441a6a0ca676d4ff0f29cc05341243
intermediate_substantive_commit: 095933d9d0b9edb3edf42233225aa89d3e9f3f3d
original_report_commit: 7515fc9d922fb80f2003fbefde87957c18917a04
commit_convention_status: DEVIATION_RECORDED
runtime_executed: false
workflow_template_modified_by_correction: false
runtime_workflow_modified: false
callback_query_live_pass: false
answer_callback_query_live_pass: false
l4_runtime_test_authorized: false
l5_live_activation_authorized: false
gate_e_status: OPERATOR_DECISION_PENDING
gate_e_full_pass: false
enable_wg48_handoff: false
n8n_ready: false
pm34_unblocked: false
timestamp_utc: 2026-07-12
```

**Nota:** snapshot D-0051-G provenance correction — rolling report `7a7eb9b` backfilled; superseded da D-0052-W / D-0053-G docs record (2026-07-17).

```yaml
task_ref: d0050w-wf47-callback-query-l3-repository-implementation
verified_task_commit: 9cc21624d4441a6a0ca676d4ff0f29cc05341243
verified_base_commit: b0bfee43382b2de1a2fd5710fa3004c6c370af71
substantive_commit_range: b0bfee43382b2de1a2fd5710fa3004c6c370af71..9cc21624d4441a6a0ca676d4ff0f29cc05341243
intermediate_substantive_commit: 095933d9d0b9edb3edf42233225aa89d3e9f3f3d
original_report_commit: 7515fc9d922fb80f2003fbefde87957c18917a04
supersedes_report_commit: 7515fc9d922fb80f2003fbefde87957c18917a04
commit_convention_status: DEVIATION_RECORDED
verified_rolling_report_commit: a2d088912ee83603f5fd96b08921937c7d382914
verified_through_commit: 9cc21624d4441a6a0ca676d4ff0f29cc05341243
observed_head: 9cc21624d4441a6a0ca676d4ff0f29cc05341243
observed_origin_main: 9cc21624d4441a6a0ca676d4ff0f29cc05341243
observed_ls_remote_main: 9cc21624d4441a6a0ca676d4ff0f29cc05341243
branch: main
workspace_status: clean
artifact_commit: a2d088912ee83603f5fd96b08921937c7d382914
result: PASS_REMOTE_DOCUMENTAL_REPOSITORY_IMPLEMENTATION
result_runtime: NOT_RUN_L3_IMPLEMENTATION
decision_id: D-0050-W
selected_option: 1
decision_provenance: direct_operator_message
parent_decision_id: D-0049-W
parent_selected_option: 1
callback_query_live_pass: false
answer_callback_query_live_pass: false
gate_e_status: OPERATOR_DECISION_PENDING
enable_wg48_handoff: false
n8n_ready: false
pm34_unblocked: false
timestamp_utc: 2026-07-12
```

**Nota:** snapshot D-0050-W L3 repository — provenance corrected by D-0051-G (`a2d0889`); original report `7515fc9` remains in Git history; superseded da D-0051-G audit correction (2026-07-12).

```yaml
task_ref: d0049w-we-polling-first-architecture-decision
verified_task_commit: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
verified_base_commit: 417f136266978a4b6a64b85f9fa1574f87bed226
verified_rolling_report_commit: b0bfee43382b2de1a2fd5710fa3004c6c370af71
verified_through_commit: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
observed_head: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
observed_origin_main: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
observed_ls_remote_main: 9c328fe266a520f59e2f29bb44d30f0377aa6b70
branch: main
workspace_status: clean
artifact_commit: b0bfee43382b2de1a2fd5710fa3004c6c370af71
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN_ARCHITECTURE_DECISION
decision_id: D-0049-W
selected_option: 1
decision_provenance: direct_operator_message
parent_decision_id: D-0048-S
parent_selected_option: 2
inbound_primary_architecture: WF47_POLLING_FIRST
gate_e_status: OPERATOR_DECISION_PENDING
gate_e_full_pass: false
runtime_executed: false
workflow_modified: false
enable_wg48_handoff: false
n8n_ready: false
pm34_unblocked: false
timestamp_utc: 2026-07-12
```

**Nota:** snapshot D-0049-W polling-first architecture — superseded da D-0050-W L3 repository implementation (2026-07-12).

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
task_ref: d0054w-wf47-official-inventory-restore
verified_task_commit: 3dab99f1d5a936c2fc57b928e8a83bd94e54e84a
verified_base_commit: eea0b4a5ee2adc66c24dd5bd76d4be4d38bdbce1
verified_rolling_report_commit: PENDING_SELF_REFERENCE
verified_through_commit: 3dab99f1d5a936c2fc57b928e8a83bd94e54e84a
observed_head: 3dab99f1d5a936c2fc57b928e8a83bd94e54e84a
observed_origin_main: 3dab99f1d5a936c2fc57b928e8a83bd94e54e84a
observed_ls_remote_main: 3dab99f1d5a936c2fc57b928e8a83bd94e54e84a
branch: main
workspace_status: clean
artifact_commit: PENDING_SELF_REFERENCE
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN_CONFIGURATION_ONLY
result_ui: PASS_ATTESTATO_UTENTE_CONFIGURATION_ONLY
task_kind: wf47_official_inventory_restore
decision_id: D-0054-W
selected_option: 1
decision_provenance: direct_operator_message
n8n_ui_modification_by_operator: true
configuration_only: true
functional_test_executed: false
workflow_execute_count: 0
runtime_executed_by_cursor: false
runtime_actions_by_cursor: 0
wf47_official_inventory_status: PRESENT_IN_FINAL_N8N_LIST
wf47_official_local_id: XALAlPKvMQ5GzUva
wf47_official_active: false
wf47_official_published: false
wf47_schedule_disabled: true
hardened_marker_node_present: true
prior_l5_activation_blocker: WF47_OFFICIAL_INSTANCE_ABSENT
l5_inventory_blocker_resolved: true
l5_activation_authorized: false
wg48_execute_workflow_reference_status: PLACEHOLDER_NOT_CONFIGURED
wg48_execute_workflow_reference_validation: NOT_IN_SCOPE
enable_wg48_handoff: false
gate_e_status: OPERATOR_DECISION_PENDING
gate_e_full_pass: false
n8n_ready: false
pm34_unblocked: false
parser_option_5_live_pass: true
parser_option_4_live_pass: NOT_TESTED
spinner_removed_observation: NOT_DIRECTLY_OBSERVED
timestamp_utc: 2026-07-17
```

**Nota:** D-0054-W verified through commit 1 `3dab99f` — docs-only; configuration-only UI restore; **not** a runtime PASS; **NOT** verified through commit 2 (this report). Commit 2 = artefatti verifica/report/handoff; `artifact_commit: PENDING_SELF_REFERENCE`.

**Backfill PENDING_SELF_REFERENCE:** D-0052-W / D-0053-G snapshot → `eea0b4a`; D-0051-G snapshot → `7a7eb9b`; D-0050-W snapshot → `a2d0889`; D-0049-W snapshot → `b0bfee4`; D-0047-G snapshot → `417f136`; D-0046-E snapshot → `375f495`; D-0045-E snapshot → `95b9045`; wf45→wf47 snapshot → `f01ad73`; orchestrator contract snapshot → `6fafa9b`; wf47 bounded runtime validation snapshot → `39b53e4`; wf47→wf48 bounded handoff snapshot → `5884acd`; D-0040-E snapshot → `0411f3e`.

---

## Command outputs (verbatim, sanitized — D-0054-W commit 1)

```text
git log --oneline -8
3dab99f docs: record D-0054 wf47 inventory restore
eea0b4a docs: refresh runtime reports for D-0052 and D-0053
861d41e docs: record D-0052 L4 callback pass and D-0053 decision
97d420c docs: handoff D-0052-W operator decision pending
7a7eb9b docs: refresh runtime reports for D-0051-G
a2d0889 docs: correct D-0050-W commit provenance
7515fc9 docs: refresh runtime reports for D-0050-W
9cc2162 feat: harden wf47 callback-query path for D-0050-W

git status --short

git rev-parse HEAD
3dab99f1d5a936c2fc57b928e8a83bd94e54e84a

git rev-parse origin/main
3dab99f1d5a936c2fc57b928e8a83bd94e54e84a

git branch --show-current
main

git show --stat HEAD
commit 3dab99f1d5a936c2fc57b928e8a83bd94e54e84a
 docs/runtime/AUTOMATION_ACTIVATION_PLAN.md         |  22 +++-
 docs/runtime/CURRENT_FRONTIER.md                   |  29 +++--
 ...4-w-wf47-official-restore-configuration-only.md | 139 +++++++++++++++++++++
 ...kflow-wf-telegram-inbound-polling-getupdates.md |  49 +++++++--
 docs/workflow-wf47-wg-operationalization-plan.md   |   3 +-
 5 files changed, 220 insertions(+), 22 deletions(-)

git ls-remote origin refs/heads/main
3dab99f1d5a936c2fc57b928e8a83bd94e54e84a	refs/heads/main

git diff --name-only eea0b4a5ee2adc66c24dd5bd76d4be4d38bdbce1..HEAD
docs/runtime/AUTOMATION_ACTIVATION_PLAN.md
docs/runtime/CURRENT_FRONTIER.md
docs/sessions/2026-07-17-control-plane-d-0054-w-wf47-official-restore-configuration-only.md
docs/workflow-wf-telegram-inbound-polling-getupdates.md
docs/workflow-wf47-wg-operationalization-plan.md
```

**BASE (record commit 1):** `eea0b4a5ee2adc66c24dd5bd76d4be4d38bdbce1`

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
