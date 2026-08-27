# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#29** `D-0023-W` — LLM gateway portability adapter + LiteLLM offline compatibility; issue **#28 D-0022-W** COMPLETE; issue **#27 D-0021-W** COMPLETE; issue **#26 D-0020-W** COMPLETE; issue **#25 D-0019-W** COMPLETE; issue **#24 D-0018-W** COMPLETE; issue **#23 D-0017-W** COMPLETE; issue **#22 D-0016-W** Phase B authorized but HOME host offline; issue **#8** Z.AI VPS/provider support parallel |
| **BLOCCO ATTIVO** | `LLM-GATEWAY-PORTABILITY-OFFLINE-ADAPTER` |
| **STATO BLOCCO** | `D0023_W_READY / D0022_W_COMPLETE / D0016_W_PHASE_B_AUTHORIZED_HOME_HOST_OFFLINE / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0023_W_REPO_ONLY` — prove offline that planner selection can bind deterministically through a replaceable gateway adapter; no install, HTTP, provider, credential, n8n, or runtime action |
| **NEXT** | Work-PC Cursor implements issue #29 from GPT-Web contracts `llm-gateway-portability-v1.md` + `llm-gateway-profile-v1.schema.json`, preserving all D-0017→D-0022 regressions. OpenClaw legacy profile must fail closed as `PLANNER_BINDING_UNVERIFIED`; synthetic LiteLLM explicit-alias profile must produce a deterministic request-ready envelope without network. |
| **PARALLEL D-0016-W** | Phase B **AUTHORIZED / NOT EXECUTED** because HOME Windows is offline; when access returns execute only `/v1/responses` enable + managed Gateway repair/start + zero-inference health/metadata verification. This host repair remains useful for comparison and does not make OpenClaw mandatory. |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE`; support no longer blocks independent Architecture v3 work |
| **VPS OPENCLAW** | existing canonical deployment target remains unchanged during spike · `2026.8.1-beta.3` · gateway inactive · VPS Z.AI diagnosis `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` |
| **WINDOWS OPENCLAW** | fallback-only existing path · `2026.5.20` · configured loopback `127.0.0.1:18789` · Tailscale Serve private · auth token mode · no Funnel/public exposure · Phase A gateway not listening and HTTP planner surface disabled · HOME host offline |
| **GATEWAY PORTABILITY CONTRACT** | GPT-Web-authored `docs/contracts/llm-gateway-portability-v1.md` · supported v1 candidates `openclaw|litellm` · deterministic planner binding required for dispatch readiness |
| **GATEWAY PROFILE SCHEMA** | `docs/contracts/llm-gateway-profile-v1.schema.json` · non-secret profile · `/v1/responses` · `explicit_model_alias|gateway_default_unverified` |
| **LITELLM STATUS** | candidate replacement under offline compatibility spike only; Responses-compatible proxy/model aliases are the target transport shape; actual Z.AI Coding Plan, ChatGPT/Codex OAuth, Qwen runtime and VPS deployment are NOT yet proven |
| **D-0016-W PHASE B** | **AUTHORIZED / NOT EXECUTED** · enable only `/v1/responses` + install/repair/start managed Windows Gateway · preserve loopback/token/private Serve/no Funnel · zero inference |
| **D-0016-W PHASE C CONTRACT** | existing OpenClaw-specific consumer remains historical/current compatibility contract; first real provider pilot still max 1 inference / 0 retry / 0 fallback only after explicit later gate |
| **D-0017-W VALIDATOR** | COMPLETE · packet schema validator · 5/5 PASS |
| **D-0018-W RESPONSE GATE** | COMPLETE · deterministic OpenClaw planner-response gate · 15/15 PASS |
| **D-0019-W REQUEST BUILDER** | COMPLETE · deterministic non-secret OpenClaw `/v1/responses` builder · 15/15 PASS; may be refactored only if regressions remain green |
| **D-0020-W ROUNDTRIP** | COMPLETE · offline D-0019→D-0018→D-0017 composition · tamper 6/6 · regressions PASS |
| **D-0021-W POLICY GATE** | COMPLETE · `tools/evaluate-execution-packet-policy.mjs` · tests 15/15 PASS |
| **D-0022-W PLANNER SELECTION** | COMPLETE · `tools/evaluate-planner-selection.mjs` · tests 17/17 PASS · selection evidence only, never provider-call authorization |
| **D-0015-W ROUTING** | COMPLETE · WF60 live · WF40 parent resolver lane applied · no generic model invocation |
| **WF40 / WF42 / WF41** | WF40 active with WF60 resolver lane · WF42 active unchanged · WF41 off |
| **HOME EXECUTION SURFACE** | Cursor on HOME Windows for host-local OpenClaw work; WORK PC remains repo/Cursor surface and is sufficient for D-0023-W |
| **QWEN ROLE** | Qwen 3.8 37B local for low-cost/simple planning/filter work; no silent 27B substitution |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0023-W is active repo-only portability work.** It must not install or start LiteLLM/OpenClaw, make HTTP/provider calls, read credentials, mutate n8n/VPS/Tailscale, or dispatch Cursor/Telegram.
- **OpenClaw is no longer treated as an architectural requirement.** The existing OpenClaw path remains available/authorized where already gated, but real planner dispatch must satisfy the new deterministic planner-binding invariant.
- A gateway default route such as the current `openclaw/default` without machine-verifiable selected-planner binding is classified `PLANNER_BINDING_UNVERIFIED` for Phase C readiness.
- LiteLLM is the first replacement candidate because its proxy transport can match the OpenAI Responses shape and named model aliases can represent explicit planner bindings; provider-specific runtime compatibility is a later gated test, not assumed.
- **D-0016-W Phase B remains explicitly authorized but not executed** solely because HOME Windows is offline; it can still be run later as a comparison/fallback repair.
- **Any first real provider call remains unauthorized** until a gateway/runtime candidate passes private/auth metadata checks, selected planner/backend binding is explicit, and the operator authorizes exactly one inference with retry=0/fallback=0.
- VPS Z.AI `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force while support is pending.
- No public exposure, destructive action, credential mutation, PM-34/L5/endurance/permanent schedule, or Windows-primary promotion is authorized.

## Puntatori

- Active gateway portability spike: issue **#29** (`D-0023-W`)
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
