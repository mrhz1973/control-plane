# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-OFFICIAL-DEFAULT-53-SMOKE` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / ONE_BOUNDED_OFFICIAL_DEFAULT_MODEL_INVOCATION` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_OFFICIAL_DEFAULT_53_SMOKE_GATE_REQUIRED` |
| **NEXT** | authorize exactly one direct/local OpenClaw smoke of official Coding Plan CN default model `zai/glm-5.3` against the already-configured `https://open.bigmodel.cn/api/coding/paas/v4`; zero retry/fallback; no auth/config/profile/endpoint mutation; persist sanitized evidence only |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURSOR VERSION** | `3.15.6` |
| **CURRENT Z.AI PROFILE** | provider `zai` · profile `zai:manual` · auth `api_key` |
| **CURRENT BIGMODEL CN BASE URL** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **CURRENT API STYLE / ADAPTER** | `openai-completions` · `zai openai-completions wrapZaiStreamFn` |
| **OFFICIAL CODING-PLAN-CN SEMANTICS** | provider `zai` · auth API key · Coding CN endpoint `https://open.bigmodel.cn/api/coding/paas/v4` · same API style/adapter as current setup |
| **OFFICIAL CURRENT DEFAULT MODEL** | current OpenClaw `main` docs: `zai-coding-cn` defaults to `glm-5.3`; `glm-5.2` is General API default; Coding Plan requests for GLM-5.2/5.1 are currently routed to GLM-5.3 |
| **OFFICIAL ENDPOINT AUTODETECT** | current OpenClaw docs state `zai-api-key` probes each endpoint's Chat Completions API and supports explicit `zai-coding-cn`; no onboarding/profile mutation is authorized here |
| **OFFICIAL CONFIG DELTA DIAGNOSIS** | PASS · `CURRENT_CONFIG_SEMANTICALLY_MATCHES_OFFICIAL_CODING_PLAN_CN` |
| **PUBLIC SUPPORT VERIFICATION** | OpenClaw issue #63687 confirms `open.bigmodel.cn/api/coding/paas/v4` is the intended CN Coding Plan endpoint and was implemented as explicit `zai-coding-cn`; current docs warn persistent failures with the same key/endpoint can indicate provider-side rejection or plan limitation, while ordinary overload/rate-limit responses use specific codes such as 1302/1305 |
| **OPENCLAW GLM 5.2 BIGMODEL CN SMOKE** | BLOCKED · one invocation · HTTP 500 · zero retry/fallback |
| **DIRECT BIGMODEL CN RAW CONTROL** | BLOCKED · exactly one raw HTTPS POST · HTTP 500 · zero retry; not a supported-tool equivalence test |
| **GLM 5.3 BIGMODEL CN STATUS** | NOT_TESTED on regional BigModel CN endpoint; prior explicit 5.3 failures were on global `api.z.ai` surfaces only |
| **ROOT CAUSE CLASSIFICATION** | no local provider/profile/baseUrl/adapter remediation is evidence-supported; vendor/client verification identified one untested officially preferred supported-tool path: exact `zai/glm-5.3` on Coding-Plan-CN. This is the next deterministic discriminator before support escalation. |
| **Z.AI CREDENTIAL** | preserved; no re-entry/change; secret must not be read/exposed/persisted |
| **GLM TEST QUOTA POLICY** | TEST PHASE: token conservation non-blocking / low priority. PRODUCTION PHASE: quota-aware routing remains deferred to issue #19. |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER / TEST INVOCATIONS** | Codex `1` · GLM `7` OpenClaw historical smoke attempts · direct raw BigModel control `1` · Qwen `0`; provider/client support verification added `0` provider/model requests |
| **LATEST EVIDENCE** | official config delta PASS at `419fc0bcad7aa87a57c9e2bbb5729325b7e810b2`; provider/client public verification confirms current Coding CN endpoint and current official default `glm-5.3`; no runtime request during this verification |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The operator authorized the provider/client-specific support gate. That pass was executed as public/vendor-side read-only verification only; it performed zero GLM/provider requests and zero local/runtime mutations.
- Current OpenClaw `main` documentation establishes `zai-coding-cn -> https://open.bigmodel.cn/api/coding/paas/v4 -> glm-5.3` as the fresh Coding Plan CN default. It separately identifies `glm-5.2` as the General API default and states Coding Plan requests for 5.2/5.1 are currently routed to 5.3.
- OpenClaw issue #63687 is closed as implemented and confirms explicit `zai-coding-cn` support for the BigModel CN endpoint. Therefore endpoint support itself is not the remaining gap.
- Current docs also state endpoint auto-detection works by Chat Completions probes. Persistent same-key/same-endpoint failures may indicate provider-side rejection or plan limitation; specific overload/rate-limit codes 1302/1305 are distinct from the generic HTTP 500 observed here.
- Exact `zai/glm-5.3` has never been tested through OpenClaw on the regional BigModel CN endpoint in this evidence track. Prior explicit GLM-5.3 tests were on global `api.z.ai` endpoints only.
- Therefore the next highest-value bounded experiment is exactly one supported-tool OpenClaw invocation of `zai/glm-5.3` on the already-configured Coding-Plan-CN endpoint. This model invocation requires a separate explicit human gate.
- No retry, second invocation, 5.2/5.1/5 fallback, direct raw API request, credential refresh/re-entry/change, config/profile/baseUrl mutation, core/plugin upgrade, `doctor --fix`, gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, runtime wiring or billing action is implicitly authorized.
- Any future vendor/support escalation must use sanitized evidence only; never expose API keys, tokens or Authorization values.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
