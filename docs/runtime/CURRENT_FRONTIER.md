# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `ZAI-OFFICIAL-ENDPOINT-AUTODETECT-DIAGNOSIS` |
| **STATO BLOCCO** | `BLOCKED / ALL_FOUR_OFFICIAL_PRIMARY_SURFACES_HTTP500 / BOUNDED_READ_ONLY_DIAGNOSTIC_LOOP_COMPLETE` |
| **GATE CORRENTE** | `ZAI_PROVIDER_ACCOUNT_PLAN_ENTITLEMENT_SUPPORT_GATE_REQUIRED` |
| **NEXT** | real human/provider-side gate: verify the existing account/key Coding Plan entitlement and provider routing with Z.AI/BigModel support using the sanitized four-surface matrix evidence. Do not issue another provider/model request and do not change credentials, auth, billing, config, profile, baseUrl, model catalog or runtime without a new explicit authorization. |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **CURRENT Z.AI PROFILE** | provider `zai` · profile `zai:manual` · auth `api_key` |
| **CURRENT BIGMODEL CN BASE URL** | `https://open.bigmodel.cn/api/coding/paas/v4` |
| **CURRENT API STYLE / ADAPTER** | `openai-completions` · `zai openai-completions wrapZaiStreamFn` |
| **OFFICIAL CONFIG DELTA DIAGNOSIS** | PASS · `CURRENT_CONFIG_SEMANTICALLY_MATCHES_OFFICIAL_CODING_PLAN_CN` |
| **REGIONAL GLM 5.3 SMOKE** | BLOCKED · exact `zai/glm-5.3` · observed effective model `zai/glm-5.3` · exact URL `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` · HTTP 500 · one invocation · zero retry/fallback · no mutation |
| **REGIONAL GLM 5.3 EVIDENCE** | commit `57534fc5f9787d94a377a6fe901c7123495bd0f5`; blocker `BLOCKED_BIGMODEL_CN_GLM53_HTTP500` |
| **OPENCLAW UPSTREAM GLM 5.3 SUPPORT** | merged PR #123523 / issue #123522 confirm first-class GLM 5.3 Coding Plan support; maintainer evidence reports a live Coding Plan completion HTTP 200 and a live isolated OpenClaw agent path with `zai/glm-5.3` |
| **OPENCLAW ZAI ENDPOINT DETECTOR** | current `extensions/zai/detect.ts` probes General Global `glm-5.2`, General CN `glm-5.2`, Coding Global `glm-5.3`, Coding CN `glm-5.3`; each request uses `stream=false`, `max_tokens=1`, message `ping`; it stops at first success |
| **FALLBACK PROBE RULE** | detector tries `glm-5.1` / `glm-4.7` only after model-unsupported evidence (404 or supported model-error codes/patterns). Generic HTTP 500 does not trigger those fallback candidates. With all primary probes returning 500, the bounded primary matrix is exactly four requests. |
| **PRIMARY AUTODETECT MATRIX** | BLOCKED · General Global `glm-5.2` HTTP 500 · General CN `glm-5.2` HTTP 500 · Coding Global `glm-5.3` HTTP 500 · Coding CN `glm-5.3` HTTP 500 · exactly four requests · zero retry/redirect · stop `ALL_OFFICIAL_PRIMARY_SURFACES_FAILED` |
| **BOUNDED DIAGNOSTIC LOOP** | COMPLETE `3/3` · zero post-matrix provider/model calls · round 1 installed detector/routing/profile metadata match · round 2 NTP/DNS/TLS pass · round 3 deterministic synthesis · no remediation applied |
| **OPERATOR AUTHORIZATION** | 2026-08-26 · issue #8 comment `5429724710` · authorized primary matrix and bounded read-only loop consumed |
| **ROOT CAUSE CLASSIFICATION** | `PROVIDER_OR_ACCOUNT_SPECIFIC_UPSTREAM_FAILURE_ACROSS_ALL_OFFICIAL_PRIMARY_SURFACES`; local static endpoint/model/request mapping, profile metadata, clock, DNS and TLS do not explain the uniform HTTP 500 result |
| **CANDIDATE REMEDIATION** | `PROVIDER_ACCOUNT_PLAN_ENTITLEMENT_SUPPORT_VERIFICATION` · not applied · requires the current real human/provider-side gate |
| **Z.AI CREDENTIAL** | preserved; no re-entry/change; secret must not be printed, logged, hashed, measured or persisted |
| **GLM TEST QUOTA/BILLING POLICY** | TEST PHASE: token conservation and incidental billing for minimal diagnostic text requests are non-blocking per operator. Invocation counts remain bounded for diagnostic determinism. PRODUCTION PHASE: quota-aware routing deferred to issue #19. |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER / TEST INVOCATIONS** | current task: Codex planner `4` turns through schema-valid packet r4 · Z.AI primary probes `4` · post-matrix provider/model calls `0`; prior evidence counts remain GLM OpenClaw `8`, direct raw BigModel control `1`, Qwen `0` |
| **LATEST EVIDENCE** | execution packet `docs/runtime/ISSUE_8_ZAI_AUTODETECTION_PACKET.yaml`; all four official primary surfaces returned HTTP 500; bounded offline diagnostic loop exhausted its three rounds and stopped at `ZAI_PROVIDER_ACCOUNT_PLAN_ENTITLEMENT_SUPPORT_GATE_REQUIRED` |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The operator-authorized official Z.AI primary endpoint detector matrix was consumed exactly once on 2026-08-26: four ordered calls, all HTTP 500, zero retry/redirect.
- The already-stored `zai:manual` credential may be used only in-process. Never print/persist API key, token, Authorization values, secret fragments, secret length or secret hashes.
- No config/auth/profile/baseUrl/model-catalog mutation, credential refresh/re-entry/replacement, onboarding write, plugin/core upgrade, `doctor --fix`, gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, runtime wiring or permanent scheduling is authorized by this gate.
- `NO_MORE_MANUAL_ONE_OFF_PROBES`: no further Z.AI/provider/model call is authorized after the exhausted matrix.
- The required task-bounded Cursor diagnostic loop completed all three read-only rounds with zero additional provider/model calls. It excluded observed local static routing/profile/clock/DNS/TLS faults and identified only a provider/account-plan support verification candidate; it applied no remediation.
- A new real human/provider-side gate is required before contacting support with any non-sanitized account data, changing credentials/auth/billing/config, implementing remediation or issuing another provider/model request.
- Planner-generated Cursor Execution Packets remain governed by `docs/contracts/execution-packet-v1.md` and `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`; GPT Web remains strategic backlog owner rather than silent implementer-prompt author.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Operator authorization audit: issue **#8**, comment `5429724710`
- Current execution packet: `docs/runtime/ISSUE_8_ZAI_AUTODETECTION_PACKET.yaml`
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor packet contract: `docs/contracts/execution-packet-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
