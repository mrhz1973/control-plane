# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — bounded runtime pilot executed (2/2 provider attempts); both backends returned provider 400 before `emit_execution_packet`; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_RUNTIME_PILOT_COMPLETE / GLM_PROVIDER_BAD_REQUEST_MESSAGES_ILLEGAL / CODEX_PROVIDER_BAD_REQUEST_INPUT_MUST_BE_LIST / PROVIDER_ATTEMPTS_2_OF_2 / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_PROVIDER_REQUEST_SHAPE_RECOVERY_REQUIRED` — LiteLLM `/v1/responses` envelopes reached providers but both rejected request shape (`ZAI messages illegal`; `ChatGPT Input must be a list`); no packet extracted; no retry/fallback used |
| **NEXT** | GPT Web / operator decide the next authorized recovery for Responses→provider request adaptation (without exceeding spent 2/2 budget). Do not re-call GLM/Codex until a new explicit inference authorization. Issue #30 stays OPEN. |
| **D-0024-W PILOT RESULT** | GLM `HTTP 400` · Codex `HTTP 400` · attempts **2/2** · retry/fallback **0** · Qwen **0** · `stream=false` · no Execution Packet · no Cursor packet execution |
| **D-0024 AUTH STATUS** | custom auth store still the Codex path · tokens not exposed |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` + `https://api.z.ai/api/coding/paas/v4` · 1 attempt · `PROVIDER_BAD_REQUEST_ZAI_MESSAGES_PARAMETER_ILLEGAL` |
| **CODEX ROUTE** | `planner-codex-pilot` → `chatgpt/gpt-5.6-sol` · 1 attempt · `PROVIDER_BAD_REQUEST_CHATGPT_INPUT_MUST_BE_LIST` |
| **PROXY STATUS** | loopback `127.0.0.1:4000` reachable before/after GLM; started by operator PowerShell; not restarted by Cursor |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME legacy Startup `.cmd` removed |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | isolated install PASS · aliases bound · pilot POSTs completed · Fallbacks=None observed |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- Inference budget for this authorized pilot is **spent** (2/2). No additional GLM/Codex/Qwen calls without a new explicit authorization.
- Provider failures were deterministic BadRequest shape errors, not auth-absent and not shared proxy death.
- Host Ajv tooling remains unavailable; that did not cause the provider failures (errors occurred before function_call extraction).
- Do not start/restart proxy from Cursor unless a later contract says so.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no secret persistence, no architecture promotion, no PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
