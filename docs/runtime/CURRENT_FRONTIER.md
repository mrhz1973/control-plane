# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — Codex exact-model discovery STOP reviewed; likely auth-path mismatch identified; issue **#29** COMPLETE; Qwen deferred; issue **#22** Phase B parallel; issue **#8** parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_CODEX_MODEL_DISCOVERY_PATH_MISMATCH_SUSPECT / OAUTH_OPERATOR_FLOW_REPORTED_OK / CUSTOM_CHATGPT_TOKEN_DIR_NOT_YET_CHECKED / ZAI_CODING_CREDENTIAL_OPERATOR_SESSION / INFERENCE_BUDGET_0_OF_2 / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_CHATGPT_CUSTOM_AUTH_PATH_VERIFY_AUTO_ELIGIBLE` — prior Cursor STOP inspected LiteLLM default auth path, while operator OAuth was launched with a custom `CHATGPT_TOKEN_DIR`; verify the custom path metadata-only before concluding auth material is absent |
| **NEXT** | WORK-PC Cursor checks `%LOCALAPPDATA%\ControlPlane\litellm-spike\chatgpt-auth\auth.json` metadata-only. If access-token metadata exists, set non-secret `CHATGPT_TOKEN_DIR`/`CHATGPT_AUTH_FILE` in the discovery process, obtain authenticated Codex model metadata with no inference, intersect with LiteLLM provider resolution, record exact `chatgpt/<model>`, reconcile template, and prepare proxy-start command. No GLM/Codex inference. |
| **D-0024-W PILOT AUTHORIZATION** | max **1 GLM + 1 Codex** inference, max **2 total**; unused **0/2**; retry/fallback `0`; `stream=false` |
| **D-0024 AUTH STATUS** | Z.AI Coding credential is process-local in operator PowerShell · operator OAuth command reported `CHATGPT_OAUTH=OK` · that OAuth process was launched with `CHATGPT_TOKEN_DIR=%LOCALAPPDATA%\ControlPlane\litellm-spike\chatgpt-auth` and `CHATGPT_AUTH_FILE=auth.json` · prior Cursor STOP checked the default `%USERPROFILE%\.config\litellm\chatgpt\auth.json`, so default-path token absence is not binding evidence against the custom store |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** |
| **GLM ROUTE** | `zai/glm-5.3` + `https://api.z.ai/api/coding/paas/v4` · no GLM call |
| **CODEX ROUTE** | exact model **UNRESOLVED** pending custom-auth-path verification + authenticated metadata discovery · no Codex inference |
| **AUTHENTICATOR SOURCE FACT** | LiteLLM Authenticator binds auth storage from process env `CHATGPT_TOKEN_DIR` + `CHATGPT_AUTH_FILE`; successful device flow writes tokens to that bound auth file |
| **MODEL DISCOVERY EVIDENCE** | OpenAI Codex upstream uses authenticated `GET https://chatgpt.com/backend-api/codex/models?client_version=...` for model catalog; metadata discovery is allowed, model inference is not |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME legacy Startup `.cmd` removed |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **LITELLM STATUS** | isolated install PASS · GLM config ready · Codex model binding pending custom auth-store verification |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- The previous `CODEX_EXACT_MODEL_UNRESOLVED` STOP remains valid for the path Cursor actually inspected, but its inference that LiteLLM OAuth material is globally absent is not yet proven because the operator OAuth process used a custom token directory.
- First verify only key names/booleans and file existence/size at `%LOCALAPPDATA%\ControlPlane\litellm-spike\chatgpt-auth\auth.json`; never print token values.
- If that custom auth file has a usable access/refresh token, discovery may bind the same non-secret env path in its process and use authenticated model-catalog metadata only. Do not start a new device flow.
- Authenticated Codex catalog discovery may use the upstream Codex models endpoint only as metadata; no completion/responses/tool call belongs to this step.
- Do not invent `chatgpt/<model>` from registry or Codex CLI cache alone. Require an authenticated model ID plus successful LiteLLM `chatgpt/` provider resolution without inference.
- Do not read/display/persist token values. Do not call Z.AI. Inference remains 0/2.
- Issue #30 remains OPEN. Qwen runtime deferred. No n8n/OpenClaw/VPS mutation, public bind, permanent service, credential persistence to GitHub/chat, architecture promotion, or PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Recovery contract: `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md`
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
