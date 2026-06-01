# Wf runbook — Telegram inbound polling / getUpdates

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wf-telegram-inbound-polling-getupdates.md`  
**Status:** Wf47 Data Table manual validation **PASS ATTESTATO UTENTE**. Live getUpdates + 47→48 handoff **PASS ATTESTATO UTENTE**. **Disabled Schedule Trigger** versioned in template (Phase 1 ready; **not** activated). **Not** operational automation.

---

## 1. Scope

Wf provides **inbound** Telegram Decision Packet response handling through **polling / getUpdates**, avoiding a **public HTTPS webhook**.

After **Wf live PASS** (manual workflow 47, one-shot `getUpdates`), this runbook and template describe **safe repeated use** design — not operational activation.

**Not** PM-34. **Not** operational automation. **Not** the automated full chain. **Not** persistent inbound automation. **Not** a public webhook. **Not** a Telegram Trigger.

**Triggers (template):** Manual Trigger + **Schedule Trigger - TEST ONLY DISABLED** (`disabled: true`, workflow `active: false`). Schedule is versioned but **not** activated until Phase 2 runtime gate.

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
| **Schedule** | **Schedule Trigger - TEST ONLY DISABLED** in template (`every 1 minute`, `disabled: true`, workflow `active: false`). Phase 2 runtime gate required before any schedule run. |
| **deleteWebhook** | Separate gate if bot still has webhook; never automated from template. |

---

## 5. Preconditions

| Precondition | State |
|--------------|--------|
| Wf live (first manual poll) | **PASS ATTESTATO UTENTE** |
| Wf hardening prep | Template + runbook updated in Git; **no runtime** from prep task |
| Wf hardened validation (staticData) | **PARTIAL/BLOCKED** — duplicate not blocked on second poll |
| Wf47 Data Table ready-import prep | Template in Git with Data Table nodes; **no runtime** from prep task |
| Wf47 Data Table manual validation | **PASS ATTESTATO UTENTE** (poll 1 accept + poll 2 no re-accept) |
| n8n Data Table (human-created) | **`wf47_polling_state_test`** — columns: `key`, `value`, `updated_at`, `note` (note added before successful rerun) |
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
5. **Data Table schema:** table must include columns **`key`, `value`, `updated_at`, `note`**. Initial run failed on upsert with `unknown column name 'note'` until human added `note` to test-only table.

Data Table node schema inferred from repo: `workflows/42-diff-summary-mvp.template.json` (get by key), `workflows/exports/2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json` (`returnAll` load, `upsert` by `key`).

---

## 9. Wf47 Data Table manual validation — actual result (PASS)

**Recorded:** 2026-05-31. Ready-import template; token + `allowed_chat_id` in Set/HTTP UI only; workflow **47** manual/inactive/off.

| Run | Result |
|-----|--------|
| **Poll 1** (after `dp:D-9998-T:1` sent) | **PASS** — `inspect_status: accepted`, `decision_id: D-9998-T`, `selected_option: 1`, `update_id: 986228559`, `offset_after_placeholder: 986228560`, `last_handled_update_id: 0` (before persist visible in receipt) |
| **Poll 2** (no new Telegram message) | **PASS (no re-accept)** — `inspect_status: blocked`, `block_reason: no_parseable_decision_response`, `last_handled_update_id: 986228559`, `offset_after_placeholder: 986228560` |

**Nuance:** `duplicate_or_double_click` was **not** triggered because persisted offset advanced to `986228560`, so Telegram did not return update `986228559` again. This satisfies the operational criterion: **the same update was not accepted twice.**

**Repeated manual polling on test-only Data Table:** **PASS.** Not operational automation.

Poll 1 receipt (sanitized):

```json
{
  "inspect_status": "accepted",
  "decision_id": "D-9998-T",
  "selected_option": "1",
  "update_id": 986228559,
  "duplicate_or_stale": false,
  "block_reason": null,
  "allowed_chat_configured": true,
  "offset_after_placeholder": 986228560,
  "last_handled_update_id": 0,
  "test_only": true
}
```

Poll 2 receipt (sanitized):

```json
{
  "inspect_status": "blocked",
  "block_reason": "no_parseable_decision_response",
  "last_handled_update_id": 986228559,
  "offset_after_placeholder": 986228560,
  "allowed_chat_configured": true,
  "test_only": true
}
```

Prior `staticData` path: **PARTIAL/BLOCKED** (section 7) — superseded for repeated polling.

---

## 10. Phase 2 — limited schedule runtime test (47 - Wf only, manual/user-attested)

**Phase 1 (template):** disabled Schedule Trigger added to Git — **no runtime** by Cursor.

**Phase 2 operator outline (user-attested PASS/BLOCKED later):**

1. Reset **only** `wf47_polling_state_test` via CSV seed (`last_update_id=0`, `last_handled_update_id=0`, `handled_keys_json={}`).
2. Reimport updated **47 - Wf** template from GitHub.
3. Keep workflow **active:false** until ready to start the test window.
4. Verify **no webhook** is set on the Telegram bot (`getWebhookInfo` / n8n check).
5. Verify **no other workflow/process** polls `getUpdates` on the same bot token.
6. Confirm workflow **40/42** are **sendMessage-only** and do **not** poll `getUpdates`.
7. Activate **47 - Wf** schedule for **5–10 minutes only** (enable workflow + schedule per n8n UI policy).
8. Send **exactly one** Telegram message: `dp:D-9998-T:1`.
9. Verify **47** accepts the update **once** (sanitized receipt `inspect_status: accepted`).
10. Verify **next schedule cycle** does **not** accept the same update as new.
11. Turn **47 - Wf** **inactive/off** immediately after the window.
12. Record **PASS** or **BLOCKED** in session log / frontier.

**Technical caution — getUpdates exclusive consumer:** Telegram `getUpdates` is an **exclusive** consumer path per bot. If a webhook is set, or another workflow/process polls the same token, scheduled polling can conflict or consume updates unpredictably. Resolve before Phase 2.

**Hard constraints:** NO Telegram Trigger · NO public webhook · NO production Data Table · NO `control_plane_state` · NO **48** scheduled · NO **49** active · NO PM-34 · NO workflow 40/41/42 mutation · NO secrets in Git.

---

## 11. PASS criteria (met — Data Table gate)

- Poll 1: accepted TEST ONLY decision.
- Poll 2: did not re-accept same update (blocked, empty parse).
- No secrets; workflow inactive/off.

---

## 12. BLOCKED criteria

- Real `chat_id` / token committed to Git.
- Schedule activated without explicit gate.
- Missing stale or duplicate guards.
- PM-34, wf40/41, production Data Table, or GitHub touched.

---

## 13. Related files

- Template: `workflows/wf-telegram-inbound-polling-getupdates.template.json`
- Registration (live): `docs/runtime/WF_TELEGRAM_INBOUND_POLLING_REGISTRATION_PROMPT.md`
- We (webhook): `docs/workflow-we-telegram-interactive-decision-buttons.md`
