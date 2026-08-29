# V4 - qwen_local llama.cpp DFlash2 bounded live proof (retry 3)

**Block ID:** `V4_QWEN_LOCAL_LLAMA_CPP_BOUNDED_LIVE_PROOF_RETRY_3`  
**Starting HEAD:** `327a2b6cee9c44649b5055d24d8c2982abca29c3`  
**Final HEAD:** `55c880f2325f8fd10857bdfdae4924a4ba5034c1`  
**Result:** **PASS**  
**runtime_manually_started_by_operator:** true

## Preflight (read-only)

| Field | Value |
|---|---|
| llama_server_process | **RUNNING** (`llama-server.exe`, PID 7576) |
| port_8080_listener | **LISTENING** on `127.0.0.1` |
| listener_process | `llama-server` (PID 7576) |
| models_probe | **HTTP 200** |
| fast_8k_dflash2_present | **true** (`qwen38-original-dflash2-8k`) |

process_start_calls=0 · process_kill_calls=0 · launcher_mutations=0

## Canonical runtime

| Field | Value |
|---|---|
| backend | `llama_cpp` |
| endpoint | `http://127.0.0.1:8080` |
| profile | `fast_8k` |
| model_id | `qwen38-original-dflash2-8k` |
| context_tokens | 8192 |
| dflash_required | true |

## Generation

| Field | Value |
|---|---|
| generation_attempts | **1** |
| endpoint path | `/v1/chat/completions` |
| HTTP status | 200 |
| adapter ok | true |
| classification | `LOCAL_MODEL_RESULT` |
| role | `routing_arbiter` |
| elapsed_ms | 63898 |

### Validated result

```json
{
  "selection": "opencode+qwen_local",
  "reason_code": "LOCAL_ZERO_COST_SUFFICIENT",
  "confidence": "high"
}
```

Contract enums respected. No extra fields. No invented resources. No chain-of-thought persisted. Synthetic proof only — not production routing policy.

## Resource status

`configs/resources/status.fail-closed.json` unchanged (`qwen_local.available=false`).  
`qwen_local_llama_cpp_live_proof` = **PASS** (profile `fast_8k`, `dflash_required=true`).

## Post-live offline suites

| Suite | Result |
|---|---|
| `tests/qwen-local-adapter/run.mjs` | PASS 9/9 |
| `tests/qwen-local-llama-cpp-transport/run.mjs` | PASS 8/8 |
| `tests/classifier-wrapper/run-offline-tests.mjs` | PASS 9/9 |

## Counters

provider_calls=0 · litellm_calls=0 · glm_calls=0 · codex_calls=0 · ollama_generate_calls=0 · n8n_mutations=0 · workflow_mutations=0 · d0025_mutations=0 · launcher_mutations=0 · model_downloads=0 · process_start_calls=0 · process_kill_calls=0 · secret_exposure=false
