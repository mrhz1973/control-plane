# Backlog item — D-9406-A (#73 Phase C deterministic shadow-proof preflight)

```yaml
schema: backlog-item-v1
id: D-9406-A
title: "#73 Phase C deterministic shadow-proof preflight harness"
created_at: 2026-09-09T01:08:00Z
created_by: gpt-web
repository: mrhz1973/control-plane
branch_target: main

objective: |
  Build the deterministic repo-only preflight harness needed before the real #73 Phase C shadow proof for:

    QWEN_LOCAL -> HERMES -> CHATGPT_WEB

  This task MUST NOT call Hermes, ChatGPT Web, GLM, Codex, Cursor native models, n8n production routes, or any provider API. It prepares only the validation boundary that the later real shadow proof must satisfy.

  Create exactly:
  - tools/validate-hermes-shadow-proof-v1.mjs
  - tests/hermes-shadow-proof-validator-v1/run.mjs
  - reports/architecture/v4_hermes_shadow_proof_preflight_v1.md

  Validator contract:
  - CLI accepts exactly one UTF-8 JSON candidate packet path plus optional --expected-head <40hex>.
  - Candidate must be one JSON object; malformed JSON/non-object => bounded failure.
  - Required exact fields:
      schema_version = hermes-shadow-proof-packet-v1
      issue = 73
      repository = mrhz1973/control-plane
      branch = main
      route.controller = qwen_local
      route.bridge = hermes
      route.target = chatgpt_web
      shadow_only = true
      production_dispatch = false
      self_authorizing = false
      credential_material_in_packet = false
  - base_head must be exactly 40 lowercase hex.
  - When --expected-head is supplied, base_head must equal it exactly; mismatch => STALE_BASE_HEAD.
  - allowed_scope must be a non-empty array of bounded repo-relative paths with no absolute paths, no '..', no backslashes, no wildcard that escapes its declared subtree.
  - hard_walls must be a non-empty string array and include semantic coverage for: no production dispatch, no OLD mutation/decommission, no D-0025 reopening, no public CDP/noVNC/Funnel, no credentials/cookies/secrets persistence, no claim ChatGPT Web is unlimited/infinite.
  - acceptance must be a non-empty string array and include: exact route identity, real authenticated Web surface observation, bounded fresh observation timestamp/freshness, no hidden fallback, no production mutation, deterministic PASS/STOP evidence.
  - stop_conditions must be a non-empty string array and include stale/wrong base head, unavailable/unhealthy Hermes/Web surface, auth ambiguity, route/model mismatch, scope expansion, hidden fallback, and any production mutation attempt.
  - packet must not contain raw cookies, bearer tokens, authorization headers, passwords, session secrets, or obvious credential fields anywhere recursively.
  - packet must not freeze a static ChatGPT Web model allowlist; model selection remains dynamic unless a later live surface supplies an observed model identifier.
  - validator output is one compact JSON object only, with schema_version=hermes-shadow-proof-validation-v1, ok boolean, classification PASS|STOP, bounded reason_codes (max 16), and never echoes packet contents or secrets.
  - exit 0 only on PASS; exit 2 on validation STOP; exit 1 only on validator/internal usage error.

  Focused tests must prove at minimum:
  - canonical valid packet => PASS / exit 0;
  - stale base_head => STOP with STALE_BASE_HEAD;
  - self_authorizing=true => STOP;
  - production_dispatch=true => STOP;
  - wrong controller/bridge/target => STOP;
  - missing one required hard wall => STOP;
  - missing one required acceptance class => STOP;
  - missing one required STOP class => STOP;
  - absolute path / parent traversal in allowed_scope => STOP;
  - secret-like recursive key/value => STOP without echoing secret material;
  - malformed JSON and JSON array => STOP;
  - empty allowed_scope => STOP;
  - static/frozen ChatGPT Web model allowlist => STOP;
  - reason_codes are bounded to max 16;
  - output never contains raw candidate packet text.

  Architecture report must be concise and evidence-oriented. It must contain:
    ISSUE=73
    PHASE=C_PRECHECK
    ROUTE=QWEN_LOCAL->HERMES->CHATGPT_WEB
    LIVE_PROVIDER_CALLS=0
    PRODUCTION_DISPATCH=0
    VALIDATOR=tools/validate-hermes-shadow-proof-v1.mjs
    TEST=tests/hermes-shadow-proof-validator-v1/run.mjs
    RESULT=PASS
  It must explicitly state that the REAL Phase C shadow proof remains pending and requires a separately bounded live task after this deterministic preflight passes.

scope:
  allowed_areas:
    - tools/validate-hermes-shadow-proof-v1.mjs
    - tests/hermes-shadow-proof-validator-v1/run.mjs
    - reports/architecture/v4_hermes_shadow_proof_preflight_v1.md
  forbidden_areas:
    - workflows/**
    - configs/**
    - docs/**
    - .github/**
    - reports/runtime/dev-queue/**
    - tools/serve-local-dev-autonomous-dispatcher-v1.mjs
    - tools/local-dev-executor-v1.mjs
    - tools/local-dev-resource-observatory-v1.mjs

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
  - no live Hermes ChatGPT Web GLM Codex Cursor-native or provider-model call occurs
  - validator fails closed on stale head wrong route self-authorization production dispatch scope escape missing walls missing acceptance missing STOP and secret-like content
  - validator never echoes secret material or full packet content
  - focused test exits 0
  - git diff --check exits 0
  - executor persistence commit/push succeeds
  - HEAD equals origin/main after persistence

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 5400
  max_turns_hint: 32
  test_commands:
    - node tests/hermes-shadow-proof-validator-v1/run.mjs

human_gate_required_if: []

context_refs:
  - github:mrhz1973/control-plane#73
  - docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md
  - reports/architecture/v4_live_quota_status_existing_contract_reconciliation_v1.md

state: READY_FOR_PLANNING
```
