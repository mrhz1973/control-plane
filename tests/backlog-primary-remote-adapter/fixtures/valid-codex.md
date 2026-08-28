# Backlog Item D-0025-T — Codex primary remote adapter test

```yaml
schema: backlog-item-v1
id: D-0025-T-CODEX
title: Codex primary remote adapter fixture
created_at: 2026-08-28T00:00:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main
objective: Validate deterministic Codex backlog mapping without provider calls.
scope:
  allowed_areas:
    - docs/contracts/
  forbidden_areas:
    - credentials/
  notes: []
risk_hint: medium
complexity_hint: high
planner:
  preferred: codex
  fallback: []
  fallback_policy: gate_only
execution:
  target: cursor
  loop_allowed: false
acceptance:
  - Codex mapping is fail-closed when gate disabled
human_gate_required_if:
  - OAuth mutation would be required
context_refs:
  - docs/contracts/backlog-primary-remote-adapter-v1.md
state: READY_FOR_PLANNING
```
