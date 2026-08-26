# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-POST-REMEDIATION-SMOKE` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / ONE_BOUNDED_MODEL_INVOCATION` |
| **GATE CORRENTE** | `GLM_ZAI_POST_REMEDIATION_SMOKE_GATE_REQUIRED` |
| **NEXT** | authorize exactly one new direct smoke of exact `zai/glm-5.3` to verify provider acceptance after successful local credential repair; no retry, fallback or endpoint change |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 REF** | `zai/glm-5.3` visible |
| **Z.AI CREDENTIAL REMEDIATION** | PASS · stored credential now single/nonduplicated · profile/provider/model ref preserved |
| **Z.AI ENDPOINT FACTOR** | secondary/unresolved: installed docs identify Coding Plan path for GLM 5.3 while effective path observed general API; no endpoint mutation authorized yet |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `2` historical smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_CREDENTIAL_REMEDIATION_DOUBLE_PASTE_FIX = PASS`; evidence commit `91381ae8746fad755f99dea1b00fd1e925803e22` |
| **PLANNER SMOKE** | Codex PASS · GLM post-remediation smoke requires explicit gate · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Credential remediation PASS: malformed double-paste removed; local stored credential is now structurally single/nonduplicated; no provider request or model invocation occurred during repair.
- Local repair does not prove provider acceptance. The next real gate is exactly one post-remediation smoke of exact `zai/glm-5.3`.
- No retry automatico o seconda invocation è autorizzata if the smoke fails or is inconclusive.
- No endpoint/baseUrl/Coding Plan path mutation is authorized before the smoke result. The endpoint factor remains a separate possible cause only if provider acceptance still fails.
- No fallback GLM 5.2/5.1/5 or other models, Codex/Qwen invocation, auth/config/core/plugin mutation, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring, billing or broader runtime activation is authorized.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
