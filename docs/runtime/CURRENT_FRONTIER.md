# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-5.2-FALLBACK-SMOKE` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / ONE_BOUNDED_MODEL_INVOCATION` |
| **GATE CORRENTE** | `GLM_ZAI_52_DIRECT_SMOKE_GATE_REQUIRED` |
| **NEXT** | operator-selected manual fallback path: read-only verify exact `zai/glm-5.2` availability, then if explicitly authorized execute exactly one bounded direct smoke; no automatic switching or further fallback |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **GLM 5.3 STATUS** | BLOCKED for current critical path · repaired credential reaches provider but exact 5.3 smoke returns HTTP 500 on general API path; endpoint/product compatibility unresolved and deferred |
| **GLM 5.2 TARGET** | operator-selected manual fallback candidate; exact installed model ref must be confirmed read-only before invocation |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile/provider preserved |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `3` total smoke attempts so far · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_POST_REMEDIATION_SMOKE_EXACT_53 = BLOCKED`; evidence commit `74f7b84d4a07442f06e26562538cfc8e04590427`; provider HTTP 500 |
| **PLANNER SMOKE** | Codex PASS · GLM 5.3 blocked/deferred · GLM 5.2 manual fallback smoke requires explicit gate · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- L'operatore ha deciso di non investire ulteriore tempo sul percorso GLM 5.3 se resta problematico e di usare GLM 5.2 come fallback manuale corrente.
- Questa decisione NON attiva la policy automatica dell'issue #19: nessuno switch automatico, nessuna ladder 5.2→5.1→5 e nessun fallback silenzioso.
- Prima di una invocation GLM 5.2 deve essere confermata read-only la presenza dell'esatto model ref `zai/glm-5.2`; se non è presente, STOP senza sostituzioni implicite.
- La prossima eventuale invocation deve essere esattamente una smoke bounded di GLM 5.2 con nessun retry, nessun secondo modello e nessuna modifica auth/config/endpoint.
- Il problema endpoint/product di GLM 5.3 resta documentato ma DEFERRED dal critical path corrente; nessuna endpoint/baseUrl mutation è autorizzata.
- Nessuna nuova model invocation, retry, GLM 5.1/5 fallback, Codex/Qwen invocation, credential/auth/config mutation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring o billing è autorizzata prima del gate.
- Nessun secret/token può apparire in GPT Web, Cursor chat, GitHub, argv o log persistenti.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** remains `DEFERRED` for automatic quota-aware switching
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
