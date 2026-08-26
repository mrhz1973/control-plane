# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-PROVIDER-CLIENT-SPECIFIC-SUPPORT` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / PROVIDER_CLIENT_SPECIFIC_SUPPORT` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_PROVIDER_CLIENT_SPECIFIC_SUPPORT_GATE_REQUIRED` |
| **NEXT** | provider/client-specific support or vendor-side verification using sanitized evidence only; no additional GLM/provider request, no credential/config/runtime mutation, and no unsupported local remediation is authorized by AUTO-VIA |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURSOR VERSION** | `3.15.6` |
| **CURRENT Z.AI PROFILE** | provider `zai` · profile `zai:manual` · auth `api_key` |
| **CURRENT BIGMODEL CN BASE URL** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **CURRENT API STYLE / ADAPTER** | `openai-completions` · `zai openai-completions wrapZaiStreamFn` |
| **OFFICIAL CODING-PLAN-CN SEMANTICS** | provider `zai` / label `Z.AI` · product `coding-cn` / `Coding-Plan-CN` · same base URL · same API style · same adapter |
| **OFFICIAL DEFAULT MODEL** | `glm-5.3`; current authored `zai.models=[]` and current agent primary `openai/gpt-5.6-sol`; this is not a provider-adapter mismatch |
| **OFFICIAL CONFIG DELTA DIAGNOSIS** | PASS · `CURRENT_CONFIG_SEMANTICALLY_MATCHES_OFFICIAL_CODING_PLAN_CN` |
| **PROVEN CONFIG DELTAS** | provider none · product none · baseUrl none · API style none · adapter none · headers none · payload none · product/region mapping none; profile id name differs only (`zai:manual` vs default pattern) |
| **OPENCLAW GLM 5.2 BIGMODEL CN SMOKE** | BLOCKED · one invocation · HTTP 500 · zero retry/fallback |
| **DIRECT BIGMODEL CN RAW CONTROL** | BLOCKED · exactly one raw HTTPS POST · HTTP 500 · zero retry; NOT a supported-tool equivalence test |
| **ROOT CAUSE CLASSIFICATION** | local current OpenClaw/Z.AI configuration is semantically aligned with the official `Coding-Plan-CN` path; no bounded local config remediation is evidence-supported. Remaining blocker is provider/client-specific behavior/support verification. |
| **Z.AI CREDENTIAL** | preserved; no re-entry/change; secret not read/exposed/persisted during latest diagnosis |
| **GLM TEST QUOTA POLICY** | TEST PHASE: token conservation non-blocking / low priority. PRODUCTION PHASE: quota-aware routing remains deferred to issue #19. |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER / TEST INVOCATIONS** | Codex `1` · GLM `7` OpenClaw historical smoke attempts · direct raw BigModel control `1` · Qwen `0`; latest diagnosis `0` provider/model requests |
| **LATEST EVIDENCE** | `GLM_BIGMODEL_CN_OFFICIAL_OPENCLAW_CODING_PLAN_CONFIG_DELTA_DIAGNOSIS = PASS`; evidence commit `419fc0bcad7aa87a57c9e2bbb5729325b7e810b2`; zero requests/mutations/secrets |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The latest read-only diagnosis proves that the current `zai:manual` setup uses the same provider, Coding CN base URL, API style, request adapter, header-name set, payload transform, product semantics and region mapping as the installed official `Coding-Plan-CN` onboarding path.
- The profile-id difference is naming only; auth type is equivalent. The official onboarding default model is `glm-5.3`, but explicit prior `zai/glm-5.2` testing does not reveal an adapter/config mismatch.
- Therefore no further local config/profile/endpoint remediation is justified by current evidence.
- The previous raw direct HTTP 500 remains non-authoritative for Coding Plan because raw direct API is not a supported-tool equivalence test.
- AUTO-VIA stops here at `GLM_BIGMODEL_CN_PROVIDER_CLIENT_SPECIFIC_SUPPORT_GATE_REQUIRED`.
- No additional provider/model request, retry, credential change, config/profile/endpoint/model mutation, plugin/core upgrade, `doctor --fix`, gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, runtime wiring or billing action is implicitly authorized.
- Any support/vendor escalation must use sanitized evidence only; do not expose API keys, tokens or Authorization values.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
