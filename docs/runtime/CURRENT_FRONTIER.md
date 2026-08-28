# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — control-plane read-only mount PASS; canonical tools live on n8n surface; next gates: VPS schema engine, Header Auth credential, WF61 import; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `LITELLM_DEPLOY_PASS / VPS_CHECKOUT_PASS / MOUNT_APPLY_PASS / RUNTIME_PREREQUISITE_GATES_PARTIAL` |
| **GATE CORRENTE** | `D0025_W_VPS_SCHEMA_ENGINE` — separate authorized gate: isolated Ajv/ajv-formats on n8n surface via `CONTROL_PLANE_AJV_NODE_MODULES` |
| **NEXT** | Schema engine install gate, then Header Auth credential binding, then WF61 inactive import. Parent WF40 wiring remains later gate. |
| **CONTROL-PLANE TOOLS LIVE** | **MOUNTED** · `/files/handoff-runtime/control-plane` · read-only · six canonical tools readable |
| **CONTROL-PLANE HOST PATH** | `/root/local-files/handoff-runtime/control-plane` · snapshot `db7879e0...` (not updated in mount gate) |
| **LITELLM LIVE** | **DEPLOYED** · `litellm-primary` · running · unchanged · host published ports **0** |
| **N8N LIVE** | **recreated** · `root-n8n-1` · n8n **2.19.5** · image ID unchanged · loopback **127.0.0.1:5678** |
| **N8N COMPOSE** | mount line applied · `root_n8n_data` + `root_default` preserved |
| **PRIMARY CYCLE RUNNER** | **LIVE PATH** · `/files/handoff-runtime/control-plane/tools/run-litellm-primary-cycle.mjs` |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** · **not imported** |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **SCHEMA ENGINE** | **NOT_AVAILABLE LIVE** on VPS n8n surface (next gate) |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- Canonical control-plane tools are mounted read-only into n8n; schema engine resolution still required for packet schema gate on VPS surface.
- No credential/OAuth/LiteLLM config/WF61 import authorized without separate gates.
- OpenClaw/WF60 unchanged. Qwen deferred. TeamViewer continuity preserved.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Mount apply evidence: `reports/architecture/d0025_control_plane_mount_apply.md`
- Mount apply authorization: issue #31 comment `5452861879`
- Mount preflight: `reports/architecture/d0025_control_plane_mount_readonly_preflight.md`
- Checkout evidence: `reports/architecture/d0025_vps_control_plane_checkout.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
