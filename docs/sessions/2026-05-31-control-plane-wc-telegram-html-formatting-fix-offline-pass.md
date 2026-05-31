# Session — Wc Telegram HTML formatting fix (offline PASS)

**Date:** 2026-05-31  
**Repository:** mrhz1973/control-plane  
**Type:** Template + offline test; no runtime executed by this task.

## Live plain-text rerun (user-attested, not PASS)

- Workflow 43 reimport with `=== TEST ONLY ===` banner.
- Underscores still stripped: eventid, humangate, requireshuman.
- Recorded as BLOCKED/PENDING in CURRENT_FRONTIER.md.

## Fix

- Telegram `parse_mode`: HTML.
- `escHtml()` on all dynamic fields; static labels keep literal underscores.
- Offline tests T1-T11 PASS.

## Next gate

User reimports template and runs Manual Trigger once to confirm live underscore rendering.
