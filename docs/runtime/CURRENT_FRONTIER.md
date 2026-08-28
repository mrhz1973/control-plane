# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — request-shape recovery offline PASS; original pilot budget spent 2/2; runtime re-pilot not authorized; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_REQUEST_SHAPE_RECOVERY_OFFLINE_PASS / ORIGINAL_PILOT_2_OF_2_SPENT / GLM+CODEX_TRANSFORM_VALIDATED_OFFLINE / RUNTIME_REPILOT_NOT_AUTHORIZED` |
| **GATE CORRENTE** | `D0024_W_RUNTIME_REPILOT_AUTHORIZATION_REQUIRED` — adapter now wraps `consumer_input` in canonical Responses list+`input_text`; offline LiteLLM 1.98.0 transform validation PASS for ZAI and Codex paths; no new inference until explicit operator authorization |
| **NEXT** | GPT Web / operator authorize a new bounded runtime re-pilot (new inference budget) to verify fixed envelope against loopback LiteLLM proxy, or defer. Issue #30 stays OPEN. |
| **D-0024-W PILOT RESULT (ORIGINAL)** | GLM `HTTP 400` messages illegal · Codex `HTTP 400` input must be list · attempts **2/2 spent** · no packet |
| **D-0024 REQUEST SHAPE** | `build-llm-gateway-request.mjs` fixed · old `input=object` → new list user item with `input_text` JSON of consumer_input · regression tests PASS |
| **D-0024 AUTH STATUS** | custom auth store unchanged · tokens not exposed · no OAuth refresh this pass |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` + coding endpoint · offline transform validation PASS |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · offline transform validation PASS |
| **PROXY STATUS** | not contacted this pass · do not restart from Cursor without explicit contract |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | adapter fix offline · transform validated · original pilot budget spent |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- Original D-0024 pilot inference budget remains **spent** (2/2). This pass added **0** provider attempts.
- Request-shape fix is offline only; does not declare runtime PASS or architecture promotion.
- Host Ajv remains unavailable; new zero-dependency shape tests PASS; full adapter Ajv tests still host-blocked.
- Do not call proxy/providers/OAuth/Qwen from Cursor without new explicit authorization.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no secret persistence, no PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Adapter: `tools/build-llm-gateway-request.mjs`
- Shape tests: `tests/llm-gateway-request-shape/run.mjs`
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
