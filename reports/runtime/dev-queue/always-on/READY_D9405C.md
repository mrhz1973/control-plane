# Backlog item — D-9405-C (Qwen independent qualification 3/3 — cold recovery)

```yaml
schema: backlog-item-v1
id: D-9405-C
title: Qwen independent qualification 3 of 3 — cold-recovery three-file coding task
created_at: 2026-09-08T21:48:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Final qualification task. This task MUST remain gated until D-9405-A and D-9405-B have both produced independent executor-pass outcomes and the exact 64K Qwen runtime has then been deliberately placed into a separately evidenced canonical cold/not-ready state without Cursor, GLM, Codex, Hermes, or provider-model assistance.

  After that gate is released, natural WF90 must recover the exact profile qwen38-opus-q3-opencode-64k through QWEN_PREFLIGHT and execute this fresh task.

  Create exactly:
  - reports/runtime/qwen-qualification/qval3/kv-lines.mjs
  - tests/qwen-independent-qval3/run.mjs
  - reports/runtime/qwen-qualification/QVAL3_COLD_RECOVERY.md

  kv-lines.mjs contract:
  - CLI input is one UTF-8 file path.
  - Read text lines from that file only; never write to it.
  - Ignore blank lines and lines whose first non-space character is #.
  - Every other line must contain exactly one first '=' separator with non-empty trimmed key; value is the remainder after the first '=' and is trimmed.
  - Duplicate keys are invalid.
  - Malformed input prints exactly INVALID_KV_LINES to stderr and exits 2.
  - Valid input prints one compact JSON object with keys sorted lexicographically and exits 0.
  - No external dependencies, network, environment reads, timestamps, randomness, or hard-coded workstation paths.

  Focused test must create its temporary fixtures only under the OS temp directory and clean them up. Prove at minimum:
  - ordinary two-key input parses and key output is sorted;
  - blank/comment lines are ignored;
  - values may contain additional '=' characters;
  - duplicate key => exit 2 + INVALID_KV_LINES;
  - missing '=' => exit 2 + INVALID_KV_LINES;
  - empty key => exit 2 + INVALID_KV_LINES.

  QVAL3_COLD_RECOVERY.md must contain:
  QWEN_INDEPENDENT_QUALIFICATION=3
  TASK_REF=D-9405-C
  MODE=COLD_RECOVERY_FRESH
  MODEL_EXPECTED=qwen38-opus-q3-opencode-64k
  CURSOR_ASSIST=0
  GLM_CALLS=0
  CODEX_CALLS=0
  HERMES_CALLS=0
  RESULT=PASS

scope:
  allowed_areas:
    - reports/runtime/qwen-qualification/qval3/kv-lines.mjs
    - tests/qwen-independent-qval3/run.mjs
    - reports/runtime/qwen-qualification/QVAL3_COLD_RECOVERY.md
  forbidden_areas:
    - tools/**
    - workflows/**
    - configs/**
    - docs/**
    - .github/**
  notes: []

risk_hint: low
complexity_hint: medium

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: false
  max_loop_rounds_hint: 0

acceptance:
  - D-9405-A and D-9405-B independent executor-pass outcomes already exist before release
  - exact 64K Qwen runtime cold/not-ready state is independently evidenced immediately before release
  - natural WF90 only; no manual tick
  - QWEN_PREFLIGHT restores exact qwen38-opus-q3-opencode-64k with runtime_ready=true
  - all three files are newly created by this execution
  - focused test exits 0
  - no Cursor GLM Codex Hermes or provider model call assists execution
  - no seeded implementation
  - only the three allowed files changed
  - selective commit push and remote verification succeed
  - at least two subsequent natural WF90 ticks are IDLE_CLEAN with no duplicate D-9405-C execution

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 3600
  max_turns_hint: 24
  test_commands:
    - node tests/qwen-independent-qval3/run.mjs

human_gate_required_if:
  - QWEN_64K_COLD_STATE_PREP_REQUIRED_AFTER_D9405A_AND_D9405B_PASS
context_refs:
  - reports/architecture/v4_qwen_independent_3run_qualification_campaign_v1.md

state: GATED
```
