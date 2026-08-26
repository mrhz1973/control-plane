# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-PROVIDER-AUTH-REJECTED-AFTER-REFRESH` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / PROVIDER_AUTH_DIAGNOSIS` |
| **GATE CORRENTE** | `GLM_ZAI_PROVIDER_AUTH_REJECTED_AFTER_REFRESH_GATE_REQUIRED` |
| **NEXT** | bounded diagnosis of Z.AI credential/provider compatibility after a newly refreshed credential was still rejected by the provider; no further credential mutation or model invocation until diagnosis is complete |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 REF** | `zai/glm-5.3` visible |
| **Z.AI AUTH REFRESH** | PASS locally · profile present · provider listed available |
| **GLM 5.3 POST-REFRESH SMOKE** | BLOCKED · exactly one invocation · provider returned HTTP 401 · no retry |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `2` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_VPS_DIRECT_SMOKE_RETRY_EXACT_53 = BLOCKED`; evidence commit `a3f0635173ba092f68ddc7b3ba1f38c921dea31d`; blocker `BLOCKED_ZAI_AUTH_401_TOKEN_EXPIRED_OR_INCORRECT` |
| **PLANNER SMOKE** | Codex PASS · GLM blocked pending provider/auth diagnosis · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Il refresh credenziale Z.AI ha completato correttamente il salvataggio locale, ma il provider ha rifiutato anche la successiva singola smoke invocation con HTTP 401.
- Questo stato non giustifica un terzo smoke o un altro refresh alla cieca.
- Il prossimo passo richiede diagnosi bounded della compatibilità tra credenziale, provider/endpoint Z.AI atteso da OpenClaw e accesso al modello/piano; nessun secret deve essere esposto o persistito.
- Nessuna nuova model invocation, credential mutation, fallback GLM, Codex/Qwen invocation, gateway/service activation, auth/config/core/plugin mutation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring, billing o broader runtime activation è autorizzata.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
