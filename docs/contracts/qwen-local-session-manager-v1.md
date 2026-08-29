# qwen-local-session-manager-v1

Bounded local runtime session manager for logical resource `qwen_local`.

## Responsibility

```text
ensureQwenLocalReady({ profile })
        |
        v
canonical llama.cpp READY?
   YES -> reuse (launch_performed=false)
   NO  -> launch OPERATOR-TESTED launcher once
        -> bounded poll /v1/models for DFlash2 profile
```

Does **not**:
- reconstruct llama.cpp CLI flags;
- kill/restart healthy servers;
- mutate launcher / `qwen-models.ini`;
- generate model text for readiness;
- integrate EXECUTION_ROUTER / n8n;
- update committed RESOURCE_STATUS.

## Profiles

Resolved only from `configs/resources/qwen-local-runtime.json`:

| Profile | Model id |
|---|---|
| `fast_8k` (default) | `qwen38-original-dflash2-8k` |
| `balanced_16k` | `qwen38-original-dflash2-16k` |
| `long_32k` | `qwen38-original-dflash2-32k` |

All require `dflash_required=true`. AR fallback forbidden.

## Launcher

Verified operator launcher (source of runtime parameters):

`C:\Users\mrhz\Documents\AI\QWEN\Start-Qwen-MultiModel-16K.ps1`

Invocation (when start needed):

```text
powershell.exe -NoProfile -ExecutionPolicy Bypass -File <launcher>
```

## Result statuses / reason codes

| Code | Meaning |
|---|---|
| `READY` | Already ready; no launch |
| `LAUNCH_STARTED_AND_READY` | Manager launched launcher; readiness passed |
| `INVALID_PROFILE` | Unknown / invalid profile |
| `INVALID_RUNTIME_CONFIG` | Runtime config invalid |
| `LAUNCHER_NOT_FOUND` | Launcher path missing |
| `LAUNCH_FAILED` | Child process start failed |
| `READINESS_TIMEOUT` | Bounded wait expired |
| `API_UNREACHABLE` | API never reachable after launch path |
| `PROFILE_NOT_EXPOSED` | API up but model id absent |
| `DFLASH_REQUIRED` | Profile violates DFlash2 requirement |

## Result shape

```json
{
  "schema_version": "qwen-local-session-manager-result-v1",
  "status": "READY",
  "ready": true,
  "profile": "fast_8k",
  "model_id": "qwen38-original-dflash2-8k",
  "base_url": "http://127.0.0.1:8080",
  "launch_performed": false,
  "wait_elapsed_ms": 0,
  "reason_code": "READY",
  "launch_count": 0
}
```

Machine schema: `docs/contracts/qwen-local-session-manager-v1.schema.json`.
