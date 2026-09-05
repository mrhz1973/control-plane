# V4 Offline Quota-Pool-Aware Route Selection V1

- **BLOCK-ID**: `V4_OFFLINE_QUOTA_POOL_AWARE_ROUTE_SELECTION_V1`
- **Campaign**: `V4_QUOTA_AWARE_ROUTING_AUTONOMOUS_90M_SPRINT_V2` PHASE 3 (issue #39, parent #32)
- **Date**: 2026-09-05
- **Base HEAD**: `bcc537e28e94dca86441646d50a9942b077f9ec8` (= origin/main, tracked clean at phase start; PHASE 1+2 PASS preverified)
- **Result**: **PASS**

## Scope discipline

The **smallest existing canonical selection layer** was extended in a **new, separate,
purely offline** evaluator — `tools/evaluate-quota-aware-route-v1.mjs` (library, no CLI
live path). `tools/evaluate-execution-route.mjs`, the n8n bridge, the composer and all
existing evaluators are **byte-untouched**: all existing semantics preserved (proven by
re-running their suites green). No route activated, no n8n wiring, no runtime
authorization change. This layer composes, it does not execute.

## Representation chain

```text
MODEL/ROLE (registry-v2 models)
  -> ACCESS SURFACE (default + shared_by_surfaces, qualification-gated)
     -> QUOTA_POOL (registry-v2 quota_pool_id)
        -> CURRENT QUOTA-POOL STATUS (quota-pool-status-v1, fresh/stale/state)
```

Selection dimensions implemented: capability adequacy (no silent substitution),
surface qualification + availability, `quota_pool_id`, pool known/unknown state,
status freshness, remaining capacity (max fresh window, normalized to percent),
reserve threshold via injected reserve policy (policy, not observation), urgency +
explicit deferral policy, local/unmetered preference. Verified-cost ranking is left to
the future time-window slice; unknown economics are never ranked cheap (unverified
allowance surfaces never become selectable).

## Laws enforced (tests A–M + extra)

| Law | Test | Outcome |
|---|---|---|
| Codex IDE + external share ONE pool observation | `A-codex-shared-pool-selected-and-single-healthy` | `chatgpt_codex_subscription` evaluated once, `POOL_HEALTHY` @62%, selected |
| GLM 5.3 + Flash share ONE pool observation | `B-glm-shared-pool-selected-and-single-healthy` | `glm_coding_plan` evaluated once, `POOL_HEALTHY` @41%, selected |
| Missing shared-pool status | `C-missing-pool-status-conserve-unknown` | `CONSERVE_UNKNOWN` + `CONSERVE_UNKNOWN_MISSING` |
| Stale shared-pool status | `D-stale-pool-status-conserve-unknown` | `CONSERVE_UNKNOWN` + `CONSERVE_UNKNOWN_STALE` |
| Reserve-floor block | `E-reserve-floor-blocks` | `NO_ROUTE` + `RESERVE_FLOOR_BLOCK` |
| Sufficient healthy quota | `F-sufficient-healthy-quota-selected` | `ROUTE_SELECTED` within reserve |
| Adequate unmetered Qwen vs scarce remote | `G-unmetered-local-preferred-scarce-preserved` | `qwen_local` selected, `SCARCE_POOL_PRESERVED` |
| Qwen inadequate capability | `H-inadequate-capability-no-silent-substitution` | `NO_ROUTE` + `NO_ADEQUATE_CAPABILITY`/`SUBSTITUTION_FORBIDDEN` |
| Urgent never deferred | `I-urgent-never-deferred` | not DEFERRED + `URGENT_NO_DEFER` |
| Non-urgent deferral only with policy | `J1`/`J2` | denied without `defer_allowed`; `DEFERRED/DEFER_UNTIL_CHEAPER_WINDOW` only with policy |
| Unknown cost/allowance state not cheap | `K-unverified-allowance-not-cheap` | unverified allowance → blocked `UNVERIFIED_ALLOWANCE_UNKNOWN`, never selected |
| OpenAI API/BYOK forbidden | `L-openai-api-byok-forbidden` + `forbidden-openai-api-route-never-candidate` | tampered API/BYOK surface never selectable (evaluator is also robust against a tampered registry) |
| Duplicates don't double-count | `M-shared-pools-evaluated-once` + `M2-no-duplicate-candidate-entries` | both pools healthy simultaneously, each evaluated exactly once |

Additional: `candidates-include-codex-and-glm-and-local` (chain completeness),
`registry-not-mutated-by-evaluator` (purity), exhausted-state and unknown-state laws
covered inside C/D/E fixtures. Deterministic: injectable status/policy/availability,
no clock dependence, no network.

## Files (this phase)

| File | Change |
|---|---|
| `tools/evaluate-quota-aware-route-v1.mjs` | new — offline deterministic evaluator |
| `tests/quota-aware-route-selection/run.mjs` | new — focused suite **18/18 PASS** |
| `reports/architecture/v4_offline_quota_pool_aware_route_selection_v1.md` | new — this report |

No existing file modified. Regression: `quota-pool-codex-translator` 33/33,
`quota-pool-glm-translator` 25/25, `registry-v2` 64/64, `execution-router` 12/12 — all
PASS after this phase.

## Explicit non-goals (still true)

No live collector exists; status inputs are translator outputs from manual/normalized
snapshots. No production quota-aware routing: this evaluator is not wired into any
workflow/router/n8n path. No quality silent-degradation: inadequate candidates are
dropped, never substituted. Runtime authorization unchanged.

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
