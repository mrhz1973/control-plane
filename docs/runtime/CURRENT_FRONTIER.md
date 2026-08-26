# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-CODEX-OAUTH` |
| **STATO BLOCCO** | HUMAN_GATE_REQUIRED |
| **GATE CORRENTE** | `CODEX_OAUTH_VPS_EXPLICIT_AUTHORIZATION_REQUIRED` |
| **NEXT** | autorizzare esclusivamente OAuth `openai-codex` sul VPS tramite OpenClaw installato in `/opt/openclaw-app`, usando Node isolato `/opt/openclaw-node/current`; verify provider/auth state e STOP prima di gateway, GLM/Z.AI, n8n wiring o planner smoke |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — official `v24.19.0`; `/opt/openclaw-node/current`; npm/npx `11.17.0`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` installed at `/opt/openclaw-app`; binary `/opt/openclaw-app/bin/openclaw`; version `OpenClaw 2026.7.1-2 (0790d9f)` |
| **OPENCLAW STATE** | `/root/.openclaw/state/openclaw.sqlite` auto-created by harmless `--version/--help`; no auth/config/OAuth performed |
| **VPS N8N** | PASS isolation — Docker `root-n8n-1` running; bind `127.0.0.1:5678`; unchanged |
| **VPS TAILSCALE** | PASS · IP `100.114.7.53` |
| **VPS NETWORK** | port `18789` free · no OpenClaw process/gateway running |
| **OPENCLAW INSTALL EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` — PASS via `cursor_direct_persistence`; evidence commit `e76ba86ad983186a6a6dfc35ac6da4c7c0c1650c` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **LOCAL OPENCLAW EVIDENCE** | PASS — Windows Codex OAuth usable; local auth/token state must NOT be copied to VPS |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / NOT_AUTHENTICATED_CODEX / GATEWAY_NOT_ACTIVATED |
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

- OpenClaw VPS install PASS; system Node/npm, Claude Code, n8n, Docker e Tailscale risultano invariati nell'evidence Cursor.
- Il prossimo gate riguarda esclusivamente un **nuovo OAuth Codex sul VPS**. Token/auth state Windows NON vanno copiati.
- Non sono autorizzati gateway/service start/install, GLM/Z.AI credential write, firewall/reverse-proxy/public exposure, n8n mutation, runtime wiring, planner invocation/smoke, billing o Qwen changes.
- `~/.openclaw/state/openclaw.sqlite` esiste come side effect CLI innocuo; non costituisce evidence di auth/config.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
