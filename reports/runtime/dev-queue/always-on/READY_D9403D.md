# Backlog item — D-9403-D (post-#76 Qwen smoke with acceptance test cycles)

```yaml
schema: backlog-item-v1
id: D-9403-D
title: Post-#76 Qwen smoke with loop_allowed for deterministic test cycles
created_at: 2026-09-08T06:52:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Successor after D-9403-C WORK_EXECUTED_PASS with max_test_cycles=0
  (loop_allowed false) so tests_state stayed NOT_STARTED. Rewrite the
  existing tracked evidence file reports/runtime/qwen-smoke/QWEN_POST76_SMOKE_20260908.md
  so it still contains the four required markers and also includes the line
  TASK_REF=D-9403-D. Then deterministic acceptance must run and pass, and
  persistence commit/push must succeed on the 64K OpenCode profile.

scope:
  allowed_areas:
    - reports/runtime/qwen-smoke/QWEN_POST76_SMOKE_20260908.md
  forbidden_areas:
    - tools/**
    - tests/**
    - workflows/**
    - configs/**
    - docs/**
    - .github/**
    - reports/architecture/**

risk_hint: low
complexity_hint: low

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: true
  max_loop_rounds_hint: 1

acceptance:
  - rewrite reports/runtime/qwen-smoke/QWEN_POST76_SMOKE_20260908.md
  - file contains QWEN_POST76_SMOKE=PASS
  - file contains MODEL=qwen38-opus-q3-opencode-64k
  - file contains ISSUE_76=closed
  - file contains PURPOSE=post76-runtime-smoke
  - file contains TASK_REF=D-9403-D
  - executor changes no other tracked file
  - deterministic test exits 0
  - executor persistence commit/push succeeds

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 900
  max_turns_hint: 8
  test_commands:
    - node -e "const fs=require('fs');const p='reports/runtime/qwen-smoke/QWEN_POST76_SMOKE_20260908.md';if(fs.existsSync(p)===false)process.exit(1);const s=fs.readFileSync(p,'utf8');for(const x of ['QWEN_POST76_SMOKE=PASS','MODEL=qwen38-opus-q3-opencode-64k','ISSUE_76=closed','PURPOSE=post76-runtime-smoke','TASK_REF=D-9403-D']){if(s.includes(x)===false)process.exit(2)}"

human_gate_required_if: []

context_refs:
  - github:mrhz1973/control-plane#76
  - github:mrhz1973/control-plane@169a0b3b10be7030e2e5adc8fe6fe995b712b8b6:reports/runtime/qwen-smoke/QWEN_POST76_SMOKE_20260908.md

state: READY_FOR_PLANNING
```
