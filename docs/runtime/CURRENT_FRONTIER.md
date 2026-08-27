# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#26** `D-0020-W` — offline planner consumer round-trip harness; issue **#25 D-0019-W** COMPLETE; issue **#24 D-0018-W** COMPLETE; issue **#23 D-0017-W** COMPLETE; issue **#22 D-0016-W** Phase B authorized but HOME host offline; issue **#8** Z.AI VPS/provider support parallel |
| **BLOCCO ATTIVO** | `OFFLINE-PLANNER-CONSUMER-ROUNDTRIP` |
| **STATO BLOCCO** | `D0020_W_REPO_ONLY_IMPLEMENTATION_READY / D0019_W_COMPLETE / D0016_W_PHASE_B_AUTHORIZED_HOME_HOST_OFFLINE / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0020_W_REPO_ONLY_AUTO_ELIGIBLE` — bounded local harness using only synthetic fixtures and existing deterministic tooling; no runtime/provider/credential gate |
| **NEXT** | Cursor on WORK PC syncs to `origin/main`, implements issue #26 round-trip harness, runs D-0020 plus D-0017/D-0018/D-0019 regressions, persists evidence, and stops on any network/runtime/dependency expansion. HOME Phase B remains separately authorized/not executed while host is offline. |
| **PARALLEL D-0016-W** | Phase B **AUTHORIZED / NOT EXECUTED** because HOME Windows host is offline; when access returns, execute only the already-gated `/v1/responses` enable + managed Gateway repair/start + zero-inference health/metadata verification |
| **PARALLEL ZAI SUPPORT** | issue #8 · escalation already submitted · `AWAITING_ZAI_SUPPORT_RESPONSE`; support no longer blocks independent Architecture v3 work |
| **VPS OPENCLAW** | canonical target primary · `2026.8.1-beta.3` · gateway inactive · Z.AI VPS diagnosis remains `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` |
| **WINDOWS OPENCLAW** | fallback-only · `2026.5.20` · configured `127.0.0.1:18789` · Tailscale Serve private · auth mode `token` · no Funnel/public exposure · Phase A gateway not listening and HTTP planner surface disabled · HOME host currently offline |
| **D-0016-W PHASE B** | **AUTHORIZED / NOT EXECUTED** · enable only `/v1/responses` + install/repair/start managed Windows Gateway · preserve loopback/token/private Serve/no Funnel · zero inference |
| **D-0016-W PHASE C CONTRACT** | GPT-Web-authored `docs/contracts/openclaw-execution-packet-consumer-v1.md` · structured `emit_execution_packet` · deterministic validation · first real pilot max 1 inference / 0 retry / 0 fallback only after later explicit gate |
| **D-0017-W VALIDATOR** | COMPLETE · `tools/validate-execution-packet-v1.mjs` · tests 5/5 PASS |
| **D-0018-W RESPONSE GATE** | COMPLETE · `tools/validate-openclaw-planner-response-gate.mjs` · tests 15/15 PASS |
| **D-0019-W REQUEST BUILDER** | COMPLETE · `tools/build-openclaw-responses-request.mjs` · tests 15/15 PASS · no HTTP/secrets |
| **D-0020-W ROUNDTRIP** | ACTIVE · issue #26 · repo-only synthetic end-to-end composition test: consumer_input → request builder → synthetic OpenResponses response → response gate → packet validator |
| **D-0015-W ROUTING** | COMPLETE · WF60 live · WF40 parent resolver lane applied · no generic model invocation |
| **WF40 / WF42 / WF41** | WF40 active with WF60 resolver lane · WF42 active unchanged · WF41 off |
| **HOME EXECUTION SURFACE** | use Cursor on HOME Windows for host-local OpenClaw work; WORK PC remains repo/Cursor surface |
| **QWEN ROLE** | target remains Qwen 3.8 37B local for low-cost/simple planning or filtering work; no silent 27B substitution |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0020-W is active and repo-only:** prove deterministic composition of the complete offline consumer path using synthetic fixtures only. No HTTP, provider, OpenClaw, n8n, VPS, credential or secret access.
- **D-0019-W COMPLETE:** deterministic non-secret `/v1/responses` request builder available offline; input schema validation and canonical packet-tool parameters already tested.
- **D-0018-W COMPLETE:** response gate fail-closed with exact `hard_constraints` equality; D-0017 packet validation remains canonical.
- **D-0016-W Phase B remains explicitly authorized but not executed** solely because HOME Windows is offline.
- **Phase C real provider call remains unauthorized** until HOME Phase B passes, private/auth metadata verifies, backend planner/model is explicit, and operator authorizes exactly one inference with zero retry/fallback.
- Existing Windows n8n Header Auth binding is pilot-specific; do not assume it applies to future VPS primary.
- VPS Z.AI `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force while support is pending.
- No public exposure, destructive action, VPS Z.AI mutation, PM-34/L5/endurance/permanent schedule, or Windows-primary promotion is authorized.

## Puntatori

- Active offline round-trip harness: issue **#26** (`D-0020-W`)
- Completed deterministic request builder: issue **#25** (`D-0019-W`) · `tools/build-openclaw-responses-request.mjs`
- Completed response gate: issue **#24** (`D-0018-W`) · `tools/validate-openclaw-planner-response-gate.mjs`
- Completed packet validator: issue **#23** (`D-0017-W`) · `tools/validate-execution-packet-v1.mjs`
- Planner consumer pilot/runtime host gate: issue **#22** (`D-0016-W`)
- Consumer contract: `docs/contracts/openclaw-execution-packet-consumer-v1.md`
- Consumer input schema: `docs/contracts/openclaw-consumer-input-v1.schema.json`
- Execution Packet schema: `docs/contracts/execution-packet-v1.schema.json`
- Hard-constraint mapping: `docs/contracts/execution-packet-hard-constraints-mapping-v1.md`
- Parallel provider/VPS track: issue **#8**
- Completed fallback routing: issue **#21** (`D-0015-W`)
- Completed Windows fallback transport: issue **#20** (`D-0014-W`)
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
