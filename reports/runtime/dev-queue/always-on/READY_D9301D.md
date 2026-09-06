# Backlog item — D-9301-D (fresh autonomous #51 proof)

```yaml
schema: backlog-item-v1
id: D-9301-D
title: Prove dispatcher safe-FF advanced HEAD reaches the admitted executor path
created_at: 2026-09-06T01:40:17Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  READ AND MODIFY ONLY:
  tests/local-dev-dispatcher-service-v1/run.mjs
  Add exactly ONE focused service-level regression proving:
  - successful safe-FF repo verification returns an advanced HEAD;
  - performTick forwards that advanced HEAD as head/commit into the injected dispatch-loop options;
  - exactly one admitted executor call may continue.

  Do not read, search, grep or inspect any other repository file.
  Do not inspect implementation source, tools/**, docs/** or configs/**.
  Reuse only patterns already present in the allowed test file.
  No repository exploration. No subagents. No delegation.
  Make the smallest required edit. Run only the focused test.
  Stop immediately when acceptance is green.

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
  - Exactly one new focused service-level regression is added to tests/local-dev-dispatcher-service-v1/run.mjs
  - The new regression proves successful safe-FF verification returns an advanced HEAD and performTick forwards it as both head and commit into the injected dispatch-loop options
  - Exactly one admitted executor call continues in that regression
  - node tests/local-dev-dispatcher-service-v1/run.mjs exits 0
  - Only the allowed target file is read and modified by the executor

local_dev:
  dev_profile: qwen38-opus-q3-opencode-24k
  timebox_hint: 900
  max_turns_hint: 12
  test_commands:
    - node tests/local-dev-dispatcher-service-v1/run.mjs

human_gate_required_if: []
context_refs: []
state: READY_FOR_PLANNING
```
