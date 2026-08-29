# V4 - qwen_local llama.cpp DFlash2 primary transport

**Block ID:** `V4_QWEN_LOCAL_LLAMA_CPP_TRANSPORT`  
**Prompt expected origin/main:** `edb25753cde3df8fd11896e47c14e08bbac45537`  
**Actual starting HEAD:** `95598349b5780710fe54f57ebd1eb3c5875ef928`  
**Interrupted-task cleanup:** N/A — workspace clean; prior live-proof already on main (`fd16efa` / `9559834`)

## Verified launcher (read-only)

| Field | Value |
|---|---|
| Script | `Documents/AI/QWEN/Start-Qwen-MultiModel-16K.ps1` |
| Server executable | `llama.cpp-dflash2/build-cuda/bin/llama-server.exe` |
| Preset | `llama.cpp-dflash2/qwen-models.ini` |
| Host / port | `127.0.0.1:8080` |
| Base URL | `http://127.0.0.1:8080` |
| Launch mode | `--models-preset` multi-model router (`--models-max 1 --models-autoload`) |

Launcher files were **not** modified.

## Primary runtime (sanitized)

| Field | Value |
|---|---|
| Primary backend | `llama_cpp` |
| Main model identity | Qwen 3.8 27B Original |
| DFlash2 draft identity | Qwen3.8-27B-DFlash2 |
| Draft quantization | Q4_K_M |
| KV cache | q8_0 / q8_0 |
| Threads | 20 |
| GPU layers (8K/16K) | 36 |
| GPU layers (32K) | 32 (as in launcher preset) |
| Draft max | 7 |
| Spec type | `draft-dflash` |

## Profile policy

| Profile | Context | Default |
|---|---|---|
| FAST_8K (`fast_8k`) | 8192 | **YES** |
| BALANCED_16K (`balanced_16k`) | 16384 | escalation |
| LONG_32K (`long_32k`) | 32768 | exceptional |

All normal profiles: `dflash_required=true`. AR fallback forbidden.

Profile selection: choose OpenAI model id on the multi-model router (e.g. `qwen38-original-dflash2-8k`). Not via generate-API ctx. No automatic server restart in this block.

## Implementation

- `tools/llama-cpp-json-client-v1.mjs` — primary OpenAI-compatible client
- `tools/ollama-json-client-v1.mjs` — preserved compatibility
- `tools/qwen-local-adapter-v1.mjs` — backend `llama_cpp` (default) / `ollama`
- `tools/qwen-local-runtime-v1.mjs` — profile policy validation
- `configs/resources/qwen-local-runtime.json` — committed non-secret profiles
- contract doc updated

## Offline tests

| Suite | Result |
|---|---|
| `tests/qwen-local-llama-cpp-transport/run.mjs` | **8/8 PASS** |
| `tests/qwen-local-adapter/run.mjs` | **9/9 PASS** |
| `tests/classifier-wrapper/run-offline-tests.mjs` | **9/9 PASS** |

## Live metadata probe

`GET http://127.0.0.1:8080/v1/models` -> HTTP 200  
Exposed DFlash2 ids include `qwen38-original-dflash2-8k|16k|32k` (and AR ids present but forbidden for normal use).  
**generation_calls=0**

## Counters

provider_calls=0 · litellm_calls=0 · n8n_mutations=0 · workflow_mutations=0 · d0025_mutations=0 · launcher_mutations=0 · model_downloads=0 · secret_exposure=false
