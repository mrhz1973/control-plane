# Session — 47 - Wf first limited schedule runtime test PASS

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-01  
**Type:** docs-only registration of user-attested Phase 2 schedule runtime PASS. **No runtime by Cursor.** **Not a PREP task.**

---

## 1. Purpose

Record **PASS ATTESTATO UTENTE** for the **first limited schedule runtime test** on **47 - Wf Telegram Inbound Polling getUpdates TEST ONLY - TEMPLATE** (scheduled `getUpdates`, accept-once, no re-accept on next cycle).

## 2. Preconditions (user-attested)

- **47 - Wf** reimported from fixed template (Schedule Trigger unique node id).
- **wf47_polling_state_test** reset via CSV seed before the schedule gate.
- **allowed_chat_id** configured in n8n UI only.
- Telegram bot token configured **only** in n8n UI on **HTTP Request - getUpdates** — not in Git.
- **48 - Wg** not scheduled; **49 - Wh** not active.
- No Telegram Trigger, public webhook, production Data Table, or `control_plane_state`.
- No PM-34; no workflow 40/41/42 mutation; no secrets or tokenized URLs in Git.
- **47 - Wf** turned **off/inactive** after the short schedule test window.

## 3. Runtime evidence — first scheduled cycle

```json
[
  {
    "inspect_status": "accepted",
    "decision_id": "D-9998-T",
    "selected_option": "1",
    "update_id": 986228565,
    "duplicate_or_stale": false,
    "note_present": false,
    "block_reason": null,
    "allowed_chat_configured": true,
    "offset_after_placeholder": 986228566,
    "last_handled_update_id": 986228564,
    "test_only": true
  }
]
```

## 4. Runtime evidence — second scheduled cycle

```json
[
  {
    "inspect_status": "blocked",
    "decision_id": null,
    "selected_option": null,
    "update_id": null,
    "duplicate_or_stale": false,
    "note_present": false,
    "block_reason": "no_parseable_decision_response",
    "allowed_chat_configured": true,
    "offset_after_placeholder": 986228566,
    "last_handled_update_id": 986228565,
    "test_only": true
  }
]
```

## 5. PASS interpretation

| Check | Result |
|-------|--------|
| **First limited schedule test (47 - Wf)** | **PASS ATTESTATO UTENTE** |
| **First cycle** | Accepted exactly one real Telegram update: `update_id` **986228565** |
| **Second cycle** | Did **not** re-accept `986228565` as new (`block_reason: no_parseable_decision_response`) |
| **State advance** | `last_handled_update_id` **986228564 → 986228565**; `offset_after_placeholder` **986228566** |
| **test_only** | `true` throughout |
| **Automatic 47→48** | **Not performed** |
| **49 - Wh** | **Not used** for this gate |

## 6. Runtime / user-attested gate (not PREP)

This PASS records a **manual/user-attested Phase 2 schedule runtime gate** executed by the operator in n8n. It is **not** a PREP or PRE-PREP documentation chain.

## 7. No-runtime-by-Cursor confirmation

Cursor did **not** run n8n, import workflows, activate workflows or schedule, poll Telegram, or mutate Data Tables.

## 8. Post-test shutdown

**47 - Wf** was turned **off/inactive** after the short schedule test.

## 9. Forbidden actions NOT performed (by Cursor)

- No n8n / import / activation / schedule run / Telegram Trigger / public webhook.
- No production Data Table / `control_plane_state` mutation.
- No **48** scheduled, **49** active, PM-34 unlock, wf40/41/42 changes.
- No `workflows/**` or `data-tables/**` edits; no secrets or tokenized URLs in Git.

## 10. Validation commands

```text
git diff --check
git status --short
git diff --stat
```

## 11. Commit / remote hash

- Task commit (`docs: record Wf47 limited schedule pass`): see `git rev-parse HEAD` on `origin/main` after push.
- Remote hash: see `git ls-remote origin main` after push.

## 12. Final status

**PASS** — First limited **47 - Wf** schedule runtime test **PASS ATTESTATO UTENTE**. Accept-once proven on scheduled cycles. Next work is a separate operational gate (not another PREP chain).
