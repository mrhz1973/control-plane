# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-PROVIDER-ACCOUNT-PLAN-SERVICE-BLOCKER` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / PROVIDER_ACCOUNT_PLAN_SUPPORT` |
| **GATE CORRENTE** | `GLM_ZAI_PROVIDER_ACCOUNT_PLAN_SUPPORT_GATE_REQUIRED` |
| **NEXT** | stop local remediation/model attempts; perform provider/account-plan-side verification with Z.AI using the persisted sanitized evidence package before any further GLM invocation |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **Z.AI KEY SOURCE** | OPERATOR-CONFIRMED: `Control Plane` key was created under GLM Coding Plan; no secret value persisted |
| **GLM CODING PLAN** | active plan shown valid; key source is Coding Plan rather than general API platform |
| **CODING PLAN BASE ENDPOINT** | `https://api.z.ai/api/coding/paas/v4` effective |
| **GLM 5.3 STATUS** | BLOCKED · exact Coding Plan default tested once on correct Coding Plan path · HTTP 500 |
| **GLM 5.2 STATUS** | BLOCKED · exact ref tested once on correct Coding Plan path · HTTP 500 |
| **GLM 5.2 CODING BEHAVIOR** | installed docs state Coding Plan requests for `glm-5.2` (and `glm-5.1`) are currently routed by Z.AI to `glm-5.3`; therefore selecting 5.2 does not prove lower underlying model/token usage |
| **ROOT CAUSE CLASSIFICATION** | `PROVIDER_SIDE_OR_ACCOUNT_PLAN_SERVICE_BLOCKER`; local endpoint/auth/request-contract causes exhausted by current evidence |
| **CURRENT BLOCKER** | `BLOCKED_ZAI_CODING_PLAN_DEFAULT_53_HTTP500` |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile `zai:manual` preserved · no re-entry |
| **GLM QUOTA POLICY** | future issue #19 only · morning consumption observation remains; 5.2/5.1 cannot be assumed conservation tiers on Coding Plan without measured effective consumption |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `6` total historical smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_CODING_PLAN_DEFAULT_53_PROVIDER_VERIFICATION = BLOCKED`; evidence commit `17f401406623b3e31fd8e261685de4991bb72b27`; exactly one 5.3 invocation; HTTP 500 on Coding Plan path |
| **PLANNER SMOKE** | Codex PASS · GLM provider path BLOCKED pending provider/account-plan verification · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The exact Coding Plan default `zai/glm-5.3` was invoked exactly once after the read-only diagnosis had already established a locally consistent stack. The request reached `https://api.z.ai/api/coding/paas/v4/chat/completions` and returned provider HTTP 500.
- This reproduces the failure previously observed with `zai/glm-5.2` on the same correct Coding Plan path and removes the remaining model-alias ambiguity from the local diagnosis.
- Current evidence therefore supports `PROVIDER_SIDE_OR_ACCOUNT_PLAN_SERVICE_BLOCKER`; it does not justify further local endpoint/auth/config/plugin remediation or alternate-model attempts.
- No retry, second invocation, GLM 5.2/5.1/5 fallback, auth/config/endpoint mutation, credential refresh/re-entry, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring or billing occurred in the 5.3 verification pass.
- Next action requires provider/account-plan-side verification with Z.AI. Before any new GLM invocation, provider/account entitlement/service status must be clarified from the Z.AI side using sanitized evidence only; no secret/API key should be pasted into GPT Web, Cursor chat or GitHub.
- Issue #19 remains DEFERRED. Morning GLM token-consumption behavior remains a future measurement/routing-policy input; 5.2/5.1 Coding Plan selection may still route to 5.3, so measured effective consumption is required before treating them as conservation tiers.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
