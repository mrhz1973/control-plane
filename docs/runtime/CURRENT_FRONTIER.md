# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-CODEX-OAUTH-RECOVERY` |
| **STATO BLOCCO** | `BLOCKED / OAUTH_SINGLE_ATTEMPT_FAILED` |
| **GATE CORRENTE** | `NONE — READ_ONLY_STALE_OAUTH_PROCESS_RECHECK` |
| **NEXT** | ricontrollare read-only se i processi OAuth locali/VPS riportati ancora vivi nel precedente pass esistono tuttora; nessun kill/retry. Se assenti → preparare gate callback recovery; se presenti → gate separato di cleanup processi |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — official `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` at `/opt/openclaw-app`; gateway non attivo |
| **CODEX OAUTH VPS** | BLOCKED — primo tentativo OAuth interrotto dall'operatore; auth before/after `missing`; auth profile absent; provider effective `missing` |
| **OAUTH INVOCATIONS** | first `1` · retry `0` · retry forbidden rispettato |
| **OAUTH PROCESS STATE AT LAST CHECK** | `OAUTH_PROCESS_STILL_RUNNING=true` — wrapper/ssh locali + OpenClaw OAuth VPS osservati; solo report, nessun kill |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `0` |
| **SECRET / WINDOWS AUTH GUARD** | secret values exposed `false` · Windows auth copied `false` |
| **OAUTH BLOCKED EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` — `BLOCKED_OAUTH_SINGLE_ATTEMPT_FAILED`, direct Cursor persistence; evidence commit `8fab33b804335a2492893c67439c70bf6a94afa8` |
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

- Il singolo OAuth autorizzato è terminato `BLOCKED`; non è autorizzato alcun retry sotto quel gate.
- Prima di qualsiasi nuovo OAuth/callback recovery va ricontrollato read-only se i processi OAuth riportati ancora vivi sono realmente presenti.
- Il recheck read-only non autorizza terminazione processi. Se risultano ancora vivi, lo stop/kill richiede gate separato e specifico.
- Se i processi risultano assenti, il passo successivo è un nuovo gate ristretto per il recupero callback headless; nessun planner/model invocation nello stesso gate.
- Token/auth state Windows NON vanno copiati, letti o trasferiti sul VPS; nessun secret/callback/code deve entrare in GitHub.
- Non sono autorizzati gateway/service start/install, GLM/Z.AI, firewall/reverse proxy/public exposure, n8n mutation, runtime wiring, billing o Qwen changes.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
