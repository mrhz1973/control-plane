# Backlog item — D-9301-G (#55/#51 fresh proof after D-9301-E/F consumed)

```yaml
schema: backlog-item-v1
id: D-9301-G
title: Prove advanced-HEAD propagation, task_ref preservation, single executor invocation, and no canonical fake envelope artifact via injected performTick S13
created_at: 2026-09-06T06:57:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  READ AND MODIFY ONLY tests/local-dev-dispatcher-service-v1/run.mjs.
  Add exactly ONE focused regression named S13, distinct from S11/S12.
  It must prove through injected performTick:
  - advanced HEAD reaches dispatch-loop options;
  - task_ref is preserved through admitted execution;
  - exactly one executor invocation occurs;
  - a fresh fake test task id does NOT cause a canonical
    __dispatch-envelope.json artifact to be persisted.
  Use a fresh fake id not used by historical S11/S12 (do not reuse
  LOCAL_DEV_B_D-11 or LOCAL_DEV_B_D-12).
  Reuse ONLY patterns already visible in the allowed test file.
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
  - Exactly one new focused regression S13 exists in tests/local-dev-dispatcher-service-v1/run.mjs distinct from S11/S12
  - S13 proves advanced HEAD reaches the injected dispatch-loop options
  - S13 proves task_ref is preserved through the admitted execution path
  - S13 proves exactly one executor invocation occurs
  - S13 proves a fresh fake task id does not persist a canonical __dispatch-envelope.json artifact
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
