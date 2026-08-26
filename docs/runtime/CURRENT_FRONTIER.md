# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-5.2-FALLBACK-SMOKE` |
| **STATO BLOCCO** | `AUTHORIZED / ONE_BOUNDED_MODEL_INVOCATION_PENDING` |
| **GATE CORRENTE** | `GLM_ZAI_52_DIRECT_SMOKE_AUTHORIZED` |
| **NEXT** | read-only confirm exact `zai/glm-5.2` availability; if present execute exactly one bounded direct smoke; if absent STOP; no retry, further fallback or endpoint change |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 STATUS** | BLOCKED/deferred for current critical path · repaired credential reaches provider but 5.3 returns HTTP 500 on general API path · endpoint/product compatibility unresolved |
| **GLM 5.2 TARGET** | operator-selected manual fallback · exact installed model ref must be confirmed before invocation |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile/provider preserved |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `3` total smoke attempts so far · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_POST_REMEDIATION_SMOKE_EXACT_53 = BLOCKED`; evidence commit `74f7b84d4a07442f06e26562538cfc8e04590427`; provider HTTP 500 |
| **PLANNER SMOKE** | Codex PASS · GLM 5.3 blocked/deferred · exactly one GLM 5.2 smoke authorized subject to exact-ref precheck · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- L'operatore ha autorizzato esattamente una minimal direct smoke invocation dell'esatto `zai/glm-5.2` come fallback manuale a GLM 5.3.
- Prima della invocation deve essere confermata read-only la presenza dell'esatto model ref `zai/glm-5.2`; se non è presente, STOP senza sostituzioni implicite.
- Se presente, è autorizzata esattamente una sola smoke 5.2 con postcheck read-only; nessun retry automatico o seconda invocation.
- Nessun fallback a GLM 5.1/5 o altri modelli è autorizzato. La policy automatica issue #19 resta DEFERRED e inattiva.
- Nessuna modifica endpoint/baseUrl, credential/auth/config mutation, Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring o billing è autorizzata.
- Se la smoke fallisce, STOP senza retry e persistere il blocker sanitizzato.
- Nessun secret/token può apparire in GPT Web, Cursor chat, GitHub, argv o log persistenti.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** remains `DEFERRED` for automatic quota-aware switching
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
