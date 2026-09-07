# Backlog item — D-9401-A (#73 ChatGPT Web static access-surface registration)

```yaml
schema: backlog-item-v1
id: D-9401-A
title: Register ChatGPT Web via Hermes as a static v2 access surface without quota inference
created_at: 2026-09-07T20:05:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Modify ONLY configs/resources/registry.json and tests/registry-v2/run.mjs.

  In resource-registry-v2 static sections, add the minimum explicit representation for the already-qualified browser surface:

  1. Add model key `chatgpt_web_models` under `models`.
     - model_type: provider_managed_selection
     - provider: openai
     - roles: planner, reviewer
     - capabilities: planning, review
     - default_access_surface: chatgpt_web_via_hermes
     - model_selection_policy.selection: dynamic
     - model_selection_policy.frozen_list: false
     - note must state that the concrete ChatGPT Web model is provider-managed/per-session and must not be frozen here
     - status must make clear: browser round-trip qualified; canonical TASK DELTA promotion pending

  2. Add access surface key `chatgpt_web_via_hermes` under `access_surfaces`.
     - surface_type: hosted_route
     - host_harness: hermes
     - auth.allowed: chatgpt_web_session
     - auth.forbidden must include openai_api_key, byok_openai, api_billing
     - quota_pool_id: null
     - allowance_ownership.state: unverified
     - allowance_ownership.note must explicitly say ChatGPT Web is a separate observed availability domain and MUST NOT be assumed unlimited or quota-independent from Codex without evidence
     - model_selection_policy.selection: dynamic
     - model_selection_policy.frozen_list: false
     - qualification.runtime_qualified: true ONLY for the already-proven authenticated browser round-trip/sentinel capability; note must explicitly say canonical TASK DELTA generation, fresh-chat rollover and unattended 24/7 cognitive service remain unqualified
     - status must reflect browser qualification + cognitive promotion pending

  3. DO NOT add any new quota_pool entry for ChatGPT Web.
  4. DO NOT change `resources` v1 projection.
  5. DO NOT change existing Codex/GLM/Qwen/Cursor entries except where the focused test must reference them.
  6. DO NOT claim ChatGPT Web is free, unlimited, infinite, or quota-independent.
  7. Add focused assertions in tests/registry-v2/run.mjs proving:
     - registry validates;
     - `chatgpt_web_models.default_access_surface === "chatgpt_web_via_hermes"`;
     - surface host_harness is `hermes`;
     - quota_pool_id is null;
     - allowance ownership is unverified;
     - forbidden auth includes openai_api_key;
     - no new quota pool is created for ChatGPT Web;
     - v1 `resources` projection remains unchanged by this slice (existing expected keys/compatibility assertions must continue passing).

  Reuse only patterns already visible in the two allowed files. No other repository reads. No schema edit unless the current registry-v2 test proves the requested entries cannot validate under the existing schema; if that happens STOP rather than widening scope.

scope:
  allowed_areas:
    - configs/resources/registry.json
    - tests/registry-v2/run.mjs
  forbidden_areas:
    - tools/**
    - workflows/**
    - docs/**
    - reports/architecture/**
    - .github/**
  notes: []

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
  - `chatgpt_web_models` exists only in v2 models and points to `chatgpt_web_via_hermes`
  - `chatgpt_web_via_hermes` exists only in v2 access_surfaces with host_harness hermes
  - ChatGPT Web quota_pool_id remains null and no ChatGPT Web quota pool is invented
  - allowance ownership remains explicitly unverified
  - qualification wording distinguishes proven browser round-trip from pending TASK DELTA/rollover/24x7 qualification
  - OpenAI API/BYOK/API billing are forbidden for this access surface
  - v1 resources projection remains backward-compatible
  - node tests/registry-v2/run.mjs exits 0
  - Only the two allowed files changed by the executor

local_dev:
  dev_profile: qwen38-opus-q3-opencode-24k
  timebox_hint: 900
  max_turns_hint: 8
  test_commands:
    - node tests/registry-v2/run.mjs

human_gate_required_if:
  - operator/workstation readiness not explicitly confirmed for this execution window
context_refs:
  - github:mrhz1973/control-plane#73

state: GATED
```
