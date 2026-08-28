# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — VPS schema engine PASS; next AUTO-VIA pass is read-only LiteLLM proxy-auth/config preflight before any credential mutation; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `MOUNT_APPLY_PASS / SCHEMA_ENGINE_LIVE_READY / AUTH_DESIGN_PREFLIGHT_PENDING` |
| **GATE CORRENTE** | `D0025_W_LITELLM_AUTH_DESIGN_READONLY_PREFLIGHT` — AUTO-VIA, no credential/config/workflow mutation |
| **NEXT** | Ground current `litellm-primary` launch/config/auth state and determine whether WF61 truly requires Header Auth. If authentication is unnecessary on the private-only runtime, GPT Web will author the credential-free WF61 delta; if a real shared secret/master key is required, stop only at that genuine credential gate. |
| **SCHEMA ENGINE LIVE** | **READY** · Ajv **8.20.0** · ajv-formats **3.0.1** · `/files/handoff-runtime/schema-engine/node_modules` · resolver `CONTROL_PLANE_AJV_NODE_MODULES` |
| **CONTROL-PLANE TOOLS LIVE** | **MOUNTED RO** · canonical validator + primary-cycle runner reachable on n8n surface |
| **LITELLM LIVE** | **DEPLOYED CREDENTIALLESS** · `litellm-primary` · running · private `root_default` · host published ports 0 |
| **N8N LIVE** | `root-n8n-1` · n8n **2.19.5** · control-plane mount RO · schema engine live |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** · **not imported** · currently contains `httpHeaderAuth` placeholder `CONTROL PLANE - LiteLLM Primary Header Auth` |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 |
| **STANDING AUTO-VIA DIRECTIVE** | issue #31 comment `5452941338`: do not ask operator to repeat authorization merely to generate Cursor prompts; genuine credential/auth, destructive, public-exposure, network/TeamViewer, architecture/scope gates remain real gates |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- Schema engine PASS is accepted by GPT Web; review comment `5453047517`.
- Before mutating any credential, LiteLLM config, OAuth state, or WF61, a read-only preflight must ground the current proxy authentication semantics and the exact runtime configuration surface.
- Current LiteLLM deployment is credentialless/private-only; WF61 still carries a Header Auth placeholder from the authored template. Do not assume that placeholder is necessary.
- The preflight may inspect container command, env NAMES only, mounts, private network, effective config paths, and non-secret LiteLLM auth settings; it must not print secrets or full env values.
- No provider/model call, inference, credential mutation, OAuth, LiteLLM restart/recreate, compose edit, n8n workflow mutation/import, OpenClaw mutation, public exposure, or WORK-PC network/TeamViewer mutation in the preflight.
- If the grounded design can remain credentialless while accessible only from the private Docker network, GPT Web may author an exact WF61 artifact patch removing `genericCredentialType/httpHeaderAuth` before import; Cursor cannot invent that change.
- If a LiteLLM master/shared secret is technically required, that is a genuine credential gate and must stop for secret-safe operator action rather than fabricating/dummying a credential.
- OpenClaw/WF60 unchanged. Qwen deferred.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Schema engine evidence: `reports/architecture/d0025_vps_schema_engine.md`
- GPT-Web schema review: issue #31 comment `5453047517`
- Standing AUTO-VIA directive: issue #31 comment `5452941338`
- WF61 artifact: `workflows/61-litellm-primary-remote-planner.template.json`
- Mount apply evidence: `reports/architecture/d0025_control_plane_mount_apply.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
