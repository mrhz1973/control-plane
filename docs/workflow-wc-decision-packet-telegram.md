# Wc runbook — Decision Packet Telegram automatic/cablato

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wc-decision-packet-telegram.md`  
**Status:** Manual runbook — **package preparation only**. This document does not execute anything.

---

## 1. Scope

Wc validates the **automatic/cablato** path inside one manual n8n workflow:

classifier-style event/output → Decision Packet formatted text → Telegram Send Message.

The user performs physical import, configuration, and a **single manual execution** later. This package only prepares importable artifacts.

**Boundary:** this package does not execute, import into n8n, send Telegram, activate workflows, or unlock PM-34.

---

## 2. Preconditions

| Precondition | State required |
|--------------|----------------|
| Wb-live manual classifier-server execution | **PASS ATTESTATO UTENTE** |
| `DECISION_PACKET_FORMAT.md` (Wb-docs) | **PASS** |
| Telegram base | **ATTIVO** |
| n8n credential (UI only) | Name: **CONTROL PLANE - Telegram Bot** — token stored only in n8n |

---

## 3. Explicit boundary

- **Not** PM-34.
- **Not** the automated full chain.
- **Not** a real operational Decision Packet (test ID `D-9999-T`, TEST ONLY banner).
- **Not** workflow 40 or workflow 41.
- **Not** Data Table mutation or GitHub write.

---

## 4. n8n import guidance

1. Import `workflows/wc-decision-packet-telegram-automatic-cabled.template.json` **manually** in the n8n UI.
2. Keep the workflow **inactive** (`active: false` in template).
3. Configure Telegram credential in n8n UI only — replace placeholder **CONFIGURE_TELEGRAM_CREDENTIAL_IN_N8N_UI** / bind **CONTROL PLANE - Telegram Bot**.
4. Configure `chat_id` in the Telegram node UI only — replace **CONFIGURE_CHAT_ID_IN_N8N_UI**.
5. Run **Manual Trigger once**. Do not activate. Do not schedule. No Webhook.

Test payload reference: `docs/runtime/test-events/wc-decision-packet-telegram-test-event.json`.

---

## 5. Expected Telegram message

One message containing a Decision Packet per `docs/foundation/DECISION_PACKET_FORMAT.md`:

- **TEST ONLY / TEMPLATE VALIDATION** banner
- ID `D-9999-T`, Kind `runtime`
- Classifier fields: `risk=medium`, `route=human_gate`, `confidence=high`, `requires_human=true`
- 2–5 numbered options
- Explicit recommendation
- **Scrivi: 1 / 2 / 3** (or equivalent)
- **Cosa NON viene fatto** section

---

## 6. PASS criteria (future physical run)

- Workflow remains **inactive** after the manual run.
- **One** Telegram message sent.
- Message is a Decision Packet matching `DECISION_PACKET_FORMAT.md`.
- Message contains 2–5 numbered options and **Scrivi: 1 / 2 / 3** (or equivalent).
- Message marked **TEST ONLY**.
- No secrets / token / `chat_id` / credential id / webhook / API key / chain-of-thought in message or n8n output.
- No workflow 40 / 41 mutation or execution.
- No Data Table mutation.
- No GitHub write.
- No PM-34 unlock.
- No automated full chain execution.

---

## 7. BLOCKED criteria

- Workflow becomes active unexpectedly.
- Telegram credential missing or misconfigured.
- `chat_id` missing.
- Telegram send fails.
- Message malformed or missing required sections.
- Sensitive info appears in message or execution output.
- Workflow 40 / 41 touched.
- PM-34 touched.
- Data Table or GitHub write attempted.

---

## 8. Evidence to collect

- n8n execution status (success/failure).
- Workflow active/inactive state **after** run.
- Sanitized Telegram message text (or screenshot transcription — redact any sensitive UI).
- Confirmation: no workflow 40 / 41 mutation.
- Confirmation: no PM-34 unlock/touch.
- Confirmation: no Data Table mutation / GitHub write.

---

## 9. Next step after execution

Use **`docs/runtime/WC_DECISION_PACKET_TELEGRAM_REGISTRATION_PROMPT.md`** to record **PASS** or **BLOCKED** based on sanitized evidence.
