# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | V4 qwen_local READY restored · live OpenCode proof awaits **fresh** operator AUTH |
| **BLOCCO ATTIVO** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF` |
| **STATO BLOCCO** | `QWEN_LOCAL_READY_RESTORED / LIVE_PROOF_REAUTH_REQUIRED` |
| **GATE CORRENTE** | **CLOSED** · fresh operator authorization required. Historical `AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF` is **spent/non-reusable**. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH` — obtain a **new** one-shot operator authorization for OpenCode + qwen_local live proof. Before any generation, re-run shared-runtime occupancy preflight per `OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`. Do **not** execute live proof until fresh AUTH exists. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **QWEN_LOCAL** | **READY** · `fast_8k` · `qwen38-original-dflash2-8k` · `http://127.0.0.1:8080` · generation_calls **0** |

## Restore anchors

- Report: `reports/architecture/v4_qwen_local_ready_restore_zero_generation.md`
- Session manager recheck: `READY` · `launch_performed=false`
- Transient RESOURCE_STATUS: `qwen_local.available=true` · `source=local_probe` · `cost_mode=free`
- Canonical launcher used once; launcher/runtime parameters **unchanged**
- Occupancy at restore start: control-plane endpoint `QWEN_NOT_RUNNING_SAFE_TO_START` (`:8080` down); separate Ollama `llama-server` on **31452** left untouched (no process kill)
- Closing the Edge WebUI started by the launcher will stop the 8080 server (launcher lifecycle)

## Mandatory Qwen shared-runtime occupancy boundary

Canonical standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`.

Before assigning, starting, restarting, or otherwise consuming local Qwen 3.8 27B:

- perform a **read-only** occupancy check for active Qwen/llama-server/Ollama/proxy plus Blender/MCP/Cursor/OpenCode/benchmark activity that can be correlated to Qwen use;
- distinguish `QWEN_READY_IDLE`, `QWEN_BUSY_SHARED_RUNTIME`, `QWEN_OCCUPANCY_UNCERTAIN`, `QWEN_NOT_RUNNING_SAFE_TO_START`;
- never kill or restart Qwen/Ollama/proxy/llama-server/Blender/MCP/Cursor/OpenCode merely to free the runtime;
- active shared workload => do not assign a new Qwen generation;
- uncertain ownership/occupancy => fail closed, no process termination.

## Boundaries

- Do **not** reuse closed/spent live-proof authorization.
- Do **not** run OpenCode or any model generation without fresh AUTH.
- Do not mutate Qwen launcher/runtime parameters, network, or credentials.
- Do not terminate Qwen/Ollama/proxy/llama-server or related Blender/MCP/Cursor/OpenCode processes without first establishing ownership/state; this frontier does not authorize process kills.

## Puntatori

- Ready restore: `reports/architecture/v4_qwen_local_ready_restore_zero_generation.md`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Prior STOP: `reports/architecture/v4_opencode_bounded_live_dispatch_proof.md`
- Checkpoint: `docs/runtime/CHECKPOINT_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.md`
- Historical AUTH (do not reuse): `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json`
