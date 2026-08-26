# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-CODING-PLAN-HTTP500` |
| **STATO BLOCCO** | `AUTO_VIA / READ_ONLY_DIAGNOSIS_REQUIRED` |
| **GATE CORRENTE** | `GLM_ZAI_CODING_PLAN_HTTP500_READ_ONLY_DIAGNOSIS_AUTO_VIA` |
| **NEXT** | perform one bounded read-only diagnosis of installed OpenClaw/Z.AI docs/source/config to classify why exact `zai/glm-5.2` returns provider HTTP 500 even on the confirmed Coding Plan path; zero provider/model requests and zero mutations |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **Z.AI KEY SOURCE** | OPERATOR-CONFIRMED: `Control Plane` key was created under GLM Coding Plan; no secret value persisted |
| **GLM CODING PLAN** | active plan shown valid; key source is Coding Plan rather than general API platform |
| **CODING PLAN BASE ENDPOINT** | `https://api.z.ai/api/coding/paas/v4` effective before and after latest smoke |
| **GLM 5.3 STATUS** | BLOCKED/deferred · historical general-path smoke HTTP 500; no post-remediation retry |
| **GLM 5.2 STATUS** | BLOCKED · exact ref visible · exactly one post-remediation smoke reached Coding Plan path and returned HTTP 500 |
| **LATEST REQUEST PATH** | `https://api.z.ai/api/coding/paas/v4/chat/completions` |
| **ROOT CAUSE CLASSIFICATION** | endpoint/product binding mismatch is remediated and no longer explains the current failure; remaining class is provider/model-plan/payload compatibility or provider-side service behavior, diagnosis pending |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile `zai:manual` preserved · no re-entry |
| **GLM QUOTA POLICY** | future issue #19 only · operator reports materially higher GLM token consumption in the morning; future policy must include time-of-day/window-aware routing after measurement; no automatic switching authorized now |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `5` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_CODING_PLAN_POST_REMEDIATION_52_SMOKE = BLOCKED`; evidence commit `d204f792208dcb1f23bdfe00b3f5a2fc856f5884`; exactly one invocation; provider HTTP 500 on Coding Plan path |
| **PLANNER SMOKE** | Codex PASS · GLM blocked pending read-only HTTP500 diagnosis · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The authorized post-remediation `zai/glm-5.2` smoke executed exactly once. The effective base endpoint was the intended Coding Plan endpoint before and after the invocation, and the observed request reached `/api/coding/paas/v4/chat/completions`.
- Provider returned HTTP 500 Internal service error. Therefore the previously identified general-vs-Coding endpoint mismatch is no longer sufficient to explain the current blocker.
- No retry, second invocation, GLM 5.3/5.1/5 fallback, auth/config/endpoint mutation, credential refresh/re-entry, Codex/Qwen invocation, gateway/service activation, n8n/Docker/Tailscale mutation or other runtime change occurred in the smoke pass.
- AUTO-VIA allows the next bounded step to be read-only diagnosis only: inspect installed OpenClaw/Z.AI implementation/docs and sanitized effective configuration for model support, Coding Plan entitlement/binding expectations, request/payload compatibility and local error mapping. No provider request or model invocation is permitted by this diagnostic pass.
- Any remediation, model retry, alternate model smoke, credential/auth/config change, provider-side test or runtime activation after diagnosis requires a separately classified gate.
- Issue #19 remains DEFERRED. Morning GLM token-consumption behavior remains a future measurement/routing-policy input, not an active fallback rule.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
