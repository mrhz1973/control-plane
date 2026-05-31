# Wf runbook — Telegram inbound polling / getUpdates

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wf-telegram-inbound-polling-getupdates.md`  
**Status:** Hardened manual validation **PARTIAL/BLOCKED**. Safe repeated use **not** PASS. No schedule. No inbound automation.

---

## 1. Scope

Wf provides **inbound** Telegram Decision Packet response handling through **polling / getUpdates**, avoiding a **public HTTPS webhook**.

After **Wf live PASS** (manual workflow 47, one-shot `getUpdates`), this runbook and template describe **safe repeated use** design — not operational activation.

**Not** PM-34. **Not** operational automation. **Not** the automated full chain. **Not** persistent inbound automation. **Not** a public webhook. **Not** a Schedule Trigger in Git.

---

## 2. Historical facts (Wf live PASS)

| Fact | State |
|------|--------|
| Workflow 47 imported manually | `47 - Wf Telegram Inbound Polling getUpdates TEST ONLY - TEMPLATE` |
| Workflow active | **inactive/off** throughout test |
| getUpdates | HTTP **200**, `body.ok=true` |
| Test response | `dp:D-9998-T:1` |
| Sanitized receipt | `inspect_status: accepted`, `decision_id: D-9998-T`, `selected_option: 1` |
| Boundaries | No public webhook; no Telegram Trigger; no schedule; no PM-34; no wf40/41 mutation; no GitHub write by workflow; no secrets/raw chat_id/user_id in Git |

Token was configured **only in n8n UI** (HTTP URL corrected there). n8n tunnel was closed after test.

---

## 3. Why polling (context)

**We live** remains **BLOCKED/PENDING** on HTTPS webhook. **Wf live PASS** proved manual `getUpdates` works without public HTTPS. Hardening prepares **repeatable** manual polls before any schedule or production store.

---

## 4. Hardening target before repeated use

| Area | Design |
|------|--------|
| **State / offset persistence** | `lastUpdateId` = next `getUpdates` offset; `lastHandledUpdateId` = highest fully processed `update_id`; demo uses workflow `staticData` only — replace with **CONFIGURE_OFFSET_STORE_IN_N8N_UI** at live gate. |
| **Allowed-chat guard** | Defaults **closed** until **CONFIGURE_ALLOWED_CHAT_ID_IN_N8N_UI** is replaced in n8n UI (no raw `chat_id` in Git). Rejection: `allowed_chat_not_configured`. |
| **Stale / old update** | Reject when `update_id <= lastHandledUpdateId` → `stale_old_update_id`. |
| **Duplicate / double-click** | Key: `decision_id` + `selected_option` or `note` + `update_id` in `handledKeys`. Rejection: `duplicate_or_double_click`. |
| **Open decision correlation** | TEST ONLY list `D-9998-T` only; unknown id → `stale_or_unknown_decision_id`. |
| **Sanitized receipt contract** | `inspect_status`, `decision_id`, `selected_option`, `update_id`, `duplicate_or_stale`, `note_present`, `block_reason`, `offset_after_placeholder`, `test_only` — no raw `chat_id`, `user_id`, or full message body. |
| **Schedule** | **No** persistent Schedule in template. Any schedule = separate runtime/security gate. |
| **deleteWebhook** | Separate gate if bot still has webhook; never automated from template. |

---

## 5. Preconditions

| Precondition | State |
|--------------|--------|
| Wf live (first manual poll) | **PASS ATTESTATO UTENTE** |
| Wf hardening prep | Template + runbook updated in Git; **no runtime** from prep task |
| We live | **BLOCKED/PENDING** (HTTPS webhook) |
| Template | `workflows/wf-telegram-inbound-polling-getupdates.template.json` (workflow **47**) |

---

## 6. Response formats

| Kind | Example |
|------|---------|
| Callback / structured | `dp:D-9998-T:1`, `dp:D-9998-T:2`, `dp:D-9998-T:3` |
| Plain option (single open decision) | `1`, `2`, `3` |
| Note (design only) | `note:D-9998-T:<text>` — preview bounded in template; cannot change selected option |

---

## 7. Hardened manual validation — actual result (PARTIAL/BLOCKED)

**Recorded:** 2026-05-31. Workflow **47** inactive/off. Token and allowed chat configured in n8n UI only.

| Run | Result |
|-----|--------|
| **First** manual poll | **PASS (parse/accept)** — `inspect_status: accepted`, `decision_id: D-9998-T`, `selected_option: 1`, `duplicate_or_stale: false`, `allowed_chat_configured: true` |
| **Second** manual poll (no new Telegram message) | **BLOCKED (duplicate/stale)** — same receipt as first run: again `accepted` with same `update_id`; `duplicate_or_stale: false`; guards did not block replay |

**Conclusion:** Manual `getUpdates` with token + allowed chat can parse and accept a valid TEST ONLY response. **Duplicate/stale persistence is NOT validated.** Same update was accepted twice. Demo workflow `staticData` / placeholder offset store is **insufficient or not reliable** for repeated manual inactive executions.

**Safe repeated use:** **NOT PASS.** Do not mark operational or repeated polling ready.

Sanitized receipts (no secrets):

```json
[
  {
    "inspect_status": "accepted",
    "decision_id": "D-9998-T",
    "selected_option": "1",
    "update_id": 986228558,
    "duplicate_or_stale": false,
    "note_present": false,
    "block_reason": null,
    "allowed_chat_configured": true,
    "offset_after_placeholder": 986228559,
    "test_only": true
  }
]
```

(Second run produced identical sanitized output.)

---

## 8. Requirement before repeated use

Before any “safe repeated use” PASS:

1. Choose a **deliberate persistent state store** for offset + idempotency — e.g. test-only n8n Data Table or other approved store, configured **only in n8n UI** (no table id, token, or raw `chat_id` in Git).
2. Validate in a **separate** manual gate: second poll without new message must yield `duplicate_or_double_click` or `stale_old_update_id` (or equivalent blocked receipt).
3. No persistent Schedule without explicit runtime/security gate.
4. Production Data Table activation is **not** prescribed here unless separately gated.

Workflow `staticData` in the template remains **demo-only** and was **not validated** for cross-execution persistence.

---

## 9. PASS criteria (future — persistent store gate)

- First poll: accepted TEST ONLY decision as today.
- Second poll (no new message): blocked with `duplicate_or_stale: true` and explicit `block_reason`.
- No secrets; workflow inactive/off unless separately documented.

---

## 10. BLOCKED criteria

- Real `chat_id` / token committed to Git.
- Schedule activated without explicit gate.
- Missing stale or duplicate guards.
- PM-34, wf40/41, production Data Table, or GitHub touched.

---

## 11. Related files

- Template: `workflows/wf-telegram-inbound-polling-getupdates.template.json`
- Registration (live): `docs/runtime/WF_TELEGRAM_INBOUND_POLLING_REGISTRATION_PROMPT.md`
- We (webhook): `docs/workflow-we-telegram-interactive-decision-buttons.md`
