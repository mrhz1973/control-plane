# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | V4 OpenCode live proof **STOPPED** — `QWEN_LOCAL_UNAVAILABLE` |
| **BLOCCO ATTIVO** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF` |
| **STATO BLOCCO** | `D0025_COMPLETE / OPENCODE_DISPATCH_READY / LIVE_PROOF_STOPPED_QWEN_UNAVAILABLE / GATE_CLOSED` |
| **GATE CORRENTE** | V4 live-proof gate **CLOSED** immediately after pre-run STOP. Prior AUTH artifact is historical only — **not reusable**. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_QWEN_LOCAL_READY_RESTORE_ZERO_GENERATION` — first perform mandatory shared-runtime occupancy preflight; only if Qwen is `QWEN_READY_IDLE` or `QWEN_NOT_RUNNING_SAFE_TO_START`, restore/verify llama.cpp DFlash2 `fast_8k` on `127.0.0.1:8080` exposing `qwen38-original-dflash2-8k` with **zero** OpenCode/Qwen generation. If Blender/MCP/Cursor/OpenCode/benchmark inference is active, STOP `QWEN_BUSY_SHARED_RUNTIME`; if occupancy cannot be proven safely, STOP `QWEN_OCCUPANCY_UNCERTAIN`. Then obtain fresh operator authorization before any live OpenCode retry. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **QWEN_LOCAL** | **NOT READY** · last ensure `API_UNREACHABLE` · generation_calls **0**; runtime may be shared with external Blender/MCP/Cursor agentic tests and must be occupancy-checked before any new assignment/start/restart. |

## Live-proof outcome

- One-generation OpenCode config proven offline (`steps=1`, tools deny, title/compaction disabled) — **not executed**.
- Session manager ensure once: `launch_performed=true`, still `API_UNREACHABLE` after ~180s; no listener on `:8080`.
- `opencode_execution_count=0` · `qwen_generation_calls=0` · gate closed.

## Mandatory Qwen shared-runtime occupancy boundary

Canonical standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`.

Before assigning, starting, restarting, or otherwise consuming local Qwen 3.8 27B:

- perform a **read-only** occupancy check for active Qwen/llama-server/Ollama/proxy plus Blender/MCP/Cursor/OpenCode/benchmark activity that can be correlated to Qwen use;
- distinguish `QWEN_READY_IDLE`, `QWEN_BUSY_SHARED_RUNTIME`, `QWEN_OCCUPANCY_UNCERTAIN`, `QWEN_NOT_RUNNING_SAFE_TO_START`;
- never kill or restart Qwen/Ollama/proxy/llama-server/Blender/MCP/Cursor/OpenCode merely to free the runtime;
- active shared workload => do not assign a new Qwen generation;
- uncertain ownership/occupancy => fail closed, no process termination.

## Boundaries

- Do not reuse closed live-proof authorization.
- No second OpenCode call without fresh AUTH after READY.
- No GLM/Codex/LiteLLM/n8n/WF/OpenClaw/network/credential mutation.
- Do not mutate Qwen launcher runtime parameters unless separately authorized.
- Do not terminate Qwen/Ollama/proxy/llama-server or related Blender/MCP/Cursor/OpenCode processes without first establishing ownership/state; this frontier does not authorize process kills.

## Puntatori

- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- STOP report: `reports/architecture/v4_opencode_bounded_live_dispatch_proof.md`
- Checkpoint: `docs/runtime/CHECKPOINT_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.md`
- Historical AUTH (spent/closed): `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json`
