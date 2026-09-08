# Backlog item — D-9403-E (GPT Web → autonomous Qwen end-to-end proof)

```yaml
schema: backlog-item-v1
id: D-9403-E
title: GPT Web initiated post-#76 autonomous Qwen end-to-end proof
created_at: 2026-09-08T06:45:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Prove from the current GPT Web control-plane chat that a fresh bounded task can
  enter the always-on queue, be executed by the LOCAL_DEV_B lane using the
  qwen38-opus-q3-opencode-64k profile, pass deterministic acceptance, and persist
  its result to origin/main without manual workstation intervention. Create exactly
  reports/runtime/qwen-smoke/QWEN_GPTWEB_E2E_20260908.md with the required markers.

scope:
  allowed_areas:
    - reports/runtime/qwen-smoke/QWEN_GPTWEB_E2E_20260908.md
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
  - create exactly reports/runtime/qwen-smoke/QWEN_GPTWEB_E2E_20260908.md
  - file contains GPTWEB_QWEN_E2E=PASS
  - file contains REQUEST_ORIGIN=GPT_WEB_CHAT
  - file contains MODEL=qwen38-opus-q3-opencode-64k
  - file contains TASK_REF=D-9403-E
  - file contains PURPOSE=end-to-end-autonomous-queue-proof
  - executor changes no other tracked file
  - deterministic test exits 0
  - executor persistence commit/push succeeds

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 900
  max_turns_hint: 8
  test_commands:
    - node -e "const fs=require('fs');const p='reports/runtime/qwen-smoke/QWEN_GPTWEB_E2E_20260908.md';if(!fs.existsSync(p))process.exit(1);const s=fs.readFileSync(p,'utf8');for(const x of ['GPTWEB_QWEN_E2E=PASS','REQUEST_ORIGIN=GPT_WEB_CHAT','MODEL=qwen38-opus-q3-opencode-64k','TASK_REF=D-9403-E','PURPOSE=end-to-end-autonomous-queue-proof']){if(!s.includes(x))process.exit(2)}"

human_gate_required_if: []

context_refs:
  - github:mrhz1973/control-plane#76
  - github:mrhz1973/control-plane@777be8ebcdf8a7a26544070a4f40ef78c9eecbf3:reports/runtime/qwen-smoke/QWEN_POST76_SMOKE_20260908.md

state: READY_FOR_PLANNING
```
