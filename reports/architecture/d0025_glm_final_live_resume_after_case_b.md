# D-0025-W — GLM final live resume after CASE B

**Block ID:** `D0025_W_GLM_FINAL_LIVE_RESUME_AFTER_CASE_B`  
**Starting HEAD:** `cf0da2514f666d370c76d31bc6b96dcd015626ff`  
**Trigger:** `4c263bd1a59f3a74b311ad1f63fd51b0fb4e9c0b` (retry trigger 16; arm-first)  
**Canonical task:** `D-0025-W-GLM-LIVE-001`  
**Status:** **STOP** — single authorized provider event consumed; gate CLOSED; no cycle result

## Precheck (provider_calls=0)

| Check | Result |
|---|---|
| origin/main exact (`cf0da25…`) | PASS |
| CASE B helper + finalize integration | PASS |
| WF61 6110 census/completion ≡ template | PASS |
| unwrap present | PASS |
| WF40 active / WF61 inactive / gate CLOSED | PASS |
| LiteLLM readiness + count **9** | PASS |
| GLM budget **9/10** | PASS |
| Arm-first then trigger 16 | PASS |

## Live attempt (maxima: 1/1/1)

| Field | Value |
|---|---|
| WF40 / WF61 | `286309` / `286310` |
| LiteLLM Δ | **1** → total **10** (POST **200**) |
| GLM Δ | **1** → budget **10/10** |
| HTTP (gateway log) | **200** |
| classification | `WF61_HUNG_AFTER_LITELLM_HTTP_200` |
| has_cycle_result | **false** |
| packet_census | **null** (finalize never materialized) |
| deterministic_completion | **null** |
| schema / policy | unavailable (no terminal cycle result) |
| cursor_dispatch_allowed | false |
| retry / fallback / qwen / codex | **0** |
| gate final | **CLOSED** |
| WF61 final | **inactive** (`workflow_entity.active=0`; import-without-publish) |
| execution DB note | `286310` left `status=running`/`stoppedAt=null` after n8n restart (zombie row; no second request) |
| raw model content persisted | **false** |
| secrets exposed | **false** |

## Finding

The single authorized LiteLLM `/v1/responses` request completed with HTTP **200**, but WF61 execution `286310` never reached Capture/Finalize/Return with a recoverable `n8n-litellm-primary-cycle-result-v1`. Watch timed out while still `running`; runtime gate was restored CLOSED immediately; WF61 forced inactive. No retry/fallback.

CASE B completion + packet census could not be observed because the canonical finalize path did not emit a terminal result.

## D-0025-W / issue #31

| Item | State |
|---|---|
| Valid Execution Packet | **not obtained** |
| D-0025-W closure | **not claimed** |
| issue **#31** | remains **OPEN** |
| Remaining bounded item | recover why WF61 hung after LiteLLM HTTP 200 (stream/timeout/capture) under a **new** budget authorization — current GLM budget **exhausted at 10/10** |

## Counters

| Metric | Value |
|---|---|
| provider_calls Δ | **1** |
| litellm Δ | **1** |
| glm budget final | **10/10** |
| second provider request | **0** |

## Output line

`STOP — WF61_HUNG_AFTER_LITELLM_HTTP_200; PROVIDER_CALLS_DELTA=1; GLM_BUDGET=10/10; GATE_CLOSED=true`
