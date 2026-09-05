# Backlog fixture — blocked state (bridge test)

```yaml
schema: backlog-item-v1
id: D-9005-B
title: Wrong state fixture
created_at: 2026-09-05T04:40:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: Must stop because state is BLOCKED.
scope:
  allowed_areas:
    - docs/**
  forbidden_areas: []
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

acceptance: []
human_gate_required_if: []
context_refs: []

state: BLOCKED
```
