# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-CODING-PLAN-ENDPOINT-BINDING` |
| **STATO BLOCCO** | `AUTHORIZED / CONFIG_ENDPOINT_REMEDIATION_PENDING` |
| **GATE CORRENTE** | `GLM_ZAI_CODING_PLAN_ENDPOINT_REMEDIATION_AUTHORIZED` |
| **NEXT** | determine the exact official Coding Plan provider/binding/base endpoint from installed OpenClaw/Z.AI evidence; if unique, apply only that minimal binding change using the existing `zai:manual` credential; then local read-only verification; no model retry until a later gate |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **Z.AI KEY SOURCE** | OPERATOR-CONFIRMED: `Control Plane` key was created under GLM Coding Plan; no secret value persisted |
| **GLM CODING PLAN** | active plan shown valid; key source is Coding Plan rather than general API platform |
| **GLM 5.3 STATUS** | BLOCKED/deferred · request used general API path and returned HTTP 500 |
| **GLM 5.2 STATUS** | BLOCKED · exact ref visible · one smoke used same general API path and returned same HTTP 500 |
| **COMMON OBSERVED PATH** | general API `https://api.z.ai/api/paas/v4/chat/completions` |
| **ROOT CAUSE CLASSIFICATION** | product/endpoint binding mismatch strongly supported: Coding Plan credential is being sent through the general API path |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile/provider preserved |
| **GLM QUOTA POLICY** | future issue #19 only · operator reports materially higher GLM token consumption in the morning; future policy must include time-of-day/window-aware routing after measurement; no automatic switching authorized now |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `4` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_52_DIRECT_SMOKE_EXACT = BLOCKED`; evidence commit `1ab838de338e8d6f48ecba60482db9a2e160eceb`; provider HTTP 500 |
| **PLANNER SMOKE** | Codex PASS · GLM blocked pending Coding Plan endpoint remediation · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Operator authorization permits preflight read-only and, only if the installed OpenClaw/Z.AI implementation makes the Coding Plan target unambiguous, the minimum provider/binding/base-endpoint configuration mutation required to use the existing Coding Plan credential.
- No credential refresh/re-entry or API-key replacement is authorized.
- No model invocation, smoke, authenticated provider test, retry, fallback 5.1/5, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring or billing is authorized in this pass.
- After any authorized binding change, only local read-only postchecks are allowed. If the correct Coding Plan binding is not unique or requires broader changes, STOP and classify the next gate.
- Issue #19 remains DEFERRED. The operator reports morning GLM token consumption is materially higher; future quota policy must measure consumption by model, workload and time window before defining routing or conservation thresholds. No silent or automatic fallback is active.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
