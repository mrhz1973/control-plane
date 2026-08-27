# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — safe preflight recovery active after involuntary ChatGPT device-OAuth STOP; issue **#29 D-0023-W** COMPLETE; Qwen runtime deferred; issue **#22 D-0016-W** Phase B parallel, HOME legacy visible-console autostart removed; issue **#8** Z.AI support parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_PREFLIGHT_RECOVERY_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_W_STOP_REVIEWED / LITELLM_1_98_0_ISOLATED / GLM_ROUTE_RESOLVED_ZAI_WITH_EXPLICIT_CODING_API_BASE / CODEX_SOURCE_CAPABLE_OAUTH_SIDE_EFFECT_KNOWN / RECOVERY_AUTO_ELIGIBLE / INFERENCE_BUDGET_0_OF_2 / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_PREFLIGHT_RECOVERY_AUTO_ELIGIBLE` — complete source-only/config recovery with zero provider inference and no OAuth; then stop at real human auth gates |
| **NEXT** | WORK-PC Cursor applies `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md`: sync, preserve isolated LiteLLM 1.98.0, verify reconciled GLM config `zai/glm-5.3` + explicit Coding Plan endpoint, verify Codex capability source/registry-only, parse config locally, no provider/OAuth call. On PASS stop at Z.AI credential entry and operator-present ChatGPT OAuth gate. |
| **D-0024-W PILOT AUTHORIZATION** | max **1 GLM + 1 Codex** inference, max **2 total**; unused **0/2**; retry/fallback `0`; `stream=false` |
| **D-0024 RECOVERY CONTRACT** | `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md` · forbids `get_llm_provider(chatgpt/...)` before human OAuth gate · config-only/source-only recovery |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv` · Python **3.13.3** · LiteLLM **1.98.0** · isolated · no global install/service/public bind |
| **GLM ROUTE** | installed-package evidence resolves `zai/glm-5.3`; package default is General API; canonical pilot config forces `https://api.z.ai/api/coding/paas/v4` |
| **CODEX ROUTE** | installed source has `chatgpt/`, Responses transformation and device OAuth; exact pilot model unresolved pending operator-present OAuth; pre-gate provider resolution that can auto-start OAuth is forbidden |
| **REGRESSION HOST NOTE** | D-0023 runner on WORK PC could not resolve Ajv draft-2020-12 engine; classify host tooling availability, not D-0023 functional regression; do not add repo dependency solely for this host |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` · no load/start/download |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME reachable · legacy visible-console Startup `.cmd` removed · current gateway session still listening on `127.0.0.1:18789` with `/health` 200 · next login will not auto-start until managed Gateway Phase B is executed |
| **HOME STARTUP CONSOLE** | COMPLETE · `OPENCLAW_LEGACY_VISIBLE_AUTOSTART_CONFIRMED` · removed only `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\OpenClaw-Gateway-Autostart.cmd` · OpenClaw install/config/current running gateway preserved · secret exposure false |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` · VPS `NO_MORE_MANUAL_ONE_OFF_PROBES` |
| **LITELLM STATUS** | candidate gateway · offline portability PASS · isolated 1.98.0 installed · runtime provider inference not yet consumed |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- D-0024 preflight STOP is reviewed; the involuntary device OAuth was aborted and must not be completed.
- Before the explicit operator-present Codex gate, do not call `get_llm_provider()` on `chatgpt/...`, authenticator login helpers, ChatGPT completion/responses, or any path that can emit a device code.
- GLM pilot config is now `zai/glm-5.3` with explicit `api_base=https://api.z.ai/api/coding/paas/v4`; no General API fallback and no Z.AI call during recovery.
- D-0024 inference budget remains 0/2; retry/fallback zero; Qwen runtime deferred.
- Isolated LiteLLM environment may remain; no permanent service/autostart/public bind.
- WORK-PC Ajv unavailability does not authorize adding repo dependencies. If shared JS tooling is untouched, preserve historical D-0023 PASS and validate only modified config locally.
- HOME nuisance remediation is complete: the legacy visible-console Startup `.cmd` was removed only; current gateway session was left running, and no replacement autostart was created. On next HOME login the gateway will remain stopped until separately authorized D-0016-W Phase B installs/repairs the managed Gateway path.
- No n8n/OpenClaw provider/VPS mutation, credential persistence, architecture promotion, PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot/recovery: issue **#30** (`D-0024-W`)
- Recovery contract: `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md`
- Original preflight contract: `docs/contracts/litellm-runtime-preflight-glm-codex-v1.md`
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Completed portability spike: issue **#29** (`D-0023-W`)
- HOME OpenClaw/startup track: issue **#22** (`D-0016-W`)
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
