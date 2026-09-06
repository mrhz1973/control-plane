# Backlog item — D-9301-H (#57/#55/#51 fresh proof; S14 guaranteed-absent)

```yaml
schema: backlog-item-v1
id: D-9301-H
title: Add S14 executor STOP normalization preserves bounded failure evidence without leaking stdout/stderr
created_at: 2026-09-06T12:01:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  READ AND MODIFY ONLY tests/local-dev-dispatcher-service-v1/run.mjs.
  Add exactly ONE new regression named:
  S14 executor STOP normalization preserves bounded failure evidence without leaking stdout/stderr
  The test must call the already-imported classificationFromExecutorResult
  with an executor STOP object containing:
  status: STOP
  classification: STOP:S14_SENTINEL
  task_ref: LOCAL_DEV_B_S14_SENTINEL
  reason_codes:
    - S14_REASON_A
    - S14_REASON_B
  and also fake:
  stdout: S14_SECRET_STDOUT
  stderr: S14_SECRET_STDERR
  Acceptance must prove:
  classification === WORK_EXECUTED_STOP
  execution_performed === true
  ok === false
  task_ref === LOCAL_DEV_B_S14_SENTINEL
  executor_classification === STOP:S14_SENTINEL
  reason_codes preserve S14_REASON_A and S14_REASON_B
  serialized bounded result MUST NOT contain S14_SECRET_STDOUT or S14_SECRET_STDERR
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
  - Exactly one new regression named "S14 executor STOP normalization preserves bounded failure evidence without leaking stdout/stderr" exists
  - The test calls classificationFromExecutorResult with STOP:S14_SENTINEL / LOCAL_DEV_B_S14_SENTINEL / S14_REASON_A / S14_REASON_B and fake stdout/stderr secrets
  - classification === WORK_EXECUTED_STOP
  - execution_performed === true
  - ok === false
  - task_ref === LOCAL_DEV_B_S14_SENTINEL
  - executor_classification === STOP:S14_SENTINEL
  - reason_codes preserve S14_REASON_A and S14_REASON_B
  - serialized bounded result does not contain S14_SECRET_STDOUT or S14_SECRET_STDERR
  - node tests/local-dev-dispatcher-service-v1/run.mjs exits 0
  - Only the allowed target file changed by the executor

local_dev:
  dev_profile: qwen38-opus-q3-opencode-24k
  timebox_hint: 900
  max_turns_hint: 8
  test_commands:
    - node tests/local-dev-dispatcher-service-v1/run.mjs

human_gate_required_if: []
context_refs: []

state: READY_FOR_PLANNING
```
