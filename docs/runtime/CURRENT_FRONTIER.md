# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-PROVIDER-AUTH-DIAGNOSIS` |
| **STATO BLOCCO** | `AUTHORIZED / BOUNDED_READ_ONLY_DIAGNOSIS_PENDING` |
| **GATE CORRENTE** | `GLM_ZAI_PROVIDER_AUTH_DIAGNOSIS_AUTHORIZED` |
| **NEXT** | bounded read-only diagnosis of Z.AI credential/provider/endpoint/piano compatibility after provider HTTP 401 persisted even after credential refresh; no authenticated test or mutation |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 REF** | `zai/glm-5.3` visible |
| **Z.AI AUTH REFRESH** | PASS locally · profile present · provider listed available |
| **GLM 5.3 POST-REFRESH SMOKE** | BLOCKED · exactly one post-refresh invocation · provider HTTP 401 · no retry |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `2` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_VPS_DIRECT_SMOKE_RETRY_EXACT_53 = BLOCKED`; evidence commit `a3f0635173ba092f68ddc7b3ba1f38c921dea31d` |
| **PLANNER SMOKE** | Codex PASS · GLM provider/auth diagnosis authorized · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- L'operatore ha autorizzato esclusivamente diagnosi bounded e read-only del rifiuto provider Z.AI dopo refresh credenziale.
- Sono consentite soltanto verifiche locali/sanitizzate di config, provider/plugin, auth method, endpoint target previsto, documentazione/metadata ufficiale installata e requisiti del tipo di credenziale/piano.
- Nessuna model invocation, provider request autenticata di test, credential refresh/re-entry, auth/config mutation, core/plugin upgrade, fallback GLM, Codex/Qwen invocation, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring o billing è autorizzata.
- Se la diagnosi richiede una modifica o un test autenticato, STOP e classificare il gate successivo prima di eseguirlo.
- Nessun secret/token deve essere esposto, stampato o persistito.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
