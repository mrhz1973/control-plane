# Backlog item — D-9409-A (#73 Codex app-server secondary quota collector)

```yaml
schema: backlog-item-v1
id: D-9409-A
title: "#73 Codex app-server secondary quota collector and reconciliation"
created_at: 2026-09-09T15:06:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Implement the next bounded, OFFLINE-SAFE Phase-B #73 slice: a read-only secondary collector/adapter for the official Codex app-server `account/rateLimits/read` protocol, plus deterministic reconciliation against the canonical OpenClaw Codex pool observation.

  Autonomous execution MUST NOT perform a live Codex app-server RPC, call any model/provider, consume reset credits, mutate routing, or touch n8n/WF90/VPS/Tailscale.

  Identity law:
  - `codex_ide_cursor_extension` and `codex_external_planner` are two observation surfaces of ONE pool: `chatgpt_codex_subscription`.
  - Never create a second Codex quota pool.
  - OpenClaw remains primary live source; Codex app-server is secondary cross-check only.

  Implement:
  1. `tools/collect-codex-appserver-quota-v1.mjs` to normalize fixture/mock `account/rateLimits/read` responses.
  2. `tests/codex-appserver-quota-v1/run.mjs` with deterministic offline tests.
  3. `reports/architecture/v4_codex_appserver_secondary_collector_v1.md` documenting the contract and promotion gate.

  Collector semantics:
  - source windows expose USED semantics via `usedPercent`; derive remaining = clamp(100-usedPercent,0..100).
  - effective capacity = MIN of fresh binding windows.
  - missing/invalid required binding evidence => UNKNOWN/fail closed.
  - preserve reset timestamps and duration metadata without timezone invention.
  - classify 5h/weekly windows deterministically using duration metadata where present; ambiguous identity must not silently swap windows.
  - normalize banked reset inventory (`availableCount`, resetType/status/expiresAt) as advisory observation only.
  - reset credits NEVER increase current effective remaining.
  - no consume action in exported API or autonomous code path.
  - bounded output; no raw auth/session material; secret-like unexpected fields never echoed.

  Reconciliation semantics:
  - both sources map to the SAME `chatgpt_codex_subscription` pool.
  - observations are never additive.
  - fresh comparable observations may report MATCH / WITHIN_TOLERANCE / MISMATCH using an explicit deterministic tolerance documented in the report.
  - secondary mismatch MUST NOT silently overwrite OpenClaw primary capacity.
  - stale secondary cannot downgrade fresh primary.
  - stale/missing primary does NOT auto-promote secondary to routing authority in this task.

  Tests must prove at minimum:
  - usedPercent 0 => remaining 100; usedPercent 16 => remaining 84.
  - 5h remaining 100 + weekly 84 => effective 84, never 100.
  - missing/invalid binding window => UNKNOWN/fail closed.
  - malformed percentages fail closed.
  - reset timestamps preserved.
  - ambiguous window identity fails closed or remains explicit unknown.
  - same pool id for OpenClaw and app-server; never summed.
  - within tolerance vs material mismatch classifications.
  - primary authority remains OpenClaw in mismatch/stale-secondary cases.
  - reset credits do not change effective capacity.
  - no consume path, network call, provider call, model inference, auth refresh, browser automation, or secret persistence.

  Architecture report constants:
    ISSUE=73
    COMPONENT=CODEX_APPSERVER_SECONDARY_QUOTA_COLLECTOR
    PRIMARY_SOURCE=OPENCLAW_STATUS_USAGE_JSON
    SECONDARY_SOURCE=CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ
    QUOTA_POOL_ID=chatgpt_codex_subscription
    SECOND_POOL_CREATED=NO
    SOURCE_SEMANTICS=USED_PERCENT
    EFFECTIVE_QUOTA_LAW=MIN_BINDING_WINDOWS
    BANKED_RESETS=OBSERVE_ONLY
    RESET_CONSUMPTION=0
    PROVIDER_CALLS_AUTONOMOUS_RUN=0
    MODEL_INFERENCE=0
    ROUTING_AUTHORITY_CHANGED=NO
    RUNTIME_PROMOTION=SEPARATE_HUMAN_GATED_STEP
    RESULT=PASS

scope:
  allowed_areas:
    - tools/collect-codex-appserver-quota-v1.mjs
    - tests/codex-appserver-quota-v1/**
    - reports/architecture/v4_codex_appserver_secondary_collector_v1.md
    - docs/contracts/quota-pool-status-v1.md
    - tools/local-dev-resource-observatory-v1.mjs
    - tests/local-dev-resource-observatory-v1/**
  forbidden_areas:
    - reports/runtime/dev-queue/**
    - workflows/**
    - configs/**
    - .github/**
    - tools/serve-local-dev-autonomous-dispatcher-v1.mjs
    - tools/local-dev-autonomous-dispatcher-v1.mjs
    - tools/collect-openclaw-quota-v1.mjs
    - tools/local-dev-dispatcher-dashboard-v1.html
    - tests/local-dev-dispatcher-service-v1/**
    - any n8n/WF90/VPS/Tailscale file

risk_hint: low
complexity_hint: medium_high

planner:
  preferred: qwen
  fallback: []
  fallback_policy: none

execution:
  target: opencode
  loop_allowed: true
  max_loop_rounds_hint: 5

acceptance:
  - local Qwen/OpenCode only; no commercial fallback
  - only allowed tracked files change
  - deterministic offline implementation/tests
  - no live Codex app-server RPC during autonomous execution
  - no provider/model/browser/auth call
  - no reset consume path
  - no routing/admission/authorization authority changes
  - same-pool reconciliation never duplicates capacity
  - MIN-binding-window law preserved
  - OpenClaw remains primary authority
  - focused tests exit 0
  - git diff --check exits 0
  - executor persistence commit/push succeeds
  - HEAD equals origin/main after persistence

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 9000
  max_turns_hint: 54
  test_commands:
    - node tests/codex-appserver-quota-v1/run.mjs
    - node tests/local-dev-resource-observatory-v1/run.mjs

human_gate_required_if:
  - live Codex app-server RPC would be required
  - login/auth refresh would be required
  - reset-credit consume would be required
  - routing authority promotion would be required
  - any forbidden area must change

context_refs:
  - github:mrhz1973/control-plane#73
  - reports/architecture/v4_cursor_codex_ide_quota_source_probe_v1.md
  - docs/contracts/quota-pool-status-v1.md
  - docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md

state: READY_FOR_PLANNING
```
