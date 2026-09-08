# Backlog item — D-9403-B (post-#76 Qwen runtime smoke successor)

```yaml
schema: backlog-item-v1
id: D-9403-B
title: Post-#76 real Qwen LOCAL_DEV runtime smoke successor after A timebox STOP
created_at: 2026-09-08T06:35:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Successor to D-9403-A after non-replayable STOP:BOUNDS_TIMEBOX_EXPIRED.
  Perform a minimal real post-#76 Qwen LOCAL_DEV execution on the exact
  64K OpenCode profile. Create exactly one bounded evidence file proving
  implementation, deterministic acceptance, and persistence commit/push.

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
  loop_allowed: false
  max_loop_rounds_hint: 1

acceptance:
  - create exactly reports/runtime/qwen-smoke/QWEN_POST76_SMOKE_20260908.md
  - file contains QWEN_POST76_SMOKE=PASS
  - file contains MODEL=qwen38-opus-q3-opencode-64k
  - file contains ISSUE_76=closed
  - file contains PURPOSE=post76-runtime-smoke
  - executor changes no other tracked file
  - deterministic test exits 0
  - executor persistence commit/push succeeds

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 900
  max_turns_hint: 8
  test_commands:
    - node -e "const fs=require('fs');const p='reports/runtime/qwen-smoke/QWEN_POST76_SMOKE_20260908.md';if(fs.existsSync(p)===false)process.exit(1);const s=fs.readFileSync(p,'utf8');for(const x of ['QWEN_POST76_SMOKE=PASS','MODEL=qwen38-opus-q3-opencode-64k','ISSUE_76=closed','PURPOSE=post76-runtime-smoke']){if(s.includes(x)===false)process.exit(2)}"

human_gate_required_if: []

context_refs:
  - github:mrhz1973/control-plane#76
  - github:mrhz1973/control-plane@cea9d036fb8f01a55cf304cb3b208705b632d942:reports/runtime/dev-queue/always-on/READY_D9403A.md

state: READY_FOR_PLANNING
```
