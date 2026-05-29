You are Cursor working in repository mrhz1973/control-plane on branch main.

Create a concise documentation-only change. Modify ONLY these files:
- docs/foundation/PROJECT_VISION.md
- docs/runtime/LAST_CURSOR_REPORT.md

Do not modify any other file.

Goal:
Introduce a rolling Cursor report at docs/runtime/LAST_CURSOR_REPORT.md so post-push verbatim output is readable from remote GitHub without depending on pasted Cursor chat.

Required changes in docs/foundation/PROJECT_VISION.md:

1. Header bump:
- Change Versione 2.4 to Versione 2.5.
- Set Data to 2026-05-29.
- Set Versione precedente to: 2.4 -> 2026-05-29

2. Section 8.1:
After the existing post-push verification block, add a concise rule that Cursor must update docs/runtime/LAST_CURSOR_REPORT.md after each real task using this two-commit stop-condition:

- COMMIT 1 = real task: code/docs changes plus create or update report schema.
- After pushing COMMIT 1, capture verbatim post-push output and set LATEST.real_task_commit to the COMMIT 1 SHA.
- COMMIT 2 = only docs/runtime/LAST_CURSOR_REPORT.md with populated LATEST.
- STOP: COMMIT 2 is NOT re-registered; LATEST.real_task_commit stays the COMMIT 1 SHA.
- PASS verify: LATEST.real_task_commit must appear in the origin/main chain; it does not need to equal HEAD after COMMIT 2.

3. Section 11.3:
Add a concise pointer to docs/runtime/LAST_CURSOR_REPORT.md as persistent post-push evidence on GitHub.

4. Section 15:
Add a changelog row for v2.5 describing the rolling Cursor report on GitHub and the two-commit stop-condition.

Required new file docs/runtime/LAST_CURSOR_REPORT.md:

Create the file with a concise Italian plain Markdown document. It must contain:

- Title and brief purpose.
- Rules section:
  - no secrets;
  - LATEST = last real task;
  - HISTORY newest first;
  - real_task_commit = commit 1 only;
  - commit 2 is not re-registered.
- LATEST section with these fields:
  - task_ref
  - timestamp_utc
  - branch
  - real_task_commit
  - result_cursor
- For this first COMMIT 1 workflow, set LATEST values to pending placeholders, including result_cursor pending.
- remote_hash_verbatim block with pending content.
- post_push_verbatim block with pending content and explicit subsections for:
  - git log
  - status
  - rev-parse HEAD
  - origin/main
  - branch
  - show --stat
  - ls-remote
- HISTORY section empty or with a concise note that there is no history yet.

Constraints:
- Do NOT add rows to section 1.1.
- Do NOT modify workflow 40/41.
- Do NOT unlock PM-34.
- Do NOT change pm34_unblocked or n8n_ready.
- Do NOT add runtime, deploy, provider API key, or secrets.
- Keep text concise.
- Preserve existing Italian style where possible.
- Use ASCII-safe text only.

Verification before committing:
- Confirm only these two files changed.
- Confirm docs/runtime/LAST_CURSOR_REPORT.md exists.
- Confirm PROJECT_VISION header says Versione 2.5, Data 2026-05-29, Versione precedente 2.4 -> 2026-05-29.
- Confirm no changes were made to section 1.1, workflow 40/41, PM-34 status flags, pm34_unblocked, or n8n_ready.

Commit COMMIT 1 with exactly this message:
docs: add rolling last cursor report on github

After COMMIT 1 is pushed:
- Capture the required verbatim post-push output.
- Update only docs/runtime/LAST_CURSOR_REPORT.md by populating LATEST with the COMMIT 1 SHA.
- Commit that as COMMIT 2.
- Do not re-register COMMIT 2 as the real task.
- Stop after COMMIT 2.

aggio control

