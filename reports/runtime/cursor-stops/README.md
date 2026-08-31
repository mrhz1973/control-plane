# Cursor STOP evidence

This directory contains **immutable, bounded, machine-readable STOP events** emitted by Cursor passes.

Canonical method: `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

Filename:

```text
<UTC_TIMESTAMP>__<TASK_REF>.stop.json
```

Canonical first-line commit subject:

```text
cursor-stop: <TASK_REF>
```

Rules:

- one new file per STOP;
- `starting_head` is the exact Cursor `dispatch_base_head` / expected base delivered for that pass;
- commit/push only the STOP artifact when incomplete production/test work must remain dirty and uncommitted;
- do not update `CURRENT_FRONTIER.md` on STOP;
- do not update `docs/runtime/LAST_CURSOR_REPORT.md` on STOP;
- no secrets, raw model output, large logs or diffs;
- `agg`/automation reads only the new STOP artifact selected by the active task's `dispatch_base_head..origin/main` range;
- later GPT-Web commits do not move that dispatch anchor until the STOP/PASS has been ingested;
- exact commit subject allows bounded recovery by `task_ref` after context loss without scanning this directory;
- historical STOP artifacts are never part of CORE BOOT.

`CURRENT_FRONTIER.md` remains LIVE STATE authority. STOP files are evidence only.
