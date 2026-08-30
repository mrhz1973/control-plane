# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | OpenCode live-proof REAUTH **STOP** — response invalid (`MAXIMUM STEPS`); gate closed; AUTH spent |
| **BLOCCO ATTIVO** | `V4_OPENCODE_STEPS1_MAXIMUM_STEPS_DIAGNOSIS_ZERO_GENERATION` |
| **STATO BLOCCO** | `LIVE_PROOF_RESPONSE_INVALID / GATE_CLOSED / AUTH_SPENT / ZERO_GENERATION_DIAGNOSIS_NEXT` |
| **GATE CORRENTE** | **CLOSED** · REAUTH AUTH is **spent/non-reusable**. No further live OpenCode/Qwen generation authorized until a later fresh AUTH after zero-generation diagnosis. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_OPENCODE_STEPS1_MAXIMUM_STEPS_DIAGNOSIS_ZERO_GENERATION` — diagnose why OpenCode 1.18.25 with proven `steps=1`/tools-deny emits `MAXIMUM STEPS REACHED` instead of required JSON. No generation. No process kill. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **QWEN_LOCAL CONTROL-PLANE ENDPOINT** | listener **up** on `127.0.0.1:8080` · `qwen38-original-dflash2-8k` exposed · restored via canonical launcher in REAUTH pass |
| **LAST LIVE PROOF** | REAUTH consumed **OPENCODE=1** · **QWEN_GENERATIONS=1** · required `LIVE_DISPATCH_OK` JSON **not** returned |

## Authorization state

- Fresh REAUTH AUTH: **spent / historical / non-reusable**
- Prior non-REAUTH AUTH: remains historical/spent
- No second live call remains authorized

## Boundaries

- Do **not** retry live OpenCode without a new operator AUTH.
- Do **not** kill/stop Qwen/Ollama/proxy/Blender/Edge/Cursor/OpenCode to “fix” the failure.
- Do **not** mutate WF40/WF61/n8n/OpenClaw/LiteLLM/D-0025/network/secrets/Qwen runtime parameters.
- Diagnosis next must remain **zero generation**.

## Puntatori

- REAUTH report: `reports/architecture/v4_opencode_bounded_live_dispatch_proof_reauth.md`
- REAUTH checkpoint: `docs/runtime/CHECKPOINT_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH.md`
- Spent AUTH: `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH.operator.json`
- Shared-runtime constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
