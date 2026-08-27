# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — preflight recovery PASS; stop at human auth gates; issue **#29 D-0023-W** COMPLETE; Qwen deferred; issue **#22 D-0016-W** Phase B parallel, HOME legacy visible-console autostart removed; issue **#8** Z.AI support parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_PREFLIGHT_RECOVERY_PASS_AUTH_GATES_READY / LITELLM_1_98_0_ISOLATED / GLM_CONFIG_ZAI_CODING_READY / CODEX_SOURCE_CAPABLE_MODEL_UNRESOLVED / INFERENCE_BUDGET_0_OF_2 / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_HUMAN_AUTH_GATES` — `LOCAL_ZAI_CODING_CREDENTIAL_ENTRY` then `CHATGPT_SUBSCRIPTION_OAUTH_DEVICE_FLOW_OPERATOR_PRESENT`; no autonomous OAuth/inference |
| **NEXT** | Operator supplies Z.AI Coding Plan credential locally into isolated LiteLLM session (`ZAI_CODING_API_KEY`), then (separately, operator-present) completes ChatGPT subscription device OAuth and records exact `chatgpt/<model>`. Only after both auth prerequisites may the bounded pilot consume at most 1 GLM + 1 Codex inference (budget still 0/2). |
| **D-0024-W PILOT AUTHORIZATION** | max **1 GLM + 1 Codex** inference, max **2 total**; unused **0/2**; retry/fallback `0`; `stream=false` |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** · isolated · no global install/service/public bind |
| **GLM ROUTE** | template `planner-glm-pilot` → `zai/glm-5.3` + `api_base=https://api.z.ai/api/coding/paas/v4` · YAML local validate PASS · no Z.AI call in recovery |
| **CODEX ROUTE** | source/registry-only PASS · `LlmProviders.CHATGPT` · authenticator + Responses present · Codex family in registry · exact model `UNRESOLVED` · no `get_llm_provider(chatgpt/...)` in recovery |
| **REGRESSION HOST NOTE** | WORK-PC Ajv absence = `HOST_TOOLING_AJV_UNAVAILABLE`; not a D-0023 functional regression; no Ajv added to repo |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME reachable · legacy visible-console Startup `.cmd` removed · current gateway session may still listen until next login · next login will not auto-start until managed Gateway Phase B |
| **HOME STARTUP CONSOLE** | COMPLETE · `OPENCLAW_LEGACY_VISIBLE_AUTOSTART_CONFIRMED` · removed only Startup `OpenClaw-Gateway-Autostart.cmd` · OpenClaw install/config preserved · secret exposure false |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` · `NO_MORE_MANUAL_ONE_OFF_PROBES` |
| **LITELLM STATUS** | candidate gateway · offline portability PASS · preflight recovery PASS · auth gates pending · inference unused |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- D-0024 preflight recovery is PASS; issue #30 remains OPEN at human auth gates.
- Do not call `get_llm_provider(chatgpt/...)`, authenticator login helpers, ChatGPT completion/responses, or any path that can emit a device code until the operator-present Codex gate.
- GLM uses `zai/glm-5.3` with explicit Coding Plan endpoint only; no General API fallback; no Z.AI call until authorized pilot.
- Inference budget remains 0/2 until explicit post-auth pilot authorization is exercised.
- HOME nuisance remediation complete: legacy visible-console Startup `.cmd` removed only; no replacement autostart; managed Gateway Phase B remains separate.
- Qwen runtime deferred. No n8n/OpenClaw/VPS mutation, public bind, permanent service, credential persistence to GitHub/chat, architecture promotion, or PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Recovery contract: `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md`
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Completed portability spike: issue **#29** (`D-0023-W`)
- HOME OpenClaw track: issue **#22** (`D-0016-W`)
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
