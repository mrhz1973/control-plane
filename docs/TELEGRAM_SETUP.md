# Telegram setup / security method

**Role:** setup and secrets method for Telegram integration.
**Runtime authority:** **NONE**.
**Current runtime / binding state:** read `docs/runtime/CURRENT_FRONTIER.md` only.

This file does **not** declare which bots, chats, or workflows are active.

---

## 1. Configuration method

- Create and manage the bot via BotFather (or the operator’s approved process).
- Store the bot token only in **n8n credentials** or another approved secret store — never as live authority inside Git docs.
- Bind allowed chats/users/channels in n8n workflow config or credential fields according to the authorizing task.
- Prefer explicit allowlists for chat/user/channel when the workflow supports them; do not treat “any Telegram traffic” as authorized.

## 2. Secrets policy

- **No token in this repo as a secret source of truth.**
- Do not commit bot tokens, webhook URLs containing tokens, or private chat identifiers used as secrets.
- If a value must appear in an export for structure only, use a clear placeholder and configure the real value in n8n UI.
- Compensating control for repo posture: `docs/ROTATION_CHECKLIST.md` (Telegram token revoke/reissue at end of project or on suspected exposure).

## 3. Minimal setup / test

1. Confirm frontier does not forbid Telegram touch for the current task.
2. Ensure n8n Telegram credential exists and is selected on the target workflow.
3. Confirm allowlist / chat binding matches the authorized test target.
4. Run only a **bounded** send/receive test when Execute is authorized.
5. Leave publish/schedule/permanent loops to a separate gate.

## 4. Stop conditions

Stop when:

- token or chat binding would need to be invented or scraped from history;
- test/send would hit a non-allowlisted chat;
- task implies webhook/Telegram Trigger / public exposure without gate;
- live frontier conflicts with the requested Telegram action.

## 5. Runtime gate

Creating credentials, sending messages, enabling triggers/webhooks, or changing production Telegram bindings is a **runtime gate** (`PROJECT_VISION` §7.0). Docs-only reading of this method is not authorization.

## 6. Historical note

Day-1/Day-2 bootstrap schedules, MVP chronology, and old “current workflow” snapshots that previously lived here are **historical**. Recover from Git history if needed (pre-cleanup baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`).
