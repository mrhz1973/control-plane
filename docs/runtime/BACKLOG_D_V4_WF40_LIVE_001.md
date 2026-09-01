# D-V4-WF40-LIVE-001 — first WF40 live authorized execution proof

```yaml
schema: backlog-item-v1
id: D-V4-WF40-LIVE-001
title: Read-only WF40 live authorized OpenCode execution proof
created_at: 2026-09-01T00:05:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: >-
  Execute exactly one bounded read-only proof through the live WF40 post-WF61
  authorization lane: canonical backlog and route source, RESOURCE_STATUS,
  WF61 planner packet, ROUTING_READY_FOR_DISPATCH, register pending once,
  human Telegram APPROVE once, and exactly one guarded OpenCode/Qwen local
  execution with authorization durably spent. No scope expansion.

scope:
  allowed_areas:
    - docs/runtime/
    - reports/architecture/
  forbidden_areas:
    - credentials
    - secrets
    - destructive_changes
    - network_mutations
  notes:
    - read-only proof artifact only
    - no automatic Cursor dispatch

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
  - WF40 executes exactly once for this backlog commit
  - WF61 executes exactly once and returns a valid execution-packet-v1
  - remote planner calls are at most one
  - register pending accepted exactly once with exact eight-key schema
  - exactly one Telegram decision message and one human APPROVE
  - exactly one OpenCode execution and one Qwen generation
  - authorization final state is SPENT with no ACTIVE authorization remaining

human_gate_required_if:
  - human Telegram APPROVE for runtime authorization issuance

context_refs:
  - docs/runtime/CURRENT_FRONTIER.md
  - docs/contracts/v4-wf40-live-execution-sidecar-source-v1.md

state: READY_FOR_PLANNING
```

Trigger: 2026-09-01 — resume WF40 first live authorized execution proof after canonical manager/worker occupancy fix.

Retry trigger 2: 2026-09-01 — gate armed; execute D-V4-WF40-LIVE-001 once.

Retry trigger 3: 2026-09-01 — n8n scheduler restored; gate armed; execute D-V4-WF40-LIVE-001 once.

Retry trigger 5: 2026-09-01 — WF40 publish/scheduler state repaired; scheduler healthy; gate armed; execute D-V4-WF40-LIVE-001 once.
