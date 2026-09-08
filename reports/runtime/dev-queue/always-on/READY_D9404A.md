# Backlog item — D-9404-A (#73 B2 GLM automatic live quota collector package)

```yaml
schema: backlog-item-v1
id: D-9404-A
title: Implement bounded Windows GLM live quota collector package using the existing canonical RT25 ingest
created_at: 2026-09-08T13:25:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Implement the smallest repo-side package needed to run the already-existing GLM Coding Plan machine-readable quota ingest automatically on the Windows Control Plane workstation.

  This task MUST reuse the existing quota architecture. Do not create a new quota schema, pool, router, collector protocol, or observation authority.

  Canonical existing pieces to reuse:
  - docs/contracts/quota-pool-status-v1.md
  - tools/rt25-quota-ingest-glm-v1.mjs
  - tools/rt25-canonical-quota-state-v1.mjs
  - untracked runtime ingest lane configs/runtime/quota-ingest
  - issue #40 source classification MACHINE_STATUS_SOURCE_CONFIRMED
  - issue #73 Phase A reconciliation PASS_EXISTING_FOUNDATION

  Current source law:
  - GLM Coding Plan monitor source is GET https://api.z.ai/api/monitor/usage/quota/limit for the canonical Global-plan evidence.
  - 5-hour and weekly windows already normalize through rt25-quota-ingest-glm-v1.mjs.
  - GLM 5.3 and GLM 5.3 Flash share the single glm_coding_plan pool.
  - runtime credential names already supported by the ingest are ZAI_API_KEY and ZHIPUAI_API_KEY.
  - secret values must never be logged, printed, committed, copied into arguments, or persisted by this package.

  Add exactly one small Windows runner script and one management script, plus focused tests.

  Runner requirements:
  - discover the repository root from its own script path, never a hard-coded user path;
  - resolve a GLM monitor credential by NAME only from Process, then User, then Machine environment scopes using only ZAI_API_KEY or ZHIPUAI_API_KEY;
  - if no credential exists, fail closed with a secret-free classification such as CREDENTIAL_ABSENT_FAIL_CLOSED and do not fabricate quota;
  - place any resolved credential only in the child process environment; never print its value;
  - execute the existing node tool in auto mode and write only to configs/runtime/quota-ingest;
  - preserve the existing canonical decision filename and schema produced by rt25-quota-ingest-glm-v1.mjs;
  - return the underlying ingest exit/result without inventing availability.

  Management requirements:
  - modes: Validate, Install, Status, Uninstall;
  - scheduled task name: ControlPlane-V4-GlmQuotaCollector;
  - Install uses the runner script and a 4-minute repetition interval so observations can normally remain inside the existing 5-minute freshness ceiling;
  - run under the current interactive Windows user with least privilege; no stored password introduced by this task;
  - StartIn/working directory must be the canonical repo root;
  - Validate is read-only and reports only prerequisite/credential PRESENCE booleans and paths, never secret values;
  - Status is read-only and reports task state, last run/result, next run if available, and current glm-quota-decision.json age/classification if present;
  - Uninstall removes only ControlPlane-V4-GlmQuotaCollector and does not delete quota evidence or other tasks;
  - Install must refuse to mutate Task Scheduler when neither supported credential name exists in Process/User/Machine scopes;
  - idempotent reinstall/update is allowed only for this exact task name.

  This D-9404-A slice is REPO IMPLEMENTATION + VALIDATION ONLY. Do NOT install or start the scheduled task in this executor pass. Runtime activation is the next separately evidenced micro-task after this PASS.

  Codex is deliberately NOT automated here: canonical source law remains MANUAL_DASHBOARD_ONLY.
  Cursor quota is deliberately NOT modeled here: #73 B1 pool/source identity remains separate.
  ChatGPT Web availability remains #73 B3.

scope:
  allowed_areas:
    - tools/run-v4-glm-quota-collector-windows-v1.ps1
    - tools/manage-v4-glm-quota-collector-windows-v1.ps1
    - tests/v4-glm-quota-collector-windows-v1/run.mjs
  forbidden_areas:
    - configs/resources/**
    - configs/runtime/**
    - workflows/**
    - docs/foundation/**
    - docs/contracts/**
    - docs/runtime/CURRENT_FRONTIER.md
    - reports/architecture/**
    - .github/**
  notes:
    - Existing rt25-quota-ingest-glm-v1.mjs must be reused byte-for-byte in this slice.
    - No provider call is needed to implement or test the package.

risk_hint: low
complexity_hint: medium

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: true
  max_loop_rounds_hint: 2

acceptance:
  - No new quota schema, quota pool, routing policy, or collector protocol is introduced
  - Existing rt25-quota-ingest-glm-v1.mjs remains unchanged
  - Runner uses only ZAI_API_KEY or ZHIPUAI_API_KEY and never outputs credential values
  - Missing credential fails closed without fabricated quota
  - Manager implements Validate Install Status Uninstall for only ControlPlane-V4-GlmQuotaCollector
  - Install cadence is exactly 4 minutes and targets the existing untracked configs/runtime/quota-ingest lane
  - D-9404-A itself performs zero Task Scheduler mutation and zero provider request
  - Focused test proves command construction, secret-safe behavior, exact task identity, 4-minute cadence, fail-closed missing credential, and no destructive cleanup
  - Existing GLM ingest focused suite still passes
  - Only the three allowed files are changed by the executor
  - Selective commit push and remote verification succeed

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 900
  max_turns_hint: 8
  test_commands:
    - node tests/v4-glm-quota-collector-windows-v1/run.mjs
    - node tests/rt25-t03-glm-quota-ingest/run.mjs

human_gate_required_if: []
context_refs:
  - github:mrhz1973/control-plane#32
  - github:mrhz1973/control-plane#40
  - github:mrhz1973/control-plane#73

state: READY_FOR_PLANNING
```
