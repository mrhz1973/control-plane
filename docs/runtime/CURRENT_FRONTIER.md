# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-DIRECT-API-CONTROL` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / ONE_BOUNDED_DIRECT_PROVIDER_REQUEST` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_DIRECT_API_CONTROL_REQUEST_GATE_REQUIRED` |
| **NEXT** | authorize exactly one direct minimal API control request from VPS `ionos-n8n` to `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` using the already-stored Z.AI credential without exposing it and bypassing OpenClaw inference; use `glm-5.2`, `stream=false`, minimal payload, zero retry; persist only sanitized status/error/request metadata |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURSOR VERSION** | `3.15.6` |
| **CURSOR STORED BASE URL** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **CURSOR BYOK FLAG** | `useOpenAIKey=false`; `availableAPIKeyModels=[]` |
| **CURSOR GLM CATALOG** | `glm-5.2` under first-party vendor `ZAI` |
| **CURSOR LIVE EVIDENCE CAPTURE** | BLOCKED before request · `SAFE_CAPTURE_METHOD_AVAILABLE=false` · `CURSOR_GLM_REQUEST_COUNT=0` · no safe existing mechanism could observe the same UI wire path without escalation |
| **CURSOR WORKING WIRE PATH** | still unknown · no request was consumed during evidence-capture attempt |
| **OPENCLAW BIGMODEL CN PATH** | `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` |
| **OPENCLAW GLM 5.2 BIGMODEL CN SMOKE** | BLOCKED · one invocation · HTTP 500 · zero retry/fallback |
| **ROOT CAUSE CLASSIFICATION** | `EVIDENCE_CAPTURE_NOT_AVAILABLE`; direct provider/API control is now the highest-value bounded discriminator before any more invasive Cursor capture |
| **Z.AI CREDENTIAL** | OpenClaw profile `zai:manual` preserved; no re-entry/change; secret must not be printed/logged/persisted |
| **GLM TEST QUOTA POLICY** | TEST PHASE: token conservation is non-blocking / low priority; operator reports abundant quota with periodic reset. PRODUCTION PHASE: quota-aware routing remains required and deferred to issue #19. Experimental invocation counts remain bounded only for diagnostic determinism, not token conservation. |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `7` OpenClaw historical smoke attempts · Qwen `0`; latest Cursor capture attempt consumed `0` GLM requests |
| **LATEST EVIDENCE** | `GLM_BIGMODEL_CN_CURSOR_REQUEST_EVIDENCE_CAPTURE = BLOCKED`; evidence commit `f27c4b91924568839de244d191502ba05c8f0dd6`; blocker `EVIDENCE_CAPTURE_NOT_AVAILABLE`; zero Cursor/OpenClaw/model/provider requests in that pass |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The authorized Cursor live evidence-capture task stopped before any GLM request because no already-available safe observation method could both trigger the same GLM 5.2 UI path and expose host/path without enabling DevTools/instrumentation or other escalation. This is `EVIDENCE_CAPTURE_NOT_AVAILABLE`, not evidence that Cursor failed to execute a GLM request.
- The stored Cursor state still does not prove direct BYOK use: `useOpenAIKey=false`, `availableAPIKeyModels=[]`, and `glm-5.2` is a first-party `ZAI` catalog model. The successful Cursor path remains wire-level unknown.
- Because test-phase GLM token consumption is explicitly non-blocking, optimization should favor diagnostic information rather than minimizing token usage. Bounded invocation counts remain useful to keep individual experiments attributable and deterministic. Production quota/time-window routing remains a separate future policy in issue #19.
- The next highest-value bounded experiment is a direct provider/API control request from the VPS using the already-stored Z.AI credential while bypassing OpenClaw inference. This can distinguish: direct BigModel API/key/endpoint failure versus OpenClaw adapter/payload incompatibility.
- The direct API request is NOT authorized until the current human gate is explicitly approved. It must not expose/read/log/persist the secret value; no credential refresh/re-entry/change is implied.
- No retry, second direct request, OpenClaw model invocation, Cursor request, Codex/Qwen invocation, auth/config/endpoint mutation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, runtime wiring or billing is implicitly authorized.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
