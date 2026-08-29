# V4 - Qwen local bounded live proof

**Block ID:** `V4_QWEN_LOCAL_BOUNDED_LIVE_PROOF`  
**Starting HEAD:** `edb25753cde3df8fd11896e47c14e08bbac45537`  
**Result:** **PASS**

## Model selection

| Field | Value |
|---|---|
| Ollama reachability (`/api/tags`) | **PASS** HTTP 200 |
| `OLLAMA_MODEL` env | unset |
| Selected installed Qwen | `qwen3.8:27b` |
| Selection rationale | Strongest practical general Qwen already installed (not coder-specialized; larger than `qwen3:14b`). No download/pull. |
| Model downloads | 0 |

## Generation

| Field | Value |
|---|---|
| generate_attempts | **1** |
| Transport | `qwen-local-adapter-v1` -> `ollama-json-client-v1` `/api/generate` |
| Role | `routing_arbiter` |
| Adapter ok | true |
| classification | `LOCAL_MODEL_RESULT` |
| elapsed_ms | ~55118 |

## Validated result (sanitized)

```json
{
  "selection": "opencode+qwen_local",
  "reason_code": "LOCAL_ZERO_COST_SUFFICIENT",
  "confidence": "high"
}
```

Contract enums respected. No invented resources. No chain-of-thought persisted. Synthetic proof only - not production routing policy.

## Resource status consequence

- `configs/resources/status.fail-closed.json` **unchanged** (still fail-closed; `qwen_local.available=false`)
- `qwen_local_live_proof` = **PASS**
- Future runtime RESOURCE_STATUS may mark `qwen_local` available when a fresh local probe confirms the same conditions (collector not implemented in this pass)

## Counters

| Counter | Value |
|---|---|
| provider_calls | 0 |
| litellm_calls | 0 |
| glm_calls | 0 |
| codex_calls | 0 |
| n8n_mutations | 0 |
| workflow_mutations | 0 |
| d0025_mutations | 0 |
| model_downloads | 0 |
| secret_exposure | false |

## Offline recheck after live attempt

`node tests/qwen-local-adapter/run.mjs` -> **PASS 9/9**
