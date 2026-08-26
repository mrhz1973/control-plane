# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `GLM-ZAI-VPS-DIRECT-SMOKE` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / MODEL_INVOCATION` |
| **GATE CORRENTE** | `GLM_ZAI_VPS_DIRECT_SMOKE_GATE_REQUIRED` |
| **NEXT** | authorize exactly one minimal direct GLM/Z.AI smoke on VPS through authenticated OpenClaw; no retry, gateway/service, n8n wiring, Codex invocation, Qwen mutation, or broader runtime activation |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` at `/opt/openclaw-app`; gateway non attivo |
| **CODEX OAUTH VPS** | PASS |
| **CODEX DIRECT SMOKE VPS** | PASS — exactly one local inference; exit `0`; marker matched; no retry |
| **CODEX PROVIDER AFTER SMOKE** | configured / usable |
| **GLM/Z.AI VPS AUTH** | PASS — configured; profile present; provider `zai` available |
| **Z.AI PROVIDER PLUGIN** | installed — official `@openclaw/zai-provider@2026.7.1`; required for provider exposure during credential-config pass |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `1` total Codex VPS smoke invocation; `0` GLM/Z.AI invocations so far |
| **LATEST EVIDENCE** | `GLM_ZAI_VPS_CREDENTIAL_CONFIG = PASS`; evidence commit `bef0df643c0bc1b8e2e6c897b1b40a7313b7c016` |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows credential state copied `false` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / CODEX_AUTHENTICATED_AND_SMOKE_PASS / GLM_AUTHENTICATED / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: PASS · GLM VPS: READY_PENDING_GATE · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- `CODEX_VPS_DIRECT_SMOKE` è PASS: una sola invocazione locale OpenClaw, exit `0`, risposta marker corretta, zero retry; provider Codex resta usable; gateway resta false; port `18789` free.
- `GLM_ZAI_VPS_CREDENTIAL_CONFIG` è PASS: provider `zai` configurato, profilo presente, provider disponibile; zero model invocation durante il pass; gateway resta false; port `18789` free.
- Durante il credential-config pass è stato installato il provider plugin ufficiale `@openclaw/zai-provider@2026.7.1`, necessario perché OpenClaw non esponeva il provider Z.AI senza provider plugin. Nessun secret è stato persistito in GitHub.
- Il prossimo gate è umano: autorizzare esattamente **una** minimal direct GLM/Z.AI smoke invocation sul VPS tramite OpenClaw autenticato.
- Nessun retry automatico o seconda invocazione se lo smoke fallisce o è inconcludente.
- Nessun gateway/service, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing, Qwen o broader runtime activation è autorizzato.
- Nessuna ulteriore invocazione Codex è autorizzata.
- Nessun secret/token deve entrare in GitHub, chat Cursor, stdout persistente o log persistenti.
- Dopo il singolo GLM/Z.AI smoke: verify provider/auth read-only, gateway `false`, port `18789` free, persist `LAST_CURSOR_REPORT.md`, quindi STOP sul prossimo gate.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- WF40/42 invariati; WF41 off; wf47 invariato (inactive/unpublished, Schedule disabled, `enable_wg48_handoff=false`).

## Puntatori

- Active work: GitHub issue **#8**
- Future research backlog: GitHub issue **#18 — DeepSeek-OCR-2 for LLM context compression** (`DEFERRED / NOT ON CURRENT CRITICAL PATH`)
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
