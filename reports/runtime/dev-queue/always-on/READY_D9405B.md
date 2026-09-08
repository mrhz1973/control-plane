# Backlog item — D-9405-B (Qwen independent qualification 2/3)

```yaml
schema: backlog-item-v1
id: D-9405-B
title: Qwen independent qualification 2 of 3 — fresh two-file coding and deterministic tests
created_at: 2026-09-08T21:47:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Fresh qualification task. Implement a tiny dependency-free Node utility plus its deterministic focused test.

  Create exactly:
  - reports/runtime/qwen-qualification/qval2/integer-summary.mjs
  - tests/qwen-independent-qval2/run.mjs

  Utility contract:
  - CLI input is one JSON string argument representing an array.
  - Accept only arrays containing integers.
  - Valid non-empty input prints one compact JSON line with keys in this exact order: count,sum,min,max.
  - Empty array prints exactly: {"count":0,"sum":0,"min":null,"max":null}
  - Invalid JSON, non-array input, or any non-integer element prints exactly INVALID_INTEGER_ARRAY to stderr and exits 2.
  - Valid input exits 0.
  - No external dependencies, network, filesystem writes, environment reads, timestamps, randomness, or platform-specific paths.

  Focused test must execute the utility as a child process and prove at minimum:
  - [4,1,7] => {"count":3,"sum":12,"min":1,"max":7}
  - [] => {"count":0,"sum":0,"min":null,"max":null}
  - [2,-3,5] => {"count":3,"sum":4,"min":-3,"max":5}
  - [1,2.5] => exit 2 + INVALID_INTEGER_ARRAY
  - object input => exit 2 + INVALID_INTEGER_ARRAY
  - malformed JSON => exit 2 + INVALID_INTEGER_ARRAY

  This task is intentionally independent from D-9405-A output and must not read it.

scope:
  allowed_areas:
    - reports/runtime/qwen-qualification/qval2/integer-summary.mjs
    - tests/qwen-independent-qval2/run.mjs
  forbidden_areas:
    - tools/**
    - workflows/**
    - configs/**
    - docs/**
    - .github/**
  notes: []

risk_hint: low
complexity_hint: low

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: false
  max_loop_rounds_hint: 0

acceptance:
  - both files are newly created by this execution
  - utility behavior matches the exact contract
  - focused test covers all required cases and exits 0
  - no Cursor GLM Codex Hermes or provider model call assists execution
  - no seeded implementation
  - no manual tick
  - only the two allowed files changed
  - selective commit push and remote verification succeed

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 1800
  max_turns_hint: 16
  test_commands:
    - node tests/qwen-independent-qval2/run.mjs

human_gate_required_if: []
context_refs:
  - reports/architecture/v4_qwen_independent_3run_qualification_campaign_v1.md

state: READY_FOR_PLANNING
```
