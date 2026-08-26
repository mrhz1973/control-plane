# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-REGIONAL-53-DIAGNOSTIC-SMOKE` |
| **STATO BLOCCO** | `AUTHORIZED / ONE_BOUNDED_MODEL_INVOCATION_PENDING` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_REGIONAL_53_DIAGNOSTIC_SMOKE_AUTHORIZED` |
| **NEXT** | execute exactly one direct/local OpenClaw smoke of `zai/glm-5.3` on VPS `ionos-n8n` using the already-configured `https://open.bigmodel.cn/api/coding/paas/v4`; zero retry/fallback and zero auth/config/runtime mutation; persist sanitized evidence only |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURRENT Z.AI PROFILE** | provider `zai` · profile `zai:manual` · auth `api_key` |
| **CURRENT BIGMODEL CN BASE URL** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **CURRENT API STYLE / ADAPTER** | `openai-completions` · `zai openai-completions wrapZaiStreamFn` |
| **OFFICIAL CONFIG DELTA DIAGNOSIS** | PASS · `CURRENT_CONFIG_SEMANTICALLY_MATCHES_OFFICIAL_CODING_PLAN_CN` |
| **BIGMODEL / OPENCLAW DOCS CONFLICT** | BigModel current plan docs list `GLM-5.2`, `GLM-5-Turbo`, `GLM-4.7`, while current OpenClaw docs claim `zai-coding-cn` defaults to `glm-5.3`; operator has now explicitly removed billing/model-entitlement concern for this diagnostic test, so the docs conflict no longer blocks one bounded model invocation |
| **MODEL SELECTED FOR TEST** | `zai/glm-5.3` because it is the current OpenClaw-declared default for `zai-coding-cn` and has never been tested through OpenClaw on the regional BigModel CN endpoint in this evidence track |
| **OPENCLAW GLM 5.2 BIGMODEL CN SMOKE** | BLOCKED · one invocation · HTTP 500 · zero retry/fallback |
| **DIRECT BIGMODEL CN RAW CONTROL** | BLOCKED · exactly one raw HTTPS POST · HTTP 500 · zero retry; not a supported-tool equivalence test |
| **GLM 5.3 BIGMODEL CN SMOKE** | AUTHORIZED · exactly one invocation pending · no retry/fallback |
| **Z.AI CREDENTIAL** | preserved; no re-entry/change; secret must not be read/exposed/persisted |
| **GLM TEST QUOTA/BILLING POLICY** | TEST PHASE: token conservation and incidental billing for a minimal diagnostic text request are non-blocking per operator. Invocation counts remain bounded for diagnostic determinism. PRODUCTION PHASE: quota-aware routing remains deferred to issue #19. |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER / TEST INVOCATIONS** | Codex `1` · GLM `7` OpenClaw historical smoke attempts · direct raw BigModel control `1` · Qwen `0`; regional `zai/glm-5.3` pending |
| **LATEST EVIDENCE** | fresh docs cross-check found a model-policy conflict; operator explicitly overrode billing/model-entitlement concern for a minimal diagnostic test and authorized any model choice. Selected deterministic discriminator is one regional OpenClaw `zai/glm-5.3` smoke. |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The operator explicitly stated that for the current test phase any GLM model may be used and incidental billing for a minimal text smoke is not a blocker. This supersedes the prior billing/model-entitlement gate only for this bounded diagnostic experiment.
- Exactly one direct/local OpenClaw invocation of `zai/glm-5.3` on the existing BigModel CN Coding endpoint is authorized. The choice is made because current OpenClaw docs declare it as the `zai-coding-cn` default and this regional 5.3 path is still untested.
- No automatic/manual retry, second invocation, fallback, direct raw API request, Cursor GLM request, Codex/Qwen invocation, credential refresh/re-entry/change, auth/config/profile/baseUrl/model-catalog mutation, onboarding wizard, plugin/core upgrade, `doctor --fix`, gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation or runtime wiring is authorized.
- Persist only sanitized requested model, observed endpoint/URL, HTTP status/exit code, response-received/marker-match booleans, sanitized provider error, and retry count. Never persist API keys, tokens or Authorization values.
- If the smoke succeeds, STOP without gateway/runtime activation and classify the regional `zai/glm-5.3` path as verified. If it fails, STOP without retry or remediation and persist the exact sanitized blocker.
- A frontier model inside Cursor remains available as a later diagnostic/review option but is not part of this VPS provider-path smoke.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
