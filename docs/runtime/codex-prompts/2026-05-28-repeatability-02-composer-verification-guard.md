Task: update documentation in mrhz1973/control-plane on branch main.

Repository and scope:
Modify only this file:
docs/foundation/PROJECT_VISION.md

Do not modify any other file.

Required change:
Add a brief security note explaining that Composer 2.5 Fast / implementer model may declare SUCCESS without real commits.

Required substance:
A declared SUCCESS is NOT PASS unless it is backed by verifiable output:
- commit hash
- real diff
- git status clean
- git log evidence
- GitHub verification

Textual SUCCESS alone is insufficient. GitHub remains the source of truth.

Placement:
Use the most minimal, non-redundant location in docs/foundation/PROJECT_VISION.md.
Prefer one of these locations:
- section 7.1 GitHub source of truth
- section 7.3 Aggressive autonomia controllata
- near section 12 Cursor preflight item

Choose exactly one suitable location. Avoid duplicating the same policy in multiple places.

Constraints:
- Do not activate runtime.
- Do not change workflow 40/41.
- Do not unlock PM-34.
- Do not change safe defaults.
- Do not add secrets.
- Do not edit unrelated content.
- Update section 15 changelog only if the documentation change is significant enough to warrant it; otherwise leave changelog unchanged.

Verification before final response:
- Confirm only docs/foundation/PROJECT_VISION.md changed.
- Confirm git diff contains only the intended security note.
- Confirm git status is clean after commit.
- Confirm git log shows the new commit.
- Confirm GitHub reflects the commit on branch main.

Commit:
Use this exact commit message:
docs: add implementer success verification guard

Final response:
Do not claim PASS from textual SUCCESS alone. Report the commit hash and verification evidence.

aggio control