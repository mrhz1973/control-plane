# V4 Hermes Phase F readiness gap closure R2 R4 R5 V1

**TASK_REF:** `V4_HERMES_PHASE_F_READINESS_GAP_CLOSURE_R2_R4_R5_V1`
**TASK_KIND:** `BOUNDED_LONG_RUNNING_AGENT_TASK`
**BASE_HEAD:** `a1f74fd0c4d5d452b353d3b03c0dc795d6c6411b`
**ISSUE:** `#73 OPEN` (read-only preserved)
**Classification:** `PASS — R2/R4/R5/R14 readiness gaps closed through bounded implementation + deterministic qualification; no promotion`

## Operator decision (recorded)

```text
PHASE_F_DECISION=B
PROMOTION_DECISION=DEFER
KEEP_MODE=SHADOW_ONLY
OPERATOR_PHASE_F_DECISION=B_DEFER_RECORDED
```

This decision authorizes readiness-gap closure work only. It does NOT authorize
production promotion, production dispatch, or issue #73 closure.

## Outcome

All three blocking readiness unknowns from
`docs/decision-packets/v4-hermes-phase-f-promotion-gate-v1.md` were closed with
real bounded implementation and deterministic evidence — not documentation
claims:

```text
R2_SOURCE_FRESHNESS_READINESS=PASS
R4_ROUTE_SPECIFIC_DISABLE=PASS
R5_END_TO_END_OBSERVABILITY=PASS
R14_REVERSIBLE_RESTORATION=PASS
BLOCKING_UNKNOWN_COUNT=0
ALL_CRITICAL_READINESS_ITEMS=PASS=YES
ROLLBACK_DISABLE_READY=YES
OBSERVABILITY_READY=YES
```

Even in this state: `PROMOTION_EXECUTED=NO`, `PRODUCTION_DISPATCH=NO`,
`CURRENT_MODE=SHADOW_ONLY`, `ISSUE_73=OPEN`. Promotion remains a separate
future human decision gate.

## Current state preserved

```text
ISSUE_73=OPEN
ISSUE_73_PHASE_C=PASS
ISSUE_73_PHASE_D=PASS
ISSUE_73_PHASE_E=PASS
PHASE_F_GATE_PREPARED=PASS
PROMOTION_DECISION=DEFER
CURRENT_MODE=SHADOW_ONLY
PRODUCTION_CURRENTLY_ENABLED=NO
PRODUCTION_DISPATCH=NO
PROMOTION_EXECUTED=NO
CLOSED_RUNTIME_GATES_REMAIN_CLOSED=YES
LEGACY_STAGED_COMPONENTS_REMAIN_INACTIVE=YES
```

No runtime mutation, no routing change, no provider call, no browser send, no
n8n/VPS/Tailscale mutation, no legacy/staged component activation occurred.

## Integration law honored

The three gaps reuse ONE existing authority chain; no independent subsystem
was built:

```text
existing resource observations (composer lane)
  -> existing freshness/join/admission (RT25 T04/T05/T06)
  -> existing route selection (RT25 T09 + Phase E composition gate)
  -> NEW route-specific closed control (R4, state-only, behind the existing
     authorization boundary)
  -> existing authorization wall (production_dispatch_authorized law)
  -> NEW bounded observability envelope over the SAME envelopes (R5)
```

`RT25_REUSE_REQUIRED=YES`
`ARE_WE_REBUILDING_RT25_ALREADY_IMPLEMENTED=NO`
No hidden second router, no second quota authority, no duplicated retry system.

## GAP R2 — fresh source coverage (`R2_SOURCE_FRESHNESS_READINESS=PASS`)

Component: `tools/v4-phase-f-r2-source-freshness-v1.mjs` — a declarative,
deterministic inventory answering the packet's six source questions for every
relevant domain, each with exact evidence pointers into existing
implementation and tests. No parallel quota schema, no scraping, no private
endpoints.

| Domain | SOURCE_IMPLEMENTED | SOURCE_MACHINE_READABLE | FRESHNESS_PROVEN | TTL_PROVEN | RESET_PROVEN | FAIL_CLOSED_WHEN_UNAVAILABLE | Route dependency |
|---|---|---|---|---|---|---|---|
| codex (`chatgpt_codex_subscription`) | YES (T02 ingest) | NO (manual dashboard snapshot law) | YES (T02/T04/T05) | YES (300 s join law) | YES (evidence-sourced reset_at) | YES | NO |
| glm (`glm_coding_plan`) | YES (T03 ingest) | YES (documented monitor endpoint; credential-gated) | YES (T03) | YES (same TTL law) | YES (5h rolling + weekly) | YES | NO |
| qwen_local | YES (`collect-qwen-local-resource-status-v1`) | YES (`local_probe`) | YES | YES (central TTL) | YES (no commercial window; not invented) | YES (E7 defer) | **YES — controller** |
| chatgpt_web | YES (`collectChatgptWebObservation`) | YES (observation contract) | YES | YES (`QUOTA_DISPLAY_FRESH_MS`) | YES (availability domain; no pool claimed) | YES (E6 defer) | **YES — target** |
| cursor | NO (no stable pool identity) | NO | NO (manual only) | NO (DATE_ONLY) | NO (time NOT_OBSERVED) | YES (null pool binding) | NO |

**Why R2 is PASS and not papered over:** the future promoted route
(`qwen_local -> hermes -> chatgpt_web`) depends only on `qwen_local` and
`chatgpt_web` — both have proven machine-readable collectors, proven
freshness/TTL classification, and proven fail-closed behavior. The commercial
pools (codex/glm) gate only the DIRECT commercial preference through RT25,
where missing/stale/unknown evidence is fail-closed by construction
(`CONSERVE_UNKNOWN_MISSING/STALE/STATE` — proven in T02/T03/T04/T05/T06).
Sources that cannot be safely automated (codex manual snapshot, glm
credential-gated monitor, cursor manual observation) keep their bounded manual
path AND fail closed to UNKNOWN; UNKNOWN is never treated as capacity.
Honest UNKNOWN values are preserved where they exist (cursor
freshness/ttl/reset stay `false` in the matrix — the matrix does not launder
them, it proves they cannot affect the promoted route's admission).

## GAP R4/R14 — route-specific disable / rollback (`R4_ROUTE_SPECIFIC_DISABLE=PASS`, `R14_REVERSIBLE_RESTORATION=PASS`)

Component: `tools/v4-phase-f-route-control-v1.mjs` + tracked state document
`configs/runtime/route-control/hermes-route-state.json`.

```text
ROUTE_CONTROL_SCHEMA=v4-phase-f-route-control-state-v1
ROUTE_ID=qwen_local+hermes+chatgpt_web
DEFAULT=DISABLED
UNKNOWN_STATE=FAIL_CLOSED
MISSING_STATE=FAIL_CLOSED
INVALID_STATE=FAIL_CLOSED
DISABLE_IDEMPOTENT=YES
RESTORATION_STATE_EXPLICIT=YES
RESTORATION_STATE=SHADOW_ONLY
```

Design invariants (all proven by deterministic tests F01–F14):

- The state space is EXACTLY `DISABLED | SHADOW_ONLY | CANDIDATE_ENABLED`.
  A production-enabled state is intentionally absent — this control cannot
  express production activation at all. `production_dispatch_permitted=false`
  is an invariant of every evaluation this control generation can emit.
- `CANDIDATE_ENABLED` is the explicit enabled-candidate flag WITHOUT
  production authorization (packet test case 2).
- Malformed state, missing state, missing document, foreign route id, invalid
  restoration target, invalid history -> fail closed, never enabled.
- `disable` is IDEMPOTENT: disabling an already-DISABLED valid document
  returns the same document byte-equal, no history growth (case 6).
- Disable from candidate state restores EXACTLY to `SHADOW_ONLY` with a
  bounded history entry (`restored_to: SHADOW_ONLY`), history capped at 8
  entries (case 5).
- Disable of a fail-closed/invalid input repairs TOWARD the canonical safe
  default document (never leaves a stale candidate in place).
- Restart/reload representation: the persisted document re-evaluates to
  `DISABLED` on every read; representation cannot accidentally enable (case 7).
- No dependency on legacy/staged components: state identity is the route id
  only; no D-0025 key, no OpenClaw, no WF61 reference (case 8).
- Bounded CLI (`--action init|show|disable|enable-candidate`) performs only
  explicit single-file mutation of the tracked state document.
- The route was NOT activated live to prove the switch: all proof is
  deterministic and offline.

## GAP R5 — end-to-end observability (`R5_END_TO_END_OBSERVABILITY=PASS`)

Component: `tools/v4-phase-f-route-observability-v1.mjs`
(`v4-phase-f-route-observability-v1`). It aggregates EXISTING observability —
RT25 decision envelopes, the quota join (admission + freshness evidence),
T23 read-only visibility, the Phase E composition output, the R4 control
evaluation, and the Web observation — into ONE bounded, authorization-neutral
observation envelope carrying every packet-required field:

`TASK_REF, ROUTE_SELECTED, MODE, RESOURCE_ADMISSION_RESULT,
RESOURCE_FRESHNESS_STATE, LOCAL_CONTROLLER_AVAILABILITY,
WEB_SURFACE_AVAILABILITY, AUTHORIZATION_RESULT, FALLBACK_OR_DEFER_REASON,
FAILURE_CLASS, ROUTE_ENABLE_DISABLE_STATE, ROLLBACK_STATE, OBSERVED_AT`

Fail-closed observability: every required field is ALWAYS present; a missing
input produces an explicit `{state: DEGRADED, reason_code}` — never a silently
absent field. No chain-of-thought, no secrets (structured envelopes only).

Required observable cases proven (F15–F22):

```text
OBSERVABILITY_NORMAL_ROUTE=PASS        (F15, DIRECT_COMMERCIAL)
OBSERVABILITY_SHADOW_ROUTE=PASS        (F16)
OBSERVABILITY_DEFER=PASS               (F17, Web unavailable -> explicit defer reason)
OBSERVABILITY_RESOURCE_UNKNOWN=PASS    (F18, CONSERVE_UNKNOWN_MISSING visible)
OBSERVABILITY_AUTHORIZATION_DENIED=PASS (F19, shadow-only, no bypass)
OBSERVABILITY_DISABLED_ROUTE=PASS      (F20)
OBSERVABILITY_ROLLBACK=PASS            (F21, restoration SHADOW_ONLY + history)
```

## Validation

Focused suite (new, deterministic, offline):
`tests/phase-f-readiness-gap-closure-v1/run.mjs` — **30/30 PASS**.

Regressions rerun after implementation:

```text
tests/hermes-phase-e-quota-degraded-shadow-route-v1   10/10 PASS
tests/rt25-canonical-closed-gate-e2e                  19/19 PASS
tests/rt25-t02-codex-quota-ingest                     13/13 PASS
tests/rt25-t03-glm-quota-ingest                       13/13 PASS
tests/rt25-t04-quota-state-join                        8/8 PASS
tests/rt25-t05-freshness-enforcement                   8/8 PASS
tests/rt25-t09-execution-selector                      5/5 PASS
tests/registry-v2                                     76/76 PASS
git diff --check                                       clean
```

Persisted sanitized evidence:
`reports/runtime/phase-f/phase-f-gap-closure-evidence.json`
(R2 matrix + R4 tracked-state evaluation + candidate→disable rollback proof
chain + R5 complete envelope; no secrets, no transcripts, no chain-of-thought).

## Acceptance markers

```text
OPERATOR_PHASE_F_DECISION=B_DEFER_RECORDED
R2_SOURCE_FRESHNESS_READINESS=PASS
R4_ROUTE_SPECIFIC_DISABLE=PASS
R14_REVERSIBLE_RESTORATION=PASS
R5_END_TO_END_OBSERVABILITY=PASS
FAIL_CLOSED_UNKNOWN_RESOURCE=PASS
FAIL_CLOSED_MISSING_ROUTE_STATE=PASS
FAIL_CLOSED_INVALID_ROUTE_STATE=PASS
ROUTE_DISABLE_IDEMPOTENT=PASS
RESTORATION_STATE_PROVEN=PASS
OBSERVABILITY_ROUTE_SELECTION=PASS
OBSERVABILITY_ADMISSION=PASS
OBSERVABILITY_AUTHORIZATION=PASS
OBSERVABILITY_DEFER_REASON=PASS
OBSERVABILITY_DISABLE_STATE=PASS
OBSERVABILITY_ROLLBACK_STATE=PASS
SILENT_FALLBACK=NO
AUTHORIZATION_BYPASS=NO
LEGACY_COMPONENT_ACTIVATED=NO
PRODUCTION_DISPATCH=NO
PROMOTION_EXECUTED=NO
ISSUE_73=OPEN
```

## Readiness re-evaluation (same R1–R14 criteria)

| ID | Criterion | Before | After | Evidence delta |
|---|---|---|---|---|
| R1 | Route safety | PASS | PASS | unchanged (Phase E) |
| R2 | Source freshness / fail-closed | UNKNOWN | **PASS** | R2 matrix + F23–F27; route deps proven, commercial pools fail-closed |
| R3 | Quota/resource attribution | PASS | PASS | unchanged (registry v2) |
| R4 | Rollback/disable mechanism | UNKNOWN | **PASS** | route control + F01–F14 |
| R5 | Observability | UNKNOWN | **PASS** | observability envelope + F15–F22 |
| R6 | Context recovery | PASS | PASS | unchanged (Phase D V2) |
| R7 | Authorization boundaries | PASS | PASS | unchanged; R4 control adds no authority |
| R8 | Provenance/auditability | PASS | PASS | unchanged; R5 envelope is additive read-only |
| R9 | No silent fallback | PASS | PASS | unchanged; explicit defer reasons observable |
| R10 | Controller/Web failure behavior | PASS | PASS | unchanged (Phase E E6/E7) |
| R11 | Operator policy preservation | PASS | PASS | unchanged |
| R12 | Legacy/staged components inactive | PASS | PASS | unchanged; R4 has no legacy dependency |
| R13 | Closed runtime gates remain closed | PASS | PASS | D-0025 untouched; no gate reopened |
| R14 | Promotion reversible/disableable | UNKNOWN | **PASS** | restoration to SHADOW_ONLY proven; idempotent disable proven |

```text
BLOCKING_UNKNOWN_COUNT=0
ALL_CRITICAL_READINESS_ITEMS=PASS=YES
ROLLBACK_DISABLE_READY=YES
OBSERVABILITY_READY=YES
READINESS=READY (criteria-level; NOT a promotion)
```

## Hard-wall result

```text
PRODUCTION_PROMOTION=NO
PRODUCTION_DISPATCH=NO
PHASE_F_PROMOTION_EXECUTED=NO
ISSUE_73_CLOSED=NO
CLOSED_RUNTIME_GATE_REOPENED=NO
LEGACY_STAGED_COMPONENT_ACTIVATED=NO
PUBLIC_CDP=NO
PUBLIC_NOVNC=NO
FUNNEL=NO
CREDENTIALS_IN_REPO=NO
PRIVATE_ENDPOINT_GUESSING=NO
SILENT_FALLBACK=NO
AUTHORIZATION_BYPASS=NO
NEW_QUOTA_SCHEMA=NO
NEW_ROUTING_AUTHORITY=NO
CHAIN_OF_THOUGHT_PERSISTED=NO
QWEN_GENERATIONS=0
GLM_CALLS=0
CODEX_CALLS=0
OPENAI_API_CALLS=0
CHATGPT_WEB_SENDS=0
N8N_MUTATIONS=0
VPS_MUTATIONS=0
TAILSCALE_MUTATIONS=0
ISSUE_STATE_MUTATIONS=0
```

## Minimum write set

```text
tools/v4-phase-f-route-control-v1.mjs
tools/v4-phase-f-route-observability-v1.mjs
tools/v4-phase-f-r2-source-freshness-v1.mjs
configs/runtime/route-control/hermes-route-state.json
tests/phase-f-readiness-gap-closure-v1/run.mjs
reports/runtime/phase-f/phase-f-gap-closure-evidence.json
reports/architecture/v4_hermes_phase_f_readiness_gap_closure_r2_r4_r5_v1.md
docs/decision-packets/v4-hermes-phase-f-promotion-gate-v1.md
docs/runtime/CURRENT_FRONTIER.md
```

## NEXT

A **NEW HUMAN PROMOTION DECISION GATE** on the Phase F packet (options A/B/C
unchanged in meaning). This task does NOT execute promotion and does NOT set
NEXT to production activation. The operator decision recorded for THIS task
remains B (defer); the gate simply becomes decidable with zero blocking
unknowns.
