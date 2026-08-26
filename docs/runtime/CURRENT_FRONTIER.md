# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-OPENCLAW-BIGMODEL-MODEL-POLICY-CONFLICT` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / VENDOR_DOCS_CONFLICT` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_SUPPORTED_MODEL_SMOKE_GATE_REQUIRED` |
| **NEXT** | do NOT execute the previously authorized `zai/glm-5.3` smoke: current BigModel Coding Plan docs explicitly list `GLM-5.2`, `GLM-5-Turbo`, `GLM-4.7` as plan-supported and warn not to select other models, while current OpenClaw docs claim `zai-coding-cn` defaults to `glm-5.3`; because the operator's authorization excluded billing side-effects, this contradiction invalidates the 5.3 runtime premise. Next bounded discriminator should use a model supported by BOTH sources, preferably `zai/glm-5-turbo`, under a fresh explicit gate. |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURRENT Z.AI PROFILE** | provider `zai` · profile `zai:manual` · auth `api_key` |
| **CURRENT BIGMODEL CN BASE URL** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **CURRENT API STYLE / ADAPTER** | `openai-completions` · `zai openai-completions wrapZaiStreamFn` |
| **OFFICIAL CONFIG DELTA DIAGNOSIS** | PASS · `CURRENT_CONFIG_SEMANTICALLY_MATCHES_OFFICIAL_CODING_PLAN_CN` |
| **BIGMODEL CURRENT CODING PLAN POLICY** | provider docs currently list plan models `GLM-5.2`, `GLM-5-Turbo`, `GLM-4.7`; OpenClaw is supported on best-effort/secondary scheduling; non-official OpenClaw config must use `https://open.bigmodel.cn/api/coding/paas/v4`; BigModel OpenClaw guide warns not to select other models to avoid unintended charging |
| **OPENCLAW CURRENT Z.AI DOCS** | current OpenClaw docs map `zai-coding-cn` to the same CN Coding endpoint but claim default model `glm-5.3`; catalog labels `glm-5-turbo` as OpenClaw-optimized text model |
| **DOCS CONFLICT** | `glm-5.3` eligibility/default differs between OpenClaw and BigModel current documentation; for billing/model entitlement, provider-side BigModel documentation is treated as the safety authority until reconciled |
| **OPENCLAW GLM 5.2 BIGMODEL CN SMOKE** | BLOCKED · one invocation · HTTP 500 · zero retry/fallback |
| **DIRECT BIGMODEL CN RAW CONTROL** | BLOCKED · exactly one raw HTTPS POST · HTTP 500 · zero retry; not a supported-tool equivalence test |
| **GLM 5.3 BIGMODEL CN SMOKE** | NOT_EXECUTED after authorization because fresh provider documentation created a billing/eligibility conflict with the authorization's no-billing boundary |
| **RECOMMENDED COMMON-SUPPORT DISCRIMINATOR** | `zai/glm-5-turbo` on the existing Coding-Plan-CN endpoint: explicitly supported by current BigModel Coding Plan docs and present in current OpenClaw Z.AI catalog; requires fresh human authorization |
| **ROOT CAUSE CLASSIFICATION** | local provider/profile/baseUrl/adapter configuration remains semantically aligned; unresolved failure now needs a supported-model control that does not cross the BigModel plan-eligibility warning |
| **Z.AI CREDENTIAL** | preserved; no re-entry/change; secret must not be read/exposed/persisted |
| **GLM TEST QUOTA POLICY** | TEST PHASE: token conservation non-blocking / low priority. Billing/model-entitlement boundaries remain hard gates. PRODUCTION PHASE: quota-aware routing deferred to issue #19. |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER / TEST INVOCATIONS** | Codex `1` · GLM `7` OpenClaw historical smoke attempts · direct raw BigModel control `1` · Qwen `0`; no 5.3 regional smoke executed in this phase |
| **LATEST EVIDENCE** | fresh public cross-check: BigModel current OpenClaw/Coding Plan docs conflict with OpenClaw current Z.AI docs on `glm-5.3`; zero provider/model requests and zero runtime/config mutations during this cross-check |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The operator explicitly authorized exactly one `zai/glm-5.3` regional smoke, but that authorization also forbade billing mutation/side-effects and was based on the premise that GLM-5.3 is the official Coding-Plan-CN default.
- A fresh documentation cross-check found a material source conflict: current OpenClaw docs claim `zai-coding-cn` defaults to `glm-5.3`, while current BigModel Coding Plan/OpenClaw docs list only `GLM-5.2`, `GLM-5-Turbo`, `GLM-4.7` as Coding Plan-supported and explicitly warn not to select other models to avoid charging.
- Therefore the `zai/glm-5.3` smoke was NOT executed. This is a real safety/billing gate, not a token-conservation pause.
- Provider-side BigModel documentation governs plan eligibility/billing risk until the discrepancy is reconciled. No inference is made that OpenClaw docs are wrong; the two sources are simply inconsistent at the current snapshot.
- The next recommended bounded discriminator is exactly one supported-tool OpenClaw smoke using `zai/glm-5-turbo` on the already-configured Coding-Plan-CN endpoint, because it is explicitly supported by BigModel and described by OpenClaw as an OpenClaw-optimized text model. This requires fresh explicit authorization.
- No GLM/provider request, retry, credential change, config/profile/endpoint/model mutation, plugin/core upgrade, `doctor --fix`, gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, runtime wiring or billing action is authorized by this docs-only advance.
- Any vendor/support escalation must use sanitized evidence only; never expose API keys, tokens or Authorization values.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
