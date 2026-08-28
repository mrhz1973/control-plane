# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — VPS control-plane checkout PASS; control-plane read-only mount apply explicitly AUTHORIZED; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `LITELLM_DEPLOY_PASS / VPS_CHECKOUT_PASS / MOUNT_APPLY_AUTHORIZED` |
| **GATE CORRENTE** | `D0025_W_CONTROL_PLANE_MOUNT_APPLY_AUTHORIZED` — add exactly one read-only bind mount and recreate only n8n; rollback only on failure |
| **NEXT** | Cursor executes bounded mount apply: `/root/local-files/handoff-runtime/control-plane:/files/handoff-runtime/control-plane:ro` in `/root/docker-compose.yaml`, then recreate only n8n with `docker compose -f /root/docker-compose.yaml --project-directory /root up -d n8n`; verify health, mount RO, tool readability, persisted volume/network, WF40/WF60 and LiteLLM preservation. |
| **CONTROL-PLANE HOST PATH** | **PRESENT** · `/root/local-files/handoff-runtime/control-plane` · `main` @ `db7879e0c21e9aea141a8951be9b8f9124afb5cb` · clean |
| **CONTROL-PLANE TOOLS LIVE** | **NOT_MOUNTED** — checkout on host; mount apply authorized |
| **LITELLM LIVE** | **DEPLOYED** · `litellm-primary` · running · `root_default` · host published ports **0** |
| **MOUNT PREFLIGHT** | **GROUNDED** · recreate **YES** (n8n only) · rollback **PROVEN** |
| **MOUNT AUTHORIZATION** | issue #31 comment `5452861879` · exact bind mount + n8n-only recreate · no schema/credential/WF61/provider/network expansion |
| **N8N COMPOSE** | project `root` · `/root/docker-compose.yaml` · service `n8n` only · pre-apply live image/container must be preserved except expected n8n container recreation |
| **N8N APPLY RISK** | WF40 active · running-execution count previously unknown; authorization was given with this disclosed risk. Executor must attempt a read-only running-execution check when technically available; detected running execution => STOP. If count remains unavailable without mutation/install, record UNKNOWN and proceed within the explicit authorization. |
| **PRIMARY CYCLE RUNNER** | **PASS** offline · checkout includes `tools/run-litellm-primary-cycle.mjs` |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** · inactive · not imported |
| **WF40 LIVE** | **MATCH** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **MATCH** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **SCHEMA ENGINE** | **NOT_AVAILABLE LIVE** on VPS n8n surface · installation remains separate gate |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- Operator mount-apply authorization is persisted in issue #31 comment `5452861879`.
- Authorized mutations are limited to one compose volume-line addition and recreation of the `n8n` service only. The exact target is `/root/local-files/handoff-runtime/control-plane:/files/handoff-runtime/control-plane:ro`.
- Before mutation, executor must verify compose baseline, host checkout presence/clean state, `root-n8n-1` and `litellm-primary` running, current n8n image ID, `root_n8n_data` and `root_default` identity, and attempt a read-only running-execution check without installing or exposing secrets.
- Dry-run/planned-action inspection is allowed and should fail closed if it indicates image pull, unrelated service/network/volume mutation, or anything beyond n8n recreation.
- After recreate, n8n health/version, read-only mount, canonical tool readability, persisted volume/network identity, WF40/WF60 state, and unchanged `litellm-primary` must be verified.
- If apply or verification fails, only the already-proven rollback is authorized: remove the exact added bind mount and recreate only n8n; verify restoration, persist evidence, then STOP. No retry of the apply.
- No schema/package install, credential/OAuth mutation, WF61 import/activation, provider/model call/inference, OpenClaw mutation, public exposure, or WORK-PC network/TeamViewer mutation is authorized in this pass.
- The VPS checkout itself remains at the previously verified `db7879e0...` snapshot during this gate; updating/pulling it is not part of the mount authorization.
- OpenClaw/WF60 unchanged. WF61 unimported. Qwen deferred.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Mount authorization: issue #31 comment `5452861879`
- Checkout evidence: `reports/architecture/d0025_vps_control_plane_checkout.md`
- Checkout authorization: issue #31 comment `5452115059`
- Mount preflight: `reports/architecture/d0025_control_plane_mount_readonly_preflight.md`
- LiteLLM deploy: `reports/architecture/d0025_litellm_private_container_deploy.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
