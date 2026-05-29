Generate a plain-text Cursor agent prompt artifact (no JSON wrapper, no markdown code fences, ASCII-safe). Your entire response will be saved as the artifact file. End with the line: aggio control

The Cursor prompt must instruct the implementer to modify ONLY docs/foundation/PROJECT_VISION.md in mrhz1973/control-plane on branch main.

Context: a stale GitHub raw file caused a false WAIT. Lesson: post-Cursor PASS depends on the remote hash on main, not on the GitHub raw file.

Required changes:

1. Header version bump:
   - Versione: 2.4 — 2026-05-29
   - Versione precedente: 2.3 — 2026-05-29

2. Section 7.1 GitHub source of truth:
   - Keep the existing guard "SUCCESS testuale != PASS".
   - Keep the existing retry/access guard.
   - Add a new guard "hash remoto vince sul raw" covering:
     - post-Cursor PASS requires the remote hash on main;
     - primary source: git ls-remote origin main or git rev-parse origin/main;
     - GitHub raw is secondary, best-effort, can be stale due to cache/CDN;
     - if remote hash confirms and raw diverges, do NOT downgrade the PASS;
     - no PASS without the remote hash;
     - only if remote does not show the commit, use local output to distinguish missing push, wrong branch, or commit never made.

3. Section 8.1: after the minimal Git commands, add a "post-push verification" block that must include exactly these commands:
   git log --oneline -5
   git status --short
   git rev-parse HEAD
   git rev-parse origin/main
   git branch --show-current
   git show --stat HEAD
   git ls-remote origin main
   - The final Cursor report must contain verbatim textual output, not a table and not a summary.
   - SUCCESS without these outputs is not PASS.

4. Section 11.3 handoff minimum content: add that the handoff must report HEAD / remote hash observed via git ls-remote origin main (or equivalent), last commit verified on main, and any raw/hash divergence as a secondary note (not a FAIL if the hash confirms).

5. Section 15 changelog: add a row for v2.4 documenting the remote-hash verification rule (raw secondary, post-push verbatim report).

Constraints:
- Do NOT add rows to section 1.1.
- Do NOT modify workflow 40/41.
- Do NOT unlock PM-34.
- Do NOT change pm34_unblocked or n8n_ready defaults.
- No runtime, deploy, provider API key, or secrets.
- Keep text brief and non-redundant.

Commit message for implementer: docs: add remote hash verification guard
