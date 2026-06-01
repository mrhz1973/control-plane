# Session — Shared decision store Gate 1 design

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-01  
**Type:** Gate 1 design docs-only. **No runtime by Cursor.**

---

## 1. Context / gap

- Outbound Wd/Wc sends Decision Packet but does **not** record **open**.
- Inbound Wf/Wg closes against **manually seeded** `wg_decision_state_test`.
- `control_plane_state` is wf40 SHA tracker — **not** a decision store.
- Controlled 47→48 runtime **PASS** (`update_id` **986228567**) proves close logic; loop still open without shared store.

## 2. Gate 1 decision

Docs-only design of **`control_plane_decisions_test`** open/close contract — closes named gap without PREP churn.

## 3. Files created

- `docs/decision-store-shared-open-close-design.md`

## 4. Files updated

- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/workflow-wf47-wg-operationalization-plan.md` (§4octies)

## 5. Not performed

- No n8n runtime, import, activation, schedule.
- No `workflows/**` or `data-tables/**` changes.
- No PM-34, 49, 40/41/42, webhook, Telegram Trigger, secrets.

## 6. Subsequent gates (not started)

- **Gate 2:** Wd open + Wg shared store template (no-runtime).
- **Gate 3:** user-attested end-to-end test-only runtime.

## 7. State preserved

- **PM-34:** **BLOCKED**
- **Telegram inbound operational automation:** **NOT ACTIVE / NOT RUN**

## 8. Final status

**PASS** — Gate 1 design recorded on `main` (pending commit/push).
