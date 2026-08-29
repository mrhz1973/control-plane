# V4 - EXECUTION_ROUTER

**Block ID:** `V4_EXECUTION_ROUTER`  
**Starting HEAD:** `2c4c188d1471d04864f94451db873c562912b8d5`  
**Final HEAD:** `75d5fe4e2ebcfb2565021893a096a2ce28ffc6bf`  
**Category:** CONTROL-PLANE / ROUTING  
**arbiter mocked only:** true  
**live_qwen_calls:** 0

## Contracts / implementation

| Path | Role |
|---|---|
| `docs/contracts/execution-route-request-v1.{md,schema.json}` | Request |
| `docs/contracts/execution-route-result-v1.{md,schema.json}` | Result |
| `tools/evaluate-execution-route.mjs` | Deterministic-first router |
| `tests/execution-router/run.mjs` | Offline suite (12 cases) |

`execution-packet-v1` unchanged.

## Deterministic policy order

1. Hard technical requirements (harness capabilities)  
2. Current availability (`RESOURCE_STATUS`; missing/`available=false` = unavailable)  
3. Registry compatibility edges (harness↔model)  
4. Risk/policy exclusions (none invented in this block)  
5. Reserve / quota protection  
6. Cost mode ranking (`free` < `included` < `metered`/`on_demand`; `unknown` not treated as free)  
7. Static non-semantic preference: free local when it uniquely/narrows survivors  
8. Semantic arbitration only if >1 equivalent survivor remains  

## Derived eligible pairs (from current registry)

Harnesses: `cursor`, `opencode`  
Implementation models: `qwen_local`, `glm`, `composer`  
Natural compatible pairs when status allows: `opencode+qwen_local`, `cursor+composer`, `cursor+glm`  
`codex` is planner-only → never an implementation model.

## Fail-closed

- committed `status.fail-closed.json` → `NO_ROUTE`, `arbiter_call_count=0`  
- missing status entry → unavailable  
- reserve with unknown finite quota → blocked  
- invalid arbitration / invented route → `ARBITRATION_INVALID`  
- ambiguity without available `qwen_local` arbiter → `ARBITER_UNAVAILABLE`

## Arbitration boundary

Uses injectable `semanticArbiter` (production: existing `qwen-local-adapter-v1`, not called live here).  
Cannot restore filtered resources. Deterministic unique routes never call arbiter.

## Targeted tests

| Suite | Result |
|---|---|
| `tests/execution-router/run.mjs` | **12/12 PASS** |
| `tests/resource-registry-validator/run.mjs` | **7/7 PASS** |
| `tests/resource-status-validator/run.mjs` | **6/6 PASS** |
| `tests/qwen-local-adapter/run.mjs` | **9/9 PASS** |

## Counters

provider_calls=0 · litellm_calls=0 · glm_calls=0 · codex_calls=0 · qwen_live_calls=0 · n8n_mutations=0 · workflow_mutations=0 · d0025_mutations=0 · secret_exposure=false
