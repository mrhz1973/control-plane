# Workflow exports

n8n workflow JSON exports belong in **`workflows/exports/`**.

## Before commit

- Exports must be **redacted** before commit.
- Remove or replace: tokens, API keys, webhook secrets, credential IDs tied to secrets.
- **No tokenized URLs** (e.g. `https://api.telegram.org/bot<TOKEN>/...`).
- **No credentials** embedded in node parameters.

## Naming convention

```
YYYY-MM-DD_name.redacted.json
```

Example: `2026-05-20_push-notify.redacted.json`

## Criterion 2 — handoff manual gate

- **File:** `2026-05-20_handoff-generate-manual-telegram-v1.redacted.json`
- **Purpose:** MVP criterion 2 — Manual Trigger → Execute Command (handoff dry-run) → parse → Telegram `Prompt ready: yes/no`
- **Import rule:** keep **inactive** until UI gate; set chat_id and credential in n8n UI only
- **No secrets** in committed export

## Do not commit

- `*.unredacted.json` (listed in [.gitignore](../.gitignore))
- Raw exports straight from n8n without redaction pass
