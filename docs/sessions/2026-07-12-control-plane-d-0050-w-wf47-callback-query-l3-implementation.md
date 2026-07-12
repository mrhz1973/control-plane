# Session — D-0050-W wf47 callback-query L3 repository implementation

**Repository:** `mrhz1973/control-plane`
**Date:** 2026-07-12
**Decision:** **D-0050-W Opzione 1** — implement wf47 callback-query L3 repository design
**Parent:** **D-0049-W Opzione 1** (polling-first architecture)
**Outcome:** **NOT_RUN_L3_IMPLEMENTATION** — repository/template only; **no** runtime
**Type:** L3 repository implementation; **no** n8n import, Telegram API, or live activation.

| Field | Value |
|-------|--------|
| **result_cursor** | `PASS_REPOSITORY_ONLY_IMPLEMENTATION` |
| **result_runtime** | `NOT_RUN_L3_IMPLEMENTATION` |
| **decision_provenance** | `direct_operator_message` |
| **parent_decision_id** | D-0049-W |
| **parent_selected_option** | 1 |
| **fixture_matrix_result** | `PASS_REPOSITORY_SIDE_A_TO_J` |
| **receipt_one_item_invariant** | `PASS_REPOSITORY_SIDE` |

---

## 1. Direct operator decision

- **decision_id:** D-0050-W
- **selected_option:** 1
- **decision_provenance:** `direct_operator_message`
- **parent_decision_id:** D-0049-W
- **parent_selected_option:** 1

---

## 2. Six debts addressed (repository-side)

| Debt | Status |
|------|--------|
| `callback_query_id` internal handling | Implemented — internal only; stripped from receipt |
| Real source-chat guard | Implemented — per-candidate `String(source_chat_id) === String(allowed_chat_id)` |
| Parser options 1–5 | Implemented — structured `dp:…:1..5` and plain `1..5` |
| Explicit `allowed_updates` | Implemented — `["message","callback_query"]` |
| `answerCallbackQuery` design | Implemented — fail-soft branch; non-authoritative |
| Deterministic one-item receipt convergence | Implemented — `Merge callback ack branches (1 item)` |

---

## 3. GLM conditions incorporated

- Mixed batch **Fixture I** — unauthorized newer update ignored; newest authorized non-stale selected
- Stale ack failure accepted — **Fixture E**; business classification unchanged on ack failure
- Explicit one-item reconvergence — merge node fails closed if item count ≠ 1
- Ambiguous plain **Fixture J** — `ambiguous_plain_option` when >1 open decision
- Receipt count invariant — `expected_receipt_items_count: 1` for all fixtures A–J

---

## 4. Fixture matrix (repository-side)

| Fixture | Scenario | Result |
|---------|----------|--------|
| **A** | Authorized structured callback option 5 | PASS |
| **B** | Authorized plain option 4 | PASS |
| **C** | Callback from wrong chat | PASS |
| **D** | Inline callback without verifiable chat | PASS |
| **E** | Authorized stale callback + ack failure | PASS |
| **F** | Authorized duplicate callback | PASS |
| **G** | Malformed callback | PASS |
| **H** | Allowed chat not configured | PASS |
| **I** | Mixed authorized/unauthorized batch | PASS |
| **J** | Ambiguous plain option (2 open decisions) | PASS |

Validation: temporary Node.js harness against embedded template `jsCode`; harness **deleted** before commit.

---

## 5. What did NOT happen

- No n8n runtime · no import · no publish · no workflow activation
- No Telegram API call · no `getUpdates` · no `answerCallbackQuery` live execution
- No L4 bounded runtime test · no L5 live activation · no Gate E runtime
- **`runtime_workflow_modified=false`** — runtime n8n instance unchanged
- **`callback_query_live_pass=false`** · **`answer_callback_query_live_pass=false`**

---

## 6. Residuals (unchanged invariants)

| Item | Status |
|------|--------|
| **Gate E** | `OPERATOR_DECISION_PENDING` |
| **D-0045-E** | Latest scope-limited runtime PASS |
| **wf45→wf47→callable-wf48** | Fresh official chain **not attested** |
| **`enable_wg48_handoff`** | `false` |
| **PM-34** | **BLOCKED** |
| **`n8n_ready`** | `false` |
| **We/46** | Inactive webhook fallback; **live PASS=false** |

---

## 7. Next frontier

- **L4** requires separate explicit Decision Packet — **not** auto-created or auto-run
- Source-chat guard, parser 1–5, `allowed_updates`, `answerCallbackQuery` — **pending L4 runtime validation**

---

## 8. Canonical references

- `workflows/wf-telegram-inbound-polling-getupdates.template.json`
- `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- `docs/runtime/CURRENT_FRONTIER.md`
