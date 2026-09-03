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
LOCAL MODEL TRANSPORT
        |
        +-- llama_cpp   PRIMARY (DFlash2 internal to server/runtime)
        |
        +-- ollama      LEGACY / COMPATIBILITY
        |
        v
structured validated result
```

Supports semantic roles without embedding routing policy:

- `planner`
- `routing_arbiter`
- `reviewer`
- `classifier`

Routing/n8n/planners see only logical resource `qwen_local`. They do **not**
reason about the DFlash2 draft model separately.

## Not this component

- EXECUTION_ROUTER / REVIEW_ROUTER
- planner-selection evaluator
- OpenCode / implementation harness
- n8n workflow / provider gateway
- replacement for `classifier-wrapper-v1` (event-shaped classifier remains separate)
- llama.cpp launcher / profile process manager

## Backends

| Backend | Role |
|---|---|
| `llama_cpp` | **Current primary** — OpenAI-compatible `llama-server` (`tools/llama-cpp-json-client-v1.mjs`) |
| `ollama` | Compatibility — preserved (`tools/ollama-json-client-v1.mjs`) |

Binding precedence for backend:

1. explicit adapter option `backend`
2. `QWEN_LOCAL_BACKEND`
3. default `llama_cpp`

llama_cpp URL/model/timeout precedence:

1. explicit adapter options
2. `QWEN_LOCAL_BASE_URL` / `QWEN_LOCAL_MODEL` / `QWEN_LOCAL_TIMEOUT_MS`
3. committed runtime defaults (`configs/resources/qwen-local-runtime.json`)

Ollama compatibility still honors `OLLAMA_BASE_URL` / `OLLAMA_MODEL` / `OLLAMA_TIMEOUT_MS` when `backend=ollama`.

## Six-profile MultiModel router

Machine config: `configs/resources/qwen-local-runtime.json`  
Policy: `configs/resources/qwen-local-model-policy.json` (`qwen38-rtx3060-2026-09-03`)

Canonical endpoint: `http://127.0.0.1:8080`

| Profile | Context | Role(s) |
|---|---|---|
| `qwen38-opus-q3-daily-16k` (**DEFAULT**) | 16384 | DAILY / QUALITY |
| `qwen38-opus-q3-agent-24k` | 24576 | QUALITY_AGENT_24K |
| `qwen38-dcfr-iq3-fast-16k` | 16384 | FAST |
| `qwen38-dcfr-iq3-agent-24k` | 24576 | FAST_AGENT / MCP / BLENDER_FAST |
| `qwen38-original-ar-16k` | 16384 | REFERENCE |
| `qwen38-uncensored-ar-16k` | 16384 | MANUAL_UNCENSORED (explicit user choice) |

DFlash2 **profiles** are retired. The `llama.cpp-dflash2` directory remains the
normal production llama.cpp runtime. Control Plane selects exact `profile_id`
through `:8080`; the router owns backend selection. Do not reconstruct
llama-server launch commands.

Uncensored remains selectable; sensitive topics must not auto-select it.

### Profile selection boundary

Context size is **not** switched via the generation API.

Verified launcher mode: MultiModel router on `http://127.0.0.1:8080`.
Selecting a profile means selecting the matching OpenAI model id
(exact profile_id). Automatic server restart is **out of scope** for this adapter.

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

Do not hard-code a permanent concrete Ollama tag or GGUF filesystem path into
RESOURCE_REGISTRY. Adapter binds to launcher-exposed model ids / env overrides.

## Mock mode

`options.mock === true` with `options.mockResponse` enables deterministic
offline execution without generation.

## Schemas

Machine schema: `docs/contracts/qwen-local-adapter-v1.schema.json` (`$defs.request` / `$defs.result`).
