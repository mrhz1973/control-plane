# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**
> Deve restare piccolo. Non contiene cronologia, narrativa, HEAD remota corrente o copie di foundation/evidence.

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-OPENCLAW-BROKER-DISCOVERY` |
| **STATO BLOCCO** | IN_PROGRESS |
| **GATE CORRENTE** | `READ_ONLY_VPS_OPENCLAW_DISCOVERY` |
| **NEXT** | discovery read-only via `ssh ionos-n8n`: OS/risorse, Node/npm, presenza/versione OpenClaw, Tailscale, processi/porte e coesistenza n8n; nessuna install/config/auth/start/restart/firewall mutation |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali; metodo: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md` |
| **LOCAL OPENCLAW EVIDENCE** | PASS — npm global `openclaw@2026.5.20`; `openai-codex` OAuth autenticato/usable; usage/quota visibile; gateway locale non avviato |
| **LOCAL CODEX DIRECT SMOKE** | DEFERRED_BY_PLACEMENT_DECISION — resta fallback/evidence locale, non priorità corrente |
| **VPS OPENCLAW** | NOT_DISCOVERED / NOT_INSTALLED_ASSUMPTION_FORBIDDEN |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / NOT_ACTIVATED |
| **QWEN LOCAL** | target Qwen 3.8 37B NOT_INSTALLED; `qwen3.8:27b` presente; nessun pull/run autorizzato; Qwen resta nodo locale/GPU |
| **PLANNER SMOKE** | Codex VPS: NOT_RUN · GLM VPS: BLOCKED_MISSING_AUTH · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
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

- Foundation v3.1 wiki-LLM lean è canonica su `main`; issue #8 è l'unico ACTIVE WORK.
- Placement target aggiornato: OpenClaw VPS IONOS = broker canonico 24/7; OpenClaw Windows = test/fallback/evidence.
- Cursor, Bugbot, filesystem/terminale di implementazione e Ollama/Qwen restano sul PC locale; collegamento futuro solo tramite trasporto privato/Tailscale verificato.
- L'OAuth Codex locale PASS è evidence di compatibilità; token/auth state NON vanno copiati sul VPS.
- Il precedente gate per smoke Codex locale è deferito dalla nuova placement decision.
- Discovery VPS corrente è read-only: nessuna installazione OpenClaw, login OAuth VPS, GLM credential write, gateway/service start, firewall/reverse-proxy change o n8n mutation è autorizzata.
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
