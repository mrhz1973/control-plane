# D-0025-W — HTTP 200 body-shape inspect + offline remediate

**Block ID:** `D0025_W_HTTP200_BODY_SHAPE_INSPECT_AND_OFFLINE_REMEDIATE`  
**Starting HEAD:** `5c3065bfb38f1d638656a966232a39a617632385`  
**Status:** **STOP — CASE B — EXISTING_ATTEMPT11_BODY_UNAVAILABLE**

## Attempt 11 correlation

| Field | Value |
|---|---|
| WF40 | `285414` (present · success · has cycle result + empty `sse_census`) |
| WF61 | `285415` (present · status error · **`runData` empty**) |
| HTTP status (from parent cycle) | 200 |
| classification | `SSE_NO_COMPLETED_RESPONSE` |

## Evidence inspection (read-only)

| Source | Result |
|---|---|
| `execution_entity` 285415 | present |
| `execution_data` 285415 | present · len 3308 · `runData={}` · **no** Capture/HTTP/`response_b64` |
| Parent 285414 | cycle result only · `sse_census` present · **no** `response_b64` / raw body |
| Nearby executions 285410–285420 | **no** `response_b64` retained |
| LiteLLM logs | access line only (not used as body evidence) |

## Sanitized framing + key/shape census

**Unavailable** — raw/structural HTTP 200 body required for CASE A is not retained.

Retained Attempt 11 census (already known; not a body substitute):

```json
{
  "schema": "sse-structural-census-v1",
  "data_event_count": 0,
  "done_marker_count": 0,
  "parse_error_count": 0,
  "event_labels": [],
  "event_types": [],
  "first_event_types": [],
  "last_event_types": [],
  "top_level_key_sets": [],
  "selected_field_shapes": []
}
```

Empty-`data:` census alone does **not** uniquely determine a safe JSON→Responses mapping (chat-completions vs incomplete Responses vs other JSON forms remain indistinguishable without body keys/shapes).

## CASE classification

**CASE B — BODY_UNAVAILABLE** (`EXISTING_ATTEMPT11_BODY_UNAVAILABLE`)

No deterministic CASE A adapter is justified. No invented semantics. No GLM call.

## Normalizer delta

none (`tools/normalize-litellm-responses-body.mjs` untouched)

## Tests

not run for new shape (no CASE A implementation)

## Counters

| Metric | Value |
|---|---|
| raw_body_persisted | false |
| model_content_persisted | false |
| secrets_exposed | false |
| provider_calls | 0 |
| litellm_requests | 0 |
| glm_calls | 0 |
| workflow_mutations | 0 |
| remote_runtime_gate | CLOSED |

## NEXT

Before another live resume, retain sanitized **body framing + top-level/nested key shapes** (not raw content) from Capture, or persist a non-secret structural dump sufficient for CASE A. Empty `sse_census` is insufficient alone.
