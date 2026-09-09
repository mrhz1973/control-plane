# Backlog item — D-9407-A (#73 quota pacing deterministic design/simulator)

```yaml
schema: backlog-item-v1
id: D-9407-A
title: "#73 deterministic quota pacing policy simulator"
created_at: 2026-09-09T08:00:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Build a deterministic, OFFLINE, repo-only simulator and design report for the future quota pacing controller discussed under issue #73.

  This task MUST NOT activate or modify live routing. It must not call any model/provider, consume any quota reset, change n8n/WF90, or inspect credentials. It prepares only the deterministic policy/simulation layer that a later separately-authorized runtime task may consume.

  Create exactly:
  - tools/simulate-quota-pacing-v1.mjs
  - tests/quota-pacing-simulator-v1/run.mjs
  - reports/architecture/v4_quota_pacing_policy_design_v1.md

  Simulator contract:
  - CLI accepts exactly one UTF-8 JSON scenario path.
  - Input is one bounded object containing only synthetic/normalized observations; never credentials or provider raw payloads.
  - Output is one compact JSON object only; no file writes.
  - Required input domains:
      now_local_iso
      qwen_local { available, adequate_for_task }
      glm_coding_plan { state, freshness, effective_remaining_percent, rolling_remaining_percent, weekly_remaining_percent, rolling_reset_at, weekly_reset_at }
      chatgpt_codex_subscription { state, freshness, effective_remaining_percent, rolling_remaining_percent, weekly_remaining_percent, rolling_reset_at, weekly_reset_at, banked_reset_count, banked_reset_expiry }
      task { quality_class, urgency, estimated_burn_class }
      policy { glm_blackout_local_start, glm_blackout_local_end, reserve_floor_percent, horizon_hours }
      empirical_burn { qwen_local, glm_flash, glm_full, codex_low, codex_medium, codex_strong }
  - empirical_burn values are injected observations/estimates only. The simulator MUST NOT hardcode provider token economics or assume token count == quota consumption.
  - banked reset count/expiry is advisory capacity only. Simulator MUST NEVER auto-consume a reset. Any recommendation that would need a reset must be HUMAN_GATE_RESET.
  - Qwen local has no commercial quota and may be preferred when available+adequate.
  - GLM pool is shared by glm-5.3 and glm-5.3-flash. Blackout 08:00–12:00 Europe/Rome is a policy gate over the whole glm_coding_plan; both full and Flash are blocked during blackout.
  - GLM/Codex effective commercial capacity uses the already-canonical limiting-window law (MIN of fresh binding windows). Simulator must consume effective_remaining_percent as canonical evidence and must not recompute a conflicting MAX law.
  - stale/unknown commercial quota MUST fail closed for commercial-route admission.
  - reserve protection: if projected post-task effective remaining would fall at/below reserve_floor_percent, classify route CONSERVE unless urgency/quality semantics require escalation; never silently spend below reserve.
  - pacing horizon: compare current effective remaining, time-to-reset, and empirical burn estimate. If current burn rate would exhaust the long window before reset, prefer a less demanding qualified route/model class or DEFER.
  - model-class downgrade is allowed only when task.quality_class permits it; never trade below the required quality class.
  - outside GLM blackout candidate priority for ordinary tasks should remain policy-derived and explicit, not hardwired to provider brand. The report may illustrate current target order Qwen -> GLM Flash -> Codex -> GLM full -> stronger Codex, but simulator decisions must be justified by inputs.
  - inside GLM blackout, GLM routes are ineligible regardless of quota; use Qwen if adequate, else Codex if quota/pacing allows, else DEFER.
  - DEFER means pending for later eligibility, not failure/discard.
  - outputs must include:
      schema_version = quota-pacing-simulation-v1
      classification
      selected_route or null
      selected_model_class or null
      decision = USE|CONSERVE|DEFER|HUMAN_GATE_RESET
      reasons[] (bounded max 16)
      commercial_pool_used or null
      projected_effective_remaining_percent or null
      blackout_active boolean
      reset_horizon_hours where applicable
  - no routing mutation, no authorization mutation, no persistent state.

  Focused tests must prove at minimum:
  - Qwen available+adequate can be selected without commercial quota.
  - GLM inside 08:00–12:00 Europe/Rome is blocked even with 100% quota.
  - GLM Flash and full share the same pool evidence; no duplicated capacity.
  - Codex 5h 100 / weekly 20 => effective 20 is respected, never 100.
  - GLM 5h 40 / weekly 13 => effective 13 is respected, MCP/auxiliary quota cannot inflate model capacity.
  - stale or UNKNOWN commercial pool => not admitted.
  - reserve-floor breach => CONSERVE or alternate route, never silent spend.
  - projected long-window exhaustion before reset triggers conservation/downgrade/DEFER.
  - lower-cost model class may be chosen only when quality requirement permits.
  - strong/high-quality task never auto-downgrades below its declared quality floor.
  - banked reset present does not increase current effective_remaining_percent.
  - banked reset nearing expiry may yield HUMAN_GATE_RESET advisory only; never auto-consume.
  - no banked reset => no HUMAN_GATE_RESET recommendation unless scenario explicitly requires it.
  - blackout + Qwen inadequate + Codex below reserve => DEFER.
  - DEFER is terminal simulation output but semantically pending, not failure.
  - malformed/non-object/secret-like scenario => fail closed and never echo secret material.
  - output reasons bounded max 16.
  - no provider/network/model call exists in simulator.

  Architecture report must include:
    ISSUE=73
    COMPONENT=QUOTA_PACING_POLICY_SIMULATOR
    RUNTIME_ACTIVE=NO
    PROVIDER_CALLS=0
    MODEL_INFERENCE=0
    RESET_CONSUMPTION=0
    ROUTING_MUTATION=0
    GLM_BLACKOUT=08:00-12:00 Europe/Rome
    EFFECTIVE_QUOTA_LAW=MIN_BINDING_WINDOWS
    BANKED_RESETS=ADVISORY_HUMAN_GATE_ONLY
    BURN_RATE=EMPIRICAL_INPUT_NOT_TOKEN_ASSUMPTION
    DEFER=PENDING_NOT_FAILURE
    RESULT=PASS

  The report must explicitly separate:
  - current observed quota state;
  - pacing policy;
  - empirical burn coefficients;
  - banked reset inventory;
  - runtime promotion gate.

scope:
  allowed_areas:
    - tools/simulate-quota-pacing-v1.mjs
    - tests/quota-pacing-simulator-v1/run.mjs
    - reports/architecture/v4_quota_pacing_policy_design_v1.md
  forbidden_areas:
    - workflows/**
    - configs/**
    - docs/**
    - .github/**
    - reports/runtime/dev-queue/**
    - tools/serve-local-dev-autonomous-dispatcher-v1.mjs
    - tools/local-dev-resource-observatory-v1.mjs
    - tools/collect-openclaw-quota-v1.mjs
    - tools/rt25-*

risk_hint: low
complexity_hint: medium

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: true
  max_loop_rounds_hint: 3

acceptance:
  - only the three allowed tracked files change
  - simulator is deterministic and offline
  - no provider/model/network call occurs
  - no routing/admission/authorization runtime file changes
  - no reset is consumed or made callable
  - GLM blackout and MIN-binding quota law are tested
  - reserve/horizon/burn-rate pacing semantics are tested
  - banked resets remain advisory HUMAN_GATE only
  - focused test exits 0
  - git diff --check exits 0
  - executor persistence commit/push succeeds
  - HEAD equals origin/main after persistence

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 6000
  max_turns_hint: 36
  test_commands:
    - node tests/quota-pacing-simulator-v1/run.mjs

human_gate_required_if: []

context_refs:
  - github:mrhz1973/control-plane#73
  - docs/contracts/quota-pool-status-v1.md
  - docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md
  - reports/architecture/v4_quota_source_capability_probe_v1.md

state: READY_FOR_PLANNING
```
