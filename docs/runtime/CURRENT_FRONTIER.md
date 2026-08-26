# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-CREDENTIAL-REMEDIATION` |
| **STATO BLOCCO** | `AUTHORIZED / BOUNDED_AUTH_MUTATION_PENDING` |
| **GATE CORRENTE** | `GLM_ZAI_CREDENTIAL_REMEDIATION_AUTHORIZED` |
| **NEXT** | replace only the malformed stored Z.AI credential in `zai:manual` using secure operator entry; then local read-only structural verification; no model/provider test and no endpoint change |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 REF** | `zai/glm-5.3` visible |
| **Z.AI DIAGNOSIS** | PASS · root cause confirmed: stored credential malformed by double-paste; env overrides absent |
| **Z.AI ENDPOINT FACTOR** | secondary/unresolved: installed docs identify Coding Plan path for GLM 5.3 while effective path observed general API; endpoint must remain unchanged in this pass |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `2` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_PROVIDER_AUTH_READ_ONLY_DIAGNOSIS = PASS`; evidence commit `d068941c0caf9157e60739b4de834a85af25f114` |
| **PLANNER SMOKE** | Codex PASS · GLM blocked pending credential repair evidence · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- L'operatore ha autorizzato esclusivamente la sostituzione della credenziale Z.AI malformata nel profilo `zai:manual`, con input interattivo sicuro e non registrato.
- La credenziale deve essere acquisita via `read -s` e passata a OpenClaw via stdin; nessun secret può comparire in GPT Web, Cursor chat, GitHub, argv, stdout persistente o log.
- Dopo la sostituzione sono consentiti soltanto postcheck locali read-only: presenza profilo/auth/provider/model ref, integrità strutturale non-secret, gateway false e porta `18789` libera.
- Nessuna model invocation, provider request autenticata, smoke test, retry automatico, modifica endpoint/baseUrl/Coding Plan path, fallback GLM, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring o billing è autorizzata.
- Se la sola correzione credenziale non è sufficiente o richiede endpoint/config/test autenticato, STOP e classificare il gate successivo.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
