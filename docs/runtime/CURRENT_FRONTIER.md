# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — preflight STOP on involuntary ChatGPT device OAuth during local provider introspection; GLM route discovery partial; inference budget unused; issue **#29 D-0023-W** COMPLETE; Qwen deferred; issue **#22 D-0016-W** Phase B parallel; issue **#8** Z.AI support parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PREFLIGHT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_W_PREFLIGHT_STOP_OAUTH_INVOLUNTARY / LITELLM_1_98_0_INSTALLED_ISOLATED / GLM_ROUTE_PARTIAL / CODEX_SOURCE_CAPABLE_BUT_OAUTH_SIDE_EFFECT / INFERENCE_BUDGET_0_OF_2 / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_PREFLIGHT_STOP_REVIEW` — GPT Web/operator must review involuntary OAuth side-effect and decide safe Codex discovery method before any auth/inference gate |
| **NEXT** | Review STOP evidence: LiteLLM 1.98.0 isolated install PASS; `zai/glm-5.3` resolves but default `api_base` is General `/api/paas/v4` so Coding Plan requires explicit `https://api.z.ai/api/coding/paas/v4`; `chatgpt/` provider+Responses+device OAuth exist in source, but `get_llm_provider(chatgpt/…)` auto-starts device flow — forbid that introspection path. Do not consume inference. Issue #30 remains OPEN. |
| **D-0024-W PILOT AUTHORIZATION** | max **1 GLM + 1 Codex** inference, max **2 total**; unused **0/2**; retry/fallback 0; stream false |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** · no global install · no public bind · proxy not started |
| **GLM ROUTE NOTE** | `zai/glm-5.3` provider-resolvable; package default endpoint General API; Coding Plan endpoint must be forced via config `api_base` |
| **CODEX NOTE** | source capability present; exact model unresolved; involuntary device OAuth aborted; ignore any device code from preflight |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference 0 |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME reachable · not current priority |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` · `NO_MORE_MANUAL_ONE_OFF_PROBES` |
| **LITELLM STATUS** | isolated spike installed; preflight STOP before auth gates |
| **HOME EXECUTION SURFACE** | HOME reachable; current D-0024 preflight executed on WORK PC |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0024 preflight STOP:** ChatGPT device-code OAuth started involuntarily during local `get_llm_provider` introspection of `chatgpt/<model>`. Process killed. Do not complete that device code.
- Future Codex discovery must be source/registry-only until an operator-present OAuth gate is explicitly opened.
- GLM Coding Plan endpoint remains mandatory: `https://api.z.ai/api/coding/paas/v4` (not package default General API).
- Inference budget remains 0/2. No Z.AI call, no Codex call, no Qwen runtime.
- Isolated LiteLLM venv may remain for a later authorized gate; no permanent service/autostart/public bind.
- No n8n/OpenClaw/VPS mutation, no secret persistence to GitHub/chat, no architecture promotion, no PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active runtime preflight/pilot: issue **#30** (`D-0024-W`)
- Preflight contract: `docs/contracts/litellm-runtime-preflight-glm-codex-v1.md`
- Completed portability spike: issue **#29** (`D-0023-W`)
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Comparison matrix: `reports/architecture/openclaw_vs_litellm_spike_matrix.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
