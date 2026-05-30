# Session — Wb-docs DECISION_PACKET_FORMAT.md (2026-05-30)

**Repository:** `mrhz1973/control-plane`  
**Scope:** docs-only — format definition, no runtime.

## Files changed

- `docs/foundation/DECISION_PACKET_FORMAT.md` (new) — canonical extended Decision Packet format
- `docs/runtime/CURRENT_FRONTIER.md` — Wb-docs PASS, next gate Wb-live

## Content

- Parent rule: `PROJECT_VISION.md` §7.7 (unchanged).
- Extended superset: 10 §7.7 minimum fields + classifier bridge fields (`risk`, `route`, `requires_human`, `confidence`, classifier reason, event provenance).
- Field **Source / populated by** column: classifier, n8n/event provenance, orchestrator, user-facing gate, human response.
- Risk → routing mapping aligned with §6.3 and `classifier-wrapper-v1` route semantics.
- Telegram redaction: no secrets/token/chat_id/credential/webhook/API key/CoT.
- One illustrative worked example — fake `event_id` / commit; not real D-0002-C execution.

## Boundaries

- No runtime, n8n, Telegram send, or PM-34 unlock.
- No code, test, workflow, or export changes.
- **Wb-live remains next gate:** n8n → classifier-server manual single execution via Tailscale (user-operated).
