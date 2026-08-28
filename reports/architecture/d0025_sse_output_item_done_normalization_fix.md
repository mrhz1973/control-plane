# D-0025-W — SSE output_item.done normalization fix

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION_FIX_AND_RESUME`  
**Date:** 2026-08-29  
**Starting HEAD:** `8c35ff7ad01398bb36072ac419dc0de28836c172`  
**Artifact:** `docs/runtime/PATCH_D0025_W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION.gpt-web.json`  
**Standing authorization:** `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`  
**Status:** **Phase A PASS** · **Phase B STOP** `LITELLM_HTTP_FAILURE` HTTP 429 (ZAI 5-hour usage limit)

---

## Phase A — bounded normalizer apply

| Item | Result |
|---|---|
| Target | `tools/normalize-litellm-responses-body.mjs` |
| Before | `if (!completedResponse)` → `SSE_NO_COMPLETED_RESPONSE` / "No response.completed terminal event found" |
| After | if `outputItemsByIndex.size > 0`, synthesize `{object:"response", status:"completed", output:[]}` then existing `mergeOutputItems`; else fail-closed with updated reason |
| Tests added | `finalize-sse-output-item-done-without-completed-pass` · `finalize-sse-no-completed-no-output-fail-closed` |
| Offline suite | **18/18 PASS** (`network_access=false`, `provider_model_request_count=0`) |
| Phase A provider/LiteLLM/WF40/WF61 | **0** |
| Runtime gate during apply | **CLOSED** |
| Code commit | `a8b051f664c7f6ecc37c1cd468796c4a65dcdf38` |

---

## Phase B — same live cycle (entered)

| Metric | Value |
|---|---|
| Trigger | `9b40ff25ca97d09bca393c9294095c272e6330c4` |
| Adapter | **REMOTE_DISPATCH_READY** |
| WF40 / WF61 | `285015` / `285016` |
| LiteLLM delta | **1** (total **3**) |
| GLM attempt delta | **1** (ZAI/planner-glm-pilot received the request) |
| HTTP status | **429** |
| Terminal classification | **`LITELLM_HTTP_FAILURE`** |
| Sanitized reason | Single LiteLLM HTTP attempt did not return 2xx; retry is forbidden. LiteLLM mapped ZAI `RateLimitError`: 5-hour usage limit; reset **2026-08-29 09:12:41**. |
| Normalization / response gate / schema / policy | **NOT_REACHED** (HTTP not 2xx) |
| Gate / WF61 final | **CLOSED** / **inactive** |
| GLM budget | **3/10** |

No retry. No raw provider body persisted.
