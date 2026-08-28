# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — control-plane read-only mount PASS; canonical tools live on n8n surface; VPS schema engine install released under standing AUTO-VIA; issue **#30** COMPLETE/CLOSED; Qwen deferred |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `LITELLM_DEPLOY_PASS / VPS_CHECKOUT_PASS / MOUNT_APPLY_PASS / VPS_SCHEMA_ENGINE_AUTO_VIA_RELEASED` |
| **GATE CORRENTE** | `D0025_W_VPS_SCHEMA_ENGINE_INSTALL` — bounded isolated Ajv/ajv-formats install only; no n8n restart/compose/credential/workflow/provider mutation |
| **NEXT** | Cursor installs exact Ajv 8.20.0 + ajv-formats 3.0.1 into isolated `/root/local-files/handoff-runtime/schema-engine`, reachable inside n8n as `/files/handoff-runtime/schema-engine`, then proves canonical packet validator PASS with `CONTROL_PLANE_AJV_NODE_MODULES`; next afterward: Header Auth credential binding + WF61 inactive import. |
| **CONTROL-PLANE TOOLS LIVE** | **MOUNTED** · `/files/handoff-runtime/control-plane` · read-only · six canonical tools readable |
| **CONTROL-PLANE HOST PATH** | `/root/local-files/handoff-runtime/control-plane` · snapshot `db7879e0...` (not updated in mount gate) |
| **LITELLM LIVE** | **DEPLOYED** · `litellm-primary` · running · unchanged · host published ports **0** |
| **N8N LIVE** | **recreated** · `root-n8n-1` · n8n **2.19.5** · image ID unchanged · loopback **127.0.0.1:5678** |
| **N8N COMPOSE** | control-plane RO mount applied · `root_n8n_data` + `root_default` preserved |
| **PRIMARY CYCLE RUNNER** | **LIVE PATH** · `/files/handoff-runtime/control-plane/tools/run-litellm-primary-cycle.mjs` |
| **WF61 ARTIFACT** | GPT-Web authored · structural validation **PASS** · **not imported** |
| **WF40 LIVE** | **PRESERVED** · active · `9ZMj2ACTKyDVhCue` |
| **WF60 LIVE** | **PRESERVED** · inactive · `d0015600-4001-8001-0001-0653506aabcd` |
| **SCHEMA ENGINE** | **INSTALL RELEASED** · target host `/root/local-files/handoff-runtime/schema-engine` · container path `/files/handoff-runtime/schema-engine/node_modules` · Ajv 8.20.0 + ajv-formats 3.0.1 |
| **AUTO-VIA DIRECTIVE** | issue #31 comment `5452941338` — no redundant authorization round-trip for bounded prompt/execution steps already inside approved architecture/scope; genuine boundary changes still gate |
| **EXPANDED PLANNER BUDGET** | GLM **0/10** · Codex **1/10 used / 9 remaining** · retry 0 |
| **WORK-PC REMOTE ACCESS SAFETY** | TEAMVIEWER_CONTINUITY_HARD_CONSTRAINT unchanged |

## Boundaries operative correnti

- Mount apply PASS accepted by GPT Web in issue #31 comment `5452963595`.
- Standing operator AUTO-VIA directive `5452941338` removes redundant authorization pauses for bounded reversible/non-secret work; it does not authorize genuine boundary changes such as credential/OAuth/billing/secret handling, destructive unproven actions, public exposure, network/TeamViewer mutation, non-equivalent fallback, or architecture/scope expansion.
- Current released pass may create only the isolated schema-engine directory/files under `/root/local-files/handoff-runtime/schema-engine` and install exactly Ajv 8.20.0 + ajv-formats 3.0.1 there. Existing `/root/local-files:/files` mount makes it visible inside n8n; no compose edit or n8n recreation is required in this pass.
- Schema install must not modify repo dependencies, n8n image/container packages, credential/OAuth state, LiteLLM config, workflows, OpenClaw, or network state. Provider calls/inference remain 0.
- Validate from inside the existing n8n container with `CONTROL_PLANE_AJV_NODE_MODULES=/files/handoff-runtime/schema-engine/node_modules` using the canonical validator and an existing local valid fixture only.
- After schema engine PASS, next bounded work is credential/pre-import preparation. Actual secret value entry or OAuth/credential mutation remains a genuine human/operator gate.
- OpenClaw/WF60 unchanged. WF61 unimported. Qwen deferred.

## Puntatori

- Active integration: issue **#31** (`D-0025-W`) — OPEN
- Standing AUTO-VIA directive: issue #31 comment `5452941338`
- Mount apply GPT-Web review: issue #31 comment `5452963595`
- Mount apply evidence: `reports/architecture/d0025_control_plane_mount_apply.md`
- Mount apply authorization: issue #31 comment `5452861879`
- Checkout evidence: `reports/architecture/d0025_vps_control_plane_checkout.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`
