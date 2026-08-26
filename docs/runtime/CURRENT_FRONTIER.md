# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#21** `D-0015-W` — Windows fallback hardening + private n8n routing; issue **#20** fallback transport PASS; issue **#8** parallel provider wait |
| **BLOCCO ATTIVO** | `WINDOWS-FALLBACK-HARDENING-N8N-ROUTING` |
| **STATO BLOCCO** | `OPERATOR_GATE_AUTHORIZED / IMPLEMENTATION_NOT_STARTED / AUTH_BINDING_UNKNOWN` |
| **GATE CORRENTE** | `D0015_W_BOUNDDED_HARDENING_N8N_ROUTING_AUTHORIZED` — proceed without docs-only pause; new real gate only if credential/auth/billing mutation, secret transfer, public exposure, destructive action, VPS Z.AI mutation, unnecessary provider/model probe, PM-34/L5/endurance/permanent schedule, scope expansion, or Windows promotion to primary becomes necessary |
| **NEXT** | Cursor executes bounded inspect → Windows autostart hardening → n8n-container private reachability → existing-auth-binding discovery → GPT-Web-authored fallback routing application where compatible. If actual n8n→OpenClaw invocation requires creating/copying a gateway secret or changing auth mode and no existing safe binding exists, complete non-credential work and STOP at that exact credential gate. |
| **PARALLEL ZAI SUPPORT** | issue #8 · sanitized escalation submitted 2026-08-27 · `AWAITING_ZAI_SUPPORT_RESPONSE`; no additional Z.AI probes authorized merely to validate fallback transport/routing |
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
| **OPERATOR AUTHORIZATION** | issue #8 comments `5429724710`, `5431664542`; issue #20 comment `5431799606` for bounded Windows fallback implementation; issue #21 comment `5431911525` for bounded Windows autostart hardening + private n8n fallback routing |
| **ROOT CAUSE CLASSIFICATION** | `APPLICATION_LAYER_IP_OR_RISK_CONTROL_SUSPECT` (updated 2026-08-26): transport/unauthenticated path eliminated; credential format and model variant eliminated; datacenter egress `217.160.71.145` → authenticated HTTP 500 while residential egress `95.249.154.241` → SUCCESS with same key family; provider-side classification pending |
| **SUPPORT ESCALATION** | `SUBMITTED` on `2026-08-27` via email to `user_feedback@z.ai` · sanitized draft `docs/runtime/ISSUE_8_ZAI_SUPPORT_ESCALATION_DRAFT.md` · submission evidence issue #8 comment `5431709978` · `AWAITING_ZAI_RESPONSE` |
| **WINDOWS FALLBACK TRANSPORT** | issue #20 `D-0014-W` · **PASS** 2026-08-27 · OpenClaw `2026.5.20` · loopback `127.0.0.1:18789` · Tailscale Serve `https://asusdesktop.tailc01234.ts.net/` → loopback gateway · VPS private HTTPS/WSS PASS · no Funnel/public exposure · Windows remains fallback |
| **WINDOWS FALLBACK HARDENING / N8N ROUTING** | issue #21 `D-0015-W` · operator gate authorized · implementation not started · gateway auth mode / existing n8n credential-or-env binding must be discovered read-only before authenticated n8n invocation wiring |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Issue #21 D-0015-W is authorized for bounded non-destructive Windows gateway autostart/service hardening and only the n8n changes necessary to establish private fallback routing over Tailscale. No docs-only pause is required.
- GPT Web remains authoritative author of n8n workflow logic and runtime/UI instructions. Cursor may apply/persist only the supplied workflow logic/artifact/patch; it must not autonomously redesign n8n logic.
- Windows remains fallback-only. Canonical primary target remains OpenClaw on VPS; no promotion is implicit.
- Existing Windows fallback transport is PASS: OpenClaw loopback + Tailscale Serve, VPS HTTPS/WSS private reachability, no Funnel/public exposure.
- Read-only discovery of Windows `gateway.auth.mode` and existence/names of already-configured n8n credential or environment bindings is allowed; secret values must never be displayed, copied, hashed, measured, logged, or persisted.
- If authenticated n8n→OpenClaw invocation requires creating/copying a gateway token/password or changing gateway auth mode and no safe existing binding exists, that is a new real human credential gate. Complete all non-credential hardening, health-routing and private transport validation first, then STOP there.
- Credential repair completed 2026-08-26 via official `zai-coding-global` onboarding; old malformed `zai:manual` remains preserved and unused.
- `NO_MORE_MANUAL_ONE_OFF_PROBES` remains in force for the Z.AI VPS diagnosis while awaiting Z.AI Support; unnecessary provider/model calls are forbidden.
- No public listener/port exposure, Funnel, NAT, public reverse proxy, destructive action, VPS Z.AI credential/provider mutation, PM-34/L5/endurance/permanent schedule, scope expansion, or Windows-primary promotion is authorized.
- Cursor BYOK and OpenClaw Z.AI auth remain logically separate integrations.
- Planner-generated Cursor Execution Packets remain governed by `docs/contracts/execution-packet-v1.md` and `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`.

## Puntatori

- Active hardening/routing work: issue **#21**
- Windows fallback implementation/evidence: issue **#20**
- Windows fallback execution packet: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_EXECUTION_PACKET.yaml`
- Windows fallback status: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_STATUS.md`
- Parallel Z.AI support/evidence: issue **#8**
- Support submission evidence: issue **#8**, comment `5431709978`
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor packet contract: `docs/contracts/execution-packet-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
