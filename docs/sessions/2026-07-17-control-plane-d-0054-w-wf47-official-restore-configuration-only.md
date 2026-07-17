# Session — D-0054-W wf47 official inventory restore (configuration-only)

**Repository:** `mrhz1973/control-plane`
**Date:** 2026-07-17
**Type:** Docs-only record of operator-performed n8n UI inventory/configuration restoration.
**Cursor runtime actions:** 0.

| Field | Value |
|-------|--------|
| **decision_id** | D-0054-W |
| **selected_option** | 1 |
| **decision_provenance** | `direct_operator_message` |
| **task_kind** | `wf47_official_inventory_restore` |
| **result_cursor** | `PASS_DOCS_ONLY` |
| **result_runtime** | `NOT_RUN_CONFIGURATION_ONLY` |
| **result_ui** | `PASS_ATTESTATO_UTENTE_CONFIGURATION_ONLY` |
| **n8n_ui_modification_by_operator** | `true` |
| **configuration_only** | `true` |
| **functional_test_executed** | `false` |
| **workflow_execute_count** | `0` |
| **runtime_executed_by_cursor** | `false` |

This is **not** a functional workflow test and **not** a runtime PASS.

---

## 1. Direct operator decision

- **selected_option:** 1
- **decision_provenance:** `direct_operator_message`
- **Meaning:** record that the operator restored the official wf47 inventory instance in the n8n UI from the live canonical template, configuration-only.

Provenance is **direct operator message** — not GLM, GPT-B, advisor recommendation, or proxy.

---

## 2. Template source

| Field | Value |
|-------|--------|
| **template_source_path** | `workflows/wf-telegram-inbound-polling-getupdates.template.json` |
| **template_source_commit** | `eea0b4a5ee2adc66c24dd5bd76d4be4d38bdbce1` |
| **historical_export_used** | `false` |

Explicit: the historical 2026-07-02 redacted export was **not** imported.

---

## 3. Official wf47 inventory (user-attested UI)

| Field | Value |
|-------|--------|
| **workflow_name** | `47 - Wf Telegram Inbound Polling getUpdates TEST ONLY - TEMPLATE` |
| **wf47_official_local_id** | `XALAlPKvMQ5GzUva` |
| **wf47_official_inventory_status** | `PRESENT_IN_FINAL_N8N_LIST` |
| **wf47_official_active** | `false` |
| **wf47_official_published** | `false` |
| **wf47_schedule_disabled** | `true` |
| **enable_wg48_handoff** | `false` |
| **workflow_execute_count** | `0` |
| **wf40_41_42_unchanged** | `true` |
| **tunnel_closed** | `true` |

| Field | Value |
|-------|--------|
| **hardened_marker_node_present** | `true` |
| **hardened_marker_node_name** | `Collapse shared decisions load fan-out (1 item per run)` |
| **allowed_chat_id_configured_in_ui** | `true` |
| **telegram_getupdates_endpoint_configured_in_ui** | `true` |
| **telegram_answercallbackquery_endpoint_configured_in_ui** | `true` |
| **existing_values_reused_without_change** | `true` |
| **credential_rotation_performed** | `false` |
| **shared_decisions_table** | `control_plane_decisions_test` |
| **polling_state_table** | `wf47_polling_state_test` |
| **data_table_references_verified** | `true` |
| **wg48_execute_workflow_reference_status** | `PLACEHOLDER_NOT_CONFIGURED` |
| **wg48_execute_workflow_reference_validation** | `NOT_IN_SCOPE` |

No actual allowed_chat_id, Telegram token, endpoint URL, credential reference, or Data Table content is recorded here.

---

## 4. Scope and claim boundaries

- Official wf47 inventory instance restored by the **operator** in the n8n UI.
- Source = live canonical template (path above); historical export not used.
- Hardened marker node present after import.
- Existing UI values reused without change; no credential rotation.
- Left inactive, unpublished; Schedule disabled; `enable_wg48_handoff=false`.
- Execute Workflow reference to wf48 remains an unconfigured placeholder; not validated.
- No workflow execution; no Telegram update consumed; no callback acknowledged.
- No polling-state functional test; no decision-store open/close; no wf47→wf48 callable handoff.
- No workflow JSON or sensitive configuration value added to Git.
- Cursor performed zero runtime or n8n actions.

### Inventory blocker

| Field | Value |
|-------|--------|
| **prior_l5_activation_blocker** | `WF47_OFFICIAL_INSTANCE_ABSENT` |
| **l5_inventory_blocker_resolved** | `true` |

### Unchanged gates

| Field | Value |
|-------|--------|
| **l5_activation_authorized** | `false` |
| **gate_e_status** | `OPERATOR_DECISION_PENDING` |
| **gate_e_full_pass** | `false` |
| **n8n_ready** | `false` |
| **pm34_unblocked** | `false` |
| **enable_wg48_handoff** | `false` |

### Preserved earlier evidence boundaries

| Field | Value |
|-------|--------|
| **parser_option_5_live_pass** | `true` |
| **parser_option_4_live_pass** | `NOT_TESTED` |
| **spinner_removed_observation** | `NOT_DIRECTLY_OBSERVED` |

**Next live test** is **not** automatically authorized or started. It requires a separate direct-operator Decision Packet.

---

## 5. Invariants and non-claims

**Preserved:** PM-34 BLOCKED · `pm34_unblocked=false` · `n8n_ready=false` · Gate E full PASS=false · `enable_wg48_handoff=false` · `l5_activation_authorized=false` · wf40/41/42 untouched · We/46 inactive webhook fallback · wf47 polling-first architecture · no permanent schedule · no public webhook · no active Telegram Trigger.

**Not claimed:** functional test PASS · runtime PASS · L5 PASS · Gate E PASS · Gate E full PASS · automatic end-to-end operation · successful getUpdates / callback receipt / answerCallbackQuery / polling-state persistence on the restored official wf47 · callable wf47→wf48 validation · wf48 reference validation · option 4 runtime · spinner UX · `n8n_ready=true` · PM-34 unlock · permanent schedule · active Telegram Trigger · public webhook · that Cursor performed the import or configured n8n.

---

## 6. Canonical references

- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md`
- `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- `docs/workflow-wf47-wg-operationalization-plan.md`
