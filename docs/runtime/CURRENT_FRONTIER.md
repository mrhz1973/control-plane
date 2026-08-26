# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-CURSOR-WIRE-PATH-UNKNOWN` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / ONE_BOUNDED_CURSOR_REQUEST_EVIDENCE_CAPTURE` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_CURSOR_REQUEST_EVIDENCE_GATE_REQUIRED` |
| **NEXT** | authorize exactly one bounded Cursor GLM request/evidence capture to determine whether the successful Cursor path uses the stored BigModel BYOK endpoint/key or Cursor's first-party ZAI vendor adapter; capture only sanitized host/path/model/status/header names; no secret values, no OpenClaw request, no config mutation |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURSOR VERSION** | `3.15.6` |
| **CURSOR STORED BASE URL** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **CURSOR BYOK FLAG** | `useOpenAIKey=false`; `availableAPIKeyModels=[]` |
| **CURSOR GLM CATALOG** | `glm-5.2` under first-party vendor `ZAI` |
| **CURSOR WORKING WIRE PATH** | unknown · no existing local success log proves host/path/model-id actually used |
| **OPENCLAW BIGMODEL CN PATH** | `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` |
| **OPENCLAW GLM 5.2 BIGMODEL CN SMOKE** | BLOCKED · one invocation · HTTP 500 · zero retry/fallback |
| **ROOT CAUSE CLASSIFICATION** | `CURSOR_WORKING_PATH_NOT_RECONSTRUCTABLE_FROM_LOCAL_EVIDENCE` |
| **IMPORTANT INTERPRETATION** | the prior assumption that Cursor success proves this BYOK API key works directly is NOT established by current evidence because Cursor's stored BYOK flag is disabled; Cursor may be using its vendor-mediated ZAI path |
| **Z.AI CREDENTIAL** | OpenClaw profile `zai:manual` preserved; no re-entry/change |
| **GLM QUOTA POLICY** | future issue #19 only · no automatic switching authorized |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `7` OpenClaw historical smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_BIGMODEL_CN_CURSOR_OPENCLAW_DELTA_DIAGNOSIS = PASS`; evidence commit `2783ed4a9c38d84f7d04fcfc0e411de587d75da0`; zero provider/model requests during diagnosis |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Read-only Cursor/OpenClaw delta diagnosis PASS: stored Cursor `openAIBaseUrl` matches the OpenClaw BigModel CN base endpoint, but Cursor has `useOpenAIKey=false` and `availableAPIKeyModels=[]` while `glm-5.2` is present as a first-party `ZAI` catalog model.
- Therefore the successful Cursor GLM interaction cannot currently be treated as proof that the same BYOK API key/endpoint works directly. The live Cursor wire request may instead be mediated by Cursor's ZAI vendor adapter.
- Existing local Cursor evidence cannot reconstruct the actual successful request URL/path/model id. No concrete OpenClaw-remediable request delta is yet proven.
- The next useful action requires a separate human gate because it needs exactly one intentional Cursor GLM request while capturing only sanitized request metadata. No prompt/response contents, API key, token, Authorization value, secret fragment/length/hash may be persisted.
- The evidence capture must not mutate Cursor settings, OpenClaw config, auth, endpoint, gateway, services, n8n, Docker, Tailscale, firewall, reverse proxy, runtime wiring or billing.
- No OpenClaw/GLM smoke, Codex/Qwen invocation, retry or fallback is implicitly authorized by this gate.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
