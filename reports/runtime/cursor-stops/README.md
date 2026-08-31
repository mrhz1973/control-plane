# Cursor STOP evidence

This directory contains **immutable, bounded, machine-readable STOP events** emitted by Cursor passes.

Canonical method: `docs/foundation/PROMPT_SEQUENCING_GATE.md`.

Filename:

```text
<UTC_TIMESTAMP>__<TASK_REF>.stop.json
```

Rules:

- one new file per STOP;
- commit/push only the STOP artifact when incomplete production/test work must remain dirty and uncommitted;
- do not update `CURRENT_FRONTIER.md` on STOP;
- do not update `docs/runtime/LAST_CURSOR_REPORT.md` on STOP;
- no secrets, raw model output, large logs or diffs;
- `agg`/automation reads only the new STOP artifact selected by the Git push/delta for the expected task;
- historical STOP artifacts are never part of CORE BOOT.

`CURRENT_FRONTIER.md` remains LIVE STATE authority. STOP files are evidence only.
