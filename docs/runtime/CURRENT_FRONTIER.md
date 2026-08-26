# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-CODING-PLAN-POST-REMEDIATION-SMOKE-52` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / ONE_BOUNDED_MODEL_INVOCATION` |
| **GATE CORRENTE** | `GLM_ZAI_CODING_PLAN_POST_REMEDIATION_52_SMOKE_GATE_REQUIRED` |
| **NEXT** | authorize exactly one direct smoke of exact `zai/glm-5.2` through the remediated Coding Plan base endpoint; no retry, no further fallback and no auth/config mutation |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **Z.AI KEY SOURCE** | OPERATOR-CONFIRMED: `Control Plane` key was created under GLM Coding Plan; no secret value persisted |
| **GLM CODING PLAN** | active plan shown valid; key source is Coding Plan rather than general API platform |
| **CODING PLAN BASE ENDPOINT** | `https://api.z.ai/api/coding/paas/v4` configured locally via `models.providers.zai.baseUrl` |
| **GLM 5.3 STATUS** | BLOCKED/deferred · previous request used general API path and returned HTTP 500; no post-remediation retry yet |
| **GLM 5.2 STATUS** | operator-selected current target · exact ref visible · previous general-path smoke returned HTTP 500 · post-remediation smoke not yet authorized |
| **HISTORICAL GENERAL PATH** | `https://api.z.ai/api/paas/v4/chat/completions` |
| **ROOT CAUSE CLASSIFICATION** | endpoint/product binding mismatch remediated locally; provider/model functionality on Coding Plan path remains unverified until separate smoke |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile `zai:manual` preserved · no re-entry during endpoint remediation |
| **GLM QUOTA POLICY** | future issue #19 only · operator reports materially higher GLM token consumption in the morning; future policy must include time-of-day/window-aware routing after measurement; no automatic switching authorized now |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `4` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_CODING_PLAN_ENDPOINT_BINDING_REMEDIATION = PASS`; evidence commit `9874d1391bf1582875785050984081b4214c2713`; baseUrl-only config mutation; zero provider/model requests |
| **PLANNER SMOKE** | Codex PASS · GLM awaiting one 5.2 smoke on Coding Plan path · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Endpoint remediation PASS: installed OpenClaw/Z.AI evidence established general `zai-global` → `https://api.z.ai/api/paas/v4` and Coding Plan Global `zai-coding-global` → `https://api.z.ai/api/coding/paas/v4`; only `models.providers.zai.baseUrl` was changed.
- Existing credential profile `zai:manual` was preserved; no credential re-entry, secret read/change, provider request or model invocation occurred during remediation.
- The operator previously selected GLM 5.2 as the current manual fallback target. Therefore the next runtime action, if authorized, is exactly one bounded smoke of exact `zai/glm-5.2` against the remediated Coding Plan path.
- No model invocation is currently authorized. No retry, second invocation, 5.3/5.1/5 fallback, endpoint/auth/config mutation, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring or billing is authorized before the next gate.
- Issue #19 remains DEFERRED. The operator reports morning GLM token consumption is materially higher; future quota policy must measure consumption by model, workload and time window before defining routing or conservation thresholds. No silent or automatic fallback is active.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
