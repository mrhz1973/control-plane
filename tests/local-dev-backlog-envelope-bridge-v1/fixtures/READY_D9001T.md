# Backlog fixture — valid READY item (bridge test)

```yaml
schema: backlog-item-v1
id: D-9001-T
title: Append campaign marker to runtime notes
created_at: 2026-09-05T04:40:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: Append the declared marker block to docs/runtime/CAMPAIGN_NOTES.md without altering existing content.
scope:
  allowed_areas:
    - docs/runtime/CAMPAIGN_NOTES.md
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
  - Marker line present exactly once at end of file
human_gate_required_if: []
context_refs: []

state: READY_FOR_PLANNING
```
