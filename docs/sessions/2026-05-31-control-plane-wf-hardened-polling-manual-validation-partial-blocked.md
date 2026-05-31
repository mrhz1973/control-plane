# Session — Wf hardened polling manual validation PARTIAL/BLOCKED

**Date:** 2026-05-31  
**Repository:** `mrhz1973/control-plane`

## First manual poll (sanitized)

```json
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
```

## Second manual poll — no new Telegram message (sanitized)

Identical to first run (same `update_id`, again `accepted`, `duplicate_or_stale: false`).

## Conclusion

**PARTIAL/BLOCKED** — parse/accept path works; duplicate/stale persistence **not** validated. Safe repeated use blocked.

## Boundaries

- Workflow 47 inactive/off; no schedule.
- No PM-34; no wf40/41 mutation; no production automation; no GitHub write by workflow.
- No token/chat_id/user_id/secrets in Git.

## Next gate

Test-only persistent offset/idempotency store (UI-only config); re-validate duplicate block on second manual poll.
