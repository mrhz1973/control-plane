# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | External single-generation guard READY · fresh one-shot OpenCode live-proof REAUTH_2 **PERSISTED / ACTIVE** |
| **BLOCCO ATTIVO** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2` |
| **STATO BLOCCO** | `SINGLE_GENERATION_GUARD_READY / LIVE_PROOF_REAUTHORIZED_ONE_SHOT / GUARDED_EXECUTION_REQUIRED` |
| **GATE CORRENTE** | **AUTHORIZED ONE-SHOT** by `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2.operator.json`: exactly 1 OpenCode execution + max 1 qwen_local generation, `fast_8k`, DFlash2 required, retry 0, fallback 0. The canonical external guard `tools/opencode-single-generation-guard-v1.mjs` is mandatory and must be the only endpoint seen by OpenCode, preserving `upstream_generation_requests <= 1`. Zero-generation restore of canonical `127.0.0.1:8080` is allowed only after fresh occupancy preflight confirms no competing Qwen workload. No process kill/stop is authorized to free resources. Gate must close immediately after first terminal result. |
| **NEXT** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2` — execute the freshly authorized guarded proof only, using packet `docs/packets/EP-V4-OPENCODE-LIVE-PROOF-REAUTH-002.json`. Before any restore or generation, re-run shared-runtime occupancy preflight. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **SINGLE-GENERATION GUARD** | **READY** · bind `127.0.0.1` only · upstream canonical `http://127.0.0.1:8080` · invariant `upstream_generation_requests <= 1` proven offline |
| **QWEN_LOCAL CONTROL-PLANE ENDPOINT** | readiness must be revalidated in the execution pass; if down, authorized path may restore via canonical launcher only after fresh occupancy check |
| **SHARED-RUNTIME OCCUPANCY** | must be revalidated immediately before restore/generation; active or uncertain competing Qwen workload => STOP and close REAUTH_2 gate without live call |

## Fresh REAUTH_2 anchors

- Fresh AUTH: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2.operator.json`
- Fresh packet: `docs/packets/EP-V4-OPENCODE-LIVE-PROOF-REAUTH-002.json`
- Guard contract: `docs/contracts/opencode-single-generation-guard-v1.md`
- Guard tool: `tools/opencode-single-generation-guard-v1.mjs`
- Guard offline proof: `reports/architecture/v4_opencode_single_generation_guard_offline.md`
- Prior REAUTH AUTH: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH.operator.json` — **spent/non-reusable**
- Historical original AUTH: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json` — **spent/non-reusable**
- Maximum OpenCode executions: **1**
- Maximum qwen_local generations: **1**
- Retry: **0** · fallback: **0**
- No second live call authorized

## Mandatory guard boundary

OpenCode must target only the guard base URL selected on `127.0.0.1:<guard_port>`.

The guard must target only canonical llama.cpp at `http://127.0.0.1:8080` and must prove:

- `generation_budget = 1`;
- first accepted `POST /v1/chat/completions` consumes the slot before forwarding;
- `upstream_generation_requests <= 1` always;
- any later generation attempt is blocked before upstream;
- failure/timeout/disconnect/non-2xx does not refund the slot;
- no request/prompt/response body is persisted;
- alternate generation endpoints fail closed.

Do **not** use OpenCode `steps=1` or `steps=2` as the generation ceiling.

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
- If `QWEN_BUSY_SHARED_RUNTIME` or `QWEN_OCCUPANCY_UNCERTAIN`: STOP, close this REAUTH_2 gate, no generation.
- If idle and `:8080` is down: zero-generation restore is allowed only through the already tested canonical launcher; do not modify runtime parameters.
- Start the canonical guard on loopback only; OpenCode must never point directly at `:8080` in this proof.
- OpenCode proof remains one process / no-tools / no steps-based generation ceiling / max one upstream generation enforced by guard.
- Stop on first terminal result and close gate immediately whether PASS or STOP.
- No second live call, no retry, no fallback.

## Boundaries

- Do not reopen or mutate D-0025 runtime.
- Do not mutate WF40/WF61/n8n/OpenClaw/LiteLLM.
- No GLM/Codex/LiteLLM calls.
- No network-system, credential, secret, or Qwen runtime-parameter mutation.
- Do not kill/stop Blender, MCP, Ollama, proxy, llama-server, Edge, Cursor, OpenCode, or other processes to free resources.
- No destructive action or scope expansion.
- Prior authorizations remain non-reusable.

## Puntatori

- Fresh REAUTH_2 AUTH: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2.operator.json`
- Fresh REAUTH_2 packet: `docs/packets/EP-V4-OPENCODE-LIVE-PROOF-REAUTH-002.json`
- Guard: `tools/opencode-single-generation-guard-v1.mjs`
- Guard contract: `docs/contracts/opencode-single-generation-guard-v1.md`
- Guard proof: `reports/architecture/v4_opencode_single_generation_guard_offline.md`
- Steps diagnosis: `reports/architecture/v4_opencode_steps1_maximum_steps_diagnosis.md`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
