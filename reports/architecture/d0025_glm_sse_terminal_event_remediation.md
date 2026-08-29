# D-0025-W — GLM SSE terminal-event remediation (offline)

**Block ID:** `D0025_W_GLM_SSE_TERMINAL_EVENT_REMEDIATION`  
**Starting HEAD:** `d1a2077e82e177bb205bcdb166b7b696d8656dd3`  
**Status:** **STOP — CASE B — EXISTING_EVIDENCE_NOT_AVAILABLE**

## Attempt 9 correlation

| Field | Value |
|---|---|
| WF40 | `285346` (present · success) |
| WF61 | `285347` (**absent** from `execution_entity` and `execution_data`) |
| LiteLLM HTTP | 200 · `POST /v1/responses` at `2026-08-29T02:00:44Z` |
| Parent cycle result | `SSE_NO_COMPLETED_RESPONSE` |
| Parent keys | classification / http_status / reason only — **no** `response_b64` / raw body |

## Evidence sources inspected (read-only)

| Source | Result |
|---|---|
| n8n `execution_entity` / `execution_data` for `285347` | **missing** (count 0) |
| Nearby IDs 285340–285360 | gap: `285346` then `285348` — no `285347` |
| WF40 `285346` payload | fail-closed cycle result only; marker hits for `response.completed` / `output_item.done` are inside the **reason string**, not SSE events |
| `/tmp/wf61_retry9_*.json` | parent classification metadata only |
| LiteLLM logs (01:59–02:01Z) | single access-log line HTTP 200; **no** SSE event dump |
| Filesystem binary caches under n8n data | **none** for `285347` |

## Sanitized event-type census

**Unavailable.** No raw/structural Attempt 9 SSE stream remains to census.

## CASE classification

**CASE B — EXISTING_EVIDENCE_NOT_AVAILABLE**

The raw/structural Attempt 9 stream required to identify an alternate terminal shape is no longer available. No deterministic CASE A patch is justified. No invented normalization semantics. No GLM call.

## Normalizer delta

none (file untouched)

## Tests

not run for new shape (no CASE A implementation)

## Counters

| Metric | Value |
|---|---|
| raw_model_content_persisted | false |
| secrets_exposed | false |
| provider_calls | 0 |
| litellm_requests | 0 |
| glm_calls | 0 |
| codex_calls | 0 |
| qwen_calls | 0 |
| workflow_mutations | 0 |
| remote_runtime_gate | CLOSED |

## NEXT

Before any further live resume of `D-0025-W-GLM-LIVE-001`, capture a sanitized structural SSE census (event types / keys only) from the live HTTP body at finalize time, or otherwise persist non-secret protocol shape evidence. Do not reopen the gate solely to rediscover the shape without a capture plan.
