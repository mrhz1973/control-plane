# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — Codex model bound `chatgpt/gpt-5.6-sol`; runtime proxy start ready in operator PowerShell; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_CODEX_MODEL_BOUND / CUSTOM_CHATGPT_AUTH_VERIFIED / TEMPLATE_RECONCILED / PROXY_START_READY_OPERATOR_SHELL / INFERENCE_BUDGET_0_OF_2 / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_OPERATOR_LOOPBACK_PROXY_START_THEN_BOUNDED_PILOT` — operator starts LiteLLM on `127.0.0.1` from the PowerShell session that already holds `ZAI_CODING_API_KEY`, with custom `CHATGPT_TOKEN_DIR`; then bounded pilot max 1 GLM + 1 Codex |
| **NEXT** | Operator runs the prepared proxy-start command in the existing credentialed PowerShell (not Cursor). After loopback proxy is up, execute the already-authorized D-0024 bounded pilot: max 1 non-streaming `/v1/responses` for GLM and 1 for Codex, retry/fallback 0, no Qwen. |
| **D-0024-W PILOT AUTHORIZATION** | max **1 GLM + 1 Codex** inference, max **2 total**; unused **0/2**; retry/fallback `0`; `stream=false` |
| **D-0024 AUTH STATUS** | custom auth store PASS · `%LOCALAPPDATA%\ControlPlane\litellm-spike\chatgpt-auth\auth.json` has access/refresh/account metadata · default `~\.config\litellm\chatgpt` path was the prior false-negative · tokens not exposed |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** |
| **GLM ROUTE** | `planner-glm-pilot` → `zai/glm-5.3` + `https://api.z.ai/api/coding/paas/v4` · no GLM call yet |
| **CODEX ROUTE** | `planner-codex-pilot` → **`chatgpt/gpt-5.6-sol`** · authenticated catalog HTTP 200 · LiteLLM provider resolve PASS · no Codex inference yet |
| **PROXY START** | prepared for operator shell only · bind `127.0.0.1:4000` · config `configs/litellm/control-plane-spike.template.yaml` · requires `CHATGPT_TOKEN_DIR`/`CHATGPT_AUTH_FILE` + existing `ZAI_CODING_API_KEY` |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME legacy Startup `.cmd` removed |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | isolated install PASS · GLM+Codex aliases bound · proxy not started by Cursor · inference unused |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- Custom ChatGPT auth path is canonical for this spike: `%LOCALAPPDATA%\ControlPlane\litellm-spike\chatgpt-auth`.
- Exact Codex pilot model is `chatgpt/gpt-5.6-sol` from authenticated catalog ∩ LiteLLM resolution.
- Do not start proxy from Cursor; operator PowerShell must inherit `ZAI_CODING_API_KEY` and set `CHATGPT_TOKEN_DIR`/`CHATGPT_AUTH_FILE`.
- Bind loopback only. No public/Tailscale/Funnel/service/autostart.
- Inference budget remains 0/2 until the bounded pilot runs. No retry/fallback/Qwen.
- Issue #30 remains OPEN. No n8n/OpenClaw/VPS mutation, no secret persistence, no architecture promotion, no PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Recovery contract: `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
