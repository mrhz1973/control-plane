# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-REGIONAL-CODING-ENDPOINT-MISMATCH` |
| **STATO BLOCCO** | `AUTHORIZED / ENDPOINT_HOST_REMEDIATION_PENDING` |
| **GATE CORRENTE** | `GLM_BIGMODEL_CN_CODING_ENDPOINT_REMEDIATION_AUTHORIZED` |
| **NEXT** | change only `models.providers.zai.baseUrl` from `https://api.z.ai/api/coding/paas/v4` to `https://open.bigmodel.cn/api/coding/paas/v4`; preserve `zai:manual`, perform local read-only postchecks only, persist evidence, then require a separate smoke gate |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **WORKING CURSOR EVIDENCE** | operator screenshot shows Cursor BYOK working with Override OpenAI Base URL `https://open.bigmodel.cn/`; no key value exposed |
| **CURRENT OFFICIAL BIGMODEL OPENCLAW DOC** | Coding Plan non-official OpenClaw configuration must use `https://open.bigmodel.cn/api/coding/paas/v4`; Coding Plan is explicitly supported by OpenClaw |
| **CURRENT OPENCLAW VPS ENDPOINT** | `https://api.z.ai/api/coding/paas/v4` |
| **AUTHORIZED TARGET ENDPOINT** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **REGIONAL HOST HYPOTHESIS** | strong: current VPS uses global `api.z.ai` host while the operator's working Cursor configuration and current official BigModel CN docs use `open.bigmodel.cn`; bounded host remediation explicitly authorized |
| **GLM 5.3 STATUS** | BLOCKED on `api.z.ai` Coding path · exact Coding Plan default tested once · HTTP 500; not yet tested on `open.bigmodel.cn` Coding path |
| **GLM 5.2 STATUS** | BLOCKED on `api.z.ai` Coding path · exact ref tested once · HTTP 500; operator reports Cursor selection labeled 5.2 but effective service appears as 5.3; no conclusion yet about OpenClaw behavior on BigModel CN path |
| **MODEL/PLAN DOC DRIFT** | current official BigModel CN Coding Plan docs list GLM-5.2 / GLM-5-Turbo / GLM-4.7 as plan models and state historical GLM-5.1/GLM-5 switch to 5.2; this differs from installed beta OpenClaw docs observed during diagnosis, so installed-doc routing claims must not be treated as current universal policy |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile `zai:manual` preserved · no re-entry authorized |
| **GLM QUOTA POLICY** | future issue #19 only · current official BigModel CN docs define peak period 14:00–18:00 UTC+8 and higher quota multipliers for high-end models; this corresponds to morning in Europe/Rome during CEST and materially supports the operator's morning-consumption observation; no automatic switching authorized |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `6` total historical smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_CODING_PLAN_DEFAULT_53_PROVIDER_VERIFICATION = BLOCKED`; evidence commit `17f401406623b3e31fd8e261685de4991bb72b27`; HTTP 500 on `api.z.ai` Coding path; subsequent operator Cursor evidence + current official BigModel CN docs reopen endpoint-host diagnosis |
| **PLANNER SMOKE** | Codex PASS · GLM blocked on global host; BigModel CN endpoint remediation authorized; no smoke authorized in remediation pass · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- New operator evidence materially changes the diagnosis: Cursor is already using the same GLM credential family successfully through `https://open.bigmodel.cn/`, while all failed OpenClaw VPS tests used `https://api.z.ai/...`.
- Current official BigModel CN documentation explicitly states that OpenClaw Coding Plan configurations should use `https://open.bigmodel.cn/api/coding/paas/v4`. Therefore `api.z.ai` vs `open.bigmodel.cn` is now the strongest bounded local hypothesis and supersedes the earlier provider/account-plan-support-only conclusion.
- Operator authorization now permits exactly one bounded configuration mutation: change only `models.providers.zai.baseUrl` from `https://api.z.ai/api/coding/paas/v4` to `https://open.bigmodel.cn/api/coding/paas/v4`. Existing `zai:manual` credential/profile must remain unchanged.
- This remediation pass permits only local/read-only prechecks and postchecks around the baseUrl change. No model invocation, provider smoke/request, retry, credential refresh/re-entry, alternate GLM, Codex/Qwen invocation or other runtime/config mutation is authorized.
- A successful local endpoint remediation does NOT prove provider functionality. Any subsequent GLM smoke requires a separate human gate and exactly one invocation.
- Current BigModel CN documentation also explains the operator's morning quota observation: high-end models have higher peak-period consumption, with peak defined as 14:00–18:00 UTC+8. Future quota/time-window policy remains issue #19 and is not active runtime.
- No core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring or billing is authorized in this pass.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
