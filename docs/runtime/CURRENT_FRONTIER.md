# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | Shared Qwen occupancy was BUSY; operator now reports competing Blender/MCP project **paused**; idle state must be re-verified read-only |
| **BLOCCO ATTIVO** | `V4_QWEN_SHARED_RUNTIME_OCCUPANCY_RECHECK_AFTER_PAUSE` |
| **STATO BLOCCO** | `PRIOR_QWEN_BUSY_SHARED_RUNTIME / OPERATOR_PAUSE_SIGNAL_RECEIVED / IDLE_NOT_YET_PROVEN / LIVE_PROOF_GATE_CLOSED` |
| **GATE CORRENTE** | **CLOSED** · no live-proof AUTH until read-only occupancy recheck proves `QWEN_READY_IDLE`. Historical live-proof AUTH remains **spent/non-reusable**. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_QWEN_SHARED_RUNTIME_OCCUPANCY_RECHECK_AFTER_PAUSE` — re-run bounded read-only occupancy diagnosis. If and only if `QWEN_READY_IDLE`, proceed to `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH`. No generation, process start/stop/kill/restart, or Edge close during recheck. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **QWEN_LOCAL CONTROL-PLANE ENDPOINT** | last known listener up on `127.0.0.1:8080` · `qwen38-original-dflash2-8k` exposed · assignability pending new occupancy recheck |
| **SHARED-RUNTIME OCCUPANCY** | prior classification `QWEN_BUSY_SHARED_RUNTIME`; operator reports competing Blender/MCP project paused, but pause signal alone is not proof of idle |

## Occupancy anchors

- Prior diagnosis: `reports/architecture/v4_qwen_shared_runtime_occupancy_diagnosis.md`
- Operator pause signal: `docs/runtime/OPERATOR_SIGNAL_QWEN_COMPETING_PROJECT_PAUSED_20260830.md`
- Constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Hold: `docs/runtime/QWEN_POST_RESTORE_OCCUPANCY_HOLD.md`

## Mandatory recheck boundary

Before assigning any new Qwen generation after the operator pause signal:

- perform a bounded **read-only** occupancy recheck for Qwen/llama-server/Ollama/proxy plus Blender/MCP/Cursor/OpenCode/benchmark activity;
- do not infer idle solely because the project was paused;
- classify exactly `QWEN_READY_IDLE`, `QWEN_BUSY_SHARED_RUNTIME`, or `QWEN_OCCUPANCY_UNCERTAIN`;
- do not kill/stop/restart competing processes or close Edge merely to free Qwen;
- do not request fresh OpenCode live-proof authorization unless the new classification is `QWEN_READY_IDLE`.

## Boundaries

- Do **not** kill/stop/restart Qwen/Ollama/proxy/llama-server/Blender/MCP/Cursor/OpenCode during recheck.
- Do **not** assign a Qwen generation or OpenCode live proof until idle is proven.
- Do **not** close Edge WebUI during recheck; it is tied to the control-plane launcher lifecycle.
- Do **not** reuse spent historical live-proof authorization.
- No network, credential, secret, runtime-parameter, n8n, WF40/WF61, OpenClaw, or D-0025 mutation.

## Puntatori

- Prior occupancy diagnosis: `reports/architecture/v4_qwen_shared_runtime_occupancy_diagnosis.md`
- Operator pause signal: `docs/runtime/OPERATOR_SIGNAL_QWEN_COMPETING_PROJECT_PAUSED_20260830.md`
- Ready restore: `reports/architecture/v4_qwen_local_ready_restore_zero_generation.md`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Post-restore hold: `docs/runtime/QWEN_POST_RESTORE_OCCUPANCY_HOLD.md`
