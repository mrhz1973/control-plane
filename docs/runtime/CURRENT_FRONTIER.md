# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | V4 qwen_local READY restored with zero generation, but shared-runtime occupancy is **not yet proven idle** after restore-time observation of separate Ollama `llama-server` on port `31452` |
| **BLOCCO ATTIVO** | `V4_QWEN_SHARED_RUNTIME_OCCUPANCY_DIAGNOSIS_ZERO_GENERATION` |
| **STATO BLOCCO** | `QWEN_LOCAL_READY_RESTORED / SHARED_RUNTIME_OCCUPANCY_RECHECK_REQUIRED / LIVE_PROOF_GATE_CLOSED` |
| **GATE CORRENTE** | **CLOSED** · do not request/reuse live-proof authorization until shared-runtime occupancy is classified. Historical `AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF` is **spent/non-reusable**. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_QWEN_SHARED_RUNTIME_OCCUPANCY_DIAGNOSIS_ZERO_GENERATION` — read-only classify current shared Qwen usage across `llama-server`/Ollama/proxy/Blender/MCP/Cursor/OpenCode/benchmark activity. No process kill/restart, no generation. If and only if `QWEN_READY_IDLE`, return to `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH`. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **QWEN_LOCAL CONTROL-PLANE ENDPOINT** | **READY** · `fast_8k` · `qwen38-original-dflash2-8k` · `http://127.0.0.1:8080` · generation_calls **0** |
| **SHARED-RUNTIME OCCUPANCY** | **UNRESOLVED** — separate Ollama `llama-server` on `31452` was observed and left untouched; operator warned Blender/MCP/Cursor benchmarks may consume Qwen |

## Restore anchors

- Report: `reports/architecture/v4_qwen_local_ready_restore_zero_generation.md`
- Session manager recheck: `READY` · `launch_performed=false`
- Transient RESOURCE_STATUS: `qwen_local.available=true` · `source=local_probe` · `cost_mode=free`
- Canonical launcher used once; launcher/runtime parameters **unchanged**
- Restore-time canonical endpoint classification: `QWEN_NOT_RUNNING_SAFE_TO_START` for `:8080` only; this is **not** proof of global shared-runtime idleness
- Separate Ollama `llama-server` on **31452** left untouched (no process kill)
- Closing the Edge WebUI started by the launcher will stop the 8080 server (launcher lifecycle)

## Mandatory Qwen shared-runtime occupancy boundary

Canonical standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`.
Post-restore hold: `docs/runtime/QWEN_POST_RESTORE_OCCUPANCY_HOLD.md`.

Before assigning, starting, restarting, or otherwise consuming local Qwen 3.8 27B:

- perform a **read-only** occupancy check for active Qwen/llama-server/Ollama/proxy plus Blender/MCP/Cursor/OpenCode/benchmark activity that can be correlated to Qwen use;
- distinguish `QWEN_READY_IDLE`, `QWEN_BUSY_SHARED_RUNTIME`, `QWEN_OCCUPANCY_UNCERTAIN`, `QWEN_NOT_RUNNING_SAFE_TO_START`;
- never kill or restart Qwen/Ollama/proxy/llama-server/Blender/MCP/Cursor/OpenCode merely to free the runtime;
- active shared workload => do not assign a new Qwen generation;
- uncertain ownership/occupancy => fail closed, no process termination.

## Boundaries

- Do **not** reuse closed/spent live-proof authorization.
- Do **not** run OpenCode or any model generation before the occupancy diagnosis and a later fresh AUTH.
- Do not mutate Qwen launcher/runtime parameters, network, or credentials.
- Do not terminate Qwen/Ollama/proxy/llama-server or related Blender/MCP/Cursor/OpenCode processes without first establishing ownership/state; this frontier does not authorize process kills.
- Do not close the launcher Edge WebUI merely to free resources while ownership is unresolved.

## Puntatori

- Ready restore: `reports/architecture/v4_qwen_local_ready_restore_zero_generation.md`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Post-restore hold: `docs/runtime/QWEN_POST_RESTORE_OCCUPANCY_HOLD.md`
- Prior STOP: `reports/architecture/v4_opencode_bounded_live_dispatch_proof.md`
- Checkpoint: `docs/runtime/CHECKPOINT_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.md`
- Historical AUTH (do not reuse): `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json`
