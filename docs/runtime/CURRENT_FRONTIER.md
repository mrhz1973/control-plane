# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | Offline single-generation HTTP guard implemented and proven; live proof awaits fresh human AUTH |
| **BLOCCO ATTIVO** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2` |
| **STATO BLOCCO** | `SINGLE_GENERATION_GUARD_READY / LIVE_PROOF_GATE_CLOSED` |
| **GATE CORRENTE** | **CLOSED** · prior REAUTH AUTH remains **spent/non-reusable**. No live OpenCode/Qwen generation until a **fresh human** authorization for REAUTH_2. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2` — fresh human runtime gate only. Do **not** create AUTH or execute live proof here. Later proof must use tools denied, **no** `steps=1`/`steps=2` as ceiling, external guard as hard max-one generation, and fresh shared-runtime occupancy preflight. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **SINGLE-GENERATION GUARD** | **READY** · `tools/opencode-single-generation-guard-v1.mjs` · bind `127.0.0.1` · `upstream_generation_requests <= 1` proven offline |

## Guard anchors

- Contract: `docs/contracts/opencode-single-generation-guard-v1.md`
- Tool: `tools/opencode-single-generation-guard-v1.mjs`
- Tests: `tests/opencode-single-generation-guard/run.mjs` (16/16 PASS)
- Report: `reports/architecture/v4_opencode_single_generation_guard_offline.md`
- Diagnosis (why guard exists): `reports/architecture/v4_opencode_steps1_maximum_steps_diagnosis.md`

## Boundaries

- Do **not** create or execute live-proof AUTH in this state.
- Do **not** use OpenCode `steps=1` or `steps=2` as the generation ceiling.
- Do **not** kill/stop Qwen/Ollama/proxy/Blender/Edge/Cursor/OpenCode to free resources.
- No WF40/WF61/n8n/OpenClaw/LiteLLM/D-0025/network/secret/Qwen-parameter mutation.

## Puntatori

- Guard offline report: `reports/architecture/v4_opencode_single_generation_guard_offline.md`
- Steps=1 diagnosis: `reports/architecture/v4_opencode_steps1_maximum_steps_diagnosis.md`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
