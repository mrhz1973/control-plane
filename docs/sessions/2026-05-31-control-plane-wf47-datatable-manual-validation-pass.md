# Session — Wf47 Data Table manual validation PASS

**Date:** 2026-05-31  
**Repository:** `mrhz1973/control-plane`

## Schema fix (before PASS)

- Upsert node failed: `unknown column name 'note'`
- Human added column `note` to test-only table `wf47_polling_state_test`
- Required columns: `key`, `value`, `updated_at`, `note`

## Poll 1 (sanitized)

```json
{
  "inspect_status": "accepted",
  "decision_id": "D-9998-T",
  "selected_option": "1",
  "update_id": 986228559,
  "offset_after_placeholder": 986228560,
  "test_only": true
}
```

## Poll 2 — no new message (sanitized)

```json
{
  "inspect_status": "blocked",
  "block_reason": "no_parseable_decision_response",
  "last_handled_update_id": 986228559,
  "offset_after_placeholder": 986228560,
  "test_only": true
}
```

## Conclusion

**PASS** — same update not accepted twice; offset persistence via test-only Data Table validated.

## Boundaries

- wf47_polling_state_test only; no production Data Table
- No schedule; no PM-34; no wf40/41; no secrets in Git
- duplicate_or_double_click not triggered (offset prevented old update return)
