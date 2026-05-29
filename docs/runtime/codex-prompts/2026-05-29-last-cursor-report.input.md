Generate a plain-text Cursor agent prompt artifact (no JSON wrapper, no markdown code fences, ASCII-safe). Your entire response will be saved as the artifact file. End with the line: aggio control

The Cursor prompt must instruct the implementer to modify ONLY these files in mrhz1973/control-plane on branch main:
- docs/foundation/PROJECT_VISION.md
- docs/runtime/LAST_CURSOR_REPORT.md (create new)

Goal: introduce rolling Cursor report on GitHub at docs/runtime/LAST_CURSOR_REPORT.md so post-push verbatim output is readable from remote GitHub without depending on pasted Cursor chat.

Required PROJECT_VISION changes:
1. Header bump: Versione 2.4 -> 2.5, Data 2026-05-29, Versione precedente: 2.4 — 2026-05-29
2. Section 8.1: after post-push verification block, add rule that Cursor must update docs/runtime/LAST_CURSOR_REPORT.md after each real task using two-commit stop-condition:
   - COMMIT 1 = real task (code/docs changes + create or update report schema);
   - after push COMMIT 1, capture verbatim post-push output and set LATEST.real_task_commit to COMMIT 1 SHA;
   - COMMIT 2 = only LAST_CURSOR_REPORT.md with populated LATEST;
   - STOP: COMMIT 2 is NOT re-registered; LATEST.real_task_commit stays COMMIT 1 SHA;
   - PASS verify: LATEST.real_task_commit must appear in origin/main chain (need not equal HEAD after COMMIT 2).
3. Section 11.3: add pointer to docs/runtime/LAST_CURSOR_REPORT.md as persistent post-push evidence on GitHub.
4. Section 15 changelog row for v2.5.

LAST_CURSOR_REPORT.md schema (create with pending in LATEST for COMMIT 1 workflow):
- Title and purpose (Italian brief)
- Rules: no secrets; LATEST = last real task; HISTORY newest first; real_task_commit = commit 1 only; commit 2 not re-registered
- LATEST: task_ref, timestamp_utc, branch, real_task_commit, result_cursor (pending for first commit)
- remote_hash_verbatim block (pending)
- post_push_verbatim block with sections for git log, status, rev-parse HEAD, origin/main, branch, show --stat, ls-remote (pending)
- HISTORY section (empty or note: none yet)

Constraints:
- Do NOT add rows to section 1.1.
- Do NOT modify workflow 40/41.
- Do NOT unlock PM-34.
- Do NOT change pm34_unblocked or n8n_ready.
- No runtime, deploy, provider API key, secrets.
- Keep text concise.

Commit message for implementer COMMIT 1: docs: add rolling last cursor report on github

aggio control
