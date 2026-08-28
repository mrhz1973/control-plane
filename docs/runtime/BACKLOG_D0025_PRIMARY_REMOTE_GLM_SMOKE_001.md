# D-0025-W primary remote GLM single-smoke backlog

```yaml
schema: backlog-item-v1
id: D-0025-W-SMOKE-GLM-001
title: Primary remote GLM single smoke
created_at: 2026-08-28T15:34:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: >-
  Generate one canonical bounded Execution Packet for a documentation-only
  control-plane verification task. This smoke validates planning output only;
  no implementation, runtime mutation, deployment, credential action, network
  action, or Cursor dispatch is authorized.

scope:
  allowed_areas:
    - reports/architecture/
    - docs/runtime/
  forbidden_areas:
    - credentials
    - secrets
    - networking
    - deployment
    - workflows
    - runtime mutation
  notes:
    - single GLM primary-remote smoke only

risk_hint: low
complexity_hint: low

planner:
  preferred: glm
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: false
  max_loop_rounds_hint: null

acceptance:
  - planner returns one structurally valid canonical Execution Packet
  - task_id remains D-0025-W-SMOKE-GLM-001
  - no implementation is executed
  - no Cursor dispatch occurs
  - no credential, network, workflow or runtime mutation is proposed as already authorized

human_gate_required_if:
  - any implementation or runtime mutation would be required
  - any credential or secret action would be required
  - any network or deployment action would be required

context_refs:
  - docs/runtime/CURRENT_FRONTIER.md
  - docs/contracts/execution-packet-v1.md
  - docs/contracts/backlog-primary-remote-adapter-v1.md

state: READY_FOR_PLANNING
```
