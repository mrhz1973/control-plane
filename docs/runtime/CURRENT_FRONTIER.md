# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `CODEX-VPS-DIRECT-SMOKE` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / MODEL_INVOCATION` |
| **GATE CORRENTE** | `CODEX_VPS_DIRECT_SMOKE_GATE_REQUIRED` |
| **NEXT** | authorize exactly one minimal direct Codex smoke on VPS through authenticated OpenClaw; no gateway/service, GLM/Z.AI, n8n wiring, or broader runtime activation |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` at `/opt/openclaw-app`; gateway non attivo |
| **CODEX OAUTH VPS** | PASS |
| **AUTH CLASSIFICATION** | configured |
| **PROFILE** | present |
| **PROVIDER** | usable |
| **OAUTH TUNNEL** | closed |
| **LOCAL / VPS 1455** | free |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `0` |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows auth copied `false` |
| **LATEST EVIDENCE** | `VPS_CODEX_OAUTH_CALLBACK_VISIBLE_CONSOLE_RETRY = PASS`; evidence commit `1c932240591311aea8320173a7599d270e4b8e71` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / CODEX_AUTHENTICATED / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: READY_PENDING_GATE · GLM VPS: BLOCKED_MISSING_AUTH · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Codex OAuth sul VPS è PASS (configured / profile present / provider usable). Il tunnel OAuth è chiuso; porte locali/VPS `1455` e VPS `18789` sono free; gateway resta false.
- Il gate corrente è **umano**: autorizzare esattamente **un** minimal direct Codex smoke sul VPS tramite OpenClaw autenticato.
- Nessun gateway/service, GLM/Z.AI, n8n wiring, o broader runtime activation è autorizzato da questo frontier update.
- Nessun planner/model invocation finché il gate umano non autorizza lo smoke.
- Token/auth state Windows NON vanno copiati, letti o trasferiti; nessun token/callback/code deve entrare in GitHub o log persistenti.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- WF40/42 invariati; WF41 off; wf47 invariato (inactive/unpublished, Schedule disabled, `enable_wg48_handoff=false`).

## Puntatori

- Active work: GitHub issue **#8**
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
