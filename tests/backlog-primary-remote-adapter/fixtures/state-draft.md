# Backlog Item — state not ready

```yaml
schema: backlog-item-v1
id: D-0025-T-DRAFT
title: Draft state must not dispatch
created_at: 2026-08-28T00:00:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main
objective: Draft backlog must not dispatch.
scope:
  allowed_areas:
    - docs/
  forbidden_areas: []
  notes: []
risk_hint: low
complexity_hint: low
planner:
  preferred: glm
  fallback: []
  fallback_policy: gate_only
execution:
  target: cursor
  loop_allowed: false
acceptance:
  - reject
human_gate_required_if: []
context_refs: []
state: DRAFT
```
