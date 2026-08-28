# Backlog Item — non-empty fallback reject

```yaml
schema: backlog-item-v1
id: D-0025-T-FALLBACK
title: Non-empty fallback must reject
created_at: 2026-08-28T00:00:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main
objective: Non-empty fallback is forbidden for D-0025 primary-remote.
scope:
  allowed_areas:
    - docs/
  forbidden_areas: []
  notes: []
risk_hint: low
complexity_hint: low
planner:
  preferred: glm
  fallback:
    - codex
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
