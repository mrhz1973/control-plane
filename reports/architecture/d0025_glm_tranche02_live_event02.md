# D-0025-W — GLM tranche 02 live event 02

**Block ID:** `D0025_W_GLM_TRANCHE02_LIVE_EVENT_02`  
**Starting HEAD:** `a5677f6b1f81c3949866920d521ce43045c16858`  
**Trigger:** `51c0db84ebc8c3d3fef133bfae416341a72a88ed` (retry trigger 18; arm-first)  
**Canonical task:** `D-0025-W-GLM-LIVE-001`  
**Budget:** `D0025_W_GLM_TRANCHE_02`  
**Status:** **STOP** — hang-proof transport terminal `HTTP_WALL_TIMEOUT`; no LiteLLM/GLM consumption; gate CLOSED

## Precheck (provider_calls=0)

| Check | Result |
|---|---|
| origin/main exact (`a5677f6…`) | PASS |
| CURRENT_FRONTIER coherent | PASS |
| WF40 active · WF61 inactive · gate CLOSED | PASS |
| tranche 02 GLM/LiteLLM **0/10** | PASS |
| live/template 6104/6106/6107 hang-proof | PASS |
| live/template 6106 `2>&1 \|\| true` | PASS |
| live/template 6109/6110 | PASS |
| LiteLLM historical | **10** |

## Live attempt

| Field | Value |
|---|---|
| WF40 / WF61 | `287008` / `287009` |
| WF61 status | `error` · `15:48:03Z` → `15:49:59Z` |
| lastNodeExecuted | `Return HTTP failure no retry` |
| LiteLLM Δ | **0** (historical total remains **10**) |
| GLM Δ | **0** (tranche 02 remains **0/10**) |
| transport_classification | **`HTTP_WALL_TIMEOUT`** |
| transport_elapsed_ms | **115003** |
| transport_body_bytes | **0** |
| HTTP status | **0** |
| Not `HTTP_BRIDGE_OUTPUT_INVALID` | **true** (6106 exit normalization effective) |
| packet_census | unavailable (HTTP 2xx / finalize not reached) |
| deterministic_completion | unavailable |
| schema / policy | not reached |
| cursor_dispatch | **0** |
| retry / fallback / qwen / codex | **0** |
| gate final | **CLOSED** |
| WF61 final | **inactive** · hang-proof preserved · versionId `dcf124b9-0cb3-428b-8a09-a6afda8d2083` |
| workflows/tools/schema mutated | **false** |
| secondary 6112 json-shape finding | **observed** (`A 'json' property isn't an object`) — recorded only; out of scope |

## Finding

Bounded hang-proof helper terminated deterministically at wall (~115s) with parseable JSON classification **`HTTP_WALL_TIMEOUT`**. Capture received the classification (no longer `HTTP_BRIDGE_OUTPUT_INVALID`). LiteLLM logs show **no** new `POST /v1/responses`. Failure branch reached `Return HTTP failure no retry`, which then hit the known secondary Code-node json-shape error (6112 path) and did not emit a recoverable parent cycle-result object. No second provider request. No same-pass repair.

## Counters

| Metric | Value |
|---|---|
| Tranche 02 GLM | **0/10** |
| Tranche 02 LiteLLM | **0/10** |
| Historical LiteLLM total | **10** |
| provider_calls Δ | **0** |
| new WF61 executions | **1** |

## D-0025-W / issue #31

| Item | State |
|---|---|
| Valid Execution Packet | **not obtained** |
| D-0025-W closure | **not claimed** |
| issue **#31** | remains **OPEN** |
| Remaining bounded item | diagnose why hang-proof one-shot hits **HTTP_WALL_TIMEOUT** with LiteLLM Δ0 (upstream/connect path) under next AUTO-VIA offline pass; 6112 json-shape remains separately out of scope |

## Output line

`STOP — HTTP_WALL_TIMEOUT / TRANCHE=0/10 / GATE_CLOSED=true`
