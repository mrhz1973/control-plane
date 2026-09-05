# Backlog fixture â€” loop allowed with hints (bridge test)

```yaml
schema: backlog-item-v1
id: D-9002-L
title: Loop-allowed fixture with local_dev hints
created_at: 2026-09-05T04:40:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: Prove loop mapping and hint clamping.
scope:
  allowed_areas:
    - docs/runtime/**
  forbidden_areas: []
  notes: []

risk_hint: medium
complexity_hint: medium

planner:
  preferred: glm
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: true
  max_loop_rounds_hint: 3

acceptance:
  - Marker present
human_gate_required_if: []
context_refs: []

state: READY_FOR_PLANNING

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  test_commands:
    - git diff --check
  timebox_hint: 99999
  max_turns_hint: 2
```
