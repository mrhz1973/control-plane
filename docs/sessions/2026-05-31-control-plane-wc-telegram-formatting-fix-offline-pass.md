# Session — Wc Telegram formatting fix (offline PASS)

**Date:** 2026-05-31  
**Repository:** mrhz1973/control-plane  
**Type:** Template + offline test; no runtime executed by this task.

## Root cause

Telegram node had no `parse_mode`; composed text used `***` banner markers. Legacy Markdown treated underscores in `event_id`, `human_gate`, `requires_human` as italic delimiters.

## Fix

- Telegram `additionalFields.parse_mode`: `""` (plain text).
- Banner: `=== TEST ONLY / TEMPLATE VALIDATION ===` (no asterisks).

## Verification

- `tests/wc-decision-packet/run-offline-tests.mjs` — T1-T9 PASS.
- Template remains `active: false`.
- No secrets added.

## Next gate (separate)

User re-imports updated template and runs Manual Trigger once to confirm live underscore rendering.
