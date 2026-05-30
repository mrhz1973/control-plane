# Session — Wb-live package prep (2026-05-30)

**Repository:** `mrhz1973/control-plane`
**Scope:** preparation artifacts only — no runtime.

## Package files created

- `workflows/wb-live-classifier-server-manual.template.json` — importable, inactive, manual-trigger-only n8n template (POST to `**CLASSIFIER_SERVER_URL**/classify`; placeholders only; no Telegram, no Data Table, no workflow 40/41).
- `docs/runtime/test-events/wb-live-classifier-test-event.json` — sanitized docs-only classifier test event (wrapper-v1 schema).
- `docs/workflow-wb-live-classifier-server.md` — manual runbook (preconditions, server start, import guidance, PASS/BLOCKED criteria, evidence).
- `docs/runtime/WB_LIVE_REGISTRATION_PROMPT.md` — copy/paste Cursor prompt with PASS and BLOCKED branches, two-commit rolling pattern.

## Boundaries

- No runtime executed. No n8n import/execute. No classifier server start. No Ollama call. No Telegram send.
- No workflow 40/41 mutation. No existing export modified. PM-34 BLOCCATO.
- No secrets / token / chat_id / credential / webhook / auth URL / API key / chain-of-thought added; placeholders only (`RYZEN_TAILSCALE_IP`, `CLASSIFIER_SERVER_URL`, `CLASSIFIER_AUTH_TOKEN_OPTIONAL`, `CONFIGURE_IN_N8N_UI`).

## Next gate

Physical Wb-live execution by the user: import template, configure Tailscale URL/token in n8n UI only, run Manual Trigger once, return sanitized evidence for registration.
