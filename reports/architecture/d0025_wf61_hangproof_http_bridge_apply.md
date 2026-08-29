# D-0025-W — WF61 hang-proof HTTP bridge apply (offline)

**Block ID:** `D0025_W_WF61_HANGPROOF_HTTP_BRIDGE`  
**Starting HEAD:** `b968a1417240112820d1a50e0c3ae6aaa8d7048b`  
**Code artifact:** `docs/runtime/PATCH_D0025_W_WF61_HANGPROOF_HTTP_BRIDGE.gpt-web.json`  
**WF61 artifact:** `workflows/patches/d0025-w-wf61-hangproof-http-bridge.gpt-web.json`  
**Status:** **PASS** — bounded HTTP bridge applied offline; provider Δ **0**; GLM budget remains **10/10**

## Precheck

| Check | Result |
|---|---|
| origin/main exact | PASS (`b968a14…`) |
| CURRENT_FRONTIER coherent | PASS (offline hang-proof apply authorized) |
| WF40 active · 44 nodes | PASS |
| WF61 inactive · 13 nodes | PASS |
| runtime gate CLOSED | PASS |
| LiteLLM count | **10** |
| GLM budget | **10/10** |

## Helper

| Field | Value |
|---|---|
| Path | `tools/post-litellm-primary-one-shot.mjs` |
| Target | `http://litellm-primary:4000/v1/responses` |
| Bounds | wall **115000** ms · body-idle **15000** ms (after headers) · max body **8388608** |
| Transport | Node `http.request` · `Connection: close` · `agent: false` |
| Success | `HTTP_COMPLETED` · exit **0** (incl. HTTP 4xx/5xx with real statusCode) |
| Failures | `HTTP_WALL_TIMEOUT` / `HTTP_BODY_IDLE_TIMEOUT` / `HTTP_BODY_TOO_LARGE` / `HTTP_REQUEST_ERROR` / `HTTP_RESPONSE_ABORTED` / `INPUT_INVALID` |

## Mock suite

`tests/litellm-primary-one-shot/run.mjs` — **7/7 PASS** · `provider_calls=0`

- 200 JSON round-trip byte-identical
- 4xx exit 0 + statusCode
- wall timeout (no response)
- body-idle timeout (headers then stall)
- body too large
- connection error
- one stdout JSON line · no request/header leak

## WF61 apply

| Node | Change |
|---|---|
| **6104** | emits `request_body_b64` from exact `JSON.stringify(request_body)` |
| **6106** | same id/name/position; type → `executeCommand` invoking hang-proof helper |
| **6107** | parses bridge one-line JSON → `http_status` / `http_ok` / `response_b64` + sanitized transport metadata; preserves `sse_census` / `body_shape` |

| Check | Result |
|---|---|
| Node count | **13** |
| Connections | unchanged |
| Authorized template ↔ live (6104/6106/6107) | equivalent |
| Live versionId | `8776dda8-e8d1-4df9-86f9-530f23409277` |
| WF61 final | **inactive** (`active=0`) |
| Gate final | **CLOSED** |
| LiteLLM Δ during apply | **0** (total **10**) |

### Pre-existing live drift (not mutated this pass)

Live **6110** currently lacks CASE B `packet_census` / `deterministic_completion` propagation (still uses `$input.first()`-style code). Live **6109** finalize command also differs slightly from template (`2>&1 \|\| true` missing). This drift **predated** the hang-proof import (present in pre-export). Hang-proof apply did **not** change 6109/6110.

**Hard prerequisite before any live GLM retry:** re-sync live **6110** (and ideally **6109**) from the canonical template so CASE B census/completion is present again. That restore is out of this artifact’s authorized mutation set.

## Counters

| Metric | Value |
|---|---|
| provider_calls | **0** |
| LiteLLM Δ | **0** |
| GLM Δ | **0** |
| GLM budget | **10/10** |
| schema / normalizer / CASE B helper / LiteLLM config | unchanged |

## NEXT (human gate — not executed)

1. Re-sync live WF61 **6110** CASE B census node from template (authorized restore).  
2. Separate **human** authorization of a **new** bounded GLM budget before any live retry.

## Output line

`PASS — WF61 HANG-PROOF HTTP BRIDGE APPLIED OFFLINE / PROVIDER_CALLS_DELTA=0 / GLM_BUDGET=10/10`
