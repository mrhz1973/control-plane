# D-0025-W — WF61 live canonical resync after 6106 type drift (offline)

**Block ID:** `D0025_W_WF61_LIVE_CANONICAL_RESYNC_AFTER_6106_TYPE_DRIFT`  
**Starting HEAD:** `e2a2320ee8f62353b443c1c9628775bf58a36c07`  
**Resync artifact:** `workflows/patches/d0025-w-wf61-live-canonical-resync-after-6106-type-drift.gpt-web.json`  
**Status:** **PASS** — live WF61 restored to hang-proof + 6106 exit normalization + 6109 observability + 6110 CASE B; provider Δ **0**; tranche 02 **0/10**

## Precheck

| Check | Result |
|---|---|
| origin/main exact | PASS (`e2a2320…`) |
| CURRENT_FRONTIER coherent | PASS (offline full canonical resync authorized) |
| gate CLOSED | PASS |
| tranche 02 | GLM **0/10** · LiteLLM **0/10** |
| LiteLLM historical | **10** |
| WF40 active · 44 nodes | PASS |
| WF61 inactive · 13 nodes | PASS |
| pre live 6106 type | **`httpRequest`** (drift confirmed) |

## Sources applied (verbatim)

| Source | Nodes |
|---|---|
| `d0025-w-wf61-hangproof-http-bridge.gpt-web.json` | 6104 jsCode · 6106 transport→executeCommand · 6107 jsCode |
| `d0025-w-wf61-6106-bridge-exit-normalization.gpt-web.json` | 6106 command `… 2>&1 \|\| true` |
| `d0025-w-wf61-6109-finalize-observability-resync-after-hangproof.gpt-web.json` | 6109 command |
| `d0025-w-wf61-6110-case-b-resync-after-hangproof.gpt-web.json` | 6110 jsCode |

## Post-apply validation

| Check | Result |
|---|---|
| template/live 6104 hang-proof (`request_body_b64`) | PASS |
| template/live 6106 type `executeCommand` | PASS |
| template/live 6106 includes `2>&1 \|\| true` | PASS |
| template/live 6107 hang-proof (`transport_classification`) | PASS |
| template/live 6109 finalize observability | PASS |
| template/live 6110 CASE B census/completion | PASS |
| Node count | **13** |
| Connections | unchanged |
| 6101/6102/6103/6105/6108/6111/6112 | unchanged vs pre |
| Live versionId | `8690b057-bfc6-4ee9-a968-936046ff497f` |
| WF61 final | **inactive** |
| Gate final | **CLOSED** |
| LiteLLM Δ | **0** (total **10**) |
| provider_calls | **0** |
| Tranche 02 GLM / LiteLLM | **0/10** / **0/10** |

## Offline helper classification checks

`tests/litellm-primary-one-shot/run.mjs` — **7/7 PASS** · `provider_calls=0`

Fixture + shell-normalized parse (6107-equivalent) preserved:

| Classification | Preserved (not `HTTP_BRIDGE_OUTPUT_INVALID`) |
|---|---|
| `HTTP_COMPLETED` | PASS |
| `HTTP_WALL_TIMEOUT` | PASS |
| `HTTP_BODY_IDLE_TIMEOUT` | PASS |
| `HTTP_BODY_TOO_LARGE` | PASS |
| `HTTP_REQUEST_ERROR` | PASS (incl. real bash `2>&1 \|\| true`) |
| `HTTP_RESPONSE_ABORTED` | PASS |

Helper file / schema / normalizer / CASE B helper / LiteLLM config: **unchanged**.

## OUT OF SCOPE (not mutated)

- Node **6112** secondary finding
- Provider/gate arm / planning trigger
- Topology / source-artifact redesign

## NEXT (not executed)

One bounded D-0025-W tranche 02 live event:

- GLM Δ ≤ **1** · LiteLLM Δ ≤ **1**
- retry **0** · fallback **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0**
