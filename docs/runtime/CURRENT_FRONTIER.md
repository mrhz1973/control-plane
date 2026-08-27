# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** — provider/OpenClaw architecture track, currently support wait; issue **#21 D-0015-W** completed; issue **#20 D-0014-W** PASS |
| **BLOCCO ATTIVO** | `ZAI-PROVIDER-SUPPORT-WAIT` |
| **STATO BLOCCO** | `D0015_W_COMPLETE_ROUTING_INFRASTRUCTURE / WINDOWS_FALLBACK_READY / AUTHENTICATED_CONSUMER_DEFERRED_TO_CONCRETE_WORKSTREAM / AWAITING_ZAI_SUPPORT_RESPONSE` |
| **GATE CORRENTE** | `AWAITING_ZAI_SUPPORT_RESPONSE` — VPS Z.AI remains classified `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT`; no additional one-off provider/model probes authorized while support response is pending |
| **NEXT** | On Z.AI support response: inspect the provider answer, update root-cause classification, and determine the bounded VPS-primary repair/verification step. Any future authenticated OpenClaw invocation must belong to a concrete planner/consumer contract and be GPT-Web-authored; do not add generic model calls to WF40 |
| **PARALLEL ZAI SUPPORT** | issue #8 · sanitized escalation submitted 2026-08-27 to `user_feedback@z.ai` · evidence comment `5431709978` · `AWAITING_ZAI_SUPPORT_RESPONSE` |
| **VPS OPENCLAW** | `2026.8.1-beta.3` (5831b80) · gateway inactive · node runtime `/opt/openclaw-node/current` v24.19.0 |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` · active generation unchanged |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURRENT ZAI PROFILE** | provider `zai` · profile `zai:default` · auth `api_key` · Global Coding Plan base `https://api.z.ai/api/coding/paas/v4` · credential value withheld |
| **LEGACY ZAI PROFILE** | `zai:manual` still present, malformed/unused; removal not authorized |
| **PRIMARY MODEL** | `zai/glm-5.3` · alias `GLM`; allowed models include `openai/gpt-5.6-sol`, `zai/glm-5.3` |
| **LIVE REQUEST LEDGER** | authorized VPS tests: `glm-5.3` Global `1` → HTTP 500; `glm-5.1` Global `1` → HTTP 500; no additional probes authorized merely for fallback validation |
| **CROSS-HOST ASYMMETRY** | Windows residential + same key family/endpoint + `glm-5.1` = SUCCESS; VPS IONOS + same endpoint + `glm-5.1`/`glm-5.3` = HTTP 500 |
| **ROOT CAUSE CLASSIFICATION** | `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT`; provider-side classification pending |
| **WINDOWS FALLBACK TRANSPORT** | issue #20 `D-0014-W` · PASS · OpenClaw `2026.5.20` · `127.0.0.1:18789` · Tailscale Serve `https://asusdesktop.tailc01234.ts.net/` → loopback · no Funnel/public exposure · Windows remains fallback-only |
| **D-0015-W ROUTING** | **COMPLETE** · WF60 live id `d0015600-4001-8001-0001-0653506aabcd` · n8n Header Auth credential metadata id `Qy4tQ7a7ld5loSdV` · WF40 parent resolver lane applied · Execute Workflow node `d0015f40-0060-4001-8001-000000000060` · WF40 active · no provider/model invocation added |
| **WF40 / WF42 / WF41** | WF40 active with WF60 resolver lane · WF42 active unchanged · WF41 off |
| **HOME EXECUTION SURFACE** | when direct Windows OpenClaw host access is needed, prefer Cursor already installed on the home Windows host; work PC remains repo/Cursor surface and does not need another OpenClaw instance without a concrete task |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- **D-0015-W is complete** at the routing-infrastructure layer. WF40→WF60 was applied verbatim from `workflows/patches/d0015-w-wf40-wf60-parent-wiring.gpt-web.json`; existing TRUE/FALSE branches were preserved and WF40 remains active.
- The WF60 resolver selects private broker state only. GPT Web intentionally did **not** add a generic authenticated model invocation because no concrete consumer/prompt/agent contract is defined; doing so would be scope expansion and would create meaningless provider calls on WF40 events.
- Future authenticated OpenClaw HTTP/model invocation must be authored under the specific planner/consumer workstream, fail closed when no broker is healthy, use the existing Header Auth binding without exposing its value, and have an explicit provider-call acceptance/gate.
- `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force for VPS Z.AI diagnosis while awaiting support.
- No public listener/port exposure, Funnel, NAT, public reverse proxy, destructive action, VPS Z.AI credential/provider mutation, PM-34/L5/endurance/permanent schedule, scope expansion, or Windows-primary promotion is authorized.
- Cursor BYOK and OpenClaw Z.AI auth remain separate integrations.

## Puntatori

- Active provider/architecture work: issue **#8**
- Completed fallback routing: issue **#21** (`D-0015-W`)
- Completed Windows fallback transport: issue **#20** (`D-0014-W`)
- Applied GPT-Web parent wiring delta: `workflows/patches/d0015-w-wf40-wf60-parent-wiring.gpt-web.json`
- Post-apply redacted export: `workflows/exports/2026-08-27_40-d0015-w-wf60-parent-wiring-post-apply.redacted.json`
- Windows fallback execution packet: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_EXECUTION_PACKET.yaml`
- Windows fallback status: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_STATUS.md`
- Support submission evidence: issue **#8**, comment `5431709978`
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor packet contract: `docs/contracts/execution-packet-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
