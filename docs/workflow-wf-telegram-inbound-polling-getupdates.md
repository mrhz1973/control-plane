# Wf runbook — Telegram inbound polling / getUpdates

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wf-telegram-inbound-polling-getupdates.md`  
**Status:** Package preparation only. No inbound activation. No runtime.

---

## 1. Scope

Wf prepares **inbound** Telegram Decision Packet response handling through **polling / getUpdates**, avoiding a **public HTTPS webhook** requirement.

Covers:

- Telegram Bot API `getUpdates` concept (manual trigger in template);
- `update_id` offset placeholder;
- allowed chat/user filter placeholder;
- `decision_id` correlation (`D-NNNN-X`, e.g. `D-9998-T` for TEST ONLY);
- option **1 / 2 / 3** parsing (plain text or `callback_data`);
- duplicate / stale / idempotency guard;
- optional free-text **note** design (`note:D-9998-T:<text>` — placeholder only);
- sanitized polling receipt JSON.

**Not** PM-34. **Not** operational automation activation. **Not** the automated full chain. **Not** inbound active now. **Not** a production workflow. **Not** a public webhook.

---

## 2. Why

We live is **BLOCKED/PENDING** because the Telegram Trigger requires an **HTTPS webhook URL**, while current n8n access is via **local tunnel / `http://localhost:5678`** (no public HTTPS). Wf documents the **polling/getUpdates** alternative for a future live gate.

---

## 3. Preconditions

| Precondition | State |
|--------------|--------|
| Wd B live operational-style integration | **PASS ATTESTATO UTENTE** |
| We package | **PREP PASS** |
| We live | **BLOCKED/PENDING** (HTTPS webhook) |
| Template | `workflows/wf-telegram-inbound-polling-getupdates.template.json` (workflow **47**) |

Telegram credential/token exists only in **n8n UI / credential storage**. Import workflow 47 only when running the future Wf live gate.

---

## 4. Response formats

| Kind | Example |
|------|---------|
| Callback / structured | `dp:D-9998-T:1`, `dp:D-9998-T:2`, `dp:D-9998-T:3` |
| Plain option (open decision) | `1`, `2`, `3` (when tied to latest open `decision_id` placeholder) |
| Note (design only) | `note:D-9998-T:<text>` — bounded/sanitized preview; cannot change selected option |

---

## 5. Future Wf live steps

1. Import template as **workflow 47**; keep **inactive/off**.
2. Configure in n8n UI only:
   - **CONFIGURE_TELEGRAM_BOT_TOKEN_IN_N8N_UI_OR_CREDENTIAL**
   - **CONFIGURE_ALLOWED_CHAT_ID_IN_N8N_UI**
   - **CONFIGURE_OFFSET_STORE_IN_N8N_UI** (test-only placeholder)
   - **CONFIGURE_DECISION_STATE_STORE_IN_N8N_UI** (test-only placeholder)
3. If a webhook is already set on the bot, **deleteWebhook** is required before reliable `getUpdates` — that is a **separate runtime/security gate**; do not automate from this package.
4. Run **one manual** polling execution (Manual Trigger).
5. Send or click one test Decision Packet response if needed.
6. Verify sanitized receipt at **Inspect polling result (read-only)**.
7. Confirm boundaries: no PM-34; no wf40/41 mutation; no production Data Table mutation; no GitHub write; no secrets in output.

**Note:** Telegram Bot API `getUpdates` generally **conflicts** with an active webhook. Deleting an existing webhook must be done deliberately, one step at a time, outside this template.

---

## 6. PASS criteria (future live)

- `getUpdates` returns a sanitized test update (or empty result documented).
- `decision_id` parsed.
- Option **1 / 2 / 3** parsed when applicable.
- Offset / dedupe guard represented in output.
- Duplicate / stale guard represented.
- Sanitized receipt produced; no token; no raw `chat_id` / `user_id`.
- Workflow inactive/off (or schedule activation gate explicitly documented).

---

## 7. BLOCKED criteria

- Token/credential cannot be configured safely.
- `getUpdates` blocked because webhook still set and must be deleted (document blocker).
- Malformed response.
- Duplicate/stale guard missing.
- Sensitive data in output.
- Workflow becomes unexpectedly active.
- PM-34, wf40/41, production Data Table, or GitHub touched.

---

## 8. Evidence to collect

- Sanitized **Inspect polling result** JSON.
- Confirmation: no token in execution output.
- No raw `chat_id` / `user_id`.
- Workflow **active/off** status screenshot or attestation.
- Boundary confirmations (no PM-34, no wf40/41, no production Data Table, no GitHub write).

---

## 9. Related files

- Template: `workflows/wf-telegram-inbound-polling-getupdates.template.json`
- Registration: `docs/runtime/WF_TELEGRAM_INBOUND_POLLING_REGISTRATION_PROMPT.md`
- We (webhook path): `docs/workflow-we-telegram-interactive-decision-buttons.md`
