# Session — Wf47 ready-import Data Table template prep

**Date:** 2026-05-31  
**Repository:** `mrhz1973/control-plane`

## Files changed

- `workflows/wf-telegram-inbound-polling-getupdates.template.json`
- `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- `docs/runtime/CURRENT_FRONTIER.md`

## Template

- Data Table: `wf47_polling_state_test` (load all + upsert by key)
- Set node: `allowed_chat_id` placeholder (UI edit, no Code edits)
- No staticData persistence; no Schedule; active=false

## Data Table schema source

Inferred from repo: `workflows/42-diff-summary-mvp.template.json`, `workflows/exports/2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json`

## Boundaries

- No runtime by Cursor; no n8n UI; no Telegram API
- PM-34 BLOCCATO; wf40/41 untouched; no secrets in Git

## Next gate

Human: import template, UI config only, poll 1 accept + poll 2 duplicate block
