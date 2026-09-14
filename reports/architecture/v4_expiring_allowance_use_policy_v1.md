# V4 Expiring allowance use policy V1

**TASK_REF:** `V4_EXPIRING_ALLOWANCE_USE_POLICY_V1`
**BASE_HEAD:** `fc43bf27adccde8381ebcd8a9c25eb564132647d` (== origin/main == HEAD at start, verified)
**Date (Europe/Rome):** 2026-09-14
**MODE:** BOUNDED GENERIC ROUTING POLICY IMPLEMENTATION — parent #32, HUMAN_GATE_REQUIRED=NO

## 3. Parent #32 requirement

Issue #32's acceptance demands that the control plane answer, before every AI
selection: *which adequate model/access surface executes this role now*, given
quality need, availability, remaining shared quota, reserve, **reset**,
time-dependent cost and urgency — with an auditable reason. The
`EXPIRING_ALLOWANCE_USE` acceptance (carried by parked child #35, owned
generically by #32) requires: near-reset included allowance MAY be preferred
for a higher-capability included model when useful READY work exists, reserve
and priority permit, and no meaningless work is manufactured.

## 4. Pre-existing quota-routing architecture (reused, not rebuilt)

- `rt25-quota-state-join-v1`: joins composer output onto registry-v2;
  one evaluation per shared pool; pools already carry `state`, `freshness`,
  `remaining_percent`, **`reset_at` (ISO-8601, provider-collector fed)**,
  `reserve_floor_percent`, fail-closed `CONSERVE_UNKNOWN_*`/`POOL_EXHAUSTED`
  evaluations.
- `rt25-reserve-admission-v1`: freshness gate + reserve floor + headroom,
  fail-closed, explicit provenance.
- `rt25-planner-quota-aware-selector-v1` (RT25 T08 core): deterministic
  lowest-`select_rank` winner over admitted candidates — single core reused
  unchanged by execution (T09), reviewer (T18), retry (T19) selectors.
- `rt25-economics-metadata-v1` (T07): verified pricing-window/effective
  multiplier economics already propagated.
- `evaluate-quota-aware-route-v1`: offline evaluator with
  `UNVERIFIED_ALLOWANCE_UNKNOWN` guard (the fail-closed seed this policy
  extends).

## 5. Implementation delta (minimal)

1. **NEW** `tools/expiring-allowance-policy-v1.mjs` — generic
   provider-neutral policy module: `classifyExpiringAllowance()` +
   `reorderWithExpiringPreference()` + schema/window constants. ~150 lines,
   zero dependencies, zero I/O.
2. **EXTENDED** `tools/rt25-planner-quota-aware-selector-v1.mjs` — opt-in
   `options.expiringAllowance` block applied AFTER admission and AFTER the
   canonical rank sort: classifies each admitted candidate's pool (cached
   once per pool), emits auditable `expiring_allowance` envelope
   (`active`, `reason_code` [+ aggregated `reason_codes`],
   per-candidate `route_id`/`quota_pool_id`/`reset_at`/
   `time_remaining_ms`/`remaining_percent`/`reserve_floor_percent`), and
   reorders ONLY admitted candidates (expiring-active first, caller order
   preserved within groups). Adds `EXPIRING_ALLOWANCE_USE` to decision
   `reason_codes` only when actually active. ~70 lines.
3. **NEW** `tests/expiring-allowance-use-policy-v1/run.mjs` — 49
   deterministic cases (below).
4. **CANON** `docs/contracts/planner-routing-policy-v1.md` §10a — the policy
   law in the existing routing contract (no duplicate truth elsewhere).

No registry, schema, collector, dispatcher, n8n, dashboard or runtime change.
No second routing-policy authority created.

## 6. Normalized inputs (all pre-existing concepts)

task readiness (`workReady` caller assertion), candidate adequacy (upstream
admission + explicit `adequate`), quality requirement, policy permission,
pool `state`/`freshness`/`remaining_percent`/`reset_at`/
`reserve_floor_percent`, evaluation clock (`nowMs` injectable), window
threshold (`windowSeconds`). No provider-specific raw objects enter the
generic module.

## 7. Threshold / config source

`expiring_allowance_window_seconds` — caller-supplied generic configuration;
default `DEFAULT_EXPIRING_ALLOWANCE_WINDOW_SECONDS = 1800` (documented,
bounded, provider-neutral). Inclusive inside-boundary semantics:
`time_remaining_ms <= window_seconds * 1000`. No GLM/Codex/Astra folklore, no
automatic provider-derived threshold, no model-mutable surface, no duplicate
of existing planner config. Consistent with the planner contract's "no magic
threshold canonized" law — 1800s is code-level default, calibration remains
explicit caller policy.

## 8. Decision algorithm

1. policy permitted? else `POLICY_BLOCKED`
2. adequate? else `ROUTE_INADEQUATE`
3. quality not degraded? else `QUALITY_REQUIREMENT_BLOCKED`
4. pool entry exists & fresh & available? else
   `ALLOWANCE_UNKNOWN`/`ALLOWANCE_STALE`/`ALLOWANCE_EXHAUSTED`
5. reserve floor preserved? else `RESERVE_FLOOR_BLOCKED`
6. reset_at strictly-parseable future ISO-8601 Z? else `RESET_UNKNOWN`
7. `time_remaining_ms <= window`? else `OUTSIDE_EXPIRING_WINDOW`
8. all pass → `active=true`, reason `EXPIRING_ALLOWANCE_USE` + full metadata

Selector integration order preserved: hard gates → admission → rank sort →
**expiring preference (reorder only)** → winner → deterministic tie-break.
Selector-level `workReady !== true` short-circuits with `NOT_READY_WORK`
before any pool classification. Feature default OFF; disabled ⇒ envelope
byte-identical to pre-change behavior (regression-proven).

## 9. Positive tests (focused suite 49/49 PASS)

- **T1** READY work + adequate + fresh verified allowance + near reset +
  floor preserved ⇒ activates with exact metadata (reset_at, 600000 ms
  remaining, percents, pool state, schema version).
- **T2** two adequate routes; near-reset route wins despite worse caller
  rank (100 vs 10) — preference reorder proven end-to-end.
- **T3** explicit auditable reason `EXPIRING_ALLOWANCE_USE` in decision
  reason_codes + pool identity + reset/time/percent metadata on both
  envelope and selection.
- **T4** swapping which generic pool is near reset flips the preference —
  state-driven, no provider branch; both-near-reset keeps stable caller
  order; plus module-level reorder purity/identity preservation.

## 10. Negative / fail-closed tests

- **N1** no READY work ⇒ `NOT_READY_WORK`, baseline winner unchanged;
  feature disabled ⇒ no `expiring_allowance` key at all, no reason code.
- **N2** candidate's pool absent from join ⇒ upstream admission denies
  (fail-closed join integrity); preference never touches denied routes.
- **N3** stale pool ⇒ upstream `CONSERVE_UNKNOWN_STALE` denial; **N3b**
  garbage reset on an admitted route ⇒ feature-only fail closed
  (`RESET_UNKNOWN`), route stays selectable.
- **N4** unknown (null) reset ⇒ no activation, route selectable.
- **N5** outside window ⇒ `OUTSIDE_EXPIRING_WINDOW`.
- **N6** reserve floor violated ⇒ upstream `RESERVE_FLOOR_BLOCK` rejection;
  preference cannot resurrect; no expiring reason on the denial.
- **N7** capability request handled deterministically upstream (module-level
  `ROUTE_INADEQUATE` also proven).
- **N8** quality requirement unmet ⇒ `QUALITY_REQUIREMENT_BLOCKED`.
- **N9** exhausted pool ⇒ upstream `POOL_EXHAUSTED` denial, never revived.
- **N10** forbidden (authorization boundary) route always rejected;
  `policyPermitted:false` ⇒ `POLICY_BLOCKED` wins over a perfectly expiring pool.
- **N11** past / garbage / non-Z-offset timestamps all ⇒ `RESET_UNKNOWN`.
- **N12** policy module exports exactly 4 names — no
  schedule/dispatch/create/invoke/enqueue/task API surface exists
  (work manufacture structurally impossible).
- **N13** no silent fallback: rejected candidates never reappear with an
  EXPIRING reason; no activation ⇒ no reason code.
- **N14** same inputs + same clock ⇒ byte-identical decision.
- **N15** zero Astra references in inputs and in module source; generic law
  holds without the parked child.

## 11. Regressions (19 suites, all green)

T08 planner selector 10/10 · T13 quality guard 7/7 · T14 urgency-defer 7/7 ·
T15 reasoning-speed 7/7 · quota-aware-route-selection 18/18 (incl.
registry-not-mutated) · T04 quota-state-join 8/8 · T20 packet provenance 5/5 ·
T16/T17 decision audit 4/4 · T23 status visibility 6/6 · T24 closed-gate E2E
23/23 (D-0025 gate unchanged-closed) · execution-adapter-router 15/15 ·
execution-adapter-registry 19/19 · registry-v2 76/76 · T02 codex ingest 13/13
· T03 glm ingest 13/13 · Phase-E quota-degraded shadow route 10/10 · codex
translator 33/33 · glm translator 25/25 · codex pool authority 8/8 +
codex-appserver quota contract PASS.

## 12. Provider-neutral proof

Fixtures represent the two canonical pool *concepts* (glm coding-plan-like,
codex subscription-like) with zero provider-specific branches; T4 swaps the
expiring state between pools and the policy follows the state. N15 proves
neither the module nor its inputs mention Astra; module source contains no
provider pool ids (checked literally). Cursor allowance intentionally not
claimed (no verified reset precision — per task law, not invented).

## 13. No-work-manufacture proof

The policy consumes only caller-supplied decisions; it has no API to create,
schedule, enqueue or dispatch work (N12 export-surface check). Activation
requires the caller's explicit `workReady=true` assertion — auditable in the
decision envelope (`NOT_READY_WORK` recorded otherwise). The selector only
reorders existing admitted candidates; it cannot add candidates.

## 14. Authorization separation proof

`EXPIRING_ALLOWANCE_USE != EXECUTION_AUTHORIZATION`: forbidden routes stay
rejected (N10), reserve floors stay enforced (N6), exhausted/stale pools stay
denied (N3/N9), quality stays enforced (N8), D-0025 gate E2E unchanged-closed
(T24 23/23), `ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0`. The preference runs
after every hard gate and can only reorder already-eligible candidates.

## 15. Astra-child preservation

```text
ASTRA_CHILD_STATE=OPEN_PARKED_EXTERNAL_AVAILABILITY
ASTRA_CHILD_NEXT=WAIT_FOR_SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE
ASTRA_BLOCKS_PARENT_32=NO
```

No Astra probing, no #35 mutation, no provider inference. The policy is the
generic #32 capability and works with or without any future Astra exposure;
if #35 ever re-arms, Astra routes plug in through the same generic law with
zero policy change.

## 16. Production/runtime unchanged

No Qwen/GLM-route/Codex/Hermes/OpenClaw/ChatGPT-Web invocation, no browser,
no dispatcher tick, no n8n/PostgreSQL/LiteLLM/VPS mutation, no route-control
change, no Telegram consumption, no credential access, `MODEL_INFERENCE=0`,
`PRODUCTION_DISPATCH=0`, `PRODUCTION_CHANGED=NO`, `RUNTIME_CHANGED=NO`.
Offline deterministic fixtures only.

## 17. Remaining #32 gaps (post-implementation inventory)

Per the parent's own sections, verified against current canon:

- **A** Codex first-class peer: DONE (subscription surface qualified #34,
  dynamic catalog router canon, quota authority app-server).
- **B** GLM granularity: DONE (glm collector windows/reset_at + 5.3/flash
  models on shared pool; translators green).
- **C** Cursor-as-harness representation: registry `cursor` resource +
  composer/no-pool semantics exist; deeper Cursor bucket split remains
  evidence-gated (no machine-observable verified bucket data yet — external
  evidence dependency, not a code dependency).
- **D** live collectors/translators: DONE for codex + glm (live, green);
  remaining collectors are evidence-gated by provider machine-observability.
- **E** time-aware economics: DONE (T07 verified multiplier + §10a reset
  window; `DEFER_UNTIL_CHEAPER_WINDOW` existed since T14).
- **F** role/quality-aware selection: DONE (T08 core + T13/T15/T18/T19).
- **G** Codex reasoning policy: DONE (live reasoning-effort ladder via
  dynamic catalog; never hardcoded).
- **H** naming/hygiene debt: DONE (#33 OpenCode nomenclature migration).
- **I** architectural doc reconciliation after runtime proof: partially —
  PROJECT_VISION/MULTI_PLANNER reconciliation belongs to the closure pass.

No unresolved required predecessor remains: every implementation axis is
either DONE or explicitly evidence-gated external (C/D residuals). Next
smallest mechanically required slice = evaluate #32 closure (doc
reconciliation included there).

## 18. Exact NEXT

```text
EXPIRING_ALLOWANCE_USE_IMPLEMENTED=YES
EXPIRING_ALLOWANCE_USE_PROVEN=YES
EXPIRING_ALLOWANCE_POLICY=GENERIC_PROVIDER_NEUTRAL
USEFUL_READY_WORK_REQUIRED=YES
WORK_MANUFACTURE_FOR_QUOTA_BURN=FORBIDDEN
ALLOWANCE_VERIFICATION_REQUIRED=YES
RESET_OR_EXPIRY_VERIFICATION_REQUIRED=YES
RESERVE_FLOOR_PRESERVED=YES
QUALITY_DEGRADATION_FOR_EXPIRING_ALLOWANCE=NO
EXPIRING_ALLOWANCE_IS_AUTHORIZATION=NO
NO_SILENT_FALLBACK=PASS
ASTRA_DEPENDENCY=NO
CURRENT_NEXT=V4_PARENT_32_CLOSURE_EVALUATION_V1
NEXT=V4_PARENT_32_CLOSURE_EVALUATION_V1
NEXT_HUMAN_GATE_REQUIRED=NO
```

#32 is NOT closed in this task (closure evaluation is a separate bounded
task per law).

## Rollback

`git revert` this commit removes the policy module, the selector's opt-in
block, the new test suite, the contract §10a and the three canonical doc
entries. Feature is opt-in/off by default, so pre-commit runtime consumers
were and remain behavior-identical either way.
