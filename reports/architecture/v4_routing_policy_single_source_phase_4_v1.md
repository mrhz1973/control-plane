# V4_ROUTING_POLICY_SINGLE_SOURCE_PHASE_4_V1

**Classification:** `PASS`
**BASE_HEAD:** `32c3702c46313b75014c903b610d11a0ba2b6239`
**MODE:** bounded repository qualification; no provider or production execution

## Decision

`configs/resources/registry.json` (`schema_version=resource-registry-v2`) is
the sole canonical static source for the routing topology and eligibility
relationships:

```text
MODEL/ROLE -> ACCESS_SURFACE -> QUOTA_POOL -> V1 PROJECTION RESOURCE
```

The registry remains static. Dynamic quota observations, provider-managed
model catalogs, runtime quality inventories, transport aliases, and the
generic planner state/fallback algorithm remain separate by contract. None of
those surfaces stores an independently diverging registry relationship.

```text
PHASE_4_ROUTING_POLICY_SINGLE_SOURCE=PASS
PHASE_4_DECISION=MINIMAL_SHARED_REGISTRY_ADAPTER
PHASE_4_HUMAN_GATE_REQUIRED=NO
RESOURCE_REGISTRY_V2=SOLE_CANONICAL_ROUTING_POLICY_SOURCE
HERMES_ROUTER_POLICY=REGISTRY_DERIVED
LITELLM_POLICY=REGISTRY_DERIVED_OR_TRANSPORT_ONLY
DUPLICATE_POLICY_SOURCES=0
UNKNOWN_POLICY_SOURCES=0
ROUTER_BEHAVIOR_EQUIVALENCE=PASS
V1_COMPATIBILITY_PRESERVED=YES
DYNAMIC_MODEL_DISCOVERY_PRESERVED=YES
DYNAMIC_QUOTA_STATE_NOT_FROZEN=YES
NO_SILENT_FALLBACK=PASS
MODEL_INFERENCE=0
PRODUCTION_CHANGED=NO
```

## Census and scope boundary

| Source | Classification | Finding |
|---|---|---|
| `configs/resources/registry.json` | `CANONICAL_POLICY` | Only static source of model classes, roles, surfaces, pool bindings, qualification relationships, and the V1 projection. Dynamic quota values remain forbidden. |
| `docs/contracts/resource-registry-v2.schema.json` and `resource-registry-v2.md` | `CANONICAL_POLICY` | Schema and contract for the canonical source; no runtime route choice. |
| `tools/resource-registry-v2-policy-adapter-v1.mjs` | `DERIVED_FROM_REGISTRY` | Single fail-closed loader/adapter for Codex, supported-plan models, forbidden surfaces, V1 resource bindings, no-pool semantics, and pool ids. |
| Hermes Codex dynamic router | `DERIVED_FROM_REGISTRY` + transport/runtime | Quota-pool and route identity are derived from the adapter; `model/list` remains the only authority for concrete Codex model ids. Controller lane and catalog RPC name are transport metadata. |
| GLM model selector and Codex eligibility gate | `DERIVED_FROM_REGISTRY` | Surface, pool, model-class membership, and V1 projection are derived at invocation; quota admission still consumes the joined live observation. |
| Quota join, quota translators, Codex pool authority | `DERIVED_FROM_REGISTRY` + `QUOTA_OBSERVATION` | Pool bindings are derived; freshness, remaining values, reset values, and authority/source state come only from already-collected observations. |
| Review/retry candidate boundaries | `DERIVED_FROM_REGISTRY` | Reviewer/implementation roles, forbidden representational surfaces, and model-to-resource bindings are derived; runtime model-id conventions remain adapter metadata. |
| `docs/contracts/planner-selection-evaluator-v1.md` and `tools/evaluate-planner-selection.mjs` | `CANONICAL_POLICY` (algorithm scope) | Generic planner-state/fallback algorithm and V1 planner-class vocabulary. It does not contain model ids, access surfaces, pool ids, provider catalogs, or an alternate registry. |
| LiteLLM templates/profile, gateway envelope builder, inactive D-0025 guard | `TRANSPORT_CONFIG` / `HISTORICAL` | Remote gateway aliases and fail-closed transport checks only; no planner selection, no live reload, and no second resource policy. |
| Qwen runtime profiles and role qualification overlays | `TRANSPORT_CONFIG` / `RUNTIME_STATE` | Concrete local runtime/profile and observed qualification data; not the canonical route topology. The registry deliberately keeps Qwen selection dynamic. |
| Quality, reasoning/speed, and suitability inventories | `RUNTIME_STATE` | Caller/runtime metadata; no route identity or quota-pool authority. |
| Local resource observatory | `QUOTA_OBSERVATION` | Read-only dashboard cards and observed pool state; it cannot select, authorize, claim, or execute work. |
| Execution adapter registry/router and qualification window controller | `TRANSPORT_CONFIG` | Exact adapter/qualification transport mappings; no selection or fallback authority. The Codex pool id is now registry-derived where used. |
| Tests and fixtures | `TEST_FIXTURE` | Synthetic evidence and regression assertions only. |
| Prior architecture/runtime reports | `HISTORICAL` | Historical snapshots retained; they do not override the current registry or this result. |

`UNKNOWN_POLICY_SOURCES=0`: every searched source was either an identified
registry derivation, contract algorithm, transport mapping, runtime state,
quota observation, fixture, or historical record. The remaining hard-coded
strings in observability, quota collectors, inactive LiteLLM/D-0025 material,
and historical simulations are not consulted to choose a route and are kept
in their original scope.

## Consolidation performed

The previously duplicated static relationships were real but narrow:

- Hermes held a literal Codex pool id.
- GLM selection held a literal pool, surface, and two-model list.
- Codex eligibility held a literal pool id.
- The quota join held a literal V1-resource-to-pool map and no-pool semantics.
- Review/retry held literal forbidden-surface and model-to-resource maps.
- Supporting quota/metadata modules repeated the Codex pool identity.

The new `resource-registry-v2-policy-adapter-v1.mjs` is the only shared
derivation point. Existing exports remain compatible, while callers can inject
a registry for deterministic tests. No registry fields were added and no
dynamic quota data was persisted.

The following remain intentionally outside the adapter:

- concrete Codex model ids and reasoning capabilities from the live
  `codex_app_server:model/list` catalog;
- Qwen/local concrete profile ids owned by the local runtime;
- live quota values, reset times, freshness, reserve, and economics;
- generic planner state/fallback semantics from the canonical planner contract;
- LiteLLM model aliases and endpoint behavior as transport configuration.

## Before/after behavior equivalence

The pre-change focused baseline and the post-change focused runs produce the
same canonical-fixture decisions. The only intentional extension is that a
new supported-plan model class declared by the registry is discovered by the
GLM adapter instead of being ignored by a selector-local list.

| Case | Registry/observation law | Before vs after |
|---|---|---|
| Qwen local | `qwen_local -> opencode_local_harness -> no commercial pool` | identical local/no-pool behavior |
| GLM quota healthy | supported-plan surface and `glm_coding_plan`, one shared admission | same selected model and one admission |
| Codex subscription | Codex model class and surface derive `chatgpt_codex_subscription` | same eligibility and receipt pool |
| Hermes eligible | dynamic provider catalog plus registry-derived route identity | same exact selection; no frozen model list |
| unavailable/ineligible route | missing qualification/auth/surface or unavailable resource | same fail-closed result |
| quota exhausted/unknown/stale | joined observation denies route | same deny/conserve behavior; no invented quota |
| no silent fallback | explicit model mismatch or unavailable catalog | same error/`fallback_used=false` behavior |
| access-surface mismatch | surface pool does not match the derived route policy | same fail-closed rejection |
| role mismatch | candidate must have the required registry role | same candidate exclusion |
| malformed/missing registry | adapter rejects the required policy relationship | explicit `REGISTRY_POLICY_INVALID` fail-closed result |

## Fail-closed and regression evidence

Read-only adapter smoke proof:

```text
ADAPTER_POLICY=PASS
DYNAMIC_MODEL_DISCOVERY_PRESERVED=YES
FAIL_CLOSED_REGISTRY=PASS
UNKNOWN_POLICY_SOURCES=0
```

The smoke proof also verified that adding a synthetic registry-declared
supported-plan model is discovered, while removing the Codex model class is
rejected before a router can proceed. No provider request was made.

Post-change deterministic regressions:

```text
registry-v2                                      76/76 PASS
resource-registry-validator                       7/7 PASS
execution-router                                  12/12 PASS
hermes-codex-dynamic-model-router                 19 cases PASS
quota-aware-route-selection                       18/18 PASS
rt25 quota/selector suites (T02-T19)             136/136 PASS
review-stage-boundary                             15/15 PASS
retry-stage-boundary                              14/14 PASS
LiteLLM primary cycle                              18/18 PASS
LiteLLM one-shot                                   7/7 PASS
execution adapter registry                         19/19 PASS
execution adapter router                            15/15 PASS
n8n execution adapter bridge                       18/18 PASS
n8n execution routing bridge                       23/23 PASS
isolated canonical CLI wiring                     31/31 PASS
targeted regression suites                         30/30 PASS
git diff --check                                  PASS
```

The RT25 aggregate is the sum of the T02-T19 runs
(13+13+8+8+9+8+10+5+10+10+7+7+7+7+4+5+5 = 136); the individual outputs are preserved
in the task execution log, not in the repository. LiteLLM tests reported
`network_access=false`, `provider_model_request_count=0`,
`credential_access=0`, and the one-shot suite reported `provider_calls=0`.

No Qwen, GLM, Codex, ChatGPT Web, Hermes browser, n8n, VPS, dispatcher, or
production action was performed. No credential, token, cookie, quota value,
or session material was read or persisted. `configs/resources/registry.json`
itself was not modified.

## Files changed and rollback

The implementation is bounded to the shared adapter and the existing static
consumer bindings:

```text
tools/resource-registry-v2-policy-adapter-v1.mjs
tools/hermes-codex-dynamic-model-router-v1.mjs
tools/rt25-codex-eligibility-v1.mjs
tools/rt25-glm-model-selection-v1.mjs
tools/rt25-quota-state-join-v1.mjs
tools/rt25-reasoning-speed-metadata-v1.mjs
tools/run-review-stage-v1.mjs
tools/run-retry-stage-v1.mjs
tools/select-codex-window-controller-v1.mjs
tools/translate-quota-pool-snapshot-v1.mjs
tools/v4-codex-pool-authority-v1.mjs
tools/collect-codex-appserver-quota-v1.mjs
```

Rollback is bounded to reverting this Phase 4 commit: the adapter imports and
derived calls can be removed as one unit, restoring the prior caller-local
constants without changing the registry, quota observations, transport
configuration, or runtime services. Phase 5 remains unexecuted and requires a
separate human gate.

```text
PHASE_5_OPTIONAL=YES
PHASE_5_HUMAN_GATE_REQUIRED=YES
NEXT=PHASE_5_OPTIONAL_HERMES_IMPLEMENTER_EXPANSION_DECISION
```
