# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | Guarded OpenCode live proof **PASS** · `LIVE_DISPATCH_OK` · single-generation guard proven live |
| **BLOCCO ATTIVO** | `V4_OPENCODE_EXECUTION_ADAPTER_V1` |
| **STATO BLOCCO** | `OPENCODE_LIVE_DISPATCH_PROOF_PASS / SINGLE_GENERATION_GUARD_PROVEN_LIVE / GATE_CLOSED` |
| **GATE CORRENTE** | **CLOSED** · REAUTH_2 AUTH is **spent/non-reusable**. No further live OpenCode/Qwen generation authorized without a later fresh AUTH. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_OPENCODE_EXECUTION_ADAPTER_V1` — implement the production bounded OpenCode execution adapter behind an explicit runtime authorization boundary. Do **not** implement live proof here. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **SINGLE-GENERATION GUARD** | **PROVEN LIVE** · `upstream_generation_requests=1` · OpenCode targeted guard only · no `steps` ceiling |
| **LAST LIVE PROOF** | REAUTH_2 · OPENCODE=1 · QWEN_GENERATIONS=1 · GUARD_UPSTREAM=1 · `LIVE_DISPATCH_OK` |

## Authorization state

- REAUTH_2 AUTH: **spent / historical / non-reusable**
- Prior REAUTH / original live-proof AUTH: remain spent
- No second live call remains authorized

## Boundaries

- Do **not** retry live OpenCode without a new operator AUTH.
- Production adapter must keep the external guard as the hard max-one generation boundary.
- Do **not** use OpenCode `steps=1`/`steps=2` as the generation ceiling.
- Do **not** kill/stop Qwen/Ollama/proxy/Blender/Edge/Cursor merely to tidy state.
- No WF40/WF61/n8n/OpenClaw/LiteLLM/D-0025/network/secret/Qwen-parameter mutation.

## Puntatori

- REAUTH_2 report: `reports/architecture/v4_opencode_bounded_live_dispatch_proof_reauth_2.md`
- REAUTH_2 checkpoint: `docs/runtime/CHECKPOINT_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2.md`
- Guard offline: `reports/architecture/v4_opencode_single_generation_guard_offline.md`
- Steps=1 diagnosis: `reports/architecture/v4_opencode_steps1_maximum_steps_diagnosis.md`
