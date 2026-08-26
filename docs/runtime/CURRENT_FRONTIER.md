# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#20** `D-0014-W` — Windows OpenClaw private fallback broker **OPERATIONAL**; issue **#8** remains parallel provider wait |
| **BLOCCO ATTIVO** | `WINDOWS-OPENCLAW-FALLBACK-BROKER` |
| **STATO BLOCCO** | `IMPLEMENTATION_PASS / WINDOWS_PRIVATE_FALLBACK_OPERATIONAL / ZAI_SUPPORT_WAIT_PARALLEL` |
| **GATE CORRENTE** | `WINDOWS_FALLBACK_TRANSPORT_PASS — next real gate: production wiring, service hardening, or scope expansion only with new authorization` |
| **NEXT** | keep Windows fallback running privately over Tailscale Serve; use VPS→Windows transport for fallback orchestration when needed; do not promote Windows to canonical primary; do not mutate VPS Z.AI credentials or issue extra Z.AI probes while awaiting issue #8 support response |
| **PARALLEL ZAI SUPPORT** | issue #8 · sanitized escalation submitted 2026-08-27 · `AWAITING_ZAI_SUPPORT_RESPONSE`; no additional Z.AI probes authorized merely to validate fallback transport |
| **VPS OPENCLAW** | `2026.8.1-beta.3` (5831b80) · gateway inactive (unchanged) · node runtime `/opt/openclaw-node/current` v24.19.0 |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` (active generation, unchanged) |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURRENT ZAI PROFILE** | provider `zai` · profile `zai:default` · auth `api_key` · credential in documented `{32-hex}.{16-alnum}` format (metadata-verified, value withheld) |
| **LEGACY ZAI PROFILE** | `zai:manual` still present, nonconforming (len 5, no dot), not reused; removal not authorized by this gate |
| **AUTH PROFILE ORDER** | none (automatic; selection prefers `zai:default`) |
| **CURRENT ZAI BASE URL** | `https://api.z.ai/api/coding/paas/v4` (Global Coding Plan — repaired from CN) |
| **CURRENT API STYLE / ADAPTER** | `openai-completions` |
| **ZAI MODEL CATALOG** | `glm-5.3`, `glm-5.2`, `glm-5-turbo`, `glm-5v-turbo`, `glm-5.1` (+ catalog defaults visible in `models list`) |
| **PRIMARY MODEL** | `zai/glm-5.3` · alias `GLM` · allowed models: `openai/gpt-5.6-sol`, `zai/glm-5.3` |
| **CREDENTIAL REPAIR** | COMPLETE `2026-08-26` · official path `openclaw onboard --auth-choice zai-coding-global` with skip-daemon/channels/skills/hooks/search/bootstrap/ui/health · key entered by operator in interactive terminal only · local validation PASS |
| **REPAIR EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` · provider/model requests during repair+verification: `0` |
| **REGIONAL GLM 5.3 SMOKE** | historical CN: BLOCKED (commit `57534fc5f9787d94a377a6fe901c7123495bd0f5`); current Global repaired surface: ONE live request `2026-08-26T21:43:29Z` → HTTP `500` (412 ms, zero retry/fallback) with documented-format credential — uniform 500 persists |
| **LIVE REQUEST LEDGER** | repair+verify `0`; authorized live tests: `glm-5.3` Global `1` (HTTP 500) + `glm-5.1` Global `1` (HTTP 500) — total this task `2`, each exactly as authorized |
| **CROSS-HOST ASYMMETRY EVIDENCE** | Windows PC + same key family + same endpoint + `glm-5.1` = SUCCESS (local OpenClaw, 2026-08-26); VPS IONOS + same endpoint + both `glm-5.1`/`glm-5.3` = HTTP 500 |
| **OPENCLAW UPSTREAM GLM 5.3 SUPPORT** | merged PR #123523 / issue #123522 confirm first-class GLM 5.3 Coding Plan support |
| **OPERATOR AUTHORIZATION** | 2026-08-26 · issue #8 comment `5429724710` (diagnostic matrix, consumed) · 2026-08-26 in-band gate: credential repair `zai-coding-global` authorized and completed · 2026-08-27 issue #8 comment `5431664542`: sanitized support escalation scope authorized · 2026-08-27 issue #20 comment `5431799606`: bounded Windows fallback implementation authorized after operator explicitly rejected docs-only |
| **ROOT CAUSE CLASSIFICATION** | `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` (updated 2026-08-26): transport/unauthenticated path eliminated (VPS reaches `api.z.ai`, TLS OK, coding prefix returns expected HTTP 401); credential format and model variant eliminated; cross-host asymmetry on **authenticated** requests only — datacenter egress `217.160.71.145` (VPS IONOS) → HTTP 500; residential egress `95.249.154.241` (Windows) → SUCCESS with same key family. Plausible cause: Z.AI application-layer risk control keyed on datacenter/source IP. Historical malformed `zai:manual` remains a real defect (bypassed via `zai:default`) but does not explain authenticated HTTP 500. |
| **SUPPORT ESCALATION** | `SUBMITTED` on `2026-08-27` via email to `user_feedback@z.ai` · sanitized draft `docs/runtime/ISSUE_8_ZAI_SUPPORT_ESCALATION_DRAFT.md` · submission evidence issue #8 comment `5431709978` · `AWAITING_ZAI_RESPONSE` |
| **WINDOWS FALLBACK** | issue #20 `D-0014-W` · **PASS** 2026-08-27 · OpenClaw `2026.5.20` · loopback `127.0.0.1:18789` · Tailscale Serve `https://asusdesktop.tailc01234.ts.net/` → loopback gateway · VPS `ubuntu` private HTTPS/WSS reachability PASS · no Funnel/public exposure · Windows remains fallback |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Operator selected **FALLBACK 1** and bounded implementation completed 2026-08-27 under issue #20 comment `5431799606`. Windows OpenClaw is privately reachable from VPS over Tailscale Serve with loopback bind; no public exposure; no credential/auth/billing mutation; no VPS OpenClaw provider mutation; no extra Z.AI probe for transport validation.
- New human gate remains mandatory for credential/auth/billing mutation or secret extraction, public listener/port exposure/NAT/reverse proxy, destructive action, autonomous n8n workflow authoring by Cursor, VPS OpenClaw credential/provider mutation, promotion of Windows to canonical primary, PM-34/L5/endurance/permanent scheduling, extra Z.AI provider/model probes not needed for transport/health validation, or any scope expansion.
- Canonical primary target remains OpenClaw on VPS; Windows is an operational fallback only.
- Credential repair completed 2026-08-26 via the official `zai-coding-global` onboard path: new profile `zai:default` with documented-format key, baseUrl `https://api.z.ai/api/coding/paas/v4`, primary model `zai/glm-5.3`, alias `GLM`.
- The malformed legacy `zai:manual` profile was preserved (not deleted): credential deletion requires a separate gate. It must not be reused.
- Secret handling: key entered by the operator in an interactive terminal only; never printed, logged, hashed, measured, persisted in GitHub or exposed in-band.
- Unauthenticated egress diagnostic completed 2026-08-26: DNS/TCP/TLS/unauthenticated HTTP path functional from VPS; coding prefix returns HTTP 401 (expected) from both VPS and Windows. Transport layer eliminated as failure cause. Authenticated HTTP 500 remains specific to datacenter egress IP `217.160.71.145`.
- Support escalation draft prepared 2026-08-27 at `docs/runtime/ISSUE_8_ZAI_SUPPORT_ESCALATION_DRAFT.md` and submitted externally the same day under explicit operator authorization. Submission preserved sanitization: no API key, Authorization value, secret-derived data, request body, billing/payment identifiers, or Account ID. Issue #8 comment `5431709978` records sanitized submission evidence.
- `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force for the Z.AI VPS diagnosis while awaiting Z.AI Support classification; fallback transport/health work may proceed independently.
- Cursor BYOK (dashboard key `Cursor`) and OpenClaw Z.AI auth (dashboard key `Control Plane`) remain logically separate integrations.
- Planner-generated Cursor Execution Packets remain governed by `docs/contracts/execution-packet-v1.md` and `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`.
- Issue #8 remains the Z.AI evidence/support track; issue #20 is the active Windows fallback implementation track. Issue #19 remains DEFERRED for production quota-aware policy.

## Puntatori

- Active fallback work: issue **#20**
- Windows fallback backlog: `docs/runtime/BACKLOG_D0014_WINDOWS_OPENCLAW_FALLBACK.md`
- Windows fallback planner brief: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_PLANNER_BRIEF.md`
- Windows fallback packet request: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_EXECUTION_PACKET_REQUEST.md`
- Windows fallback execution packet: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_EXECUTION_PACKET.yaml`
- Windows fallback status: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_STATUS.md`
- Windows fallback implementation authorization: issue **#20**, comment `5431799606`
- Parallel Z.AI support/evidence: issue **#8**
- Support submission evidence: issue **#8**, comment `5431709978`
- Historical autodetect matrix packet: `docs/runtime/ISSUE_8_ZAI_AUTODETECTION_PACKET.yaml`
- Support escalation draft (submitted 2026-08-27): `docs/runtime/ISSUE_8_ZAI_SUPPORT_ESCALATION_DRAFT.md`
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor packet contract: `docs/contracts/execution-packet-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
