# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-BIGMODEL-CN-CURSOR-OPENCLAW-DELTA` |
| **STATO BLOCCO** | `AUTO_VIA / READ_ONLY_DIAGNOSIS_PENDING` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_CURSOR_OPENCLAW_DELTA_DIAGNOSIS_AUTO_VIA` |
| **NEXT** | execute a read-only comparison of the operator's working Cursor GLM BYOK path versus failing OpenClaw path on `open.bigmodel.cn`; inspect local Cursor configuration/log evidence and OpenClaw request construction without reading secrets or making any provider/model request; persist the narrowest supported delta/root-cause classification |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **WORKING CURSOR EVIDENCE** | operator screenshot shows Cursor BYOK functioning with GLM selection labeled 5.2 and Override OpenAI Base URL `https://open.bigmodel.cn/`; operator observes effective service/model as 5.3; no key value exposed |
| **BIGMODEL CN CODING ENDPOINT** | `https://open.bigmodel.cn/api/coding/paas/v4` configured in OpenClaw and locally verified |
| **ENDPOINT REMEDIATION** | PASS · only `models.providers.zai.baseUrl` changed from global `api.z.ai` Coding path to BigModel CN Coding path |
| **GLM 5.2 BIGMODEL CN SMOKE** | BLOCKED · exactly one `zai/glm-5.2` invocation reached `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` and returned HTTP 500 (`内部服务器错误`); zero retry/fallback |
| **GLM 5.3 STATUS** | historical BLOCKED on global `api.z.ai` Coding path · HTTP 500; no new 5.3 invocation on BigModel CN path |
| **ROOT CAUSE STATUS** | provider/account-plan-only classification is NOT sufficient while Cursor GLM BYOK works against the same BigModel host family; next evidence must isolate client/request/config delta between Cursor and OpenClaw |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile `zai:manual` preserved · no re-entry/change during BigModel CN remediation/smoke |
| **GLM QUOTA POLICY** | future issue #19 only · morning/peak-window consumption evidence retained; no automatic switching authorized |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `7` total historical smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_BIGMODEL_CN_POST_REMEDIATION_52_SMOKE = BLOCKED`; evidence commit `567b6ccfbc7c60cf055e51af5b9583e73db58cf6`; one invocation, correct BigModel CN URL, HTTP 500, no retry/mutation |
| **PLANNER SMOKE** | Codex PASS · GLM OpenClaw BigModel CN smoke BLOCKED HTTP 500 while operator Cursor GLM path remains working · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Cursor persisted a BLOCKED result for the exact one-shot BigModel CN `zai/glm-5.2` smoke: request reached `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` and returned provider HTTP 500; automatic retry count remained zero and no alternate model or mutation occurred.
- The operator has independent working evidence that GLM BYOK works inside Cursor against the `open.bigmodel.cn` host family. Therefore the failed OpenClaw smoke does not justify treating the account/plan/provider as globally unusable; the most valuable next step is to identify the client/request/config delta.
- AUTO-VIA permits the next read-only diagnosis because it requires no provider/model request and no runtime/auth/config mutation. It may inspect sanitized local Cursor settings/log metadata and installed code paths, but must not expose or persist API keys, tokens, Authorization headers, secret fragments, secret length or secret hashes.
- The read-only diagnosis must determine, if evidence permits: actual Cursor endpoint/path construction, provider compatibility mode, model identifier sent, request API style, relevant headers by name only, stream/reasoning/tool payload differences, and whether Cursor applies any BigModel-specific adapter/translation that OpenClaw does not.
- No GLM invocation, provider probe, retry, fallback, credential refresh/re-entry, auth/config/endpoint mutation, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring or billing is authorized during diagnosis.
- Issue #19 remains DEFERRED. Morning/peak-window quota behavior remains a future measured routing-policy input only.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
