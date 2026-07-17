# Session — D-0052-W L4 callback PASS + D-0053-G Option 2 (docs-only)

**Repository:** `mrhz1973/control-plane`
**Date:** 2026-07-17
**Type:** Docs-only record of user-attested runtime + export governance. **Cursor runtime actions: 0.**

| Field | Value |
|-------|--------|
| **result_cursor** | `PASS_DOCS_ONLY` |
| **result_runtime** | `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L4_CALLBACK` |
| **D-0052-W** | Option **1** · `decision_provenance=direct_operator_message` |
| **D-0053-G** | Option **2** · `decision_provenance=direct_operator_message` |

---

## 1. Direct operator decisions

### D-0052-W

- **selected_option:** 1
- **decision_provenance:** `direct_operator_message`
- **Meaning:** accept bounded L4 callback runtime evidence as scope-limited PASS (dedicated harnesses; not Gate E; not L5).

### D-0053-G

- **selected_option:** 2
- **decision_provenance:** `direct_operator_message`
- **Meaning:**
  - three original n8n exports remain unchanged in **private local storage outside GitHub**;
  - GitHub records only their **SHA-256 hashes** and documentary evidence;
  - **no** original export committed;
  - **no** redacted copy committed;
  - **no** derived template created or committed;
  - **no** workflow JSON modified;
  - **no** secrets-in-Git exception;
  - **no** change to `PROJECT_VISION.md` §10.

Provenance is **direct operator message** — not GLM, GPT-B, advisor recommendation, or proxy.

---

## 2. Original-export SHA-256 (orchestrator-verified)

`hash_provenance=ORCHESTRATOR_VERIFIED_FROM_USER_UPLOADED_ORIGINAL_EXPORTS`

Cursor did **not** recalculate these hashes and did **not** hold the original files.

| Export (filename) | SHA-256 |
|-------------------|---------|
| `45 - Wd L4 One-Button Decision Fixture TEST ONLY - IMPORT.json` | `2d5fbffe455fec1e6957aa01483481f40e78b1936c48a9013a0dd9ff8cede3c0` |
| `47 - Wf L4 Callback Polling + Ack TEST ONLY - IMPORT.json` | `af5b262741a08a6b94e6f3b9732d3838240b0900b9cff23d8e562d467704870e` |
| `48 - Wg L4 External Receipt Close 1-5 TEST ONLY - IMPORT.json` | `8477aa2f7e0ecf1f778cf784666e4fe27650a98f1b1984206f1641dac2245181` |

**Explicit:** originals remain outside Git; this task created **no** workflow JSON, redacted copy, or derived template.

---

## 3. D-0052-W bounded L4 runtime evidence (user-attested)

Cursor did **not** execute n8n or Telegram.

### Preflight

| Field | Value |
|-------|--------|
| webhook_preflight | `PASS_NO_ACTIVE_WEBHOOK` |
| getWebhookInfo.ok | `true` |
| getWebhookInfo.result.url | `""` |
| allowed_updates | `["message","callback_query"]` |

### Fixture and send

| Field | Value |
|-------|--------|
| decision_id | `D-0052-T` |
| wf45_manual_runs | `1` |
| telegram_sends | `1` |
| fan_out_items_in | `1` |
| selected_callback | `dp:D-0052-T:5` |

### wf47 accepted receipt

| Field | Value |
|-------|--------|
| inspect_status | `accepted` |
| decision_id | `D-0052-T` |
| selected_option | `5` |
| update_id | `986228604` |
| duplicate_or_stale | `false` |
| block_reason | `null` |
| allowed_chat_configured | `true` |
| offset_after_placeholder | `986228605` |
| last_handled_update_id | `986228602` |
| callback_ack_applicable | `true` |
| callback_ack_attempted | `true` |
| callback_ack_ok | `true` |
| callback_ack_block_reason | `null` |
| open_decision_ids_source | `control_plane_decisions_test` |
| store_derivation_bypassed | `false` |
| open_decision_ids_count | `1` |
| receipt_one_item_live_pass | `true` |
| test_only | `true` |

### Persisted wf47 state

| Field | Value |
|-------|--------|
| last_update_id | `986228605` |
| last_handled_update_id | `986228604` |
| handled_keys_json | includes `D-0052-T:5:986228604` |
| note | `wf47 polling state TEST ONLY` |

### Callback acknowledgement claim boundary

| Field | Value |
|-------|--------|
| answerCallbackQuery_api_call_ok | `true` |
| answer_callback_query_live_status | `PASS_API_CALL_ONLY` |
| spinner_removed_observation | `NOT_DIRECTLY_OBSERVED` |
| spinner_ux_effect_live_pass | `NOT_CLAIMED` |

### Parser claim boundary

| Field | Value |
|-------|--------|
| parser_repository_support | `OPTIONS_1_TO_5` |
| parser_option_5_live_pass | `true` |
| parser_option_4_live_pass | `NOT_TESTED` |

### wf48 close

| Field | Value |
|-------|--------|
| inspect_status | `closed` |
| decision_id | `D-0052-T` |
| selected_option | `5` |
| update_id | `986228604` |
| prior_status | `open` |
| state_persisted | `true` |
| test_only | `true` |

No second click. No second business run of wf47.

---

## 4. Final teardown and inventory (user-attested)

- Stale D-0052 workflow copies deleted from n8n.
- Previous D-0052 L4 TEST copy deleted.
- Temporary getWebhookInfo workflow deleted.
- Three dedicated D-0052 harnesses remain present and **inactive**.
- Official wf45 restored: no `D-0052-T`; no callback keyboard; Reply Markup=None; Parse Mode=HTML.
- Official wf48 present and inactive.
- Official canonical wf47 **not visible** in final complete n8n inventory.
- `wf47_official_inventory_status=ABSENT_FROM_FINAL_N8N_LIST`
- `l5_activation_blocker=WF47_OFFICIAL_INSTANCE_ABSENT`
- `l5_activation_authorized=false`
- No new Published / Active / Schedule.
- wf40/41/42 unchanged.

**Audit finding + L5 blocker:** absent official wf47 instance. Does **not** invalidate limited D-0052 L4 callback PASS (dedicated harnesses).

---

## 5. Invariants and non-claims

**Preserved:** PM-34 BLOCKED · `pm34_unblocked=false` · `n8n_ready=false` · Gate E full PASS=false · `enable_wg48_handoff=false` · wf40/41/42 untouched · We/46 inactive webhook fallback · wf47 polling-first architecture · no permanent schedule · no public webhook · no active Telegram Trigger.

**Not claimed:** Gate E PASS · L5 PASS · end-to-end automatic operation · operational activation · PM-34 unlock · `n8n_ready=true` · `enable_wg48_handoff=true` · permanent schedule · public webhook · direct spinner-removal observation · runtime validation of option 4 · runtime validation of every option 1–5 · Cursor-executed runtime · original exports in Git.

---

## 6. Canonical references

- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md`
- `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`
- `docs/workflow-wf47-wg-operationalization-plan.md`
