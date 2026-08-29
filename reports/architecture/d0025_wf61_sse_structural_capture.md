# D-0025-W — WF61 SSE structural-capture apply + resume

**Block ID:** `D0025_W_WF61_SSE_STRUCTURAL_CAPTURE_AND_RESUME`  
**Starting HEAD:** `5ccfd724f0787b1e7ca052e0d5c6d5f09bb98acb`  
**Artifact:** `workflows/patches/d0025-w-wf61-sse-structural-capture.gpt-web.json`  
**Status:** **APPLY PASS** · **LIVE CAPTURE STOP** (`LITELLM_HTTP_FAILURE` http_status=0 · `sse_census=null`)

## Apply validation

| Check | Result |
|---|---|
| expected_current match (template + live) | PASS |
| only 6107 / 6110 jsCode differ | PASS |
| 13 nodes / IDs / names / types / connections | PASS |
| HTTP Request + prepare/finalize commands | unchanged |
| WF61 inactive after apply | PASS |
| gate CLOSED during apply | PASS |
| LiteLLM `/v1/responses` delta during apply | **0** |
| Live post-apply versionId | `6286b441-2b6d-45e2-85fc-ebf9f33a0c62` |

## Live resume

| Field | Value |
|---|---|
| Trigger | `489431086b2524378b69d554852d20a0af362e17` |
| WF40 / WF61 | `285395` / `285396` |
| classification | `LITELLM_HTTP_FAILURE` |
| http_status | 0 |
| LiteLLM delta | 0 (total 4) |
| GLM attempt delta | 0 |
| sse_census | null |
| gate / WF61 final | CLOSED / inactive |
| capture jsCode retained on live WF61 | true |
| retry / fallback / qwen / codex / cursor | 0 |
| raw_model_content_persisted | false |
| secrets_exposed | false |

## Finding

The authored capture path only emits `sse_census` after an HTTP body is captured (2xx path → finalize failure). This resume never received a 2xx LiteLLM response (status 0; no `POST /v1/responses` logged), so census could not be obtained. No second provider call performed.

## NEXT

Authorize another one-shot capture resume only after transport/status-0 is healthy enough to reach HTTP 2xx (or otherwise deliver a body to Capture). Normalizer remains unchanged until a real census exists.
