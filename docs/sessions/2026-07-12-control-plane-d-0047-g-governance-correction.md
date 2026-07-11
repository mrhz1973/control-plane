# Session — D-0047-G governance correction (direct operator)

**Repository:** `mrhz1973/control-plane`
**Date:** 2026-07-12
**Decision:** **D-0047-G Opzione 2** — do not ratify D-0046-E Option 3; correct repository record
**Outcome:** **NOT_RUN_GOVERNANCE_CORRECTION** — docs-only forward correction; **no** runtime rollback
**Type:** Governance correction; **no runtime** by Cursor or operator.

| Field | Value |
|-------|--------|
| **result_cursor** | `PASS_DOCS_ONLY` |
| **result_runtime** | `NOT_RUN_GOVERNANCE_CORRECTION` |
| **decision_provenance** | `direct_operator_message` |
| **direct operator response** | `"2"` |
| **d0046e_record_status** | `VOIDED_MISATTRIBUTED_OPERATOR_CHOICE` |
| **gate_e_status** | `OPERATOR_DECISION_PENDING` |

---

## 1. Direct operator decision

- **decision_id:** D-0047-G
- **kind:** meta
- **selected_option:** 2
- **decision_date:** 2026-07-12
- **decision_provenance:** `direct_operator_message`

The operator directly responded `"2"`: do not ratify D-0046-E Option 3; correct the repository record.

---

## 2. Governance anomaly

- The operator **never** directly selected Option 3 for D-0046-E.
- The number **3** came from a **consultative GLM recommendation**.
- **GPT-B** incorrectly treated that recommendation as an operator choice.
- The D-0046-E STOP record is therefore **invalid** as an operator decision.
- Technical findings behind the GLM review remain **valid consultative evidence** — not authorization.

---

## 3. Corrected status

| Item | Status |
|------|--------|
| D-0046-E Option 3 | **VOIDED_MISATTRIBUTED_OPERATOR_CHOICE** — not ratified |
| D-0046-E | **NOT** BLOCKED · **NOT** runtime failure · **NOT** runtime NO-GO |
| Gate E | **OPERATOR_DECISION_PENDING** — no valid current operator choice |
| Prior commits (`4273bde`, `375f495`) | Remain in Git as **audit evidence**; superseded by D-0047-G, **not** reverted |

---

## 4. What did NOT happen (unchanged facts)

- No runtime n8n, Telegram, workflow or store activity
- **D-0046-T** not created
- **`enable_wg48_handoff=false`**
- **D-0045-E** remains latest scope-limited runtime PASS
- No store cleanup required

---

## 5. Anti-proxy prevention (codified)

Root-cause fix recorded in `PROJECT_VISION.md` §7.3.1 and `GLM_ADVISOR_METHOD.md`:
advisor recommendations are never operator decisions or authorization.

---

## 6. Future Gate E (not initiated here)

- Gate E does **not** restart automatically.
- Reopening requires **new explicit Decision Packet** + **direct operator response**.
- GLM reopening conditions (from D-0046-E session §5) remain **advisory reference only**.
- This task does **not** create a new Decision Packet.

---

## 7. Canonical references

- `docs/sessions/2026-07-12-control-plane-d-0046-e-gate-e-stop-decision.md` (superseded record)
- `docs/foundation/PROJECT_VISION.md` §7.3.1
- `docs/advisors/GLM_ADVISOR_METHOD.md`
- `docs/runtime/CURRENT_FRONTIER.md`
