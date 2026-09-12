# V4 Hermes Phase F bounded production activation

**TASK_REF:** `V4_HERMES_PHASE_F_BOUNDED_PRODUCTION_ACTIVATION_V1`
**BASE_HEAD:** `8323b2f91b91ba120a8fc142fe0313e7b8c31db8`
**DATE:** 2026-09-12
**RESULT:** `PASS — ACTIVATED, CANARY-PROVEN, ROLLED BACK TO DISABLED`

## Result summary

```text
FINAL_PRODUCTION_ACTIVATION_DECISION=A_RECORDED
PROMOTED_ROUTE_ACTIVATION=PASS
EXACT_ROUTE_AUTHORIZATION=PASS
AUTHORIZATION_BOUNDED=YES
ROUTE_CONTROL_ACTIVE_STATE=CANDIDATE_ENABLED (during canary only; final DISABLED)
RT25_ADMISSION_REUSED=YES
HERMES_QUALIFIED_TRANSPORT_REUSED=YES
OBSERVABILITY_LIVE=PASS
ROLLBACK_READY=YES
SILENT_FALLBACK=NO
AUTHORIZATION_BYPASS=NO
LIVE_CANARY=PASS
LIVE_DISPATCH_COUNT=1
```

## Human decision

Decision **A — ACTIVATE the qualified route under bounded production authorization**
was recorded in the task prompt and exercised **in-band** through the canonical
Telegram issuance gate: two operator APPROVE events were consumed during the task
(first issuance for the initial canary attempt, second for the repaired canary;
the first authorization was ledger-consumed with zero production dispatches before
any send could occur, so the single-dispatch budget was never violated).

## Minimum delta applied

1. **Exact-route authorization extension (repo pins):**
   `tools/v4-runtime-authorization-provenance-registry-v1.mjs` (validator + appended-entry
   route pin) and `tools/v4-runtime-authorization-issuance-v1.mjs` (`ALLOWED_ROUTES`
   + pending-store validator) now admit exactly two routes:
   `opencode+qwen_local` and `hermes+chatgpt_web`. No other route was added;
   `tests/phase-f-bounded-promotion-implementation-v1` I05 now asserts exactly this
   two-route law, preserving the historical anti-broadening intent.
   User-local issuance config (`allowed_routes`) extended equivalently.
2. **Route control:** `configs/runtime/route-control/hermes-route-state.json`
   `DISABLED -> CANDIDATE_ENABLED` for the canary, then restored `DISABLED`
   post-canary with a `disable_history` entry (restoration target `SHADOW_ONLY`).
   `CANDIDATE_ENABLED` alone never authorized anything — the adapter requires an
   ACTIVE, route-pinned, provenance-bound authorization envelope in addition.
3. **Issuance:** pending registered through the canonical service
   (`127.0.0.1:18792`), operator APPROVE on Telegram, `ACTIVE` registry entry
   route-pinned with 1h TTL, ledger-first spend + `ACTIVE -> SPENT` BEFORE transport.
4. **Canary driver:** `tools/v4-phase-f-live-canary-v1.mjs` — RT25 admission via the
   canonical producer (`produce-v4-local-runtime-readonly-contribution-v1.mjs`) +
   composer + join + selector + Phase E shadow gate; eligibility via the real
   promotion adapter; the ONE production send routed through
   `executePromotedRoute` with `production_activation_confirmed=true` and the
   qualified `chainSend` transport; independent DOM verification required.

## Canary (the one bounded live proof)

| Field | Value |
|---|---|
| RUN_ID | `108690b6ad15430eb2f55c885b1eca9e` |
| Authorization | `AUTH-PROMO-ACT-4c15532ece9fcce4` (route-pinned, spent) |
| Qwen generations (controller S0/S1) | 2 |
| ChatGPT Web production sends | **1** |
| Transport | chain-send S1: snapshot -> fill -> press Enter, ONE agent-browser connection (exact Phase D-qualified primitive) |
| Adapter status | `EXECUTED_CONFIRMED`, `verification_state=CONFIRMED` |
| Independent DOM verify | `REAL_USER_TURN_DOM_CONFIRMED=PASS` (1 user turn with canary payload + 1 assistant reply, composer empty) |
| Trace / result | `reports/runtime/phase-f/phase-f-activation-canary-trace.json` / `-result.json` |

## Repairs during the session (bounded-repair policy applied)

- **Attempt 1 STOP at S1_TYPE:** agent-browser refs are connection-scoped; a
  standalone `exec-tool browser_type` (separate CLI invocation) can never resolve
  the S0 snapshot ref. Repair: S1 now *validates* the controller's `browser_type`
  decision and the type executes inside the adapter-routed chain-send batch —
  the same qualified Phase D transport, no new transport, no authority change.
- **Attempt 2 STOP at RT25_JOIN:** composer correctly rejected the contribution as
  `CONTRIBUTION_FUTURE_DATED` because the driver captured `nowMs` before spawning
  the producer. Repair: admission clock captured after the observation.
- **Issuance retry:** first re-registered pending expired without an operator tap
  reaching the service within its TTL; re-registered and approved in-band.

All repairs are same-task, same-objective, zero scope/authority/hard-wall change,
per `docs/contracts/bounded-repair-continuation-policy-v1.md`.

## Rollback (proven immediately after the canary)

Route control restored to `DISABLED` (restoration `SHADOW_ONLY`) with history
entry; the adapter now returns `status=BLOCKED`,
`classification=ROUTE_CONTROL_DISABLED` — the promoted route cannot dispatch
again without a new human gate.

## Regressions (all green post-change)

```text
tests/phase-f-bounded-production-activation-v1        13/13
tests/phase-f-bounded-promotion-implementation-v1     24/24
tests/v4-runtime-authorization-issuance               60/60
tests/v4-runtime-authorization-durable-spend-ledger   13/13
tests/hermes-phase-e-quota-degraded-shadow-route-v1   10/10
tests/phase-f-readiness-gap-closure-v1                30/30
tests/v4-local-runtime-readonly-contribution          57/57
tests/rt25-t04-quota-state-join                        8/8
tests/rt25-t09-execution-selector                      5/5
```

Bounded evidence: `reports/runtime/phase-f/phase-f-bounded-production-activation-evidence.json`.

## Scope invariants

No second router, quota system, authorization system, or transport was created.
Operator resource policies remain authoritative. Fail-closed behavior was observed
live (BUSY/UNCERTAIN/future-dated admissions correctly blocked dispatches before
any send).
