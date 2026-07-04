# Wd runbook — operational-style Decision Packet integration (gate B live)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wd-operational-decision-packet-integration.md`  
**Status:** Package preparation only. This document does not execute anything.

---

## 1. Scope

Wd validates **one manual n8n run**: sanitized event → **classifier-server** `/classify` → **operational-style** Decision Packet Telegram message (**TEST ONLY**).

**Not** PM-34. **Not** operational automation activation. **Not** the automated full chain.

---

## 2. Preconditions

| Precondition | State |
|--------------|--------|
| Wb-live classifier-server manual execution | **PASS ATTESTATO UTENTE** |
| Wc HTML formatting live | **PASS ATTESTATO UTENTE** |
| classifier-server reachable from n8n (Tailscale) | User starts on Ryzen when ready |
| Telegram credential in n8n | **CONTROL PLANE - Telegram Bot** (UI only) |

---

## 3. Boundary

This package does not execute, import, call classifier-server, or send Telegram. **User runs gate B live later.**

---

## 4. Gate B live steps

1. Import `workflows/wd-operational-decision-packet-integration-manual.template.json` as **workflow 45** (name in template).
2. Keep workflow **inactive/off**.
3. Configure **CONFIGURE_CLASSIFIER_SERVER_URL_IN_N8N_UI** (base URL + `/classify`) in HTTP node — UI only, no Tailscale IP in Git.
4. Configure Telegram credential and **CONFIGURE_CHAT_ID_IN_N8N_UI** — UI only.
5. Run **Manual Trigger once**.
6. Verify:
   - classifier-server HTTP success and schema-valid 5-field output;
   - one Telegram message with **TEST ONLY / OPERATIONAL-STYLE VALIDATION**;
   - `event_id`, `human_gate`, `requires_human` literal with underscores;
   - ID **D-9998-T**;
   - **Scrivi: 1 / 2 / 3**;
   - workflow still **inactive/off** after run.
7. Confirm: no workflow 40/41 mutation; no Data Table mutation; no GitHub write; no PM-34 touch.

Test event reference: `docs/runtime/test-events/wd-operational-decision-packet-test-event.json`.

---

## 5. PASS criteria (B live)

- Classifier-server returns HTTP 200 with valid `risk`, `route`, `reason`, `confidence`, `requires_human`.
- One Telegram message sent; matches `DECISION_PACKET_FORMAT.md` structure.
- TEST ONLY banner present; no secrets in message or n8n output.
- Workflow remains inactive/off.

---

## 6. BLOCKED criteria

- Classifier-server unreachable or non-200 / invalid JSON / fallback errors.
- Telegram send fails or message malformed.
- Sensitive info in output.
- Workflow becomes active unexpectedly.
- Workflow 40/41 touched; PM-34 touched; Data Table or GitHub write.

---

## 7. Evidence to collect

- Final node JSON (sanitize).
- Sanitized Telegram message text.
- Workflow active/inactive after run.
- A/B boundary confirmations (40/41, Data Table, GitHub, PM-34).

---

## 8. Registration

Use `docs/runtime/WD_OPERATIONAL_DECISION_PACKET_REGISTRATION_PROMPT.md` after B live.

---

## 9. Shared decision store — OPEN ON SEND (Gate 2 template no-runtime)

**Status:** **IMPLEMENTATION READY / PASS** (template + docs only, 2026-06-01). **No runtime.** Design: [decision-store-shared-open-close-design.md](decision-store-shared-open-close-design.md).

Wd now **prepares and upserts an `open` row** on the shared store **`control_plane_decisions_test`** (Data Table by name) **before** the Telegram send. It does **not** touch `control_plane_state` or any production table.

**New nodes (after Build Operational Decision Packet):**

| Node | Role |
|------|------|
| **Data Table - Load shared decisions** | `get` rows from `control_plane_decisions_test` (returnAll, alwaysOutputData) |
| **Collapse load fan-out (1 item per run)** | Collapses N load items to **1 gate item** per run (GE-01 fix-forward) |
| **Prepare shared decision open row** | Build open row; compute `open_action` (`insert` / `noop` / `reopen_nonclosed` / `blocked`) and `open_allowed`; **`runOnceForAllItems`** — emits 1 item |
| **IF shared decision open allowed** | true → upsert + send; false → straight to Inspect (no send) |
| **Data Table - Upsert shared decision open** | Upsert `open` keyed on `decision_id`; then Telegram send |

**Idempotency / block:**

| Existing row | open_action | Send? |
|--------------|-------------|-------|
| missing | `insert` | yes |
| `open` | `noop` (touch `updated_at`) | yes |
| `closed` | `blocked` / `block_reason: duplicate_open_attempt` | **no** (no reopen, no send) |

**Columns written:** `decision_id`, `status=open`, `selected_option=""`, `created_at`, `closed_at=""`, `update_id=""`, `note_preview=""`, `source=TEST ONLY`, `updated_at`, `created_by=wd`, `source_workflow`, `packet_kind`. No `chat_id`, token, or message body.

**Inspect send result (read-only)** runs on both IF branches and reports `open_action` / `block_reason`; it only claims `telegram_send_ok` when the Telegram node actually ran. After GE-01 fix-forward: **`runOnceForAllItems`** — max **1 audit item** per run; blocked path sets `send_suppressed=true`, `pass_claimed=false`; `http_status` is classifier-only and must not be read as send PASS.

**Fan-out (GE-01 STOP — 2026-07-04):** Pre-fix, Load (`returnAll`) × Prepare (`runOnceForEachItem`) multiplied items (~6) on `duplicate_open_attempt` for closed `D-1003-T`; Telegram received = 0 (IF false) but Inspect emitted 6 identical audit records. Repo fix: Collapse node + Prepare/Inspect `runOnceForAllItems`. Session: [`2026-07-04-control-plane-gate-e-ge01-stop-fanout-fix-forward.md`](sessions/2026-07-04-control-plane-gate-e-ge01-stop-fanout-fix-forward.md). Live import = separate gated step.

**Risk `open_without_send`:** the open row is upserted **before** the Telegram send, so a send failure can leave a row `open` without a delivered packet. This is a **named risk verified at Gate 3 runtime (user-attested)**, not in this template gate.

**Boundaries:** `active: false` · `CONFIGURE_*` placeholders kept · no `data-tables/**` · no CSV seed · no table creation in repo (operator creates `control_plane_decisions_test` in n8n UI) · no `control_plane_state` · no wf40/41/42 · no PM-34 · no Schedule/Telegram Trigger/webhook · no secrets.

---

## 10. Gate 3 runtime PASS — Wd open-on-send (2026-06-02)

**Status:** **PASS ATTESTATO UTENTE**. Session: [2026-06-02-control-plane-decision-store-gate3-runtime-pass.md](sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md).

**45 - Wd / Inspect send result:**

| Field | Value |
|-------|-------|
| telegram_send_ok | true |
| message_id | 732 |
| http_status | 200 |
| decision_id | D-9998-T |
| open_action | insert |
| block_reason | null |
| test_only | true |

Wd wrote **open** on `control_plane_decisions_test` (`created_at: 2026-06-02T00:46:44.236Z`) before the Telegram reply was accepted by **47 - Wf**. Risk `open_without_send` **not observed** (`open_action: insert` + `telegram_send_ok: true`).

**Not** permanent operational automation. Temporary classifier routing (Ryzen + reverse SSH tunnel + VPS bridge) used for Gate 3 evidence only.
