# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | Shared Qwen occupancy rechecked after operator pause → **`QWEN_READY_IDLE`**; live proof still needs fresh AUTH |
| **BLOCCO ATTIVO** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH` |
| **STATO BLOCCO** | `QWEN_READY_IDLE / LIVE_PROOF_GATE_CLOSED / AWAITING_FRESH_AUTH` |
| **GATE CORRENTE** | **CLOSED** · do **not** execute live OpenCode proof until fresh operator authorization. Historical live-proof AUTH remains **spent/non-reusable**. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH` — obtain fresh AUTH only; do **not** run proof in the recheck block. Note `:8080` currently down — later authorized path must re-establish Qwen readiness without killing residual idle Blender/proxy/Ollama unless separately authorized. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **QWEN_LOCAL CONTROL-PLANE ENDPOINT** | listener **down** on `127.0.0.1:8080` · model **not** exposed · shared occupancy **idle** (no competing inference) |
| **SHARED-RUNTIME OCCUPANCY** | **`QWEN_READY_IDLE`** — no llama-server; Ollama models_loaded=0; qwen-code/blender-mcp absent; Blender + orphaned proxy CPU-flat |

## Occupancy anchors

- Recheck: `reports/architecture/v4_qwen_shared_runtime_occupancy_recheck_after_pause.md`
- Prior busy diagnosis: `reports/architecture/v4_qwen_shared_runtime_occupancy_diagnosis.md`
- Operator pause signal: `docs/runtime/OPERATOR_SIGNAL_QWEN_COMPETING_PROJECT_PAUSED_20260830.md`
- Constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Sampling: ~32s · 4 snapshots · no rising inference CPU · empty `ollama ps`

## Boundaries

- Do **not** execute OpenCode live proof without fresh AUTH.
- Do **not** reuse spent historical live-proof authorization.
- Do **not** kill/stop residual idle Blender / `ollama_qwen_proxy` / Ollama merely to tidy state.
- Do **not** close Edge merely to free lifecycle-tied WebUI state.
- No network, credential, secret, runtime-parameter, n8n, WF40/WF61, OpenClaw, or D-0025 mutation.

## Puntatori

- Occupancy recheck: `reports/architecture/v4_qwen_shared_runtime_occupancy_recheck_after_pause.md`
- Prior occupancy diagnosis: `reports/architecture/v4_qwen_shared_runtime_occupancy_diagnosis.md`
- Operator pause signal: `docs/runtime/OPERATOR_SIGNAL_QWEN_COMPETING_PROJECT_PAUSED_20260830.md`
- Ready restore: `reports/architecture/v4_qwen_local_ready_restore_zero_generation.md`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
