# Wf runbook — Telegram inbound polling / getUpdates

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wf-telegram-inbound-polling-getupdates.md`  
**Status:** Ready-import Data Table template **PREP** (Git). Prior hardened validation **PARTIAL/BLOCKED** on staticData. Safe repeated use **not** PASS until Data Table gate validated. No schedule. No inbound automation.

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
| **State / offset persistence** | Test-only Data Table **`wf47_polling_state_test`** rows: `last_update_id`, `last_handled_update_id`, `handled_keys_json`. Template loads/upserts via Data Table nodes (repo pattern from wf42 / v4 multirepo draft). **No** `staticData` for persistence. |
| **Allowed-chat guard** | **Set Wf47 UI config** node field `allowed_chat_id` — edit in n8n Set UI only (placeholder `**CONFIGURE_ALLOWED_CHAT_ID_IN_N8N_UI**`). No Code-node edits required. Rejection: `allowed_chat_not_configured`. |
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
| Wf hardened validation (staticData) | **PARTIAL/BLOCKED** — duplicate not blocked on second poll |
| Wf47 Data Table ready-import prep | Template in Git with Data Table nodes; **no runtime** from prep task |
| n8n Data Table (human-created) | **`wf47_polling_state_test`** with seed rows `last_update_id=0`, `last_handled_update_id=0`, `handled_keys_json={}` |
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

## 8. Ready-import path (no manual Code edits)

**Deprecated:** editing multiple Code nodes by hand for allowed chat / offset.

**Correct path:**

1. Ensure n8n Data Table **`wf47_polling_state_test`** exists with seed rows (see Preconditions).
2. **Delete or deactivate** any duplicate old workflow 47 in n8n before re-import (avoid two workflows polling the same bot state).
3. **Import once:** `workflows/wf-telegram-inbound-polling-getupdates.template.json` — keep **inactive/off**.
4. In n8n UI only:
   - **Set Wf47 UI config** → replace `allowed_chat_id` placeholder (not Code nodes).
   - **HTTP Request - getUpdates** → token URL placeholder.
5. **Manual validation gate** (not yet PASS in frontier):
   - Run 1: expect `accepted` for valid TEST ONLY update.
   - Run 2 (no new Telegram message): expect `duplicate_or_stale: true` with `block_reason` `duplicate_or_double_click` or `stale_old_update_id` — **must NOT** repeat `accepted` for same `update_id`.

Data Table node schema inferred from repo: `workflows/42-diff-summary-mvp.template.json` (get by key), `workflows/exports/2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json` (`returnAll` load, `upsert` by `key`).

---

## 9. Requirement before repeated use PASS

1. **Persistent store:** `wf47_polling_state_test` only (TEST ONLY — not `control_plane_state` production path unless separately gated).
2. Second manual poll blocks duplicate/stale per inspect contract.
3. No Schedule without explicit gate.
4. No production Data Table / PM-34 / wf40/41 from this workflow.

Prior `staticData` template path: **not validated** — superseded by Data Table ready-import template in Git.

---

## 10. PASS criteria (Data Table manual validation gate)

- First poll: accepted TEST ONLY decision as today.
- Second poll (no new message): blocked with `duplicate_or_stale: true` and explicit `block_reason`.
- No secrets; workflow inactive/off unless separately documented.

---

## 11. BLOCKED criteria

- Real `chat_id` / token committed to Git.
- Schedule activated without explicit gate.
- Missing stale or duplicate guards.
- PM-34, wf40/41, production Data Table, or GitHub touched.

---

## 12. Related files

- Template: `workflows/wf-telegram-inbound-polling-getupdates.template.json`
- Registration (live): `docs/runtime/WF_TELEGRAM_INBOUND_POLLING_REGISTRATION_PROMPT.md`
- We (webhook): `docs/workflow-we-telegram-interactive-decision-buttons.md`
