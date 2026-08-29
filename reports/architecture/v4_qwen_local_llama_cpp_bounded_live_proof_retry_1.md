# V4 - qwen_local llama.cpp DFlash2 bounded live proof (retry 1)

**Block ID:** `V4_QWEN_LOCAL_LLAMA_CPP_BOUNDED_LIVE_PROOF_RETRY_1`  
**Starting HEAD:** `08bcacb1671da40d967b74eb0fb3a1f4ecde41be`  
**Result:** **STOP** — `FAST_8K_DFLASH2_PROFILE_NOT_AVAILABLE`  
**Operator runtime manually loaded:** stated true (not verified by probe)

## Runtime binding (canonical, unchanged)

| Field | Value |
|---|---|
| backend | `llama_cpp` |
| endpoint | `http://127.0.0.1:8080` |
| profile | `fast_8k` |
| model_id | `qwen38-original-dflash2-8k` |
| context_tokens | 8192 |
| dflash_required | true |

## Models probe

| Field | Value |
|---|---|
| Request | `GET http://127.0.0.1:8080/v1/models` (read-only, one attempt) |
| Result | **FAIL** — TCP/HTTP connection could not be established |
| `qwen38-original-dflash2-8k` confirmed | **no** (server unreachable) |
| generation_attempts | **0** |

No server start/restart. No launcher/preset mutation. No generation call made.

## Sanitized diagnostic

```json
{
  "probe_classification": "CONNECTION_ERROR",
  "error_message_sanitized": "connection to 127.0.0.1:8080 failed"
}
```

## Post-check offline suites

| Suite | Result |
|---|---|
| `tests/qwen-local-adapter/run.mjs` | PASS 9/9 |
| `tests/qwen-local-llama-cpp-transport/run.mjs` | PASS 8/8 |
| `tests/classifier-wrapper/run-offline-tests.mjs` | PASS 9/9 |

## Resource status

`configs/resources/status.fail-closed.json` unchanged. `qwen_local_llama_cpp_live_proof` remains **STOP** from prior attempt.

## Counters

provider_calls=0 · litellm_calls=0 · glm_calls=0 · codex_calls=0 · ollama_generate_calls=0 · n8n_mutations=0 · workflow_mutations=0 · d0025_mutations=0 · launcher_mutations=0 · model_downloads=0 · secret_exposure=false
