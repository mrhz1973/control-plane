# Backlog item — D-9302-D (#52 chain task D; S17 guaranteed-absent)

```yaml
schema: backlog-item-v1
id: D-9302-D
title: Add S17 wrapTickResult truncates reason_codes to sixteen preserving order
created_at: 2026-09-06T13:06:01Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  READ AND MODIFY ONLY tests/local-dev-dispatcher-service-v1/run.mjs.
  Add exactly ONE new test named:
  S17 wrapTickResult truncates reason_codes to sixteen preserving order
  Construct a source reason_codes array containing exactly:
  R00 R01 R02 ... R19
  Call:
  wrapTickResult({
    ok: false,
    request_id: "S17_REQ",
    classification: "SERVICE_ERROR",
    reason_codes
  })
  Prove:
  result.reason_codes.length === 16
  and deep-equals exactly:
  [
    "R00","R01","R02","R03",
    "R04","R05","R06","R07",
    "R08","R09","R10","R11",
    "R12","R13","R14","R15"
  ]
  Also prove original source array still has length 20.
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
  - Exactly one new test named "S17 wrapTickResult truncates reason_codes to sixteen preserving order" exists
  - The test constructs reason_codes R00..R19 and calls wrapTickResult with SERVICE_ERROR
  - result.reason_codes.length === 16
  - result.reason_codes deep-equals R00..R15 in order
  - original source array still has length 20
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
