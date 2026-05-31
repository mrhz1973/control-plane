# Session — Wg inbound decision state correlation package prep

**Date:** 2026-05-31  
**Repository:** `mrhz1973/control-plane`

## Files

- `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`
- `workflows/wg-telegram-inbound-decision-state-correlation.template.json` (workflow 48)
- `docs/runtime/CURRENT_FRONTIER.md`

## Naming

**Wg** — next letter after Wf; no prior `wg` usage in repo.

## Boundaries

- No runtime; no n8n UI; no Telegram API
- Table `wg_decision_state_test` only (not `control_plane_state`, not `wf47_polling_state_test`)
- PM-34 BLOCCATO; wf40/41 untouched

## Next gate

Wg manual validation: seed table, import wf48, scenarios valid_close + duplicate + unknown
