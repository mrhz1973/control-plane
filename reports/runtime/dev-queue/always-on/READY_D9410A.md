# Backlog item — D-9410-A (VPS CPU live observability)

```yaml
schema: backlog-item-v1
id: D-9410-A
title: Add live read-only VPS CPU percentage to Control Plane dashboard
created_at: 2026-09-15T21:38:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Fix the real Control Plane dashboard gap where the VPS card is AVAILABLE and shows RAM/swap/disk, but CPU renders as "—" because the VPS observation does not currently produce cpu_percent.

  Add a bounded read-only CPU utilization observation for the canonical NEW VPS and expose it through the existing resource observatory so the existing VPS dashboard card shows a real CPU percentage. Measure actual CPU utilization, not load average. Prefer Linux /proc/stat delta sampling or another already-available read-only OS surface. Do not install packages and do not mutate the VPS.

  Preserve the current canonical private SSH/BathMode observation path, fixed VPS alias, command allowlist/fail-closed law, cache semantics, dashboard read-only posture, and all existing VPS/RAM/disk/service/Hermes observations. If CPU cannot be measured safely/read-only with the existing runtime, STOP rather than inventing a value.

scope:
  allowed_areas:
    - tools/local-dev-resource-observatory-v1.mjs
    - tools/local-dev-dispatcher-dashboard-v1.html
    - tests/local-dev-resource-observability-integrity-v1/run.mjs
    - tests/local-dev-dispatcher-service-v1/run.mjs
  forbidden_areas:
    - workflows/**
    - configs/**
    - docs/**
    - reports/architecture/**
    - .github/**

risk_hint: low
complexity_hint: low

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: true
  max_loop_rounds_hint: 2

acceptance:
  - canonical VPS observation returns cpu_percent as a bounded 0..100 number when the private read-only probe succeeds
  - CPU utilization is derived from real CPU counters/utilization evidence, not from load_average and not from an invented estimate
  - VPS observation remains read-only; no install, service restart, package mutation, reboot, config mutation, or write command is introduced
  - fixed canonical VPS alias and BatchMode-only SSH law remain unchanged
  - command allowlist remains explicit and mutation commands remain rejected
  - malformed/incomplete CPU evidence fails closed to cpu_percent=null without making the VPS falsely unavailable
  - existing RAM, swap, disk, service-state, Tailscale and Hermes/noVNC observations remain unchanged
  - dashboard VPS card shows the CPU percentage through the existing CPU row when cpu_percent is present
  - no unrelated dashboard/resource cards are changed
  - focused resource-observability tests pass
  - only allowed files are changed by the executor

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 600
  max_turns_hint: 12
  test_commands:
    - node tests/local-dev-resource-observability-integrity-v1/run.mjs

human_gate_required_if:
  - repo tracked state is dirty, ahead/diverged, or cannot fast-forward to origin/main
  - implementation would require any VPS mutation, package installation, privileged configuration change, or service restart
  - CPU semantics are ambiguous and cannot be proven from read-only evidence
  - any required change falls outside allowed_areas

context_refs:
  - github:mrhz1973/control-plane@7dd9010e55be69e5455f80f02bdfa763a021640a:tools/local-dev-resource-observatory-v1.mjs
  - github:mrhz1973/control-plane@7dd9010e55be69e5455f80f02bdfa763a021640a:tools/local-dev-dispatcher-dashboard-v1.html

state: READY_FOR_PLANNING
```
