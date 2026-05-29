Generate a plain-text Cursor agent prompt artifact (no JSON wrapper, no markdown code fences, ASCII-safe). Your entire response will be saved as the artifact file. End with the line: aggio control

The Cursor prompt must instruct the implementer to update only docs/foundation/FOUNDATION_STATUS.md in mrhz1973/control-plane on branch main.

Add a brief note under "Manual supervision evidence" or near "Next tactical step":

- Codex artifact helper v1 created: local script scripts/codex-artifact.ps1
- Real test path: input prompt file -> Codex CLI ephemeral read-only -> artifact in docs/runtime/codex-prompts/
- Value: reduces micro-interaction of manually reconstructing codex.cmd exec --ephemeral --sandbox read-only --output-last-message each time
- Status: manual-supervised helper only; does NOT activate Codex CLI as automatic worker
- Does NOT unlock PM-34; does NOT change pm34_unblocked or n8n_ready defaults
- Does NOT touch workflow 40/41; no n8n runtime; no provider API key; no deploy/tag/rollback

Keep the note concise. Do not modify PROJECT_VISION.md or other files. No secrets.

Optional: update "Next tactical step" to mention repeat-use of helper v1 on a second real task before any n8n/runtime integration, if that fits without bloating the doc.

Commit message for the implementer (after consuming this artifact): tools: add Codex artifact helper v1
