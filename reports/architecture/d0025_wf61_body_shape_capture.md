# D-0025-W — WF61 body-shape capture apply + resume

**Block ID:** `D0025_W_WF61_BODY_SHAPE_CAPTURE_AND_RESUME`  
**Starting HEAD:** `3a537b9d28603c56f03e140a41f0dccc3d29b6fb`  
**Artifact:** `workflows/patches/d0025-w-wf61-body-shape-capture.gpt-web.json`  
**Status:** **APPLY PASS** · **PREFLIGHT PASS** · **CAPTURE PASS**

## Apply (provider_calls=0)

| Check | Result |
|---|---|
| expected_current match | PASS |
| only 6107 / 6110 jsCode | PASS |
| 13 nodes / IDs / connections | PASS |
| HTTP / prepare / finalize | unchanged |
| WF61 inactive / gate CLOSED | PASS |
| LiteLLM Δ | 0 |
| Live versionId | `b91e6c42-5dc8-4564-a2d3-a73d243ac55f` |

## Transport preflight (provider_calls=0)

DNS/TCP/`/health/readiness`/`root_default` **PASS** · LiteLLM Δ **0**

## Live resume

| Field | Value |
|---|---|
| Trigger | `42aba26e1c04c4f4aad8db50462ec1eb2f64b99f` |
| WF40 / WF61 | `285449` / `285450` |
| HTTP | 200 |
| LiteLLM / GLM Δ | 1 / 1 (totals 6 / budget 6/10) |
| classification | `SSE_NO_COMPLETED_RESPONSE` |
| sse_census | present · data_event_count=0 |
| body_shape.framing | `JSON_OBJECT` |
| body_shape.top_level_keys | `data`, `headers`, `statusCode`, `statusMessage` |
| gate / WF61 final | CLOSED / inactive |
| normalizer_mutated | false |
| raw_model_content_persisted | false |
| secrets_exposed | false |

## Finding

Captured object is the n8n fullResponse envelope, not the inner LiteLLM body. Offline remediation should target unwrapping `data` before Responses/SSE normalization.

## NEXT

Offline CASE A from this `body_shape` evidence. No live resume in this block.
