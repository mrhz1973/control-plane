# Backlog item — D-9403-F (live short Qwen proof)

```yaml
schema: backlog-item-v1
id: D-9403-F
title: Live short GPT Web to Qwen proof
created_at: 2026-09-08T13:00:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Create one tiny evidence file proving that a fresh GPT Web task is consumed
  by the normal autonomous LOCAL_DEV_B path with Qwen 64K and persisted remotely.

scope:
  allowed_areas:
    - reports/runtime/qwen-smoke/QWEN_LIVE_SHORT_20260908.md
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
  - create exactly reports/runtime/qwen-smoke/QWEN_LIVE_SHORT_20260908.md
  - file contains LIVE_SHORT_PROOF=PASS
  - file contains TASK_REF=D-9403-F
  - executor changes no other tracked file
  - deterministic test exits 0
  - executor persistence commit/push succeeds

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 300
  max_turns_hint: 4
  test_commands:
    - node -e "const fs=require('fs');const p='reports/runtime/qwen-smoke/QWEN_LIVE_SHORT_20260908.md';if(fs.existsSync(p)===false)process.exit(1);const s=fs.readFileSync(p,'utf8');if(s.includes('LIVE_SHORT_PROOF=PASS')===false)process.exit(2);if(s.includes('TASK_REF=D-9403-F')===false)process.exit(3)"

human_gate_required_if: []

context_refs:
  - github:mrhz1973/control-plane@8048d5e554a2da695260ff5a623e39cf2b3739a7:reports/runtime/qwen-smoke/QWEN_GPTWEB_E2E_20260908.md

state: READY_FOR_PLANNING
```
