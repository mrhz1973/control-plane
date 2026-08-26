# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-ENDPOINT-PRODUCT-COMPATIBILITY` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / ENDPOINT_PRODUCT_COMPATIBILITY` |
| **GATE CORRENTE** | `GLM_ZAI_ENDPOINT_PRODUCT_COMPATIBILITY_GATE_REQUIRED` |
| **NEXT** | determine and, only if explicitly authorized, remediate the Z.AI endpoint/product compatibility for exact `zai/glm-5.3`; no retry before that gate |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 REF** | `zai/glm-5.3` visible |
| **Z.AI CREDENTIAL REMEDIATION** | PASS · stored credential single/nonduplicated · profile/provider/model ref preserved |
| **GLM 5.3 POST-REMEDIATION SMOKE** | BLOCKED · exactly one invocation · provider HTTP 500 Internal service error · no retry |
| **OBSERVED REQUEST PATH** | general API `https://api.z.ai/api/paas/v4/chat/completions` |
| **Z.AI ENDPOINT FACTOR** | unresolved but now primary compatibility hypothesis: installed docs identify Coding Plan path for GLM 5.3 while effective request used general API |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `3` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_POST_REMEDIATION_SMOKE_EXACT_53 = BLOCKED`; evidence commit `74f7b84d4a07442f06e26562538cfc8e04590427`; blocker `BLOCKED_ZAI_PROVIDER_HTTP_500_INTERNAL_SERVICE_ERROR` |
| **PLANNER SMOKE** | Codex PASS · GLM blocked pending endpoint/product compatibility gate · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Credential remediation PASS: il precedente double-paste è stato corretto e la credenziale salvata è strutturalmente singola/nonduplicata.
- La singola smoke post-remediation non ha più restituito HTTP 401; ha raggiunto il provider sul general API path e ha ricevuto HTTP 500 Internal service error, senza testo e senza retry.
- Questo stato non giustifica un'altra smoke alla cieca. Il prossimo gate riguarda la compatibilità endpoint/prodotto per GLM 5.3.
- La diagnosi precedente ha già rilevato che la documentazione installata descrive GLM 5.3 come Coding Plan-oriented, mentre il path effettivo osservato resta il general API path. Prima di qualsiasi endpoint mutation deve essere stabilita la compatibilità del tipo/sorgente della key con il prodotto target.
- Nessuna nuova model invocation, retry, fallback GLM, endpoint/baseUrl mutation, credential/auth/config mutation, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring o billing è autorizzata.
- Nessun secret/token può apparire in GPT Web, Cursor chat, GitHub, argv o log persistenti.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
