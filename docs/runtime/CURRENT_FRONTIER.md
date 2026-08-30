# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | OpenCode `steps=1` diagnosed: first iteration is already last-step MAX_STEPS injection → external single-generation guard required |
| **BLOCCO ATTIVO** | `V4_OPENCODE_SINGLE_GENERATION_GUARD_OFFLINE` |
| **STATO BLOCCO** | `STEPS1_DIAGNOSIS_PASS / EXTERNAL_GUARD_REQUIRED / LIVE_PROOF_GATE_CLOSED / AUTH_SPENT` |
| **GATE CORRENTE** | **CLOSED** · prior REAUTH AUTH remains **spent/non-reusable**. No live OpenCode/Qwen generation until a later fresh human AUTH after the offline guard exists. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_OPENCODE_SINGLE_GENERATION_GUARD_OFFLINE` — implement deterministic offline single-generation guard/wrapper. No runtime AUTH. Do **not** use `steps=2` as the generation ceiling. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **DIAGNOSIS** | `steps=1` ⇒ `R++` then `R>=steps` on first loop ⇒ inject `CRITICAL - MAXIMUM STEPS REACHED` assistant prefill into the only model call |

## Key semantics (source-backed)

| steps | max model gens | usable first response | MAX_STEPS inject |
|---|---|---|---|
| omitted | unbounded | yes | no (by default) |
| 1 | 1 | **no** | **on gen #1** |
| 2 | 2 | yes | on gen #2 |

## Boundaries

- Do **not** retry live proof without fresh AUTH **and** the offline guard.
- Do **not** treat `steps=2` as a one-generation solution.
- Do **not** kill/stop Qwen/Ollama/proxy/Blender/Edge/Cursor/OpenCode for this workstream.
- No WF40/WF61/n8n/OpenClaw/LiteLLM/D-0025/network/secret/Qwen-parameter mutation.
- Do **not** install/upgrade OpenCode in the offline guard block unless separately authorized.

## Puntatori

- Diagnosis: `reports/architecture/v4_opencode_steps1_maximum_steps_diagnosis.md`
- Failed REAUTH: `reports/architecture/v4_opencode_bounded_live_dispatch_proof_reauth.md`
- Spent AUTH: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH.operator.json`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
