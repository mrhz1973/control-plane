# Backlog item — D-9402-B (#74 retry on 64K DEV profile)

```yaml
schema: backlog-item-v1
id: D-9402-B
title: Retry durable LOCAL_DEV receipt lifecycle on 64K OpenCode profile
created_at: 2026-09-07T21:37:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Retry the bounded #74 orphaned-claim lifecycle fix after D-9402-A stopped before edits because its 24K OpenCode profile overflowed context (request 31302 > available 24576 tokens).

  Implement the same backwards-compatible receipt lifecycle without widening LOCAL_DEV authority. Centralize receipt blocking/replay semantics so selector and bridge agree. New receipts use explicit lifecycle state; legacy no-state receipts remain blocking fail-closed.

  Required lifecycle: CLAIMED (fresh blocks; only conservatively stale + execution_started=false may replay), EXECUTING (always blocks), PASS (terminal blocks), STOP (blocks unless replayable=true and execution_started=false for proven pre-execution stop). Unknown/invalid states block.

  Dispatcher persistence transitions: initial CLAIMED; admission rejection -> STOP replayable=true execution_started=false; immediately before runExecutor -> EXECUTING execution_started=true; executor result -> PASS or STOP replayable=false; thrown execution error -> STOP replayable=false. Preserve historical receipts; no manual receipt deletion or rewrite.

scope:
  allowed_areas:
    - tools/bridge-backlog-to-local-dev-envelope-v1.mjs
    - tools/select-local-dev-queue-item-v1.mjs
    - tools/serve-local-dev-autonomous-dispatcher-v1.mjs
    - tests/local-dev-dispatcher-service-v1/run.mjs
  forbidden_areas:
    - workflows/**
    - docs/**
    - reports/architecture/**
    - configs/**
    - .github/**

risk_hint: medium
complexity_hint: medium

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: true
  max_loop_rounds_hint: 2

acceptance:
  - legacy no-state receipt still blocks duplicate selection and bridge
  - fresh CLAIMED blocks; only conservatively stale CLAIMED with execution_started=false is replay-eligible
  - EXECUTING and PASS always block; STOP blocks unless replayable=true and execution_started=false
  - admission rejection persists replayable pre-execution STOP instead of poisoning the task
  - executor start is durably EXECUTING before runExecutor invocation
  - executor PASS/STOP and thrown execution error persist non-replayable terminal state
  - receipts persistence is atomic and fail-closed; historical entries are preserved
  - focused regression proves replay of proven pre-execution STOP and refusal when execution state is unknown
  - existing single-flight and repo-hygiene behavior remain unchanged
  - node tests/local-dev-dispatcher-service-v1/run.mjs exits 0
  - only the four allowed files are changed by the executor

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 900
  max_turns_hint: 16
  test_commands:
    - node tests/local-dev-dispatcher-service-v1/run.mjs

human_gate_required_if: []
context_refs:
  - github:mrhz1973/control-plane#74
  - github:mrhz1973/control-plane@27176c7643515c316dfdafaf622b1ca01565f326:reports/runtime/dev-queue/always-on/READY_D9402A.md

state: READY_FOR_PLANNING
```
