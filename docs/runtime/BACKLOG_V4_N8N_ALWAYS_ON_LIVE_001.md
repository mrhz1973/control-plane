# Backlog fixture — valid READY item (GPT-Web authorized REAL work)

```yaml
schema: backlog-item-v1
id: D-9201-A
title: Create the n8n always-on live status record
created_at: 2026-09-05T07:45:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: Create the new file docs/runtime/N8N_ALWAYS_ON_LIVE_STATUS.md whose entire content is exactly one line with the text "V4-N8N-ALWAYS-ON-LIVE-001 ALWAYS_ON_DISPATCH_LIVE=PASS scheduled n8n → private dispatcher → LOCAL_DEV_EXECUTOR".
scope:
  allowed_areas:
    - docs/runtime/N8N_ALWAYS_ON_LIVE_STATUS.md
  forbidden_areas:
    - tools/**
    - configs/**
    - scripts/**
    - .github/**
    - workflows/**
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
  max_loop_rounds_hint: null

acceptance:
  - File docs/runtime/N8N_ALWAYS_ON_LIVE_STATUS.md exists
  - Content contains task ID V4-N8N-ALWAYS-ON-LIVE-001
  - Content states ALWAYS_ON_DISPATCH_LIVE=PASS
  - Only the allowed target file changed
human_gate_required_if: []
context_refs: []

state: READY_FOR_PLANNING
```
