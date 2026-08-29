# V4 - qwen_local session manager

**Block ID:** `V4_QWEN_LOCAL_SESSION_MANAGER`  
**Starting HEAD:** `f34ec3b46747b7eaa2cd0ee123bfe2b5023d70a6`  
**default_profile:** `fast_8k`  
**dflash_required:** true  
**source_of_runtime_parameters:** operator_launcher  
**idempotent_start:** true  
**concurrent_start_dedup:** true  

## Paths

| Path | Role |
|---|---|
| `docs/contracts/qwen-local-session-manager-v1.md` | Contract |
| `docs/contracts/qwen-local-session-manager-v1.schema.json` | Result schema |
| `tools/qwen-local-session-manager-v1.mjs` | Implementation |
| `tests/qwen-local-session-manager/run.mjs` | Offline/mock suite |

**Launcher (unchanged):** `C:\Users\mrhz\Documents\AI\QWEN\Start-Qwen-MultiModel-16K.ps1`

## Timing

| Setting | Value |
|---|---|
| readiness_timeout | 180000 ms |
| poll_interval | 2000 ms |

## Offline tests

`tests/qwen-local-session-manager/run.mjs` → **14/14 PASS**  
`tests/qwen-local-llama-cpp-transport/run.mjs` → **8/8 PASS**  
`tests/qwen-local-adapter/run.mjs` → **9/9 PASS**

## Live readiness probe

| Field | Value |
|---|---|
| performed | true |
| status | READY |
| profile | fast_8k |
| model_id | qwen38-original-dflash2-8k |
| launch_performed | false |
| generation_calls | 0 |

## Counters

process_kill_calls=0 · launcher_mutations=0 · model_downloads=0 · provider_calls=0 · litellm_calls=0 · glm_calls=0 · codex_calls=0 · qwen_generation_calls=0 · n8n_mutations=0 · workflow_mutations=0 · d0025_mutations=0 · secret_exposure=false
