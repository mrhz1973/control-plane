# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-ISOLATED-NODE-RUNTIME-INSTALL` |
| **STATO BLOCCO** | AUTHORIZED / EXECUTION_PENDING |
| **GATE CORRENTE** | `VPS_ISOLATED_NODE_RUNTIME_INSTALL_AUTHORIZED` |
| **NEXT** | installare sul VPS un solo runtime Node.js 24.x ufficiale e isolato dedicato a OpenClaw, verificato con checksum ufficiale; lasciare invariati `/usr/bin/node`, npm Ubuntu, Claude Code, n8n/Docker/Tailscale; post-install verify e STOP prima di OpenClaw install |
| **NODE TARGET** | Node.js 24.x LTS ufficiale, Linux x64, versione `>=24.15.0 <25`; latest LTS osservato 2026-08-26: `v24.19.0`; install path dedicato sotto `/opt/openclaw-node/` |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali; metodo: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md` |
| **VPS DISCOVERY** | PASS — Ubuntu 24.04.4 x86_64 · 4 CPU · 3.8 GiB RAM / 2.4 GiB available · 101G root free · Tailscale `100.114.7.53` · port 18789 free |
| **NODE PREFLIGHT** | PASS — system Node `v18.19.1`/npm `9.2.0` via Ubuntu apt; no alternate manager; host Node consumers 0; systemd consumers 0; PM2 absent; cron/script refs 0; collision risk LOW |
| **NODE PLACEMENT** | TARGET: isolated Node 24 satisfying current OpenClaw engines; system `/usr/bin/node` and Ubuntu npm stay unchanged |
| **GLOBAL HOST NPM** | `@anthropic-ai/claude-code@2.1.139` only; verify-only after isolated runtime install |
| **VPS OPENCLAW** | NOT_INSTALLED · `~/.openclaw` absent |
| **VPS N8N** | PASS isolation — Docker `root-n8n-1`; in-container Node `v24.14.1`; host Node dependency `false`; bind `127.0.0.1:5678` |
| **VPS NETWORK** | Tailscale PASS · `18789` free · public listeners 22/80 and nginx/Tailscale 443 require later exposure review; no OpenClaw endpoint configured |
| **LOCAL OPENCLAW EVIDENCE** | PASS — Windows OpenClaw + Codex OAuth usable; local smoke deferred by VPS placement decision |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / NODE_INSTALL_AUTHORIZED / OPENCLAW_NOT_INSTALLED |
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

- Operatore ha autorizzato esclusivamente l'installazione di un runtime Node.js 24.x ufficiale isolato per OpenClaw sul VPS, con checksum e post-install verify.
- `/usr/bin/node`, npm Ubuntu, Claude Code, n8n, Docker, Tailscale, firewall/reverse proxy devono restare invariati.
- Il gate NON autorizza install/update/config OpenClaw, OAuth VPS, GLM/Z.AI credential write, gateway/service start, n8n mutation, runtime wiring o billing.
- OAuth Codex Windows resta evidence; token/auth state NON vanno copiati sul VPS.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Operating model: `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`
- Lean method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
