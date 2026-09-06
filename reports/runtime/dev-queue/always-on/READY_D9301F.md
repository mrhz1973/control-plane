# Backlog item — D-9301-F (#51 proof successor after D-9301-E crash)

```yaml
schema: backlog-item-v1
id: D-9301-F
title: Prove advanced-HEAD repo verification reaches dispatch-loop options with preserved task_ref and exactly one executor invocation
created_at: 2026-09-06T06:09:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  READ AND MODIFY ONLY tests/local-dev-dispatcher-service-v1/run.mjs.
  Add exactly ONE new focused regression, distinct from the existing S11
  advanced-HEAD harness test, proving:
  - successful advanced-HEAD repo verification reaches dispatch-loop options;
  - task_ref remains preserved through admitted execution;
  - exactly one executor invocation occurs.
  Reuse ONLY patterns visible in the allowed test file.
  No other repo reads. No tools/**. No docs/**. No exploration.
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
  - Exactly one new focused regression exists in tests/local-dev-dispatcher-service-v1/run.mjs distinct from the S11 advanced-HEAD harness test
  - The new regression proves successful advanced-HEAD repo verification reaches the injected dispatch-loop options
  - The new regression proves task_ref is preserved through the admitted execution path
  - The new regression proves exactly one executor invocation occurs
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
