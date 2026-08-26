# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `ZAI-OFFICIAL-ENDPOINT-AUTODETECT-DIAGNOSIS` |
| **STATO BLOCCO** | `OPERATOR_AUTHORIZED / MAX_FOUR_MINIMAL_PROVIDER_PROBES / PENDING_EXECUTION` |
| **GATE CORRENTE** | `ZAI_OFFICIAL_ENDPOINT_AUTODETECT_PROBE_AUTHORIZED` |
| **NEXT** | execute one bounded read-only reproduction of the current OpenClaw Z.AI endpoint-detection primary probe matrix using the already-stored `zai:manual` credential in-process only: General Global `glm-5.2`, General CN `glm-5.2`, Coding Global `glm-5.3`, Coding CN `glm-5.3`; `stream=false`, `max_tokens=1`, stop at first HTTP-success, maximum four provider requests, no config/auth/profile/runtime mutation, persist sanitized endpoint/model/status only. If all four official primary surfaces fail, stop manual one-off probing and route the next stage to a bounded Cursor diagnostic loop with optional frontier-model assistance, explicit round/scope bounds, deterministic evidence and checkpointing. |
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
| **POST-MATRIX FAILURE ROUTING** | if all official primary surfaces fail, `NO_MORE_MANUAL_ONE_OFF_PROBES`; next diagnostic stage = bounded Cursor loop, frontier model optional, systematic diagnosis/candidate remediation within explicit limits; credential/auth/billing/destructive/production/runtime mutations still require a new real gate |
| **OPERATOR AUTHORIZATION** | 2026-08-26 · issue #8 comment `5429724710` · primary matrix authorized exactly as bounded above |
| **ROOT CAUSE CLASSIFICATION** | regional CN path/model/config are proven correct at request routing level, but provider returns HTTP 500 while upstream live evidence proves the provider/model path can succeed. Highest-value next discriminator remains key/account endpoint-region auto-detection. |
| **Z.AI CREDENTIAL** | preserved; no re-entry/change; secret must not be printed, logged, hashed, measured or persisted |
| **GLM TEST QUOTA/BILLING POLICY** | TEST PHASE: token conservation and incidental billing for minimal diagnostic text requests are non-blocking per operator. Invocation counts remain bounded for diagnostic determinism. PRODUCTION PHASE: quota-aware routing deferred to issue #19. |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER / TEST INVOCATIONS** | Codex `1` · GLM `8` OpenClaw historical/current smoke attempts including regional 5.3 · direct raw BigModel control `1` · Qwen `0`; authorization persistence itself issued no new provider request |
| **LATEST EVIDENCE** | `GLM_BIGMODEL_CN_REGIONAL_53_DIAGNOSTIC_SMOKE = BLOCKED`; HTTP 500 on exact Coding CN URL/model; upstream OpenClaw GLM 5.3 support is merged/live-verified; endpoint detector source establishes the authorized four-probe discriminator |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- The operator explicitly authorized the official Z.AI primary endpoint detector matrix on 2026-08-26. This removes the previous human gate for those maximum four provider calls only.
- Authorized matrix: General Global `glm-5.2` → General CN `glm-5.2` → Coding Global `glm-5.3` → Coding CN `glm-5.3`; `stream=false`, `max_tokens=1`, stop at first HTTP-success.
- The already-stored `zai:manual` credential may be used only in-process. Never print/persist API key, token, Authorization values, secret fragments, secret length or secret hashes.
- No config/auth/profile/baseUrl/model-catalog mutation, credential refresh/re-entry/replacement, onboarding write, plugin/core upgrade, `doctor --fix`, gateway/service activation, n8n/Docker/Tailscale/firewall/reverse-proxy mutation, runtime wiring or permanent scheduling is authorized by this gate.
- If all four official primary surfaces fail, **do not continue with manual one-off provider probes**. The next diagnostic stage must be a task-bounded Cursor loop with explicit scope, maximum rounds, deterministic evidence and checkpoint policy. A frontier model inside Cursor may be used as diagnostician/reviewer if useful.
- That future Cursor diagnostic loop may investigate root cause and candidate remediation, but it may not cross credential/auth/billing/destructive/production/runtime mutation boundaries without a new real gate.
- Planner-generated Cursor Execution Packets remain governed by `docs/contracts/execution-packet-v1.md` and `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`; GPT Web remains strategic backlog owner rather than silent implementer-prompt author.
- Issue #8 remains an evidence backlog; `CURRENT_FRONTIER.md` owns live state. Issue #19 remains DEFERRED for production quota-aware policy.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Operator authorization audit: issue **#8**, comment `5429724710`
- Future research: issue **#18** (`DEFERRED`)
- Future production quota/time-window policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor packet contract: `docs/contracts/execution-packet-v1.md`
- Cursor execution contract: `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
