# qwen-local-adapter-v1

Reusable structured interface for the logical resource `qwen_local`.

## Responsibility

```text
CONTROL-PLANE REQUEST
        |
        v
QWEN_LOCAL_ADAPTER
        |
        v
shared Ollama JSON transport (ollama-json-client-v1)
        |
        v
structured validated result
```

Supports semantic roles without embedding routing policy:

- `planner`
- `routing_arbiter`
- `reviewer`
- `classifier`

## Not this component

- EXECUTION_ROUTER / REVIEW_ROUTER
- planner-selection evaluator
- OpenCode / implementation harness
- n8n workflow / provider gateway
- replacement for `classifier-wrapper-v1` (event-shaped classifier remains separate)

## Request

`schema_version`: `qwen-local-adapter-request-v1`

| Field | Rule |
|---|---|
| `request_id` | required non-empty string |
| `role` | required enum above |
| `instruction` | required non-empty string |
| `context` | JSON object |
| `output_contract` | JSON object describing expected structured result |

No chain-of-thought requests. No secrets in logs/evidence.

### output_contract (minimal)

```json
{
  "required": ["field_a"],
  "properties": {
    "field_a": { "type": "string", "enum": ["x", "y"] }
  },
  "additionalProperties": false
}
```

## Result

`schema_version`: `qwen-local-adapter-result-v1`

| Field | Rule |
|---|---|
| `request_id` | echoed (null only if input unreadable) |
| `role` | echoed (null only if input unreadable) |
| `ok` | boolean |
| `classification` | machine code |
| `result` | object on success, else `null` |
| `confidence` | `low` \| `medium` \| `high` \| `unknown` |

Success: `LOCAL_MODEL_RESULT`

Fail-closed (no raw model internals):

- `INVALID_INPUT`
- `MODEL_UNAVAILABLE`
- `MODEL_ERROR`
- `INVALID_JSON`
- `OUTPUT_CONTRACT_MISMATCH`

## Model binding

Logical resource: `qwen_local` (see RESOURCE_REGISTRY).

Concrete binding precedence:

1. explicit adapter option (`baseUrl` / `model` / `timeoutMs`)
2. `OLLAMA_BASE_URL` / `OLLAMA_MODEL` / `OLLAMA_TIMEOUT_MS`
3. existing compatibility defaults in `ollama-json-client-v1` only

`qwen3:14b` is not a V4 architectural requirement.

## Mock mode

`options.mock === true` with `options.mockResponse` enables deterministic offline execution without Ollama generation.

## Schemas

Machine schema: `docs/contracts/qwen-local-adapter-v1.schema.json` (`$defs.request` / `$defs.result`).
