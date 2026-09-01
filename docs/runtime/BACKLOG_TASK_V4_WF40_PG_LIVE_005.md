# TASK-V4-WF40-PG-LIVE-005 — first WF40 live authorized execution proof post-PostgreSQL

```yaml
schema: backlog-item-v1
id: TASK-V4-WF40-PG-LIVE-005
title: WF40 live authorized OpenCode execution proof post-PostgreSQL cutover
created_at: 2026-09-01T15:50:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: >-
  Execute exactly one bounded read-only proof through the live WF40 post-WF61
  authorization lane on PostgreSQL production: canonical backlog and route source,
  RESOURCE_STATUS, WF61 planner packet, ROUTING_READY_FOR_DISPATCH, register pending
  once, human Telegram APPROVE once, and exactly one guarded OpenCode/Qwen local
  execution with authorization durably spent.

scope:
  allowed_areas:
    - docs/runtime/
    - reports/architecture/
  forbidden_areas:
    - credentials
    - secrets
    - destructive_changes
  notes:
    - read-only proof artifact only
    - run nonce WF40_PG_FIRST_LIVE_005_20260901_01

risk_hint: low
complexity_hint: low

planner:
  preferred: glm
  fallback: []
  fallback_policy: gate_only

execution:
  target: opencode
  loop_allowed: false
  max_loop_rounds_hint: null

acceptance:
  - exactly one natural WF40 Schedule Trigger target event while D-0025 armed
  - exactly one provider call
  - register pending accepted once with exact eight-key schema
  - exactly one Telegram APPROVE
  - exactly one OpenCode execution and one Qwen generation
  - authorization final state SPENT

human_gate_required_if:
  - human Telegram APPROVE for runtime authorization issuance

context_refs:
  - docs/runtime/CURRENT_FRONTIER.md
  - reports/architecture/v4_n8n_postgres_execution_entity_sequence_resync_and_cutover_tick_validation_retry.md

state: READY_FOR_PLANNING
```

Trigger: 2026-09-01 — post-PostgreSQL cutover first full WF40 live authorized execution proof (005).
