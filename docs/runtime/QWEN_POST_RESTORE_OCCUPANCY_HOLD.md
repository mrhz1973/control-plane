# Qwen post-restore shared-runtime occupancy hold

**Status:** ACTIVE / zero-generation hold  
**Trigger:** operator standing constraint `OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md` plus restore-time observation of a separate Ollama `llama-server` on port `31452` using the same main model blob path while the control-plane DFlash2 server was restored on `127.0.0.1:8080`.

## Decision

The completed restore pass is accepted as a **zero-generation runtime restore**: it performed no process kill and no Qwen/OpenCode generation. However, the restore-time classification `QWEN_NOT_RUNNING_SAFE_TO_START` was only about the canonical `:8080` control-plane endpoint and does **not** prove that the shared Qwen 3.8 27B resource is globally idle.

Because the operator warned that Blender/MCP/Cursor benchmarks may concurrently use Qwen, the next control-plane action is **not** live-proof reauthorization yet. First perform a read-only shared-runtime occupancy diagnosis across the active Ollama/Qwen/llama-server/Blender/MCP/Cursor/OpenCode paths.

Until that diagnosis resolves one of the canonical classifications:

- do not assign a new Qwen generation;
- do not run OpenCode live proof;
- do not kill/restart Qwen, Ollama, proxy, llama-server, Blender/MCP, Cursor, or OpenCode;
- do not close the Edge WebUI launched by the canonical launcher merely to free resources, because the current launcher lifecycle ties that UI to the `:8080` server;
- do not reuse the spent historical live-proof authorization.

## Required next classification

Exactly one of:

- `QWEN_READY_IDLE`
- `QWEN_BUSY_SHARED_RUNTIME`
- `QWEN_OCCUPANCY_UNCERTAIN`

If `QWEN_READY_IDLE`, the following step may return to `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH`.

If BUSY or UNCERTAIN, keep the V4 live-proof gate closed and do not consume Qwen.
