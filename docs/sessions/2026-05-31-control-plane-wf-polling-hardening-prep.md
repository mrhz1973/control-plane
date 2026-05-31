# Session — Wf polling hardening prep

**Date:** 2026-05-31  
**Repository:** `mrhz1973/control-plane`

## Files changed

- `workflows/wf-telegram-inbound-polling-getupdates.template.json`
- `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- `docs/runtime/CURRENT_FRONTIER.md`

## Boundaries

- No runtime executed.
- No n8n UI opened.
- No Telegram API call.
- No secrets added.
- PM-34 unchanged (**BLOCCATO**).

## Next gate

Wf hardened path — one manual poll in n8n UI; verify offset/stale/duplicate/allowed-chat guards; workflow 47 inactive/off.
