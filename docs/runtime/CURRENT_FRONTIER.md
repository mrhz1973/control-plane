# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#24** `D-0018-W` — hard-constraint mapping GPT-Web-authored and implementation delta ready; issue **#23 D-0017-W** COMPLETE; issue **#22 D-0016-W** Phase B authorized but HOME host offline; issue **#8** Z.AI VPS/provider support parallel |
| **BLOCCO ATTIVO** | `D0018-W-HARD-CONSTRAINT-MAPPING-INTEGRATION` |
| **STATO BLOCCO** | `D0018_W_MAPPING_RESOLVED_CONTRACT_DELTA_READY / D0017_W_VALIDATOR_PASS / D0016_W_PHASE_B_AUTHORIZED_HOME_HOST_OFFLINE / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0018_W_REPO_ONLY_MAPPING_INTEGRATION_READY` — prior `HARD_CONSTRAINT_MAPPING_UNDEFINED` gap is resolved by GPT Web at `docs/contracts/execution-packet-hard-constraints-mapping-v1.md`; bounded repo-only incorporation + tests may proceed without HOME host/runtime access |
| **NEXT** | Cursor on WORK PC syncs safely, incorporates the GPT-Web hard-constraints mapping verbatim into the execution-packet contract/schema, OpenClaw consumer contract, D-0017 fixtures/tests and D-0018 response gate/tests; all D-0017 and D-0018 tests must pass locally. HOME Phase B remains separately authorized/not executed while host is offline. |
| **PARALLEL D-0016-W** | Phase B **AUTHORIZED / NOT EXECUTED** because HOME Windows host is offline; when access returns, execute only the already-gated `/v1/responses` enable + managed Gateway repair/start + zero-inference health/metadata verification |
| **PARALLEL ZAI SUPPORT** | issue #8 · escalation already submitted · `AWAITING_ZAI_SUPPORT_RESPONSE`; support no longer blocks independent Architecture v3 work |
| **VPS OPENCLAW** | canonical target primary · `2026.8.1-beta.3` · gateway inactive · Z.AI VPS diagnosis remains `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` |
| **WINDOWS OPENCLAW** | fallback-only · `2026.5.20` · configured `127.0.0.1:18789` · Tailscale Serve `https://asusdesktop.tailc01234.ts.net/` (tailnet only) · auth mode `token` · no Funnel/public exposure · Phase A: gateway process not listening (`ECONNREFUSED`; Scheduled Task missing) · HTTP planner endpoints unset/default-disabled · HOME host currently offline per operator |
| **D-0016-W PHASE A** | PASS · classification `HTTP_PLANNER_SURFACE_DISABLED` · inference requests `0` · secrets not read |
| **D-0016-W PHASE B** | **AUTHORIZED / NOT EXECUTED** · enable only `/v1/responses` surface + install/repair/start managed Windows Gateway · preserve loopback/token/Tailscale-private/no Funnel · zero inference |
| **D-0016-W PHASE C CONTRACT** | GPT-Web-authored `docs/contracts/openclaw-execution-packet-consumer-v1.md` · structured `emit_execution_packet` tool call · deterministic validation against `execution-packet-v1` · pilot max 1 inference / 0 retry / 0 fallback only after later provider-call gate |
| **HARD CONSTRAINT MAPPING** | GPT-Web-authored canonical delta `docs/contracts/execution-packet-hard-constraints-mapping-v1.md` · new required packet field `hard_constraints: string[]` · exact order-sensitive element-for-element mapping · mismatch classification `HARD_CONSTRAINT_MISMATCH` |
| **EXECUTION PACKET MACHINE SCHEMA** | `docs/contracts/execution-packet-v1.schema.json` · JSON Schema 2020-12 mirror; pending incorporation of required `hard_constraints` field under D-0018 integration pass |
| **D-0017-W VALIDATOR** | COMPLETE baseline · `tools/validate-execution-packet-v1.mjs` + local fixtures/tests PASS · issue #23 closed; fixtures must be updated to the new required field during D-0018 integration |
| **D-0018-W RESPONSE GATE** | IMPLEMENTED repo-only baseline · `tools/validate-openclaw-planner-response-gate.mjs` · local tests 10/10 before mapping integration · mapping gap now RESOLVED; integration/tests pending |
| **D-0015-W ROUTING** | COMPLETE · WF60 live id `d0015600-4001-8001-0001-0653506aabcd` · n8n Header Auth metadata id `Qy4tQ7a7ld5loSdV` · WF40 parent resolver lane applied · no generic model invocation |
| **WF40 / WF42 / WF41** | WF40 active with WF60 resolver lane · WF42 active unchanged · WF41 off |
| **HOME EXECUTION SURFACE** | use Cursor already installed on the home Windows host when direct local OpenClaw access is required; work PC remains repo/Cursor surface and does not need OpenClaw installed without a concrete task |
| **QWEN ROLE** | target remains Qwen 3.8 37B local for low-cost/simple planning or filtering work; no silent 27B substitution |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0018-W hard-constraint contract gap RESOLVED by GPT Web:** authoritative delta is `docs/contracts/execution-packet-hard-constraints-mapping-v1.md`. `consumer_input.hard_constraints` maps exactly to required top-level `execution_packet.hard_constraints`; no normalization, deduplication, paraphrase or alternate-field mapping is allowed.
- Cursor may now perform the bounded repo-only integration into `execution-packet-v1.md`, the machine schema, `openclaw-execution-packet-consumer-v1.md`, D-0017 fixtures/tests, and D-0018 gate/tests. Runtime/provider access remains out of scope.
- **D-0016-W Phase B remains explicitly authorized but not executed:** HOME Windows host is offline. When access returns, enable only `gateway.http.endpoints.responses.enabled=true`, install/repair/start the managed Windows Gateway on existing loopback port 18789, preserve `gateway.auth.mode=token`, loopback bind, Tailscale Serve tailnet-only and no Funnel/public exposure.
- The first Phase C provider call is **not authorized yet**. It requires explicit backend planner/model selection and a separate gate capped at one inference request, zero retry and zero fallback.
- The existing n8n Header Auth credential is a Windows Gateway binding for this pilot; do not assume the same credential applies to future VPS canonical primary.
- VPS Z.AI `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force for the VPS diagnosis while support is pending.
- No public listener/port exposure, Funnel, NAT, public reverse proxy, destructive action, VPS Z.AI credential/provider mutation, PM-34/L5/endurance/permanent schedule, scope expansion, or Windows-primary promotion is authorized.

## Puntatori

- Active mapping integration: issue **#24** (`D-0018-W`)
- GPT-Web hard-constraint mapping: `docs/contracts/execution-packet-hard-constraints-mapping-v1.md`
- D-0018 gate: `tools/validate-openclaw-planner-response-gate.mjs` · `tests/openclaw-planner-response-gate/`
- Completed packet-validator baseline: issue **#23** (`D-0017-W`) · `tools/validate-execution-packet-v1.mjs` · `tests/execution-packet-validator/`
- Parallel planner consumer pilot: issue **#22** (`D-0016-W`)
- Concrete OpenClaw planner consumer contract: `docs/contracts/openclaw-execution-packet-consumer-v1.md`
- Machine-readable Execution Packet schema: `docs/contracts/execution-packet-v1.schema.json`
- Parallel provider/VPS track: issue **#8**
- Completed fallback routing: issue **#21** (`D-0015-W`)
- Completed Windows fallback transport: issue **#20** (`D-0014-W`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor packet contract: `docs/contracts/execution-packet-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
