# V4 - qwen_local llama.cpp DFlash2 bounded live proof (retry 2)

**Block ID:** `V4_QWEN_LOCAL_LLAMA_CPP_BOUNDED_LIVE_PROOF_RETRY_2`  
**Starting HEAD:** `4925bca170ff3ae65a30dd91294dca98b6da44a2`  
**Result:** **STOP** — `LLAMA_SERVER_NOT_RUNNING`  
**generation_attempts:** **0**

## Preflight (read-only)

| Field | Value |
|---|---|
| llama_server_process | **ABSENT** (no `llama-server.exe`) |
| port_8080_listener | **NOT_LISTENING** |
| listener_process | n/a |
| models_probe | **CONNECTION_ERROR** (cannot connect to remote server) |
| fast_8k_dflash2_present | **false** (API unreachable) |

No process start. No process kill. No launcher/preset mutation.

## Canonical runtime (unchanged; not exercised)

| Field | Value |
|---|---|
| backend | `llama_cpp` |
| endpoint | `http://127.0.0.1:8080` |
| profile | `fast_8k` |
| model_id | `qwen38-original-dflash2-8k` |
| context_tokens | 8192 |
| dflash_required | true |

## Generation

Not attempted (preflight STOP).

## Sanitized diagnostic

```json
{
  "blocker": "LLAMA_SERVER_NOT_RUNNING",
  "llama_server_process": "ABSENT",
  "port_8080": "NOT_LISTENING",
  "models_probe": "CONNECTION_ERROR",
  "generation_attempts": 0
}
```

## Post-check offline suites

| Suite | Result |
|---|---|
| `tests/qwen-local-adapter/run.mjs` | PASS 9/9 |
| `tests/qwen-local-llama-cpp-transport/run.mjs` | PASS 8/8 |
| `tests/classifier-wrapper/run-offline-tests.mjs` | PASS 9/9 |

## Counters

provider_calls=0 · litellm_calls=0 · glm_calls=0 · codex_calls=0 · ollama_generate_calls=0 · n8n_mutations=0 · workflow_mutations=0 · d0025_mutations=0 · launcher_mutations=0 · model_downloads=0 · process_start_calls=0 · process_kill_calls=0 · secret_exposure=false
