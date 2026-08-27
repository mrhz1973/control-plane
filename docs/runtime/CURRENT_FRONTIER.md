# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#29** `D-0023-W` **COMPLETE**; issue **#30 D-0024-W** — **STAGED / READY_FOR_RUNTIME_PREREQUISITES** with **GLM + Codex priority**; Qwen runtime deferred; issue **#28–#23** COMPLETE; issue **#22 D-0016-W** Phase B authorized but HOME host offline; issue **#8** Z.AI VPS/provider support parallel |
| **BLOCCO ATTIVO** | none for D-0023-W; D-0024 blocked on GLM/Codex runtime prerequisites |
| **STATO BLOCCO** | `D0023_W_COMPLETE / D0024_W_GLM_CODEX_STAGED_READY_FOR_RUNTIME_PREREQUISITES / QWEN_RUNTIME_DEFERRED / D0016_W_PHASE_B_AUTHORIZED_HOME_HOST_OFFLINE / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0023_W_COMPLETE` — offline/config OpenClaw vs LiteLLM spike PASS; portability adapter + sanitized LiteLLM template + comparison matrix committed; zero inference consumed |
| **NEXT** | Advance D-0024 prerequisites for **GLM and Codex only** (isolated LiteLLM runtime, exact alias, local credential/OAuth, reachable host). Do not install/start LiteLLM in this frontier update. Qwen runtime remains deferred. HOME Phase B remains separately authorized/not executed. |
| **D-0024-W PILOT AUTHORIZATION** | operator currently authorizes max **1 GLM inference + 1 Codex OAuth inference**, max **2 total**; `stream=false`; retry `0`; planner fallback `0`; gateway fallback `0`; no architecture/n8n/production switch · **budget unused 0/2** |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · offline alias coverage only in D-0023 · runtime inference `0` · no model load/start/download · no 27B substitution · future explicit resume required |
| **D-0024-W PREREQUISITES** | D-0023 PASS ✓; isolated/reversible LiteLLM runtime; exact backend/model alias recorded; local credential/OAuth supplied without chat/GitHub exposure; target execution surface reachable. Current runtime prerequisites apply only to GLM + Codex. |
| **PARALLEL D-0016-W** | Phase B **AUTHORIZED / NOT EXECUTED** because HOME Windows is offline; when access returns execute only `/v1/responses` enable + managed Gateway repair/start + zero-inference health/metadata verification. OpenClaw remains intact comparison/fallback path. |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE`; support no longer blocks independent Architecture v3 work |
| **VPS OPENCLAW** | existing canonical deployment target remains unchanged during spike · `2026.8.1-beta.3` · gateway inactive · VPS Z.AI diagnosis `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` |
| **WINDOWS OPENCLAW** | fallback-only existing path · `2026.5.20` · configured loopback `127.0.0.1:18789` · Tailscale Serve private · auth token mode · no Funnel/public exposure · Phase A gateway not listening and HTTP planner surface disabled · HOME host offline |
| **GATEWAY PORTABILITY** | COMPLETE offline · `tools/build-llm-gateway-request.mjs` · LiteLLM `explicit_model_alias` PASS · OpenClaw legacy `PLANNER_BINDING_UNVERIFIED` |
| **LITELLM TEMPLATE** | `configs/litellm/control-plane-spike.template.yaml` · TEST/SPIKE NOT ACTIVE · aliases `planner-*-pilot` · GLM coding endpoint explicit · Codex OAuth placeholder · Qwen 3.8 37B offline-only |
| **COMPARISON MATRIX** | `reports/architecture/openclaw_vs_litellm_spike_matrix.md` · offline/config only |
| **LITELLM STATUS** | candidate gateway; offline/config PASS; GLM/Codex runtime not proven; Qwen runtime deferred |
| **D-0016-W PHASE B** | **AUTHORIZED / NOT EXECUTED** |
| **D-0017 → D-0022** | COMPLETE · regressions PASS after D-0023 |
| **D-0023-W PORTABILITY** | COMPLETE · tests 18/18 PASS · no network/provider/credential access |
| **HOME EXECUTION SURFACE** | Cursor on HOME Windows for host-local OpenClaw/Qwen work; WORK PC remains repo/Cursor surface and is sufficient for GLM/Codex prerequisite work |
| **QWEN ROLE** | Qwen 3.8 37B local remains planner-pool target for later low-cost/simple work; runtime validation deferred; no silent 27B substitution |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0023-W COMPLETE:** offline portability adapter proves LiteLLM explicit alias binding and OpenClaw legacy unverified binding fail-closed. No LiteLLM install/start, no HTTP, no inference.
- **Current runtime priority is GLM + Codex.** D-0024 is limited to one GLM Coding Plan call and one ChatGPT/Codex OAuth call, max two total, retry/fallback zero. Budget unused 0/2.
- **Qwen runtime is deferred and non-blocking**; offline alias/schema coverage in D-0023 does not authorize load/call/download.
- **OpenClaw is not an architectural requirement.** Existing OpenClaw remains intact as comparison/fallback; no uninstall/removal is authorized. Legacy `openclaw/default` remains `PLANNER_BINDING_UNVERIFIED` for real planner dispatch.
- GLM Coding Plan runtime must use `https://api.z.ai/api/coding/paas/v4`; do not silently substitute the General API endpoint.
- Codex pilot must use ChatGPT subscription OAuth/device flow, not an OpenAI Platform API-key fallback.
- **D-0016-W Phase B remains authorized/not executed** because HOME Windows is offline.
- VPS Z.AI `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force while support is pending.
- No public exposure, permanent LiteLLM deployment, n8n architecture switch, credential persistence, PM-34/L5/endurance/permanent schedule, or automatic gateway promotion is authorized.

## Puntatori

- Completed portability spike: issue **#29** (`D-0023-W`) · `tools/build-llm-gateway-request.mjs` · `tests/llm-gateway-portability/`
- Staged GLM+Codex runtime pilot: issue **#30** (`D-0024-W`)
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Comparison matrix: `reports/architecture/openclaw_vs_litellm_spike_matrix.md`
- Contracts: `docs/contracts/llm-gateway-portability-v1.md` · `docs/contracts/llm-gateway-profile-v1.schema.json` · `docs/contracts/llm-gateway-comparison-spike-v1.md`
- Completed planner selection: issue **#28** · `tools/evaluate-planner-selection.mjs`
- Completed policy gate: issue **#27** · `tools/evaluate-execution-packet-policy.mjs`
- Existing Windows OpenClaw pilot/runtime host gate: issue **#22** (`D-0016-W`)
- Parallel provider/VPS track: issue **#8**
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
