# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-OFFICIAL-OPENCLAW-CONFIG-DELTA` |
| **STATO BLOCCO** | `AUTO_VIA / READ_ONLY_OFFICIAL_CONFIG_COMPARISON_PENDING` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_OFFICIAL_OPENCLAW_CODING_PLAN_CONFIG_DELTA_DIAGNOSIS_AUTO_VIA` |
| **NEXT** | execute a strict read-only comparison between the current VPS OpenClaw/Z.AI configuration and BigModel's current official OpenClaw onboarding path `智谱 -> Coding-Plan-CN`; determine whether `zai:manual`/provider/profile/model/baseUrl semantics differ from the official generated Coding Plan configuration; zero provider/model requests and zero mutation; if a concrete delta is proven, stop at a bounded remediation gate |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURSOR VERSION** | `3.15.6` |
| **CURSOR STORED BASE URL** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **CURSOR BYOK FLAG** | `useOpenAIKey=false`; `availableAPIKeyModels=[]` |
| **CURSOR GLM CATALOG** | `glm-5.2` under first-party vendor `ZAI` |
| **CURSOR LIVE EVIDENCE CAPTURE** | BLOCKED before request · `SAFE_CAPTURE_METHOD_AVAILABLE=false` · `CURSOR_GLM_REQUEST_COUNT=0` |
| **CURSOR WORKING WIRE PATH** | still unknown |
| **OPENCLAW BIGMODEL CN PATH** | `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` |
| **OPENCLAW GLM 5.2 BIGMODEL CN SMOKE** | BLOCKED · one invocation · HTTP 500 · zero retry/fallback |
| **DIRECT BIGMODEL CN API CONTROL** | BLOCKED · exactly one raw HTTPS POST bypassing OpenClaw infer/adapter · `glm-5.2` · HTTP 500 `内部服务器错误` · zero retry · sanitized provider trace id captured |
| **ROOT CAUSE CLASSIFICATION** | raw direct API HTTP 500 observed, but NOT sufficient to prove account/key/Coding-Plan failure because current BigModel Coding Plan documentation restricts plan use to supported tools/product environments and explicitly supports OpenClaw; raw direct API is therefore not an equivalent Coding Plan control. Highest-value next discriminator is official OpenClaw `Coding-Plan-CN` config semantics vs current `zai:manual` setup. |
| **OFFICIAL BIGMODEL OPENCLAW PATH** | current docs: provider `智谱`, product/profile `Coding-Plan-CN`, Coding endpoint `https://open.bigmodel.cn/api/coding/paas/v4`; supported Coding Plan models include `GLM-5.2`, `GLM-5-Turbo`, `GLM-4.7` |
| **Z.AI CREDENTIAL** | OpenClaw profile `zai:manual` preserved; no re-entry/change; secret not exposed/persisted |
| **GLM TEST QUOTA POLICY** | TEST PHASE: token conservation non-blocking / low priority. PRODUCTION PHASE: quota-aware routing remains required and deferred to issue #19. Bounded counts are for diagnostic determinism, not conservation. |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER / TEST INVOCATIONS** | Codex `1` · GLM `7` OpenClaw historical smoke attempts · direct raw BigModel control `1` · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_BIGMODEL_CN_DIRECT_API_CONTROL_REQUEST = BLOCKED`; evidence commit `3348a7c94574b724ce77b86e767ba6a9ca6c2017`; direct endpoint HTTP 500; OpenClaw infer bypassed; no retry/mutation/secret exposure |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The direct control request executed exactly once and returned HTTP 500 while bypassing OpenClaw infer/adapter. This proves only that the raw direct request failed; it does not establish that the Coding Plan account/key is unusable in an officially supported tool.
- Current BigModel Coding Plan documentation states the subscription is limited to officially supported tools/product environments and explicitly lists OpenClaw as supported. Current OpenClaw guidance instructs selecting provider `智谱` and `Coding-Plan-CN`, with Coding endpoint `https://open.bigmodel.cn/api/coding/paas/v4`.
- Therefore the previous classification `DIRECT_BIGMODEL_CN_API_OR_ACCOUNT_PLAN_PATH_BLOCKED_INDEPENDENT_OF_OPENCLAW_INFER` is narrowed: the raw direct request is not an authoritative Coding Plan equivalence test.
- AUTO-VIA now permits only strict read-only inspection/comparison of the installed OpenClaw/Z.AI configuration, plugin code/schema/help and sanitized current state against the official `智谱 -> Coding-Plan-CN` onboarding semantics. No provider/model request is authorized by this AUTO-VIA step.
- No API key/token/Authorization value may be read, printed, hashed, measured or persisted. Sanitized field names/types/profile/provider identifiers are allowed.
- No auth/config/endpoint/profile/model mutation, credential re-entry/refresh, onboarding/config wizard execution that writes state, plugin/core upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, runtime wiring or billing mutation is authorized.
- If a concrete local config/profile/provider delta is proven, STOP at `GLM_BIGMODEL_CN_OFFICIAL_OPENCLAW_CONFIG_REMEDIATION_GATE_REQUIRED` and persist evidence. If no concrete delta is found, STOP at a provider/client-specific support or officially supported clean-profile reconstruction gate; do not make another GLM request automatically.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
