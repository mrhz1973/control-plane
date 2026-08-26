# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-CODEX-OAUTH-RECOVERY` |
| **STATO BLOCCO** | `BLOCKED / CALLBACK_TUNNEL_OAUTH_FAILED` |
| **GATE CORRENTE** | `OAUTH_CALLBACK_RECOVERY_RETRY_GATE_REQUIRED` |
| **NEXT** | autorizzare un solo nuovo OAuth `openai-codex` sul VPS con tunnel loopback temporaneo `PC 127.0.0.1:1455 -> VPS 127.0.0.1:1455`, ma con console interattiva OAuth chiaramente visibile all'operatore e senza logging persistente dell'URL/callback; verify auth/provider, chiusura tunnel e persistenza evidence |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` at `/opt/openclaw-app`; gateway non attivo |
| **CODEX OAUTH VPS** | `missing` — callback tunnel recovery attempt BLOCKED; tunnel bind riuscito, login non completato, auth/profile/provider restano missing |
| **CALLBACK TUNNEL EVIDENCE** | PASS bind/cleanup — `SSH_TUNNEL_BIND=true`; exactly one OAuth invocation; local/VPS 1455 free after exit; no OAuth process remains |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `0` |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows auth copied `false` |
| **LATEST EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` — `VPS_CODEX_OAUTH_CALLBACK_TUNNEL_RECOVERY = BLOCKED`; evidence commit `7e87c432536b72dd0174d577ee57cda70a7f7ce0` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / CODEX_NOT_AUTHENTICATED / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: BLOCKED_PENDING_OAUTH · GLM VPS: BLOCKED_MISSING_AUTH · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Il recovery OAuth con tunnel è terminato `BLOCKED_CALLBACK_TUNNEL_OAUTH_FAILED`: tunnel loopback stabilito correttamente, un solo OAuth avviato, ma la sessione è uscita senza configurare Codex.
- Stato post-pass pulito: local/VPS `1455` libere, nessun OAuth process residuo, gateway `false`, port `18789` free.
- Il prossimo tentativo OAuth richiede un nuovo gate esplicito. Il nuovo task dovrà mantenere la console interattiva chiaramente visibile e non deve catturare stdout persistente contenente URL OAuth/callback/code.
- Nessun retry automatico, planner/model invocation, gateway/service, GLM/Z.AI, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing o Qwen.
- Token/auth state Windows NON vanno copiati, letti o trasferiti sul VPS; nessun token/callback/code deve entrare in GitHub o log persistenti.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
