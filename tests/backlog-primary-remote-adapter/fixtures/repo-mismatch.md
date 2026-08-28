# Backlog Item — repository mismatch

```yaml
schema: backlog-item-v1
id: D-0025-T-REPO
title: Repository mismatch must reject
created_at: 2026-08-28T00:00:00Z
created_by: gpt-web
repository: other/org-repo
branch_target: main
objective: Repository mismatch must reject.
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
state: READY_FOR_PLANNING
```
