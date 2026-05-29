Generate a plain-text Cursor agent prompt artifact (no JSON wrapper, no markdown code fences, ASCII-safe). Your entire response will be saved as the artifact file. End with the line: aggio control

The Cursor prompt must instruct the implementer to modify ONLY docs/foundation/PROJECT_VISION.md in mrhz1973/control-plane on branch main.

Required changes:

1. Header version bump:
   - Versione: 2.3 — 2026-05-29
   - Versione precedente: 2.2 — 2026-05-27 (sostituita)

2. Section 7.1 GitHub source of truth:
   - Keep the existing guard: SUCCESS testuale != PASS (Composer 2.5 Fast / implementer verification).
   - Add immediately after it a retry/access guard in Italian, concise, non-redundant:
     - A single fetch/access failure does NOT prove a resource is unreachable.
     - Examples: GitHub raw, web_fetch, API, remote pages, readable remote files or endpoints.
     - Before concluding "cannot read X" or "X is unreachable", retry at least once.
     - Do not carry an unverified negative assumption through the whole session.
     - Re-verify when: state may have changed; user asserts otherwise; alternate source suggests resource exists; first request may have failed due to transient network/cache/auth.
   - This is an operational guard, not a new component.

3. Section 15 changelog: add row for v2.3 documenting the retry/access guard in section 7.1.

Constraints:
- Do NOT add rows to section 1.1.
- Do NOT modify workflow 40/41.
- Do NOT unlock PM-34.
- Do NOT change pm34_unblocked or n8n_ready defaults.
- No runtime, deploy, provider API key, or secrets.
- Keep text brief.

Commit message for implementer: docs: add retry access guard to project vision
