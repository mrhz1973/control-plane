# V4 - qwen_local llama.cpp DFlash2 bounded live proof

**Block ID:** `V4_QWEN_LOCAL_LLAMA_CPP_BOUNDED_LIVE_PROOF`  
**Starting HEAD:** `6a71fd4bc0475a955730da7726dfc61f5ee3295a`  
**Result:** **STOP** — `MODEL_ERROR`

## Runtime binding

| Field | Value |
|---|---|
| backend | `llama_cpp` |
| endpoint | `http://127.0.0.1:8080` |
| profile | `fast_8k` |
| model_id | `qwen38-original-dflash2-8k` |
| context_tokens | 8192 |
| dflash_required | true |
| old_ollama_proof_superseded | true |

## Models probe

| Field | Value |
|---|---|
| `GET /v1/models` | HTTP 200 |
| `qwen38-original-dflash2-8k` present | true |

## Generation

| Field | Value |
|---|---|
| generation_attempts | **1** |
| adapter ok | false |
| classification | `MODEL_ERROR` |
| role | `routing_arbiter` |
| result | null |
| elapsed_ms | 5487 |

No retry. No Ollama fallback. No AR/16K/32K fallback. No second model. No raw model payload / CoT persisted.

## Resource status

- `configs/resources/status.fail-closed.json` unchanged (`qwen_local.available=false`)
- `qwen_local_llama_cpp_live_proof` = **STOP** (not PASS)

## Counters

| Counter | Value |
|---|---|
| provider_calls | 0 |
| litellm_calls | 0 |
| glm_calls | 0 |
| codex_calls | 0 |
| ollama_generate_calls | 0 |
| n8n_mutations | 0 |
| workflow_mutations | 0 |
| d0025_mutations | 0 |
| launcher_mutations | 0 |
| model_downloads | 0 |
| secret_exposure | false |

## Offline recheck after live attempt

`tests/qwen-local-adapter/run.mjs` -> PASS 9/9  
`tests/qwen-local-llama-cpp-transport/run.mjs` -> PASS 8/8
