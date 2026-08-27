# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#22** `D-0016-W` — concrete planner consumer pilot via Windows OpenClaw fallback; issue **#8** Z.AI VPS/provider support remains parallel; issue **#21 D-0015-W** complete; issue **#20 D-0014-W** PASS |
| **BLOCCO ATTIVO** | `WINDOWS-OPENCLAW-CONCRETE-PLANNER-CONSUMER` |
| **STATO BLOCCO** | `D0016_W_PHASE_B_AUTHORIZED / HOME_WINDOWS_HOST_OFFLINE / PHASE_C_CONSUMER_CONTRACT_AUTHORED / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0016_W_PHASE_B_HOME_HOST_ACCESS_REQUIRED` — operator authorized enablement of `gateway.http.endpoints.responses.enabled=true` plus managed Windows Gateway install/repair/start, but the HOME Windows host is currently offline and cannot receive the host-local mutation |
| **NEXT** | When HOME Windows host access returns, execute authorized D-0016-W Phase B exactly as gated, then health + metadata-only verification with zero inference. While host is offline, repo-only authoring may continue; GPT-Web consumer contract is already authored at `docs/contracts/openclaw-execution-packet-consumer-v1.md`. Provider/model inference remains unauthorized until a later explicit one-call gate. |
| **PARALLEL ZAI SUPPORT** | issue #8 · escalation already submitted · `AWAITING_ZAI_SUPPORT_RESPONSE`; support no longer blocks independent Architecture v3 work |
| **VPS OPENCLAW** | canonical target primary · `2026.8.1-beta.3` · gateway inactive · Z.AI VPS diagnosis remains `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` |
| **WINDOWS OPENCLAW** | fallback-only · `2026.5.20` · configured `127.0.0.1:18789` · Tailscale Serve `https://asusdesktop.tailc01234.ts.net/` (tailnet only) · auth mode `token` · no Funnel/public exposure · Phase A: gateway process not listening (`ECONNREFUSED`; Scheduled Task missing) · HTTP planner endpoints unset/default-disabled · HOME host currently offline per operator |
| **D-0016-W PHASE A** | PASS · classification `HTTP_PLANNER_SURFACE_DISABLED` · inference requests `0` · secrets not read |
| **D-0016-W PHASE B** | **AUTHORIZED / NOT EXECUTED** · enable only `/v1/responses` surface + install/repair/start managed Windows Gateway · preserve loopback/token/Tailscale-private/no Funnel · zero inference |
| **D-0016-W PHASE C CONTRACT** | GPT-Web-authored `docs/contracts/openclaw-execution-packet-consumer-v1.md` · structured `emit_execution_packet` tool call · deterministic validation against `execution-packet-v1` · pilot max 1 inference / 0 retry / 0 fallback only after later provider-call gate |
| **D-0015-W ROUTING** | COMPLETE · WF60 live id `d0015600-4001-8001-0001-0653506aabcd` · n8n Header Auth metadata id `Qy4tQ7a7ld5loSdV` · WF40 parent resolver lane applied · no generic model invocation |
| **WF40 / WF42 / WF41** | WF40 active with WF60 resolver lane · WF42 active unchanged · WF41 off |
| **HOME EXECUTION SURFACE** | use Cursor already installed on the home Windows host when direct local OpenClaw access is required; work PC remains repo/Cursor surface and does not need OpenClaw installed without a concrete task |
| **QWEN ROLE** | target remains Qwen 3.8 37B local for low-cost/simple planning or filtering work; no silent 27B substitution |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0016-W Phase A complete:** Windows OpenClaw HTTP planner surface is `HTTP_PLANNER_SURFACE_DISABLED` (both endpoint keys unset; `gateway.http` null).
- **D-0016-W Phase B is explicitly authorized but not executed:** enable only `gateway.http.endpoints.responses.enabled=true`, install/repair/start the managed Windows Gateway on existing loopback port 18789, preserve `gateway.auth.mode=token`, loopback bind, Tailscale Serve tailnet-only and no Funnel/public exposure. The HOME Windows host is currently offline, so this host-local mutation is blocked by execution-surface availability, not by missing authorization.
- GPT Web pre-authored the concrete Phase C consumer contract at `docs/contracts/openclaw-execution-packet-consumer-v1.md`: OpenResponses `/v1/responses`, required structured `emit_execution_packet` tool call, deterministic `execution-packet-v1` validation, YAML serialization after validation, and fail-closed behavior before Cursor.
- The first Phase C provider call is **not authorized yet**. It requires explicit backend planner/model selection and a separate gate capped at one inference request, zero retry and zero fallback.
- The existing n8n Header Auth credential is a Windows Gateway binding for this pilot; do not assume the same credential applies to future VPS canonical primary.
- Official OpenClaw docs: enabling the Responses compatibility surface also exposes compatibility endpoints such as `GET /v1/models`; requests run through normal Gateway agent routing and auth.
- VPS Z.AI `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force for the VPS diagnosis while support is pending.
- No public listener/port exposure, Funnel, NAT, public reverse proxy, destructive action, VPS Z.AI credential/provider mutation, PM-34/L5/endurance/permanent schedule, scope expansion, or Windows-primary promotion is authorized.

## Puntatori

- Active planner consumer pilot: issue **#22** (`D-0016-W`)
- Concrete OpenClaw planner consumer contract: `docs/contracts/openclaw-execution-packet-consumer-v1.md`
- Parallel provider/VPS track: issue **#8**
- Completed fallback routing: issue **#21** (`D-0015-W`)
- Completed Windows fallback transport: issue **#20** (`D-0014-W`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor packet contract: `docs/contracts/execution-packet-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
