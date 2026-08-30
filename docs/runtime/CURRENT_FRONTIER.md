# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | Shared Qwen occupancy diagnosed **BUSY** — wait for idle; no live OpenCode / no new Qwen generation |
| **BLOCCO ATTIVO** | `V4_QWEN_SHARED_RUNTIME_OCCUPANCY` |
| **STATO BLOCCO** | `QWEN_BUSY_SHARED_RUNTIME / LIVE_PROOF_GATE_CLOSED / WAIT_IDLE` |
| **GATE CORRENTE** | **CLOSED** · do not request live-proof AUTH while busy. Historical live-proof AUTH remains **spent/non-reusable**. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `WAIT_QWEN_SHARED_RUNTIME_IDLE` — do **not** stop/kill Blender/MCP/Ollama/Qwen/Edge/Cursor/OpenCode. When the competing workload ends, re-run read-only occupancy diagnosis. Only if `QWEN_READY_IDLE`, proceed to `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH`. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **QWEN_LOCAL CONTROL-PLANE ENDPOINT** | listener **up** on `127.0.0.1:8080` · `qwen38-original-dflash2-8k` exposed · **not assignable** while shared runtime BUSY |
| **SHARED-RUNTIME OCCUPANCY** | **`QWEN_BUSY_SHARED_RUNTIME`** — Blender + blender-mcp + qwen-code + ollama_qwen_proxy + Ollama `qwen3.8:27b` on `:31452` with active inference evidence |

## Occupancy anchors

- Diagnosis: `reports/architecture/v4_qwen_shared_runtime_occupancy_diagnosis.md`
- Constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Hold: `docs/runtime/QWEN_POST_RESTORE_OCCUPANCY_HOLD.md`
- Sampling: ~32s · Ollama llama-server CPU rising · `ollama ps` shows loaded `qwen3.8:27b`
- `:8080` ESTABLISHED client = Edge WebUI only (not the busy inference consumer)

## Boundaries

- Do **not** kill/stop/restart competing workloads to free Qwen.
- Do **not** assign a new Qwen generation or OpenCode live proof while BUSY.
- Do **not** close Edge WebUI merely to free `:8080` while ownership/lifecycle is tied to the launcher.
- Do **not** reuse spent historical live-proof authorization.

## Puntatori

- Occupancy diagnosis: `reports/architecture/v4_qwen_shared_runtime_occupancy_diagnosis.md`
- Ready restore: `reports/architecture/v4_qwen_local_ready_restore_zero_generation.md`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Post-restore hold: `docs/runtime/QWEN_POST_RESTORE_OCCUPANCY_HOLD.md`
