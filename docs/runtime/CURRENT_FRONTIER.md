# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — VPS control-plane checkout PASS; next gate: read-only mount apply (compose + n8n recreate); issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `LITELLM_DEPLOY_PASS / VPS_CHECKOUT_PASS / MOUNT_APPLY_GATE_PENDING` |
| **GATE CORRENTE** | `D0025_W_CONTROL_PLANE_MOUNT_APPLY` — separate authorized gate required: add read-only bind mount + n8n recreate only |
| **NEXT** | Operator/GPT-Web authorize bounded mount apply: `/root/local-files/handoff-runtime/control-plane` → `/files/handoff-runtime/control-plane:ro` via compose edit + `docker compose up -d n8n`. Then schema engine, Header Auth credential, WF61 import. |
| **CONTROL-PLANE HOST PATH** | **PRESENT** · `/root/local-files/handoff-runtime/control-plane` · `main` @ `db7879e0c21e9aea141a8951be9b8f9124afb5cb` |
| **CONTROL-PLANE TOOLS LIVE** | **NOT_MOUNTED** — checkout on host; n8n surface still lacks bind mount |
| **LITELLM LIVE** | **DEPLOYED** · `litellm-primary` · running · `root_default` · host published ports **0** |
| **MOUNT PREFLIGHT** | **GROUNDED** · recreate **YES** (n8n only) · rollback **PROVEN** |
| **N8N COMPOSE** | project `root` · `/root/docker-compose.yaml` · service `n8n` only · unrestarted |
| **N8N APPLY RISK** | WF40 active · running-execution count unknown · mount apply should use low-traffic window |
| **PRIMARY CYCLE RUNNER** | **PASS** offline · checkout includes `tools/run-litellm-primary-cycle.mjs` |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** · inactive · not imported |
| **WF40 LIVE** | **MATCH** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **MATCH** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **SCHEMA ENGINE** | **NOT_AVAILABLE LIVE** on VPS n8n surface |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- Canonical VPS checkout exists and is clean; mount apply remains a separate operator gate.
- Mount apply will recreate n8n only; `litellm-primary`, `root_default`, and `root_n8n_data` persist; rollback proven.
- No credential/OAuth/package/schema/WF61 work authorized without separate gates.
- OpenClaw/WF60 unchanged. Qwen deferred. TeamViewer continuity preserved.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Checkout evidence: `reports/architecture/d0025_vps_control_plane_checkout.md`
- Checkout authorization: issue #31 comment `5452115059`
- Mount preflight: `reports/architecture/d0025_control_plane_mount_readonly_preflight.md`
- LiteLLM deploy: `reports/architecture/d0025_litellm_private_container_deploy.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
