# D-0025-W — status-0 preflight + SSE capture resume

**Block ID:** `D0025_W_STATUS0_PREFLIGHT_AND_SSE_CAPTURE_RESUME`  
**Starting HEAD:** `b5ed90098d2d13c58f2eb97a78d87b90cf2bda1d`  
**Status:** **PREFLIGHT PASS** · **CAPTURE PASS** (`sse_census` present under HTTP 200 / `SSE_NO_COMPLETED_RESPONSE`)

## Transport preflight (provider_calls=0)

| Check | Result |
|---|---|
| containers running | n8n + litellm-primary PASS |
| DNS n8n → litellm-primary | `172.18.0.3` |
| TCP :4000 | PASS |
| `/health/readiness` | 200 healthy |
| network `root_default` | shared PASS |
| `/v1/responses` delta | **0** |
| gate CLOSED / WF61 inactive / capture present | PASS |
| pre-trigger readiness | PASS |

## Live resume

| Field | Value |
|---|---|
| Trigger | `f50622768fbfc0eb90c6d52bbc4e3c8d65a9571b` |
| WF40 / WF61 | `285414` / `285415` |
| LiteLLM Δ | 1 (total 5) · HTTP 200 |
| GLM Δ | 1 |
| classification | `SSE_NO_COMPLETED_RESPONSE` |
| sse_census | present |
| data_event_count | 0 |
| done_marker_count | 0 |
| parse_error_count | 0 |
| event_labels / event_types | [] / [] |
| gate / WF61 final | CLOSED / inactive |
| capture retained | true |
| retry/fallback/qwen/codex/cursor | 0 |
| raw_model_content_persisted | false |
| secrets_exposed | false |
| normalizer_mutated | false |

## NEXT

Offline remediation from empty-`data:` census under HTTP 200. Do not reopen gate until CASE A is justified.
