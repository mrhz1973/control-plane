# Backlog item — D-9405-A (Qwen independent qualification 1/3)

```yaml
schema: backlog-item-v1
id: D-9405-A
title: Qwen independent qualification 1 of 3 — fresh single-file canonical read/write
created_at: 2026-09-08T21:46:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Fresh qualification task. Do not reuse or copy any prior generated qualification artifact.

  Read docs/runtime/CURRENT_FRONTIER.md and create exactly one new file:
  reports/runtime/qwen-qualification/QVAL1_SINGLE_FILE.md

  The file must contain exactly these semantic fields, one per line, with the canonical values observed from CURRENT_FRONTIER at execution time where specified:
  - QWEN_INDEPENDENT_QUALIFICATION=1
  - TASK_REF=D-9405-A
  - MODE=SINGLE_FILE_FRESH
  - WORKSTREAM=V4_ADDITIVE_EXECUTION_RUNTIME
  - D0025_ENABLED=false
  - MODEL_EXPECTED=qwen38-opus-q3-opencode-64k
  - CURSOR_ASSIST=0
  - GLM_CALLS=0
  - CODEX_CALLS=0
  - HERMES_CALLS=0
  - RESULT=PASS

  No other file may be created or modified by the executor.
  Do not seed the output from any prior artifact; derive the two canonical state values from CURRENT_FRONTIER.

scope:
  allowed_areas:
    - reports/runtime/qwen-qualification/QVAL1_SINGLE_FILE.md
  forbidden_areas:
    - tools/**
    - workflows/**
    - configs/**
    - docs/**
    - .github/**
  notes:
    - docs/runtime/CURRENT_FRONTIER.md may be read but not edited.

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
  - output file is newly created by this execution
  - output contains all required fields with exact values
  - WORKSTREAM and D0025 values match current canonical frontier
  - no Cursor GLM Codex Hermes or provider model call assists execution
  - no manual tick
  - deterministic test exits 0
  - only the one allowed file changed
  - selective commit push and remote verification succeed

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 900
  max_turns_hint: 8
  test_commands:
    - node -e "const fs=require('fs');const p='reports/runtime/qwen-qualification/QVAL1_SINGLE_FILE.md';const s=fs.readFileSync(p,'utf8');const r=['QWEN_INDEPENDENT_QUALIFICATION=1','TASK_REF=D-9405-A','MODE=SINGLE_FILE_FRESH','WORKSTREAM=V4_ADDITIVE_EXECUTION_RUNTIME','D0025_ENABLED=false','MODEL_EXPECTED=qwen38-opus-q3-opencode-64k','CURSOR_ASSIST=0','GLM_CALLS=0','CODEX_CALLS=0','HERMES_CALLS=0','RESULT=PASS'];process.exit(r.every(x=>s.includes(x))?0:1)"

human_gate_required_if: []
context_refs:
  - reports/architecture/v4_qwen_independent_3run_qualification_campaign_v1.md

state: READY_FOR_PLANNING
```
