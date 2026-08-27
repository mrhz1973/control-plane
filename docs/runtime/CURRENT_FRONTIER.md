# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#25** `D-0019-W` **COMPLETE**; issue **#24 D-0018-W** COMPLETE; issue **#23 D-0017-W** COMPLETE; issue **#22 D-0016-W** Phase B authorized but HOME host offline; issue **#8** Z.AI VPS/provider support parallel |
| **BLOCCO ATTIVO** | none for D-0019-W |
| **STATO BLOCCO** | `D0019_W_COMPLETE / D0018_W_COMPLETE / D0016_W_PHASE_B_AUTHORIZED_HOME_HOST_OFFLINE / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0019_W_COMPLETE` — deterministic OpenClaw `/v1/responses` request builder implemented and tested; no runtime/provider/credential gate opened |
| **NEXT** | HOME Phase B remains separately authorized/not executed while host is offline. Phase C provider call remains ungated until explicit backend planner/model selection. |
| **PARALLEL D-0016-W** | Phase B **AUTHORIZED / NOT EXECUTED** because HOME Windows host is offline; when access returns, execute only the already-gated `/v1/responses` enable + managed Gateway repair/start + zero-inference health/metadata verification |
| **PARALLEL ZAI SUPPORT** | issue #8 · escalation already submitted · `AWAITING_ZAI_SUPPORT_RESPONSE`; support no longer blocks independent Architecture v3 work |
| **VPS OPENCLAW** | canonical target primary · `2026.8.1-beta.3` · gateway inactive · Z.AI VPS diagnosis remains `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` |
| **WINDOWS OPENCLAW** | fallback-only · `2026.5.20` · configured `127.0.0.1:18789` · Tailscale Serve `https://asusdesktop.tailc01234.ts.net/` (tailnet only) · auth mode `token` · no Funnel/public exposure · Phase A: gateway process not listening (`ECONNREFUSED`; Scheduled Task missing) · HTTP planner endpoints unset/default-disabled · HOME host currently offline per operator |
| **D-0016-W PHASE A** | PASS · classification `HTTP_PLANNER_SURFACE_DISABLED` · inference requests `0` · secrets not read |
| **D-0016-W PHASE B** | **AUTHORIZED / NOT EXECUTED** · enable only `/v1/responses` surface + install/repair/start managed Windows Gateway · preserve loopback/token/Tailscale-private/no Funnel · zero inference |
| **D-0016-W PHASE C CONTRACT** | GPT-Web-authored `docs/contracts/openclaw-execution-packet-consumer-v1.md` · structured `emit_execution_packet` tool call · deterministic validation · pilot max 1 inference / 0 retry / 0 fallback only after later provider-call gate |
| **CONSUMER INPUT MACHINE SCHEMA** | GPT-Web-authored `docs/contracts/openclaw-consumer-input-v1.schema.json` · required bounded task input · additional properties rejected |
| **HARD CONSTRAINT MAPPING** | INCORPORATED · `docs/contracts/execution-packet-hard-constraints-mapping-v1.md` · required packet field `hard_constraints: string[]` · exact order-sensitive element-for-element mapping · mismatch `HARD_CONSTRAINT_MISMATCH` |
| **D-0017-W VALIDATOR** | COMPLETE · `tools/validate-execution-packet-v1.mjs` · local tests 5/5 PASS |
| **D-0018-W RESPONSE GATE** | COMPLETE · `tools/validate-openclaw-planner-response-gate.mjs` · exact deep-array equality · local tests 15/15 PASS · issue #24 closed |
| **D-0019-W REQUEST BUILDER** | COMPLETE · `tools/build-openclaw-responses-request.mjs` · local tests 15/15 PASS · parameters sourced from `execution-packet-v1.schema.json` · no HTTP/secrets |
| **D-0015-W ROUTING** | COMPLETE · WF60 live id `d0015600-4001-8001-0001-0653506aabcd` · n8n Header Auth metadata id `Qy4tQ7a7ld5loSdV` · WF40 parent resolver lane applied · no generic model invocation |
| **WF40 / WF42 / WF41** | WF40 active with WF60 resolver lane · WF42 active unchanged · WF41 off |
| **HOME EXECUTION SURFACE** | use Cursor already installed on HOME Windows for host-local OpenClaw work; WORK PC remains repo/Cursor surface and does not need OpenClaw installed without a concrete task |
| **QWEN ROLE** | target remains Qwen 3.8 37B local for low-cost/simple planning or filtering work; no silent 27B substitution |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0019-W COMPLETE:** deterministic non-secret `/v1/responses` request envelope builder is available offline; consumer_input validated via `openclaw-consumer-input-v1.schema.json`; `emit_execution_packet.parameters` loaded from `execution-packet-v1.schema.json`.
- **D-0018-W COMPLETE:** response gate and packet validation are ready offline; D-0017 5/5 PASS and D-0018 15/15 PASS.
- **D-0016-W Phase B remains explicitly authorized but not executed:** HOME Windows host is offline. When access returns, enable only `gateway.http.endpoints.responses.enabled=true`, install/repair/start managed Windows Gateway on loopback port 18789, preserve auth token mode and private Tailscale Serve, no Funnel/public exposure.
- The first Phase C provider call is **not authorized yet**. It requires explicit backend planner/model selection and a separate gate capped at one inference request, zero retry and zero fallback.
- Existing n8n Header Auth credential is Windows-Gateway-specific for this pilot; do not assume it applies to future VPS primary.
- VPS Z.AI `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force while support is pending.
- No public exposure, destructive action, VPS Z.AI mutation, PM-34/L5/endurance/permanent schedule, or Windows-primary promotion is authorized.

## Puntatori

- Completed deterministic request builder: issue **#25** (`D-0019-W`) · `tools/build-openclaw-responses-request.mjs` · `tests/openclaw-request-builder/`
- Consumer input schema: `docs/contracts/openclaw-consumer-input-v1.schema.json`
- Completed response gate: issue **#24** (`D-0018-W`) · `tools/validate-openclaw-planner-response-gate.mjs`
- Completed packet validator: issue **#23** (`D-0017-W`) · `tools/validate-execution-packet-v1.mjs`
- Planner consumer pilot: issue **#22** (`D-0016-W`)
- Consumer contract: `docs/contracts/openclaw-execution-packet-consumer-v1.md`
- Execution Packet schema: `docs/contracts/execution-packet-v1.schema.json`
- Hard-constraint mapping: `docs/contracts/execution-packet-hard-constraints-mapping-v1.md`
- Parallel provider/VPS track: issue **#8**
- Completed fallback routing: issue **#21** (`D-0015-W`)
- Completed Windows fallback transport: issue **#20** (`D-0014-W`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
