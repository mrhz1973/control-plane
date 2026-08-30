# Operator constraint — Qwen shared runtime concurrency

**Status:** ACTIVE / standing operator constraint  
**Scope:** any future task that would start, assign, probe for exclusive use, restart, stop, kill, or otherwise consume the local Qwen 3.8 27B runtime or related local inference path.

## Operator instruction

Qwen 3.8 27B local may already be occupied by agentic Blender tests through MCP, Cursor, benchmarks, or another active local inference workload.

Before assigning or starting a new Qwen task, perform a read-only occupancy check and determine whether an inference/benchmark/task is already in progress.

At minimum inspect, without disruption:

- active `llama-server` / Qwen-related processes;
- active Ollama processes if present;
- relevant proxy processes;
- active Cursor/OpenCode/Blender/MCP processes or sessions that can be correlated to Qwen use;
- listener/socket state around the configured Qwen endpoint;
- recent runtime activity sufficient to distinguish READY/idle from BUSY/active inference where deterministically observable.

## Mandatory behavior

- **Do not terminate** Qwen, Ollama, proxy, `llama-server`, Blender/MCP, Cursor, OpenCode, or related processes merely to free the runtime.
- **Do not restart** the Qwen runtime if an existing process may be serving another workload.
- **Do not assume** an existing `llama-server` listener is available for the control-plane task; distinguish `READY_IDLE` from `BUSY_OR_SHARED` when possible.
- If active Qwen/Blender/Cursor/OpenCode inference or benchmark work is detected, treat the local model as temporarily occupied and do not assign a new generation task to it.
- If occupancy cannot be determined safely, fail closed as `QWEN_OCCUPANCY_UNCERTAIN`; do not kill/restart anything.
- Readiness restoration may use the canonical launcher only when no conflicting active workload/process ownership is detected and no process termination is required.

## Canonical classifications

- `QWEN_READY_IDLE` — runtime available for bounded control-plane use.
- `QWEN_BUSY_SHARED_RUNTIME` — active external/parallel inference or benchmark detected; do not assign a new Qwen generation.
- `QWEN_OCCUPANCY_UNCERTAIN` — cannot safely prove idle; do not disrupt processes.
- `QWEN_NOT_RUNNING_SAFE_TO_START` — no conflicting runtime/workload detected; canonical launcher may be used when the current task authorizes start.

This constraint is additive to existing runtime gates, generation budgets, DFlash2 requirements, and no-process-kill boundaries. It does not itself authorize any generation, restart, kill, network mutation, or runtime-parameter change.
