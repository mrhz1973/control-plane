# Backlog Item — Qwen deferred reject

```yaml
schema: backlog-item-v1
id: D-0025-T-QWEN
title: Qwen preferred must reject
created_at: 2026-08-28T00:00:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main
objective: Qwen must not enter the primary-remote lane.
scope:
  allowed_areas:
    - docs/
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
acceptance:
  - reject
human_gate_required_if: []
context_refs: []
state: READY_FOR_PLANNING
```
