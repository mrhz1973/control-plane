# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `GLM-ZAI-VPS-CREDENTIAL-CONFIG` |
| **STATO BLOCCO** | `AUTHORIZED / CREDENTIAL_CONFIG_PENDING` |
| **GATE CORRENTE** | `GLM_ZAI_VPS_CREDENTIAL_CONFIG_AUTHORIZED` |
| **NEXT** | configure GLM/Z.AI credentials on VPS OpenClaw with bounded auth/config mutation only, then read-only provider verification; no model/planner invocation, gateway/service, n8n wiring, Codex retry, Qwen mutation, or broader runtime activation |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` at `/opt/openclaw-app`; gateway non attivo |
| **CODEX OAUTH VPS** | PASS |
| **CODEX DIRECT SMOKE VPS** | PASS — exactly one local inference; exit `0`; marker matched; no retry |
| **CODEX PROVIDER AFTER SMOKE** | configured / usable |
| **GLM/Z.AI VPS AUTH** | missing before authorized config |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `1` total Codex VPS smoke invocation |
| **LATEST EVIDENCE** | `CODEX_VPS_DIRECT_SMOKE = PASS`; evidence commit `ef6a5a43eeb2a1bd13f02f9be68887b414c7ae15` |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows auth copied `false` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / CODEX_AUTHENTICATED_AND_SMOKE_PASS / GLM_AUTH_PENDING / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: PASS · GLM VPS: BLOCKED_PENDING_AUTH_CONFIG · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- `CODEX_VPS_DIRECT_SMOKE` è PASS: una sola invocazione locale OpenClaw, exit `0`, risposta marker corretta, zero retry; provider Codex resta usable; gateway resta false; port `18789` free.
- L'operatore ha autorizzato esclusivamente la configurazione bounded delle credenziali GLM/Z.AI sul VPS OpenClaw e la verifica provider read-only immediatamente successiva.
- Sono consentiti preflight/discovery read-only per determinare il metodo auth supportato. La sola mutazione autorizzata è quella auth/config/state strettamente necessaria a GLM/Z.AI.
- Nessun model/planner invocation, gateway/service, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing, Qwen o broader runtime activation.
- Nessuna ulteriore invocazione Codex è autorizzata.
- Nessun secret/token deve entrare in GitHub, chat Cursor, stdout persistente o log persistenti. Se serve inserire una chiave, deve farlo l'operatore direttamente in una console interattiva non registrata; nessun trasferimento automatico di credenziali esistenti da Windows.
- Dopo la configurazione: verify provider/auth read-only, gateway `false`, port `18789` free, persist `LAST_CURSOR_REPORT.md`, quindi STOP sul prossimo gate.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- WF40/42 invariati; WF41 off; wf47 invariato (inactive/unpublished, Schedule disabled, `enable_wg48_handoff=false`).

## Puntatori

- Active work: GitHub issue **#8**
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
