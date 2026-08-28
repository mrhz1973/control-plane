# Backlog Item — bad fallback policy

```yaml
schema: backlog-item-v1
id: D-0025-T-POLICY
title: Non gate_only policy must reject
created_at: 2026-08-28T00:00:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main
objective: Only gate_only is allowed for D-0025 primary-remote.
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
  fallback_policy: normal
execution:
  target: cursor
  loop_allowed: false
acceptance:
  - reject
human_gate_required_if: []
context_refs: []
state: READY_FOR_PLANNING
```
