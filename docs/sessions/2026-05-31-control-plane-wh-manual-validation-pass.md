# Session — Wh manual validation PASS (2026-05-31)

**Repository:** `mrhz1973/control-plane`  
**Task:** Docs-only registration of user-attested Wh manual validation. No runtime by Cursor.

## Setup

- Old test Data Tables deleted; CSV seeds imported from `data-tables/` (no duplicate table ambiguity).
- `wf47_polling_state_test` reset from CSV before valid_close.
- `wg_decision_state_test` reset from CSV before valid_close with `D-9998-T` open.
- Workflow **49** imported once from GitHub; remained **inactive/off**; `allowed_chat_id` already set per 2026-05-31 policy gate.

## Duplicate nuance

Between valid_close and duplicate: user reset **only** `wf47_polling_state_test` from CSV and left `wg_decision_state_test` closed so Wf47 accepted the same fixture update and Wg returned `duplicate_or_already_closed` (not Wf47 `stale_old_update_id`).

## Sanitized receipts

### valid_close

```json
[
  {
    "inspect_status": "closed",
    "wf47_polling_status": "accepted",
    "wg_correlation_status": "closed",
    "decision_id": "D-9998-T",
    "selected_option": "1",
    "update_id": 986228910,
    "note_present": false,
    "wf47_block_reason": null,
    "wg_block_reason": null,
    "prior_status": "open",
    "state_persisted_wf47": true,
    "state_persisted_wg": true,
    "test_only": true
  }
]
```

### duplicate

```json
[
  {
    "inspect_status": "blocked",
    "wf47_polling_status": "accepted",
    "wg_correlation_status": "blocked",
    "decision_id": "D-9998-T",
    "selected_option": "1",
    "update_id": 986228910,
    "note_present": false,
    "wf47_block_reason": null,
    "wg_block_reason": "duplicate_or_already_closed",
    "prior_status": "closed",
    "state_persisted_wf47": true,
    "state_persisted_wg": false,
    "test_only": true
  }
]
```

### unknown

```json
[
  {
    "inspect_status": "blocked",
    "wf47_polling_status": "accepted",
    "wg_correlation_status": "blocked",
    "decision_id": "D-9999-X",
    "selected_option": "2",
    "update_id": 986228911,
    "note_present": false,
    "wf47_block_reason": null,
    "wg_block_reason": "unknown_decision_id",
    "prior_status": "missing",
    "state_persisted_wf47": true,
    "state_persisted_wg": false,
    "test_only": true
  }
]
```

## Conclusion

**Wh manual validation: PASS** — valid_close, duplicate, unknown scenarios match expected combined inspect contract.

## Boundaries

- No schedule; no Telegram Trigger; no public webhook.
- No workflow 40/41/42 mutation; no production Data Table; PM-34 not unlocked.
- Operational inbound automation and full automation chain: **NOT ACTIVE** / **NOT RUN**.
- No secrets/token/credential/webhook/API key/OAuth/PAT/CoT in this session file.
