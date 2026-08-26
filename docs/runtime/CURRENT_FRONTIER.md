# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-CREDENTIAL-REMEDIATION` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / AUTH_MUTATION` |
| **GATE CORRENTE** | `GLM_ZAI_AUTH_CONFIG_REMEDIATION_GATE_REQUIRED` |
| **NEXT** | bounded repair of the malformed stored Z.AI credential only; do not change endpoint yet and do not invoke any model until credential repair evidence is complete |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 REF** | `zai/glm-5.3` visible |
| **Z.AI AUTH REFRESH** | local save PASS, but stored credential diagnosed malformed by exact double-paste pattern |
| **GLM 5.3 POST-REFRESH SMOKE** | BLOCKED · exactly one post-refresh invocation · provider HTTP 401 · no retry |
| **Z.AI DIAGNOSIS** | PASS · deterministic primary cause: malformed stored credential/double-paste; env overrides absent; secondary endpoint/product factor remains unresolved |
| **Z.AI ENDPOINT FACTOR** | installed docs identify Coding Plan path for GLM 5.3; effective path observed general API; standard-vs-coding key compatibility remains unknown |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `2` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_PROVIDER_AUTH_READ_ONLY_DIAGNOSIS = PASS`; evidence commit `d068941c0caf9157e60739b4de834a85af25f114` |
| **PLANNER SMOKE** | Codex PASS · GLM blocked pending credential remediation · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Read-only diagnosis PASS: no provider request, no model invocation and no mutation occurred.
- Primary local root cause is confirmed: the stored `zai:manual` credential has a structural double-paste duplication and is malformed; this alone explains the HTTP 401.
- Environment overrides `ZAI_API_KEY` and `Z_AI_API_KEY` are absent, so they are not shadowing the refreshed profile.
- A secondary endpoint/product mismatch remains possible: installed docs describe GLM 5.3 as Coding Plan-oriented while the effective request path observed was the general API path. This is not yet proven causal and must not be changed in the same remediation unless separately authorized.
- Next permitted action requires an explicit credential/auth mutation gate: replace the malformed stored credential with one clean operator-entered key via secure interactive entry, then local read-only verification only.
- No model invocation, provider test, endpoint/baseUrl change, fallback GLM, Codex/Qwen invocation, gateway/service activation, core/plugin mutation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring or billing is authorized before that gate.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
