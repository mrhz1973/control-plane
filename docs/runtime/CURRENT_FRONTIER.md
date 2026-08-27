# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#29** `D-0023-W` — LLM gateway portability adapter + LiteLLM offline/config compatibility; issue **#30 D-0024-W** — controlled OpenClaw-vs-LiteLLM runtime pilot suite **STAGED/AUTHORIZED, prerequisite-gated**; issue **#28 D-0022-W** COMPLETE; issue **#27 D-0021-W** COMPLETE; issue **#26 D-0020-W** COMPLETE; issue **#25 D-0019-W** COMPLETE; issue **#24 D-0018-W** COMPLETE; issue **#23 D-0017-W** COMPLETE; issue **#22 D-0016-W** Phase B authorized but HOME host offline; issue **#8** Z.AI VPS/provider support parallel |
| **BLOCCO ATTIVO** | `LLM-GATEWAY-PORTABILITY-OFFLINE-CONFIG-SPIKE` |
| **STATO BLOCCO** | `D0023_W_READY / D0024_W_STAGED_AUTHORIZED_PREREQUISITE_GATED / D0016_W_PHASE_B_AUTHORIZED_HOME_HOST_OFFLINE / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0023_W_REPO_ONLY` — complete offline/config portability and comparison first; no install, HTTP, provider, credential, n8n, or runtime action in this pass |
| **NEXT** | Work-PC Cursor executes one integrated D-0023-W pass: portability adapter + OpenClaw legacy compatibility + LiteLLM explicit-alias compatibility + sanitized test-only LiteLLM config skeleton + comparison matrix, preserving D-0017→D-0022 regressions. On PASS, D-0024-W runtime pilot may advance only per backend prerequisites. |
| **D-0024-W PILOT AUTHORIZATION** | operator authorized max **1 inference per backend** for GLM Coding Plan, ChatGPT/Codex subscription OAuth, and Qwen 3.8 37B; max **3 total**; `stream=false`; retry `0`; planner fallback `0`; gateway fallback `0`; no architecture/n8n/production switch |
| **D-0024-W PREREQUISITES** | D-0023 PASS; isolated/reversible LiteLLM runtime; exact backend/model alias recorded; local credential/OAuth supplied without chat/GitHub exposure; target host reachable. Qwen pilot additionally requires HOME/local host reachable and exact Qwen 3.8 37B with no 27B substitution. |
| **PARALLEL D-0016-W** | Phase B **AUTHORIZED / NOT EXECUTED** because HOME Windows is offline; when access returns execute only `/v1/responses` enable + managed Gateway repair/start + zero-inference health/metadata verification. This remains useful as OpenClaw comparison/fallback evidence and does not make OpenClaw mandatory. |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE`; support no longer blocks independent Architecture v3 work |
| **VPS OPENCLAW** | existing canonical deployment target remains unchanged during spike · `2026.8.1-beta.3` · gateway inactive · VPS Z.AI diagnosis `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` |
| **WINDOWS OPENCLAW** | fallback-only existing path · `2026.5.20` · configured loopback `127.0.0.1:18789` · Tailscale Serve private · auth token mode · no Funnel/public exposure · Phase A gateway not listening and HTTP planner surface disabled · HOME host offline |
| **GATEWAY PORTABILITY CONTRACT** | GPT-Web-authored `docs/contracts/llm-gateway-portability-v1.md` · supported v1 candidates `openclaw|litellm` · deterministic planner binding required for dispatch readiness |
| **GATEWAY COMPARISON SPIKE** | GPT-Web-authored `docs/contracts/llm-gateway-comparison-spike-v1.md` · offline/config first, then controlled runtime suite; no automatic OpenClaw replacement |
| **GATEWAY PROFILE SCHEMA** | `docs/contracts/llm-gateway-profile-v1.schema.json` · non-secret profile · `/v1/responses` · `explicit_model_alias|gateway_default_unverified` |
| **LITELLM STATUS** | candidate replacement under spike; Responses-compatible proxy/model aliases are target shape; actual GLM Coding Plan, ChatGPT/Codex OAuth and Qwen runtime remain to be proven by D-0024 bounded pilots |
| **D-0016-W PHASE B** | **AUTHORIZED / NOT EXECUTED** · enable only `/v1/responses` + install/repair/start managed Windows Gateway · preserve loopback/token/private Serve/no Funnel · zero inference |
| **D-0016-W PHASE C CONTRACT** | existing OpenClaw-specific consumer remains historical/current compatibility contract; real provider use now additionally subject to gateway portability/planner-binding evidence |
| **D-0017-W VALIDATOR** | COMPLETE · packet schema validator · 5/5 PASS |
| **D-0018-W RESPONSE GATE** | COMPLETE · deterministic OpenClaw planner-response gate · 15/15 PASS |
| **D-0019-W REQUEST BUILDER** | COMPLETE · deterministic non-secret OpenClaw `/v1/responses` builder · 15/15 PASS; may be refactored only if regressions remain green |
| **D-0020-W ROUNDTRIP** | COMPLETE · offline D-0019→D-0018→D-0017 composition · tamper 6/6 · regressions PASS |
| **D-0021-W POLICY GATE** | COMPLETE · `tools/evaluate-execution-packet-policy.mjs` · tests 15/15 PASS |
| **D-0022-W PLANNER SELECTION** | COMPLETE · `tools/evaluate-planner-selection.mjs` · tests 17/17 PASS · selection evidence only, never provider-call authorization |
| **D-0015-W ROUTING** | COMPLETE · WF60 live · WF40 parent resolver lane applied · no generic model invocation |
| **WF40 / WF42 / WF41** | WF40 active with WF60 resolver lane · WF42 active unchanged · WF41 off |
| **HOME EXECUTION SURFACE** | Cursor on HOME Windows for host-local OpenClaw/Qwen work; WORK PC remains repo/Cursor surface and is sufficient for D-0023-W |
| **QWEN ROLE** | Qwen 3.8 37B local for low-cost/simple planning/filter work; no silent 27B substitution |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0023-W is the active pass and is repo-only/offline-config.** It must not install/start LiteLLM or OpenClaw, make HTTP/provider calls, read credentials, mutate n8n/VPS/Tailscale, or dispatch Cursor/Telegram.
- **The earlier standalone D-0023 Cursor prompt is superseded by the integrated prompt issued after this frontier update.** The integrated pass must also create the sanitized test-only LiteLLM config skeleton and OpenClaw-vs-LiteLLM comparison matrix.
- **OpenClaw is not an architectural requirement.** Existing OpenClaw remains intact as comparison/fallback; no uninstall/removal is authorized.
- The legacy `openclaw/default` route remains `PLANNER_BINDING_UNVERIFIED` for real planner dispatch until a machine-verifiable selected-planner binding exists.
- LiteLLM remains the primary replacement candidate because explicit aliases can represent deterministic planner binding behind `/v1/responses`; backend-specific runtime compatibility is not assumed.
- **D-0024-W is operator-authorized but prerequisite-gated:** at most one inference each for GLM Coding Plan, ChatGPT/Codex subscription OAuth and Qwen 3.8 37B; max three total, retry/fallback zero. Failure is evidence and never triggers an automatic retry.
- GLM Coding Plan runtime must use the dedicated coding endpoint `https://api.z.ai/api/coding/paas/v4`; do not silently substitute the General API endpoint.
- Codex pilot must use ChatGPT subscription OAuth/device flow, not an OpenAI Platform API-key fallback.
- Qwen pilot must use exact Qwen 3.8 37B and cannot start while HOME/local host is unreachable.
- **D-0016-W Phase B remains authorized/not executed** because HOME Windows is offline and may later provide OpenClaw comparison/fallback evidence.
- VPS Z.AI `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force while support is pending; D-0024 must not expand that diagnostic track.
- No public exposure, destructive action, permanent LiteLLM deployment, n8n architecture switch, credential persistence, PM-34/L5/endurance/permanent schedule, or automatic gateway promotion is authorized.

## Puntatori

- Active offline/config gateway spike: issue **#29** (`D-0023-W`)
- Staged controlled runtime pilot suite: issue **#30** (`D-0024-W`)
- Gateway comparison spike contract: `docs/contracts/llm-gateway-comparison-spike-v1.md`
- Gateway portability contract: `docs/contracts/llm-gateway-portability-v1.md`
- Gateway profile schema: `docs/contracts/llm-gateway-profile-v1.schema.json`
- Completed planner selection: issue **#28** (`D-0022-W`) · `tools/evaluate-planner-selection.mjs`
- Completed policy gate: issue **#27** (`D-0021-W`) · `tools/evaluate-execution-packet-policy.mjs`
- Completed offline round-trip harness: issue **#26** (`D-0020-W`)
- Completed OpenClaw request builder: issue **#25** (`D-0019-W`)
- Completed response gate: issue **#24** (`D-0018-W`)
- Completed packet validator: issue **#23** (`D-0017-W`)
- Existing Windows OpenClaw pilot/runtime host gate: issue **#22** (`D-0016-W`)
- Parallel provider/VPS track: issue **#8**
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
