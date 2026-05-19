# n8n rebuild guide

**Purpose:** Rebuild the n8n control-plane automation stack if the VPS dies.

**Bootstrap note:** No installation is performed in the Day 1 docs-only task. Sections below are placeholders until runtime work begins.

---

## VPS access

**Status:** TODO

- SSH host, user, and key location (document locally, not in repo)
- Firewall ports required for n8n and webhooks

---

## Docker / n8n

**Status:** TODO

- Install method (Docker Compose or native)
- n8n version pin
- Persistent volume paths
- Public URL / reverse proxy

---

## Credential restore

**Status:** TODO

- Telegram bot token → n8n credentials
- GitHub webhook secret → n8n / GitHub settings
- No credentials stored in this repository

---

## Workflow import

**Status:** TODO

- Import redacted JSON from `workflows/exports/`
- Re-link credentials in n8n UI after import

---

## Smoke test

**Status:** TODO

- Push to a watched repo → Telegram within 30s ([MVP_CRITERIA.md](MVP_CRITERIA.md) criterion 1)
- Manual handoff trigger → `Prompt ready: yes/no` on Telegram (criterion 2)
