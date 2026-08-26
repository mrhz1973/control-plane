# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-CODEX-OAUTH` |
| **STATO BLOCCO** | AUTHORIZED / EXECUTION_PENDING |
| **GATE CORRENTE** | `CODEX_OAUTH_VPS_AUTHORIZED` |
| **NEXT** | eseguire un solo nuovo OAuth `openai-codex` sul VPS tramite `/opt/openclaw-app/bin/openclaw` con Node isolato `/opt/openclaw-node/current`; verify read-only provider/auth state, persistere `LAST_CURSOR_REPORT`, STOP prima di planner invocation/gateway/GLM/n8n wiring |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — official `v24.19.0`; `/opt/openclaw-node/current`; npm/npx `11.17.0`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` installed at `/opt/openclaw-app`; binary `/opt/openclaw-app/bin/openclaw`; version `OpenClaw 2026.7.1-2 (0790d9f)` |
| **OPENCLAW STATE** | `/root/.openclaw/state/openclaw.sqlite` exists from harmless CLI use; Codex OAuth authorization now granted but execution pending |
| **VPS N8N** | PASS isolation — Docker `root-n8n-1` running; bind `127.0.0.1:5678`; unchanged |
| **VPS TAILSCALE** | PASS · IP `100.114.7.53` |
| **VPS NETWORK** | port `18789` free · no OpenClaw process/gateway running |
| **OPENCLAW INSTALL EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` — PASS via `cursor_direct_persistence`; evidence commit `e76ba86ad983186a6a6dfc35ac6da4c7c0c1650c` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **LOCAL OPENCLAW EVIDENCE** | PASS — Windows Codex OAuth usable; local auth/token state must NOT be copied to VPS |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / CODEX_OAUTH_AUTHORIZED_PENDING / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: BLOCKED_PENDING_OAUTH_EXECUTION · GLM VPS: BLOCKED_MISSING_AUTH · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Operatore ha autorizzato **un solo nuovo login OAuth `openai-codex` sul VPS** e le sole verifiche read-only immediatamente successive.
- Sono autorizzate esclusivamente le modifiche OpenClaw auth/config/state direttamente necessarie a completare questo OAuth sul VPS.
- Token/auth state Windows NON vanno copiati, letti o trasferiti sul VPS.
- Non sono autorizzati planner/model invocation, gateway/service start/install, GLM/Z.AI credential write, firewall/reverse-proxy/public exposure, n8n mutation, runtime wiring, billing o Qwen changes.
- Dopo OAuth + verify, Cursor deve persistere `docs/runtime/LAST_CURSOR_REPORT.md` prima di chiudere il task.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
