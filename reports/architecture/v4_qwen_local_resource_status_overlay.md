# V4 - qwen_local RESOURCE_STATUS overlay

**Block ID:** `V4_QWEN_LOCAL_RESOURCE_STATUS_OVERLAY`  
**Starting HEAD:** `f7f534cf33ccfda4d06f962b4842edbb1c96c6a4`  
**baseline_unchanged:** true  
**session_manager_reused:** true  
**execution_router_policy_unchanged:** true

## Paths

| Path | Role |
|---|---|
| `tools/collect-qwen-local-resource-status-v1.mjs` | Overlay producer |
| `tests/qwen-local-resource-status-overlay/run.mjs` | Offline suite |
| `configs/resources/status.fail-closed.json` | Committed baseline (unchanged) |
| `docs/contracts/resource-status-v1.schema.json` | Source schema (unchanged) |

## Mapping

| Session manager | `qwen_local.available` | quota | source |
|---|---|---|---|
| READY / LAUNCH_STARTED_AND_READY | true | unlimited / null | local_probe |
| any non-ready | false | unknown / null | local_probe |

cost_mode=free · location=local · reserve none · reset_at=null  
`generated_at` + `qwen_local.updated_at` = fresh clock (injectable).  
Other resources remain fail-closed clones from baseline.

## Offline tests

overlay **14/14 PASS** · resource-status **6/6** · session-manager **14/14** · execution-router **12/12**

## Live collector probe

| Field | Value |
|---|---|
| performed | true |
| profile | fast_8k |
| status | READY |
| qwen_local_available | true |
| launch_performed | false |
| generation_calls | 0 |

## Counters

provider_calls=0 · litellm_calls=0 · glm_calls=0 · codex_calls=0 · qwen_generation_calls=0 · n8n_mutations=0 · workflow_mutations=0 · d0025_mutations=0 · secret_exposure=false
