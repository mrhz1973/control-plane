# Execution Checkpoint contract v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/execution-checkpoint-v1.md`  
**Version:** `execution-checkpoint-v1`  
**Date:** 2026-08-25  
**Status:** `DESIGN CONTRACT — DOCS ONLY`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

The Execution Checkpoint is the persistent resume artifact for a Cursor task that has not yet reached final PASS.

It exists so that a new Cursor context window can continue from GitHub without asking the operator what happened in the previous session.

A checkpoint is **not** a PASS claim and does not self-certify Git state.

---

## 1. Minimum YAML contract

```yaml
schema: execution-checkpoint-v1
checkpoint_id: CP-D-NNNN-X-r1-n1
task_id: D-NNNN-X
execution_packet_ref: <path/id>
execution_packet_revision: 1
created_at: <ISO-8601>
created_by: cursor

repository: owner/repo
branch: main
head_observed: <sha>
origin_main_observed: <sha|null>
workspace_status: CLEAN|DIRTY_EXPECTED|DIRTY_UNEXPECTED|UNKNOWN

status: IN_PROGRESS|BLOCKED|READY_FOR_REVIEW|GATED
loop_round: <integer>
review_round: <integer>

completed_steps: []
remaining_steps: []
files_changed: []

tests_run: []
test_results: []
open_findings: []
resolved_findings: []

gates_open: []
blockers: []

next_action: <one concrete action>
resume_read_set: []

context_note: <short factual note|null>
```

---

## 2. When a checkpoint is required

A checkpoint must be written before any intentional context rollover when the task is incomplete.

It is also required when:

- the Cursor session is becoming context-heavy or repetitive;
- the loop reaches a configured checkpoint interval;
- the task becomes blocked;
- a human gate is opened;
- review returns findings that will be fixed in a later session;
- execution is paused for provider/quota availability;
- the active model/agent is about to change and state is not trivially reconstructible from commits.

---

## 3. Resume invariant

A fresh Cursor session must be able to resume with:

```text
Execution Packet
+ latest Execution Checkpoint
+ live Git state
= sufficient context to continue
```

The new session must not require the previous chat transcript.

Before continuing it must verify:

1. correct repository;
2. correct branch;
3. current HEAD/origin relationship;
4. workspace state;
5. that the active Execution Packet revision still matches the checkpoint;
6. that no new gate invalidated `next_action`.

If repository state contradicts the checkpoint, live Git state wins and the discrepancy is reported.

---

## 4. `next_action` rule

`next_action` contains **one** concrete next step, not a new plan.

Good:

```yaml
next_action: Run the targeted proxy test that reproduces finding B-02.
```

Bad:

```yaml
next_action: Continue working on the task until everything is fixed.
```

---

## 5. Test evidence

`tests_run` and `test_results` record only tests actually executed.

Example:

```yaml
tests_run:
  - command: pytest tests/test_proxy.py -q
    run_at: 2026-08-25T12:44:00Z

test_results:
  - command: pytest tests/test_proxy.py -q
    result: FAIL
    summary: 1 failed, 18 passed
    finding_ref: B-02
```

Do not convert an unexecuted planned test into PASS evidence.

---

## 6. Findings

Open Bugbot/reviewer/test findings must survive rollover.

Each finding should have a stable short identifier when possible:

```yaml
open_findings:
  - id: B-02
    source: bugbot
    summary: Null response path can bypass the new guard.
    status: OPEN
```

A new session should not relaunch closed review work without a concrete reason.

---

## 7. Git verification boundary

A checkpoint may record observed Git hashes, but it does not replace the canonical post-push verification contract in `CURSOR_PROMPT_TEMPLATE.md`.

Final PASS still requires the repository evidence defined by the foundation.

If a checkpoint records a dirty workspace, it must distinguish expected task changes from unexpected unrelated changes.

---

## 8. Example

```yaml
schema: execution-checkpoint-v1
checkpoint_id: CP-D-0094-W-r1-n2
task_id: D-0094-W
execution_packet_ref: docs/execution/D-0094-W-r1.yaml
execution_packet_revision: 1
created_at: 2026-08-25T12:50:00Z
created_by: cursor

repository: mrhz1973/Planet-Clone
branch: main
head_observed: abcdef1234567890
origin_main_observed: abcdef1234567890
workspace_status: DIRTY_EXPECTED

status: IN_PROGRESS
loop_round: 2
review_round: 0

completed_steps:
  - reproduced failing health-check case
  - identified faulty null-response branch
remaining_steps:
  - implement minimum guard
  - run targeted tests
  - inspect diff
files_changed: []

tests_run:
  - pytest tests/test_proxy.py -q
test_results:
  - result: FAIL
    summary: 1 failed, 18 passed
open_findings:
  - id: T-01
    source: test
    summary: expected failure reproduced
resolved_findings: []

gates_open: []
blockers: []

next_action: Implement the minimum guard in proxy.py for the reproduced null-response path.
resume_read_set:
  - docs/execution/D-0094-W-r1.yaml
  - proxy.py
  - tests/test_proxy.py

context_note: No scope expansion observed.
```

---

## 9. Quality invariant

The checkpoint is incomplete if the next session must ask any of:

- What task was I doing?
- Which packet revision applies?
- What commit/branch was observed?
- What was already completed?
- Which tests ran and what happened?
- Which findings are still open?
- What is the next concrete action?

---

## 10. Hard boundaries

A checkpoint never authorizes scope expansion, destructive actions, runtime activation, PM-34, L5, permanent schedules or permanent loops.

---

**End of contract.**
