# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — VPS schema engine PASS; next gates: Header Auth credential, WF61 import; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `MOUNT_APPLY_PASS / SCHEMA_ENGINE_LIVE_READY / RUNTIME_PREREQUISITE_GATES_PARTIAL` |
| **GATE CORRENTE** | `D0025_W_HEADER_AUTH_CREDENTIAL` — separate authorized gate: bind n8n Header Auth credential for LiteLLM |
| **NEXT** | Header Auth credential binding, then WF61 inactive import. Parent WF40 wiring remains later gate. |
| **SCHEMA ENGINE LIVE** | **READY** · Ajv **8.20.0** · ajv-formats **3.0.1** · `/files/handoff-runtime/schema-engine/node_modules` · resolver `CONTROL_PLANE_AJV_NODE_MODULES` |
| **CONTROL-PLANE TOOLS LIVE** | **MOUNTED RO** · canonical validator + primary-cycle runner reachable on n8n surface |
| **LITELLM LIVE** | **DEPLOYED** · `litellm-primary` · running · unchanged |
| **N8N LIVE** | `root-n8n-1` · n8n **2.19.5** · **unrestarted** during schema-engine gate |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** · **not imported** |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- Schema engine is live on n8n surface via isolated shared path; no compose/n8n restart in this gate.
- Credential/OAuth/LiteLLM config/WF61 import remain separate authorized gates.
- OpenClaw/WF60 unchanged. Qwen deferred. TeamViewer continuity preserved.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Schema engine evidence: `reports/architecture/d0025_vps_schema_engine.md`
- Mount apply evidence: `reports/architecture/d0025_control_plane_mount_apply.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
