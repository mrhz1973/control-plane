# Backlog fixture — TMAR TTS dry-run qualification item (issue #90)

DRY-RUN FIXTURE ONLY — never queued in reports/runtime/dev-queue/always-on.
Never consumed by WF90. Bounded harmless read-only/no-op objective against a
harmless TMAR path. This file exists to prove envelope formation and target
governance, NOT to be executed.

```yaml
schema: backlog-item-v1
id: D-9500-T
title: TMAR dry-run qualification no-op
created_at: 2026-09-18T00:00:00Z
created_by: gpt-web
repository: mrhz1973/tmar-tts
branch_target: main

objective: >-
  Read-only qualification: verify docs/current-state.md exists and is
  non-empty; no modification of any file.
scope:
  allowed_areas:
    - docs/current-state.md
  forbidden_areas:
    - tools/**
    - tests/**
    - reports/**
  notes: []

risk_hint: low
complexity_hint: low

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: false
  max_loop_rounds_hint: null

acceptance:
  - docs/current-state.md read and reported unchanged
human_gate_required_if: []
context_refs: []

state: READY_FOR_PLANNING
```
