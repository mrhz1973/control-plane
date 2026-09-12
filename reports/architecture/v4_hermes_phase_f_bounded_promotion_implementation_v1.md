# V4 Hermes Phase F — Bounded Promotion Implementation v1

- **BLOCK-ID**: `V4_HERMES_PHASE_F_BOUNDED_PROMOTION_IMPLEMENTATION_V1`
- **Date**: 2026-09-12
- **Base HEAD**: `51a652151aa845dc25715803f9dea9b0e2ad85e6`
- **Decision implemented**: `PHASE_F_FINAL_DECISION=A_AUTHORIZE_BOUNDED_PROMOTION_IMPLEMENTATION` (human operator; supersedes the earlier B-defer **for implementation only**)
- **Not authorized by this task**: production activation, production dispatch, issue #73 closure.

---

## 1. Scope and outcome

The qualified continuity route `qwen_local → hermes → chatgpt_web` is now **technically
promotion-capable**: a deterministic dual-gate evaluation can classify a future dispatch as
`READY_FOR_AUTHORIZED_DISPATCH` while the route stays **DISABLED**, in **SHADOW_ONLY** mode,
with **zero** production authorization, **zero** dispatch, and **zero** activation.

```
RESULT: the code knows HOW to execute the route; nothing was executed, nothing was activated.
```

## 2. Canonical boundary discovery (Section 6 of the task contract)

| Question | Answer (existing, reused) |
|---|---|
| Where is the execution route selected? | RT25 execution selector (`rt25-execution-quota-aware-selector-v1`) + Phase E composition gate (`evaluate-hermes-phase-e-shadow-route-v1`) — Phase E stops at `SHADOW_ROUTE_SELECTED`, no execution |
| Where does the execution packet enter implementation? | `v4-execution-adapter-router-v1.routeToExecutionAdapter` → adapter registry (`v4-execution-adapter-registry-v1`, identity law `route_id === implementer+model`, wildcard rejected) |
| Where is authorization checked? | Per-adapter validation of the `operator-runtime-authorization-v1` envelope (as `opencode-execution-adapter-v1` already does), plus server-side issuance/spend (`v4-runtime-authorization-issuance-v1`, `v4-runtime-authorization-provenance-registry-v1`) |
| Where must route-control be consumed? | Inside the promotion adapter, BEFORE any eligibility (`v4-phase-f-route-control-v1`, fail-closed law preserved verbatim) |
| Where can the qualified Hermes route be reused? | `hermes-per-invocation-browser-allowlist-v1.mjs#chainSend` (structurally bound, **never invoked** by this task) + independent DOM verifier as the only send-confirmation boundary |
| Where does observability attach? | Existing `v4-phase-f-route-observability-v1` envelope (R5) + the new dispatch-decision envelopes (`evaluatePromotedRouteDispatch` / `executePromotedRoute` outputs) |

**Governance note**: the authorization **issuance/spend** machinery remains pinned to
`opencode+qwen_local`. This task consumes the existing authorization *representation*
(envelope) pinned to the promoted route; widening the issuance allow-list is deliberately
left to the future activation gate (Section 11 law). No second registry, no second router,
no second quota layer.

## 3. New components (minimum delta)

| File | Role |
|---|---|
| `tools/v4-phase-f-promotion-adapter-v1.mjs` | Promotion-capable execution adapter/boundary: dual-gate eligibility evaluation + dependency-injected execution edge with fail-closed defaults |
| `tests/phase-f-bounded-promotion-implementation-v1/run.mjs` | 24 deterministic offline checks (P01–P18, O01, I01–I05) |
| `tools/v4-phase-f-promotion-evidence-v1.mjs` | Sanitized evidence generator (offline, deterministic) |
| `reports/runtime/phase-f/phase-f-bounded-promotion-implementation-evidence.json` | Persisted sanitized evidence |
| `reports/architecture/v4_hermes_phase_f_bounded_promotion_implementation_v1.md` | This report |
| `docs/decision-packets/v4-hermes-phase-f-promotion-gate-v1.md` | Decision A recorded (B preserved historically) |
| `docs/runtime/CURRENT_FRONTIER.md` | Live canonical state + NEXT updated |

### Dual-gate eligibility (`evaluatePromotedRouteDispatch`)

Pure and deterministic. Consumes ONLY existing upstream outputs: route-control document,
Phase E decision, quota-state join, Web observation, controller availability, and an
injected authorization envelope. Every condition must be explicitly true; any
NO/UNKNOWN/STALE/MISSING/INVALID → `BLOCKED`, fail-closed, `production_dispatch=false`.

Order of gates (fail-closed earliest-first): identity binding → silent-fallback rejection →
route id → route control (DISABLED/SHADOW_ONLY/CANDIDATE law) → Phase E identity+hard-wall
envelope → resource admission (freshness TTL **reused** from
`compose-v4-resource-status-control-plane-v1`) → controller availability → Web surface
availability → authorization envelope (route-pinned, ACTIVE, task-bound scope, production
flag) → hard walls. Only then: `status=ELIGIBLE`, `classification=READY_FOR_AUTHORIZED_DISPATCH`,
`production_dispatch=false` (eligibility is NOT dispatch).

### Execution edge (`executePromotedRoute`)

- Eligibility tamper check (schema, status, classification, binding task/run match).
- **Transport is dependency-injected ONLY** — no default transport exists by design;
  missing transport ⇒ `TRANSPORT_NOT_PROVIDED_FAIL_CLOSED`.
- The structurally-bound qualified primitive (`chainSend`) is **refused** unless a future
  explicit `production_activation_confirmed=true` is passed by the activation gate
  (`ACTIVATION_NOT_CONFIRMED` otherwise).
- A transport claiming `execution_performed=true` without an injected verifier is
  downgraded to `INDEPENDENT_VERIFICATION_REQUIRED` (transport success is not send
  success — Phase D law).

## 4. Proofs

### Negative (P01–P14) — all dispatch-blocked, `production_dispatch=false`
P01 DISABLED blocks; P02 SHADOW_ONLY blocks production; P03 auth not-ACTIVE blocks;
P04 missing auth blocks; P05 malformed auth blocks (incl. wrong-route, spent, wrong schema);
P06 stale resources block (composer rejects the stale contribution and falls back to the
fail-closed baseline — join reports controller unavailable; blocked either way);
P07 unknown/invalid join blocks; P08 controller unavailable blocks; P09 Web unavailable
blocks; P10 route-id mismatch blocks; P11 provenance mismatch blocks (envelope AND
execution-edge tamper); P12 legacy/staged route request blocked (openclaw can never be a
valid auth route); P13 silent-fallback attempt rejected outright (any fallback field ⇒
`SILENT_FALLBACK_REJECTED`); P14 authorization present but control DISABLED still blocks.

### Positive dry-run (P15/P16)
With ALL simulated future conditions true (candidate-enabled control doc, Phase E shadow
selection from a REAL quota join, fresh admission, controller+Web available, TEST-ONLY
synthetic authorization fixture): `ELIGIBLE` / `READY_FOR_AUTHORIZED_DISPATCH`,
`execution_performed=false`. Execution edge with the real qualified transport but no
activation confirmation ⇒ `ACTIVATION_NOT_CONFIRMED`, nothing runs. With a stub transport
⇒ `DRY_RUN`, `transport_stubbed=true`, `execution_performed=false`.

**`PROMOTION_CAPABLE_DRY_RUN=PASS`, `REAL_PRODUCTION_DISPATCH=NO`.**
The TEST-ONLY fixture (`TEST-ONLY-SYNTHETIC-FIXTURE-0001`) exists only inside test/evidence
invocations and is never persisted as active runtime authorization.

### Rollback (P17/P18)
candidate → disable ⇒ exact `SHADOW_ONLY` restoration semantics, `disable_history` records
the transition, rollback-ready observed, disable idempotent; dispatch evaluation after
rollback ⇒ `ROUTE_CONTROL_DISABLED` (blocked). **`ROLLBACK_AFTER_CANDIDATE=PASS`,
`POST_ROLLBACK_DISPATCH_BLOCKED=PASS`, `DISABLE_IDEMPOTENT=PASS`.**

### Observability (O01) and integration law (I01–I05)
O01: R5 envelope exposes `route_enable_disable_state`, `authorization_result`,
`observed_at`; dispatch envelopes expose `EXECUTION_ELIGIBILITY` and `EXECUTION_PERFORMED`;
no chain-of-thought, no secrets. I01: adapter consumes (never reimplements) route control /
TTL / join / selection; no network of its own. I02: qualified Hermes binding is structural,
model-visible tools remain exactly 4. I03: canonical adapter-registry default remains
exactly `opencode+qwen_local` — no second router. I04: no production-enabling path baked
into module code. I05: provenance-registry route allow-list NOT widened.

## 5. Test / regression results

| Suite | Result |
|---|---|
| `tests/phase-f-bounded-promotion-implementation-v1/run.mjs` (new, focused) | 24/24 PASS |
| `tests/phase-f-readiness-gap-closure-v1/run.mjs` | 30/30 PASS |
| `tests/hermes-phase-e-quota-degraded-shadow-route-v1/run.mjs` | 10/10 PASS |
| `tests/rt25-t04-quota-state-join/run.mjs` | 8/8 PASS |
| `tests/rt25-t09-execution-selector/run.mjs` | 5/5 PASS |
| `tests/v4-execution-adapter-registry/run.mjs` | 19/19 PASS |
| `tests/v4-execution-adapter-router/run.mjs` | 15/15 PASS |
| `tests/registry-v2/run.mjs` | 76/76 PASS |
| `git diff --check` | clean |

No live Qwen generation, no ChatGPT Web send, no provider call, no browser automation.

## 6. Final persisted state (verified)

```
ROUTE_CONTROL_STATE=DISABLED        (configs/runtime/route-control/hermes-route-state.json, unchanged)
CURRENT_MODE=SHADOW_ONLY
ACTIVE_PRODUCTION_AUTHORIZATION=0
PRODUCTION_DISPATCH=NO
PROMOTION_ACTIVATED=NO
ISSUE_73=OPEN
CLOSED_RUNTIME_GATES_REMAIN_CLOSED=YES
LEGACY_STAGED_COMPONENTS_REMAIN_INACTIVE=YES
```

## 7. NEXT (human gate — required)

The final production activation decision is the ONLY remaining gate. Options:

- **A — ACTIVATE** the implemented route under bounded production authorization
  (requires the activation gate to issue runtime authorization through the EXISTING
  issuance/provenance machinery, widening its route allow-list explicitly);
- **B — KEEP** the implementation ready but remain DISABLED / SHADOW_ONLY;
- **C — REJECT** activation and preserve the non-production state.

No option is executed by this task.
