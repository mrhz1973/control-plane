# Session — D-0049-W polling-first inbound architecture (direct operator)

**Repository:** `mrhz1973/control-plane`
**Date:** 2026-07-12
**Decisions:** **D-0048-S Opzione 2** (parent) · **D-0049-W Opzione 1** (architecture selection)
**Outcome:** **NOT_RUN_ARCHITECTURE_DECISION** — docs-only L0+L1+L2; **no** runtime
**Type:** Architecture decision record; **no** implementation by Cursor or operator.

| Field | Value |
|-------|--------|
| **result_cursor** | `PASS_DOCS_ONLY` |
| **result_runtime** | `NOT_RUN_ARCHITECTURE_DECISION` |
| **decision_provenance** | `direct_operator_message` |
| **parent_decision_id** | D-0048-S |
| **parent_selected_option** | 2 |
| **inbound_primary_architecture** | `WF47_POLLING_FIRST` |
| **gate_e_status** | `OPERATOR_DECISION_PENDING` |

---

## 1. Direct operator decisions

| Decision | Option | Meaning |
|----------|--------|---------|
| **D-0048-S** | 2 | Open the We/46 arc as docs-only L0+L1+L2 |
| **D-0049-W** | 1 | Select wf47 polling-first as primary inbound architecture |

- **decision_provenance:** `direct_operator_message`
- **decision_date:** 2026-07-12

---

## 2. Architecture levels completed (docs-only)

| Level | Scope | Status |
|-------|-------|--------|
| **L0** | Existing contract — We/46 webhook design; wf47 getUpdates polling; no concurrent webhook+polling on same bot | **Completed docs-only** |
| **L1** | Option analysis — wf47 polling-first; Tailscale Funnel; Cloudflare Tunnel; VPS+DNS+cert; keep We/46 backlog | **Completed docs-only** |
| **L2** | Architecture selection — wf47 polling-first primary; We/46 deprecated as primary path; retained inactive webhook fallback | **Completed docs-only** |
| **L3** | Implementation — callback_query parsing verification; answerCallbackQuery design | **Pending separate Decision Packet** |
| **L4** | Bounded runtime test | **Pending separate Decision Packet** |
| **L5** | Live activation | **Pending separate Decision Packet** |

**No shortcut** from this task to L3/L4/L5.

---

## 3. L0 contract (recorded)

- **We/46** is a Telegram Trigger webhook design for `callback_query` / `message`.
- Previous live attempt failed because Telegram required an **HTTPS webhook**.
- Credential, bot token, allowed chat and store configuration remain **UI-only**.
- We/46 has **no live PASS** and is **inactive**.
- **wf47** already uses `getUpdates` polling without public HTTPS and supports structured callback text plus plain options.
- Telegram webhook and polling **must not** be operated concurrently on the same bot.

---

## 4. L1 options considered (concise)

1. **wf47 polling-first** — reuse validated polling assets; no public exposure.
2. **Tailscale Funnel webhook** — public HTTPS via Funnel; operational complexity.
3. **Cloudflare Tunnel** — public HTTPS via tunnel; DNS/tunnel management.
4. **VPS + public DNS + reverse proxy + certificate** — full public stack.
5. **Keep We/46 in backlog** — defer architecture choice.

---

## 5. L2 selected architecture

- **wf47 polling-first** is the **primary inbound architecture** for message + `callback_query`.
- **callback_query** handling must be **confirmed/completed in L3**.
- **answerCallbackQuery** must be designed in L3, or degraded Telegram button UX must be explicitly accepted in a future Decision Packet.
- **We/46** is **deprecated only as the primary path** — template/history retained as **inactive webhook fallback**.
- The **HTTPS blocker is bypassed on the critical path**, not falsely marked technically solved.
- Reopening the webhook fallback requires a **new Decision Packet**.

**Selection rationale:** no public exposure; reuse of existing validated polling assets; lower operational complexity.

---

## 6. We/46 disposition

| Field | Value |
|-------|--------|
| **we46_primary_path_status** | `DEPRECATED_AS_PRIMARY_PATH` |
| **we46_template_status** | `RETAINED_INACTIVE_WEBHOOK_FALLBACK` |
| **we46_live_pass** | `false` |
| **we46_https_blocker_status** | `BLOCKED_PENDING_IF_FALLBACK_REOPENED` |

Historical package-prep and failed-attempt evidence **preserved** — not erased.

---

## 7. wf47 disposition

| Field | Value |
|-------|--------|
| **wf47_callback_query_target** | `SELECTED_PENDING_L3` |
| **answer_callback_query_status** | `PENDING_L3_DESIGN` |
| **l3_implementation_authorized** | `false` |

**Not claimed:** callback button end-to-end PASS.

---

## 8. What did NOT happen

- No L3 implementation · no L4 bounded test · no L5 live activation
- No n8n edits/import/export · no workflow JSON changes
- No Telegram runtime · no webhook registration/deletion
- No DNS, certificates, Funnel or Cloudflare · no VPS/runtime configuration
- **`runtime_executed=false`** · **`workflow_modified=false`** · **`telegram_sent=false`** · **`webhook_modified=false`**

---

## 9. Residuals (unchanged invariants)

| Item | Status |
|------|--------|
| **Gate E** | `OPERATOR_DECISION_PENDING` |
| **D-0045-E** | Latest scope-limited runtime PASS |
| **wf45→wf47→callable-wf48 chain** | Fresh official chain **not attested** |
| **`enable_wg48_handoff`** | `false` |
| **PM-34** | **BLOCKED** |
| **`n8n_ready`** | `false` |
| **wf40/42** | Active unchanged · **wf41** off |

---

## 10. Canonical references

- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/workflow-we-telegram-interactive-decision-buttons.md`
- `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md`
