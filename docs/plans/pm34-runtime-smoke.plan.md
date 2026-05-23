# PM-34 runtime smoke plan

Purpose: trigger the existing n8n Gate D / PM21 bridge preview path with a safe plan file.

Scope:
- Existing workflow 40 only.
- Telegram preview expected.
- Mock-worker / preview-only behavior expected.
- No real Codex worker execution.
- No OpenClaw gateway runtime.
- No workflow 40/41 edits.
- No n8n import.
- No secrets.

Expected classifier/bridge behavior:
- Detect this file as a docs/plans/*.plan.md plan file.
- Send Gate D Telegram plan_detected preview.
- Send PM21 bridge summary.
- Keep worker behavior preview-only / mock-worker.

PASS criteria:
- Workflow 40 detects this commit.
- Telegram receives the plan_detected message.
- Telegram receives the PM21 bridge summary.
- No workflow 40/41 changes.
- No real worker call.

Operator note:
This file is a controlled PM-34 smoke input. It is not a strict_pass artifact and does not unblock PM-34 by itself.
