# Backlog item — D-9402-A (#74 orphaned LOCAL_DEV claim recovery)

```yaml
schema: backlog-item-v1
id: D-9402-A
title: Add durable LOCAL_DEV receipt lifecycle and safe pre-execution replay
created_at: 2026-09-07T21:30:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Fix issue #74 without widening LOCAL_DEV authority.

  Current bug: selector/bridge treat every receipt task_ref as permanently claimed, while the always-on dispatcher persists the receipt before admission/execution. A pre-execution reject/crash can therefore poison a READY item forever.

  Implement a backwards-compatible receipt lifecycle using the existing receipts.json ledger. New receipts must carry explicit state. Preserve legacy receipts with no state as blocking. Centralize blocking semantics so selector and bridge agree.

  Required semantics:
  - CLAIMED = executor not started; fresh CLAIMED blocks. A stale CLAIMED with execution_started=false may become replay-eligible only after a conservative bounded recovery age.
  - EXECUTING = executor may have started; always blocks automatic replay.
  - PASS = terminal; always blocks.
  - STOP = terminal; blocks unless replayable=true and execution_started=false, reserved for a proven pre-execution stop such as MICRO_TASK admission rejection.
  - unknown/invalid lifecycle state blocks fail-closed.

  In the always-on dispatcher, persist lifecycle transitions atomically: initial CLAIMED; admission rejection -> STOP replayable=true execution_started=false; immediately before runExecutor -> EXECUTING execution_started=true; after executor result -> PASS or STOP replayable=false. If runExecutor throws, persist STOP replayable=false because execution status is not safely replayable.

  Do not auto-replay legacy receipts or EXECUTING/unknown receipts. Do not delete historical receipts. Do not change WF90/n8n/Tailscale/Telegram/public routing.

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
  - legacy no-state receipt still blocks duplicate selection/bridge
  - fresh CLAIMED blocks; only conservatively stale CLAIMED with execution_started=false is replay-eligible
  - EXECUTING and PASS always block; STOP blocks unless replayable=true and execution_started=false
  - admission rejection leaves durable replayable pre-execution STOP instead of poisoning the task
  - executor start is durably EXECUTING before runExecutor is invoked
  - executor PASS/STOP and thrown execution error persist non-replayable terminal state
  - receipts persistence is atomic/fail-closed and historical entries are preserved
  - focused regression proves pre-execution STOP can be selected/bridged again while unknown execution state cannot
  - existing single-flight and repo-hygiene behavior remain unchanged
  - node tests/local-dev-dispatcher-service-v1/run.mjs exits 0
  - only the four allowed files are changed by the executor

local_dev:
  dev_profile: qwen38-opus-q3-opencode-24k
  timebox_hint: 900
  max_turns_hint: 16
  test_commands:
    - node tests/local-dev-dispatcher-service-v1/run.mjs

human_gate_required_if: []
context_refs:
  - github:mrhz1973/control-plane#74

state: READY_FOR_PLANNING
```
