# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#22** `D-0016-W` — concrete planner consumer pilot via Windows OpenClaw fallback; issue **#8** Z.AI VPS/provider support remains parallel; issue **#21 D-0015-W** complete; issue **#20 D-0014-W** PASS |
| **BLOCCO ATTIVO** | `WINDOWS-OPENCLAW-CONCRETE-PLANNER-CONSUMER` |
| **STATO BLOCCO** | `D0016_W_PHASE_A_PASS_HTTP_PLANNER_SURFACE_DISABLED / WINDOWS_FALLBACK_READY / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `D0016_W_PHASE_B_EXPLICIT_HTTP_PLANNER_SURFACE_ENABLE_GATE` — Phase A found `/v1/responses` and `/v1/chat/completions` unset/default-disabled; enabling them is a separate operator-authorized config/runtime gate |
| **NEXT** | Explicit operator gate required before any `gateway.http.endpoints.responses` / `chatCompletions` enablement or gateway restart; do not auto-enable. After an authorized enable+listen surface exists, metadata-only `GET /v1/models` may be considered. Provider/model inference remains unauthorized until a later GPT-Web consumer contract + call gate. |
| **PARALLEL ZAI SUPPORT** | issue #8 · escalation already submitted · `AWAITING_ZAI_SUPPORT_RESPONSE`; support no longer blocks independent Architecture v3 work |
| **VPS OPENCLAW** | canonical target primary · `2026.8.1-beta.3` · gateway inactive · Z.AI VPS diagnosis remains `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` |
| **WINDOWS OPENCLAW** | fallback-only · `2026.5.20` · configured `127.0.0.1:18789` · Tailscale Serve `https://asusdesktop.tailc01234.ts.net/` (tailnet only) · auth mode `token` · no Funnel/public exposure · Phase A: gateway process not listening (`ECONNREFUSED`; Scheduled Task missing) · HTTP planner endpoints unset/default-disabled |
| **D-0016-W PHASE A** | PASS · classification `HTTP_PLANNER_SURFACE_DISABLED` · inference requests `0` · secrets not read |
| **D-0015-W ROUTING** | COMPLETE · WF60 live id `d0015600-4001-8001-0001-0653506aabcd` · n8n Header Auth metadata id `Qy4tQ7a7ld5loSdV` · WF40 parent resolver lane applied · no generic model invocation |
| **WF40 / WF42 / WF41** | WF40 active with WF60 resolver lane · WF42 active unchanged · WF41 off |
| **HOME EXECUTION SURFACE** | use Cursor already installed on the home Windows host when direct local OpenClaw access is required; work PC remains repo/Cursor surface and does not need OpenClaw installed without a concrete task |
| **QWEN ROLE** | target remains Qwen 3.8 37B local for low-cost/simple planning or filtering work; no silent 27B substitution |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- **D-0016-W Phase A complete:** Windows OpenClaw HTTP planner surface is `HTTP_PLANNER_SURFACE_DISABLED` (both endpoint keys unset; `gateway.http` null). No autonomous enablement.
- Phase A also observed gateway not listening (`ECONNREFUSED` on `127.0.0.1:18789`; Scheduled Task missing). Restart/start is out of Phase A scope and requires an explicit gate if needed for later phases.
- Official OpenClaw docs: `/v1/responses` and `/v1/chat/completions` are disabled by default; when enabled they share Gateway auth and agent routing. With `gateway.auth.mode=token`, HTTP auth is `Authorization: Bearer <token>`. Treat this as operator-level access and keep it loopback/tailnet/private only.
- Metadata/auth validation such as `GET /v1/models` is allowed only after an OpenAI-compatible HTTP surface is already enabled; do not infer-enable it.
- Enabling `/v1/responses` or `/v1/chat/completions` is a separate config/runtime gate (Phase B).
- Any later actual planner call must have a GPT-Web-authored concrete consumer contract, exactly bounded call count, no implicit retry/fallback, schema validation against `docs/contracts/execution-packet-v1.md`, and explicit provider-call authorization.
- VPS Z.AI `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force for the VPS diagnosis while support is pending.
- No public listener/port exposure, Funnel, NAT, public reverse proxy, destructive action, VPS Z.AI credential/provider mutation, PM-34/L5/endurance/permanent schedule, scope expansion, or Windows-primary promotion is authorized.

## Puntatori

- Active planner consumer pilot: issue **#22** (`D-0016-W`)
- Parallel provider/VPS track: issue **#8**
- Completed fallback routing: issue **#21** (`D-0015-W`)
- Completed Windows fallback transport: issue **#20** (`D-0014-W`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor packet contract: `docs/contracts/execution-packet-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
