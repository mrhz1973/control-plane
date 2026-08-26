# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-OPENCLAW-INSTALL` |
| **STATO BLOCCO** | HUMAN_GATE_REQUIRED |
| **GATE CORRENTE** | `VPS_OPENCLAW_INSTALL_EXPLICIT_AUTHORIZATION_REQUIRED` |
| **NEXT** | autorizzare esclusivamente installazione OpenClaw sul VPS usando il runtime isolato `/opt/openclaw-node/current` già verificato; install-only + verify; STOP prima di OAuth/provider config/gateway/service/network wiring |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **VPS DISCOVERY** | PASS — Ubuntu 24.04.4 x86_64 · 4 CPU · 3.8 GiB RAM · 101G root free · Tailscale `100.114.7.53` · port 18789 free |
| **ISOLATED NODE 24** | PASS — official `v24.19.0`, checksum PASS; `/opt/openclaw-node/current -> /opt/openclaw-node/v24.19.0`; npm/npx `11.17.0`; OpenClaw engines compatible |
| **SYSTEM NODE** | UNCHANGED — `/usr/bin/node v18.19.1`, Ubuntu npm `9.2.0`, default PATH unchanged |
| **CLAUDE CODE** | `2.1.139` before/after · regression NONE |
| **VPS N8N** | PASS isolation — Docker `root-n8n-1` running; host Node dependency false; bind `127.0.0.1:5678` |
| **VPS TAILSCALE** | PASS before/after |
| **VPS OPENCLAW** | NOT_INSTALLED · `~/.openclaw` absent · port 18789 free |
| **NODE TASK EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` — PASS, operator-relayed Cursor report, not independently verified by GPT Web |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing report => `EVIDENCE_NOT_PERSISTED`, not non-execution |
| **LOCAL OPENCLAW EVIDENCE** | PASS — Windows OpenClaw + Codex OAuth usable; local smoke deferred by VPS placement decision |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / NODE_READY / OPENCLAW_NOT_INSTALLED |
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

- Node 24 isolato PASS; system Node/npm, Claude Code, n8n, Docker, Tailscale, firewall e auth risultano invariati nel report Cursor ricevuto.
- OpenClaw non è ancora installato sul VPS.
- Il prossimo gate può autorizzare solo installazione OpenClaw usando il runtime isolato; OAuth, GLM/Z.AI, gateway/service, firewall/reverse-proxy, n8n mutation, runtime wiring e billing restano separati.
- `agg` non deve più interpretare un report Cursor non persistito come task non eseguito; il completion report va persistito in GitHub prima della chiusura dei task futuri.
- OAuth Codex Windows resta evidence; token/auth state NON vanno copiati sul VPS.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
