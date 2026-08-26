# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-ENDPOINT-PRODUCT-COMPATIBILITY` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / COMMON_PROVIDER_ENDPOINT_PATH` |
| **GATE CORRENTE** | `GLM_ZAI_ENDPOINT_PRODUCT_COMPATIBILITY_GATE_REQUIRED` |
| **NEXT** | diagnose and, only if separately authorized, remediate the common Z.AI endpoint/product path used by GLM 5.3 and 5.2; no further model retries before that gate |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 STATUS** | BLOCKED/deferred · repaired credential reaches provider · exact smoke returns HTTP 500 on general API path |
| **GLM 5.2 STATUS** | BLOCKED · exact ref visible · exactly one smoke returns same HTTP 500 on same general API path |
| **COMMON Z.AI REQUEST PATH** | `https://api.z.ai/api/paas/v4/chat/completions` |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile/provider preserved |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `4` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_52_DIRECT_SMOKE_EXACT = BLOCKED`; evidence commit `1ab838de338e8d6f48ecba60482db9a2e160eceb`; provider HTTP 500 |
| **PLANNER SMOKE** | Codex PASS · GLM 5.3 BLOCKED · GLM 5.2 BLOCKED · common endpoint/product compatibility gate required · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Exact `zai/glm-5.2` was locally visible and exactly one authorized smoke was executed; it returned the same HTTP 500 Internal service error observed with GLM 5.3 on the same general API path.
- Therefore the current blocker is no longer model-specific. The common endpoint/product/provider path is the leading compatibility hypothesis.
- No retry, no GLM 5.1/5 fallback, no further model invocation and no endpoint/baseUrl mutation is authorized before the next gate.
- The repaired Z.AI credential remains structurally single/nonduplicated; profile/provider remain present; gateway remains inactive and port `18789` free.
- Issue #19 remains DEFERRED: no automatic quota-aware switching or silent fallback is active.
- No credential/auth/config mutation, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring or billing is authorized.
- No secret/token may appear in GPT Web, Cursor chat, GitHub, argv or persisted logs.
- No PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop or public Telegram Trigger implicit.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
