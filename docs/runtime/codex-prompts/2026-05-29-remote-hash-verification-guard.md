You are Cursor working in repository mrhz1973/control-plane on branch main.

Modify ONLY this file:
docs/foundation/PROJECT_VISION.md

Do not modify any other file.

Goal:
Update PROJECT_VISION.md to version 2.4 and add a remote-hash verification guard so post-Cursor PASS depends on the remote hash on main, not on GitHub raw content. A stale GitHub raw file previously caused a false WAIT.

Required edits:

1. Header version bump:
- Change current version to:
  Versione: 2.4 ? 2026-05-29
- Change previous version to:
  Versione precedente: 2.3 ? 2026-05-29

2. Section 7.1 GitHub source of truth:
- Keep the existing guard "SUCCESS testuale != PASS".
- Keep the existing retry/access guard.
- Add a new guard named:
  hash remoto vince sul raw
- The new guard must cover these points briefly:
  post-Cursor PASS requires the remote hash on main;
  primary source is git ls-remote origin main or git rev-parse origin/main;
  GitHub raw is secondary, best-effort, and can be stale due to cache/CDN;
  if remote hash confirms and raw diverges, do NOT downgrade the PASS;
  no PASS without the remote hash;
  only if remote does not show the commit, use local output to distinguish missing push, wrong branch, or commit never made.

3. Section 8.1:
After the minimal Git commands, add a post-push verification block that includes exactly these commands:
git log --oneline -5
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD
git ls-remote origin main

Also state briefly:
- The final Cursor report must contain verbatim textual output, not a table and not a summary.
- SUCCESS without these outputs is not PASS.

4. Section 11.3 handoff minimum content:
Add that the handoff must report:
- HEAD / remote hash observed via git ls-remote origin main or equivalent;
- last commit verified on main;
- any raw/hash divergence as a secondary note, not a FAIL if the hash confirms.

5. Section 15 changelog:
Add a row for v2.4 documenting the remote-hash verification rule:
- raw is secondary;
- post-push report must include verbatim command output.

Constraints:
- Do NOT add rows to section 1.1.
- Do NOT modify workflow 40/41.
- Do NOT unlock PM-34.
- Do NOT change pm34_unblocked or n8n_ready defaults.
- Do NOT add runtime, deploy, provider API key, or secrets.
- Keep text brief and non-redundant.
- Preserve existing style and language as much as possible.

After editing:
- Run a diff limited to docs/foundation/PROJECT_VISION.md.
- Confirm no other files changed.
- Commit with exactly this message:
docs: add remote hash verification guard

Final Cursor report must include:
- changed file path;
- commit hash;
- verbatim output from the post-push verification commands listed above;
- a note if GitHub raw diverges from the remote hash, treated only as secondary if the remote hash confirms main.

aggio control

