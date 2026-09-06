# Backlog item — D-9301-E (fresh #51 autonomous proof)

```yaml
schema: backlog-item-v1
id: D-9301-E
title: Prove advanced-HEAD repo verification reaches dispatch-loop options and single admitted execution without task_ref loss
created_at: 2026-09-06T02:11:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  READ AND MODIFY ONLY tests/local-dev-dispatcher-service-v1/run.mjs.
  Add exactly ONE NEW useful focused regression, different from the fixed
  advanced-HEAD harness test already present in that file.
  Regression objective: prove successful repo verification with an advanced
  HEAD reaches the real dispatch-loop options and the admitted execution path
  without losing task_ref or performing more than one executor call.
  Reuse ONLY patterns visible in the allowed test file.
  No tools/** reads. No docs/** reads. No repository exploration.
  No subagents. No delegation.
scope:
  allowed_areas:
    - tests/local-dev-dispatcher-service-v1/run.mjs
  forbidden_areas:
    - tools/**
    - configs/**
    - scripts/**
    - .github/**
    - workflows/**
    - docs/**
  notes: []

risk_hint: low
complexity_hint: low

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: true
  max_loop_rounds_hint: 2

acceptance:
  - Exactly one new focused regression exists in tests/local-dev-dispatcher-service-v1/run.mjs distinct from the advanced-HEAD harness test
  - The new regression proves successful repo verification with an advanced HEAD reaches the injected dispatch-loop options
  - The new regression proves the admitted execution path preserves task_ref end to end
  - The new regression proves no more than one executor call is performed
  - node tests/local-dev-dispatcher-service-v1/run.mjs exits 0
  - Only the allowed target file changed by the executor

local_dev:
  dev_profile: qwen38-opus-q3-opencode-24k
  timebox_hint: 900
  max_turns_hint: 10
  test_commands:
    - node tests/local-dev-dispatcher-service-v1/run.mjs

human_gate_required_if: []
context_refs: []

state: READY_FOR_PLANNING
```
