# V4 Hermes Phase E quota-degraded shadow route V1

**TASK_REF:** `V4_HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE_V1`
**TASK_KIND:** `SHADOW_RUNTIME_QUALIFICATION`
**ISSUE:** `#73` (OPEN, read-only verified)
**BASE_HEAD:** `a99e7760da9f0f4ea2e2ebd0f647008bb464f98c`
**Classification:** `PASS — deterministic Phase E selection qualification; no new Web send`

## Outcome

Phase E qualifies the existing composition, not a new quota system:

```text
existing RT25 commercial decision
  + explicit Qwen local admission
  + explicit ChatGPT Web separate-availability observation
  -> QWEN_LOCAL -> HERMES -> CHATGPT_WEB -> deterministic validation
```

The Phase E composition gate is pure and deterministic. It consumes the
existing RT25 execution decision; it does not calculate quota, choose a
commercial provider, invoke Hermes, invoke a browser, dispatch work, or alter
authorization. It selects the shadow route only after RT25 has fail-closed all
direct commercial candidates and only when Qwen local and ChatGPT Web have
independent explicit positive admission.

## Predecessor phases and reused components

| Area | Reused evidence/component | Result |
|---|---|---|
| Phase C | canonical Qwen -> Hermes -> ChatGPT Web shadow proof | PASS, preserved |
| Phase D V2 | fresh-chat rollover, stale-generation/context-delta fences, structural DOM verification | PASS, preserved |
| RT25 | quota join, freshness, reserve admission, execution selector, provenance/authorization/result gate | Reused; no parallel quota logic |
| Registry v2 | model/role -> access surface -> quota pool; Web surface has null pool | Reused unchanged |
| Web observatory | `SEPARATE_AVAILABILITY_DOMAIN`, never unlimited/free | Reused unchanged |
| Qwen boundary | local probe and role adequacy gate | Reused unchanged |
| Authorization | closed production gate and no bypass | Reused unchanged |

`RT25_REUSE_REQUIRED=YES`

`ARE_WE_REBUILDING_RT25_ALREADY_IMPLEMENTED=NO`

## Route under test

The tested shadow route identity is exact:

```text
controller=qwen_local
bridge=hermes
target=chatgpt_web
mode=SHADOW_ONLY
production_dispatch=false
promotion_phase_executed=false
```

ChatGPT Web is a separate observed availability domain. It has no quota pool in
the registry and is never modeled as unlimited, free, quota-independent, or
equivalent to a Codex subscription access surface.

## Deterministic matrix

Commercial and Qwen synthetic inputs are existing
`v4-resource-status-contribution-v1` forms, marked `SHADOW_TEST_INPUT` by
contribution identity. Web test inputs use the existing
`collectChatgptWebObservation` injected-observation contract and are likewise
labelled `SHADOW_TEST_INPUT`; no new Web quota or observation schema exists.
They do not change live resource state or consume commercial capacity. Qwen
ready input is accepted only through the existing `local_probe` /
`qwen_occupancy` law. Commercial state is accepted only through the existing
RT25 composer/join/admission law.

| SCENARIO | COMMERCIAL STATE | LOCAL CONTROLLER | CHATGPT WEB | EXPECTED ROUTE | ACTUAL ROUTE | MODE | RESULT |
|---|---|---|---|---|---|---|---|
| E1 normal eligible | FRESH, AVAILABLE, ADMISSIBLE | available/adequate | available/fresh/authenticated | direct commercial remains preferred | direct commercial | DIRECT_COMMERCIAL | PASS |
| E2 reserve | FRESH at canonical reserve floor | available/adequate | available/fresh/authenticated | protect scarce pool; shadow candidate permitted | Qwen -> Hermes -> Web | SHADOW_ONLY | PASS |
| E3 exhausted | EXHAUSTED | available/adequate | available/fresh/authenticated | degraded shadow route | Qwen -> Hermes -> Web | SHADOW_ONLY | PASS |
| E4 stale | STALE, rejected by RT25 | available/adequate | available/fresh/authenticated | commercial fail-closed; explicit shadow candidate | Qwen -> Hermes -> Web | SHADOW_ONLY | PASS |
| E5 unknown | missing/UNKNOWN, not invented | available/adequate | available/fresh/authenticated | commercial fail-closed; explicit shadow candidate | Qwen -> Hermes -> Web | SHADOW_ONLY | PASS |
| operator policy | deterministic commercial `INELIGIBLE_BY_OPERATOR_POLICY` | available/adequate | available/fresh/authenticated | consume admission outcome without provider-policy duplication | Qwen -> Hermes -> Web | SHADOW_ONLY | PASS |
| E6 Web unavailable | direct commercial unavailable | available/adequate | unavailable | DEFER/STOP; never Hermes route | no route | DEFERRED | PASS |
| E7 Qwen unavailable | direct commercial unavailable | unavailable/inadequate | available/fresh/authenticated | degraded route not selectable | no route | DEFERRED | PASS |
| E8 authorization wall | direct commercial exhausted | available/adequate | available/fresh/authenticated | shadow selection only; no production | Qwen -> Hermes -> Web | SHADOW_ONLY | PASS |

The focused deterministic suite is `10/10 PASS`. It uses the actual RT25
execution selector for the direct commercial decision and only composes its
result. Normal selection is therefore not stolen by Hermes; RT25 remains the
admission/selection authority.

## Fail-closed and authority results

- Fresh, healthy commercial capacity stays preferred.
- Reserve admission rejects capacity at/below the policy floor before exhaustion.
- Stale and unknown commercial evidence remain fail-closed; they are never
  promoted to available.
- The operator window is consumed as a deterministic
  `INELIGIBLE_BY_OPERATOR_POLICY` result; Phase E does not reimplement GLM or
  provider-specific window logic.
- ChatGPT Web unavailable/stale/not-authenticated/throttled fails closed.
- Qwen unavailable or task-inadequate fails closed.
- A production authorization value other than explicit `false` fails closed.
- Hermes receives no authority to choose backlog, quota, commercial route,
  fallback, scheduler action, or production dispatch.
- No legacy/staged component is selected or activated.

## Live shadow execution

No fresh live execution was required. Phase C/D already provide the qualified
browser/send, structural verification, stale-generation, context-delta, and
ambiguous-send evidence; this task closes the previously missing deterministic
quota-degraded selection composition.

```text
LIVE_SHADOW_ROUTE_CONFIRMED=REUSED_PREDECESSOR_EVIDENCE
QWEN_GENERATIONS_LIVE=0
CHATGPT_WEB_SENDS=0
```

The predecessor evidence is preserved, including:

```text
STALE_GENERATION_FENCE=PASS
CONTEXT_DELTA_FENCE=PASS
AMBIGUOUS_SEND_RECONCILIATION=PASS
OLD_CHAT_DEPENDENCY=NO
BOUNDED_DELTA_ONLY=YES
IMPLICIT_FALLBACK=NO
RAW_CDP_CONTROLLER_EXPOSURE=NO
```

## Validation

Focused tests run for this change:

```text
tests/hermes-phase-e-quota-degraded-shadow-route-v1       10/10 PASS
tests/rt25-t04-quota-state-join                           8/8 PASS
tests/rt25-t05-freshness-enforcement                      8/8 PASS
tests/rt25-t06-reserve-admission                          9/9 PASS
tests/rt25-t09-execution-selector                         5/5 PASS
tests/registry-v2                                        76/76 PASS
```

No Hermes allowlist, Phase C/D fence, registry, quota schema, quota router,
browser implementation, or runtime activation code was modified.

## Hard-wall result

```text
ISSUE_73_PHASE_E=PASS
HERMES_PHASE_E_QUOTA_DEGRADED_SHADOW_ROUTE=PASS
RT25_REUSE_REQUIRED=YES
NEW_QUOTA_SCHEMA_CREATED=NO
NEW_QUOTA_ROUTER_CREATED=NO
NORMAL_COMMERCIAL_PREFERENCE_PRESERVED=PASS
RESERVE_PRESERVATION=PASS
EXHAUSTED_COMMERCIAL_DEGRADED_SELECTION=PASS
STALE_QUOTA_FAIL_CLOSED=PASS
UNKNOWN_QUOTA_FAIL_CLOSED=PASS
CHATGPT_WEB_UNAVAILABLE_FAIL_CLOSED=PASS
QWEN_UNAVAILABLE_FAIL_CLOSED=PASS
HIDDEN_HERMES_FALLBACK=NO
SILENT_FALLBACK=NO
AUTHORIZATION_BYPASS=NO
CHATGPT_WEB_INFINITE_CLAIM=NO
LEGACY_COMPONENT_ACTIVATED=NO
CLOSED_RUNTIME_GATE_REOPENED=NO
PRODUCTION_DISPATCH=NO
PROMOTION_PHASE_EXECUTED=NO
RUNTIME_MUTATIONS=0
ROUTING_RUNTIME_MUTATIONS=0
MODEL_RUNTIME_CALLS=0
N8N_MUTATIONS=0
VPS_MUTATIONS=0
TAILSCALE_MUTATIONS=0
OPENCLAW_ACTIVATION=0
ISSUE_STATE_MUTATIONS=0
```

## Minimum write set

```text
tools/evaluate-hermes-phase-e-shadow-route-v1.mjs
tests/hermes-phase-e-quota-degraded-shadow-route-v1/run.mjs
reports/architecture/v4_hermes_phase_e_quota_degraded_shadow_route_v1.md
docs/runtime/CURRENT_FRONTIER.md
```

## NEXT

`V4_HERMES_PHASE_F_PROMOTION_GATE_PREPARATION_V1`

This is a future, separate, human-gated preparation task. It does not activate
production fallback, promotion, a closed runtime gate, OpenClaw, or issue
closure.
