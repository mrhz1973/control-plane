# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-POST-REMEDIATION-SMOKE` |
| **STATO BLOCCO** | `AUTHORIZED / ONE_BOUNDED_MODEL_INVOCATION_PENDING` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_POST_REMEDIATION_52_SMOKE_AUTHORIZED` |
| **NEXT** | execute exactly one direct smoke of exact `zai/glm-5.2` through `https://open.bigmodel.cn/api/coding/paas/v4`; pre/post read-only checks only; no retry/fallback/auth/config/endpoint mutation; persist observed request URL and evidence before closure |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **WORKING CURSOR EVIDENCE** | operator screenshot shows Cursor BYOK working with Override OpenAI Base URL `https://open.bigmodel.cn/`; no key value exposed |
| **BIGMODEL CN CODING ENDPOINT** | `https://open.bigmodel.cn/api/coding/paas/v4` configured and locally verified |
| **ENDPOINT REMEDIATION** | PASS · only `models.providers.zai.baseUrl` changed from `https://api.z.ai/api/coding/paas/v4` to BigModel CN path |
| **GLM 5.3 STATUS** | historical BLOCKED on global `api.z.ai` Coding path · HTTP 500; not yet tested on remediated BigModel CN path |
| **GLM 5.2 STATUS** | historical BLOCKED on global `api.z.ai` Coding path · HTTP 500; exactly one BigModel CN post-remediation smoke now explicitly authorized |
| **MODEL/PLAN DOC DRIFT** | current BigModel CN docs and operator working Cursor evidence supersede prior assumption that the global `api.z.ai` host represented this account's working Coding Plan path |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile `zai:manual` preserved · no re-entry/change during BigModel CN remediation or authorized smoke |
| **GLM QUOTA POLICY** | future issue #19 only · morning/peak-window consumption evidence retained; no automatic switching authorized |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `6` total historical smoke attempts before this authorized pass · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_BIGMODEL_CN_CODING_ENDPOINT_REMEDIATION = PASS`; evidence commit `2d14f370e253408bf249a5e50b130c5744541a5c`; baseUrl-only mutation; provider/model requests `0` |
| **PLANNER SMOKE** | Codex PASS · exactly one `zai/glm-5.2` BigModel CN post-remediation smoke explicitly authorized · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Cursor evidence persisted a PASS for the bounded regional endpoint remediation: only `models.providers.zai.baseUrl` changed to `https://open.bigmodel.cn/api/coding/paas/v4`; profile `zai:manual` and auth type were preserved.
- Operator authorization now permits exactly one minimal direct smoke invocation of exact `zai/glm-5.2` through the remediated BigModel CN Coding endpoint, with pre/post read-only checks and observed request URL persistence.
- The smoke must verify the actual request uses `https://open.bigmodel.cn/api/coding/paas/v4/...` and does not use `api.z.ai`.
- If the smoke fails for any reason, STOP without retry or fallback and persist the sanitized blocker. No second invocation is authorized.
- No GLM 5.3/5.1/5 fallback, credential refresh/re-entry, auth/config/endpoint mutation, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring or billing is authorized in this pass.
- Issue #19 remains DEFERRED. Morning/peak-window quota behavior remains a future measured routing-policy input only.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
