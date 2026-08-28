# Backlog Item D-0025-T — GLM primary remote adapter test

```yaml
schema: backlog-item-v1
id: D-0025-T-GLM
title: GLM primary remote adapter fixture
created_at: 2026-08-28T00:00:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main
objective: >
  Validate deterministic GLM backlog mapping into consumer_input and routing_input
  without provider calls or inference.
scope:
  allowed_areas:
    - docs/contracts/
    - tools/
  forbidden_areas:
    - credentials/
    - secrets/
  notes: []
risk_hint: low
complexity_hint: medium
planner:
  preferred: glm
  fallback: []
  fallback_policy: gate_only
execution:
  target: cursor
  loop_allowed: false
  max_loop_rounds_hint: null
acceptance:
  - Adapter emits REMOTE_DISPATCH_READY only when gate is armed
human_gate_required_if:
  - provider inference would be required
context_refs:
  - docs/contracts/backlog-primary-remote-adapter-v1.md
state: READY_FOR_PLANNING
```
