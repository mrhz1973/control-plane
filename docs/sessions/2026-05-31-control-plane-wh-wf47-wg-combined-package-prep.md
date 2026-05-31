# Session — Wh Wf47→Wg combined package prep

**Date:** 2026-05-31

## Design choice

**Sanitized Wf47 receipt fixture → Wg correlation** in one workflow (no live HTTP in Wh). Live getUpdates remains workflow 47.

## Files

- `docs/workflow-wh-wf47-wg-combined-inbound-decision-flow.md`
- `workflows/wh-wf47-wg-combined-inbound-decision-flow.template.json` (workflow 49)

## Boundaries

- No runtime; PM-34 blocked; wf40/41 untouched
- Tables: wf47_polling_state_test, wg_decision_state_test only

## Next gate

Wh manual validation — valid_close, duplicate, unknown scenarios
