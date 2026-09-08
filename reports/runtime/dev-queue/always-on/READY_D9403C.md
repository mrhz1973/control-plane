# Backlog item — D-9403-C (post-#76 Qwen smoke after B persistence STOP)

```yaml
schema: backlog-item-v1
id: D-9403-C
title: Post-#76 Qwen smoke after B NOTHING_STAGEABLE preexisting-untracked STOP
created_at: 2026-09-08T06:42:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Successor to D-9403-B after non-replayable STOP:GIT_PERSISTENCE_FAILED
  with NOTHING_STAGEABLE_IN_SCOPE caused by a preexisting untracked evidence
  file from D-9403-A. Workspace evidence path was cleared so this run can
  create the file as a task-created in-scope untracked path, then pass
  deterministic acceptance and persist/push.

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
  - github:mrhz1973/control-plane@63838acd7e39df3a045f0578b52e58d8a797b066:reports/runtime/dev-queue/always-on/READY_D9403B.md

state: READY_FOR_PLANNING
```
