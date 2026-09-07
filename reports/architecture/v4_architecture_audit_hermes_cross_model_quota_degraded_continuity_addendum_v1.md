# V4 architecture audit #61 — Hermes cross-model / quota-degraded continuity addendum

Date: 2026-09-07

Parent audit: `reports/architecture/v4_architecture_audit_hermes_consolidation_component_retirement_astra_ultra_v1.md`
Parent audit remote commit: `7ed8093eae7e2ca0a4d729565cbe396ba643084b`
Issue: #61

Status: `AUDIT_ADDENDUM / ARCHITECTURAL_CORRECTION_ONLY`

This addendum does **not** change live runtime state, authorization, D-0025, OLD retention, OpenClaw activation, workflow publication, model eligibility or the parent audit disposition counts. It sharpens one architectural property that the parent audit recognized in evidence but did not elevate strongly enough in the preferred TO-BE.

## 1. Corrected strategic interpretation of Hermes

The important differentiator is not merely that Hermes can automate a browser.

Hermes is a candidate **cross-model cognitive/browser bridge**: the same governed browser/tool surface can be driven by a remote controller or by a local controller, while the cognitively stronger answer surface can be an authenticated ChatGPT Web session.

Already-established bounded evidence in #61 includes both shapes:

```text
REMOTE CONTROLLER
GLM -> Hermes -> authenticated ChatGPT Web
```

and

```text
LOCAL CONTROLLER
Qwen local -> Hermes -> authenticated ChatGPT Web
```

The parent audit already records the historical GLM→Hermes and Qwen→Hermes proof sessions and correctly distinguishes the Hermes controller from the model answering inside ChatGPT Web. The architectural consequence is stronger than a generic "browser worker" label: **Hermes can unify local and remote controller routes behind one cognitive/browser execution surface without becoming Control Plane authority.**

## 2. Preferred TO-BE refinement

Preferred label remains:

`DETERMINISTIC_CORE_WITH_BOUNDED_HERMES_COGNITION`

Refined cognitive-path interpretation:

```text
GitHub / deterministic core = authority
n8n = deterministic scheduling / transport / gates where justified

                         COGNITIVE DEMAND
                                |
                     governed route decision
                        /                 \
            REMOTE controller         LOCAL controller
             GLM / specialist             Qwen
                        \                 /
                         ---- HERMES ----
                              |
                    authenticated browser
                              |
                         ChatGPT Web
                              |
                   bounded cognitive result
                              |
                  deterministic validation
                              |
              implementation / review routes
```

Hermes must **not** own canonical state, authorization, spend provenance, deterministic admission, review acceptance or retry authorization. It is a governed cognitive/tool bridge.

## 3. QUOTA_DEGRADED_COGNITIVE_MODE

A specific resilience mode should be designed and qualified:

`QUOTA_DEGRADED_COGNITIVE_MODE`

Purpose: preserve useful project operation when direct commercial coding/planner routes are exhausted or unavailable but local Qwen and ChatGPT Web remain available.

Target architecture:

```text
COMMERCIAL DIRECT ROUTES
Codex / GLM / Cursor route capacity = unavailable or below admission threshold

LOCAL CONTROLLER
Qwen local = available
        |
        v
Hermes
        |
        v
Authenticated ChatGPT Web = observed available
        |
        v
TASK DELTA / diagnosis / architecture / synthesis candidate
        |
        v
Deterministic schema + canonical HEAD + gate validation
        |
        +--> Qwen + OpenCode for bounded local implementation when task-adequate
        +--> defer / human gate when no adequate execution route exists
```

This mode is a **continuity route**, not an authorization bypass and not an assertion that ChatGPT Web is unlimited. ChatGPT Web must be represented as a separate observed availability domain whose current usability is checked dynamically.

No direct route exhaustion may remove:
- canonical GitHub authority;
- deterministic validation;
- human authorization where required;
- execution provenance / spend rules;
- STOP semantics;
- review/retry independence requirements.

## 4. LIVE_QUOTA_STATUS requirement

The audit confirmed that registry v2 models:

`MODEL / ROLE -> ACCESS_SURFACE -> QUOTA_POOL`

but current Control Plane evidence does not provide automatic live commercial quota collectors. This leaves routing structurally aware of pools but operationally blind to remaining capacity.

The TO-BE therefore requires a fresh, timestamped `LIVE_QUOTA_STATUS` layer:

```text
MODEL
  -> ACCESS_SURFACE
  -> QUOTA_POOL
  -> LIVE_AVAILABLE_CAPACITY
     - observed_at
     - freshness / ttl
     - remaining / used representation supported by source
     - reset horizon when observable
     - confidence / evidence source
     - admission state
```

Minimum target surfaces/pools to evaluate:
- Codex subscription 5-hour and weekly windows;
- GLM Coding Plan short-window and weekly quota;
- Cursor included-model / other-model allowance where observable;
- ChatGPT Web availability as a distinct surface/domain, without inventing an equivalence to Codex subscription quota;
- Qwen local readiness / occupancy / resource headroom as non-commercial capacity.

Rules:
1. Never invent dynamic percentages when no source exists.
2. Stale commercial observations must not be treated as fresh capacity.
3. Route preservation should begin **before** hard exhaustion when policy reserve thresholds apply.
4. Different UI/access surfaces sharing one quota pool count as one capacity domain.
5. Qwen local is unmetered commercially but not free of latency/GPU/availability cost.
6. ChatGPT Web must not be labeled `INFINITE`; model it as `SEPARATE_AVAILABILITY_DOMAIN` with observed health/availability.

## 5. Strategic reason to implement Hermes

Even if Hermes replaces zero deterministic control components, it can still be worth implementing/promoting because it introduces a capability the existing fragmented surfaces do not provide as one governed path:

**local-or-remote controller -> one Hermes tool/browser surface -> authenticated ChatGPT Web -> bounded result.**

That gives the Control Plane a credible path to remain cognitively useful when direct provider coding quotas are exhausted, especially when paired with local Qwen/OpenCode execution.

This is a resilience and access-composition benefit, not a component-count reduction claim.

## 6. Proof gates before promotion

The parent audit B1/B2 gates remain valid and are extended, not weakened.

Before `QUOTA_DEGRADED_COGNITIVE_MODE` is promoted beyond shadow/manual use, prove at minimum:

1. `QWEN_LOCAL -> HERMES -> CHATGPT_WEB` produces one real bounded TASK DELTA from lean canonical inputs.
2. Deterministic validator rejects stale/wrong HEAD, scope, target, hard walls, STOP or self-authorization.
3. Fresh-chat rollover reproduces canonical NEXT from GitHub without dependence on old chat memory.
4. Controller identity, ChatGPT Web surface, elapsed time, retries and quota/availability observations are persisted separately.
5. Browser/controller failure returns bounded unavailable/STOP and falls back only to an admitted adequate route.
6. Qwen/OpenCode execution remains separately bounded and cannot inherit authorization from the cognitive route.
7. `LIVE_QUOTA_STATUS` can distinguish fresh, stale, unavailable and unknown commercial-capacity evidence without inventing values.

## 7. Disposition / counting impact

No parent material component row changes in this addendum.

```text
PARENT_MATERIAL_COMPONENT_TOTAL=29
PARENT_KEEP=21
PARENT_MERGE=1
PARENT_REPLACE_WITH_HERMES=0
PARENT_RETIRE=0
PARENT_KEEP_PENDING_PROOF=7
ADDENDUM_DISPOSITION_COUNT_CHANGE=0
```

The correction changes **architectural emphasis and future qualification scope**, not current component disposition.

## 8. Recommended implementation order

Future bounded work should proceed in this order:

1. `LIVE_QUOTA_STATUS` evidence model + collectors/adapters where technically obtainable.
2. Shadow `QWEN_LOCAL -> HERMES -> CHATGPT_WEB` canonical TASK DELTA proof.
3. Deterministic candidate validator and stale-generation fence.
4. Fresh-chat rollover / recovery proof.
5. Shadow quota-degraded route-selection proof.
6. Separate human promotion gate before any automatic preferred/fallback route change.

No production mutation is authorized by this addendum.
