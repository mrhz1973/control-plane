# Backlog fixture — READY dispatch stub item (segment-3 live dispatch)

```yaml
schema: backlog-item-v1
id: D-9007-Q
title: Create queue dispatch notes stub
created_at: 2026-09-05T05:30:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: Create the new file docs/runtime/QUEUE_DISPATCH_NOTES.md whose entire content is exactly one line with the text "queue-dispatch-stub: LOCAL_DEV_B_D-9007-Q".
scope:
  allowed_areas:
    - docs/runtime/QUEUE_DISPATCH_NOTES.md
  forbidden_areas:
    - tools/**
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
  - File docs/runtime/QUEUE_DISPATCH_NOTES.md exists and contains exactly one line with the text "queue-dispatch-stub: LOCAL_DEV_B_D-9007-Q"
human_gate_required_if: []
context_refs: []

state: READY_FOR_PLANNING
```
