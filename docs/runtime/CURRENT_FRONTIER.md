# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#28** `D-0022-W` ACTIVE; issue **#27 D-0021-W** COMPLETE; issue **#26 D-0020-W** COMPLETE; issue **#25 D-0019-W** COMPLETE; issue **#24 D-0018-W** COMPLETE; issue **#23 D-0017-W** COMPLETE; issue **#22 D-0016-W** Phase B authorized but HOME host offline; issue **#8** Z.AI VPS/provider support parallel |
| **BLOCCO ATTIVO** | none for D-0022-W repo-only implementation |
| **STATO BLOCCO** | `D0022_W_ACTIVE / D0021_W_COMPLETE / D0016_W_PHASE_B_AUTHORIZED_HOME_HOST_OFFLINE / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0022_W_REPO_ONLY_IMPLEMENTATION` — deterministic planner selection evaluator can proceed on WORK PC; no provider/runtime gate opened |
| **NEXT** | Implement/test issue #28 from WORK Cursor. HOME Phase B remains separately authorized/not executed while host is offline. Phase C real provider call remains unauthorized until HOME Phase B PASS + private/auth metadata PASS + explicit pilot backend selection + operator one-inference gate. |
| **PARALLEL D-0016-W** | Phase B **AUTHORIZED / NOT EXECUTED** because HOME Windows is offline; when access returns execute only `/v1/responses` enable + managed Gateway repair/start + zero-inference health/metadata verification |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE`; support no longer blocks independent Architecture v3 work |
| **VPS OPENCLAW** | canonical target primary · `2026.8.1-beta.3` · gateway inactive · VPS Z.AI diagnosis `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` |
| **WINDOWS OPENCLAW** | fallback-only · `2026.5.20` · configured loopback `127.0.0.1:18789` · Tailscale Serve private · auth token mode · no Funnel/public exposure · Phase A gateway not listening and HTTP planner surface disabled · HOME host offline |
| **D-0016-W PHASE B** | **AUTHORIZED / NOT EXECUTED** · enable only `/v1/responses` + install/repair/start managed Windows Gateway · preserve loopback/token/private Serve/no Funnel · zero inference |
| **D-0016-W PHASE C CONTRACT** | GPT-Web-authored OpenClaw planner consumer · structured `emit_execution_packet` · first real pilot max 1 inference / 0 retry / 0 fallback only after later explicit gate |
| **D-0017-W VALIDATOR** | COMPLETE · packet schema validator · 5/5 PASS · schema maxima for loop/review enforced |
| **D-0018-W RESPONSE GATE** | COMPLETE · deterministic OpenClaw planner-response gate · 15/15 PASS |
| **D-0019-W REQUEST BUILDER** | COMPLETE · deterministic non-secret `/v1/responses` request builder · 15/15 PASS |
| **D-0020-W ROUNDTRIP** | COMPLETE · offline D-0019→D-0018→D-0017 composition · tamper 6/6 · regressions PASS |
| **D-0021-W POLICY GATE** | COMPLETE · `tools/evaluate-execution-packet-policy.mjs` · GPT-Web contract applied verbatim · tests 15/15 PASS · `READY_FOR_*` does not bypass policy |
| **D-0022-W PLANNER SELECTION** | ACTIVE · GPT-Web contracts `planner-selection-evaluator-v1.md` + `planner-routing-input-v1.schema.json` authored · implementation pending on WORK Cursor · selection evidence only, never provider-call authorization |
| **D-0015-W ROUTING** | COMPLETE · WF60 live · WF40 parent resolver lane applied · no generic model invocation |
| **WF40 / WF42 / WF41** | WF40 active with WF60 resolver lane · WF42 active unchanged · WF41 off |
| **HOME EXECUTION SURFACE** | Cursor on HOME Windows for host-local OpenClaw work; WORK PC remains repo/Cursor surface |
| **QWEN ROLE** | Qwen 3.8 37B local for low-cost/simple planning/filter work; no silent 27B substitution |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0022-W ACTIVE:** implement deterministic `planner-selection-v1` evaluator from GPT-Web contract; this is routing evidence only and does not authorize inference.
- **D-0021-W COMPLETE:** deterministic policy gate classifies schema-valid packets `PROCEED|GATE|BLOCKED` before any Cursor dispatch; planner status markers cannot self-authorize.
- **D-0020-W COMPLETE:** offline composition of D-0019 → D-0018 → D-0017 proven with synthetic fixtures.
- **D-0016-W Phase B remains explicitly authorized but not executed** solely because HOME Windows is offline.
- **Phase C real provider call remains unauthorized** until HOME Phase B passes, private/auth metadata verifies, backend planner/model is explicit, and operator authorizes exactly one inference with zero retry/fallback.
- Existing Windows n8n Header Auth binding is pilot-specific; do not assume it applies to future VPS primary.
- VPS Z.AI `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force while support is pending.
- No public exposure, destructive action, VPS Z.AI mutation, PM-34/L5/endurance/permanent schedule, Cursor/Telegram dispatch from repo-only tools, or Windows-primary promotion is authorized.

## Puntatori

- Active deterministic planner selection: issue **#28** (`D-0022-W`) · `docs/contracts/planner-selection-evaluator-v1.md` · `docs/contracts/planner-routing-input-v1.schema.json`
- Completed policy gate: issue **#27** (`D-0021-W`) · `tools/evaluate-execution-packet-policy.mjs` · `tests/execution-packet-policy-gate/` · `docs/contracts/execution-packet-policy-gate-v1.md`
- Completed offline round-trip harness: issue **#26** (`D-0020-W`) · `tests/openclaw-consumer-roundtrip/`
- Completed deterministic request builder: issue **#25** (`D-0019-W`) · `tools/build-openclaw-responses-request.mjs`
- Completed response gate: issue **#24** (`D-0018-W`) · `tools/validate-openclaw-planner-response-gate.mjs`
- Completed packet validator: issue **#23** (`D-0017-W`) · `tools/validate-execution-packet-v1.mjs`
- Planner consumer pilot/runtime host gate: issue **#22** (`D-0016-W`)
- Parent planner routing policy: `docs/contracts/planner-routing-policy-v1.md`
- Consumer contract: `docs/contracts/openclaw-execution-packet-consumer-v1.md`
- Consumer input schema: `docs/contracts/openclaw-consumer-input-v1.schema.json`
- Execution Packet schema: `docs/contracts/execution-packet-v1.schema.json`
- Hard-constraint mapping: `docs/contracts/execution-packet-hard-constraints-mapping-v1.md`
- Parallel provider/VPS track: issue **#8**
- Completed fallback routing: issue **#21** (`D-0015-W`)
- Completed Windows fallback transport: issue **#20** (`D-0014-W`)
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
