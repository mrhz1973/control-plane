# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8** |
| **BLOCCO ATTIVO** | `GLM-ZAI-CODING-PLAN-ENDPOINT-BINDING` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / CONFIG_ENDPOINT_REMEDIATION` |
| **GATE CORRENTE** | `GLM_ZAI_CODING_PLAN_ENDPOINT_REMEDIATION_GATE_REQUIRED` |
| **NEXT** | remediate only the Z.AI provider/product binding so the existing Coding Plan credential uses the Coding Plan endpoint/path; then local read-only verification; no model retry until a later gate |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; gateway inactive |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **CODEX VPS** | OAuth PASS · direct smoke PASS |
| **Z.AI KEY SOURCE** | OPERATOR-CONFIRMED via account screenshots: key used for `Control Plane` was created under the GLM Coding Plan / Model & Personal Coding Plan area; no secret value persisted |
| **GLM CODING PLAN** | active plan shown valid; key source is Coding Plan rather than general API platform |
| **GLM 5.3 STATUS** | BLOCKED/deferred · repaired credential reached provider but request used general API path and returned HTTP 500 |
| **GLM 5.2 STATUS** | BLOCKED · exact ref visible · exactly one smoke used same general API path and returned same HTTP 500 |
| **COMMON OBSERVED PATH** | general API `https://api.z.ai/api/paas/v4/chat/completions` |
| **ROOT CAUSE CLASSIFICATION** | product/endpoint binding mismatch is now strongly supported: Coding Plan credential is being sent through the general API path |
| **Z.AI CREDENTIAL** | repaired · stored credential single/nonduplicated · profile/provider preserved |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATIONS** | Codex `1` · GLM `4` total smoke attempts · Qwen `0` |
| **LATEST EVIDENCE** | `GLM_ZAI_52_DIRECT_SMOKE_EXACT = BLOCKED`; evidence commit `1ab838de338e8d6f48ecba60482db9a2e160eceb`; provider HTTP 500 |
| **PLANNER SMOKE** | Codex PASS · GLM blocked pending Coding Plan endpoint remediation · Qwen 3.8 37B blocked missing model |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Le schermate operatore confermano che la key `Control Plane` appartiene al GLM Coding Plan. Nessun valore di key/API secret viene riportato o persistito.
- Le smoke 5.3 e 5.2 hanno entrambe usato il general API path e restituito HTTP 500; il blocker è quindi comune al binding endpoint/prodotto e non specifico del modello.
- La prossima modifica possibile è esclusivamente il binding/provider/base endpoint necessario a usare il percorso Coding Plan corretto con la credenziale esistente; questa è una config mutation e richiede gate umano esplicito.
- Nessuna model invocation, provider smoke, retry, fallback 5.1/5, credential refresh/re-entry o ulteriore secret handling è autorizzata nel pass di remediation endpoint.
- Issue #19 resta DEFERRED: nessun automatic model switching o silent fallback.
- Nessun Codex/Qwen invocation, core/plugin upgrade, doctor --fix, gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy, runtime wiring o billing è autorizzato.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: issue **#8**
- Future research: issue **#18** (`DEFERRED`)
- Future quota policy: issue **#19** (`DEFERRED`)
- Planner routing: `docs/contracts/planner-routing-policy-v1.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
