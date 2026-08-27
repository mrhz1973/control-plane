# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — LiteLLM loopback proxy started from operator credentialed PowerShell; bounded GLM+Codex runtime pilot next; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_CODEX_MODEL_BOUND / CUSTOM_CHATGPT_AUTH_VERIFIED / TEMPLATE_RECONCILED / LOOPBACK_PROXY_RUNNING / INFERENCE_BUDGET_0_OF_2 / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_BOUNDED_RUNTIME_PILOT_AUTO_ELIGIBLE` — LiteLLM startup complete in operator PowerShell; execute max 1 GLM + 1 Codex non-streaming `/v1/responses` attempt, retry/fallback 0, Qwen 0 |
| **NEXT** | WORK-PC Cursor executes the already-authorized D-0024 bounded runtime pilot against `127.0.0.1:4000`: one GLM attempt and one Codex attempt max, persist sanitized response/gate/policy evidence, no retry/fallback/Qwen. |
| **D-0024-W PILOT AUTHORIZATION** | max **1 GLM + 1 Codex** inference, max **2 total**; unused **0/2** before first runtime request; retry/fallback `0`; `stream=false` |
| **D-0024 AUTH STATUS** | custom auth store PASS · `%LOCALAPPDATA%\ControlPlane\litellm-spike\chatgpt-auth\auth.json` has access/refresh/account metadata · default `~\.config\litellm\chatgpt` path was the prior false-negative · tokens not exposed |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` + `https://api.z.ai/api/coding/paas/v4` · no GLM call yet |
| **CODEX ROUTE** | `planner-codex-pilot` → **`chatgpt/gpt-5.6-sol`** · authenticated catalog HTTP 200 · LiteLLM provider resolve PASS · no Codex inference yet |
| **PROXY STATUS** | operator console evidence: LiteLLM config loaded, aliases `planner-qwen-pilot`, `planner-glm-pilot`, `planner-codex-pilot` registered, application startup complete under Uvicorn; intended bind remains `127.0.0.1:4000`; no provider request evidenced by startup logs |
| **PROXY WARNINGS** | LiteLLM cost-map/cache-cost warnings for hashed/internal registrations and `zai/glm-5.3`; classified metadata/cost-accounting only, not routing/provider failure |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME legacy Startup `.cmd` removed |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | isolated install PASS · GLM+Codex aliases bound · loopback proxy startup PASS · inference unused before bounded pilot |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- Custom ChatGPT auth path is canonical for this spike: `%LOCALAPPDATA%\ControlPlane\litellm-spike\chatgpt-auth`.
- Exact Codex pilot model is `chatgpt/gpt-5.6-sol` from authenticated catalog ∩ LiteLLM resolution.
- LiteLLM proxy was started by the operator PowerShell; do not restart it from Cursor unless a later explicit contract says so.
- Bind must remain loopback only. No public/Tailscale/Funnel/service/autostart.
- Startup warnings shown are cost-map/cache-cost metadata warnings only; they do not consume inference and do not authorize retries.
- Inference budget remains 0/2 until the bounded pilot actually sends requests. No retry/fallback/Qwen.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no secret persistence, no architecture promotion, no PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Recovery contract: `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
