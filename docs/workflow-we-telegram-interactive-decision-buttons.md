# We runbook — Telegram interactive decision buttons (inbound)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-we-telegram-interactive-decision-buttons.md`  
**Status:** **DEPRECATED AS PRIMARY INBOUND PATH** (D-0049-W Opzione 1, 2026-07-12). Retained **inactive** as **ALTERNATIVE WEBHOOK PLAN B**. Package preparation only. No inbound activation. No runtime.

> **Architecture disposition (D-0049-W):** We/46 is **no longer the primary inbound path**. wf47 polling-first is selected. This runbook and template remain as **inactive webhook fallback** — not deleted. **We live PASS remains false.** The HTTPS webhook blocker remains relevant **only if this fallback is explicitly reopened** via a new Decision Packet. No template or runtime change occurred in D-0049-W. Historical package-prep and failed-attempt evidence preserved.

---

## 1. Scope

We prepares **inbound** Telegram handling for Decision Packet responses:

- inline buttons **1 / 2 / 3** via `callback_data` (`dp:D-9998-T:1` … `:3`);
- **decision_id** correlation (`D-NNNN-X`);
- duplicate / stale / double-click guard;
- optional free-text **note** path (design placeholder only);
- sanitized JSON receipt for inspection.

**Not** PM-34. **Not** operational automation. **Not** the automated full chain. **Not** active inbound today. **Not** a production workflow.

Until We live is recorded, Wd-validated replies `1`, `2`, `3` in plain Telegram chat remain **non-operative**.

---

## 2. Preconditions

| Precondition | State |
|--------------|--------|
| Wd B live operational-style integration | **PASS ATTESTATO UTENTE** |
| Telegram credential in n8n | **CONTROL PLANE - Telegram Bot** (UI only) |
| Template | `workflows/we-telegram-interactive-decision-buttons.template.json` |

---

## 3. callback_data model

| Pattern | Example |
|---------|---------|
| Button | `dp:D-9998-T:1` |
| Button | `dp:D-9998-T:2` |
| Button | `dp:D-9998-T:3` |
| Note (placeholder) | `note:D-9998-T:<text>` |

---

## 4. Future We live steps

1. Import template as **workflow 46**; keep **inactive/off** until deliberately testing.
2. Configure in n8n UI only:
   - **CONFIGURE_TELEGRAM_CREDENTIAL_IN_N8N_UI**
   - **CONFIGURE_ALLOWED_CHAT_ID_IN_N8N_UI**
   - **CONFIGURE_DECISION_STATE_STORE_IN_N8N_UI** (placeholder; no real table id in Git) — Gate 2: resolves to the shared decision store **`control_plane_decisions_test`** (Data Table by name; same store Wd opens and Wg closes). We template itself is **not** modified at Gate 2; this is documentation only, no runtime. See [decision-store-shared-open-close-design.md](decision-store-shared-open-close-design.md).
3. Send a TEST ONLY Decision Packet with inline buttons (from Wd path or manual test).
4. Click one button; verify sanitized receipt at **Inspect inbound result**.
5. Confirm boundaries: no PM-34; no wf40/41 mutation; no GitHub write; Data Table only if explicitly configured as test-only store.

**Activation gate:** Telegram Trigger may require **temporary workflow activation** in n8n to receive callbacks. That activation is a **separate real runtime step** — perform one step at a time and record evidence.

---

## 5. PASS criteria (future live)

- Inbound callback received and parsed.
- `decision_id` and option `1`/`2`/`3` extracted.
- Duplicate/stale guard represented in output.
- Sanitized receipt JSON; no secrets.
- Workflow inactive/off after test **or** activation gate explicitly documented.

---

## 6. BLOCKED criteria

- Trigger cannot be tested while inactive (document blocker).
- Malformed `callback_data`.
- Missing duplicate/stale guard.
- Sensitive data in output.
- Unexpected workflow activation side effects.
- wf40/41, PM-34, production Data Table, or GitHub touched.

---

## 7. Evidence to collect

- Sanitized inspect node JSON.
- Callback summary (no raw `chat_id` in git).
- Workflow active/inactive state.
- Boundary confirmations.

---

## 8. Registration

`docs/runtime/WE_TELEGRAM_INTERACTIVE_BUTTONS_REGISTRATION_PROMPT.md`
