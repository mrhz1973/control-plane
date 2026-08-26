# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-OPENCLAW-INSTALL` |
| **STATO BLOCCO** | AUTHORIZED / EXECUTION_PENDING |
| **GATE CORRENTE** | `VPS_OPENCLAW_INSTALL_AUTHORIZED` |
| **NEXT** | installare OpenClaw sul VPS `ionos-n8n` usando esclusivamente il runtime isolato `/opt/openclaw-node/current`, in prefix dedicato, con package/version discovery + install + post-install verify; STOP prima di OAuth/provider config/gateway/service/network wiring |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **VPS DISCOVERY** | PASS — Ubuntu 24.04.4 x86_64 · 4 CPU · 3.8 GiB RAM · 101G root free · Tailscale `100.114.7.53` · port 18789 free |
| **ISOLATED NODE 24** | PASS — official `v24.19.0`, checksum PASS; `/opt/openclaw-node/current -> /opt/openclaw-node/v24.19.0`; npm/npx `11.17.0`; OpenClaw engines compatible |
| **SYSTEM NODE** | UNCHANGED — `/usr/bin/node v18.19.1`, Ubuntu npm `9.2.0`, default PATH unchanged |
| **CLAUDE CODE** | `2.1.139` before/after · regression NONE |
| **VPS N8N** | PASS isolation — Docker `root-n8n-1` running; host Node dependency false; bind `127.0.0.1:5678` |
| **VPS TAILSCALE** | PASS before/after |
| **VPS OPENCLAW** | INSTALL_AUTHORIZED / NOT_YET_VERIFIED_INSTALLED · `~/.openclaw` expected absent before install · port 18789 must remain free |
| **NODE TASK EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` — PASS, operator-relayed Cursor report, not independently verified by GPT Web |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing report => `EVIDENCE_NOT_PERSISTED`, not non-execution |
| **LOCAL OPENCLAW EVIDENCE** | PASS — Windows OpenClaw + Codex OAuth usable; local smoke deferred by VPS placement decision |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / NODE_READY / OPENCLAW_INSTALL_AUTHORIZED / NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: BLOCKED_PENDING_OPENCLAW_INSTALL · GLM VPS: BLOCKED_PENDING_OPENCLAW_INSTALL/AUTH · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Operatore ha autorizzato esclusivamente l'installazione OpenClaw sul VPS usando il runtime Node isolato già verificato.
- L'installazione deve usare un prefix dedicato e non deve sostituire/modificare `/usr/bin/node`, npm Ubuntu o PATH persistente di sistema.
- Il gate NON autorizza OAuth/provider config, GLM/Z.AI credential write, gateway/service creation/start, firewall/reverse-proxy/public exposure, n8n mutation, runtime wiring, billing o Qwen changes.
- Dopo install + verify, Cursor deve persistere `docs/runtime/LAST_CURSOR_REPORT.md` prima di chiudere il task, così `agg` vede il PASS.
- OAuth Codex Windows resta evidence; token/auth state NON vanno copiati sul VPS.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
