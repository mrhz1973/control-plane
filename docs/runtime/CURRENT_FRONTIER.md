# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — **GLM + Codex priority**, runtime preflight active; issue **#29 D-0023-W** COMPLETE; Qwen runtime deferred; issue **#28–#23** COMPLETE; issue **#22 D-0016-W** Phase B authorized/not executed, HOME host now reachable; issue **#8** Z.AI VPS/provider support parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PREFLIGHT_GLM_CODEX` |
| **STATO BLOCCO** | `D0023_W_COMPLETE / D0024_W_PREFLIGHT_AUTO_ELIGIBLE / D0024_INFERENCE_BUDGET_UNUSED_0_OF_2 / QWEN_RUNTIME_DEFERRED / D0016_W_PHASE_B_AUTHORIZED_HOME_REACHABLE_NOT_EXECUTED / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0024_W_PREFLIGHT_AUTO_ELIGIBLE` — install and inspect an isolated reversible LiteLLM spike runtime on WORK PC with zero provider inference and zero secret/OAuth readout; stop only at real provider-auth gates |
| **NEXT** | WORK-PC Cursor executes `docs/contracts/litellm-runtime-preflight-glm-codex-v1.md`: isolated pinned LiteLLM spike environment, local provider capability/config discovery for GLM + Codex, no inference, no Qwen runtime. HOME repo is available again; D-0016-W Phase B remains parallel and is not prioritized over GLM/Codex. |
| **D-0024-W PILOT AUTHORIZATION** | operator authorizes max **1 GLM inference + 1 Codex OAuth inference**, max **2 total**; `stream=false`; retry `0`; planner fallback `0`; gateway fallback `0`; no architecture/n8n/production switch · **budget unused 0/2** |
| **D-0024 PREFLIGHT CONTRACT** | `docs/contracts/litellm-runtime-preflight-glm-codex-v1.md` · preferred pinned spike package `litellm[proxy]==1.98.0` · isolated user-local venv · local-only package/provider introspection · no provider inference |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · offline alias coverage only · runtime inference `0` · no model load/start/download · no 27B substitution · future explicit resume required |
| **D-0024-W PREREQUISITES** | D-0023 PASS ✓; isolated/reversible LiteLLM runtime; exact GLM/Codex provider/model binding; local credential/OAuth supplied without chat/GitHub exposure; target execution surface reachable. Current runtime prerequisites apply only to GLM + Codex. |
| **PARALLEL D-0016-W** | Phase B **AUTHORIZED / NOT EXECUTED**; HOME Windows is reachable again. OpenClaw remains intact comparison/fallback path and is not the current priority. |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE`; VPS `NO_MORE_MANUAL_ONE_OFF_PROBES` remains active |
| **GATEWAY PORTABILITY** | COMPLETE offline · `tools/build-llm-gateway-request.mjs` · LiteLLM `explicit_model_alias` PASS · OpenClaw legacy `PLANNER_BINDING_UNVERIFIED` |
| **LITELLM TEMPLATE** | `configs/litellm/control-plane-spike.template.yaml` · TEST/SPIKE NOT ACTIVE · current runtime cap GLM+Codex max 2; Qwen offline/static only |
| **COMPARISON MATRIX** | `reports/architecture/openclaw_vs_litellm_spike_matrix.md` · offline/config PASS · runtime priority aligned to GLM+Codex only |
| **LITELLM STATUS** | candidate gateway; offline/config PASS; GLM/Codex runtime not yet proven; Qwen runtime deferred |
| **D-0017 → D-0022** | COMPLETE · regressions PASS after D-0023 |
| **D-0023-W PORTABILITY** | COMPLETE · tests 18/18 PASS · no network/provider/credential access |
| **HOME EXECUTION SURFACE** | HOME Windows is reachable again and repo work can resume there; host-local OpenClaw work remains available, while current GLM/Codex preflight contract is still scoped to WORK PC. |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0023-W COMPLETE:** LiteLLM explicit planner alias binding is proven offline; OpenClaw legacy binding fails closed as `PLANNER_BINDING_UNVERIFIED`.
- **D-0024 preflight is active and AUTO-VIA eligible:** an isolated, reversible LiteLLM environment may be installed on the WORK PC outside the repo. This step consumes **zero** GLM/Codex inference calls and must not expose secrets.
- Preferred pinned spike package: `litellm[proxy]==1.98.0`. If local Python/package compatibility disagrees, STOP with exact evidence; do not silently substitute another version.
- GLM preflight must verify the installed LiteLLM provider route for semantic target GLM 5.3 and preserve the dedicated Coding endpoint `https://api.z.ai/api/coding/paas/v4`. No General API fallback.
- Codex preflight must verify installed `chatgpt/` subscription OAuth/device-flow support for Responses access. Do not use OpenAI Platform API-key fallback.
- Provider authentication is a real human gate: Z.AI key entry and ChatGPT OAuth/device flow must happen locally and no secret/token may enter chat/GitHub.
- Current runtime budget remains unused: GLM 0/1, Codex 0/1, total 0/2, retry/fallback zero.
- **Qwen runtime is deferred and non-blocking**; no load/call/download belongs to the current path.
- HOME Windows is reachable again. D-0016-W Phase B remains authorized/not executed and stays parallel while GLM/Codex are prioritized.
- No public exposure, permanent LiteLLM service, n8n architecture switch, credential persistence, VPS Z.AI diagnostic expansion, PM-34/L5/endurance/permanent schedule, or automatic gateway promotion is authorized.

## Puntatori

- Active runtime preflight/pilot: issue **#30** (`D-0024-W`)
- Preflight contract: `docs/contracts/litellm-runtime-preflight-glm-codex-v1.md`
- Completed portability spike: issue **#29** (`D-0023-W`)
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Comparison matrix: `reports/architecture/openclaw_vs_litellm_spike_matrix.md`
- Gateway contracts: `docs/contracts/llm-gateway-portability-v1.md` · `docs/contracts/llm-gateway-profile-v1.schema.json` · `docs/contracts/llm-gateway-comparison-spike-v1.md`
- Existing Windows OpenClaw pilot/runtime host gate: issue **#22** (`D-0016-W`)
- Parallel provider/VPS track: issue **#8**
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
