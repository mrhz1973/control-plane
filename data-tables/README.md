# Data Table CSV Seeds

CSV seed per Data Tables n8n test-only del control-plane.

## File presenti

- `wf47_polling_state_test.csv` — layout key/value per offset/idempotency polling Wf47.
- `wg_decision_state_test.csv` — layout colonne nominate per stato Decision Packet Wg/Wh.

## Policy

- Token Telegram **MAI** in Git — resta solo in credential n8n.
- **chat_id** ammesso in Git per asset di configurazione dal gate esplicito 2026-05-31.
- No credential id, webhook URL, API key, OAuth material, PAT, execution dump o chain-of-thought.

## Convenzione completa

Vedi [docs/foundation/DATA_TABLE_CSV_CONVENTION.md](../docs/foundation/DATA_TABLE_CSV_CONVENTION.md).
