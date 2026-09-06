# Backlog item — D-9302-B (#52 chain task B; S16 guaranteed-absent)

```yaml
schema: backlog-item-v1
id: D-9302-B
title: Add S16 request validation reports unsupported field name deterministically
created_at: 2026-09-06T12:26:01Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  READ AND MODIFY ONLY tests/local-dev-dispatcher-service-v1/run.mjs.
  Add exactly ONE test named:
  S16 request validation reports unsupported field name deterministically
  Call:
  validateTickRequest({
    schema_version: REQUEST_SCHEMA,
    request_id: "S16_REQ",
    source: "n8n",
    forbidden_s16_field: true
  })
  Prove:
  ok === false
  reason_codes deep-equals:
  [
    "REQUEST_FIELD_UNSUPPORTED",
    "forbidden_s16_field"
  ]
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
  - Exactly one new test named "S16 request validation reports unsupported field name deterministically" exists
  - The test calls validateTickRequest with forbidden_s16_field: true
  - ok === false
  - reason_codes deep-equals ["REQUEST_FIELD_UNSUPPORTED", "forbidden_s16_field"]
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
