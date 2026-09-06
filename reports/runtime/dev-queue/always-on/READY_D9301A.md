# Backlog item — D-9301-A (GPT-Web authorized REAL MICRO_TASK_DELTA)

```yaml
schema: backlog-item-v1
id: D-9301-A
title: Add dispatcher safe-FF advanced-HEAD propagation regression
created_at: 2026-09-06T00:07:52Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: Modify ONLY tests/local-dev-dispatcher-service-v1/run.mjs by adding exactly one focused service-level test proving that when verifyRepo reports a successful safe fast-forward and returns an advanced HEAD, performTick passes that advanced HEAD as both head/commit into the real injected dispatch-loop options and may continue to exactly one admitted executor call.
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
  - Exactly one new focused service-level test exists in tests/local-dev-dispatcher-service-v1/run.mjs covering safe-FF advanced HEAD propagation into dispatch-loop options
  - The new test proves performTick passes the advanced HEAD as both head and commit into the injected dispatch-loop options after verifyRepo reports successful safe fast-forward
  - The new test proves exactly one admitted executor call may continue after that path
  - node tests/local-dev-dispatcher-service-v1/run.mjs exits 0
  - Only the allowed target file changed by the executor

local_dev:
  test_commands:
    - node tests/local-dev-dispatcher-service-v1/run.mjs

human_gate_required_if: []
context_refs: []

state: READY_FOR_PLANNING
```
