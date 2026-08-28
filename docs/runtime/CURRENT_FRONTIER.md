# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — control-plane mount preflight STOP reviewed/accepted (`HOST_PATH ABSENT`); next real gate: VPS canonical control-plane checkout; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `LITELLM_DEPLOY_PASS / MOUNT_PREFLIGHT_REVIEWED_STOP_HOST_PATH_ABSENT / VPS_CHECKOUT_GATE_PENDING` |
| **GATE CORRENTE** | `D0025_W_CONTROL_PLANE_VPS_CHECKOUT_AUTH_REQUIRED` — explicit operator authorization required before creating the canonical VPS checkout at `/root/local-files/handoff-runtime/control-plane` |
| **NEXT** | After explicit authorization, perform one bounded checkout gate only: clone canonical `mrhz1973/control-plane` into `/root/local-files/handoff-runtime/control-plane`, verify `origin/main`, clean worktree and expected commit ancestry. Do not modify compose or recreate n8n in the checkout gate. Mount apply remains a later separate gate. |
| **LITELLM LIVE** | **DEPLOYED** · `litellm-primary` · running · `root_default` · host published ports **0** |
| **CONTROL-PLANE TOOLS** | **NOT_AVAILABLE LIVE** · mount preflight grounded · host checkout **ABSENT** |
| **MOUNT PREFLIGHT** | **GPT-WEB REVIEWED STOP** · compose **GROUNDED** · candidate `/root/local-files/handoff-runtime/control-plane` → `/files/handoff-runtime/control-plane:ro` · recreate **YES** (n8n only) · rollback **PROVEN** |
| **N8N COMPOSE** | project `root` · `/root/docker-compose.yaml` · service `n8n` only · `root_n8n_data` persists across recreate |
| **N8N APPLY RISK** | WF40 active · running-execution count unknown · future mount apply should use low-traffic window and remains a separate operator gate |
| **PRIMARY CYCLE RUNNER** | **PASS** offline · `tools/run-litellm-primary-cycle.mjs` · tests **16/16** |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** · inactive · not imported |
| **WF40 LIVE** | **MATCH** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **MATCH** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **SCHEMA ENGINE** | **NOT_AVAILABLE LIVE** on VPS n8n surface |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- GPT Web accepted the mount-preflight STOP: the design/rollback are grounded; the sole blocker is absence of the canonical VPS checkout.
- No compose/mount/n8n mutation occurred in preflight.
- Checkout is a separate filesystem/runtime mutation gate; no clone/copy may occur before explicit operator authorization.
- Checkout gate must not edit `/root/docker-compose.yaml`, restart/recreate `root-n8n-1`, install packages, bind credentials/OAuth, call providers, or touch WORK-PC networking.
- Future mount apply requires n8n recreate; `litellm-primary`, `root_default`, and persisted `root_n8n_data` are unaffected; rollback is proven.
- OpenClaw/WF60 unchanged. WF61 unimported. Qwen deferred.
- TeamViewer continuity on WORK-PC remains a hard constraint.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- GPT-Web mount-preflight review: issue #31 comment `5452057932`
- Mount preflight: `reports/architecture/d0025_control_plane_mount_readonly_preflight.md`
- LiteLLM deploy: `reports/architecture/d0025_litellm_private_container_deploy.md`
- Runner: `tools/run-litellm-primary-cycle.mjs`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
