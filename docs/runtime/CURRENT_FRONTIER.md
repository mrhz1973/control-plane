# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `VPS-CODEX-OAUTH-RECOVERY` |
| **STATO BLOCCO** | `BLOCKED / STALE_LOCAL_OAUTH_PROCESSES_PRESENT` |
| **GATE CORRENTE** | `STALE_OAUTH_PROCESS_CLEANUP_EXPLICIT_AUTHORIZATION_REQUIRED` |
| **NEXT** | terminare esclusivamente i 2 processi locali Windows stale appartenenti al vecchio OAuth (`cmd.exe` wrapper `vps_codex_oauth_login.cmd` + relativo `ssh.exe` verso `ionos-n8n`), dopo PID re-identification; verify-only che non restino processi OAuth locali/VPS; nessun nuovo OAuth |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — official `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | PASS — `openclaw@2026.7.1-2` at `/opt/openclaw-app`; gateway non attivo |
| **CODEX OAUTH VPS** | BLOCKED — auth current `missing`; provider current `missing`; nessun OAuth login attivo sul VPS |
| **STALE OAUTH PROCESS RECHECK** | PASS read-only — local wrapper `true`, local ssh `true`, local count `2`; VPS OAuth login `false`, VPS count `0` |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `0` |
| **SECRET / WINDOWS AUTH GUARD** | secret values exposed `false` · Windows auth copied `false` |
| **LATEST EVIDENCE** | `docs/runtime/LAST_CURSOR_REPORT.md` — `VPS_CODEX_OAUTH_STALE_PROCESS_RECHECK_READONLY = PASS`; direct Cursor persistence; evidence commit `44953d1367b82c5e7744406eb3018744e1b6f0e2` |
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

- Il primo OAuth VPS è chiuso `BLOCKED`; retry `0`; non è autorizzato alcun nuovo OAuth sotto il gate precedente.
- Il recheck read-only ha confermato che il VPS non ha processi OAuth attivi; restano solo 2 processi locali Windows stale del vecchio flusso.
- La terminazione di quei 2 processi locali richiede gate umano specifico; prima del kill Cursor deve re-identificare i PID e verificare che appartengano esattamente al wrapper/SSH OAuth stale.
- Il cleanup non autorizza retry OAuth, callback recovery, planner/model invocation, gateway/service, GLM/Z.AI, n8n/Docker/Tailscale/firewall/network wiring, billing o Qwen changes.
- Dopo cleanup PASS il prossimo gate sarà `OAUTH_HEADLESS_CALLBACK_RECOVERY_GATE_REQUIRED`.
- Token/auth state Windows NON vanno copiati, letti o trasferiti sul VPS; nessun secret/callback/code deve entrare in GitHub.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
