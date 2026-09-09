# v4 Hermes Shadow-Proof Preflight v1

Task: LOCAL_DEV_B_D-9406-A
Route: QWEN_LOCAL -> HERMES -> CHATGPT_WEB (shadow-only)
Issue: #73

## Scope

Deterministic repo-only preflight harness. No provider calls:
- no Hermes, ChatGPT Web, GLM, Codex, Cursor native model, or n8n production
- no provider API, no credentials, no cookies, no secrets

## Files

- tools/validate-hermes-shadow-proof-v1.mjs — validator
- tests/hermes-shadow-proof-validator-v1/run.mjs — focused test runner
- reports/architecture/v4_hermes_shadow_proof_preflight_v1.md — this report

## Contract Summary

Packet schema `hermes-shadow-proof-packet-v1` requires:

- schema_version, issue=73, repository, branch
- route {controller=qwen_local, bridge=hermes, target=chatgpt_web}
- shadow_only=true, production_dispatch=false
- self_authorizing=false, credential_material_in_packet=false
- base_head 40 lowercase hex; must match --expected-head if supplied
- allowed_scope non-empty bounded repo-relative paths
- hard_walls non-empty with semantic coverage (no production dispatch, no OLD
  mutation/decommission, no D-0025 reopening, no public CDP/noVNC/Funnel,
  no credentials/cookies/secrets persistence, no ChatGPT Web unlimited claim)
- acceptance non-empty with coverage (route identity, real authenticated Web
  surface observation, bounded fresh timestamp/freshness, no hidden fallback,
  no production mutation, deterministic PASS/STOP evidence)
- stop_conditions non-empty with coverage (stale/wrong base head, unavailable
  Hermes/Web surface, auth ambiguity, route/model mismatch, scope expansion,
  hidden fallback, production mutation attempt)
- no raw cookies, bearer tokens, authorization headers, passwords, session
  secrets, or obvious credential fields recursively
- no frozen ChatGPT Web model allowlist

Output: one compact JSON with schema_version, ok, classification PASS|STOP,
reason_codes max 16.

Exit codes: 0 PASS, 2 validation STOP, 1 usage/internal.

## Evidence

`node tests/hermes-shadow-proof-validator-v1/run.mjs` runs fixture-based
tests against the validator covering PASS, STALE_BASE_HEAD, MALFORMED_JSON,
BAD_SCHEMA_VERSION, BAD_ROUTE_IDENTITY, BAD_BASE_HEAD, BAD_ALLOWED_SCOPE,
BAD_ALLOWED_SCOPE_ENTRY, HARD_WALLS_COVERAGE, ACCEPTANCE_COVERAGE,
STOP_CONDITIONS_COVERAGE, PACKET_CONTAINS_CREDENTIAL_KEYS,
PACKET_CONTAINS_CREDENTIAL_VALUES, PACKET_FREEZES_CHATGPT_WEB_MODEL_ALLOWLIST.
