# PUBLIC_WEBHOOK_GATE — historical decision pointer

**Status:** `HISTORICAL_DECISION_POINTER`
**Runtime authority:** **NONE**.
**Current gate authority:** **NONE**.
**Recommended-NEXT authority:** **NONE**.

## Current owners

| Need | Owner |
|---|---|
| Live gate / NEXT | `docs/runtime/CURRENT_FRONTIER.md` |
| Hard runtime / security policy | `docs/foundation/PROJECT_VISION.md` §7 |
| Workflow import / asset policy | `workflows/README.md` |

## Durable rules (migrated)

Security rules that remain current were moved to `PROJECT_VISION` §7 during L3A.5, including:

- no naked / unauthenticated public n8n exposure without an explicit gate;
- public webhook / Telegram Trigger / public HTTPS exposure = separate runtime/security gate;
- webhook secrets and tokens stay out of Git;
- live exposure state is read from the frontier, not from this file.

## What this file was

May-2026 decision/design notes for moving from polling to a real GitHub → n8n public HTTPS webhook path (v5), including tunnel/proxy options and “recommended next gate” language.

That chronology is **historical**. It must not declare webhook/v5/public HTTPS as current NEXT.

## Historical recovery

Full prior content: Git history / sessions.
Pre-cleanup baseline: `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`.
