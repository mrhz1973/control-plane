# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-PROVIDER-HTTP500-VERIFICATION` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / ONE_BOUNDED_MODEL_INVOCATION` |
| **GATE CORRENTE** | `GLM_ZAI_CODING_PLAN_DEFAULT_53_VERIFICATION_GATE_REQUIRED` |
| **NEXT** | authorize exactly one direct smoke of exact Coding Plan default `zai/glm-5.3` through `https://api.z.ai/api/coding/paas/v4`; no retry, no 5.2/5.1/5 fallback and no auth/config/endpoint mutation; persist evidence before closure |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **Z.AI KEY SOURCE** | OPERATOR-CONFIRMED: `Control Plane` key was created under GLM Coding Plan; no secret value persisted |
| **GLM CODING PLAN** | active plan shown valid; key source is Coding Plan rather than general API platform |
| **CODING PLAN BASE ENDPOINT** | `https://api.z.ai/api/coding/paas/v4` effective |
| **GLM 5.3 STATUS** | Coding Plan default · exact ref/plugin declared · post-remediation Coding Plan smoke not yet executed |
| **GLM 5.2 STATUS** | BLOCKED · exact ref/plugin declared · one Coding Plan smoke reached correct path and returned HTTP 500 |
| **GLM 5.2 CODING BEHAVIOR** | installed docs state Coding Plan requests for `glm-5.2` (and `glm-5.1`) are currently routed by Z.AI to `glm-5.3`; therefore selecting 5.2 does not prove lower underlying model/token usage |
| **ROOT CAUSE CLASSIFICATION** | `LOCAL_STACK_CONSISTENT_PROVIDER_HTTP500_UNEXPLAINED`; endpoint binding fixed, request contract matches, no richer local provider error available |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile `zai:manual` preserved · no re-entry |
| **GLM QUOTA POLICY** | future issue #19 only · morning consumption observation remains; new evidence means 5.2/5.1 cannot be assumed to preserve quota on Coding Plan because they may route to 5.3; no automatic switching authorized |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `5` total historical smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_CODING_PLAN_HTTP500_READ_ONLY_DIAGNOSIS = PASS`; evidence commit `d14c306cfd998492da779218eade7e636c6a6f72`; zero provider/model requests in diagnosis |
| **PLANNER SMOKE** | Codex PASS · GLM 5.2 Coding Plan smoke BLOCKED HTTP 500 · exact 5.3 Coding Plan default verification requires explicit gate · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Read-only diagnosis PASS: `glm-5.2` is declared/supported by the installed Z.AI stack, Coding Plan default is `glm-5.3`, and installed docs state Coding Plan requests for `glm-5.2`/`glm-5.1` are currently routed to `glm-5.3`.
- Offline OpenClaw/plugin trace found the expected `openai-completions` `/chat/completions` request contract and no Coding Plan request-contract mismatch beyond the already-corrected baseUrl.
- No richer existing provider error detail exists beyond generic HTTP 500, and no local config/plugin defect was confirmed. Current root-cause class is therefore provider-side/unexplained from local evidence, not endpoint/auth/request-contract mismatch.
- The next diagnostically useful runtime action is one exact `zai/glm-5.3` smoke because it is the installed Coding Plan default and avoids the 5.2 alias/routing ambiguity. This model invocation is NOT authorized until the current human gate is explicitly approved.
- No retry, second invocation, 5.2/5.1/5 fallback, auth/config/endpoint mutation, credential refresh/re-entry, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring or billing is implicitly authorized.
- Issue #19 remains DEFERRED. Any future quota/time-window routing must account for the fact that 5.2/5.1 Coding Plan selection may still route to 5.3; measured effective consumption is required before treating them as conservation tiers.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
