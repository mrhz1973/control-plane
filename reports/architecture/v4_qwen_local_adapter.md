# V4 - QWEN_LOCAL_ADAPTER

**Block ID:** `V4_QWEN_LOCAL_ADAPTER`  
**Starting HEAD:** `0f2f7a524970c4733319d8f5f849cbf71685321d`  
**Category:** FOUNDATION / LOCAL-AI / ADDITIVE  
**Provider calls:** 0  
**LiteLLM calls:** 0  
**Ollama generate calls:** 0  
**n8n mutations:** 0  
**workflow mutations:** 0  
**D-0025-W mutations:** 0  
**secret exposure:** false

## Shared Ollama transport extraction/reuse

| Path | Role |
|---|---|
| `tools/ollama-json-client-v1.mjs` | Shared transport: `/api/generate`, `stream=false`, `think=false`, `format=json`, reachability, parse, config binding |
| `tools/classifier-wrapper-v1.mjs` | Consumes shared client; event-shaped classifier behavior preserved |

No second Ollama transport copy/paste.

## Classifier regression

`node tests/classifier-wrapper/run-offline-tests.mjs` -> **PASS 9/9** (+ static payload assertion)

## Adapter files

| Path | Role |
|---|---|
| `docs/contracts/qwen-local-adapter-v1.md` | Human contract |
| `docs/contracts/qwen-local-adapter-v1.schema.json` | Request/result `$defs` |
| `tools/qwen-local-adapter-v1.mjs` | Implementation + mock mode |
| `tests/qwen-local-adapter/run.mjs` | Offline targeted suite |

## Supported roles

`planner` | `routing_arbiter` | `reviewer` | `classifier`

Adapter shapes instruction text by role. Does **not** make routing decisions, invent resources, or replace `classifier-wrapper-v1`.

## Input / output contract

Request `schema_version`: `qwen-local-adapter-request-v1`  
Result `schema_version`: `qwen-local-adapter-result-v1`

Success classification: `LOCAL_MODEL_RESULT`

Fail-closed: `INVALID_INPUT`, `MODEL_UNAVAILABLE`, `MODEL_ERROR`, `INVALID_JSON`, `OUTPUT_CONTRACT_MISMATCH`

Failures do not expose raw model internals.

## Model binding precedence

1. explicit adapter options  
2. `OLLAMA_BASE_URL` / `OLLAMA_MODEL` / `OLLAMA_TIMEOUT_MS`  
3. compatibility defaults in shared client only  

Logical resource remains `qwen_local`. No permanent concrete model in RESOURCE_REGISTRY. Adapter source does not hard-code `qwen3:14b`.

## Resource consistency (unchanged semantics)

- `configs/resources/registry.json`: `qwen_local` logical model  
- `configs/resources/status.fail-closed.json`: `qwen_local.available=false`

## Targeted tests

`node tests/qwen-local-adapter/run.mjs` -> **9/9 PASS** (mock only)

Includes planner/routing_arbiter/reviewer PASS, invalid role/empty instruction/invalid JSON/missing field/enum FAIL, logical binding check.

## Preserve

execution-packet, planner-routing/selection, WF40/WF61, workflows, n8n, LiteLLM, OpenClaw, Telegram, CURRENT_FRONTIER D-0025, backlog, GLM gate.

Not created: EXECUTION_ROUTER, REVIEW_ROUTER, OpenCode dispatch, n8n/Telegram V4 integration, RESOURCE_STATUS collector.
