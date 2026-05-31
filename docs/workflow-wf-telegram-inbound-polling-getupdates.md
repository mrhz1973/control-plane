# Wf runbook — Telegram inbound polling / getUpdates

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wf-telegram-inbound-polling-getupdates.md`  
**Status:** Post-live-PASS hardening prep. No schedule. No inbound automation. No runtime from this doc alone.

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

## 7. Next gate — hardened path manual validation (one step)

1. Re-import or refresh workflow **47** from hardened template; keep **inactive/off**.
2. In n8n UI only: token/credential, replace **CONFIGURE_ALLOWED_CHAT_ID_IN_N8N_UI** in filter node, confirm offset store placeholder.
3. Run **one** Manual Trigger poll; verify receipt and guards (`allowed_chat_not_configured` if chat not set; `stale_old_update_id` on replay; `duplicate_or_double_click` on repeat).
4. Record evidence in docs (separate registration task). No schedule. No PM-34.

---

## 8. PASS criteria (hardened manual validation)

- Guards visible in sanitized receipt (`block_reason` when blocked).
- Repeat poll does not double-accept same `update_id` + decision + option.
- Stale/old `update_id` rejected when already handled.
- No secrets; workflow inactive/off.

---

## 9. BLOCKED criteria

- Real `chat_id` / token committed to Git.
- Schedule activated without explicit gate.
- Missing stale or duplicate guards.
- PM-34, wf40/41, production Data Table, or GitHub touched.

---

## 10. Related files

- Template: `workflows/wf-telegram-inbound-polling-getupdates.template.json`
- Registration (live): `docs/runtime/WF_TELEGRAM_INBOUND_POLLING_REGISTRATION_PROMPT.md`
- We (webhook): `docs/workflow-we-telegram-interactive-decision-buttons.md`
