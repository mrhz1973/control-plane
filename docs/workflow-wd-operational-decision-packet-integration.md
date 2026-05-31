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
