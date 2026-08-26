# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-CODEX-OAUTH-RECOVERY` |
| **STATO BLOCCO** | `AUTHORIZED / CALLBACK_TUNNEL_OAUTH_PENDING` |
| **GATE CORRENTE** | `OAUTH_HEADLESS_CALLBACK_RECOVERY_AUTHORIZED` |
| **NEXT** | eseguire un solo nuovo OAuth `openai-codex` sul VPS tramite una singola sessione SSH temporanea con forward loopback `PC 127.0.0.1:1455 -> VPS 127.0.0.1:1455`; preflight porte/processi, verify auth/provider, chiusura automatica tunnel con la sessione, persistenza `LAST_CURSOR_REPORT`; nessun planner invocation/gateway/GLM/n8n wiring |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — official `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` at `/opt/openclaw-app`; gateway non attivo |
| **CODEX OAUTH VPS** | BLOCKED precedente — primo tentativo fallito per callback browser su `localhost:1455`; auth current `missing`; provider current `missing`; nuovo recovery attempt autorizzato |
| **STALE OAUTH CLEANUP** | PASS — exact wrapper `cmd.exe` + child `ssh.exe` identificati e terminati; unrelated processes stopped `0`; locale OAuth count `0`; VPS OAuth count `0` |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `0` |
| **SECRET / WINDOWS AUTH GUARD** | secret values exposed `false` · Windows auth copied `false` |
| **LATEST EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` — `VPS_CODEX_OAUTH_STALE_PROCESS_CLEANUP = PASS`; direct Cursor persistence; evidence commit `5e2564cd84413d056a5c5adc60805526cc548f90` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / CODEX_NOT_AUTHENTICATED / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: BLOCKED_PENDING_OAUTH_RECOVERY · GLM VPS: BLOCKED_MISSING_AUTH · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- L'operatore ha autorizzato **un solo nuovo tentativo OAuth `openai-codex`** sul VPS e unicamente il tunnel SSH temporaneo necessario alla callback `localhost:1455`.
- Il tunnel deve essere loopback-only sul PC (`127.0.0.1:1455`) e inoltrare esclusivamente a `127.0.0.1:1455` sul VPS nella stessa sessione SSH che esegue il login; nessun bind `0.0.0.0`, nessuna modifica firewall/nginx/reverse proxy e nessun servizio persistente.
- Prima del nuovo OAuth vanno verificati read-only che la porta locale 1455 sia libera, la porta callback sul VPS non sia occupata da processo stale e non esistano processi OAuth residui; se il bind del tunnel fallisce o una porta è occupata, STOP senza login.
- Sono autorizzate esclusivamente le modifiche OpenClaw auth/config/state direttamente necessarie al nuovo OAuth sul VPS e le verifiche provider/auth immediatamente successive.
- Dopo OAuth il tunnel deve terminare con la stessa sessione SSH; verify auth/provider read-only, gateway `false`, port 18789 free, planner invocation `0`, quindi persist `LAST_CURSOR_REPORT.md`.
- Token/auth state Windows NON vanno copiati, letti o trasferiti sul VPS; nessun token/callback/code deve entrare in GitHub o nei log persistenti.
- Non sono autorizzati planner/model invocation, gateway/service, GLM/Z.AI, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing o Qwen.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
