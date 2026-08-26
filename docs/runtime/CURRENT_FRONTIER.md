# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-ISOLATED-NODE-RUNTIME-INSTALL` |
| **STATO BLOCCO** | HUMAN_GATE_REQUIRED |
| **GATE CORRENTE** | `VPS_ISOLATED_NODE_RUNTIME_INSTALL_EXPLICIT_AUTHORIZATION_REQUIRED` |
| **NEXT** | autorizzare esclusivamente un Node 24 isolato per OpenClaw sul VPS, senza sostituire `/usr/bin/node`/npm Ubuntu; dopo PASS verify Node/npm isolati e Claude Code/system Node invariati; OpenClaw install resta gate separato |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali; metodo: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md` |
| **VPS DISCOVERY** | PASS — Ubuntu 24.04.4 x86_64 · 4 CPU · 3.8 GiB RAM / 2.4 GiB available · 101G root free · Tailscale `100.114.7.53` · port 18789 free |
| **NODE PREFLIGHT** | PASS — system Node `v18.19.1`/npm `9.2.0` via Ubuntu apt; no alternate manager; host Node consumers 0; systemd consumers 0; PM2 absent; cron/script refs 0; collision risk LOW |
| **NODE PLACEMENT** | TARGET: isolated Node 24 satisfying current OpenClaw engines; system `/usr/bin/node` and Ubuntu npm stay unchanged |
| **GLOBAL HOST NPM** | `@anthropic-ai/claude-code@2.1.139` only; verify-only after isolated runtime install |
| **VPS OPENCLAW** | NOT_INSTALLED · `~/.openclaw` absent |
| **VPS N8N** | PASS isolation — Docker `root-n8n-1`; in-container Node `v24.14.1`; host Node dependency `false`; bind `127.0.0.1:5678` |
| **VPS NETWORK** | Tailscale PASS · `18789` free · public listeners 22/80 and nginx/Tailscale 443 require later exposure review; no OpenClaw endpoint configured |
| **LOCAL OPENCLAW EVIDENCE** | PASS — Windows OpenClaw + Codex OAuth usable; local smoke deferred by VPS placement decision |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / BLOCKED_PENDING_ISOLATED_NODE_RUNTIME / NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: BLOCKED_OPENCLAW_NOT_INSTALLED · GLM VPS: BLOCKED_OPENCLAW_NOT_INSTALLED/AUTH · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Node preflight PASS: nessun consumer host attivo e n8n è isolato in Docker.
- Strategia minima scelta: installazione **isolata** di Node 24 per OpenClaw; nessuna sostituzione del Node 18 Ubuntu o del relativo npm.
- Il gate corrente NON autorizza ancora OpenClaw install/update/config, OAuth VPS, GLM credential write, gateway/service start, firewall/reverse-proxy change, n8n mutation o billing.
- OAuth Codex Windows resta evidence; token/auth state NON vanno copiati sul VPS.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Operating model: `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`
- Lean method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
