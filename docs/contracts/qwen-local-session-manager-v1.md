# qwen-local-session-manager-v1

Bounded local runtime session manager for logical resource `qwen_local`.

## Responsibility

```text
ensureQwenLocalReady({ profile })
        |
        v
canonical MultiModel router READY on :8080?
   YES -> reuse (launch_performed=false)
   NO  -> launch OPERATOR-TESTED MultiModel launcher once
        -> bounded poll /v1/models for exact profile_id
```

Does **not**:
- reconstruct llama.cpp CLI flags;
- select/start DCFR sidecars directly (router owns backends);
- kill/restart healthy servers;
- mutate launcher / `qwen-models.ini`;
- generate model text for readiness;
- require DFlash2.

## Profiles

Resolved only from `configs/resources/qwen-local-runtime.json` as exact
`profile_id` values exposed through `http://127.0.0.1:8080`:

| Profile | Role |
|---|---|
| `qwen38-opus-q3-daily-16k` (default/startup) | DAILY / QUALITY |
| `qwen38-opus-q3-agent-24k` | QUALITY_AGENT_24K |
| `qwen38-dcfr-iq3-fast-16k` | FAST |
| `qwen38-dcfr-iq3-agent-24k` | FAST_THROUGHPUT_LONG_TASK / MCP / BLENDER_FAST |
| `qwen38-original-ar-16k` | REFERENCE |
| `qwen38-uncensored-ar-16k` | MANUAL_UNCENSORED |

## Launcher

Verified operator launcher (starts MultiModel router, not a reconstructed backend):

`C:\Users\mrhz\Documents\AI\QWEN\Start-Qwen-MultiModel-16K.ps1`

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
| `DFLASH_REQUIRED` | Legacy DFlash profile rejected under retired policy |

## Result shape

```json
{
  "schema_version": "qwen-local-session-manager-result-v1",
  "status": "READY",
  "ready": true,
  "profile": "qwen38-opus-q3-daily-16k",
  "model_id": "qwen38-opus-q3-daily-16k",
  "base_url": "http://127.0.0.1:8080",
  "launch_performed": false,
  "wait_elapsed_ms": 0,
  "reason_code": "READY",
  "launch_count": 0
}
```

Machine schema: `docs/contracts/qwen-local-session-manager-v1.schema.json`.
