# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | Shared Qwen occupancy rechecked after operator pause → **`QWEN_READY_IDLE`**; fresh one-shot OpenCode live-proof reauthorization **PERSISTED / ACTIVE** |
| **BLOCCO ATTIVO** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH` |
| **STATO BLOCCO** | `QWEN_READY_IDLE / LIVE_PROOF_REAUTHORIZED_ONE_SHOT / RUNTIME_RESTORE_ALLOWED_ZERO_GENERATION` |
| **GATE CORRENTE** | **AUTHORIZED ONE-SHOT** by `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH.operator.json`: exactly 1 OpenCode execution + max 1 qwen_local generation, `fast_8k`, DFlash2 required, retry 0, fallback 0. Zero-generation restore of canonical `127.0.0.1:8080` is allowed only after fresh occupancy preflight confirms no competing Qwen workload. No process kill/stop is authorized to free resources. Gate must close immediately after first terminal result. |
| **NEXT** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH` — execute the freshly authorized bounded proof only, using packet `docs/packets/EP-V4-OPENCODE-LIVE-PROOF-REAUTH-001.json`. Before any restore or generation, re-run shared-runtime occupancy preflight. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **QWEN_LOCAL CONTROL-PLANE ENDPOINT** | last recheck: listener **down** on `127.0.0.1:8080` · model not exposed · shared occupancy **idle**. Authorized path may restore via canonical launcher after fresh occupancy check. |
| **SHARED-RUNTIME OCCUPANCY** | last verified **`QWEN_READY_IDLE`** — no active competing inference; this must be revalidated immediately before restore/generation. |

## Fresh authorization anchors

- Fresh AUTH: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH.operator.json`
- Fresh packet: `docs/packets/EP-V4-OPENCODE-LIVE-PROOF-REAUTH-001.json`
- Historical prior AUTH: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json` — **spent/non-reusable**
- Maximum OpenCode executions: **1**
- Maximum qwen_local generations: **1**
- Retry: **0** · fallback: **0**
- Runtime restore: zero-generation canonical launcher only, after fresh occupancy preflight
- Forbidden: killing/stopping Blender, MCP, Ollama, proxy, llama-server, or other processes merely to free runtime

## Mandatory Qwen shared-runtime occupancy boundary

Canonical standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`.

Before assigning, starting, restoring, or consuming local Qwen 3.8 27B:

- perform a **read-only** occupancy check for active Qwen/llama-server/Ollama/proxy plus Blender/MCP/Cursor/OpenCode/benchmark activity that can be correlated to Qwen use;
- distinguish `QWEN_READY_IDLE`, `QWEN_BUSY_SHARED_RUNTIME`, `QWEN_OCCUPANCY_UNCERTAIN`, `QWEN_NOT_RUNNING_SAFE_TO_START`;
- never kill or restart Qwen/Ollama/proxy/llama-server/Blender/MCP/Cursor/OpenCode merely to free the runtime;
- active shared workload => do not assign a new Qwen generation;
- uncertain ownership/occupancy => fail closed, no process termination.

## Live-proof safety shape

- Re-run occupancy preflight immediately before any restore and again if state may have changed before generation.
- If `QWEN_BUSY_SHARED_RUNTIME` or `QWEN_OCCUPANCY_UNCERTAIN`: STOP, close this fresh gate, no generation.
- If idle and `:8080` is down: zero-generation restore is allowed only through the already tested canonical launcher; do not modify runtime parameters.
- OpenCode proof remains single-turn / no-tools / one process / one qwen_local generation maximum.
- Stop on first terminal result and close gate immediately whether PASS or STOP.
- No second live call, no retry, no fallback.

## Boundaries

- Do not reopen or mutate D-0025 runtime.
- Do not mutate WF40/WF61/n8n/OpenClaw/LiteLLM.
- No GLM/Codex/LiteLLM calls.
- No network, credential, secret, or Qwen runtime-parameter mutation.
- No destructive action or scope expansion.
- Historical prior AUTH remains non-reusable.

## Puntatori

- Fresh AUTH: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH.operator.json`
- Fresh packet: `docs/packets/EP-V4-OPENCODE-LIVE-PROOF-REAUTH-001.json`
- Occupancy recheck: `reports/architecture/v4_qwen_shared_runtime_occupancy_recheck_after_pause.md`
- Dispatch report: `reports/architecture/v4_opencode_dispatch.md`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
