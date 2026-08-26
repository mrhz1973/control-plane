# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**
> Deve restare piccolo. Non contiene cronologia, narrativa, HEAD remota corrente o copie di foundation/evidence.

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-NODE-RUNTIME-UPGRADE-PREFLIGHT` |
| **STATO BLOCCO** | READ_ONLY_PREFLIGHT_REQUIRED |
| **GATE CORRENTE** | none — read-only dependency/provenance census; Node mutation NOT_AUTHORIZED |
| **NEXT** | census read-only del Node host via `ssh ionos-n8n`: provenance/install method, host consumers/systemd/global npm/symlink/PATH; poi preparare gate minimo per upgrade Node compatibile con OpenClaw se non emergono conflitti |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali; metodo: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md` |
| **VPS DISCOVERY** | PASS — Ubuntu 24.04.4 x86_64 · 4 CPU · 3.8 GiB RAM / 2.4 GiB available · 101G root free · Tailscale `100.114.7.53` running · port 18789 free |
| **VPS NODE** | BLOCKER — Node `v18.19.1`, npm `9.2.0`; OpenClaw latest observed `2026.7.1-2` requires Node `>=22.22.3 <23 || >=24.15.0 <25 || >=25.9.0`; upgrade not yet authorized |
| **VPS OPENCLAW** | NOT_INSTALLED · `~/.openclaw` absent |
| **VPS N8N** | PASS coexistence evidence — Docker `root-n8n-1`, bind `127.0.0.1:5678`, `n8n-compose.service` enabled |
| **VPS NETWORK** | Tailscale PASS · `127.0.0.1:5678` occupied by n8n · `18789` free · public listeners 22/80 and nginx/Tailscale 443 require exposure review before any broker endpoint |
| **LOCAL OPENCLAW EVIDENCE** | PASS — Windows npm global `openclaw@2026.5.20`; `openai-codex` OAuth authenticated/usable; usage/quota visible; gateway locale non avviato |
| **LOCAL CODEX DIRECT SMOKE** | DEFERRED_BY_PLACEMENT_DECISION — resta fallback/evidence locale |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / BLOCKED_BY_HOST_NODE_VERSION / NOT_ACTIVATED |
| **QWEN LOCAL** | target Qwen 3.8 37B NOT_INSTALLED; `qwen3.8:27b` presente; nessun pull/run autorizzato; Qwen resta nodo locale/GPU |
| **PLANNER SMOKE** | Codex VPS: BLOCKED_OPENCLAW_NOT_INSTALLED · GLM VPS: BLOCKED_OPENCLAW_NOT_INSTALLED/AUTH · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **CURSOR v3 SMOKE** | GLM BYOK: NOT_RUN · bounded loop: NOT_RUN · Bugbot loop: NOT_RUN · checkpoint resume: NOT_RUN |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- OpenClaw VPS resta il placement canonico; discovery read-only VPS è PASS ma il Node host corrente è incompatibile con l'OpenClaw npm osservato.
- Prima di autorizzare l'upgrade Node serve census read-only di provenance e consumers host per evitare regressioni su servizi/tooling esistenti.
- n8n è osservato in Docker/loopback e non costituisce evidence di dipendenza dal Node host; questo non autorizza comunque una sostituzione runtime senza preflight.
- Nessuna installazione/update OpenClaw, OAuth VPS, GLM credential write, gateway/service start, firewall/reverse-proxy change o n8n mutation è autorizzata.
- OAuth Codex Windows resta evidence di compatibilità; token/auth state NON vanno copiati sul VPS.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- Operating model: `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`
- OpenClaw placement addendum: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
- Evidence Cursor rolling: `docs/runtime/LAST_CURSOR_REPORT.md` — on demand
- Storico/recovery: Git history + baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`; mai bootstrap di default
