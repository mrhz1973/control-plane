# Backlog Item — V4 Codex IDE in Cursor qualification

```yaml
schema: backlog-item-v1
id: V4-CODEX-IDE-CURSOR-QUALIFICATION
title: Qualify Codex IDE extension inside Cursor using ChatGPT subscription
created_at: 2026-09-05T09:22:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: >-
  Qualify Codex as a first-class execution/advisor/task-prompt-generation surface
  directly inside Cursor via the official Codex IDE extension authenticated with
  the operator's ChatGPT subscription, while keeping it distinct from Cursor's
  native model picker and from OpenAI API-key billing.

scope:
  allowed_areas:
    - docs/runtime/**
    - reports/architecture/**
    - configs/resources/**
    - docs/contracts/**
    - docs/foundation/**
  forbidden_areas:
    - production workflow mutation without separate GPT-Web-authored artifact/gate
    - credential/token persistence in GitHub
    - OpenAI API billing changes
    - destructive filesystem/git actions
  notes:
    - Official OpenAI docs verified 2026-09-05: Codex IDE extension is compatible with most VS Code forks and OpenAI specifically documents using it inside Cursor.
    - Official path supports ChatGPT subscription authentication or OpenAI API key; this qualification targets ChatGPT subscription.
    - Codex IDE extension is a separate surface from Cursor's own model picker.

risk_hint: medium
complexity_hint: medium

planner:
  preferred: codex
  fallback:
    - glm
  fallback_policy: equivalent_or_gate

execution:
  target: cursor
  loop_allowed: false
  max_loop_rounds_hint: 2

acceptance:
  - Current Cursor version and installed-extension state inventoried without secrets
  - Official Codex IDE extension installed in Cursor
  - Authentication completed through ChatGPT subscription, not OpenAI API key
  - Extension proves authenticated availability inside Cursor
  - Available Codex model(s) and reasoning/quality controls are discovered from the current client/account rather than hardcoded
  - One harmless no-op/repo-read task PASS inside Cursor
  - One bounded TASK DELTA / Execution Packet generation task PASS
  - One bounded code-edit implementation task PASS only after permissions/scope are explicit
  - Git/file permissions and sandbox behavior are recorded
  - Usage/quota accounting source is identified and linked to the quota-pool track (#32); no invented quota numbers
  - Codex IDE route is represented separately from codex_external_planner, Cursor native models, and OpenAI API-key routes
  - One meaningful live proof per distinct capability; no repeated synthetic/offline proof campaign
  - Foundation/registry/current docs updated only after the capability is live-qualified

human_gate_required_if:
  - install extension requires operator UI action
  - ChatGPT login/OAuth interaction required
  - credential/account/billing mutation requested
  - permission scope wider than bounded repo work
  - cloud execution or destructive action would be enabled

context_refs:
  - docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md
  - docs/foundation/PROJECT_VISION.md
  - docs/contracts/resource-status-v1.schema.json
  - configs/resources/registry.json
  - docs/PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md
  - docs/PM35_CODEX_NOOP_PROBE.md
  - docs/PM36_CODEX_REPO_READ_PROBE.md
  - https://help.openai.com/en/articles/11369540
  - https://help.openai.com/en/articles/20001506-using-openai-models-in-cursor

state: READY_FOR_QUALIFICATION
```

## Qualification phases

1. **Read-only inventory** — Cursor build, extension presence/version, Codex CLI/IDE state, no secret printing.
2. **Install gate** — install official `openai.chatgpt` Codex IDE extension in Cursor if absent.
3. **ChatGPT subscription login gate** — authenticate interactively; do not use/store an OpenAI API key.
4. **Capability discovery** — enumerate current Codex model and reasoning/quality controls exposed by the installed client/account.
5. **No-op + repo-read proof** — one bounded proof inside Cursor.
6. **Prompt/Execution-Packet proof** — Codex generates one valid TASK DELTA / Execution Packet for Cursor.
7. **Bounded implementation proof** — one safe real code edit with explicit scope and verification.
8. **Quota/resource integration** — identify the actual ChatGPT Codex usage pool/observability and feed #32; do not assume Cursor quota.
9. **Canonical reconciliation** — only after PASS, update `RESOURCE_REGISTRY`, routing policy and foundation to mark `codex_ide_cursor_extension` qualified.

## Distinct route identity

```text
Codex IDE extension inside Cursor
  != Cursor native OpenAI model picker
  != Cursor proprietary/native models
  != Codex external CLI/planner worker
  != OpenAI API-key/BYOK billing route
```

The route should eventually be selectable by task role, quality/reasoning need, quota/reserve/reset/time-cost policy, and current availability under the master routing track #32.
