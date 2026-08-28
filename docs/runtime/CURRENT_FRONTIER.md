# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — control-plane mount preflight STOP (`HOST_PATH ABSENT`); next gate: VPS control-plane checkout clone/copy; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `LITELLM_DEPLOY_PASS / MOUNT_PREFLIGHT_STOP_HOST_PATH_ABSENT / RUNTIME_PREREQUISITE_GATES_PARTIAL` |
| **GATE CORRENTE** | `D0025_W_CONTROL_PLANE_VPS_CHECKOUT` — separate authorized gate required before mount apply: populate `/root/local-files/handoff-runtime/control-plane` with canonical `mrhz1973/control-plane` |
| **NEXT** | Operator/GPT-Web authorize bounded VPS checkout gate (clone or copy). After host path exists: mount apply gate (compose volume line + n8n recreate only). Then schema engine, Header Auth credential, WF61 import. |
| **LITELLM LIVE** | **DEPLOYED** · `litellm-primary` · running · `root_default` · host published ports **0** |
| **CONTROL-PLANE TOOLS** | **NOT_AVAILABLE LIVE** · mount preflight grounded · host checkout **ABSENT** |
| **MOUNT PREFLIGHT** | compose **GROUNDED** · candidate `…/handoff-runtime/control-plane:ro` · recreate **YES** (n8n only) · rollback **PROVEN** |
| **N8N COMPOSE** | project `root` · `/root/docker-compose.yaml` · service `n8n` only · `root_n8n_data` volume persists across recreate |
| **PRIMARY CYCLE RUNNER** | **PASS** offline · `tools/run-litellm-primary-cycle.mjs` · tests **16/16** |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** · inactive · not imported |
| **WF40 LIVE** | **MATCH** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **MATCH** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **SCHEMA ENGINE** | **NOT_AVAILABLE LIVE** on VPS n8n surface |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- Mount preflight completed read-only; no compose/mount/n8n mutation performed.
- `CONTROL_PLANE_HOST_PATH = ABSENT` blocks mount apply until separate checkout gate closes.
- Future mount apply requires n8n recreate; `litellm-primary` and `root_default` remain unaffected; rollback proven.
- WF40 active — future apply should use low-traffic window; running-execution count was not readable (no sqlite3 on VPS surface inspected).

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Mount preflight: `reports/architecture/d0025_control_plane_mount_readonly_preflight.md`
- LiteLLM deploy: `reports/architecture/d0025_litellm_private_container_deploy.md`
- Runner: `tools/run-litellm-primary-cycle.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
