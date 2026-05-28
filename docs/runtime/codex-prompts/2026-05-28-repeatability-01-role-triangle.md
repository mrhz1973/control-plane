You are editing repository mrhz1973/control-plane on branch main.

Task: modify only docs/foundation/PROJECT_VISION.md.

Add one brief bullet under section 14, "Backlog futuro non vincolante", documenting the operational AI role triangle:

- Claude = strategic advisor / external reviewer; not implementer and not n8n worker.
- ChatGPT = orchestrator-B / primary user-facing interface.
- Codex CLI = orchestrator-A operational target in the local loop; ephemeral, read-only reasoning; not an automatic worker until explicitly gated.

Constraints:
- Keep the new text concise and consistent with the existing Italian document style.
- Do not activate runtime behavior.
- Do not change workflow 40 or workflow 41.
- Do not unlock PM-34.
- Do not change pm34_unblocked or n8n_ready defaults.
- Do not touch any other files.
- Do not add secrets or environment-specific data.
- Update section 15 changelog only if this is treated as a significant change; for a minor documentation clarification, skipping the changelog bump is acceptable.

Verification:
- Confirm that only docs/foundation/PROJECT_VISION.md changed.
- Confirm the new bullet is under section 14.
- Confirm no workflow/runtime/default changes were made.

Commit message:
docs: add AI role triangle to project vision

aggio control