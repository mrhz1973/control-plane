# V4_RT25_CANONICAL_ENTRYPOINT_INTEGRATION_CORRECTION_V1

**TASK_REF:** `V4_RT25_CANONICAL_ENTRYPOINT_INTEGRATION_CORRECTION_V1` · tracking #41 (reopened) · parent #32
**BASE_HEAD:** `0ec7826c8f4e6134e00afe29d9cd71d96da1de73` (post-hygiene restore; commits 04f0e493 + 0ec7826 untouched)
**Classification:** `PASS — CANONICAL PLANNER WIRED + CANONICAL EXECUTION ROUTER WIRED + REAL UPSTREAM → BRIDGE PROPAGATION PROVEN + CANONICAL CLOSED-GATE E2E PASS (12/12) + FOCUSED A..L PROOF (34/34) + CONSUMER REGRESSIONS 158/158; D-0025 UNCHANGED (CLOSED)`

## 1. Problem (post-AGG correction, accepted)

The RT25 modules existed and bridge/endpoint hooks existed (T21/T22), but the
CANONICAL runtime entrypoints were NOT consuming them:

- `tools/evaluate-planner-selection.mjs` — pre-RT25 evaluator (operator `provider_state` only)
- `tools/evaluate-execution-route.mjs` — pre-RT25 v1 router (registry+status only)
- the bridge `quota_decision` input had NO canonical upstream producer (T24 composed
  modules inside a test harness — composability proof, not canonical invocation)

## 2. Call-graph trace (before editing — REQUIRED WORK §1)

Canonical planner path (verified by code search):

```
backlog-gate (operator provider_state, D-0025-gated)
  → tools/build-primary-remote-cycle-input-from-backlog.mjs   (emits routing_input)
  → tools/run-litellm-primary-cycle.mjs prepareCycle          (single canonical upstream composition point)
  → tools/evaluate-planner-selection.mjs evaluatePlannerSelection  (CANONICAL PLANNER ENTRYPOINT)
```

Canonical execution path (verified: bridge is the ONLY runtime consumer of the router):

```
tools/n8n-v4-execution-routing-bridge-v1.mjs runN8nExecutionRoutingBridge
  → tools/evaluate-execution-route.mjs evaluateExecutionRoute (CANONICAL EXECUTION-ROUTER ENTRYPOINT)
```

Reviewer/retry canonical boundaries: **NONE EXIST** (code search: the RT25
reviewer/retry selectors are reached only by their own modules/tests; no runtime
runner performs reviewer/retry route selection — qwen adapter roles are
prompt-level, not route-selection boundaries).

## 3. Integration implemented (no parallel selector, no duplicate policy)

### 3.1 New canonical producer — `tools/rt25-canonical-quota-state-v1.mjs`

Single canonical producer of the normalized quota-pool state, composing ONLY
real sources (never a synthetic side input invented for tests):

- RESOURCE_REGISTRY = real `configs/resources/registry.json` (v2 `quota_pools` required)
- baseline = real fail-closed `configs/resources/status.fail-closed.json`
- contributions = REAL `v4-resource-status-contribution-v1` envelopes emitted by
  the RT25 runtime ingest decisions read from the runtime ingest lane
  (`configs/runtime/quota-ingest` by default; untracked lane; absent/empty lane ⇒
  pools fail closed — never fabricated)
- composer = REAL `composeV4ResourceStatus` (untouched)
- join = REAL `joinQuotaPoolState` (freshness/reserve/economics, shared pools once)

### 3.2 Canonical planner boundary wired

`tools/evaluate-planner-selection.mjs`:
- `evaluatePlannerSelection(input, options)` now accepts `options.quotaState`
  (structural validity via `isValidQuotaState`);
- planner states are refined by the REAL `admitRouteWithReserve` law:
  commercial-pool DENY_CONSERVE_* / DENY_RESERVE_INCOMPARABLE → planner state
  `CONSERVE` (conserve-unknown, recorded as `QUOTA_POOL_*` refinement);
  DENY_POOL_EXHAUSTED / DENY_RESERVE_FLOOR_BLOCK / DENY_RESERVE_HEADROOM_* →
  `UNAVAILABLE`;
- no-pool resources (qwen local lane) unchanged (legacy law);
- absent/invalid quotaState ⇒ legacy behavior byte-compatible (suite 17/17);
- every result now carries `quota_pool_state_consumed` +
  `quota_pool_refinements` (authorization-neutral metadata);
- CLI: `evaluate-planner-selection.mjs <routing-input> [quota-state.json]`.

`tools/run-litellm-primary-cycle.mjs` (the single proven canonical upstream
composition point):
- `prepareCycle({..., quotaStateOptions})` composes the canonical state via the
  real producer and passes it INTO the canonical evaluator;
- fail-closed: requested-but-failed composition → `QUOTA_STATE_COMPOSITION_FAILED`
  (prepare BLOCKED — never silently degrades to UNKNOWN);
- prepared result carries `quota_state_consumed` + refinements;
- CLI flag `--quota-state-options-b64` (decoded JSON options).

### 3.3 Canonical execution-router boundary wired

`tools/evaluate-execution-route.mjs`:
- `evaluateExecutionRoute(request, { quotaState })` consumes the normalized
  quota-pool state (freshness/reserve/economics via the join output);
- stage 5.5 (between reserve filter and cost law): every surviving candidate
  bound to a COMMERCIAL pool must pass `selectQuotaAwareExecutionRoute`
  admission (the SAME T08/T09 law — no parallel policy); no-pool lanes pass
  (ADMIT_NO_POOL); all candidates rejected ⇒ `NO_ROUTE` + `QUOTA_POOL_BLOCKED`
  + pool reasons, with the blocked envelope attached;
- the FINAL RT25 envelope is emitted by the router itself and its `selected`
  ALWAYS mirrors the router's final `execution_route` (finalize step re-runs
  the same admission law with the winning pair at rank 1);
- absent quotaState ⇒ legacy v1 law unchanged (12/12).

### 3.4 Real upstream → bridge propagation (REQUIRED WORK §4)

`tools/n8n-v4-execution-routing-bridge-v1.mjs`:
- new `options.quotaStateOptions`: the bridge composes the canonical state
  itself (real producer) and hands it to the canonical router;
- the router-PRODUCED envelope (`routeResult.quota_decision`) is consumed
  automatically as the bridge provenance — `QUOTA_DECISION_CONSUMED` +
  `QUOTA_DECISION_PRODUCED_BY_CANONICAL_ROUTER` reason codes;
- a manual `inputs.quota_decision` remains optional-and-valid (T21 law intact);
  the canonical producer path requires NO manual input at all;
- composition failure ⇒ `QUOTA_STATE_COMPOSITION_FAILED` fail-closed;
- blocked routes still carry the blocked envelope provenance (metadata only);
- `dispatch_prepared=false` / `execution_performed=false` invariants intact.

### 3.5 Reviewer/retry (REQUIRED WORK §6 — honest report, no fake path)

Canonical reviewer/retry runtime boundaries DO NOT EXIST. No invented
production path was created. The canonical producer exposes
`buildReviewerBoundaryState()` / `buildRetryBoundaryState()` bindings so a
future governed boundary consumes the SAME producer as planner/execution.
**MISSING INTEGRATION DEPENDENCY (exact):** a canonical reviewer/retry
invocation point in the runtime chain (a runner stage that selects
reviewer/retry routes after execution/TASK-DELTA), which requires a governed
architecture pass — not creatable inside this correction without faking a
production path.

## 4. Proofs

| Proof | Suite | Result |
|---|---|---|
| A..L canonical-entrypoint laws | `tests/rt25-canonical-entrypoint-wiring` | **34/34 PASS** |
| Canonical closed-gate E2E (§8) | `tests/rt25-canonical-closed-gate-e2e` | **12/12 PASS** |
| Planner legacy | `tests/planner-selection-evaluator` | 17/17 PASS |
| Execution-router legacy | `tests/execution-router` | 12/12 PASS |
| Bridge | `tests/n8n-v4-execution-routing-bridge` | 23/23 PASS |
| T21 bridge consumption | `tests/rt25-t21-bridge-consumption` | 4/4 PASS |
| T22 endpoint provenance | `tests/rt25-t22-endpoint-provenance` | 11/11 PASS |
| T24 closed-gate E2E (historical) | `tests/rt25-t24-closed-gate-e2e` | 23/23 PASS |
| LiteLLM primary cycle | `tests/litellm-primary-cycle` | 18/18 PASS |
| Codex ingest / join / planner sel / exec sel | `tests/rt25-t02 / t04 / t08 / t09` | 12+8+10+5 PASS |
| Adapter router | `tests/v4-execution-adapter-router` | 15/15 PASS |

A..L coverage (canonical entrypoints, no hand-built quota decision):
A planner consumes canonical state (evaluator + prepareCycle) · B router emits
RT25 envelope from real join (legacy path stays envelope-free) · C stale ⇒
CONSERVE_UNKNOWN_STALE / missing ⇒ CONSERVE_UNKNOWN_MISSING with planner
fail-closed · D reserve floor blocks pool + planner GATE + prepare BLOCKED ·
E glm-5.3 + glm-5.3-flash ONE `glm_coding_plan` pool (join single entry,
registry structural law) · F qwen unmetered lane selected under scarce remote
quota (ADMIT_NO_POOL, adequacy admitted) · G inadequate qwen vetoed
(tier/capability) · H `openai_api_route` structurally forbidden +
api_billing forbidden on all codex surfaces · I bridge consumes
ROUTER-PRODUCED envelope automatically (+ composition failure fail-closed) ·
J Windows endpoint accepts canonical qwen-scope provenance, REJECTS
mismatched pool before generation · K D-0025 `enabled=false` static ·
L router/bridge never execute; single authorized offline leg only.

E2E chain (§8, no manual quota decision anywhere mid-chain): real ingest lane
→ `prepareCycle(quotaStateOptions)` → planner CLI with canonical state file →
canonical router emits envelope → bridge `quotaStateOptions` auto-consumption →
real endpoint handler (authorized offline leg EXECUTED_OK with provenance;
unauthorized leg AUTHORIZATION_REJECTED with 0 generation attempts; ledger
single spend; D-0025 unchanged).

## 5. Code-reference verification (REQUIRED WORK §9)

Direct imports/calls proven (grep):

- `tools/evaluate-planner-selection.mjs` → `rt25-reserve-admission-v1.admitRouteWithReserve` (L18, L153), `rt25-canonical-quota-state-v1.isValidQuotaState` (L19, L245), `applyQuotaPoolAdmission` (L148/L249)
- `tools/run-litellm-primary-cycle.mjs` → `rt25-canonical-quota-state-v1.composeCanonicalQuotaState` (L20, L259), `quotaStateOptions` plumbing (L241/L258/L541/L559)
- `tools/evaluate-execution-route.mjs` → `rt25-execution-quota-aware-selector-v1.selectQuotaAwareExecutionRoute` (L106, L439, L119), `finalizeQuotaDecision` (L115/L515/L592)
- `tools/n8n-v4-execution-routing-bridge-v1.mjs` → `composeCanonicalQuotaState` (L17/L253), router-envelope consumption + `QUOTA_DECISION_PRODUCED_BY_CANONICAL_ROUTER` (L370)

## 6. Hard boundaries respected

D-0025 remains `enabled=false` (static proof in both suites) · no production
route activation · no OpenAI API/BYOK/API billing (H law) · Codex subscription
surfaces only · no secret persistence (producer reads only ingest decision
JSON; no credentials) · no billing/reset/top-up · no invented quota values
(empty/stale lanes fail closed) · no inference for quota discovery · no n8n
live deployment/activation · no unauthorized model execution (adapter counters
= exactly the single authorized offline leg).

## 7. Deferred / missing (unchanged from campaign)

- GLM live quota credential absent → GLM pool joins CONSERVE_UNKNOWN_MISSING
  (fail-closed) — same deferred evidence as the campaign closure.
- Reviewer/retry canonical boundary missing (see §3.5) — reported dependency,
  not faked.

## 8. CURRENT_FRONTIER correction (REQUIRED WORK §10)

`QUOTA_AWARE_RUNTIME` row updated: canonical planner + canonical execution
router now consume the quota-pool state through the real canonical call path;
upstream→bridge propagation automatic; canonical closed-gate E2E proven.
State remains **RUNTIME_WIRED_BEHIND_CLOSED_GATE** (now justified by canonical
invocation evidence, not just composability). No LIVE claim. GLM live collector
still BLOCKED_EVIDENCE.
