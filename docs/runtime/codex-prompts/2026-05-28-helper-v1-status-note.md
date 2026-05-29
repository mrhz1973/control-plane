Task: Update only docs/foundation/FOUNDATION_STATUS.md in repository mrhz1973/control-plane on branch main.

Scope:
- Modify exactly one file: docs/foundation/FOUNDATION_STATUS.md
- Do not modify PROJECT_VISION.md or any other file.
- Do not add secrets.
- Keep the documentation change concise and status-only.

Required documentation note:
Add a brief note under "Manual supervision evidence" or near "Next tactical step" covering these points:

- Codex artifact helper v1 created: local script scripts/codex-artifact.ps1
- Real test path: input prompt file -> Codex CLI ephemeral read-only -> artifact in docs/runtime/codex-prompts/
- Value: reduces micro-interaction of manually reconstructing codex.cmd exec --ephemeral --sandbox read-only --output-last-message each time
- Status: manual-supervised helper only; does NOT activate Codex CLI as automatic worker
- Does NOT unlock PM-34; does NOT change pm34_unblocked or n8n_ready defaults
- Does NOT touch workflow 40/41; no n8n runtime; no provider API key; no deploy/tag/rollback

Optional:
If it fits without bloating the doc, update "Next tactical step" to mention repeat-use of helper v1 on a second real task before any n8n/runtime integration.

Validation:
- Confirm git diff only includes docs/foundation/FOUNDATION_STATUS.md.
- Confirm the note explicitly preserves the current locked/manual posture.
- Confirm there are no changes to PROJECT_VISION.md, workflow 40/41, runtime integration, provider keys, deploy, tag, or rollback behavior.

Commit message after consuming this artifact:
tools: add Codex artifact helper v1

aggio control

