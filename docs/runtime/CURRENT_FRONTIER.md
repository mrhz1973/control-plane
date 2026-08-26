# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-CURSOR-WIRE-PATH-UNKNOWN` |
| **STATO BLOCCO** | `AUTHORIZED / ONE_BOUNDED_CURSOR_REQUEST_EVIDENCE_CAPTURE_PENDING` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_CURSOR_REQUEST_EVIDENCE_AUTHORIZED` |
| **NEXT** | execute exactly one intentional Cursor GLM request while capturing only sanitized live request metadata needed to determine whether the working path uses stored BigModel BYOK or Cursor's first-party ZAI vendor adapter; if safe capture is unavailable, STOP with `EVIDENCE_CAPTURE_NOT_AVAILABLE`; no OpenClaw request or config/runtime mutation |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURSOR VERSION** | `3.15.6` |
| **CURSOR STORED BASE URL** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **CURSOR BYOK FLAG** | `useOpenAIKey=false`; `availableAPIKeyModels=[]` |
| **CURSOR GLM CATALOG** | `glm-5.2` under first-party vendor `ZAI` |
| **CURSOR WORKING WIRE PATH** | unknown · exactly one sanitized live evidence capture now authorized |
| **OPENCLAW BIGMODEL CN PATH** | `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` |
| **OPENCLAW GLM 5.2 BIGMODEL CN SMOKE** | BLOCKED · one invocation · HTTP 500 · zero retry/fallback |
| **ROOT CAUSE CLASSIFICATION** | `CURSOR_WORKING_PATH_NOT_RECONSTRUCTABLE_FROM_LOCAL_EVIDENCE` pending one authorized live Cursor evidence capture |
| **IMPORTANT INTERPRETATION** | Cursor success still does not prove direct BYOK use because `useOpenAIKey=false`; the authorized capture must distinguish BYOK/OpenAI-compatible traffic from Cursor-mediated ZAI traffic without exposing secrets |
| **Z.AI CREDENTIAL** | OpenClaw profile `zai:manual` preserved; no re-entry/change |
| **GLM QUOTA POLICY** | future issue #19 only · no automatic switching authorized |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `7` OpenClaw historical smoke attempts · Qwen `0`; exactly one Cursor GLM request authorized for evidence capture |
| **LATEST EVIDENCE** | `GLM_BIGMODEL_CN_CURSOR_OPENCLAW_DELTA_DIAGNOSIS = PASS`; evidence commit `2783ed4a9c38d84f7d04fcfc0e411de587d75da0`; zero provider/model requests during diagnosis |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Operator authorization permits exactly one intentional Cursor GLM request solely to capture sanitized live request metadata and determine whether Cursor uses the stored BigModel BYOK/OpenAI-compatible path or its first-party ZAI vendor-mediated path.
- Capture is limited to hostname/domain, request path if visible, model identifier if visible, status code, identifiable provider/adapter mode, and header names only. Header values, API keys, tokens, prompt/response contents, secret fragments, secret lengths and secret hashes are forbidden.
- Only existing safe local observation mechanisms may be used. No MITM, certificate installation, proxy/DNS/firewall modification, Cursor-setting mutation or new invasive instrumentation is authorized.
- If existing local tools cannot safely expose the required request metadata, STOP without a second request and classify `EVIDENCE_CAPTURE_NOT_AVAILABLE`.
- Exactly one Cursor GLM request is authorized; no retry or second request. No OpenClaw/GLM VPS smoke, Codex/Qwen invocation, fallback or alternate model is authorized.
- No credential refresh/re-entry/change, API key/Base URL mutation, OpenClaw auth/config/endpoint mutation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, runtime wiring or billing is authorized.
- After the request/capture attempt, persist only sanitized evidence in `docs/runtime/LAST_CURSOR_REPORT.md`, then STOP for `agg`.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
