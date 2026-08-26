# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `GLM-ZAI-VERSION-RESOLUTION` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / PLANNER_VERSION_DECISION` |
| **GATE CORRENTE** | `GLM_ZAI_VERSION_RESOLUTION_GATE_REQUIRED` |
| **NEXT** | decide whether to investigate an exact GLM 5.3 provider/model path without model invocation, or explicitly revise the planner target to a currently exposed Z.AI model under a separate contract/version decision; no silent substitution |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` at `/opt/openclaw-app`; gateway non attivo |
| **CODEX OAUTH VPS** | PASS |
| **CODEX DIRECT SMOKE VPS** | PASS — exactly one local inference; exit `0`; marker matched; no retry |
| **CODEX PROVIDER AFTER SMOKE** | configured / usable |
| **GLM/Z.AI VPS AUTH** | PASS — configured; profile present; provider `zai` available |
| **Z.AI PROVIDER PLUGIN** | installed — official `@openclaw/zai-provider@2026.7.1` |
| **GLM/Z.AI DIRECT SMOKE** | BLOCKED BEFORE INVOCATION — exact canonical `GLM 5.3` model id not exposed by authenticated Z.AI catalog |
| **Z.AI MODELS OBSERVED** | `glm-4.5*`, `glm-4.6*`, `glm-4.7*`, `glm-5`, `glm-5-turbo`, `glm-5.1`, `glm-5.2`, `glm-5v-turbo`; no `glm-5.3` |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `1` Codex VPS smoke total · `0` GLM/Z.AI invocations |
| **LATEST EVIDENCE** | `GLM_ZAI_VPS_DIRECT_SMOKE = BLOCKED`; evidence commit `733973160244b2826b4e06ad4978eac7cfb90711`; blocker `BLOCKED_EXACT_GLM53_MODEL_NOT_AVAILABLE` |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows credential state copied `false` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / CODEX_AUTHENTICATED_AND_SMOKE_PASS / GLM_AUTHENTICATED_BUT_EXACT_MODEL_UNRESOLVED / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: PASS · GLM VPS: BLOCKED_EXACT_GLM53_MODEL_NOT_AVAILABLE · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- `CODEX_VPS_DIRECT_SMOKE` resta PASS; provider Codex usable; gateway false; port `18789` free.
- `GLM_ZAI_VPS_CREDENTIAL_CONFIG` resta PASS; provider `zai` configurato/disponibile; plugin ufficiale installato; nessun secret persistito.
- `GLM_ZAI_VPS_DIRECT_SMOKE` non ha invocato alcun modello: discovery read-only non ha trovato l'esatto modello canonico GLM 5.3 nel catalogo Z.AI esposto.
- Nessuna sostituzione silenziosa con `glm-5.2`, `glm-5.1`, `glm-5` o altra versione è consentita: `planner-routing-policy-v1` canonizza GLM 5.3 e richiede fallback esplicito/policy-driven.
- Il prossimo gate è umano e riguarda soltanto la risoluzione della versione/provider target; nessuna model invocation è implicita.
- Nessun retry, gateway/service, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing, Qwen o broader runtime activation è autorizzato.
- Nessuna ulteriore invocazione Codex è autorizzata.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- WF40/42 invariati; WF41 off; wf47 invariato.

## Puntatori

- Active work: GitHub issue **#8**
- Future research backlog: GitHub issue **#18 — DeepSeek-OCR-2 for LLM context compression** (`DEFERRED / NOT ON CURRENT CRITICAL PATH`)
- Planner routing contract: `docs/contracts/planner-routing-policy-v1.md`
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
