# Session — D-0062-E … D-0065-W wf47→wf48 runtime passes + workflow-authoring boundary

**Repository:** `mrhz1973/control-plane`
**Date:** 2026-07-18
**Decision provenance:** `direct_operator_message`
**Task id:** D-0065-W
**Task type:** Docs-only governance + runtime-evidence reconciliation
**Runtime executor:** human operator in n8n UI (D-0062/D-0063/D-0064)
**Cursor runtime actions:** `0`
**Cursor n8n verification:** none (operator-attested evidence only)
**workflows/\*\* changed by this task:** `false`

---

## 1. Scope and result

| Field | Value |
|-------|--------|
| result_cursor | `PASS_DOCS_ONLY` |
| result_runtime | operator-attested scope-limited PASS for D-0062 and D-0063; Cursor `NOT_RUN` |
| governance | GPT-B/Cursor n8n workflow-authoring boundary canonized (PROJECT_VISION v2.19) |
| routing | repository-based Cursor identification; color labels non-canonical |

---

## 2. Governance correction — role boundary

Canonized permanent rule:

- **GPT-B:** human-facing orchestrator, Decision Packet author, runtime guide, authoritative n8n workflow author.
- **Cursor:** repository/code implementer for explicitly authorized prompts; **not** autonomous n8n workflow designer.
- **Claude:** independent verifier/reviewer.
- **GLM:** read-only consultative advisor.
- **Human operator:** decision-maker and supervised n8n UI/runtime operator.

Cursor may touch `workflows/**` only under explicit `PERSIST VERBATIM GPT-B-SUPPLIED WORKFLOW ARTIFACT`. Missing/inconsistent details → `BLOCKED_WORKFLOW_AUTHORING_RESERVED_TO_GPT_B`.

This is an explicit exception to the general statement «Cursor implementa» for n8n workflow artifacts.

---

## 3. Routing correction — no color labels

- Identify Cursor by repository full name, local path when needed, branch, task/project.
- Do **not** identify Cursor windows through UI colors.
- Color labels are non-canonical and must not be used in future GPT-B instructions, Cursor prompts, handoffs or reports.
- Canonical example replaced in `CURSOR_PROMPT_TEMPLATE.md` with repository-based wording.
- Historical session/archived handoff color references left untouched.

---

## 4. D-0062-E — fresh callable wf47 → official wf48

**Claim:** `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_FRESH_CALLABLE_WF47_TO_OFFICIAL_WF48`

### Fixture

| Field | Value |
|-------|--------|
| decision_id | `D-0062-T4` |
| selected_option | `"4"` |

### wf45 fresh open/send

| Field | Value |
|-------|--------|
| telegram_send_ok | `true` |
| message_id | `1213` |
| http_status | `200` |
| classifier_validated | `false` (recorded honestly; did not block this callable-path validation) |
| decision_id | `D-0062-T4` |
| open_action | `insert` |
| block_reason | `null` |
| send_suppressed | `false` |
| fan_out_items_in | `1` |
| fan_out_collapsed | `false` |
| pass_claimed | `false` |
| test_only | `true` |

### wf47 manual callable receipt

| Field | Value |
|-------|--------|
| inspect_status | `accepted` |
| decision_id | `D-0062-T4` |
| selected_option | `"4"` |
| update_id | `986228609` |
| duplicate_or_stale | `false` |
| note_present | `false` |
| block_reason | `null` |
| allowed_chat_configured | `true` |
| offset_after_placeholder | `986228610` |
| last_handled_update_id | `986228607` |
| callback_ack_applicable | `false` |
| callback_ack_attempted | `false` |
| callback_ack_ok | `null` |
| callback_ack_block_reason | `not_applicable` |
| open_decision_ids_source | `control_plane_decisions_test` |
| store_derivation_bypassed | `false` |
| open_decision_ids_count | `1` |
| test_only | `true` |

### Official wf48

| Field | Value |
|-------|--------|
| inspect_status | `closed` |
| decision_id | `D-0062-T4` |
| selected_option | `"4"` |
| update_id | `986228609` |
| block_reason | `null` |
| prior_status | `open` |
| state_persisted | `true` |
| test_only | `true` |

### Store

- `D-0062-T4` closed; `selected_option` `"4"`; final observed `open_count` `0`.

### update_id limitation (mandatory)

`update_id` **986228609** is numerically equal to the `update_id` previously recorded for **D-0060-T5**.

**Do not claim:** globally unique update_id; non-reused update_id; freshness proven solely by update_id.

**Allowed freshness claim:** new decision `D-0062-T4`; new wf45 open/send; newly exercised callable wf47→official wf48 path.

---

## 5. D-0063-E — bounded scheduled wf47 → official wf48

**Claim:** `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_SCHEDULED_WF47_TO_OFFICIAL_WF48`

### Fixture

| Field | Value |
|-------|--------|
| decision_id | `D-0063-T4` |
| selected_option | `"4"` |

### Initial scheduled run (blocker — no PASS)

| Field | Value |
|-------|--------|
| inspect_status | `blocked` |
| decision_id | `null` |
| selected_option | `null` |
| update_id | `null` |
| block_reason | `allowed_chat_not_configured` |
| allowed_chat_configured | `false` |
| open_decision_ids_count | `1` |
| test_only | `true` |

Recorded:

- published wf47 version lacked a usable `allowed_chat_id`;
- guard correctly failed closed;
- no PASS claimed for this run;
- configuration corrected using the value from a previous successful execution;
- no additional Telegram option message required for the successful run.

### Successful scheduled wf47 pickup

| Field | Value |
|-------|--------|
| inspect_status | `accepted` |
| decision_id | `D-0063-T4` |
| selected_option | `"4"` |
| update_id | `986228610` |
| duplicate_or_stale | `false` |
| note_present | `false` |
| block_reason | `null` |
| allowed_chat_configured | `true` |
| offset_after_placeholder | `986228611` |
| last_handled_update_id | `986228609` |
| callback_ack_applicable | `false` |
| callback_ack_attempted | `false` |
| callback_ack_ok | `null` |
| callback_ack_block_reason | `not_applicable` |
| open_decision_ids_source | `control_plane_decisions_test` |
| store_derivation_bypassed | `false` |
| open_decision_ids_count | `1` |
| test_only | `true` |

### Official wf48 via Execute Workflow

| Field | Value |
|-------|--------|
| inspect_status | `closed` |
| decision_id | `D-0063-T4` |
| selected_option | `"4"` |
| update_id | `986228610` |
| note_present | `false` |
| block_reason | `null` |
| prior_status | `open` |
| state_persisted | `true` |
| test_only | `true` |

### Later scheduled scan (not a second PASS)

| Field | Value |
|-------|--------|
| inspect_status | `blocked` |
| decision_id | `null` |
| selected_option | `null` |
| update_id | `null` |
| duplicate_or_stale | `false` |
| block_reason | `no_parseable_decision_response` |
| allowed_chat_configured | `true` |
| offset_after_placeholder | `986228611` |
| last_handled_update_id | `986228610` |
| open_decision_ids_count | `0` |
| test_only | `true` |

Occurred after the response had already been consumed; found no remaining open decision; **not** a second PASS; **not** a second close.

---

## 6. D-0064-E — publication dependency

Observed: wf47 could not be published while its Execute Workflow node referenced an unpublished official wf48 (`Cannot publish workflow` / referenced sub-workflow must be published first).

Direct operator decision:

- publish official wf48 as a callable sub-workflow;
- no autonomous Schedule on wf48;
- no Telegram Trigger;
- no public webhook;
- no autonomous trigger;
- publication required only so wf47 could call official wf48 through Execute Workflow.

Do **not** describe wf48 as autonomous permanent automation.

---

## 7. Teardown evidence boundary

| Field | Value |
|-------|--------|
| teardown_instruction_issued | `true` |
| teardown_final_state_independently_verified | `false` |
| teardown_final_runtime_state | `NOT_VERIFIED_IN_SUPPLIED_EVIDENCE` |

Instructed after successful D-0063: disable wf47 Schedule; restore `enable_wg48_handoff=false`; stop recurring wf47 executions; send no additional Telegram; wf48 may remain published only as triggerless callable. Do **not** infer completion from conversational continuation.

---

## 8. Claim table

| Item | Status |
|------|--------|
| D-0062 fresh callable PASS (scope-limited, operator-attested) | claimed |
| D-0063 scheduled bounded PASS (scope-limited, operator-attested) | claimed |
| Option 4 correlated and persisted | claimed |
| Official wf48 callable path worked | claimed |
| allowed_chat fail-closed when not configured | claimed |
| allowed_chat present on successful scheduled run | claimed |
| D-0062-T4 / D-0063-T4 closed; open_count 0 | claimed |
| GPT-B authoritative n8n author | claimed |
| Cursor independent workflow authoring prohibited | claimed |
| Cursor routing repository-based | claimed |
| Globally unique / non-reused D-0062 update_id | **not claimed** |
| Permanent polling / permanent wf47 Schedule | **not claimed** |
| Gate E full / L5 / n8n_ready / PM-34 unlock | **not claimed** |
| Autonomous wf48 / Telegram Trigger / public webhook | **not claimed** |
| Independently verified teardown | **not claimed** |
| Independent n8n verification by Cursor | **not claimed** |

---

## 9. Files changed (this docs-only task)

- `docs/foundation/PROJECT_VISION.md` (v2.19)
- `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- `docs/foundation/HANDOFF_TEMPLATE.md` (v1.1)
- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/runtime/LAST_CURSOR_REPORT.md`
- `docs/runtime/LAST_HANDOFF_VERIFY.md`
- this session file
- new handoff under `docs/handoffs/`

`workflows/**`, `tools/**`, `scripts/**`: untouched.

---

## 10. Invariants preserved

```yaml
PM-34: BLOCKED
pm34_unblocked: false
n8n_ready: false
l5_activation_authorized: false
gate_e_full: NOT_CLAIMED
wf40_42: unchanged
wf41: off
no_telegram_trigger: true
no_public_webhook: true
no_permanent_schedule_authorization: true
```

---

**Fine session.**
