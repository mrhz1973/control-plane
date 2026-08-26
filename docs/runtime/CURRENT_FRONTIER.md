# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `GLM-ZAI-VPS-CREDENTIAL-CONFIG` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / CREDENTIAL_CONFIG` |
| **GATE CORRENTE** | `GLM_ZAI_VPS_CREDENTIAL_CONFIG_GATE_REQUIRED` |
| **NEXT** | authorize bounded GLM/Z.AI credential configuration on VPS OpenClaw, then read-only provider verification; no gateway/service, n8n wiring, Codex retry, Qwen mutation, or broader runtime activation |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` at `/opt/openclaw-app`; gateway non attivo |
| **CODEX OAUTH VPS** | PASS |
| **CODEX DIRECT SMOKE VPS** | PASS — exactly one local inference; exit `0`; marker matched; no retry |
| **CODEX PROVIDER AFTER SMOKE** | configured / usable |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `1` total Codex VPS smoke invocation |
| **LATEST EVIDENCE** | `CODEX_VPS_DIRECT_SMOKE = PASS`; evidence commit `ef6a5a43eeb2a1bd13f02f9be68887b414c7ae15` |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows auth copied `false` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / CODEX_AUTHENTICATED_AND_SMOKE_PASS / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: PASS · GLM VPS: BLOCKED_MISSING_AUTH · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
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
- Il prossimo gate è umano e riguarda esclusivamente configurazione credenziali GLM/Z.AI sul VPS OpenClaw e verifica provider immediatamente successiva.
- Nessun gateway/service, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing, Qwen o broader runtime activation è autorizzato.
- Nessuna seconda invocazione Codex è autorizzata da questo frontier update.
- Nessun secret/token deve entrare in GitHub o log persistenti.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- WF40/42 invariati; WF41 off; wf47 invariato (inactive/unpublished, Schedule disabled, `enable_wg48_handoff=false`).

## Puntatori

- Active work: GitHub issue **#8**
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
