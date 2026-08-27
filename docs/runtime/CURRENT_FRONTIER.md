# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — Codex exact-model discovery STOP; LiteLLM ChatGPT auth tokens absent despite OAuth gate claim; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_CODEX_EXACT_MODEL_UNRESOLVED / LITELLM_CHATGPT_AUTH_TOKEN_ABSENT / ZAI_CODING_CREDENTIAL_OPERATOR_SESSION / INFERENCE_BUDGET_0_OF_2 / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_LITELLM_CHATGPT_AUTH_MATERIAL_REQUIRED` — cannot bind `chatgpt/<model>` for LiteLLM pilot until LiteLLM ChatGPT auth store has usable post-OAuth tokens; do not invent model; do not restart device flow from Cursor |
| **NEXT** | Operator/GPT-Web: ensure LiteLLM ChatGPT OAuth material exists at `%USERPROFILE%\.config\litellm\chatgpt\auth.json` (access_token present as metadata-only), without exposing secrets; then re-run exact `chatgpt/<model>` discovery without inference. Codex CLI `gpt-5.6-sol` cache is non-binding for LiteLLM `chatgpt/` route. Inference budget remains 0/2. |
| **D-0024-W PILOT AUTHORIZATION** | max **1 GLM + 1 Codex** inference, max **2 total**; unused **0/2**; retry/fallback `0`; `stream=false` |
| **D-0024 AUTH STATUS** | ZAI Coding credential claimed SET in operator PowerShell · LiteLLM ChatGPT auth.json has **no** access/refresh token (only `device_code_requested_at`) · token values not read |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** |
| **GLM ROUTE** | `zai/glm-5.3` + Coding Plan endpoint · no GLM call |
| **CODEX ROUTE** | exact model **UNRESOLVED** · registry insufficient without LiteLLM ChatGPT auth · no Codex call · no OAuth restart |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME legacy Startup `.cmd` removed |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | isolated install PASS · GLM config ready · Codex model binding blocked on missing LiteLLM ChatGPT auth material |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- STOP: `CODEX_EXACT_MODEL_UNRESOLVED` — LiteLLM ChatGPT auth store lacks access/refresh tokens; authenticated non-inference discovery cannot proceed without calling `get_access_token()` which would start a new device flow.
- Do not invent `chatgpt/<model>` from registry or from Codex CLI cache (`gpt-5.6-sol` is non-binding for LiteLLM `chatgpt/` provider).
- Do not read/display/persist token values. Do not call Z.AI. Inference remains 0/2.
- Template placeholder retained. Proxy start command not prepared.
- Issue #30 remains OPEN.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Recovery contract: `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md`
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
